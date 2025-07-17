"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Star, ShoppingBag } from "lucide-react";
import ProviderNavbar from "@/components/provider/ProviderNavbar";

export default function ProviderServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const services = [
    {
      id: 1,
      title: "Service AC Rumah",
      category: "AC",
      price: 150000,
      description: "Service lengkap AC rumah termasuk pembersihan filter dan pengecekan freon",
      image: "/api/placeholder/300/200",
      isActive: true,
      orders: 23,
      rating: 4.8,
      reviews: 15,
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Perbaikan AC Split",
      category: "AC",
      price: 200000,
      description: "Perbaikan AC split untuk berbagai kerusakan seperti bocor, tidak dingin, dll",
      image: "/api/placeholder/300/200",
      isActive: true,
      orders: 15,
      rating: 4.9,
      reviews: 12,
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      title: "Maintenance AC Rutin",
      category: "AC",
      price: 100000,
      description: "Maintenance rutin bulanan untuk menjaga performa AC tetap optimal",
      image: "/api/placeholder/300/200",
      isActive: true,
      orders: 9,
      rating: 4.7,
      reviews: 8,
      createdAt: "2024-01-05"
    },
    {
      id: 4,
      title: "Instalasi AC Baru",
      category: "AC",
      price: 300000,
      description: "Instalasi AC baru lengkap dengan pipa dan kabel",
      image: "/api/placeholder/300/200",
      isActive: false,
      orders: 5,
      rating: 4.6,
      reviews: 4,
      createdAt: "2024-01-01"
    }
  ];

  const categories = [
    { value: "all", label: "Semua Kategori" },
    { value: "AC", label: "AC" },
    { value: "Elektronik", label: "Elektronik" },
    { value: "Plumbing", label: "Plumbing" },
    { value: "Listrik", label: "Listrik" }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleToggleService = (serviceId: number) => {
    console.log("Toggle service:", serviceId);
    // Implementasi toggle service status
  };

  const handleEditService = (serviceId: number) => {
    console.log("Edit service:", serviceId);
    // Implementasi edit service
  };

  const handleDeleteService = (serviceId: number) => {
    console.log("Delete service:", serviceId);
    // Implementasi delete service
  };

  const handleViewService = (serviceId: number) => {
    console.log("View service:", serviceId);
    // Implementasi view service detail
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Layanan Saya</h1>
            <p className="text-gray-600 mt-2">Kelola layanan yang Anda tawarkan</p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-5 h-5 mr-2" />
            Tambah Layanan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Layanan</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ToggleRight className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Layanan Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rating Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {services.reduce((total, service) => total + service.orders, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari layanan..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleToggleService(service.id)}
                    className={`p-2 rounded-full ${
                      service.isActive 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {service.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    service.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {service.title}
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {service.rating} ({service.reviews} ulasan)
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {service.orders} pesanan
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(service.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dibuat {formatDate(service.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewService(service.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    Lihat
                  </button>
                  <button
                    onClick={() => handleEditService(service.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada layanan ditemukan</h3>
            <p className="text-gray-600 mb-4">Coba ubah filter atau kata kunci pencarian</p>
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Tambah Layanan Pertama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
