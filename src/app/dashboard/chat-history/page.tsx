'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Eye, Clock, User, Calendar, Search, Filter, ExternalLink, Shield } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

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

export default function AdminChatHistory() {
  const [accessibleChats, setAccessibleChats] = useState<AdminAccessibleChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AdminAccessibleChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpiry, setFilterExpiry] = useState<string>('all');

  useEffect(() => {
    fetchAccessibleChats();
  }, []);

  const fetchAccessibleChats = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/chat-access/accessible');
      const data = await response.json();
      
      if (data.success) {
        setAccessibleChats(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat data chat');
      }
    } catch (error: any) {
      console.error('Error fetching accessible chats:', error);
      alert(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (chatId: number) => {
    try {
      setLoadingMessages(true);
      const response = await authenticatedFetch(`/api/admin/chat-access/messages/${chatId}`);
      const data = await response.json();
      
      if (data.success) {
        setChatMessages(data.data.messages || []);
      } else {
        throw new Error(data.error || 'Gagal memuat pesan chat');
      }
    } catch (error: any) {
      console.error('Error fetching chat messages:', error);
      alert(error.message || 'Terjadi kesalahan saat memuat pesan');
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleChatSelect = (chat: AdminAccessibleChat) => {
    setSelectedChat(chat);
    fetchChatMessages(chat.id);
  };

  // Filter chats based on search and expiry
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

  const isAccessExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-500" />
            Chat History Admin
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat riwayat chat yang telah diberikan akses oleh customer
          </p>
        </div>
        
        <button
          onClick={fetchAccessibleChats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari customer, provider, atau layanan..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <select
                value={filterExpiry}
                onChange={(e) => setFilterExpiry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Semua Chat</option>
                <option value="active">Akses Aktif</option>
                <option value="expired">Akses Expired</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredChats.map((chat) => {
                  const expired = isAccessExpired(chat.accessExpiresAt);
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${expired ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <h3 className="font-medium text-gray-900 truncate">
                              {chat.customer.fullName}
                            </h3>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mb-1">
                            Provider: {chat.provider.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate mb-2">
                            {chat.service.name} • Order #{chat.orderId}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MessageCircle className="w-3 h-3" />
                            <span>{chat.messageCount} pesan</span>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-1">
                            Akses {expired ? 'berakhir' : 'berakhir'}: {new Date(chat.accessExpiresAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-center">
                  {searchTerm || filterExpiry !== 'all' 
                    ? 'Tidak ada chat ditemukan dengan filter ini'
                    : 'Tidak ada chat yang dapat diakses'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-500" />
                      {selectedChat.customer.fullName}
                    </h2>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <p>Provider: {selectedChat.provider.fullName}</p>
                      <p>Layanan: {selectedChat.service.name}</p>
                      <p>Order: #{selectedChat.orderId}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isAccessExpired(selectedChat.accessExpiresAt)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      <Eye className="w-3 h-3 mr-1" />
                      {isAccessExpired(selectedChat.accessExpiresAt) ? 'Akses Expired' : 'Akses Aktif'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Berakhir: {new Date(selectedChat.accessExpiresAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : chatMessages.length > 0 ? (
                  <div className="space-y-4">
                    {chatMessages.map((message) => {
                      const isCustomer = message.sender.role.roleName === 'customer';
                      
                      return (
                        <div key={message.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isCustomer 
                              ? 'bg-gray-100 text-gray-900' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {message.sender.fullName}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                isCustomer 
                                  ? 'bg-gray-200 text-gray-600' 
                                  : 'bg-blue-400 text-blue-100'
                              }`}>
                                {isCustomer ? 'Customer' : 'Provider'}
                              </span>
                            </div>
                            <p className="text-sm">{message.messageContent}</p>
                            <p className={`text-xs mt-1 ${
                              isCustomer ? 'text-gray-500' : 'text-blue-100'
                            }`}>
                              {new Date(message.sentAt).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-4 text-gray-300" />
                    <p>Tidak ada pesan ditemukan</p>
                  </div>
                )}
              </div>

              {/* Access Warning */}
              {isAccessExpired(selectedChat.accessExpiresAt) && (
                <div className="p-4 bg-red-50 border-t border-red-200">
                  <div className="flex items-center text-red-800 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Akses untuk melihat chat ini telah berakhir pada {new Date(selectedChat.accessExpiresAt).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Chat untuk Dilihat</h3>
              <p className="text-center">
                Pilih salah satu chat dari daftar di sebelah kiri untuk melihat riwayat percakapan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Chat</p>
              <p className="text-lg font-semibold text-gray-900">
                {accessibleChats.length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Akses Aktif</p>
              <p className="text-lg font-semibold text-gray-900">
                {accessibleChats.filter(chat => !isAccessExpired(chat.accessExpiresAt)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Akses Expired</p>
              <p className="text-lg font-semibold text-gray-900">
                {accessibleChats.filter(chat => isAccessExpired(chat.accessExpiresAt)).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Unique Customers</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Set(accessibleChats.map(chat => chat.customer.id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}