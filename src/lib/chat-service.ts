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
      role: msg.role === 'user' ? 'USER' : 'ASSISTANT',
      message: msg.content
    })) as Array<{ role: 'USER' | 'ASSISTANT'; message: string }>;
  }

  async chat(message: string, history: Message[] = []): Promise<ChatResponse> {
    try {
      console.log('ChatService: Starting chat with message:', message);
      console.log('ChatService: History:', history);

      // Get relevant documents
      console.log('ChatService: Searching for relevant documents...');
      const searchQuery = `${message} responsibilities duties requirements obligations powers authority board`;
      const relevantDocs = await this.vectorStore.search(
        searchQuery,
        15
      );
      
      // Filter out very low-scoring results but keep more relevant ones
      const filteredDocs = relevantDocs.filter(
        doc => (doc.metadata?.score || 0) > 0.3
      ).slice(0, 5);

      if (!filteredDocs.length) {
        console.log('ChatService: No relevant documents found');
        return {
          role: 'assistant',
          content: "I apologize, but I couldn't find specific information about that in the Condo Act. Could you try rephrasing your question or being more specific about what aspect of condo board responsibilities you're interested in?",
          createdAt: new Date(),
        };
      }

      // Format context for the chat
      console.log('ChatService: Formatting context...');
      const context = filteredDocs
        .sort((a, b) => (b.metadata?.score || 0) - (a.metadata?.score || 0))
        .map((doc: Document) => {
          const section = doc.metadata?.section || 'Unknown';
          const subsection = doc.metadata?.subsection ? ` (${doc.metadata.subsection})` : '';
          const title = doc.metadata?.title ? ` - ${doc.metadata.title}` : '';
          const score = doc.metadata?.score ? ` [Relevance: ${Math.round(doc.metadata.score * 100)}%]` : '';
          
          return `Section ${section}${subsection}${title}${score}:\n${doc.pageContent.trim()}`;
        })
        .join('\n\n');
      console.log('ChatService: Formatted context:', context);

      console.log('ChatService: Getting chat history...');
      const chatHistory = await this.getChatHistory(history);
      console.log('ChatService: Chat history:', chatHistory);

      // Generate response using Cohere
      console.log('ChatService: Generating response with Cohere...');
      const response = await this.cohere.chat({
        message,
        preamble: `You are a knowledgeable assistant specializing in the Ontario Condominium Act. 
        Provide clear, structured answers following these rules:

        1. Start with a brief 1-2 sentence overview
        2. List key responsibilities/requirements using bullet points
        3. Each point must:
           - Focus on one specific duty or power
           - Include the exact section number in [brackets]
           - Explain in plain, practical language
           - Avoid legal jargon
        4. Limit to 3-5 most important points
        5. End with a note if there are additional responsibilities not covered
        
        When discussing board responsibilities:
        - Focus on practical day-to-day duties
        - Emphasize financial and operational responsibilities
        - Highlight reporting requirements
        - Include oversight and management duties
        
        Current context from the Condo Act:
        ${context}`,
        chatHistory: this.convertToCohereHistory(history),
        temperature: 0.1,
        maxTokens: 400,
        connectors: [{ id: "web-search" }],
      });
      console.log('ChatService: Cohere response:', response);

      return {
        role: 'assistant',
        content: response.text,
        createdAt: new Date(),
        context: filteredDocs.map(doc => ({
          text: doc.pageContent,
          score: doc.metadata?.score || 0
        }))
      };
    } catch (error) {
      console.error('ChatService: Error in chat:', error);
      throw error;
    }
  }
} 