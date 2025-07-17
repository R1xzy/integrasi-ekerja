"use client";

import { useState } from "react";
import { Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle, Phone, MapPin } from "lucide-react";
import ProviderNavbar from "@/components/provider/ProviderNavbar";

export default function ProviderOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const orders = [
    {
      id: "ORD-001",
      customer: "John Doe",
      customerPhone: "081234567890",
      service: "Service AC",
      location: "Karawang Barat",
      amount: 150000,
      status: "pending",
      date: "2024-01-20",
      time: "09:00",
      description: "AC tidak dingin, perlu dicek freon dan filter",
      urgent: false
    },
    {
      id: "ORD-002",
      customer: "Jane Smith",
      customerPhone: "081234567891",
      service: "Perbaikan AC Split",
      location: "Karawang Timur",
      amount: 200000,
      status: "accepted",
      date: "2024-01-19",
      time: "14:00",
      description: "AC bocor air, kompressor berisik",
      urgent: true
    },
    {
      id: "ORD-003",
      customer: "Bob Johnson",
      customerPhone: "081234567892",
      service: "Maintenance AC Rutin",
      location: "Karawang Tengah",
      amount: 100000,
      status: "in_progress",
      date: "2024-01-18",
      time: "10:30",
      description: "Maintenance rutin bulanan",
      urgent: false
    },
    {
      id: "ORD-004",
      customer: "Alice Brown",
      customerPhone: "081234567893",
      service: "Service AC",
      location: "Karawang Utara",
      amount: 150000,
      status: "completed",
      date: "2024-01-17",
      time: "13:00",
      description: "Service AC ruang tamu",
      urgent: false
    },
    {
      id: "ORD-005",
      customer: "Charlie Wilson",
      customerPhone: "081234567894",
      service: "Perbaikan AC Split",
      location: "Karawang Selatan",
      amount: 250000,
      status: "cancelled",
      date: "2024-01-16",
      time: "11:00",
      description: "Ganti kompressor AC",
      urgent: false
    }
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Menunggu Konfirmasi" },
    { value: "accepted", label: "Diterima" },
    { value: "in_progress", label: "Sedang Dikerjakan" },
    { value: "completed", label: "Selesai" },
    { value: "cancelled", label: "Dibatalkan" }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Diterima
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Dikerjakan
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Dibatalkan
          </span>
        );
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

  const handleAcceptOrder = (orderId: string) => {
    console.log("Accept order:", orderId);
    // Implementasi accept order
  };

  const handleRejectOrder = (orderId: string) => {
    console.log("Reject order:", orderId);
    // Implementasi reject order
  };

  const handleCompleteOrder = (orderId: string) => {
    console.log("Complete order:", orderId);
    // Implementasi complete order
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Masuk</h1>
          <p className="text-gray-600 mt-2">Kelola pesanan dari pelanggan</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diterima</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dikerjakan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'completed').length}
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
                    placeholder="Cari pesanan, pelanggan..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.service}</h3>
                      {order.urgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Urgent
                        </span>
                      )}
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Pelanggan</p>
                        <p className="font-medium text-gray-900">{order.customer}</p>
                        <div className="flex items-center mt-1">
                          <Phone className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-600">{order.customerPhone}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">Lokasi & Waktu</p>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{order.location}</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(order.date)} - {order.time}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Deskripsi</p>
                      <p className="text-gray-900">{order.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(order.amount)}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleRejectOrder(order.id)}
                              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Terima
                            </button>
                          </>
                        )}
                        
                        {order.status === 'accepted' && (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Mulai Kerjakan
                          </button>
                        )}
                        
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Selesaikan
                          </button>
                        )}
                        
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4 inline mr-1" />
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pesanan ditemukan</h3>
            <p className="text-gray-600">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>
    </div>
  );
}
