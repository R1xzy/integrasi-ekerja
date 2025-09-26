'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

interface HiddenReview {
  id: number;
  customer: { fullName: string } | string;
  rating: number;
  comment: string;
  createdAt: string;
  is_show: boolean;
  order?: {
    service?: { name: string } | null;
    providerService?: { serviceTitle: string } | null;
  };
  provider?: {
    fullName: string;
  };
}

export default function HiddenReviewsPage() {
  const [hiddenReviews, setHiddenReviews] = useState<HiddenReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Fetch hidden reviews (is_show: false)
  const fetchHiddenReviews = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/reviews?isShow=false');
      const data = await response.json();
      
      if (data.success && data.data) {
        setHiddenReviews(data.data);
      }
    } catch (error) {
      console.error('Error fetching hidden reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show review (set is_show: true)
  const showReview = async (reviewId: number) => {
    try {
      setActionLoading(reviewId);
      const response = await authenticatedFetch(`/api/admin/reviews/${reviewId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_show: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Ulasan berhasil ditampilkan kembali!");
        fetchHiddenReviews(); // Refresh list
      } else {
        alert("Gagal menampilkan ulasan: " + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error showing review:', error);
      alert("Gagal menampilkan ulasan. Silakan coba lagi.");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete review permanently
  const deleteReview = async (reviewId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini secara permanen?")) {
      return;
    }

    try {
      setActionLoading(reviewId);
      const response = await authenticatedFetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Ulasan berhasil dihapus!");
        fetchHiddenReviews(); // Refresh list
      } else {
        alert("Gagal menghapus ulasan: " + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert("Gagal menghapus ulasan. Silakan coba lagi.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchHiddenReviews();
  }, []);

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ulasan Tersembunyi</h1>
          <p className="text-gray-600 mt-2">Kelola ulasan yang dilaporkan dan disembunyikan (REQ-F-7.5)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <EyeOff className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tersembunyi</p>
                <p className="text-2xl font-bold text-gray-900">{hiddenReviews.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dapat Ditampilkan</p>
                <p className="text-2xl font-bold text-gray-900">{hiddenReviews.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <button 
              onClick={fetchHiddenReviews}
              disabled={loading}
              className="flex items-center justify-center w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Hidden Reviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Ulasan Tersembunyi</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
                ))}
              </div>
            </div>
          ) : hiddenReviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {hiddenReviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {typeof review.customer === 'object' && review.customer?.fullName
                            ? review.customer.fullName
                            : typeof review.customer === 'string'
                              ? review.customer
                              : 'Anonymous'}
                        </h3>
                        <div className="ml-4 flex items-center">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2 bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                        "{review.comment}"
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <span>Provider: {review.provider?.fullName || 'N/A'}</span>
                        <span>
                          Layanan: {review.order?.providerService?.serviceTitle || 
                                   review.order?.service?.name || 
                                   'N/A'}
                        </span>
                        <span>
                          Dibuat: {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => showReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {actionLoading === review.id ? 'Loading...' : 'Tampilkan'}
                      </button>
                      
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {actionLoading === review.id ? 'Loading...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <EyeOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <div className="text-lg mb-2">Tidak ada ulasan tersembunyi</div>
              <div className="text-sm">Semua ulasan saat ini ditampilkan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}