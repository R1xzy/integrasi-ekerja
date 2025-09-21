// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Package, DollarSign, Activity, ArrowUp, ArrowDown, ShoppingBag, BadgeQuestionMark, BarChart3  } from "lucide-react";
import Image from 'next/image';
import { authenticatedFetch } from '@/lib/auth-client';

// Tipe data disesuaikan dengan respons API dari /api/admin/dashboard
interface UserProfile {
  fullName: string;
  profile?: { photo?: string };
}

interface ProviderService {
  serviceTitle: string;
}

interface Order {
  id: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  customer: UserProfile;
  providerService: ProviderService;
}

interface DashboardStats {
  statistics: {
    users: {
      total: number;
      customers: number;
      providers: number;
    };
    orders: {
      total: number;
      recent: Order[];
    };
    services: {
      total: number;
      topCategories: any[];
    };
    reviews: {
      total: number;
    };
    payments: {
      total: number;
      revenue: number;
    };
    pending: {
      verifications: number;
      reports: number;
    };
    topProviders: any[];
  };
}

// Fungsi helper (tidak berubah)
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const getBadgeClasses = (status: string) => {
    const baseClasses = "px-2.5 py-0.5 rounded-full text-xs font-medium";
    const statusMap: { [key: string]: string } = {
        'PENDING': `${baseClasses} bg-yellow-100 text-yellow-800`,
        'IN_PROGRESS': `${baseClasses} bg-blue-100 text-blue-800`,
        'COMPLETED': `${baseClasses} bg-green-100 text-green-800`,
        'CANCELLED': `${baseClasses} bg-red-100 text-red-800`,
    };
    return statusMap[status.toUpperCase()] || `${baseClasses} bg-gray-100 text-gray-800`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats['statistics'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Panggilan tunggal ke API admin/dashboard
        const dashboardRes = await authenticatedFetch('/api/admin/dashboard');

        if (!dashboardRes.ok) {
          throw new Error('Gagal mengambil data dasbor.');
        }

        const data: { data: DashboardStats } = await dashboardRes.json();
        
        // Set state dengan data dari API
        setStats(data.data.statistics);
        
        // Periksa apakah ada verifikasi yang tertunda dan setel statenya
        const pendingVerifications = data.data.statistics.pending.verifications;
        setPendingVerificationsCount(pendingVerifications);
        setError(null);

      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Memuat data dasbor...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  // Nilai statis untuk pertumbuhan (jika tidak ada di API)
  const orderGrowthPercentage = 15.5; // Contoh nilai statis, bisa dihitung di backend nanti

  const GrowthIndicator = ({ percentage }: { percentage: number }) => {
    const isPositive = percentage >= 0;
    return (
      <p className={`text-xs text-gray-500 flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        {isPositive ? '+' : ''}{percentage}% dari bulan lalu
      </p>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/50 text-gray-600">
      <h2 className="text-3xl font-bold tracking-tight">Dasbor Admin</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Kartu Statistik */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Pesanan</h3>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.orders.total}</div>
            {/* Menggunakan nilai statis untuk growth, karena tidak ada di API yang sekarang */}
            {stats && <GrowthIndicator percentage={orderGrowthPercentage} />}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Penyedia Jasa Aktif</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.users.providers}</div>
            <p className="text-xs text-gray-500">Total penyedia jasa terdaftar</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Pendapatan</h3>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(stats?.payments.revenue || 0)}</div>
            <p className="text-xs text-gray-500">Dari pesanan yang telah selesai</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Pelanggan</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.users.customers}</div>
            <p className="text-xs text-gray-500">Total pelanggan terdaftar</p>
          </div>
        </div>
      </div>
      {/* Tabel Pesanan Terbaru */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Pesanan Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Pelanggan</th>
                <th scope="col" className="px-6 py-3">Layanan</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Tanggal</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats?.orders.recent.map((order) => (
                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <Image src={order.customer.profile?.photo || '/default-avatar.png'} alt={order.customer.fullName} width={32} height={32} className="rounded-full object-cover" />
                      {order.customer.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4">{order.providerService.serviceTitle}</td>
                  <td className="px-6 py-4">
                    <span className={getBadgeClasses(order.status)}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(order.finalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <p className="text-sm text-gray-600">
                        {pendingVerificationsCount} penyedia menunggu verifikasi
                    </p>
                  </div>
                </Link>
                
                <Link href="/dashboard/services" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
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