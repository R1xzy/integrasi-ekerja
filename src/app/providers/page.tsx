import Link from "next/link";
import { Search, Filter, Star, MapPin, Clock, ChevronRight, Award, Shield } from "lucide-react";

export default function ProvidersPage() {
  const categories = [
    { id: 1, name: "Semua", count: 456, active: true },
    { id: 2, name: "Service AC", count: 89, active: false },
    { id: 3, name: "Jasa Kebersihan", count: 76, active: false },
    { id: 4, name: "Tukang Bangunan", count: 65, active: false },
    { id: 5, name: "Elektronik", count: 54, active: false },
    { id: 6, name: "Plumbing", count: 43, active: false },
    { id: 7, name: "Tukang Kayu", count: 32, active: false },
    { id: 8, name: "Taman & Kebun", count: 28, active: false }
  ];

  const providers = [
    {
      id: 1,
      name: "Ahmad Teknisi",
      avatar: "/api/placeholder/100/100",
      specialties: ["Service AC", "Elektronik"],
      rating: 4.8,
      reviewCount: 156,
      completedOrders: 234,
      location: "Karawang Barat",
      responseTime: "< 1 jam",
      startingPrice: 150000,
      isVerified: true,
      joinDate: "2023-01-15",
      bio: "Teknisi AC berpengalaman 10+ tahun. Spesialis service dan perbaikan AC semua merk.",
      badges: ["Top Rated", "Fast Response"]
    },
    {
      id: 2,
      name: "Budi Cleaning Service",
      avatar: "/api/placeholder/100/100",
      specialties: ["Jasa Kebersihan"],
      rating: 4.6,
      reviewCount: 89,
      completedOrders: 167,
      location: "Karawang Timur",
      responseTime: "< 2 jam",
      startingPrice: 200000,
      isVerified: true,
      joinDate: "2023-03-20",
      bio: "Layanan kebersihan profesional untuk rumah dan kantor dengan peralatan modern.",
      badges: ["Verified", "Eco Friendly"]
    },
    {
      id: 3,
      name: "Candra Tukang Bangunan",
      avatar: "/api/placeholder/100/100",
      specialties: ["Tukang Bangunan", "Tukang Kayu"],
      rating: 4.9,
      reviewCount: 234,
      completedOrders: 345,
      location: "Karawang Tengah",
      responseTime: "< 30 menit",
      startingPrice: 500000,
      isVerified: true,
      joinDate: "2022-11-10",
      bio: "Kontraktor bangunan berpengalaman dengan tim profesional dan peralatan lengkap.",
      badges: ["Top Rated", "Expert", "Fast Response"]
    },
    {
      id: 4,
      name: "Dedi Plumber",
      avatar: "/api/placeholder/100/100",
      specialties: ["Plumbing"],
      rating: 4.5,
      reviewCount: 67,
      completedOrders: 123,
      location: "Karawang Utara",
      responseTime: "< 45 menit",
      startingPrice: 300000,
      isVerified: true,
      joinDate: "2024-01-05",
      bio: "Spesialis perbaikan pipa dan instalasi plumbing dengan garansi kerja.",
      badges: ["Verified", "Warranty"]
    },
    {
      id: 5,
      name: "Eko Elektronik",
      avatar: "/api/placeholder/100/100",
      specialties: ["Elektronik", "Service AC"],
      rating: 4.7,
      reviewCount: 123,
      completedOrders: 189,
      location: "Karawang Barat",
      responseTime: "< 1 jam",
      startingPrice: 100000,
      isVerified: false,
      joinDate: "2023-08-15",
      bio: "Service dan reparasi peralatan elektronik rumah tangga dengan harga terjangkau.",
      badges: ["Affordable"]
    },
    {
      id: 6,
      name: "Fajar Furniture",
      avatar: "/api/placeholder/100/100",
      specialties: ["Tukang Kayu"],
      rating: 4.8,
      reviewCount: 91,
      completedOrders: 156,
      location: "Karawang Timur",
      responseTime: "< 2 jam",
      startingPrice: 750000,
      isVerified: true,
      joinDate: "2023-05-10",
      bio: "Pembuat furniture custom dan perbaikan perabotan kayu berkualitas tinggi.",
      badges: ["Top Rated", "Custom Work"]
    }
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Top Rated':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-green-100 text-green-800';
      case 'Fast Response':
        return 'bg-blue-100 text-blue-800';
      case 'Expert':
        return 'bg-purple-100 text-purple-800';
      case 'Eco Friendly':
        return 'bg-green-100 text-green-800';
      case 'Warranty':
        return 'bg-indigo-100 text-indigo-800';
      case 'Affordable':
        return 'bg-orange-100 text-orange-800';
      case 'Custom Work':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
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
              <Link href="/services" className="text-gray-700 hover:text-blue-600">Layanan</Link>
              <Link href="/providers" className="text-blue-600 font-medium">Penyedia</Link>
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
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      category.active
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
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Semua Lokasi</option>
                    <option value="karawang-barat">Karawang Barat</option>
                    <option value="karawang-timur">Karawang Timur</option>
                    <option value="karawang-tengah">Karawang Tengah</option>
                    <option value="karawang-utara">Karawang Utara</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Verifikasi
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Terverifikasi</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Top Rated</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Fast Response</span>
                    </label>
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                  Terapkan Filter
                </button>
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
                      placeholder="Cari penyedia jasa..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="relevance">Paling Relevan</option>
                    <option value="rating">Rating Tertinggi</option>
                    <option value="orders">Pesanan Terbanyak</option>
                    <option value="response">Respon Tercepat</option>
                    <option value="newest">Terbaru</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((provider) => (
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
                            {provider.rating}
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
                      {provider.bio}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{provider.completedOrders}</span> pesanan selesai
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Mulai dari</p>
                        <p className="text-lg font-bold text-blue-600">
                          Rp {provider.startingPrice.toLocaleString('id-ID')}
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
                      <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                        Chat Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
