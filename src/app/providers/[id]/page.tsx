import Link from "next/link";
import { Star, MapPin, Clock, Shield, Award, MessageCircle, Calendar, ChevronRight, Phone, Mail, CheckCircle, Users, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Mock data - in real app, fetch from database using params.id
  const provider = {
    id: 1,
    name: "Ahmad Teknisi",
    avatar: "/api/placeholder/150/150",
    coverImage: "/api/placeholder/800/300",
    rating: 4.8,
    reviewCount: 156,
    completedOrders: 234,
    location: "Karawang Barat",
    responseTime: "< 1 jam",
    joinDate: "2023-01-15",
    phone: "081234567890",
    email: "ahmad@example.com",
    isVerified: true,
    bio: "Teknisi AC berpengalaman 10+ tahun. Spesialis service dan perbaikan AC semua merk. Melayani area Karawang dan sekitarnya dengan pelayanan profesional dan harga terjangkau.",
    specialties: ["Service AC", "Elektronik", "Kulkas", "Mesin Cuci"],
    badges: ["Top Rated", "Fast Response", "Verified"],
    workingHours: {
      monday: "08:00 - 17:00",
      tuesday: "08:00 - 17:00",
      wednesday: "08:00 - 17:00",
      thursday: "08:00 - 17:00",
      friday: "08:00 - 17:00",
      saturday: "08:00 - 15:00",
      sunday: "Tutup"
    },
    services: [
      {
        id: 1,
        title: "Service AC Rumah & Kantor",
        price: 150000,
        priceUnit: "per unit",
        description: "Service AC rutin untuk semua merk",
        image: "/api/placeholder/300/200"
      },
      {
        id: 2,
        title: "Perbaikan Kulkas",
        price: 200000,
        priceUnit: "per unit",
        description: "Perbaikan kulkas tidak dingin, bocor, dll",
        image: "/api/placeholder/300/200"
      },
      {
        id: 3,
        title: "Service Mesin Cuci",
        price: 175000,
        priceUnit: "per unit",
        description: "Service mesin cuci semua merk dan tipe",
        image: "/api/placeholder/300/200"
      }
    ],
    portfolio: [
      {
        id: 1,
        title: "Service AC Rumah Pak Budi",
        image: "/api/placeholder/400/300",
        description: "Service AC split 2 unit di rumah Pak Budi, Karawang Barat",
        completedDate: "2024-01-10"
      },
      {
        id: 2,
        title: "Maintenance AC Kantor",
        image: "/api/placeholder/400/300",
        description: "Maintenance rutin AC kantor 5 unit PT. ABC",
        completedDate: "2024-01-08"
      },
      {
        id: 3,
        title: "Perbaikan Kulkas Restoran",
        image: "/api/placeholder/400/300",
        description: "Perbaikan kulkas showcase restoran",
        completedDate: "2024-01-05"
      },
      {
        id: 4,
        title: "Instalasi AC Baru",
        image: "/api/placeholder/400/300",
        description: "Instalasi AC split baru di rumah Ibu Sari",
        completedDate: "2024-01-03"
      }
    ],
    reviews: [
      {
        id: 1,
        customer: "Budi Santoso",
        rating: 5,
        comment: "Pelayanan sangat memuaskan. Teknisi datang tepat waktu dan hasil kerjanya bagus. AC jadi dingin lagi seperti baru.",
        date: "2024-01-10",
        avatar: "/api/placeholder/50/50",
        service: "Service AC Rumah & Kantor"
      },
      {
        id: 2,
        customer: "Siti Nurhaliza",
        rating: 4,
        comment: "AC jadi dingin lagi setelah diservice. Harga juga reasonable. Akan pakai jasa lagi kalau ada masalah.",
        date: "2024-01-08",
        avatar: "/api/placeholder/50/50",
        service: "Service AC Rumah & Kantor"
      },
      {
        id: 3,
        customer: "Andi Wijaya",
        rating: 5,
        comment: "Kulkas yang sudah rusak 2 minggu langsung bisa dipakai lagi. Terima kasih pak Ahmad!",
        date: "2024-01-05",
        avatar: "/api/placeholder/50/50",
        service: "Perbaikan Kulkas"
      }
    ],
    certifications: [
      {
        id: 1,
        name: "Sertifikat Teknisi AC",
        issuer: "Asosiasi Teknisi Indonesia",
        year: "2023"
      },
      {
        id: 2,
        name: "Sertifikat Keselamatan Kerja",
        issuer: "Kementerian Tenaga Kerja",
        year: "2023"
      }
    ]
  };

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
          <Link href="/providers" className="hover:text-blue-600">Penyedia</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{provider.name}</span>
        </nav>

        {/* Provider Header */}
        <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 relative">
            <img
              src={provider.coverImage}
              alt="Cover"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              <div className="relative -mt-20 mb-4 md:mb-0">
                <div className="relative">
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  {provider.isVerified && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{provider.name}</h1>
                    <div className="flex items-center mb-3">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-medium text-gray-900 ml-1">
                        {provider.rating}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({provider.reviewCount} ulasan)
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{provider.location}</span>
                      <Clock className="w-4 h-4 ml-4 mr-2" />
                      <span>Respon {provider.responseTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {provider.badges.map((badge, index) => (
                        <span
                          key={index}
                          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getBadgeColor(badge)}`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 md:ml-4">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat Sekarang
                    </button>
                    <div className="flex space-x-2">
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-600 rounded-lg"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        <span className="text-sm">Telepon</span>
                      </a>
                      <a
                        href={`mailto:${provider.email}`}
                        className="flex items-center text-blue-600 hover:text-blue-700 px-3 py-1 border border-blue-600 rounded-lg"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        <span className="text-sm">Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tentang Penyedia</h2>
              <p className="text-gray-600 leading-relaxed mb-4">{provider.bio}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{provider.completedOrders}</div>
                  <div className="text-sm text-gray-600">Pesanan Selesai</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{provider.reviewCount}</div>
                  <div className="text-sm text-gray-600">Ulasan Positif</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{provider.rating}</div>
                  <div className="text-sm text-gray-600">Rating Rata-rata</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Keahlian</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Layanan yang Ditawarkan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {provider.services.map((service) => (
                  <div key={service.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(service.price)}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            {service.priceUnit}
                          </span>
                        </div>
                        <Link
                          href={`/services/${service.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Pekerjaan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {provider.portfolio.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        Selesai: {new Date(item.completedDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ulasan Pelanggan</h2>
              <div className="space-y-6">
                {provider.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.avatar}
                        alt={review.customer}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.customer}</h4>
                            <p className="text-sm text-gray-500">{review.service}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{review.comment}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bergabung sejak</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(provider.joinDate).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Waktu respon</span>
                  <span className="text-sm font-medium text-gray-900">
                    {provider.responseTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aktif
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Jam Kerja</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Senin - Jumat</span>
                    <span className="text-gray-900">{provider.workingHours.monday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sabtu</span>
                    <span className="text-gray-900">{provider.workingHours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minggu</span>
                    <span className="text-gray-900">{provider.workingHours.sunday}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sertifikasi</h3>
              <div className="space-y-3">
                {provider.certifications.map((cert) => (
                  <div key={cert.id} className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{cert.name}</h4>
                      <p className="text-xs text-gray-600">{cert.issuer} • {cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
