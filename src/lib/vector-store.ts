import { DocumentChunk, SearchResult } from './types.js';
import { Document } from '@langchain/core/documents';
import { Pinecone } from '@pinecone-database/pinecone';
import { CohereEmbeddings } from '@langchain/cohere';

export class VectorStore {
  private client: Pinecone;
  private index: any;
  private embeddings: CohereEmbeddings;
  private readonly MAX_BATCH_SIZE = 100;

  constructor(
    private readonly indexName: string,
    private readonly cohereApiKey: string,
    private readonly pineconeApiKey: string,
    private readonly pineconeEnvironment: string,
    private readonly pineconeHost: string
  ) {
    // Initialize Pinecone client
    this.client = new Pinecone({ apiKey: pineconeApiKey });
    
    this.embeddings = new CohereEmbeddings({
      apiKey: cohereApiKey,
      model: 'embed-english-v3.0'
    });
  }

  async initialize() {
    try {
      console.log('Connecting to Pinecone index:', {
        indexName: this.indexName,
        environment: this.pineconeEnvironment,
        host: this.pineconeHost
      });
      
      // Get the index directly
      this.index = this.client.index(this.indexName);
      
      // Test the connection
      const stats = await this.index.describeIndexStats();
      console.log('Successfully connected to Pinecone:', stats);
    } catch (error: any) {
      console.error('Failed to initialize Pinecone:', {
        error: error.message,
        cause: error.cause?.message,
        host: this.pineconeHost,
        environment: this.pineconeEnvironment
      });
      throw error;
    }
  }

  private cleanMetadata(metadata: Record<string, any>): Record<string, string | number | boolean | string[]> {
    const cleaned: Record<string, string | number | boolean | string[]> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip empty objects or null values
      if (value === null || (typeof value === 'object' && Object.keys(value).length === 0)) {
        continue;
      }
      
      // Convert value to string if it's not one of the allowed types
      if (typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.map(item => String(item));
      } else if (['string', 'number', 'boolean'].includes(typeof value)) {
        cleaned[key] = value;
      } else {
        cleaned[key] = String(value);
      }
    }
    
    return cleaned;
  }

  private async processChunk(documents: DocumentChunk[]) {
    try {
      const vectors = await Promise.all(
        documents.map(async (doc) => {
          const [embedding] = await this.embeddings.embedDocuments([doc.text]);
          return {
            id: doc.id,
            values: embedding,
            metadata: {
              text: doc.text,
              ...this.cleanMetadata(doc.metadata || {})
            },
          };
        })
      );
      
      await this.index.upsert(vectors);
      return true;
    } catch (error) {
      console.error('Failed to process chunk:', error);
      return false;
    }
  }

  async upsertDocuments(documents: DocumentChunk[]) {
    console.log(`Starting to upsert ${documents.length} documents...`);
    
    // Split documents into chunks of MAX_BATCH_SIZE
    const chunks: DocumentChunk[][] = [];
    for (let i = 0; i < documents.length; i += this.MAX_BATCH_SIZE) {
      chunks.push(documents.slice(i, i + this.MAX_BATCH_SIZE));
    }

    console.log(`Processing ${chunks.length} chunks in parallel...`);

    // Process chunks in parallel with a concurrency limit
    const concurrencyLimit = 3; // Limit parallel requests to avoid overwhelming the API
    const results = [];
    
    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batch = chunks.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(chunk => this.processChunk(chunk))
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r).length;
    const failureCount = results.filter(r => !r).length;
    
    console.log(`Upsert complete. Success: ${successCount}, Failed: ${failureCount}`);
    
    if (failureCount > 0) {
      console.warn(`Failed to process ${failureCount} chunks`);
    }
  }

  async search(query: string, topK: number = 5): Promise<Document[]> {
    const results = await this.query(query, topK);
    
    return results.map(result => new Document({
      pageContent: result.text,
      metadata: {
        ...result.metadata,
        score: result.score
      }
    }));
  }

  async query(query: string, topK: number = 5): Promise<SearchResult[]> {
    const [queryEmbedding] = await this.embeddings.embedDocuments([query]);
    
    const results = await this.index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    return results.matches.map((match: any) => ({
      text: match.metadata?.text || '',
      score: match.score || 0,
      metadata: {
        section: match.metadata?.section,
        subsection: match.metadata?.subsection,
        title: match.metadata?.title
      }
    }));
  }
} 