declare module 'langchain/document_loaders/fs/pdf' {
  export class PDFLoader {
    constructor(filePath: string, options?: {
      splitPages?: boolean;
      pdfjs?: () => Promise<any>;
    });
    load(): Promise<{ pageContent: string }[]>;
  }
}

declare module 'langchain/text_splitter' {
  export class RecursiveCharacterTextSplitter {
    constructor(options: {
      separators: string[];
      chunkSize: number;
      chunkOverlap: number;
    });
    createDocuments(texts: string[]): Promise<{ pageContent: string }[]>;
  }
}

declare module 'langchain/keywords' {
  export class KeywordsExtractor {
    extractKeywords(text: string): Promise<string[]>;
  }
} 