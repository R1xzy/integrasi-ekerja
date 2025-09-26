'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Edit3, Trash2, ArrowLeft, AlertCircle, Calendar, User } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';
import EditReviewModal from '@/components/reviews/EditReviewModal';

interface Review {
  id: number;
  rating: number;
  comment: string;
  is_show: boolean;
  createdAt: string;
  updatedAt: string;
  order: {
    id: number;
    providerService: {
      serviceTitle: string;
    };
  };
  provider: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  customer: {
    fullName: string;
  };
}

export default function CustomerReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchCustomerReviews();
  }, []);

  const fetchCustomerReviews = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/reviews/customer');
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat ulasan');
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini? Aksi ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Ulasan berhasil dihapus');
        setReviews(reviews.filter(review => review.id !== reviewId));
      } else {
        throw new Error(data.error || 'Gagal menghapus ulasan');
      }
    } catch (error: any) {
      console.error('Error deleting review:', error);
      alert(error.message || 'Terjadi kesalahan saat menghapus ulasan');
    }
  };

  const handleEditSuccess = (updatedReview: Review) => {
    setReviews(reviews.map(review => 
      review.id === updatedReview.id ? updatedReview : review
    ));
    setEditingReview(null);
    alert('Ulasan berhasil diperbarui!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Ulasan Saya</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Belum Ada Ulasan
            </h2>
            <p className="text-gray-600 mb-4">
              Anda belum memberikan ulasan untuk layanan apapun
            </p>
            <button
              onClick={() => router.push('/customer/orders')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lihat Pesanan Saya
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Review Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {review.provider.profilePictureUrl ? (
                          <img
                            src={review.provider.profilePictureUrl}
                            alt={review.provider.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          review.provider.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {review.provider.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {review.order.providerService.serviceTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pesanan #{review.order.id}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingReview(review)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Ulasan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Ulasan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    {renderStars(review.rating)}
                  </div>

                  {/* Review Date */}
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Ditulis pada {formatDate(review.createdAt)}</span>
                    {review.updatedAt !== review.createdAt && (
                      <span className="ml-2">• Diperbarui {formatDate(review.updatedAt)}</span>
                    )}
                  </div>

                  {/* Visibility Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.is_show 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {review.is_show ? 'Dipublikasikan' : 'Dalam Review'}
                      </div>
                      {!review.is_show && (
                        <span className="ml-2 text-xs text-gray-500">
                          Ulasan sedang ditinjau oleh admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="p-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {reviews.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Total Ulasan: {reviews.length}
                </span>
              </div>
              <div className="text-sm text-blue-700">
                <span className="font-medium">
                  {reviews.filter(r => r.is_show).length} Dipublikasikan
                </span>
                {' • '}
                <span className="font-medium">
                  {reviews.filter(r => !r.is_show).length} Dalam Review
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <EditReviewModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          reviewId={editingReview.id}
          currentRating={editingReview.rating}
          currentComment={editingReview.comment}
          providerName={editingReview.provider.fullName}
          onUpdateSuccess={() => {
            fetchCustomerReviews();
            setEditingReview(null);
          }}
        />
      )}
    </div>
  );
}