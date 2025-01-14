import { CondoActProcessor } from '../src/lib/pdf-processor.js';
import { VectorStore } from '../src/lib/vector-store.js';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const pdfPath = path.join(process.cwd(), 'data', 'condo-act.pdf');
    
    console.log('Processing PDF...');
    const chunks = await CondoActProcessor.processPDF(pdfPath);
    console.log(`Generated ${chunks.length} chunks`);

    console.log('Initializing vector store...');
    const vectorStore = new VectorStore(
      process.env.PINECONE_INDEX_NAME!,
      process.env.COHERE_API_KEY!,
      process.env.PINECONE_API_KEY!,
      process.env.PINECONE_ENVIRONMENT!,
      process.env.PINECONE_HOST!
    );
    await vectorStore.initialize();

    console.log('Upserting documents...');
    await vectorStore.upsertDocuments(chunks);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 