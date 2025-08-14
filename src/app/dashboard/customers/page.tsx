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
  MoreHorizontal,
  Mail,
  Phone,
  Calendar
} from "lucide-react";


export default function CustomersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data untuk customers
  const customers = [
    {
      id: 1,
      fullName: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+62 812-3456-7890",
      address: "Jl. Merdeka No. 123, Karawang Barat",
      profilePictureUrl: "/api/placeholder/100/100",
      status: "active",
      totalOrders: 12,
      totalSpent: 2500000,
      lastOrderDate: "2024-01-20",
      joinDate: "2023-06-15",
      averageRating: 4.8,
      favoriteCategory: "Service AC"
    },
    {
      id: 2,
      fullName: "Jane Smith",
      email: "jane.smith@example.com",
      phoneNumber: "+62 813-9876-5432",
      address: "Jl. Sudirman No. 456, Karawang Timur",
      profilePictureUrl: "/api/placeholder/100/100",
      status: "active",
      totalOrders: 8,
      totalSpent: 1800000,
      lastOrderDate: "2024-01-18",
      joinDate: "2023-08-22",
      averageRating: 4.9,
      favoriteCategory: "Jasa Kebersihan"
    },
    {
      id: 3,
      fullName: "Bob Johnson",
      email: "bob.johnson@example.com",
      phoneNumber: "+62 814-5555-1234",
      address: "Jl. Gatot Subroto No. 789, Karawang Tengah",
      profilePictureUrl: "/api/placeholder/100/100",
      status: "inactive",
      totalOrders: 3,
      totalSpent: 750000,
      lastOrderDate: "2023-12-10",
      joinDate: "2023-09-05",
      averageRating: 4.5,
      favoriteCategory: "Tukang Bangunan"
    },
    {
      id: 4,
      fullName: "Alice Brown",
      email: "alice.brown@example.com",
      phoneNumber: "+62 815-7777-8888",
      address: "Jl. Ahmad Yani No. 321, Karawang Selatan",
      profilePictureUrl: "/api/placeholder/100/100",
      status: "active",
      totalOrders: 15,
      totalSpent: 3200000,
      lastOrderDate: "2024-01-22",
      joinDate: "2023-05-10",
      averageRating: 4.7,
      favoriteCategory: "Plumbing"
    },
    {
      id: 5,
      fullName: "Charlie Wilson",
      email: "charlie.wilson@example.com",
      phoneNumber: "+62 816-4444-9999",
      address: "Jl. Diponegoro No. 654, Karawang Utara",
      profilePictureUrl: "/api/placeholder/100/100",
      status: "suspended",
      totalOrders: 2,
      totalSpent: 400000,
      lastOrderDate: "2023-11-15",
      joinDate: "2023-10-01",
      averageRating: 3.8,
      favoriteCategory: "Elektronik"
    }
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Aktif" },
    { value: "inactive", label: "Tidak Aktif" },
    { value: "suspended", label: "Ditangguhkan" }
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phoneNumber.includes(searchTerm);
    const matchesStatus = selectedStatus === "all" || customer.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aktif</span>;
      case "inactive":
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Tidak Aktif</span>;
      case "suspended":
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Ditangguhkan</span>;
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
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pelanggan</h1>
          <p className="text-gray-600 mt-2">Kelola semua pelanggan yang terdaftar di platform</p>
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
                <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pelanggan Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rating Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(customers.reduce((sum, c) => sum + c.averageRating, 0) / customers.length).toFixed(1)}
                </p>
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
                  placeholder="Cari pelanggan berdasarkan nama, email, atau nomor telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=" text-gray-600 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className=" text-gray-600 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pelanggan
              </button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Belanja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={customer.profilePictureUrl}
                          alt={customer.fullName}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                          <div className="text-sm text-gray-500">{customer.favoriteCategory}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.phoneNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalOrders} pesanan
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{customer.averageRating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {formatDate(customer.joinDate)}
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
                Menampilkan <span className="font-medium">1</span> sampai <span className="font-medium">{filteredCustomers.length}</span> dari{' '}
                <span className="font-medium">{filteredCustomers.length}</span> hasil
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
