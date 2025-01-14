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
          content: "I couldn't find specific information about condo board responsibilities. Could you try asking about a specific aspect like maintenance, finances, or governance?",
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
        message: "Based on the Ontario Condominium Act, what are the specific responsibilities and duties of the condominium board mentioned in these sections? Please organize them by category and cite the relevant sections.",
        preamble: `You are a knowledgeable assistant specializing in the Ontario Condominium Act. 
Provide clear, factual answers about condominium board responsibilities based on the following context from the Act:

${context}

Format your response as follows:
1. Start with "## [Category Name]:" for each major category (e.g., ## Financial Responsibilities:)
2. Under each category, use "- **[Responsibility Title]:**" followed by the description
3. Include section references in parentheses at the end of each point
4. Keep each point concise and clear
5. Use proper spacing between categories and points
6. Only include information from the provided context
7. Focus on practical responsibilities`,
        chatHistory: this.convertToCohereHistory(history),
        temperature: 0.1,
        maxTokens: 1000,
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