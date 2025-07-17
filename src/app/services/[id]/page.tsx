import Link from "next/link";
import { Star, MapPin, Clock, Shield, Award, MessageCircle, Calendar, ChevronRight, Phone, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Mock data - in real app, fetch from database using params.id
  const service = {
    id: 1,
    title: "Service AC Rumah & Kantor",
    provider: {
      id: 1,
      name: "Ahmad Teknisi",
      avatar: "/api/placeholder/100/100",
      rating: 4.8,
      reviewCount: 156,
      joinDate: "2023-01-15",
      responseTime: "< 1 jam",
      completedOrders: 234,
      phone: "081234567890",
      email: "ahmad@example.com",
      bio: "Teknisi AC berpengalaman 10+ tahun. Spesialis service dan perbaikan AC semua merk. Melayani area Karawang dan sekitarnya."
    },
    category: "Service AC",
    price: 150000,
    priceUnit: "per unit",
    location: "Karawang",
    description: "Layanan service AC profesional untuk rumah dan kantor. Kami melayani service rutin, perbaikan, dan maintenance AC semua merk. Teknisi berpengalaman dengan peralatan lengkap dan modern.",
    features: [
      "Service AC semua merk",
      "Teknisi berpengalaman",
      "Peralatan lengkap",
      "Garansi service",
      "Harga transparan",
      "Pelayanan cepat"
    ],
    images: [
      "/api/placeholder/600/400",
      "/api/placeholder/600/400",
      "/api/placeholder/600/400",
      "/api/placeholder/600/400"
    ],
    portfolio: [
      {
        id: 1,
        title: "Service AC Rumah Pak Budi",
        image: "/api/placeholder/300/200",
        description: "Service AC split 2 unit di rumah Pak Budi"
      },
      {
        id: 2,
        title: "Maintenance AC Kantor",
        image: "/api/placeholder/300/200",
        description: "Maintenance rutin AC kantor 5 unit"
      }
    ],
    reviews: [
      {
        id: 1,
        customer: "Budi Santoso",
        rating: 5,
        comment: "Pelayanan sangat memuaskan. Teknisi datang tepat waktu dan hasil kerjanya bagus.",
        date: "2024-01-10",
        avatar: "/api/placeholder/50/50"
      },
      {
        id: 2,
        customer: "Siti Nurhaliza",
        rating: 4,
        comment: "AC jadi dingin lagi setelah diservice. Harga juga reasonable.",
        date: "2024-01-08",
        avatar: "/api/placeholder/50/50"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Duplicate header hidden because global MainNavbar */}
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
          <Link href="/services" className="hover:text-blue-600">Layanan</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">{service.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Service Images */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="grid grid-cols-2 gap-2 p-4">
                <div className="col-span-2">
                  <img
                    src={service.images[0]}
                    alt={service.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-2">
                  {service.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${service.title} ${index + 2}`}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {service.category}
                </span>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-900 ml-1">
                    {service.provider.rating}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({service.provider.reviewCount} ulasan)
                  </span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h1>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{service.location}</span>
                <Clock className="w-4 h-4 ml-4 mr-2" />
                <span>Respon {service.provider.responseTime}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Deskripsi Layanan</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Yang Anda Dapatkan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {service.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Shield className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Pekerjaan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.portfolio.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ulasan Pelanggan</h3>
              <div className="space-y-4">
                {service.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <img
                        src={review.avatar}
                        alt={review.customer}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{review.customer}</h4>
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
                        <p className="text-sm text-gray-500">{review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Mulai dari</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(service.price)}
                </p>
                <p className="text-sm text-gray-500">{service.priceUnit}</p>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 mb-3">
                Pesan Sekarang
              </button>
              <button className="w-full border border-blue-600 text-blue-600 py-3 px-4 rounded-lg hover:bg-blue-50 mb-4">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Chat Penyedia
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Atau hubungi langsung:</p>
                <div className="flex justify-center space-x-4">
                  <a
                    href={`tel:${service.provider.phone}`}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    <span className="text-sm">Telepon</span>
                  </a>
                  <a
                    href={`mailto:${service.provider.email}`}
                    className="flex items-center text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-sm">Email</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tentang Penyedia</h3>
              
              <div className="flex items-center mb-4">
                <img
                  src={service.provider.avatar}
                  alt={service.provider.name}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{service.provider.name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {service.provider.rating} ({service.provider.reviewCount} ulasan)
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{service.provider.bio}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bergabung sejak</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(service.provider.joinDate).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pesanan selesai</span>
                  <span className="text-sm font-medium text-gray-900">
                    {service.provider.completedOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Waktu respon</span>
                  <span className="text-sm font-medium text-gray-900">
                    {service.provider.responseTime}
                  </span>
                </div>
              </div>

              <Link
                href={`/providers/${service.provider.id}`}
                className="block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 mt-4"
              >
                Lihat Profil Lengkap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
