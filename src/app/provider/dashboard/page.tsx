'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, ShoppingBag, Star, TrendingUp, Calendar, Clock, CheckCircle, Loader } from "lucide-react";
import { authenticatedFetch } from '@/lib/auth-client';
import Link from 'next/link';

// --- Tipe Data dari API ---
interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface Order {
  id: number;
  customer: { fullName: string };
  providerService: { serviceTitle: string };
  finalAmount: number | null;
  status: string;
  createdAt: string;
}

interface Service {
  id: number;
  serviceTitle: string;
  basePrice: number;
  _count: { orders: number };
  reviews: { _avg: { rating: number | null } }[];
  isActive: boolean;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [providerName, setProviderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // --- [PERBAIKAN] Panggil satu API terpusat ---
        const response = await authenticatedFetch('/api/provider/dashboard');
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat data dashboard");
        }
        
        const { providerName, statistics, recentOrders, myServices } = result.data;
        
        // --- Proses data yang diterima ---
        setProviderName(providerName);
        setRecentOrders(recentOrders);
        setMyServices(myServices);
        
        const formattedStats: StatCard[] = [
          {
            title: "Total Pesanan",
            value: statistics.totalOrders.value,
            icon: <ShoppingBag className="w-6 h-6" />,
            color: "bg-blue-500"
          },
          {
            title: "Pesanan Aktif",
            value: statistics.activeOrders.value,
            icon: <Clock className="w-6 h-6" />,
            color: "bg-yellow-500"
          },
          {
            title: "Rating Rata-rata",
            value: statistics.averageRating.value,
            icon: <Star className="w-6 h-6" />,
            color: "bg-green-500"
          },
          {
            title: "Pendapatan Bulan Ini",
            value: `Rp ${new Intl.NumberFormat('id-ID').format(statistics.monthlyRevenue.value)}`,
            change: statistics.monthlyRevenue.change,
            icon: <TrendingUp className="w-6 h-6" />,
            color: "bg-purple-500"
          }
        ];
        setStats(formattedStats);

      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

const StatusBadge = ({ status }: { status: string }) => {
  const statusInfo: { [key: string]: { text: string; color: string } } = {
    COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
    IN_PROGRESS: { text: 'Berlangsung', color: 'bg-blue-100 text-blue-800' },
    PENDING: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    ACCEPTED: { text: 'Diterima', color: 'bg-indigo-100 text-indigo-800' },
  };

  const info = statusInfo[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>
      {info.text}
    </span>
  );
};
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-10 w-10 text-green-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Selamat Datang, {providerName}!</h1>
          <p className="text-gray-600 mt-2">Kelola layanan dan pesanan Anda dengan mudah</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.change && <p className={`text-sm mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{stat.change} dari bulan lalu</p>}
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}><div className="text-white">{stat.icon}</div></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2></div>
            <div className="p-6">
              <div className="space-y-4">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <Link href={`/provider/orders/${order.id}`} key={order.id} className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{order.providerService.serviceTitle}</p>
                        <p className="text-sm text-gray-600">{order.customer.fullName}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                      <p className="font-semibold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.finalAmount || 0)}</p>
                      <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </Link>
                )) : <p className="text-center text-gray-500">Belum ada pesanan.</p>}
              </div>
              <div className="mt-4">
                  <Link href="/provider/orders" className="w-full text-center text-green-600 hover:text-green-700 font-medium block">Lihat Semua Pesanan</Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
  <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Layanan Terlaris</h2></div>
  <div className="p-6">
    <div className="space-y-4">
      {myServices.length > 0 ? myServices.map((service) => (
        <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{service.serviceTitle}</p>
            {/* --- [PERBAIKAN] Tampilkan hanya jumlah pesanan --- */}
            <p className="text-sm text-gray-600">{service._count.orders} pesanan</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(service.basePrice)}</p>
            {service.isActive ? 
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aktif</span> :
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Tidak Aktif</span>
            }
          </div>
        </div>
      )) : <p className="text-center text-gray-500">Belum ada layanan yang ditambahkan.</p>}
    </div>
    <div className="mt-4">
      <Link href="/provider/services" className="w-full text-center text-green-600 hover:text-green-700 font-medium block">Kelola Layanan</Link>
    </div>
  </div>
</div>
        </div>
        {/* Quick Actions (Tidak diubah) */}
      </div>
    </div>
  );
}