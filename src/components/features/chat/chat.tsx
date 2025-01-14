'use client';

import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trash2, RotateCcw, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageContent } from './message-content';

interface Context {
  text: string;
  score: number;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  context?: Context[];
  error?: string;
}

export function Chat() {
  const { messages, isLoading, error, sendMessage, clearMessages, retry } = useChat();
  const [input, setInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (input.trim()) {
      try {
        await sendMessage(input);
        setInput('');
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
      }
    }
  };

  if (!mounted) return null;

  return (
    <Card className="relative overflow-hidden rounded-xl border bg-card shadow-lg dark:bg-gray-900/50 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-white/50 dark:bg-gray-900/50 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/bot-avatar.svg" alt="AI Assistant" />
            <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20">AI</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold tracking-tight dark:text-white">Condo Act Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          title="Clear chat"
          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </Button>
      </CardHeader>
      
      <CardContent className="h-[600px] space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50/50 dark:from-gray-900/30 p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full gap-3",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/bot-avatar.svg" alt="AI Assistant" />
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20">AI</AvatarFallback>
              </Avatar>
            )}
            
            <div className={cn(
              "flex flex-col space-y-2",
              message.role === 'user' ? "items-end" : "items-start",
              "max-w-[85%]"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-2.5 text-sm",
                message.role === 'user'
                  ? "bg-primary text-white [&_*]:text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10"
              )}>
                <MessageContent content={message.content} />
              </div>
              
              {message.context && (
                <div className="w-full space-y-2 text-xs">
                  <div className="font-medium text-gray-500 dark:text-gray-400">Sources:</div>
                  {message.context.map((ctx, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-lg bg-white/50 dark:bg-gray-800/50 p-3 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 transition-colors"
                    >
                      <div className="mb-1 font-medium text-gray-600 dark:text-gray-300">Score: {(ctx.score * 100).toFixed(1)}%</div>
                      <div className="text-gray-600 dark:text-gray-300">{ctx.text}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {message.error && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retry}
                  className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-300"
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      
      <CardFooter className="border-t bg-white/50 dark:bg-gray-900/50 dark:border-gray-800 p-4">
        <form 
          onSubmit={handleSubmit}
          className="flex w-full items-end gap-2"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the Condo Act..."
            disabled={isLoading}
            className="flex-1 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-primary dark:text-white"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 dark:hover:bg-primary/80"
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </form>
        {(error || submitError) && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400">
            {error || submitError}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 