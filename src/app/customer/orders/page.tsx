"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
    Calendar, User, ChevronRight, Package, AlertTriangle, Hourglass
} from 'lucide-react';

// --- Tipe Data (sesuai API GET /api/orders) ---
interface Order {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'PROVIDER_SELF_VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REVIEWED' | 'DISPUTED';
    scheduledDate: string;
    provider: {
        fullName: string;
        profilePictureUrl: string | null;
    };
    providerService: {
        serviceTitle: string;
    };
}

// --- Komponen StatusBadge (didefinisikan di luar) ---
const StatusBadge = ({ status }: { status: Order['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
        PROVIDER_SELF_VERIFIED: { text: 'Siap Mulai', color: 'bg-cyan-100 text-cyan-800' },
        IN_PROGRESS: { text: 'Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-gray-500 text-gray-800' },
        REVIEWED: { text: 'Telah Diulas', color: 'bg-gray-100 text-gray-800' },
        DISPUTED: { text: 'Sengketa', color: 'bg-orange-100 text-orange-800' }
    };
    const info = statusInfo[status] || { text: 'Status Tidak Dikenal', color: 'bg-gray-200' };
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${info.color}`}>{info.text}</span>;
};

// --- Komponen Halaman Utama ---
export default function CustomerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // API ini akan otomatis mengembalikan pesanan milik customer yang login
            const response = await fetch('/api/orders');
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Gagal memuat data pesanan.');
            }
            // Urutkan berdasarkan tanggal terbaru
            result.data.sort((a: Order, b: Order) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
            setOrders(result.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    // Logika untuk memfilter pesanan berdasarkan tab yang aktif
    const filteredOrders = orders.filter(order => {
        const activeStatus: Order['status'][] = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'PROVIDER_SELF_VERIFIED', 'IN_PROGRESS'];
        const completedStatus: Order['status'][] = ['COMPLETED', 'REVIEWED'];
        const cancelledStatus: Order['status'][] = ['REJECTED_BY_PROVIDER', 'CANCELLED_BY_CUSTOMER', 'DISPUTED'];

        if (filter === 'active') return activeStatus.includes(order.status);
        if (filter === 'completed') return completedStatus.includes(order.status);
        if (filter === 'cancelled') return cancelledStatus.includes(order.status);
        return true; // untuk 'all'
    });

    const FilterButton = ({ value, label }: { value: typeof filter, label: string }) => (
        <button 
            onClick={() => setFilter(value)}
            className={`px-4 py-2 shadow-sm rounded-lg text-sm font-semibold transition-colors ${filter === value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 '}`}
        >
            {label}
        </button>
    );

    if (isLoading) return <div className="text-center py-20">Memuat riwayat pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen text-gray-600">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Riwayat Pesanan Saya</h1>

                {/* Tombol Filter */}
                <div className="flex space-x-2 mb-6 pb-4 border-b border-gray-200">
                    <FilterButton value="active" label="Aktif" />
                    <FilterButton value="completed" label="Selesai" />
                    <FilterButton value="cancelled" label="Batal/Ditolak" />
                    <FilterButton value="all" label="Semua" />
                </div>

                <div className="space-y-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <Link href={`/customer/orders/${order.id}`} key={order.id} className="block">
                                <div className="bg-white rounded-lg shadow-sm p-5 border border-transparent hover:border-blue-500 hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-gray-500">Pesanan #{order.id}</p>
                                                <StatusBadge status={order.status} />
                                            </div>
                                            <h2 className="text-lg font-bold text-gray-800">{order.providerService.serviceTitle}</h2>
                                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                <p className="flex items-center"><User className="w-4 h-4 mr-2 text-gray-400" />{order.provider.fullName}</p>
                                                <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-gray-400" />{new Date(order.scheduledDate).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="self-center">
                                            <ChevronRight className="w-6 h-6 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                            <Package className="mx-auto h-12 w-12 text-gray-400"/>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Tidak ada pesanan</h3>
                            <p className="mt-1 text-sm text-gray-500">Anda belum memiliki pesanan dalam kategori ini.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}