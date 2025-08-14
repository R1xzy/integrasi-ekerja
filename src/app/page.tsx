"use client";

import Link from "next/link";
import { Search, Star, Shield, Clock, Users } from "lucide-react";
import MainNavbar from "@/components/MainNavbar";


export default function Home() {

  const categories = [
    { name: "Service AC", icon: "❄️", count: "150+ Penyedia" },
    { name: "Jasa Kebersihan", icon: "🧹", count: "200+ Penyedia" },
    { name: "Tukang Bangunan", icon: "🔨", count: "180+ Penyedia" },
    { name: "Elektronik", icon: "⚡", count: "120+ Penyedia" },
    { name: "Plumbing", icon: "🔧", count: "90+ Penyedia" },
    { name: "Tukang Kayu", icon: "🪵", count: "80+ Penyedia" },
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Penyedia Terverifikasi",
      description: "Semua penyedia jasa telah melalui proses verifikasi ketat"
    },
    {
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      title: "Review Terpercaya",
      description: "Sistem review dari pelanggan nyata untuk membantu pilihan Anda"
    },
    {
      icon: <Clock className="w-8 h-8 text-green-600" />,
      title: "Layanan Cepat",
      description: "Dapatkan respon cepat dan jadwal yang fleksibel"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Dukungan 24/7",
      description: "Tim customer service siap membantu Anda kapan saja"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Temukan Jasa Terpercaya di
            <span className="text-blue-600"> Karawang</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Platform terpercaya untuk menghubungkan Anda dengan penyedia jasa profesional di Karawang
          </p>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Dari service AC hingga renovasi rumah, semua ada di sini.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari layanan yang Anda butuhkan..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Cari
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Penyedia Jasa</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Kategori Layanan</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Pelanggan Puas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Kategori Layanan Populer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Mengapa Memilih E-Kerja Karawang?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Siap Memulai?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabunglah dengan ribuan pelanggan yang telah merasakan kemudahan layanan kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="duration-300 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Daftar Sebagai Pelanggan
            </Link>
            <Link href="/provider/register" className="duration-300 bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800">
              Daftar Sebagai Penyedia
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  );
}
