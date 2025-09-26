'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star, TrendingUp, Clock, CheckCircle, Loader, XCircle } from "lucide-react";
import { authenticatedFetch } from '@/lib/auth-client';
import Link from 'next/link';

// --- Tipe Data dari API ---
interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

// Order structure adapted from /api/provider/order-status
interface Order {
  id: number;
  customer: { fullName: string };
  service: { title: string }; 
  orderDetails: { finalAmount: number | null }; 
  status: string;
  createdAt: string;
}

// Service structure adapted from /api/providers/services
interface Service {
  id: number;
  serviceTitle: string;
  price: number; 
  // MOCK: _count ditambahkan untuk mencegah crash, data diisi random.
  _count: { orders: number }; 
  isAvailable: boolean;
}

export default function ProviderDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [providerName, setProviderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Ganti panggilan API tunggal dengan Promise.all untuk memanggil multiple endpoints
      const [
        profileResponse,
        statsResponse,
        ordersResponse,
        servicesResponse
      ] = await Promise.all([
        authenticatedFetch('/api/providers/profile'), // Untuk mendapatkan FullName
        authenticatedFetch('/api/provider/statistics'), // Untuk Total Orders & Rating
        authenticatedFetch('/api/provider/order-status?limit=5'), // Untuk recent orders & status counts
        authenticatedFetch('/api/providers/services') // Untuk daftar layanan
      ]);

      const [profileData, statsData, ordersData, servicesData] = await Promise.all([
        profileResponse.json(),
        statsResponse.json(),
        ordersResponse.json(),
        servicesResponse.json()
      ]);

      // 2. Data extraction dan validation (minimal)
      if (!statsData.success || !ordersData.success || !servicesData.success || !profileData.success) {
          throw new Error("Gagal memuat sebagian data dashboard");
      }

      const { totalOrders, averageRating } = statsData.data;
      const { statusSummary, orders: recentOrdersList } = ordersData.data;
      
      // Hitung metrik yang dibutuhkan
      const activeOrdersCount = statusSummary.ACCEPTED + statusSummary.IN_PROGRESS;
      const totalRevenue = recentOrdersList
        .filter((o: any) => o.status === 'COMPLETED')
        .reduce((sum: number, o: any) => sum + (o.orderDetails.finalAmount || 0), 0);

      // 3. Set data utama
      setProviderName(profileData.data.fullName);
      
      // Mapping recent orders (disesuaikan dengan struktur API provider-order-status)
      setRecentOrders(recentOrdersList.map((order: any) => ({
          ...order,
          finalAmount: order.orderDetails.finalAmount
      })));
      
      // Mapping services dan MOCKING count orders
      setMyServices(servicesData.data.map((service: any) => ({
          ...service,
          // MOCK DATA: Menggunakan angka acak untuk menghindari crash
          _count: { orders: Math.floor(Math.random() * 50) + 1 },
          price: service.price 
      })).slice(0, 3)); 

      // 4. Format dan set kartu statistik
      const formattedStats: StatCard[] = [
        {
          title: "Total Pesanan",
          value: totalOrders,
          icon: <ShoppingBag className="w-6 h-6" />,
          color: "bg-blue-500"
        },
        {
          title: "Pesanan Aktif",
          value: activeOrdersCount,
          icon: <Clock className="w-6 h-6" />,
          color: "bg-yellow-500"
        },
        {
          title: "Rating Rata-rata",
          value: parseFloat(averageRating.toFixed(1)) || 'N/A',
          icon: <Star className="w-6 h-6" />,
          color: "bg-green-500"
        },
        {
          // Mengganti "Pendapatan Bulan Ini" dengan Total Pendapatan dari data yang ada
          title: "Total Pendapatan",
          value: `Rp ${new Intl.NumberFormat('id-ID').format(totalRevenue)}`,
          icon: <TrendingUp className="w-6 h-6" />,
          color: "bg-purple-500"
        }
      ];
      setStats(formattedStats);

    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
      // Fallback error card
      setStats([{ title: "Gagal Memuat Data", value: "Cek Koneksi API", icon: <XCircle className="w-6 h-6" />, color: "bg-red-500" }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusInfo: { [key: string]: { text: string; color: string } } = {
      COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
      IN_PROGRESS: { text: 'Berlangsung', color: 'bg-blue-100 text-blue-800' },
      PENDING_ACCEPTANCE: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { text: 'Diterima', color: 'bg-indigo-100 text-indigo-800' },
      REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
    };

    const info = statusInfo[status] || { text: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' };

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
                        <p className="font-medium text-gray-900">{order.service.title}</p>
                        <p className="text-sm text-gray-600">{order.customer.fullName}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                      <p className="font-semibold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.orderDetails.finalAmount || 0)}</p>
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
            <div className="p-6 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Layanan Terlaris (Mock Data Pesanan)</h2></div>
            <div className="p-6">
              <div className="space-y-4">
                {myServices.length > 0 ? myServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{service.serviceTitle}</p>
                      <p className="text-sm text-gray-600">{service._count.orders} pesanan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(service.price)}</p>
                      {service.isAvailable ? 
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
      </div>
    </div>
  );
}