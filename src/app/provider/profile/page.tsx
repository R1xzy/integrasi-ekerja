"use client";

import { useState, useEffect } from "react";
import { Camera, Save, User, Star, Calendar, Award, Shield, X, RefreshCw } from "lucide-react";
import ProviderNavbar from "@/components/provider/ProviderNavbar";
import { authenticatedFetch } from '@/lib/auth-client';

// Definisikan tipe data untuk ulasan agar lebih aman
interface Review {
  id: number;
  customer: { fullName: string } | string;
  rating: number;
  comment: string;
  createdAt: string;
  is_show?: boolean; // Added for REQ-F-7.3
  order?: {
    service?: { name: string } | null;
    providerService?: { serviceTitle: string } | null;
  };
}

export default function ProviderProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [formData, setFormData] = useState({
    name: "Ahmad Teknisi",
    email: "ahmad.teknisi@email.com",
    phone: "081234567890",
    address: "Jl. Raya Karawang No. 123, Karawang Barat",
    bio: "Teknisi AC berpengalaman lebih dari 5 tahun. Melayani service, perbaikan, dan instalasi AC untuk rumah dan kantor.",
    specialties: ["Service AC", "Perbaikan AC", "Instalasi AC", "Maintenance"],
    workingHours: "08:00 - 17:00",
    workingDays: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  });

  // State untuk modal pelaporan
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reportReason, setReportReason] = useState("");

  const stats = [
    { label: "Total Pesanan", value: "127", icon: <Award className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Rating", value: "4.8", icon: <Star className="w-5 h-5" />, color: "text-yellow-600" },
    { label: "Bergabung", value: "2 Tahun", icon: <Calendar className="w-5 h-5" />, color: "text-green-600" },
    { label: "Verifikasi", value: "Terverifikasi", icon: <Shield className="w-5 h-5" />, color: "text-purple-600" }
  ];

  // Fetch reviews from API
  const fetchProviderReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await authenticatedFetch('/api/reviews');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Filter reviews for current provider and only show visible reviews (REQ-F-7.3)
        const providerReviews = data.data
          .filter((review: any) => review.provider) // Only reviews that have provider data
          .filter((review: any) => review.is_show !== false) // Only show reviews that are not hidden (REQ-F-7.3)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10); // Show only latest 10 reviews
        
        setReviews(providerReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch reviews on component mount
  useEffect(() => {
    fetchProviderReviews();
    
    // Auto-refresh reviews every 30 seconds to catch new reviews
    const interval = setInterval(fetchProviderReviews, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSpecialtyChange = (index: number, value: string) => {
    const newSpecialties = [...formData.specialties];
    newSpecialties[index] = value;
    setFormData(prev => ({ ...prev, specialties: newSpecialties }));
  };

  const addSpecialty = () => setFormData(prev => ({ ...prev, specialties: [...prev.specialties, ""] }));

  const removeSpecialty = (index: number) => {
    setFormData(prev => ({ ...prev, specialties: prev.specialties.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    console.log("Saving profile:", formData);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  const renderStars = (rating: number) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
  ));

  // Fungsi untuk modal pelaporan
  const openReportModal = (review: Review) => {
    setSelectedReview(review);
    setReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      alert("Silakan isi alasan pelaporan!");
      return;
    }
    
    if (!selectedReview?.id) {
      alert("Data review tidak valid. Silakan coba lagi.");
      return;
    }
    
    try {
      const requestData = {
        reviewId: selectedReview.id,
        reason: reportReason.trim()
      };
      
      console.log("Submitting report:", requestData);
      
      const response = await authenticatedFetch('/api/review-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response:", data);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        alert("Server response tidak valid. Silakan coba lagi.");
        return;
      }
      
      if (response.ok && data.success) {
        alert("Laporan berhasil dikirim!");
        // Refresh reviews to potentially hide reported review
        fetchProviderReviews();
      } else {
        console.error("API Error:", data);
        const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
        alert("Gagal mengirim laporan: " + errorMessage);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert("Gagal mengirim laporan: " + (error instanceof Error ? error.message : 'Network error'));
    }
    
    setReportModalOpen(false);
    setReportReason("");
    setSelectedReview(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-600 mt-2">Kelola informasi profil dan pengaturan akun</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {isEditing ? <><Save className="w-5 h-5 mr-2" />Simpan</> : <><User className="w-5 h-5 mr-2" />Edit Profil</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-gray-600" />
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                <p className="text-gray-600">Provider Teknisi AC</p>
              </div>
              <div className="mt-6 space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`${stat.color} mr-3`}>{stat.icon}</div>
                      <span className="text-gray-600">{stat.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        {isEditing ? <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.name}</p>}
                    </div>
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        {isEditing ? <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.email}</p>}
                    </div>
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                        {isEditing ? <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.phone}</p>}
                    </div>
                    {/* Working Hours */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Kerja</label>
                        {isEditing ? <input type="text" name="workingHours" value={formData.workingHours} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.workingHours}</p>}
                    </div>
                </div>
                 {/* Address */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                    {isEditing ? <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.address}</p>}
                </div>
                 {/* Bio */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    {isEditing ? <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg"/> : <p className="text-gray-900">{formData.bio}</p>}
                </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keahlian</h3>
                {isEditing ? (
                    <div className="space-y-2">
                    {formData.specialties.map((specialty, index) => (
                        <div key={index} className="flex gap-2">
                        <input type="text" value={specialty} onChange={(e) => handleSpecialtyChange(index, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Masukkan keahlian" />
                        <button onClick={() => removeSpecialty(index)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">Hapus</button>
                        </div>
                    ))}
                    <button onClick={addSpecialty} className="text-green-600 hover:text-green-700 font-medium">+ Tambah Keahlian</button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty, index) => (<span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">{specialty}</span>))}
                    </div>
                )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ulasan Terbaru</h3>
                {loadingReviews && (
                  <div className="text-sm text-gray-500">Memuat...</div>
                )}
              </div>
              
              {loadingReviews ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {typeof review.customer === 'object' && review.customer?.fullName 
                              ? review.customer.fullName 
                              : typeof review.customer === 'string' 
                                ? review.customer 
                                : 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {review.order?.service?.name || 
                             review.order?.providerService?.serviceTitle || 
                             'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center mb-1">{renderStars(review.rating)}</div>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <button 
                        onClick={() => openReportModal(review)} 
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Laporkan
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg mb-2">Belum ada ulasan</div>
                  <div className="text-sm">Ulasan pelanggan akan muncul di sini</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Pelaporan */}
        {reportModalOpen && selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Laporkan Ulasan</h3>
                <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4">
                {/* Debug info - temporary */}
                <div className="text-xs text-gray-400 mb-2">
                  Debug: Review ID = {selectedReview.id}
                </div>
                
                <p className="text-sm mb-2">
                  Ulasan dari: 
                  <span className="font-medium">
                    {typeof selectedReview.customer === 'object' && selectedReview.customer?.fullName
                      ? selectedReview.customer.fullName
                      : typeof selectedReview.customer === 'string'
                        ? selectedReview.customer
                        : 'Anonymous'}
                  </span>
                </p>
                <p className="text-sm italic bg-gray-50 p-2 rounded-md mb-4">"{selectedReview.comment}"</p>
                <textarea
                  className="w-full border rounded p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Jelaskan alasan pelaporan..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 p-4 border-t">
                <button onClick={() => setReportModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Batal</button>
                <button onClick={submitReport} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Kirim Laporan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}