import { NextRequest, NextResponse } from 'next/server';
import { VectorStore } from '@/lib/vector-store';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const vectorStore = new VectorStore(
      process.env.PINECONE_INDEX_NAME!,
      process.env.COHERE_API_KEY!,
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_HOST!
    );

    await vectorStore.initialize();
    const results = await vectorStore.query(query);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
} 