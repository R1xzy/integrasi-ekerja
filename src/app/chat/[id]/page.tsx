'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { authenticatedFetch } from '@/lib/auth-client';
import { getAuthData, AuthUser } from '@/lib/auth-client';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Avatar from '@/components/Avatar';

// Type Definitions
interface Message {
  id: number;
  messageContent: string;
  sentAt: string;
  senderId: number;
}
interface Participant {
    userId: number;
    fullName: string;
    profilePictureUrl: string | null;
    email: string;
}
interface Conversation {
    id: number;
    conversationTitle: string;
    participants: Participant[];
}

const ConversationPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const conversationId = params.id as string;

  // --- 1. SCROLLING LOGIC ---
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Effect to scroll down when messages change
  useEffect(() => {
    // Only auto-scroll if the user is near the bottom
    const container = chatContainerRef.current;
    if (container) {
        const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 150; // 150px threshold
        if (isScrolledToBottom) {
            scrollToBottom();
        }
    }
  }, [messages, scrollToBottom]);

  // --- 2. DATA FETCHING LOGIC ---

  // Effect to get the current logged-in user
  useEffect(() => {
    setUser(getAuthData());
  }, []);

  // Memoized function to fetch the latest messages
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await authenticatedFetch(`/api/chat/rooms/${conversationId}/messages`);
      if (!res.ok) {
        // Handle cases where conversation is not found or access is denied
        setMessages([]);
        return;
      }
      const data = await res.json();
      // The API returns messages and pagination info
      setMessages(data.data.messages || []); 
    } catch (error) {
      console.error("Gagal mengambil pesan:", error);
    }
  }, [conversationId]);


  // Effect for initial data load and setting up polling
  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchInitialDataAndStartPolling = async () => {
      setIsLoading(true);
      // Fetch conversation details (participants, title)
      try {
        const convoListRes = await authenticatedFetch(`/api/chat/rooms`);
        const convoListData = await convoListRes.json();
        if (convoListRes.ok) {
            const currentConvo = convoListData.data.find((c: any) => c.id === parseInt(conversationId));
            if (currentConvo) {
                setConversation(currentConvo);
            } else {
                 // If conversation not in the list, maybe it's new or there's an issue
                 console.warn("Conversation not found in user's list.");
            }
        }
      } catch (error) {
          console.error("Gagal mengambil info percakapan:", error);
      }
      
      // Initial message fetch
      await fetchMessages();
      setIsLoading(false);

      // Start polling for new messages
      const intervalId = setInterval(fetchMessages, 3000); // Poll every 3 seconds

      // Cleanup function to stop polling when component unmounts
      return () => clearInterval(intervalId);
    };

    fetchInitialDataAndStartPolling();

  }, [conversationId, user, fetchMessages]);

  // --- 3. SEND MESSAGE LOGIC ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    try {
      const res = await authenticatedFetch(`/api/chat/rooms/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ messageContent }),
      });
      
      if (!res.ok) {
        // If sending fails, restore the message to the input for the user to retry
        setNewMessage(messageContent);
        throw new Error('Gagal mengirim pesan.');
      }
      
      // On successful send, fetch the latest messages immediately to show the new message
      await fetchMessages();
      scrollToBottom(); // Force scroll to bottom after sending
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show a toast/alert to the user
    } finally {
      setIsSending(false);
    }
  };
  
  // --- 4. RENDER LOGIC ---

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin mr-2" /> Memuat percakapan...</div>;
  }
  
  if (!user || !conversation) {
    return <div className="flex justify-center items-center h-screen text-center p-4">
        <div>
            <p className="font-semibold text-lg">Percakapan tidak ditemukan</p>
            <p className="text-gray-600">Mungkin Anda tidak memiliki akses atau percakapan ini telah dihapus.</p>
            <Link href="/chat" className="text-green-600 hover:underline mt-4 inline-block">Kembali ke Inbox</Link>
        </div>
    </div>;
  }
  
  const loggedInUserId = parseInt(user.id); 
  const otherParticipant = conversation.participants.find(p => p.userId !== loggedInUserId);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-600">
      <header className="p-4 bg-white border-b border-gray-300 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/chat" className="p-2 rounded-full hover:bg-gray-100 mr-2"><ArrowLeft size={20} /></Link>
        <Avatar
            src={otherParticipant?.profilePictureUrl}
            email={otherParticipant?.email || ''}
            alt={otherParticipant?.fullName || 'Avatar'}
            size={40} // 40px (w-10 h-10)
        />
        <div>
            <h3 className="font-bold">{otherParticipant?.fullName || 'Pengguna'}</h3>
            <p className="text-sm text-gray-500">{conversation.conversationTitle}</p>
        </div>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
        {messages.length > 0 ? messages.map(msg => (
          <div key={msg.id} className={`flex mb-4 ${msg.senderId === loggedInUserId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-lg shadow-sm ${msg.senderId === loggedInUserId ? 'bg-green-600 text-white' : 'bg-white'}`}>
              <p className="whitespace-pre-wrap">{msg.messageContent}</p>
              <p className={`text-xs mt-1 text-right ${msg.senderId === loggedInUserId ? 'text-green-200' : 'text-gray-400'}`}>{new Date(msg.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        )) : (
            <div className="text-center text-gray-500 mt-8">
                <p>Belum ada pesan di percakapan ini.</p>
                <p>Mulai percakapan dengan mengirim pesan pertama Anda!</p>
            </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-white border-t sticky border-gray-300">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 border rounded-full py-2 px-4 focus:ring-green-500 focus:border-green-500" placeholder="Ketik pesan..."/>
          <button type="submit" className="bg-green-600 text-white rounded-full p-3 ml-4 hover:bg-green-700 disabled:opacity-50" disabled={!newMessage.trim() || isSending}>
              {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20}/>}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ConversationPage;