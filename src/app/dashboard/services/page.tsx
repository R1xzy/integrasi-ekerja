"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

export default function ServicesManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data untuk services
  const services = [
    {
      id: 1,
      title: "Service AC Rumah",
      category: "Service AC",
      provider: "Ahmad Teknisi",
      providerEmail: "ahmad@example.com",
      price: 150000,
      rating: 4.8,
      totalReviews: 45,
      status: "active",
      location: "Karawang Barat",
      createdAt: "2024-01-15",
      lastUpdated: "2024-01-20",
      description: "Layanan service AC untuk rumah dengan teknisi berpengalaman",
      image: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Pembersihan Rumah Lengkap",
      category: "Jasa Kebersihan",
      provider: "Siti Cleaning Service",
      providerEmail: "siti@example.com",
      price: 200000,
      rating: 4.9,
      totalReviews: 67,
      status: "active",
      location: "Karawang Timur",
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-18",
      description: "Jasa pembersihan rumah menyeluruh dengan peralatan lengkap",
      image: "/api/placeholder/300/200"
    },
    {
      id: 3,
      title: "Renovasi Kamar Mandi",
      category: "Tukang Bangunan",
      provider: "Budi Konstruksi",
      providerEmail: "budi@example.com",
      price: 2500000,
      rating: 4.7,
      totalReviews: 23,
      status: "pending",
      location: "Karawang Tengah",
      createdAt: "2024-01-12",
      lastUpdated: "2024-01-19",
      description: "Layanan renovasi kamar mandi dengan material berkualitas",
      image: "/api/placeholder/300/200"
    },
    {
      id: 4,
      title: "Perbaikan TV LED",
      category: "Elektronik",
      provider: "Elektronik Jaya",
      providerEmail: "jaya@example.com",
      price: 100000,
      rating: 4.6,
      totalReviews: 34,
      status: "inactive",
      location: "Karawang Barat",
      createdAt: "2024-01-08",
      lastUpdated: "2024-01-16",
      description: "Service dan perbaikan TV LED semua merk",
      image: "/api/placeholder/300/200"
    },
    {
      id: 5,
      title: "Instalasi Pipa Air",
      category: "Plumbing",
      provider: "Tukang Pipa Pro",
      providerEmail: "pipa@example.com",
      price: 300000,
      rating: 4.8,
      totalReviews: 56,
      status: "active",
      location: "Karawang Selatan",
      createdAt: "2024-01-14",
      lastUpdated: "2024-01-21",
      description: "Instalasi dan perbaikan sistem pipa air bersih",
      image: "/api/placeholder/300/200"
    }
  ];

  const categories = [
    { value: "all", label: "Semua Kategori" },
    { value: "Service AC", label: "Service AC" },
    { value: "Jasa Kebersihan", label: "Jasa Kebersihan" },
    { value: "Tukang Bangunan", label: "Tukang Bangunan" },
    { value: "Elektronik", label: "Elektronik" },
    { value: "Plumbing", label: "Plumbing" },
    { value: "Tukang Kayu", label: "Tukang Kayu" }
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "pending", label: "Menunggu" },
    { value: "inactive", label: "Tidak Aktif" }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || service.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aktif</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Menunggu</span>;
      case "inactive":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Tidak Aktif</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Layanan</h1>
          <p className="text-gray-600 mt-2">Kelola semua layanan yang tersedia di platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Layanan</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Layanan Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Menunggu Review</p>
                <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.status === 'pending').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tidak Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.status === 'inactive').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari layanan, penyedia, atau kategori..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Layanan
              </button>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Layanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penyedia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                          <div className="text-sm text-gray-500">{service.description.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{service.provider}</div>
                      <div className="text-sm text-gray-500">{service.providerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{service.rating}</span>
                        <span className="text-sm text-gray-500 ml-1">({service.totalReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(service.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {service.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">1</span> sampai <span className="font-medium">{filteredServices.length}</span> dari{' '}
                <span className="font-medium">{filteredServices.length}</span> hasil
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-5 w-5 -rotate-90" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
