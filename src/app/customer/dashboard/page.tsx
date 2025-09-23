import Link from "next/link";
import { ShoppingBag, Star, Clock, MessageSquare } from "lucide-react";

export default function CustomerDashboard() {
  const stats = [
    {
      title: "Pesanan Aktif",
      value: "3",
      change: "+1",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      title: "Pesanan Selesai",
      value: "12",
      change: "+2",
      icon: <Star className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      title: "Rating Diberikan",
      value: "4.9",
      change: "+0.1",
      icon: <Star className="w-6 h-6" />,
      color: "bg-yellow-500",
    },
    {
      title: "Total Pengeluaran",
      value: "Rp 3.5Jt",
      change: "+15%",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-purple-500",
    },
  ];

  const recentOrders = [
    { id: "ORD-010", service: "Service AC", date: "10 Feb 2025", amount: "Rp 150,000", status: "In Progress" },
    { id: "ORD-009", service: "Bersih Rumah", date: "5 Feb 2025", amount: "Rp 200,000", status: "Completed" },
    { id: "ORD-008", service: "Tukang Kayu", date: "1 Feb 2025", amount: "Rp 300,000", status: "Completed" },
    { id: "ORD-007", service: "Plumbing", date: "28 Jan 2025", amount: "Rp 180,000", status: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Selamat datang di E-Kerja Karawang</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change} dari bulan lalu</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
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
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{order.service}</p>
                      <p className="text-sm text-gray-600">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{order.amount}</p>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/customer/orders" className="text-blue-600 hover:text-blue-700 font-medium">
                  Lihat semua pesanan →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aksi Cepat</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <Link
                  href="/customer/services"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <ShoppingBag className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Buat Pesanan Baru</p>
                    <p className="text-sm text-gray-600">Pilih layanan yang Anda butuhkan</p>
                  </div>
                </Link>

                <Link
                  href="/customer/reviews"
                  className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Star className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Ulasan Saya</p>
                    <p className="text-sm text-gray-600">Lihat & kelola ulasan Anda</p>
                  </div>
                </Link>

                <Link
                  href="/customer/support"
                  className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Pusat Bantuan</p>
                    <p className="text-sm text-gray-600">Hubungi tim support kami</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
