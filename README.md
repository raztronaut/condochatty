# CondoChatty

An AI-powered chatbot that helps users understand the Ontario Condominium Act through accurate, context-aware responses using RAG (Retrieval Augmented Generation) technology.

## Features

- 🤖 AI-powered chat interface for asking questions about the Ontario Condo Act
- 📚 Accurate responses with citations to specific sections and subsections
- 🔍 Context-aware responses using advanced RAG technology
- 📝 Clear formatting with markdown support, bullet points, and sections
- 🔗 Cross-references to related sections and parts
- 📖 Automatic extraction of legal definitions and amendments
- 🎯 Smart chunking and processing of PDF content
- 🔄 Efficient vector search with deduplication and relevance scoring
- 📊 Metadata extraction including parts, sections, subsections, and topics
- 🛡️ Error handling and graceful fallbacks

## Architecture

### PDF Processing Pipeline
1. **Document Loading**: Uses LangChain's PDFLoader for initial text extraction
2. **Text Processing**: Implements recursive character splitting with context preservation
3. **Metadata Extraction**: Identifies parts, sections, subsections, amendments, and related references
4. **Chunking Strategy**: Uses overlapping windows for context preservation
5. **Vector Storage**: Efficiently stores embeddings in Pinecone with metadata

### Chat System
1. **Query Processing**: Enhanced search queries with legal context
2. **Vector Search**: Semantic search with score-based filtering and deduplication
3. **Response Generation**: Context-aware responses using Cohere's chat model
4. **Citation System**: Automatic section and subsection citations
5. **Error Handling**: Graceful fallbacks for API failures and invalid queries

## Tech Stack

- **Frontend**:
  - Next.js 14 with App Router
  - React 18
  - TypeScript
  - TailwindCSS with plugins
  - Shadcn UI components
  - Radix UI primitives
  - React Hook Form
  - React Markdown

- **Backend**:
  - Next.js API routes
  - LangChain for document processing
  - Cohere for embeddings and chat
  - Pinecone for vector storage

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

4. Configure environment variables:
   ```env
   COHERE_API_KEY=your_cohere_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_index_name
   PINECONE_HOST=your_pinecone_host
   ```

5. Create a Pinecone index:
   - Dimensions: 1024 (for Cohere embed-english-v3.0 model)
   - Metric: Cosine similarity
   - Pod type: Starter or higher based on your needs

6. Place your Ontario Condo Act PDF:
   ```bash
   mkdir -p data
   # Copy your condo-act.pdf to data/condo-act.pdf
   ```

7. Process and index the PDF:
   ```bash
   # Reset existing index (if needed)
   npm run reset-index
   
   # Process and index the PDF
   npm run index-pdf
   
   # Or use the combined reindex command
   npm run reindex
   ```

8. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open http://localhost:3000 in your browser
2. Type your question about the Ontario Condo Act in the chat input
3. Get accurate, context-aware responses with citations

Example queries:
- "What are the main responsibilities of a condo board?"
- "What are the requirements for a condo reserve fund?"
- "How are condo fees determined?"
- "What does PART VI cover?"
- "Explain Section 72.1"
- "What are the requirements in Section 73(2)(b)?"
- "What amendments have been made to Section 17?"
- "Define 'declarant' according to the Act"

## Development Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production version
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run process-pdf`: Process PDF without indexing
- `npm run create-index`: Create Pinecone index
- `npm run reset-index`: Reset existing index
- `npm run index-pdf`: Index processed PDF
- `npm run reindex`: Combined reset and index command

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
