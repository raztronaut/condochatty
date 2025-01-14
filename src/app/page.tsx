import { Chat } from '@/components/features/chat/chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-gray-50 to-white p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Condo Act Assistant
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Ask questions about the Ontario Condominium Act
          </p>
        </div>
        
        <Chat />
      </div>
    </main>
  );
}
