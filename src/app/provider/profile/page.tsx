"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Camera, 
  Save, 
  User, 
  Star, 
  Calendar, 
  Award, 
  Shield, 
  X, 
  Upload, 
  FileText,
  Loader 
} from "lucide-react";
import { authenticatedFetch } from '@/lib/auth-client';
import md5 from 'crypto-js/md5';
// =====================================================================
// DEFINISI TIPE DATA (TYPESCRIPT)
// =====================================================================

interface Review {
  id: number;
  customer: { fullName: string };
  rating: number;
  comment: string;
  createdAt: string;
  is_show?: boolean;
  order?: {
    providerService?: { serviceTitle: string } | null;
  };
}

interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  providerBio: string | null;
  profilePictureUrl: string | null;
}

interface ProviderStats {
  totalOrders: number;
  averageRating: number;
  joinDate: string;
  verificationStatus: string;
}

interface Document {
  id: number;
  documentType: string;
  filePath: string;
  verifiedAt: string | null;
}

// =====================================================================
// KOMPONEN UTAMA HALAMAN PROFIL
// =====================================================================

export default function ProviderProfilePage() {
  // --- State untuk Mode & UI ---
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // --- State untuk Data Dinamis ---
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // --- State & Ref untuk Upload ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // --- State untuk Modal Pelaporan ---
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('OTHER');
  // =====================================================================
  // FUNGSI PENGAMBILAN DATA (FETCHING)
  // =====================================================================
  const getGravatarURL = (email: string) => {
    // 1. Bersihkan dan ubah email menjadi huruf kecil
    const trimmedEmail = email.trim().toLowerCase();
    // 2. Buat hash MD5 dari email
    const hash = md5(trimmedEmail).toString();
    // 3. Kembalikan URL Gravatar lengkap dengan parameter default
    //    'd=mp' berarti jika tidak ada Gravatar, tampilkan avatar 'mystery person'
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
  };

  const fetchPrimaryData = async () => {
    try {
      const [profileRes, statsRes, documentsRes] = await Promise.all([
        authenticatedFetch('/api/providers/profile'),
        authenticatedFetch('/api/provider/statistics'),
        authenticatedFetch('/api/providers/documents')
      ]);

      const profileResult = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileResult.message || 'Gagal memuat profil.');
      setProfile(profileResult.data);

      const statsResult = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsResult.message || 'Gagal memuat statistik.');
      setStats(statsResult.data);
      
      const documentsResult = await documentsRes.json();
      if (!documentsRes.ok) throw new Error(documentsResult.message || 'Gagal memuat dokumen.');
      setDocuments(documentsResult.data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviderReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await authenticatedFetch('/api/reviews');
      const result = await response.json();
      if (result.success && result.data) {
        const providerReviews = result.data
          .filter((review: any) => review.is_show !== false)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(providerReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchPrimaryData();
    fetchProviderReviews();
  }, []);

  // =====================================================================
  // FUNGSI HANDLER UNTUK INTERAKSI PENGGUNA
  // =====================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await authenticatedFetch('/api/providers/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          address: profile.address,
          providerBio: profile.providerBio,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menyimpan profil.');

      setSuccessMessage('Profil berhasil diperbarui!');
      setProfile(result.data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };
  
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        console.error("Frontend: Tidak ada file yang dipilih.");
        return;
      }

      // ... (Validasi file sudah benar)
      if (!file.type.startsWith('image/')) {
          alert('Hanya file gambar yang diizinkan!');
          return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
          alert('Ukuran file maksimal 2MB!');
          return;
      }
      
      // Buat objek FormData baru setiap kali
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      formDataToSend.append('uploadType', 'profile_picture');
      formDataToSend.append('type', 'image');

      try {
          console.log("Frontend: Mengirim request upload...");
          const response = await authenticatedFetch('/api/upload', { 
            method: 'POST', 
            body: formDataToSend // Gunakan objek FormData yang baru dibuat
          });
          
          const result = await response.json();
          if (!response.ok) {
            console.error("Frontend: Error dari API", result);
            throw new Error(result.message || "Gagal unggah foto");
          }
          
          console.log("Frontend: Upload berhasil, memuat ulang data primer...");
          await fetchPrimaryData(); // Refresh data untuk menampilkan gambar baru
          alert("Foto profil berhasil diunggah!");

      } catch (err: any) {
          console.error("Frontend: Terjadi error saat upload", err);
          alert(`Error: ${err.message}`);
      }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Tipe file tidak valid. Hanya PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }
    if (documents.length >= 5) {
        setUploadError('Anda hanya dapat mengunggah maksimal 5 dokumen.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedDocType);

    try {
        const response = await authenticatedFetch('/api/providers/documents', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Gagal unggah dokumen.");
        await fetchPrimaryData(); // Refresh daftar dokumen
        alert("Dokumen berhasil diunggah dan sedang ditinjau.");
    } catch (err: any) {
        setUploadError(err.message);
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !selectedReview) {
      alert("Alasan pelaporan tidak boleh kosong.");
      return;
    }
    setIsReporting(true);
    try {
      const response = await authenticatedFetch('/api/review-reports', {
        method: 'POST',
        // Pastikan selectedReview.id adalah angka di sini, yang sudah benar
        // Tapi jika ada masalah tak terduga, ini bisa membantu:
        body: JSON.stringify({ reviewId: Number(selectedReview.id), reason: reportReason }), 
      });
      const result = await response.json();
      
      if (!response.ok) {
        // Ambil pesan error spesifik dari backend (contoh: 'You have already reported this review')
        throw new Error(result.message || 'Gagal mengirim laporan.');
      }
      
      alert("Laporan berhasil dikirim dan akan kami tinjau.");
      setReportModalOpen(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsReporting(false);
      setReportReason("");
      setSelectedReview(null);
    }
  };

  // =====================================================================
  // FUNGSI BANTU & RENDER KONDISIONAL
  // =====================================================================

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const renderStars = (rating: number) => Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-10 w-10 text-green-600" /><p className="ml-4 text-lg">Memuat data profil...</p></div>;
  }
  if (error || !profile || !stats) {
    return <div className="text-center py-20 text-red-600">Terjadi Kesalahan: {error || "Data profil tidak dapat dimuat."}</div>;
  }

  const statItems = [
    { 
      label: "Total Pesanan", 
      value: stats.totalOrders?.toString() ?? '0', // Jika totalOrders tidak ada, anggap 0
      icon: <Award className="w-5 h-5" />, 
      color: "text-blue-600" 
    },
    { 
      label: "Rating", 
      value: stats.averageRating?.toFixed(1) ?? 'N/A', // Jika rating tidak ada, tulis N/A
      icon: <Star className="w-5 h-5" />, 
      color: "text-yellow-600" 
    },
    { 
      label: "Bergabung", 
      value: stats.joinDate ? formatDate(stats.joinDate) : 'Baru', // Jika tgl bergabung tidak ada, tulis Baru
      icon: <Calendar className="w-5 h-5" />, 
      color: "text-green-600" 
    },
    { 
      label: "Verifikasi", 
      value: stats.verificationStatus ?? 'Belum terverifikasi', // Jika status tidak ada, anggap belum
      icon: <Shield className="w-5 h-5" />, 
      color: "text-purple-600" 
    }
  ];
  // =====================================================================
  // RENDER JSX (TAMPILAN)
  // =====================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-600 mt-2">Kelola informasi profil dan pengaturan akun Anda.</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <User className="w-5 h-5 mr-2" />Edit Profil
            </button>
          )}
        </div>
        
        {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 mb-6 rounded" role="alert">{successMessage}</div>}
        {error && !successMessage && <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded" role="alert">{error}</div>}

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Profil & Dokumen */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <img 
                    src={profile.profilePictureUrl || getGravatarURL(profile.email)} 
                    alt="Foto Profil" 
                    className="w-24 h-24 bg-gray-200 rounded-full object-cover mx-auto mb-4" 
                  />
                  {isEditing && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-md">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleProfilePictureChange} className="hidden" accept="image/*" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
                <p className="text-gray-600">Provider</p>
              </div>
              <div className="mt-6 space-y-4">
                {statItems.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center"><div className={`${stat.color} mr-3`}>{stat.icon}</div><span className="text-gray-600">{stat.label}</span></div>
                    <span className="font-semibold text-gray-900 text-sm p-2 text-right">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {isEditing && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dokumen Verifikasi</h3>
                {/* ... (daftar dokumen tidak berubah) */}
                
                {/* --- [PERUBAHAN 3] Tambahkan dropdown di sini --- */}
                <div className="mt-4 space-y-2">
                  <div className="space-y-3 mb-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center min-w-0"><FileText className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" /><a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={doc.documentType}>{doc.documentType}</a></div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${doc.verifiedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{doc.verifiedAt ? 'Terverifikasi' : 'Pending'}</span>
                    </div>
                  ))}
                  {documents.length === 0 && <p className="text-sm text-gray-500 text-center py-2">Belum ada dokumen.</p>}
                </div>
                  <label htmlFor="docType" className="block text-sm font-medium text-gray-700">Tipe Dokumen</label>
                  <select
                    id="docType"
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600"
                  >
                  
                    <option value="KTP">KTP</option>
                    <option value="CERTIFICATE">Sertifikat</option>
                    
                  </select>
                </div>
                {/* --------------------------------------------- */}

                <button 
                  type="button" 
                  onClick={() => documentInputRef.current?.click()} 
                  className="w-full mt-4 inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  <Upload className="w-4 h-4 mr-2" /> Unggah Dokumen
                </button>
                <input type="file" ref={documentInputRef} onChange={handleDocumentUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
                <p className="text-xs text-gray-500 mt-2 text-center">Maks 5MB. Tipe: PDF, JPG, PNG.</p>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail & Ulasan */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label><input type="text" name="fullName" value={profile.fullName} onChange={handleInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={profile.email} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label><input type="tel" name="phoneNumber" value={profile.phoneNumber || ''} onChange={handleInputChange} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"/></div>
              </div>
              <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea name="address" value={profile.address || ''} onChange={handleInputChange} rows={2} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"/></div>
              <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea name="providerBio" value={profile.providerBio || ''} onChange={handleInputChange} rows={3} disabled={!isEditing} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"/></div>
              {isEditing && (
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsEditing(false); fetchPrimaryData(); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Batal</button>
                  <button type="submit" disabled={isSaving} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 font-medium">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Menyimpan...</> : <><Save className="w-5 h-5 mr-2" />Simpan Perubahan</>}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ulasan Terbaru</h3>
              {loadingReviews ? (
                <div className="text-center py-4 text-gray-500">Memuat ulasan...</div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2"><p className="font-medium text-gray-900">{review.customer.fullName}</p><div className="text-right"><div className="flex items-center mb-1">{renderStars(review.rating)}</div><p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p></div></div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">{review.order?.providerService?.serviceTitle || 'Layanan'}</p>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <button onClick={() => { setSelectedReview(review); setReportModalOpen(true); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Laporkan</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Belum ada ulasan yang ditampilkan.</div>
              )}
            </div>
          </div>
        </form>

        {reportModalOpen && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"><div className="bg-white rounded-lg shadow-lg w-full max-w-md"><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-semibold text-gray-900">Laporkan Ulasan</h3><button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div><div className="p-4"><p className="text-sm mb-2">Ulasan dari: <span className="font-medium">{selectedReview.customer.fullName}</span></p><p className="text-sm italic bg-gray-50 p-2 rounded-md mb-4">"{selectedReview.comment}"</p><textarea className="w-full border rounded p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="Jelaskan alasan pelaporan..." value={reportReason} onChange={(e) => setReportReason(e.target.value)}></textarea></div><div className="flex justify-end space-x-2 p-4 border-t"><button onClick={() => setReportModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button><button onClick={submitReport} disabled={isReporting} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300">{isReporting && <Loader className="w-4 h-4 mr-2 animate-spin" />} Kirim Laporan</button></div></div></div>
        )}
      </div>
    </div>
  );
}