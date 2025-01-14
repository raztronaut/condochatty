import { CondoActProcessor } from '../lib/pdf-processor';
import { VectorStore } from '../lib/vector-store';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function indexPDF() {
  try {
    console.log('Initializing vector store...');
    const vectorStore = new VectorStore(
      process.env.PINECONE_INDEX_NAME!,
      process.env.COHERE_API_KEY!,
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_HOST!
    );

    await vectorStore.initialize();

    console.log('Processing PDF...');
    const pdfPath = path.join(process.cwd(), 'data', 'condo-act.pdf');
    const chunks = await CondoActProcessor.processPDF(pdfPath);
    
    console.log(`Processed ${chunks.length} chunks from PDF`);

    console.log('Upserting documents to vector store...');
    await vectorStore.upsertDocuments(chunks);

    console.log('Successfully indexed PDF');
  } catch (error) {
    console.error('Failed to index PDF:', error);
    process.exit(1);
  }
}

indexPDF(); 