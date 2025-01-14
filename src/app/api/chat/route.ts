import { NextRequest } from 'next/server';
import { VectorStore } from '@/lib/vector-store';
import { ChatService } from '@/lib/chat-service';
import { Message } from '@/lib/types';

// Validate environment variables
const requiredEnvVars = {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY ?? '',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT ?? '',
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME ?? '',
  COHERE_API_KEY: process.env.COHERE_API_KEY ?? '',
  PINECONE_HOST: process.env.PINECONE_HOST ?? '',
} as const;

// Check for required environment variables (excluding host which is optional)
['PINECONE_API_KEY', 'PINECONE_ENVIRONMENT', 'PINECONE_INDEX_NAME', 'COHERE_API_KEY'].forEach((key) => {
  if (!requiredEnvVars[key as keyof typeof requiredEnvVars]) {
    throw new Error(`Missing ${key}`);
  }
});

export async function POST(req: NextRequest) {
  try {
    console.log('Received chat request');
    const body = await req.json();
    console.log('Request body:', body);
    
    if (!body.messages || !Array.isArray(body.messages)) {
      console.error('Invalid messages format:', body);
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { messages } = body;
    console.log('Processing messages:', messages);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || !lastMessage.content) {
      console.error('No message content:', lastMessage);
      return new Response(JSON.stringify({ error: 'No message provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Initializing vector store...');
    // Initialize vector store
    const vectorStore = new VectorStore(
      requiredEnvVars.PINECONE_INDEX_NAME,
      requiredEnvVars.COHERE_API_KEY,
      requiredEnvVars.PINECONE_API_KEY,
      requiredEnvVars.PINECONE_ENVIRONMENT,
      requiredEnvVars.PINECONE_HOST
    );

    // Initialize chat service
    const chatService = new ChatService(vectorStore);

    console.log('Initializing vector store connection...');
    try {
      await vectorStore.initialize();
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }

    // Get chat history excluding the last message
    const chatHistory = messages.slice(0, -1);
    console.log('Chat history:', chatHistory);

    // Get response from chat service
    console.log('Getting response from chat service...');
    const response = await chatService.chat(lastMessage.content, chatHistory);
    console.log('Chat service response:', response);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 