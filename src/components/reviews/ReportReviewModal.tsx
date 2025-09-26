'use client';

import { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
  reviewerName: string;
  reviewContent: string;
  onReportSuccess?: () => void;
}

export default function ReportReviewModal({
  isOpen,
  onClose,
  reviewId,
  reviewerName,
  reviewContent,
  onReportSuccess
}: ReportReviewModalProps) {
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { value: 'SPAM', label: 'Spam atau konten berulang' },
    { value: 'OFFENSIVE', label: 'Bahasa kasar atau tidak pantas' },
    { value: 'FAKE', label: 'Ulasan palsu atau tidak relevan' },
    { value: 'PERSONAL_ATTACK', label: 'Serangan pribadi' },
    { value: 'MISLEADING', label: 'Informasi menyesatkan' },
    { value: 'OTHER', label: 'Alasan lainnya' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportReason || !reportDescription.trim()) {
      alert('Mohon pilih alasan laporan dan berikan deskripsi');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authenticatedFetch('/api/review-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          reportReason,
          reportDescription: reportDescription.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Laporan berhasil dikirim. Kami akan meninjau laporan Anda.');
        onReportSuccess?.();
        onClose();
        // Reset form
        setReportReason('');
        setReportDescription('');
      } else {
        throw new Error(data.error || 'Gagal mengirim laporan');
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert(error.message || 'Terjadi kesalahan saat mengirim laporan');
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
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Laporkan Ulasan
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
          {/* Review Preview */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Ulasan dari {reviewerName}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-3">
              {reviewContent}
            </p>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Laporan *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="">Pilih alasan laporan</option>
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Laporan *
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Jelaskan secara detail mengapa Anda melaporkan ulasan ini..."
                required
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reportDescription.length}/500 karakter
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Catatan:</strong> Laporan yang tidak berdasar atau dibuat dengan sengaja 
                untuk merugikan pihak lain dapat dikenakan sanksi. Pastikan laporan Anda valid 
                dan dapat dipertanggungjawabkan.
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
                disabled={isSubmitting || !reportReason || !reportDescription.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Laporan
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