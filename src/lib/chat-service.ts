import { Document } from "@langchain/core/documents";
import { Message, ChatResponse } from './types';
import { VectorStore } from './vector-store';
import { CohereClient } from 'cohere-ai';

export class ChatService {
  private vectorStore: VectorStore;
  private cohere: CohereClient;

  constructor(vectorStore: VectorStore) {
    this.vectorStore = vectorStore;
    this.cohere = new CohereClient({
      token: process.env.COHERE_API_KEY!,
    });
  }

  private async getChatHistory(history: Message[]): Promise<string> {
    return history
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');
  }

  // Convert our messages to Cohere's format
  private convertToCohereHistory(history: Message[]) {
    return history.map(msg => ({
      role: msg.role === 'user' ? 'USER' : 'CHATBOT',
      message: msg.content
    })) as { role: 'USER' | 'CHATBOT'; message: string }[];
  }

  async chat(message: string, history: Message[] = []): Promise<ChatResponse> {
    try {
      // Get relevant documents with an enhanced search query
      const searchQuery = `${message.trim()} corporation board directors property maintenance insurance budget financial`;
      console.log('Search query:', searchQuery);
      
      const relevantDocs = await this.vectorStore.search(
        searchQuery,
        15
      );
      
      console.log('Found docs:', relevantDocs.length);
      
      // Filter and sort results with a lower threshold
      const filteredDocs = relevantDocs
        .filter(doc => {
          const score = doc.metadata?.score || 0;
          const text = doc.pageContent.toLowerCase();
          // Filter out condominium authority sections and ensure relevance
          return score > 0.3 && 
                 !text.includes('condominium authority') &&
                 (text.includes('board') || 
                  text.includes('corporation') ||
                  text.includes('directors'));
        })
        .sort((a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0))
        .slice(0, 5);

      console.log('Filtered docs:', filteredDocs.length);

      if (!filteredDocs.length) {
        return {
          role: 'assistant',
          content: "I couldn't find specific information about that in the Condo Act. Could you try rephrasing your question or asking about a specific aspect like maintenance, finances, or governance?",
          createdAt: new Date(),
        };
      }

      // Format context without exposing raw scores
      const context = filteredDocs
        .map((doc: Document) => {
          const section = doc.metadata?.section ? `Section ${doc.metadata.section}` : '';
          const subsection = doc.metadata?.subsection ? ` (${doc.metadata.subsection})` : '';
          const title = doc.metadata?.title ? `: ${doc.metadata.title}` : '';
          
          return `${section}${subsection}${title}\n${doc.pageContent.trim()}`;
        })
        .join('\n\n');

      console.log('Context:', context);

      // Generate response using Cohere
      const response = await this.cohere.chat({
        message: message,
        preamble: `You are a knowledgeable assistant specializing in the Ontario Condominium Act. Your role is to provide accurate, clear, and practical information based on the Act's provisions.

Context from the Act:
${context}

Guidelines for your response:
1. Answer directly based on the user's question
2. Only use information from the provided context
3. Always cite specific sections when making statements (e.g., "According to Section 17(1)")
4. Use clear, simple language while maintaining legal accuracy
5. Organize information logically with headers (##) for different topics
6. If relevant, explain practical implications
7. If the context doesn't fully answer the question, acknowledge this
8. Format lists and key points with bullet points (-)
9. Highlight important terms in bold (**term**)

Remember: Your goal is to help users understand their rights and obligations under the Condo Act.`,
        chatHistory: this.convertToCohereHistory(history),
        temperature: 0.2,  // Slightly increased for better natural language while maintaining accuracy
        maxTokens: 1500,  // Increased to allow for more detailed responses
        connectors: [],
      });

      if (!response.text || response.text.length < 50) {
        console.error('ChatService: Invalid response from Cohere:', response);
        throw new Error('Invalid response from AI service');
      }

      // Return formatted response without exposing internal metadata
      return {
        role: 'assistant',
        content: response.text.trim(),
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('ChatService: Error in chat:', error);
      throw error;
    }
  }
} 