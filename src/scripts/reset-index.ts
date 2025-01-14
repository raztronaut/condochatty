import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

async function resetIndex() {
  try {
    console.log('Initializing Pinecone client...');
    const client = new Pinecone({ 
      apiKey: process.env.PINECONE_API_KEY! 
    });

    console.log('Getting index...');
    const index = client.index(process.env.PINECONE_INDEX_NAME!);

    console.log('Deleting all vectors...');
    await index.deleteAll();

    console.log('Successfully reset index');
  } catch (error) {
    console.error('Failed to reset index:', error);
    process.exit(1);
  }
}

resetIndex(); 