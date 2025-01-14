export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  context?: SearchResult[];
  error?: string;
}

export interface SearchResult {
  text: string;
  score: number;
  metadata?: {
    section?: string;
    subsection?: string;
    title?: string;
    part?: string;
    partTitle?: string;
    type?: string;
  };
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  createdAt: Date;
  context?: SearchResult[];
  error?: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface ChunkMetadata {
  section?: string;
  subsection?: string;
  title?: string;
  [key: string]: any;
}

export interface Amendment {
  section: string;
  subsection?: string;
  title?: string;
  text: string;
  date?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'USER' | 'ASSISTANT';
  message: string;
} 