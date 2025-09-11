"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Package, DollarSign, Activity, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart3, ShoppingBag, Star, TrendingUp, BadgeQuestionMark } from "lucide-react";
import Image from 'next/image';
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// --- PERUBAHAN DI SINI ---
// Tipe data disesuaikan dengan respons API yang sebenarnya
interface Order {
  id: string;
  finalAmount: number; // Menggunakan finalAmount
  status: string;
  createdAt: string;
  customer: { 
    fullName: string; // Menggunakan fullName
    profile?: { photo?: string } 
  };
  providerService: { // Menggunakan providerService
    serviceTitle: string; // Menggunakan serviceTitle
  };
}
interface Provider {
  isActive: boolean;
}
interface Customer {
  createdAt: string;
}

// Tipe data untuk statistik (tidak berubah)
interface CalculatedStats {
  totalOrders: number;
  activeProviders: number;
  newCustomers: number;
  totalRevenue: number;
  orderGrowthPercentage: number;
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
  const [stats, setStats] = useState<CalculatedStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDataAndCalculate() {
      try {
        setLoading(true);
        
        const [ordersRes, providersRes, customersRes] = await Promise.all([
          fetch('/api/admin/orders'),
          fetch('/api/admin/providers'),
          fetch('/api/admin/customers'),
        ]);

        if (!ordersRes.ok || !providersRes.ok || !customersRes.ok) {
          throw new Error('Gagal mengambil data dari server. Pastikan otentikasi di dalam API sudah dinonaktifkan.');
        }

        // --- PERUBAHAN DI SINI ---
        // Ekstrak data dari dalam objek respons
        const ordersData = await ordersRes.json();
        const providersData = await providersRes.json();
        const customersData = await customersRes.json();

        const orders: Order[] = ordersData.data.data;
        const providers: Provider[] = providersData.data.data;
        const customers: Customer[] = customersData.data.data;
        
        // Kalkulasi data
        const now = new Date();
        const totalRevenue = orders
            .filter(o => o.status.toUpperCase() === 'COMPLETED')
            .reduce((sum, order) => sum + order.finalAmount, 0); // Menggunakan finalAmount
        
        const activeProviders = providers.filter(p => p.isActive).length;
        const newCustomers = customers.filter(c => new Date(c.createdAt) >= subMonths(now, 1)).length;
        
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= thisMonthStart).length;
        const ordersLastMonth = orders.filter(o => isWithinInterval(new Date(o.createdAt), { start: lastMonthStart, end: lastMonthEnd })).length;
        
        let orderGrowthPercentage = 0;
        if (ordersLastMonth > 0) {
          orderGrowthPercentage = ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100;
        } else if (ordersThisMonth > 0) {
          orderGrowthPercentage = 100;
        }

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          activeProviders,
          newCustomers,
          orderGrowthPercentage: parseFloat(orderGrowthPercentage.toFixed(1)),
        });

        const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentOrders(sortedOrders.slice(0, 5));
        setError(null);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDataAndCalculate();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen">Memuat data dasbor...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

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
            <div className="text-2xl font-bold">{stats?.totalOrders}</div>
            {stats && <GrowthIndicator percentage={stats.orderGrowthPercentage} />}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Penyedia Jasa Aktif</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.activeProviders}</div>
            <p className="text-xs text-gray-500">Total penyedia jasa terverifikasi</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Pendapatan</h3>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500">Dari pesanan yang telah selesai</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-600">Pelanggan Baru</h3>
            <Activity className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">+{stats?.newCustomers}</div>
            <p className="text-xs text-gray-500">Dalam 30 hari terakhir</p>
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
              {recentOrders.map((order) => (
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
                    <p className="text-sm text-gray-600">5 penyedia menunggu verifikasi</p>
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
