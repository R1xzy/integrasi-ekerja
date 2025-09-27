'use client';

import { useState, useEffect } from 'react';
import { getAuthData, AuthUser } from '@/lib/auth-client';
import { authenticatedFetch } from '@/lib/auth-client';
import Link from 'next/link';
import Avatar from '@/components/Avatar'; // ✨ 1. Impor Avatar
import { MessageSquare, Users } from 'lucide-react';

// ✨ 2. Perbarui Tipe Data
interface Conversation {
  id: number;
  conversationTitle: string;
  participants: { 
    userId: number; 
    fullName: string; 
    profilePictureUrl: string | null; 
    email: string; // Tambahkan email
  }[];
  lastMessage: { 
    messageContent: string; 
    sentAt: string;
    senderId: number; // Tambahkan senderId
  } | null;
  unreadCount: number;
}

const ChatListPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getAuthData());
  }, []);

  useEffect(() => {
    if (!user) return; 
    
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const res = await authenticatedFetch('/api/chat/rooms');
        const data = await res.json();
        if (res.ok) {
            // Urutkan percakapan berdasarkan tanggal pesan terakhir
            data.data.sort((a: Conversation, b: Conversation) => {
                if (!a.lastMessage) return 1;
                if (!b.lastMessage) return -1;
                return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime();
            });
            setConversations(data.data);
        }
      } catch (error) {
        console.error('Gagal memuat percakapan:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Memuat percakapan...</div>;
  if (!user) return <div className="flex items-center justify-center h-screen">Mengarahkan...</div>;

  const loggedInUserId = parseInt(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        <header className="px-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Percakapan</h1>
        </header>
        <main>
          {conversations.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {conversations.map((convo) => {
                const otherParticipant = convo.participants.find(p => p.userId !== loggedInUserId);
                const lastMessageText = convo.lastMessage 
                  ? `${convo.lastMessage.senderId === loggedInUserId ? 'Anda: ' : ''}${convo.lastMessage.messageContent}`
                  : 'Belum ada pesan.';
                
                return (
                  <Link href={`/chat/${convo.id}`} key={convo.id} className="block hover:bg-gray-50 transition-colors duration-150">
                    <div className="p-4 flex items-center border-b border-gray-200 last:border-b-0">
                      
                      {/* ✨ 3. Ganti <Image> dengan <Avatar> */}
                      <Avatar 
                        src={otherParticipant?.profilePictureUrl}
                        email={otherParticipant?.email || ''}
                        alt={otherParticipant?.fullName || 'Avatar'}
                        size={48} // 48px (w-12 h-12)
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 overflow-hidden ml-4">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-gray-800 truncate">{otherParticipant?.fullName || 'Pengguna'}</p>
                          {convo.lastMessage && (
                            <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                               {new Date(convo.lastMessage.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                           {/* ✨ 4. Tampilkan pesan terakhir yang sudah benar */}
                          <p className="text-sm text-gray-600 truncate">{lastMessageText}</p>
                          {convo.unreadCount > 0 && <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-1">{convo.unreadCount}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-lg shadow-sm border">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400"/>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Anda belum memiliki percakapan.</h3>
                <p className="mt-1 text-sm text-gray-500">Mulai percakapan dengan penyedia jasa melalui halaman profil mereka.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatListPage;