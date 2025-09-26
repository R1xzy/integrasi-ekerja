'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Send, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

interface ReviewData {
  id: number;
  rating: number;
  comment: string;
  is_show: boolean;
}

interface OrderInfo {
  id: number;
  provider: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  providerService: {
    serviceTitle: string;
  };
  status: string;
}

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const reviewId = searchParams.get('reviewId'); // New parameter for edit mode

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [existingReview, setExistingReview] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);

  const isEditMode = !!reviewId;

  useEffect(() => {
    if (orderId) {
      fetchOrderInfo();
      // Always try to fetch existing review for this order
      fetchExistingReview();
    }
  }, [orderId]);

  const fetchOrderInfo = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (data.success) {
        // Check if order is completed
        if (data.data.status !== 'COMPLETED') {
          setError('Ulasan hanya dapat diberikan untuk pesanan yang telah selesai');
          return;
        }
        setOrder(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat data pesanan');
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReview = async () => {
    try {
      // Get all reviews and find the review for this order by current customer
      const response = await authenticatedFetch(`/api/reviews`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Find review for this specific order by current customer
        const orderReview = data.data.find((review: any) => {
          return review.order && review.order.id === parseInt(orderId!);
        });
        if (orderReview) {
          setExistingReview(orderReview);
          // Pre-fill form with existing review data
          setRating(orderReview.rating);
          setComment(orderReview.comment);
        }
      }
    } catch (err: any) {
      console.error('Error fetching review:', err);
      // Don't show error for this, just continue with new review mode
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !comment.trim()) {
      alert('Mohon berikan rating dan komentar');
      return;
    }

    if (!order) return;

    setIsSubmitting(true);

    try {
      // Check if we have existing review (edit mode)
      const hasExistingReview = !!existingReview;
      const url = hasExistingReview ? `/api/reviews/${existingReview.id}` : '/api/reviews';
      const method = hasExistingReview ? 'PUT' : 'POST';
      const body = hasExistingReview 
        ? JSON.stringify({
            rating,
            comment: comment.trim()
          })
        : JSON.stringify({
            orderId: parseInt(orderId!),
            providerId: order.provider.id,
            rating,
            comment: comment.trim()
          });

      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert(hasExistingReview ? 'Ulasan berhasil diperbarui!' : 'Ulasan berhasil dikirim! Terima kasih atas feedback Anda.');
        // Redirect back to order detail or orders list
        router.push(`/orders/${orderId}`);
      } else {
        throw new Error(data.error || (hasExistingReview ? 'Gagal memperbarui ulasan' : 'Gagal mengirim ulasan'));
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert(error.message || (existingReview ? 'Terjadi kesalahan saat memperbarui ulasan' : 'Terjadi kesalahan saat mengirim ulasan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    const ratingTexts = {
      1: 'Sangat Tidak Puas',
      2: 'Tidak Puas', 
      3: 'Cukup',
      4: 'Puas',
      5: 'Sangat Puas'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Pesanan tidak ditemukan'}
            </h2>
            <p className="text-gray-600 mb-4">
              Silakan kembali dan coba lagi
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{existingReview ? 'Edit Ulasan' : 'Beri Ulasan'}</h1>
        </div>

        {/* Current Review Info - Only show in edit mode */}
        {existingReview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= existingReview.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-blue-800">
                  Ulasan Saat Ini ({existingReview.rating}/5)
                </span>
              </div>
              <div className="ml-auto">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  existingReview.is_show 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {existingReview.is_show ? 'Dipublikasikan' : 'Dalam Review'}
                </span>
              </div>
            </div>
            <p className="text-sm text-blue-700 italic">
              "{existingReview.comment}"
            </p>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {order.provider.profilePictureUrl ? (
                <img
                  src={order.provider.profilePictureUrl}
                  alt={order.provider.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                order.provider.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {order.provider.fullName}
              </h2>
              <p className="text-gray-600">{order.providerService.serviceTitle}</p>
              <p className="text-sm text-gray-500">Pesanan #{order.id}</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rating *
              </label>
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredStar || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } ${isSubmitting ? 'opacity-50' : 'hover:scale-110 transition-transform cursor-pointer'}`}
                      />
                    </button>
                  ))}
                </div>
                {(hoveredStar || rating) > 0 && (
                  <p className="text-sm text-gray-600 font-medium">
                    {getRatingText(hoveredStar || rating)}
                  </p>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Komentar *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Bagikan pengalaman Anda dengan layanan ini. Ceritakan apa yang Anda suka atau tidak suka..."
                required
                disabled={isSubmitting}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/1000 karakter
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Tips Memberikan Ulasan</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Berikan ulasan yang jujur dan objektif</li>
                <li>• Jelaskan aspek yang Anda sukai dan tidak sukai</li>
                <li>• Hindari kata-kata kasar atau menyinggung</li>
                <li>• Ulasan Anda akan membantu pengguna lain</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !rating || !comment.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {existingReview ? 'Memperbarui...' : 'Mengirim...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {existingReview ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {existingReview 
              ? 'Perubahan ulasan Anda akan ditinjau kembali oleh tim kami' 
              : 'Ulasan Anda akan dipublikasikan setelah ditinjau oleh tim kami'
            }
          </p>
        </div>
      </div>
    </div>
  );
}