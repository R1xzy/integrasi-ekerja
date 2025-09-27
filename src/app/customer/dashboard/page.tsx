"use client";

import Link from "next/link";
import { ShoppingBag, Star, Clock, MessageSquare, CheckCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils"; 
import { formatDate } from "@/lib/utils_new";

// --- Tipe Data dari API ---
interface RecentOrder {
  id: number;
  providerService: {
    serviceTitle: string;
  };
  createdAt: string;
  finalAmount: number | null;
  status: string;
}

interface DashboardData {
  activeOrders: number;
  completedOrders: number;
  reviewsGiven: number;
  totalSpending: number;
  recentOrders: RecentOrder[];
}

// Komponen untuk Status Badge
const StatusBadge = ({ status }: { status: string }) => {
    const statusMap: Record<string, { text: string; color: string }> = {
        'COMPLETED': { text: "Selesai", color: "bg-green-100 text-green-800" },
        'IN_PROGRESS': { text: "Berlangsung", color: "bg-blue-100 text-blue-800" },
        'PENDING_ACCEPTANCE': { text: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
        'ACCEPTED': { text: "Diterima", color: "bg-indigo-100 text-indigo-800" },
        'CANCELLED_BY_CUSTOMER': { text: "Dibatalkan", color: "bg-red-100 text-red-800" },
        'REJECTED_BY_PROVIDER': { text: "Ditolak", color: "bg-red-100 text-red-800" }
    };
    const { text, color } = statusMap[status] || { text: status.replace(/_/g, " "), color: "bg-gray-100 text-gray-800" };
    return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>{text}</span>;
};

export default function CustomerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsRes, profileRes] = await Promise.all([
            authenticatedFetch('/api/customer/statistics'),
            authenticatedFetch('/api/user/profile') 
        ]);

        if (!statsRes.ok || !profileRes.ok) {
          throw new Error('Gagal memuat data dasbor.');
        }

        const statsData = await statsRes.json();
        const profileData = await profileRes.json();

        setData(statsData.data);
        setCustomerName(profileData.data.fullName);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Memuat dasbor...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  const stats = [
    { title: "Pesanan Aktif", value: data?.activeOrders || 0, icon: <RefreshCw className="w-6 h-6" />, color: "bg-blue-500" },
    { title: "Pesanan Selesai", value: data?.completedOrders || 0, icon: <CheckCircle className="w-6 h-6" />, color: "bg-green-500" },
    { title: "Ulasan Diberikan", value: data?.reviewsGiven || 0, icon: <Star className="w-6 h-6" />, color: "bg-yellow-500" },
    { title: "Total Pengeluaran", value: formatCurrency(data?.totalSpending || 0), icon: <ShoppingBag className="w-6 h-6" />, color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dasbor Anda</h1>
          <p className="text-gray-600 mt-2">Selamat datang kembali, {customerName}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{order.providerService.serviceTitle}</p>
                        <p className="text-sm text-gray-600">{formatDate(new Date(order.createdAt))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(order.finalAmount || 0)}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">Anda belum memiliki pesanan.</p>
                )}
              </div>
              <div className="mt-6">
                <Link href="/customer/orders" className="text-blue-600 hover:text-blue-700 font-medium">
                  Lihat semua pesanan →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aksi Cepat</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <Link href="/services" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Buat Pesanan Baru</p>
                    <p className="text-sm text-gray-600">Pilih layanan yang Anda butuhkan</p>
                  </div>
                </Link>
                <Link href="/customer/orders" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Lacak Pesanan</p>
                    <p className="text-sm text-gray-600">Lihat status pesanan Anda saat ini</p>
                  </div>
                </Link>
                <Link href="/chat" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <MessageSquare className="w-8 h-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Pesan & Obrolan</p>
                    <p className="text-sm text-gray-600">Hubungi penyedia jasa</p>
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