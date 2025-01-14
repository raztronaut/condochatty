import { Amendment, ChunkMetadata, DocumentChunk } from './types.js';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { v4 as uuidv4 } from 'uuid';

export class CondoActProcessor {
  private static readonly PART_PATTERN = /(?:PART|Part)\s+[IVX]+\s*[-–]?\s*([^\n]+)?/g;
  private static readonly SECTION_PATTERN = /(?:\d+\.?\s*(?:\(\d+\))?)\s*[-–]?\s*([^\n]+)?/g;
  private static readonly SUBSECTION_PATTERN = /\((\d+)\)(\([a-z]\))?/g;
  private static readonly AMENDMENT_PATTERN = /\[Amendment:\s*([^\]]+)\]/g;
  private static readonly NOTE_PATTERN = /Note:\s*([^\n]+)/g;
  private static readonly PAGE_NUMBER_PATTERN = /Page (\d+)/g;

  static async processPDF(filePath: string): Promise<DocumentChunk[]> {
    console.log('Loading PDF file:', filePath);
    const loader = new PDFLoader(filePath, {
      splitPages: true,
    });
    
    console.log('Extracting text from PDF...');
    const pages = await loader.load();
    console.log('Extracted', pages.length, 'pages');
    
    const processedChunks: DocumentChunk[] = [];
    
    // Process each page
    for (const page of pages) {
      console.log('Processing page content:', page.pageContent.substring(0, 100), '...');
      const pageNumber = this.extractPageNumber(page.pageContent);
      console.log('Page number:', pageNumber);
      
      const cleanText = this.cleanPageText(page.pageContent);
      console.log('Cleaned text:', cleanText.substring(0, 100), '...');
      
      // Split text into smaller chunks for processing
      const textSplitter = new RecursiveCharacterTextSplitter({
        separators: ["\n", ". ", ", "],
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const textChunks = await textSplitter.createDocuments([cleanText]);
      console.log('Split text into', textChunks.length, 'chunks');

      for (const chunk of textChunks) {
        const chunkMetadata: ChunkMetadata = {
          pageNumber,
          chunkType: 'section',
          type: 'requirement',
          part: '',
          partTitle: '',
          section: '',
          sectionTitle: '',
          relatedSections: [],
          definitions: {},
          amendments: [],
          topics: [],
          isAmendment: false,
          notes: [],
        };

        // Try to identify part information
        const partMatch = chunk.pageContent.match(this.PART_PATTERN);
        if (partMatch) {
          chunkMetadata.part = partMatch[0];
          chunkMetadata.partTitle = partMatch[1] || '';
          chunkMetadata.chunkType = 'part';
        }

        // Try to identify section information
        const sectionMatch = chunk.pageContent.match(this.SECTION_PATTERN);
        if (sectionMatch) {
          chunkMetadata.section = sectionMatch[0];
          chunkMetadata.sectionTitle = sectionMatch[1] || '';
          chunkMetadata.chunkType = 'section';
        }

        // Extract other metadata
        chunkMetadata.amendments = this.extractAmendments(chunk.pageContent);
        chunkMetadata.notes = this.extractNotes(chunk.pageContent);
        chunkMetadata.definitions = await this.extractDefinitions(chunk.pageContent);

        // Create chunk
        processedChunks.push({
          id: uuidv4(),
          text: chunk.pageContent,
          metadata: chunkMetadata,
          embedding: [],
        });
      }
    }

    console.log('Total chunks generated:', processedChunks.length);
    return processedChunks;
  }

  private static cleanPageText(text: string): string {
    // Remove headers and footers
    text = text.replace(/Page \d+/g, '');
    text = text.replace(/Condominium Act, \d+/g, '');
    
    // Clean up whitespace and line breaks
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n+/g, ' ');
    text = text.trim();
    
    return text;
  }

  private static extractPageNumber(text: string): number {
    const match = text.match(this.PAGE_NUMBER_PATTERN);
    return match ? parseInt(match[1], 10) : 0;
  }

  private static extractSubsections(text: string): Array<{ id: string; text: string }> {
    const subsections: Array<{ id: string; text: string }> = [];
    const matches = text.matchAll(/(\(\d+\)(\([a-z]\))?)(.*?)(?=\(\d+\)|\s*$)/gs);
    
    for (const match of matches) {
      subsections.push({
        id: match[1],
        text: match[0].trim(),
      });
    }

    return subsections;
  }

  static async processText(text: string, pageNumber: number): Promise<DocumentChunk[]> {
    console.log('Processing text for page', pageNumber);
    const processedChunks: DocumentChunk[] = [];
    
    // First split by PARTS with overlap
    const partSplitter = new RecursiveCharacterTextSplitter({
      separators: ["PART"],
      chunkSize: 2000,
      chunkOverlap: 200,
    });

    console.log('Splitting text into parts...');
    const partChunks = await partSplitter.createDocuments([text]);
    console.log('Found', partChunks.length, 'part chunks');

    for (const partChunk of partChunks) {
      const partMatch = partChunk.pageContent.match(this.PART_PATTERN);
      if (!partMatch) {
        console.log('No part match found in chunk:', partChunk.pageContent.substring(0, 100), '...');
        continue;
      }

      const [part, partTitle] = [partMatch[0], partMatch[1]];
      console.log('Processing part:', part, 'with title:', partTitle);
      
      // Split by sections with overlap
      const sectionSplitter = new RecursiveCharacterTextSplitter({
        separators: ["Section"],
        chunkSize: 1000,
        chunkOverlap: 100,
      });

      console.log('Splitting part into sections...');
      const sectionChunks = await sectionSplitter.createDocuments([partChunk.pageContent]);
      console.log('Found', sectionChunks.length, 'section chunks');

      for (const sectionChunk of sectionChunks) {
        const sectionMatch = sectionChunk.pageContent.match(this.SECTION_PATTERN);
        if (!sectionMatch) {
          console.log('No section match found in chunk:', sectionChunk.pageContent.substring(0, 100), '...');
          continue;
        }

        const [section, , sectionTitle] = sectionMatch;
        console.log('Processing section:', section, 'with title:', sectionTitle);
        
        // Extract metadata
        const amendments = this.extractAmendments(sectionChunk.pageContent);
        const notes = this.extractNotes(sectionChunk.pageContent);
        const definitions = await this.extractDefinitions(sectionChunk.pageContent);
        const relatedSections = await this.findRelatedSections(sectionChunk.pageContent);
        const topics = await this.extractTopics(sectionChunk.pageContent);
        const type = this.determineType(sectionChunk.pageContent);

        // Create section-level chunk
        processedChunks.push({
          id: `${part}-${section}`,
          text: sectionChunk.pageContent,
          metadata: {
            part,
            partTitle,
            section,
            sectionTitle,
            pageNumber,
            chunkType: 'section',
            type,
            relatedSections,
            definitions,
            amendments,
            topics,
            isAmendment: false,
            notes,
          },
          embedding: [],
        });

        // Process subsections with overlap
        const subsections = this.extractSubsections(sectionChunk.pageContent);
        console.log('Found', subsections.length, 'subsections');
        
        for (const subsection of subsections) {
          processedChunks.push({
            id: `${part}-${section}-${subsection.id}`,
            text: subsection.text,
            metadata: {
              part,
              partTitle,
              section,
              sectionTitle,
              subsection: subsection.id,
              pageNumber,
              chunkType: 'subsection',
              type,
              relatedSections,
              definitions,
              amendments,
              topics,
              isAmendment: false,
              notes,
            },
            embedding: [],
          });
        }

        // Create separate chunks for amendments if they exist
        if (amendments.length > 0) {
          console.log('Found', amendments.length, 'amendments');
        }
        
        for (const amendment of amendments || []) {
          processedChunks.push({
            id: `${part}-${section}-amendment-${amendment.date || 'unknown'}`,
            text: amendment.description || amendment.text,
            metadata: {
              part,
              partTitle,
              section,
              type: 'amendment',
              date: amendment.date,
            },
          });
        }
      }
    }

    return processedChunks;
  }

  private static extractAmendments(text: string): Amendment[] {
    const amendments: Amendment[] = [];
    const matches = text.matchAll(this.AMENDMENT_PATTERN);
    
    for (const match of matches) {
      const [date, description] = match[1].split(':').map(s => s.trim());
      amendments.push({
        section: '', // Will be filled by the caller
        text: description || '', // Use description as text if available
        date,
        description
      });
    }

    return amendments;
  }

  private static extractNotes(text: string): string[] {
    const notes: string[] = [];
    const matches = text.matchAll(this.NOTE_PATTERN);
    
    for (const match of matches) {
      notes.push(match[1].trim());
    }

    return notes;
  }

  private static async extractDefinitions(text: string): Promise<Record<string, { term: string; definition: string; context?: string }>> {
    const definitions: Record<string, { term: string; definition: string; context?: string }> = {};
    const definitionMatches = text.matchAll(/"([^"]+)"\s+means\s+([^.]+)/g);

    for (const match of definitionMatches) {
      const term = match[1].trim();
      const definition = match[2].trim();
      const context = text.substring(Math.max(0, match.index! - 100), match.index! + match[0].length + 100);
      
      definitions[term] = {
        term,
        definition,
        context,
      };
    }

    return definitions;
  }

  private static async findRelatedSections(text: string): Promise<Array<{ section: string; context: string }>> {
    const relatedSections: Array<{ section: string; context: string }> = [];
    const sectionRefs = text.matchAll(/Section \d+(\.\d+)?/g);

    for (const match of sectionRefs) {
      const section = match[0];
      const context = text.substring(Math.max(0, match.index! - 50), match.index! + match[0].length + 50);
      
      relatedSections.push({
        section,
        context: context.trim(),
      });
    }

    return relatedSections;
  }

  private static async extractTopics(text: string): Promise<string[]> {
    // Simple keyword extraction based on frequency and importance
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'have', 'were'].includes(word));
    
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private static determineType(text: string): ChunkMetadata['type'] {
    if (text.includes('means') || text.includes('definition')) {
      return 'definition';
    }
    if (text.includes('shall') || text.includes('must')) {
      return 'requirement';
    }
    if (text.includes('may') || text.includes('procedure')) {
      return 'procedure';
    }
    if (text.includes('offence') || text.includes('liable')) {
      return 'penalty';
    }
    if (text.includes('[Amendment:')) {
      return 'amendment';
    }
    if (text.includes('Note:')) {
      return 'note';
    }
    return 'requirement';
  }

  private static postProcessChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    // Create overlapping windows for context preservation
    const windowSize = 3;
    const processedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const windowStart = Math.max(0, i - Math.floor(windowSize / 2));
      const windowEnd = Math.min(chunks.length - 1, i + Math.floor(windowSize / 2));
      
      const contextualText = chunks
        .slice(windowStart, windowEnd + 1)
        .map(c => c.text)
        .join('\n\n');

      processedChunks.push({
        ...chunk,
        text: contextualText,
      });
    }

    return processedChunks;
  }
} 