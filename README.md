# CondoChatty

An AI-powered chatbot that helps users understand the Canadian Condo Act through accurate, context-aware responses using RAG (Retrieval Augmented Generation) technology.

## Features

- 🤖 AI-powered chat interface for asking questions about the Condo Act
- 📚 Accurate responses with citations to specific sections
- 🔍 Context-aware responses using RAG technology
- 📝 Clear formatting with bullet points and sections
- 🔗 References to related sections
- 📖 Definitions for legal terms

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- TailwindCSS
- Cohere for embeddings and chat
- Pinecone for vector storage
- LangChain for PDF processing

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/condochatty.git
   cd condochatty
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

4. Create a Pinecone index with 1536 dimensions (for Cohere embeddings).

5. Place your Condo Act PDF in the `data` directory:
   ```bash
   mkdir data
   # Copy your condo-act.pdf to data/condo-act.pdf
   ```

6. Process and index the PDF:
   ```bash
   npm run process-pdf
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open http://localhost:3000 in your browser
2. Type your question about the Condo Act in the chat input
3. Get accurate, context-aware responses with citations

Example queries:
- "What are the main responsibilities of a condo board?"
- "What are the requirements for a condo reserve fund?"
- "How are condo fees determined?"
- "What does PART VI cover?"
- "Explain Section 72.1"
- "Explain Section 73(2)(b)"

## Environment Variables

- `COHERE_API_KEY`: Your Cohere API key
- `PINECONE_API_KEY`: Your Pinecone API key
- `PINECONE_ENVIRONMENT`: Your Pinecone environment
- `PINECONE_INDEX_NAME`: Your Pinecone index name

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
