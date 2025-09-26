'use client';

import { useState, useEffect } from 'react';
import { X, Star, Edit, Save } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
  currentRating: number;
  currentComment: string;
  providerName: string;
  onUpdateSuccess?: () => void;
}

export default function EditReviewModal({
  isOpen,
  onClose,
  reviewId,
  currentRating,
  currentComment,
  providerName,
  onUpdateSuccess
}: EditReviewModalProps) {
  const [rating, setRating] = useState(currentRating);
  const [comment, setComment] = useState(currentComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setRating(currentRating);
      setComment(currentComment);
    }
  }, [isOpen, currentRating, currentComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() || rating === 0) {
      alert('Mohon berikan rating dan komentar');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Ulasan berhasil diperbarui!');
        onUpdateSuccess?.();
        onClose();
      } else {
        throw new Error(data.error || 'Gagal memperbarui ulasan');
      }
    } catch (error: any) {
      console.error('Error updating review:', error);
      alert(error.message || 'Terjadi kesalahan saat memperbarui ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit className="w-5 h-5 mr-2 text-blue-500" />
            Edit Ulasan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Ulasan untuk {providerName}
            </h3>
            <p className="text-xs text-gray-600">
              Anda dapat mengubah rating dan komentar ulasan Anda
            </p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
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
                      className={`w-8 h-8 ${
                        star <= (hoveredStar || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      } ${isSubmitting ? 'opacity-50' : 'hover:scale-110 transition-transform'}`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {rating > 0 ? `${rating} dari 5 bintang` : 'Pilih rating'}
                </span>
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
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Bagikan pengalaman Anda dengan layanan ini..."
                required
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 karakter
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Tips:</strong> Berikan ulasan yang jujur dan konstruktif. 
                Ceritakan pengalaman Anda secara objektif untuk membantu pengguna lain 
                membuat keputusan yang tepat.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim() || rating === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}