'use client';

import { useState, useEffect } from 'react';
import { getAuthData, AuthUser } from '@/lib/auth-client'; // -> Impor yang benar
import { authenticatedFetch } from '@/lib/auth-client';
import Image from 'next/image';
import Link from 'next/link';

interface Conversation {
  id: number;
  conversationTitle: string;
  participants: { userId: number; fullName: string; profilePictureUrl: string | null; }[];
  lastMessage: { messageContent: string; sentAt: string; } | null;
  unreadCount: number;
}

const ChatListPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null); // -> State untuk user

  useEffect(() => {
    setUser(getAuthData());
  }, []);

  useEffect(() => {
    if (!user) return; // Jalankan hanya jika user sudah ada
    
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await authenticatedFetch('/api/chat/rooms');
        const data = await res.json();
        if (res.ok) setConversations(data.data);
      } catch (error) {
        console.error('Gagal memuat percakapan:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user]); // Tambahkan user sebagai dependency

  if (isLoading) return <div className="flex items-center justify-center h-screen">Memuat percakapan...</div>;
  if (!user) return <div className="flex items-center justify-center h-screen">Mengarahkan...</div>;

  const loggedInUserId = parseInt(user.id);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto py-8">
        <header className="px-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Percakapan Anda</h1>
        </header>
        <main>
          {conversations.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md">
              {conversations.map((convo) => {
                const otherParticipant = convo.participants.find(p => p.userId !== loggedInUserId);
                return (
                  <Link href={`/chat/${convo.id}`} key={convo.id} className="block hover:bg-gray-50 transition-colors duration-150">
                    <div className="p-4 flex items-center border-b last:border-b-0">
                      <Image src={otherParticipant?.profilePictureUrl || '/default-avatar.png'} alt="avatar" width={48} height={48} className="w-12 h-12 rounded-full mr-4"/>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between">
                            <p className="font-semibold text-gray-900 truncate">{otherParticipant?.fullName}</p>
                            {convo.lastMessage && <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{new Date(convo.lastMessage.sentAt).toLocaleDateString('id-ID')}</p>}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-gray-600 truncate">{convo.lastMessage?.messageContent || 'Belum ada pesan.'}</p>
                            {convo.unreadCount > 0 && <span className="bg-green-500 text-white text-xs font-bold rounded-full px-2 py-1">{convo.unreadCount}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 bg-white rounded-lg shadow-md">
                <p className="text-gray-500">Anda belum memiliki percakapan.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatListPage;