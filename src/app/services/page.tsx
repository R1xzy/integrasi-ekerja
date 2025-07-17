"use client";

import Link from "next/link";
import { Search, Filter, Star, MapPin, Clock, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState, useMemo } from "react";

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  const categories = [
    { id: 1, name: "Semua", count: 1234 },
    { id: 2, name: "Service AC", count: 156 },
    { id: 3, name: "Jasa Kebersihan", count: 234 },
    { id: 4, name: "Tukang Bangunan", count: 189 },
    { id: 5, name: "Elektronik", count: 145 },
    { id: 6, name: "Plumbing", count: 98 },
    { id: 7, name: "Tukang Kayu", count: 76 },
    { id: 8, name: "Taman & Kebun", count: 67 }
  ];

  const services = [
    {
      id: 1,
      title: "Service AC Rumah & Kantor",
      provider: "Ahmad Teknisi",
      rating: 4.8,
      reviewCount: 156,
      price: 150000,
      location: "Jakarta Selatan",
      image: "/api/placeholder/300/200",
      category: "Service AC",
      description: "Layanan service AC profesional untuk rumah dan kantor. Berpengalaman 10+ tahun.",
      responseTime: "< 1 jam"
    },
    {
      id: 2,
      title: "Jasa Kebersihan Rumah",
      provider: "Budi Cleaning",
      rating: 4.6,
      reviewCount: 89,
      price: 200000,
      location: "Jakarta Pusat",
      image: "/api/placeholder/300/200",
      category: "Jasa Kebersihan",
      description: "Layanan kebersihan rumah menyeluruh dengan peralatan lengkap dan modern.",
      responseTime: "< 2 jam"
    },
    {
      id: 3,
      title: "Renovasi & Bangun Rumah",
      provider: "Candra Tukang",
      rating: 4.9,
      reviewCount: 234,
      price: 500000,
      location: "Bekasi",
      image: "/api/placeholder/300/200",
      category: "Tukang Bangunan",
      description: "Jasa renovasi dan pembangunan rumah dengan kualitas terbaik dan harga terjangkau.",
      responseTime: "< 30 menit"
    },
    {
      id: 4,
      title: "Perbaikan Pipa & Saluran Air",
      provider: "Dedi Plumber",
      rating: 4.5,
      reviewCount: 67,
      price: 300000,
      location: "Tangerang",
      image: "/api/placeholder/300/200",
      category: "Plumbing",
      description: "Spesialis perbaikan pipa, saluran air, dan instalasi plumbing rumah.",
      responseTime: "< 45 menit"
    },
    {
      id: 5,
      title: "Reparasi Elektronik",
      provider: "Eko Elektronik",
      rating: 4.7,
      reviewCount: 123,
      price: 100000,
      location: "Depok",
      image: "/api/placeholder/300/200",
      category: "Elektronik",
      description: "Service dan reparasi berbagai peralatan elektronik rumah tangga.",
      responseTime: "< 1 jam"
    },
    {
      id: 6,
      title: "Furniture & Kayu Custom",
      provider: "Fajar Kayu",
      rating: 4.8,
      reviewCount: 91,
      price: 750000,
      location: "Bogor",
      image: "/api/placeholder/300/200",
      category: "Tukang Kayu",
      description: "Pembuatan furniture custom dan perbaikan perabotan kayu berkualitas tinggi.",
      responseTime: "< 2 jam"
    }
  ];

  // Filter services based on selected category, search query, location, and price range
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      // Category filter
      const categoryMatch = selectedCategory === "Semua" || service.category === selectedCategory;
      
      // Search filter
      const searchMatch = searchQuery === "" || 
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Location filter
      const locationMatch = selectedLocation === "" || 
        service.location.toLowerCase().includes(selectedLocation.toLowerCase());
      
      // Price range filter
      const minPrice = priceRange.min ? parseInt(priceRange.min) : 0;
      const maxPrice = priceRange.max ? parseInt(priceRange.max) : Infinity;
      const priceMatch = service.price >= minPrice && service.price <= maxPrice;
      
      return categoryMatch && searchMatch && locationMatch && priceMatch;
    });
  }, [selectedCategory, searchQuery, selectedLocation, priceRange, services]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Duplicate header hidden because MainNavbar is global */}
<header className="hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-gray-900">E-Kerja Karawang</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600">Beranda</Link>
              <Link href="/services" className="text-blue-600 font-medium">Layanan</Link>
              <Link href="/providers" className="text-gray-700 hover:text-blue-600">Penyedia</Link>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">Tentang</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-blue-600">Masuk</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Layanan</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Temukan Layanan Terbaik</h1>
          <p className="text-gray-600 mt-2">Pilih dari ratusan penyedia jasa terpercaya di Karawang dan sekitarnya</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategori Layanan</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokasi
                  </label>
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Lokasi</option>
                    <option value="jakarta">Jakarta</option>
                    <option value="bekasi">Bekasi</option>
                    <option value="tangerang">Tangerang</option>
                    <option value="depok">Depok</option>
                    <option value="bogor">Bogor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rentang Harga
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating Minimum
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Semua Rating</option>
                    <option value="4.5">4.5+ ⭐</option>
                    <option value="4.0">4.0+ ⭐</option>
                    <option value="3.5">3.5+ ⭐</option>
                    <option value="3.0">3.0+ ⭐</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSelectedCategory("Semua");
                      setSearchQuery("");
                      setSelectedLocation("");
                      setPriceRange({ min: "", max: "" });
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
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
                      placeholder="Cari layanan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="relevance">Paling Relevan</option>
                    <option value="rating">Rating Tertinggi</option>
                    <option value="price_low">Harga Terendah</option>
                    <option value="price_high">Harga Tertinggi</option>
                    <option value="newest">Terbaru</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-600">
                Menampilkan {filteredServices.length} layanan
                {selectedCategory !== "Semua" && ` dalam kategori "${selectedCategory}"`}
                {searchQuery && ` untuk pencarian "${searchQuery}"`}
              </p>
            </div>

            {/* Services Grid */}
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {service.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900 ml-1">
                          {service.rating}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({service.reviewCount} ulasan)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {service.location}
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Clock className="w-4 h-4 mr-1" />
                      Respon {service.responseTime}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Mulai dari</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                      <Link
                        href={`/services/${service.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Lihat Detail
                      </Link>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {service.provider.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {service.provider}
                          </p>
                          <p className="text-xs text-gray-500">Penyedia Jasa</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada layanan ditemukan</h3>
                <p className="text-gray-500 mb-4">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
                <button 
                  onClick={() => {
                    setSelectedCategory("Semua");
                    setSearchQuery("");
                    setSelectedLocation("");
                    setPriceRange({ min: "", max: "" });
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredServices.length > 0 && (
              <div className="mt-8 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                    2
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    3
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
