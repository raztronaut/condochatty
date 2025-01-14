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
  console.log('Chat component rendering');

  const { messages, isLoading, error, sendMessage, clearMessages, retry } = useChat();
  const [input, setInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Chat component mounted');
    // Debug check for useChat hook values
    console.log('useChat values:', { messages, isLoading, error });
  }, [messages, isLoading, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('FORM SUBMIT TRIGGERED');
    e.preventDefault();
    setSubmitError(null);
    console.log('Form submitted with input:', input);
    
    if (input.trim()) {
      try {
        console.log('Calling sendMessage with:', input);
        await sendMessage(input);
        setInput('');
      } catch (error) {
        console.error('Error in handleSubmit:', error);
        setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
      }
    }
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  // If there's an error from useChat hook
  if (error) {
    console.error('useChat error:', error);
  }

  return (
    <Card className="w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/bot-avatar.svg" alt="AI Assistant" />
            <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold">Condo Act Assistant</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          title="Clear chat"
          className="h-8 w-8 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="h-[600px] space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : ""
            )}
          >
            {message.role === 'assistant' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="/bot-avatar.svg" alt="AI Assistant" />
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
            )}
            
            <div className={cn(
              "flex flex-col space-y-2",
              message.role === 'user' ? "items-end" : "",
              "max-w-[80%]"
            )}>
              <div className={cn(
                "rounded-lg px-4 py-2 text-sm",
                message.role === 'user'
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted shadow-sm"
              )}>
                <MessageContent content={message.content} />
              </div>
              
              {message.context && (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="font-medium">Sources:</div>
                  {message.context.map((ctx, idx) => (
                    <div 
                      key={idx} 
                      className="rounded-sm bg-muted/50 p-2 transition-colors"
                    >
                      <div className="font-medium">Score: {(ctx.score * 100).toFixed(1)}%</div>
                      <div className="text-foreground/80">{ctx.text}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {message.error && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retry}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
      
      <CardFooter className="border-t p-4">
        <form 
          onSubmit={handleSubmit}
          className="flex w-full gap-2"
        >
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the Condo Act..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </Button>
        </form>
        {(error || submitError) && (
          <div className="mt-2 text-sm text-destructive">
            {error || submitError}
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 