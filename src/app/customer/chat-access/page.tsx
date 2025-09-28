'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Shield, Clock, Check, X, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';
import Avatar from '@/components/Avatar'; // ✨ 1. Impor komponen Avatar

// ✨ 2. Perbarui Tipe Data untuk menyertakan info Avatar
interface ChatAccessRequest {
  id: number;
  orderId: number;
  requestedBy: {
    id: number;
    fullName: string;
    profilePictureUrl: string | null; // Diperlukan untuk Avatar
    email: string;  
  };
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  accessExpiresAt: string | null;
  requestedAt: string;
  respondedAt: string | null;
  order: {
    id: number;
    provider: {
      id: number;
      fullName: string;
    };
    service: {
      name: string;
    };
  };
}

interface ChatConversation {
  id: number;
  orderId: number;
  isAdminAccessible: boolean;
  accessExpiresAt: string | null;
  order: {
    id: number;
    provider: {
      id: number;
      fullName: string;
    };
    service: {
      name: string;
    };
  };
}

export default function CustomerChatAccess() {
  const [accessRequests, setAccessRequests] = useState<ChatAccessRequest[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // ✨ 3. Perbaiki fetchData agar lebih tahan banting
  const fetchData = async () => {
    try {
      setLoading(true);

      const fetchJson = async (url: string) => {
        const response = await authenticatedFetch(url);
        if (!response.ok) {
          throw new Error(`Gagal memuat dari ${url}: Status ${response.status}`);
        } 
        // Cek jika body kosong sebelum parsing JSON
        const text = await response.text();
        return text ? JSON.parse(text) : { success: true, data: [] }; // Return default jika kosong
      };

      // Fetch access requests
      const requestsData = await fetchJson('/api/customer/chat-access/requests');
      if (requestsData.success) {
        setAccessRequests(requestsData.data);
      }

      // Fetch conversations
      const conversationsData = await fetchJson('/api/customer/chat-access/conversations');
      if (conversationsData.success) {
        setConversations(conversationsData.data);
      }
      
    } catch (error: any) {
      console.error('Error fetching chat access data:', error);
      // alert(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId: number, action: 'approve' | 'deny', accessHours?: number) => {
    try {
      setProcessingRequest(requestId);
      
      const response = await authenticatedFetch('/api/customer/chat-access/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          response: action === 'approve' ? 'APPROVED' : 'DENIED',
          accessHours: action === 'approve' ? (accessHours || 24) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchData(); // Refresh data
        const actionText = action === 'approve' ? 'disetujui' : 'ditolak';
        alert(`Permintaan akses berhasil ${actionText}`);
      } else {
        throw new Error(data.error || 'Gagal memproses permintaan');
      }
    } catch (error: any) {
      console.error('Error processing request:', error);
      alert(error.message || 'Terjadi kesalahan saat memproses permintaan');
    } finally {
      setProcessingRequest(null);
    }
  };

  const toggleConversationAccess = async (conversationId: number, grantAccess: boolean) => {
    try {
      const response = await authenticatedFetch(`/api/customer/chat-access/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantAccess,
          accessHours: grantAccess ? 24 : 0
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchData(); // Refresh data
        const actionText = grantAccess ? 'diberikan' : 'dicabut';
        alert(`Akses admin berhasil ${actionText}`);
      } else {
        throw new Error(data.error || 'Gagal mengubah akses');
      }
    } catch (error: any) {
      console.error('Error toggling access:', error);
      alert(error.message || 'Terjadi kesalahan saat mengubah akses');
    }
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
    <div className="p-6 space-y-6 bg-gray-50">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="w-6 h-6 mr-2 text-blue-500" />
          Akses Chat History Admin
        </h1>
        <p className="text-gray-600 mt-1">
          Kelola akses admin untuk melihat riwayat percakapan Anda
        </p>
      </div>

      {/* Pending Requests */}
      {accessRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-500" />
              Permintaan Akses Menunggu ({accessRequests.filter(r => r.status === 'PENDING').length})
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {accessRequests.filter(r => r.status === 'PENDING').map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                     <Avatar
                        src={request.requestedBy.profilePictureUrl}
                        email={request.requestedBy.email}
                        alt={request.requestedBy.fullName}
                        size={40}
                        className="flex-shrink-0"
                     />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <h3 className="font-medium text-gray-900">
                        Permintaan dari {request.requestedBy.fullName}
                      </h3>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Order:</strong> #{request.order.id} - {request.order.service.name}</p>
                      <p><strong>Provider:</strong> {request.order.provider.fullName}</p>
                      <p><strong>Alasan:</strong> {request.reason}</p>
                      <p><strong>Diminta pada:</strong> {new Date(request.requestedAt).toLocaleDateString('id-ID')}</p>
                    </div>

                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-xs text-yellow-800">
                          <strong>Catatan:</strong> Memberikan akses akan memungkinkan admin melihat 
                          seluruh riwayat percakapan Anda dengan provider untuk order ini. 
                          Akses akan berlaku selama 24 jam dan dapat Anda cabut sewaktu-waktu.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleRequestResponse(request.id, 'approve')}
                    disabled={processingRequest === request.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {processingRequest === request.id ? 'Memproses...' : 'Setujui'}
                  </button>
                  
                  <button
                    onClick={() => handleRequestResponse(request.id, 'deny')}
                    disabled={processingRequest === request.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Tolak
                  </button>
                </div>
                </div>
              </div>
            ))}
            
            {accessRequests.filter(r => r.status === 'PENDING').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Tidak ada permintaan akses yang menunggu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Conversations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            Percakapan Anda ({conversations.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Atur akses admin untuk setiap percakapan
          </p>
        </div>
        
        <div className="p-6">
          {conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const hasActiveAccess = conversation.isAdminAccessible && 
                  conversation.accessExpiresAt && 
                  new Date(conversation.accessExpiresAt) > new Date();

                return (
                  <div key={conversation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${hasActiveAccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <h3 className="font-medium text-gray-900">
                            Order #{conversation.order.id} - {conversation.order.service.name}
                          </h3>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Provider:</strong> {conversation.order.provider.fullName}</p>
                          {hasActiveAccess && conversation.accessExpiresAt && (
                            <p><strong>Akses berakhir:</strong> {new Date(conversation.accessExpiresAt).toLocaleString('id-ID')}</p>
                          )}
                        </div>

                        <div className="mt-2">
                          {hasActiveAccess ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Eye className="w-3 h-3 mr-1" />
                              Admin dapat mengakses
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Admin tidak dapat mengakses
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {hasActiveAccess ? (
                          <button
                            onClick={() => toggleConversationAccess(conversation.id, false)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
                          >
                            <EyeOff className="w-3 h-3" />
                            Cabut Akses
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleConversationAccess(conversation.id, true)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Berikan Akses
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Anda belum memiliki percakapan</p>
            </div>
          )}
        </div>
      </div>

      {/* Request History */}
      {accessRequests.filter(r => r.status !== 'PENDING').length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Riwayat Permintaan
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {accessRequests.filter(r => r.status !== 'PENDING').map((request) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Order #{request.order.id} - {request.order.service.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.requestedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status === 'APPROVED' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Disetujui
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Ditolak
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}