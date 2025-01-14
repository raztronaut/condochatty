import { Chat } from '@/components/features/chat/chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-white p-8">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Condo Act Assistant
          </h1>
          <p className="text-lg text-gray-600">
            Ask questions about the Ontario Condominium Act
          </p>
        </div>
        
        <Chat />
      </div>
    </main>
  );
}
