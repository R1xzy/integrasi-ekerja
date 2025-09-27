"use client";

import Link from "next/link";
import { Search, Filter, Star, MapPin, Clock, ChevronRight, Award, Shield, Loader } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { authenticatedFetch } from '@/lib/auth-client';
import { useDebounce } from 'use-debounce'; // Pastikan Anda sudah menginstal 'use-debounce'

// =================================================================
// 1. DEFINISI TIPE DATA
// =================================================================

interface Category {
  id: number;
  name: string;
  serviceCount: number;
}

interface ProviderListing {
  id: number;
  name: string;
  avatar: string;
  specialties: string[]; // Diambil dari kategori layanan yang ditawarkan
  rating: number; 
  reviewCount: number; 
  completedOrders: number; // MOCK: Tidak tersedia di API services/search
  location: string; // Diambil dari address/district provider
  responseTime: string; // MOCK: Tidak tersedia di API services/search
  startingPrice: number; // Harga terendah dari layanan yang ditawarkan
  isVerified: boolean;
  joinDate: string;
  bio: string; // Diambil dari providerBio
  badges: string[]; // Diderivasi dari rating/verifikasi
}

interface ServiceData {
  id: number;
  serviceTitle: string;
  price: number;
  providerId: number;
  description: string;
  provider: {
    id: number;
    fullName: string;
    profilePictureUrl: string | null;
    verificationStatus: string;
    address: string | null;
    providerBio: string | null;
    rating: number; 
    reviewCount: number; 
  };
  category: {
    name: string;
  };
}

// =================================================================
// 2. HELPER UTILITY
// =================================================================

const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top Rated':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Fast Response':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
};

// =================================================================
// 3. KOMPONEN UTAMA
// =================================================================

export default function ProvidersPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allServices, setAllServices] = useState<ServiceData[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Filter & Search
  const [selectedCategoryName, setSelectedCategoryName] = useState("Semua");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [verificationFilters, setVerificationFilters] = useState({
    verified: false,
    topRated: false, // Ditangani di client-side logic
    fastResponse: false // MOCK
  });
  const [sortBy, setSortBy] = useState("relevance");
  
  // --- FETCHING DATA ---
  const fetchInitialData = useCallback(async () => {
    setError(null);
    try {
        // 1. Fetch Categories
        const catResponse = await fetch('/api/service-categories');
        const catResult = await catResponse.json();
        if (!catResponse.ok || !catResult.success) throw new Error("Gagal memuat kategori.");
        
        // Tambahkan opsi "Semua"
        const totalCount = catResult.data.reduce((sum: number, c: Category) => sum + c.serviceCount, 0);
        const allCategory: Category = { id: 0, name: "Semua", serviceCount: totalCount };
        setCategories([allCategory, ...catResult.data]);
        
    } catch (err: any) {
        setError(err.message);
    } 
  }, []);

  const fetchProviders = useCallback(async (isInitialLoad = false) => {
      if (!isInitialLoad) setIsLoading(true); // Tampilkan loading saat filter berubah

      const [sortField, sortOrder] = sortBy === 'rating' ? ['rating', 'desc'] : 
                                     sortBy === 'orders' ? ['orders', 'desc'] : // Jika API mendukung orders
                                     ['serviceTitle', 'asc']; 

      const params = new URLSearchParams();
      if (selectedCategoryId) params.append('categoryId', String(selectedCategoryId));
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (verificationFilters.verified) params.append('verified', 'true');
      
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);
      params.append('limit', '100'); // Ambil banyak untuk pengelompokan provider

      try {
          const response = await authenticatedFetch(`/api/services/search?${params.toString()}`);
          const result = await response.json();

          if (!response.ok || !result.success) throw new Error(result.message || "Gagal memuat daftar penyedia.");
          
          setAllServices(result.data || []);
      } catch (err: any) {
          setError(err.message);
      } finally {
          if (isInitialLoad) setIsLoading(false);
      }
  }, [selectedCategoryId, debouncedSearchQuery, verificationFilters.verified, sortBy]);

  // Efek untuk memuat data awal
  useEffect(() => {
    fetchInitialData();
    fetchProviders(true);
  }, [fetchInitialData, fetchProviders]);
  
  // Efek untuk memuat ulang saat filter diubah (jika bukan initial load)
  useEffect(() => {
    fetchProviders();
  }, [selectedCategoryId, debouncedSearchQuery, verificationFilters.verified, sortBy]);


  // --- LOGIKA UTAMA: NORMALISASI SERVICE KE PROVIDER (Client-Side) ---
  const normalizedProviders = useMemo(() => {
    const providerMap = new Map<number, ProviderListing>();

    allServices.forEach(service => {
        const pId = service.provider.id;
        const sPrice = service.price;
        const pRating = service.provider.rating;
        const pReviewCount = service.provider.reviewCount;
        const vStatus = service.provider.verificationStatus;
        
        // 1. Derivasi Badges (MOCK untuk non-API data)
        const badges = [
          vStatus === 'VERIFIED' ? 'Verified' : null,
          pRating >= 4.7 ? 'Top Rated' : null,
          // MOCK: Fast Response tidak tersedia di API
          verificationFilters.fastResponse ? 'Fast Response' : null
        ].filter(Boolean) as string[];

        // 2. Agregasi data service ke provider
        if (providerMap.has(pId)) {
            const existingProvider = providerMap.get(pId)!;
            
            // Ambil harga terendah
            if (sPrice < existingProvider.startingPrice) {
                 existingProvider.startingPrice = sPrice;
            }
            
            // Gabungkan specialties
            const newSpecialty = service.category.name;
            if (!existingProvider.specialties.includes(newSpecialty)) {
                existingProvider.specialties.push(newSpecialty);
            }
            
        } else {
             // Provider baru
            providerMap.set(pId, {
                id: pId,
                name: service.provider.fullName,
                avatar: service.provider.profilePictureUrl || '/default-avatar.png',
                specialties: [service.category.name],
                rating: pRating,
                reviewCount: pReviewCount,
                completedOrders: 0, // MOCK
                location: service.provider.address || 'Karawang', // MOCK/Sederhana
                responseTime: '< 1 jam', // MOCK
                startingPrice: sPrice,
                isVerified: vStatus === 'VERIFIED',
                joinDate: '2023-01-01', // MOCK
                bio: service.provider.providerBio || 'Provider ini belum mengisi bio.',
                badges: badges
            });
        }
    });

    let finalProviders = Array.from(providerMap.values());
    
    // --- PENERAPAN FILTER CLIENT-SIDE (Rating, Top Rated) ---
    
    // Filter Rating Client-Side (Jika filter rating dipilih)
    if (selectedRating) {
        const minRating = parseFloat(selectedRating);
        finalProviders = finalProviders.filter(p => p.rating >= minRating);
    }
    
    // Filter Top Rated (Karena tidak bisa dilakukan di API search service)
    if (verificationFilters.topRated) {
        finalProviders = finalProviders.filter(p => p.badges.includes('Top Rated'));
    }
    
    // Sorting tambahan (Jika diperlukan)
    if (sortBy === 'newest') {
         // Tidak bisa diurutkan tanpa data joinDate
    }
    
    return finalProviders;
    
  }, [allServices, selectedRating, verificationFilters.topRated, verificationFilters.fastResponse, sortBy]);


  // Handler untuk kategori
  const handleCategoryChange = (name: string, id: number) => {
      setSelectedCategoryName(name);
      setSelectedCategoryId(id === 0 ? null : id);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-10 w-10 text-blue-600" /><p className="ml-4 text-lg">Memuat daftar penyedia...</p></div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-600">Terjadi Kesalahan: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Penyedia Jasa</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Penyedia Jasa Terpercaya</h1>
          <p className="text-gray-600 mt-2">Temukan penyedia jasa profesional dan terpercaya di Karawang</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Keahlian</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.name, category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategoryName === category.name
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">({category.serviceCount})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi (Mock)
                  </label>
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Lokasi</option>
                    <option value="karawang-barat">Karawang Barat</option>
                    <option value="karawang-timur">Karawang Timur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating Minimum
                  </label>
                  <select 
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Rating</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4.0">4.0+ ⭐</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Verifikasi
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={verificationFilters.verified}
                        onChange={(e) => setVerificationFilters(prev => ({ ...prev, verified: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Terverifikasi</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={verificationFilters.topRated}
                        onChange={(e) => setVerificationFilters(prev => ({ ...prev, topRated: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Top Rated</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={verificationFilters.fastResponse}
                        onChange={(e) => setVerificationFilters(prev => ({ ...prev, fastResponse: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Fast Response (Mock)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedCategoryName("Semua");
                      setSelectedCategoryId(null);
                      setSearchQuery("");
                      setSelectedLocation("");
                      setSelectedRating("");
                      setVerificationFilters({ verified: false, topRated: false, fastResponse: false });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                  >
                    Reset
                  </button>
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                    Terapkan Filter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Search and Sort */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari penyedia jasa..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Paling Relevan</option>
                    <option value="rating">Rating Tertinggi</option>
                    <option value="orders">Pesanan Terbanyak (Mock)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-600">
                Menampilkan {normalizedProviders.length} penyedia jasa
                {selectedCategoryName !== "Semua" && ` dalam kategori "${selectedCategoryName}"`}
                {searchQuery && ` dengan pencarian "${searchQuery}"`}
              </p>
            </div>

            {/* Providers Grid */}
            {normalizedProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {normalizedProviders.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="relative">
                        <img
                          src={provider.avatar}
                          alt={provider.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        {provider.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {provider.name}
                        </h3>
                        <div className="flex items-center mb-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900 ml-1">
                            {provider.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            ({provider.reviewCount} ulasan)
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          {provider.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          Respon {provider.responseTime}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {provider.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {provider.badges.map((badge, index) => (
                          <span
                            key={index}
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(badge)}`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {provider.bio || 'Bio provider tidak tersedia.'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{provider.completedOrders}</span> pesanan selesai (Mock)
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Mulai dari</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(provider.startingPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        href={`/providers/${provider.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Lihat Profil
                      </Link>
                      <Link
                        href="/chat"
                        className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Chat Sekarang
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada penyedia jasa ditemukan</h3>
                  <p className="text-gray-500 mb-4">Coba ubah filter atau kata kunci pencarian Anda</p>
                </div>
              </div>
            )}

            {/* Pagination Dihapus */}
          </div>
        </div>
      </div>
    </div>
  );
}