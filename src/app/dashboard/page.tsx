import Link from "next/link";
import { BarChart3, Users, ShoppingBag, Star, TrendingUp, BadgeQuestionMark } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Pesanan",
      value: "1,234",
      change: "+12%",
      icon: <ShoppingBag className="w-6 h-6" />,
      color: "bg-blue-500"
    },
    {
      title: "Penyedia Aktif",
      value: "856",
      change: "+8%",
      icon: <Users className="w-6 h-6" />,
      color: "bg-green-500"
    },
    {
      title: "Rating Rata-rata",
      value: "4.8",
      change: "+0.2",
      icon: <Star className="w-6 h-6" />,
      color: "bg-yellow-500"
    },
    {
      title: "Pendapatan",
      value: "Rp 125M",
      change: "+15%",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-purple-500"
    }
  ];

  const recentOrders = [
    { id: "ORD-001", customer: "John Doe", service: "Service AC", amount: "Rp 150,000", status: "Completed" },
    { id: "ORD-002", customer: "Jane Smith", service: "Bersih Rumah", amount: "Rp 200,000", status: "In Progress" },
    { id: "ORD-003", customer: "Bob Johnson", service: "Tukang Kayu", amount: "Rp 300,000", status: "Pending" },
    { id: "ORD-004", customer: "Alice Brown", service: "Plumbing", amount: "Rp 180,000", status: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Selamat datang di panel admin E-Kerja Karawang</p>
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
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer} - {order.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{order.amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/dashboard/orders" className="text-blue-600 hover:text-blue-700 font-medium">
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
                <Link href="/dashboard/providers/verify" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Users className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Verifikasi Penyedia</p>
                    <p className="text-sm text-gray-600">5 penyedia menunggu verifikasi</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/services/add" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Tambah Kategori Layanan</p>
                    <p className="text-sm text-gray-600">Kelola kategori layanan</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/reports" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Laporan Bulanan</p>
                    <p className="text-sm text-gray-600">Lihat performa platform</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/FAQ" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <BadgeQuestionMark className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">FAQ</p>
                    <p className="text-sm text-gray-600">Kelola FAQ</p>
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
