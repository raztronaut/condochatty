import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className }: MessageContentProps) {
  return (
    <ReactMarkdown
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        'prose-headings:mb-2 prose-headings:mt-4 prose-h2:text-lg prose-h2:font-semibold',
        'prose-p:my-2 prose-p:leading-relaxed',
        'prose-li:my-0.5',
        'prose-strong:font-semibold',
        'prose-p:text-inherit prose-headings:text-inherit prose-strong:text-inherit',
        'prose-ul:text-inherit prose-li:text-inherit',
        className
      )}
      components={{
        h2: ({ children }) => (
          <h2 className="border-b border-gray-200 dark:border-gray-700 pb-1 text-lg font-semibold">{children}</h2>
        ),
        ul: ({ children }) => (
          <ul className="my-2 list-none space-y-2 pl-0">{children}</ul>
        ),
        li: ({ children }) => (
          <li className="flex items-start">
            <span className="mr-2 text-inherit">•</span>
            <span className="text-inherit">{children}</span>
          </li>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
} 