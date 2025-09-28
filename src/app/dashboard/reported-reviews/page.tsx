'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, AlertTriangle, Filter, Search, ExternalLink } from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';
import ReusableTable from '@/components/ReusableTable';

interface ReportedReview {
  id: number;
  reviewId: number;
  reportReason: string;
  reportDescription: string;
  reportedAt: string;
  status: 'PENDING_REVIEW' | 'RESOLVED_REVIEW_KEPT' | 'RESOLVED_REVIEW_REMOVED';
  review: {
    id: number;
    rating: number;
    comment: string;
    isShow: boolean;
    createdAt: string;
    customer: {
      id: number;
      fullName: string;
    };
    order: {
      id: number;
      provider: {
        id: number;
        fullName: string;
      };
    };
  };
  reporter?: {
    id: number;
    fullName: string;
  };
}

export default function AdminReportedReviews() {
  const [reports, setReports] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingReport, setProcessingReport] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const reportReasonLabels: Record<string, string> = {
    'SPAM': 'Spam atau konten berulang',
    'OFFENSIVE': 'Bahasa kasar atau tidak pantas',
    'FAKE': 'Ulasan palsu atau tidak relevan',
    'PERSONAL_ATTACK': 'Serangan pribadi',
    'MISLEADING': 'Informasi menyesatkan',
    'OTHER': 'Alasan lainnya'
  };

  useEffect(() => {
    fetchReportedReviews();
  }, []);

  const fetchReportedReviews = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/review-reports');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data);
      } else {
        throw new Error(data.error || 'Gagal memuat data laporan');
      }
    } catch (error: any) {
      console.error('Error fetching reported reviews:', error);
      alert(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: number, action: 'hide' | 'show' | 'dismiss') => {
    try {
      setProcessingReport(reportId);
      
      // Convert action to match API expectations
      let apiAction: string = action;
      if (action === 'hide') apiAction = 'approve'; // approve = hide review
      if (action === 'show') apiAction = 'dismiss'; // dismiss = keep review visible
      
      const response = await authenticatedFetch(`/api/admin/review-reports`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reportId, 
          action: apiAction,
          adminNotes: `Admin ${apiAction}d the report via dashboard`
        })
      });

      const data = await response.json();

      if (data.success) {
        await fetchReportedReviews(); // Refresh data
        
        const actionText = action === 'hide' ? 'disembunyikan' : 
                          action === 'show' ? 'ditampilkan kembali' : 'diabaikan';
        alert(`Laporan berhasil ${actionText}`);
      } else {
        throw new Error(data.error || 'Gagal memproses laporan');
      }
    } catch (error: any) {
      console.error('Error processing report:', error);
      alert(error.message || 'Terjadi kesalahan saat memproses laporan');
    } finally {
      setProcessingReport(null);
    }
  };

  // Filter reports based on status and search term
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus.toUpperCase();
    const matchesSearch = searchTerm === '' || 
      report.review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.review.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.review.order.provider.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  type TableRowType = {
    id: number;
    reviewInfo: React.ReactNode;
    reporter: string;
    reason: React.ReactNode;
    status: React.ReactNode;
    visibility: React.ReactNode;
    actions: React.ReactNode;
  };

  const tableColumns: Array<{
    header: string;
    accessorKey?: keyof TableRowType;
    cell?: (row: TableRowType) => React.ReactNode;
  }> = [
    { 
      header: 'Ulasan',
      accessorKey: 'reviewInfo',
      cell: (row) => row.reviewInfo
    },
    { 
      header: 'Pelapor',
      accessorKey: 'reporter'
    },
    { 
      header: 'Alasan',
      accessorKey: 'reason',
      cell: (row) => row.reason
    },
    { 
      header: 'Status',
      accessorKey: 'status',
      cell: (row) => row.status
    },
    { 
      header: 'Visibilitas',
      accessorKey: 'visibility',
      cell: (row) => row.visibility
    },
    { 
      header: 'Aksi',
      accessorKey: 'actions',
      cell: (row) => row.actions
    }
  ];

  const tableData = filteredReports.map(report => ({
    id: report.id,
    reviewInfo: (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{report.review.customer.fullName}</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={star <= report.review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{report.review.comment}</p>
        <p className="text-xs text-gray-500">
          Provider: {report.review.order.provider.fullName} • Order #{report.review.order.id}
        </p>
      </div>
    ),
    reporter: report.reporter ? report.reporter.fullName : 'Sistem',
    reason: (
      <div>
        <span className="font-medium">{reportReasonLabels[report.reportReason] || report.reportReason}</span>
        {report.reportDescription && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.reportDescription}</p>
        )}
      </div>
    ),
    status: (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        report.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
        report.status === 'RESOLVED_REVIEW_KEPT' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        {report.status === 'PENDING_REVIEW' ? 'Menunggu' :
         report.status === 'RESOLVED_REVIEW_KEPT' ? 'Review Dipertahankan' : 'Review Dihapus'}
      </span>
    ),
    visibility: (
      <div className="flex items-center gap-2">
        {report.review.isShow ? (
          <span className="flex items-center text-green-600">
            <Eye className="w-4 h-4 mr-1" />
            Terlihat
          </span>
        ) : (
          <span className="flex items-center text-red-600">
            <EyeOff className="w-4 h-4 mr-1" />
            Disembunyikan
          </span>
        )}
      </div>
    ),
    actions: (
      <div className="flex gap-2">
        {report.status === 'PENDING_REVIEW' && (
          <>
            {report.review.isShow ? (
              <button
                onClick={() => handleReportAction(report.id, 'hide')}
                disabled={processingReport === report.id}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingReport === report.id ? 'Proses...' : 'Sembunyikan'}
              </button>
            ) : (
              <button
                onClick={() => handleReportAction(report.id, 'show')}
                disabled={processingReport === report.id}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingReport === report.id ? 'Proses...' : 'Tampilkan'}
              </button>
            )}
            <button
              onClick={() => handleReportAction(report.id, 'dismiss')}
              disabled={processingReport === report.id}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abaikan
            </button>
          </>
        )}
        <a
          href={`/providers/${report.review.order.provider.id}#review-${report.review.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Lihat
        </a>
      </div>
    )
  }));

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
            <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
            Laporan Ulasan
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola laporan ulasan yang masuk dari pengguna
          </p>
        </div>
        
        <button
          onClick={fetchReportedReviews}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
        <Link 
      href="/dashboard/hidden-reviews"
      className="
        inline-flex items-center justify-center 
        px-5 py-2.5 
        font-semibold text-sm text-white 
        bg-blue-600 
        rounded-lg 
        shadow-sm 
        hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-all duration-200 ease-in-out
        transform hover:-translate-y-0.5
      "
    >
      <EyeOff className="w-4 h-4 mr-2" />
      Ulasan Tersembunyi
    </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="pending_review">Menunggu</option>
              <option value="resolved_review_kept">Review Dipertahankan</option>
              <option value="resolved_review_removed">Review Dihapus</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Pencarian
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan ulasan, customer, atau provider..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredReports.length > 0 ? (
          <ReusableTable
            columns={tableColumns}
            data={tableData}
          />
        ) : (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada laporan ulasan ditemukan
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Belum ada laporan ulasan yang masuk'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Menunggu</p>
              <p className="text-lg font-semibold text-gray-900">
                {reports.filter(r => r.status === 'PENDING_REVIEW').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Dipertahankan</p>
              <p className="text-lg font-semibold text-gray-900">
                {reports.filter(r => r.status === 'RESOLVED_REVIEW_KEPT').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Dihapus</p>
              <p className="text-lg font-semibold text-gray-900">
                {reports.filter(r => r.status === 'RESOLVED_REVIEW_REMOVED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Disembunyikan</p>
              <p className="text-lg font-semibold text-gray-900">
                {reports.filter(r => !r.review.isShow).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}