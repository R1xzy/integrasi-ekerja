'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

interface StartChatButtonProps {
  participantId: number;
  orderId?: number;
  buttonText?: string;
  className?: string;
}

export const StartChatButton = ({
  participantId,
  orderId,
  buttonText = "Mulai Chat",
  className,
}: StartChatButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      // API kita akan mencari chat yang ada atau membuat yang baru
      const response = await authenticatedFetch('/api/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({
          participantUserId: participantId,
          orderId: orderId,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memulai percakapan.');
      }
      
      // Ambil ID percakapan dari respons API
      const conversationId = result.data.id;
      
      // Arahkan pengguna langsung ke halaman percakapan
      router.push(`/chat/${conversationId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      console.error('Error starting chat:', errorMessage);
      alert(`Gagal memulai percakapan: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleStartChat} 
      disabled={isLoading} 
      className={`inline-flex items-center justify-center px-4 py-2 border font-bold border-transparent text-sm font-medium rounded-md shadow-sm text-blue-700 bg-gray-100 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors ${className} w-full border-blue-400`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Membuka...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4 p-2 " />
          {buttonText}
        </>
      )}
    </button>
  );
};