import Link from "next/link";
import { ChevronRight, Users, Award, Shield, Clock, MapPin, Phone, Mail } from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Penyedia Jasa", value: "500+", icon: Users },
    { label: "Pesanan Selesai", value: "10,000+", icon: Award },
    { label: "Kota Terlayani", value: "1", icon: MapPin },
    { label: "Tahun Pengalaman", value: "2+", icon: Clock }
  ];

  const features = [
    {
      icon: Shield,
      title: "Penyedia Terverifikasi",
      description: "Semua penyedia jasa telah melalui proses verifikasi ketat untuk memastikan kualitas layanan terbaik."
    },
    {
      icon: Clock,
      title: "Respon Cepat",
      description: "Dapatkan respon dari penyedia jasa dalam waktu kurang dari 1 jam untuk kebutuhan mendesak."
    },
    {
      icon: Award,
      title: "Kualitas Terjamin",
      description: "Sistem rating dan review membantu Anda memilih penyedia jasa dengan track record terbaik."
    },
    {
      icon: Users,
      title: "Komunitas Terpercaya",
      description: "Bergabung dengan ribuan pengguna yang telah merasakan kemudahan layanan kami."
    }
  ];

  const partners = [
    {
      name: "Politeknik Negeri Bandung",
      role: "Mitra Pendidikan",
      image: "/api/placeholder/150/150",
      description: "Institusi pendidikan tinggi yang mendukung pengembangan SDM berkualitas di bidang teknologi dan keterampilan."
    },
    {
      name: "Dinas Tenaga Kerja dan Transmigrasi",
      role: "Mitra Pemerintah",
      image: "/api/placeholder/150/150",
      description: "Kabupaten Karawang - Mendukung program pelatihan dan sertifikasi tenaga kerja lokal."
    }
  ];

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
              <Link href="/providers" className="text-gray-700 hover:text-blue-600">Penyedia</Link>
              <Link href="/about" className="text-blue-600 font-medium">Tentang</Link>
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
          <span className="text-gray-900">Tentang Kami</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tentang <span className="text-blue-600">E-Kerja Karawang</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Platform digital yang menghubungkan masyarakat Karawang dengan penyedia jasa profesional 
            dan terpercaya untuk berbagai kebutuhan rumah tangga dan bisnis.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <stat.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Misi Kami</h2>
            <p className="text-gray-600 leading-relaxed">
              Memudahkan masyarakat Karawang dalam menemukan dan menggunakan jasa profesional 
              berkualitas tinggi melalui platform digital yang aman, terpercaya, dan mudah digunakan. 
              Kami berkomitmen untuk mendukung pertumbuhan ekonomi lokal dengan memberdayakan 
              para penyedia jasa di Karawang.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Visi Kami</h2>
            <p className="text-gray-600 leading-relaxed">
              Menjadi platform jasa terdepan di Karawang yang menghubungkan kebutuhan masyarakat 
              dengan solusi terbaik, menciptakan ekosistem digital yang berkelanjutan, dan 
              meningkatkan kualitas hidup masyarakat melalui akses mudah terhadap layanan 
              profesional berkualitas.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Kami menyediakan platform yang aman, mudah, dan terpercaya untuk semua kebutuhan jasa Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mitra Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Didukung oleh institusi terpercaya yang berkomitmen mengembangkan SDM Karawang
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {partners.map((partner, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 text-center">
                <img
                  src={partner.image}
                  alt={partner.name}
                  className="w-32 h-32 rounded-lg mx-auto mb-6 object-cover"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{partner.name}</h3>
                <p className="text-blue-600 font-medium mb-4">{partner.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
            <p className="text-gray-600">
              Ada pertanyaan atau saran? Jangan ragu untuk menghubungi tim kami
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Alamat</h3>
              <p className="text-gray-600">
                Jl. Raya Karawang No. 123<br />
                Karawang Barat, Karawang<br />
                Jawa Barat 41311
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Telepon</h3>
              <p className="text-gray-600">
                <a href="tel:+62267123456" className="hover:text-blue-600">
                  +62 267 123 456
                </a><br />
                <a href="tel:+6281234567890" className="hover:text-blue-600">
                  +62 812 3456 7890
                </a>
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:info@ekerjakarawang.com" className="hover:text-blue-600">
                  info@ekerjakarawang.com
                </a><br />
                <a href="mailto:support@ekerjakarawang.com" className="hover:text-blue-600">
                  support@ekerjakarawang.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold">E-Kerja Karawang</span>
              </div>
              <p className="text-gray-400 mb-4">
                Platform terpercaya untuk menemukan penyedia jasa profesional di Karawang.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Layanan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/services" className="hover:text-white">Semua Layanan</Link></li>
                <li><Link href="/providers" className="hover:text-white">Penyedia Jasa</Link></li>
                <li><Link href="/about" className="hover:text-white">Tentang Kami</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Bantuan</a></li>
                <li><a href="#" className="hover:text-white">Kontak</a></li>
                <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 E-Kerja Karawang. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
