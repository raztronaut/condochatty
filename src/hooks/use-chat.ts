import { useState } from 'react';

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

export function useChat() {
  console.log('useChat hook initializing');

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) {
      console.log('Message empty or already loading');
      return;
    }
    console.log('Starting to send message:', content);
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      createdAt: new Date(),
    };

    try {
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      console.log('Making API request with messages:', [...messages, userMessage]);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error response:', errorData);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      
      if (!data || typeof data.content !== 'string') {
        console.error('Invalid API response format:', data);
        throw new Error('Invalid response format from server');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        role: 'assistant',
        createdAt: new Date(data.createdAt),
        context: data.context,
      };

      console.log('Created assistant message:', assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        createdAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const retry = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove the last error message if it exists
      setMessages(messages => messages.filter(m => !m.error));
      await sendMessage(lastUserMessage.content);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retry,
  };
} 