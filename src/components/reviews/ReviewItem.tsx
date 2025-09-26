'use client';

import { useState } from 'react';
import { Star, Flag, Edit, MoreVertical } from 'lucide-react';
import ReportReviewModal from './ReportReviewModal';
import EditReviewModal from './EditReviewModal';

interface ReviewItemProps {
  review: {
    id: number;
    rating: number;
    comment: string;
    date: string;
    customer: {
      id: number;
      name: string;
      avatar?: string;
    };
    isShow: boolean;
  };
  currentUserId?: number;
  userRole?: string;
  providerName?: string; // Added for EditReviewModal
  onReviewUpdate?: () => void;
  showReportButton?: boolean;
}

export default function ReviewItem({ 
  review, 
  currentUserId, 
  userRole,
  providerName = '',
  onReviewUpdate,
  showReportButton = true 
}: ReviewItemProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // REQ-F-7.3: Hide review if is_show is false (except for admin and review owner)
  const shouldShowReview = review.isShow || 
                          userRole === 'admin' || 
                          currentUserId === review.customer.id;

  if (!shouldShowReview) {
    return null; // Hide the review completely
  }

  const isOwnReview = currentUserId === review.customer.id;
  const canReport = showReportButton && !isOwnReview && userRole !== 'admin';
  const canEdit = isOwnReview;

  const handleReportClick = () => {
    setShowReportModal(true);
    setShowMenu(false);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  return (
    <>
      <div className={`bg-white border rounded-lg p-4 ${!review.isShow ? 'opacity-75 border-yellow-300 bg-yellow-50' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {review.customer.avatar ? (
                <img 
                  src={review.customer.avatar} 
                  alt={review.customer.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                review.customer.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{review.customer.name}</h4>
              <div className="flex items-center mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {new Date(review.date).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          {(canReport || canEdit) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  {canEdit && (
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Ulasan
                    </button>
                  )}
                  {canReport && (
                    <button
                      onClick={handleReportClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Laporkan Ulasan
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="mb-3">
          <p className="text-gray-600 leading-relaxed">{review.comment}</p>
        </div>

        {/* Status Indicator (for admin/owner view when review is hidden) */}
        {!review.isShow && (userRole === 'admin' || isOwnReview) && (
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {userRole === 'admin' ? 'Disembunyikan karena laporan' : 'Ulasan Anda sedang dalam peninjauan'}
            </span>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportReviewModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reviewId={review.id}
        reviewerName={review.customer.name}
        reviewContent={review.comment}
        onReportSuccess={onReviewUpdate}
      />

      {/* Edit Modal */}
      <EditReviewModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        reviewId={review.id}
        currentRating={review.rating}
        currentComment={review.comment}
        providerName={providerName}
        onUpdateSuccess={onReviewUpdate}
      />
    </>
  );
}