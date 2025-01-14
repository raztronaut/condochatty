import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const response = await fetch('https://api.pinecone.io/indexes', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.PINECONE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: process.env.PINECONE_INDEX_NAME,
      dimension: 1024,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: process.env.PINECONE_ENVIRONMENT
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create index: ${JSON.stringify(error)}`);
  }

  console.log('Index created successfully!');
}

main().catch(console.error); 