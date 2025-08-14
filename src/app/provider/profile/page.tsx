"use client";

import { useState } from "react";
import { Camera, Save, User, Star, Calendar, Award, Shield, X } from "lucide-react";
import ProviderNavbar from "@/components/provider/ProviderNavbar";

// Definisikan tipe data untuk ulasan agar lebih aman
interface Review {
  id: number;
  customer: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

export default function ProviderProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
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

  const reviews: Review[] = [
    { id: 1, customer: "John Doe", rating: 5, comment: "Service AC sangat memuaskan, teknisi datang tepat waktu dan profesional.", date: "2024-01-15", service: "Service AC" },
    { id: 2, customer: "Jane Smith", rating: 5, comment: "Perbaikan AC cepat dan hasilnya bagus. Harga juga reasonable.", date: "2024-01-10", service: "Perbaikan AC Split" },
    { id: 3, customer: "Bob Johnson", rating: 4, comment: "Maintenance rutin berjalan lancar, AC jadi lebih dingin.", date: "2024-01-05", service: "Maintenance AC" }
  ];

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

  const submitReport = () => {
    if (!reportReason.trim()) {
      alert("Silakan isi alasan pelaporan!");
      return;
    }
    console.log("Laporan dikirim:", { reviewId: selectedReview?.id, reason: reportReason });
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ulasan Terbaru</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{review.customer}</p>
                        <p className="text-sm text-gray-600">{review.service}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-1">{renderStars(review.rating)}</div>
                        <p className="text-sm text-gray-500">{formatDate(review.date)}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <button onClick={() => openReportModal(review)} className="text-xs text-red-500 hover:text-red-700 font-medium">Laporkan</button>
                  </div>
                ))}
              </div>
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
                <p className="text-sm mb-2">Ulasan dari: <span className="font-medium">{selectedReview.customer}</span></p>
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