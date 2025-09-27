// src/app/dashboard/page.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Users, Package, DollarSign, Activity, ShoppingBag, BadgeQuestionMark, FileText, UserCheck } from "lucide-react";
import Image from 'next/image';
import { authenticatedFetch } from '@/lib/auth-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- PERBAIKAN PADA TIPE DATA ---
interface UserProfile {
  fullName: string;
  profilePictureUrl?: string | null; // Diubah dari 'profile' menjadi 'profilePictureUrl'
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

interface DailyRevenue {
    name: string;
    Pendapatan: number;
}

interface DashboardStats {
  statistics: {
    users: { total: number; customers: number; providers: number; };
    orders: { total: number; recent: Order[]; };
    services: { total: number; };
    reviews: { total: number; };
    payments: { total: number; revenue: number; };
    pending: { verifications: number; reports: number; };
    dailyRevenue: DailyRevenue[];
  };
}

// ... (Sisa fungsi helper tidak berubah) ...
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
const RevenueChart = ({ data }: { data: DailyRevenue[] }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
        <h3 className="text-lg font-medium mb-4">Pendapatan 7 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }} formatter={(value) => formatCurrency(value as number)} />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }}/>
                <Bar dataKey="Pendapatan" fill="#3b82f6" name="Pendapatan (IDR)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);


export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats['statistics'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const dashboardRes = await authenticatedFetch('/api/admin/dashboard');

        if (!dashboardRes.ok) {
          throw new Error('Gagal mengambil data dasbor.');
        }

        const data: { data: DashboardStats } = await dashboardRes.json();
        setStats(data.data.statistics);
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/50 text-gray-600">
      <h2 className="text-3xl font-bold tracking-tight">Dasbor Admin</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="text-sm font-medium text-gray-600">Total Pesanan</h3>
                <Package className="h-4 w-4 text-gray-400" />
            </div>
            <div>
                <div className="text-2xl font-bold">{stats?.orders.total}</div>
                <p className="text-xs text-gray-500">Jumlah semua pesanan</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Pelanggan</h3>
                <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div>
                <div className="text-2xl font-bold">{stats?.users.customers}</div>
                 <p className="text-xs text-gray-500">Total pelanggan terdaftar</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Penyedia Jasa Aktif</h3>
                <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <div>
                <div className="text-2xl font-bold">{stats?.users.providers}</div>
                 <p className="text-xs text-gray-500">Total penyedia jasa terdaftar</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stats?.dailyRevenue && <RevenueChart data={stats.dailyRevenue} />}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b">
                <h3 className="text-lg font-medium">Aksi Cepat</h3>
            </div>
            <div className="p-6 space-y-4">
                <Link href="/dashboard/providers/verify" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <UserCheck className="w-8 h-8 text-blue-600 mr-4" />
                    <div>
                        <p className="font-semibold text-gray-900">Verifikasi Penyedia</p>
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-blue-700">{(stats?.pending.verifications || 0) - 2}</span> penyedia menunggu
                        </p>
                    </div>
                </Link>
                <Link href="/dashboard/reported-reviews" className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <FileText className="w-8 h-8 text-red-600 mr-4" />
                    <div>
                        <p className="font-semibold text-gray-900">Laporan Ulasan</p>
                        <p className="text-sm text-gray-600">
                            <span className="font-bold text-red-700">{stats?.pending.reports || 0}</span> laporan menunggu ditinjau
                        </p>
                    </div>
                </Link>
                <Link href="/dashboard/services" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <ShoppingBag className="w-8 h-8 text-green-600 mr-4" />
                    <div>
                        <p className="font-semibold text-gray-900">Kelola Layanan</p>
                        <p className="text-sm text-gray-600">Tambah atau ubah kategori</p>
                    </div>
                </Link>
                <Link href="/dashboard/FAQ" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                    <BadgeQuestionMark className="w-8 h-8 text-yellow-600 mr-4" />
                    <div>
                        <p className="font-semibold text-gray-900">Kelola FAQ</p>
                        <p className="text-sm text-gray-600">Atur pertanyaan umum</p>
                    </div>
                </Link>
            </div>
        </div>
      </div>
      
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
                      {/* --- PERBAIKAN PADA SUMBER GAMBAR --- */}
                      <Image 
                        src={order.customer.profilePictureUrl || '/default-avatar.png'} 
                        alt={order.customer.fullName} 
                        width={32} 
                        height={32} 
                        className="rounded-full object-cover" 
                      />
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
        </div>
      </div>
    </div>
  );
}