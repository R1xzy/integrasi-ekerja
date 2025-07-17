import { BarChart3, Users, ShoppingBag, Star, TrendingUp, Calendar, Clock, CheckCircle } from "lucide-react";
import ProviderNavbar from "@/components/provider/ProviderNavbar";

export default function ProviderDashboard() {
  const stats = [
    {
      title: "Total Pesanan",
      value: "47",
      change: "+12%",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "bg-blue-500"
    },
    {
      title: "Pesanan Aktif",
      value: "8",
      change: "+3",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-yellow-500"
    },
    {
      title: "Rating Rata-rata",
      value: "4.8",
      change: "+0.1",
      icon: <Star className="w-6 h-6" />,
      color: "bg-green-500"
    },
    {
      title: "Pendapatan Bulan Ini",
      value: "Rp 8.5M",
      change: "+25%",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-purple-500"
    }
  ];

  const recentOrders = [
    { 
      id: "ORD-001", 
      customer: "John Doe", 
      service: "Service AC", 
      amount: "Rp 150,000", 
      status: "In Progress",
      date: "2024-01-20"
    },
    { 
      id: "ORD-002", 
      customer: "Jane Smith", 
      service: "Bersih Rumah", 
      amount: "Rp 200,000", 
      status: "Pending",
      date: "2024-01-19"
    },
    { 
      id: "ORD-003", 
      customer: "Bob Johnson", 
      service: "Service AC", 
      amount: "Rp 150,000", 
      status: "Completed",
      date: "2024-01-18"
    },
  ];

  const myServices = [
    {
      id: 1,
      title: "Service AC Rumah",
      price: "Rp 150,000",
      orders: 23,
      rating: 4.8,
      status: "active"
    },
    {
      id: 2,
      title: "Perbaikan AC Split",
      price: "Rp 200,000",
      orders: 15,
      rating: 4.9,
      status: "active"
    },
    {
      id: 3,
      title: "Maintenance AC Rutin",
      price: "Rp 100,000",
      orders: 9,
      rating: 4.7,
      status: "active"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Selesai</span>;
      case "In Progress":
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Berlangsung</span>;
      case "Pending":
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Menunggu</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, Ahmad Teknisi!</h1>
          <p className="text-gray-600 mt-2">Kelola layanan dan pesanan Anda dengan mudah</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} dari bulan lalu</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.service}</p>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{order.amount}</p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="w-full text-center text-green-600 hover:text-green-700 font-medium">
                  Lihat Semua Pesanan
                </button>
              </div>
            </div>
          </div>

          {/* My Services */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Layanan Saya</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {myServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{service.title}</p>
                      <p className="text-sm text-gray-600">{service.orders} pesanan</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{service.price}</p>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Aktif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="w-full text-center text-green-600 hover:text-green-700 font-medium">
                  Kelola Layanan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Tambah Layanan Baru</p>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Atur Jadwal</p>
              </div>
            </button>
            
            <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Lihat Statistik</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
