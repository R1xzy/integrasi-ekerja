'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  MessageCircle, 
  Eye, 
  Clock, 
  User, 
  Shield, 
  PlusCircle, 
  X, 
  Search, 
  ChevronDown, 
  Loader2 
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

// --- Interface (Tidak ada perubahan) ---
interface AdminAccessibleChat {
  id: number;
  orderId: number;
  customer: {
    id: number;
    fullName: string;
    email: string;
  };
  provider: {
    id: number;
    fullName: string;
  };
  service: {
    name: string;
  };
  accessExpiresAt: string;
  grantedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

interface ChatMessage {
  id: number;
  senderId: number;
  messageContent: string;
  sentAt: string;
  sender: {
    id: number;
    fullName: string;
    role: {
      roleName: string;
    };
  };
}

interface Conversation {
  id: number;
  orderId: number | null;
  createdAt: string;
  customer: {
      id: number;
      fullName: string;
  } | null;
  provider: {
      id: number;
      fullName: string;
  } | null;
  order: {
    id: number;
    service: {
      name: string;
    }
  } | null;
}

// --- Komponen Modal (Tidak ada perubahan) ---
const RequestAccessModal = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: { conversationId: number; reason: string }) => void; }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllConversations = async () => {
      setLoading(true);
      try {
        const response = await authenticatedFetch(`/api/admin/conversations?q=${searchTerm}`);
        const data = await response.json();
        if (data.success) {
          setConversations(data.data);
        } else {
          console.error("Gagal memuat percakapan:", data.error);
          setConversations([]);
        }
      } catch (error) {
        console.error("Gagal memuat percakapan:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const handler = setTimeout(() => {
        fetchAllConversations();
    }, 500);

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleToggle = (id: number) => {
    setExpandedId(currentId => (currentId === id ? null : id));
    setReason('');
  };

  const handleSubmit = async (conversationId: number) => {
    setIsSubmitting(true);
    await onSubmit({ conversationId, reason });
    setIsSubmitting(false);
    setExpandedId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style={{ height: 'clamp(400px, 80vh, 700px)' }}>
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Pilih Percakapan untuk Direquest</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b flex-shrink-0">
            <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama customer atau provider..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3">Memuat percakapan...</span>
                </div>
            ) : conversations.length > 0 ? (
                <div className="space-y-2">
                    {conversations.map((conv) => (
                        <div key={conv.id} className="border rounded-lg overflow-hidden transition-shadow hover:shadow-md">
                            <button onClick={() => handleToggle(conv.id)} className="w-full flex justify-between items-center text-left p-3 hover:bg-gray-50 focus:outline-none">
                                <div>
                                    <p className="font-semibold text-gray-800">
                                      {conv.order?.service.name || 'Percakapan Umum'}
                                      {conv.orderId && <span className="text-gray-500 font-normal"> (Order #{conv.orderId})</span>}
                                    </p>
                                    <p className="text-sm text-gray-600">{conv.customer?.fullName || 'N/A'} ↔ {conv.provider?.fullName || 'N/A'}</p>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expandedId === conv.id ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedId === conv.id && (
                                <div className="p-4 border-t bg-gray-50/50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Permintaan Akses</label>
                                    <textarea
                                        rows={3}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Tuliskan alasan Anda memerlukan akses ke percakapan ini..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="text-right mt-3">
                                        <button
                                            onClick={() => handleSubmit(conv.id)}
                                            disabled={isSubmitting}
                                            className="px-5 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Permintaan'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    Tidak ada percakapan ditemukan.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
const ChatViewModal = ({ 
    chatDetail, 
    messages, 
    loadingMessages, 
    onClose 
}: { 
    chatDetail: AdminAccessibleChat; 
    messages: ChatMessage[]; 
    loadingMessages: boolean; 
    onClose: () => void;
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll ke pesan terakhir
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isAccessExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ height: 'clamp(500px, 90vh, 800px)' }}>
                {/* Header Modal */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Percakapan Order #{chatDetail.orderId}
                            </h2>
                            <div className="text-sm text-gray-600 mt-1">
                                <p><span className='font-medium'>Customer:</span> {chatDetail.customer.fullName}</p>
                                <p><span className='font-medium'>Provider:</span> {chatDetail.provider.fullName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            isAccessExpired(chatDetail.accessExpiresAt)
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                                <Eye className="w-3 h-3 mr-1.5" />
                                {isAccessExpired(chatDetail.accessExpiresAt) ? 'Akses Expired' : 'Akses Aktif'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                                Berakhir: {new Date(chatDetail.accessExpiresAt).toLocaleString('id-ID')}
                            </p>
                        </div>
                        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body Modal (Area Pesan) */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : messages.length > 0 ? (
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const isCustomer = message.sender.role.roleName === 'customer';
                                return (
                                    <div key={message.id} className={`flex gap-3 ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-md px-4 py-3 rounded-xl ${
                                            isCustomer ? 'bg-white text-gray-800 shadow-sm' : 'bg-blue-500 text-white'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold">{message.sender.fullName}</span>
                                                <span className={`text-xs capitalize px-1.5 py-0.5 rounded-full ${
                                                    isCustomer ? 'bg-gray-200 text-gray-600' : 'bg-blue-400 text-blue-100'
                                                }`}>
                                                    {message.sender.role.roleName}
                                                </span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{message.messageContent}</p>
                                            <p className={`text-xs mt-2 text-right ${isCustomer ? 'text-gray-500' : 'text-blue-200'}`}>
                                                {new Date(message.sentAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                            <p>Tidak ada pesan ditemukan</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ♻️ --- Komponen Utama Halaman (Struktur Diubah) --- ♻️
export default function AdminChatHistory() {
  const [accessibleChats, setAccessibleChats] = useState<AdminAccessibleChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AdminAccessibleChat | null>(null); // Sekarang digunakan untuk membuka modal
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpiry, setFilterExpiry] = useState<string>('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    fetchAccessibleChats();
  }, []);

  const fetchAccessibleChats = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/chat-access/accessible');
      const data = await response.json();
      if (data.success) {
        setAccessibleChats(data.data);
      } else { throw new Error(data.error || 'Gagal memuat data chat'); }
    } catch (error: any) { alert(error.message); } 
    finally { setLoading(false); }
  };

  const fetchChatMessages = async (chatId: number) => {
    setLoadingMessages(true);
    setChatMessages([]); // Kosongkan pesan lama saat memuat yang baru
    try {
      const response = await authenticatedFetch(`/api/admin/chat-access/messages/${chatId}`);
      const data = await response.json();
      if (data.success) {
        setChatMessages(data.data.messages || []);
      } else { throw new Error(data.error || 'Gagal memuat pesan chat'); }
    } catch (error: any) { alert(error.message); } 
    finally { setLoadingMessages(false); }
  };

  const handleRequestAccess = async ({ conversationId, reason }: { conversationId: number; reason: string }) => {
    try {
      const response = await authenticatedFetch('/api/admin/chat-access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, reason }),
      });
      const result = await response.json();
      if (!response.ok) { throw new Error(result.error || 'Gagal mengirim permintaan.'); }
      alert('Permintaan akses berhasil dikirim!');
      setIsRequestModalOpen(false);
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  // Fungsi untuk membuka modal chat
  const handleChatSelect = (chat: AdminAccessibleChat) => {
    setSelectedChat(chat);
    fetchChatMessages(chat.id);
  };

  // Fungsi untuk menutup modal chat
  const handleCloseChatModal = () => {
    setSelectedChat(null);
    setChatMessages([]);
  };

  const filteredChats = accessibleChats.filter(chat => {
    const matchesSearch = searchTerm === '' || 
      chat.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.provider.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.service.name.toLowerCase().includes(searchTerm.toLowerCase());
    const now = new Date();
    const expiresAt = new Date(chat.accessExpiresAt);
    const matchesExpiry = filterExpiry === 'all' || 
      (filterExpiry === 'active' && expiresAt > now) ||
      (filterExpiry === 'expired' && expiresAt <= now);
    return matchesSearch && matchesExpiry;
  });

  const isAccessExpired = (expiresAt: string) => new Date(expiresAt) <= new Date();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {isRequestModalOpen && <RequestAccessModal onClose={() => setIsRequestModalOpen(false)} onSubmit={handleRequestAccess} />}
      
      {/* Render modal chat jika ada chat yang dipilih */}
      {selectedChat && (
        <ChatViewModal 
            chatDetail={selectedChat}
            messages={chatMessages}
            loadingMessages={loadingMessages}
            onClose={handleCloseChatModal}
        />
      )}

      {/* Header Halaman */}
      <div className="flex items-center justify-between mb-6">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-blue-500" />
                  Chat History Admin
              </h1>
              <p className="text-gray-600 mt-1">
                  Lihat riwayat chat dan ajukan permintaan akses baru
              </p>
          </div>
          <div className="flex items-center gap-4">
              <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                  <PlusCircle className="w-5 h-5" />
                  Request Akses
              </button>
              <button
                  onClick={fetchAccessibleChats}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                  Refresh
              </button>
          </div>
      </div>
      
      {/* Konten Utama: Filter dan Daftar Chat */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari customer, provider, layanan..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <select
                    value={filterExpiry}
                    onChange={(e) => setFilterExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                    <option value="all">Semua Status Akses</option>
                    <option value="active">Akses Aktif</option>
                    <option value="expired">Akses Expired</option>
                </select>
            </div>
        </div>

        {/* Daftar Chat */}
        <div>
            {loading ? (
                <div className="text-center p-10">Memuat data...</div>
            ) : filteredChats.length > 0 ? (
                <div className="divide-y divide-gray-200">
                    {filteredChats.map((chat) => {
                        const expired = isAccessExpired(chat.accessExpiresAt);
                        return (
                            <button
                                key={chat.id}
                                onClick={() => handleChatSelect(chat)}
                                className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${expired ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                            <h3 className="font-semibold text-gray-900 truncate">{chat.customer.fullName}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">Provider: {chat.provider.fullName}</p>
                                        <p className="text-xs text-gray-500 truncate mt-1">{chat.service.name} • Order #{chat.orderId}</p>
                                    </div>
                                    <div className="text-right text-xs text-gray-500 ml-2 flex-shrink-0">
                                        <p className="flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> {chat.messageCount}</p>
                                        <p className={`mt-1 font-medium ${expired ? 'text-red-600' : 'text-green-600'}`}>{expired ? 'Berakhir' : 'Aktif'}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 p-10">
                    <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-center text-sm">Tidak ada chat ditemukan.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
