"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
    Calendar, User, ChevronRight, Package, AlertTriangle, Hourglass
} from 'lucide-react';
import Avatar from '@/components/Avatar';

// ✨ 1. Perbarui Tipe Data untuk menyertakan 'review'
interface Order {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'PROVIDER_SELF_VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REVIEWED' | 'DISPUTED';
    scheduledDate: string;
    provider: {
        fullName: string;
        profilePictureUrl: string | null;
        email?: string; 
    };
    providerService: {
        serviceTitle: string;
    };
    // 'review' akan berisi objek jika ada, atau null jika tidak ada.
    review: { id: number } | null;
}

// --- Komponen StatusBadge ---
const StatusBadge = ({ status, hasReview }: { status: Order['status'], hasReview: boolean }) => {
    // ✨ Logika status sekarang juga mempertimbangkan 'hasReview'
    if (status === 'COMPLETED' && !hasReview) {
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">Menunggu Ulasan</span>;
    }
    if ((status === 'COMPLETED' && hasReview) || status === 'REVIEWED') {
         return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Telah Diulas</span>;
    }

    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
        PROVIDER_SELF_VERIFIED: { text: 'Siap Mulai', color: 'bg-cyan-100 text-cyan-800' },
        IN_PROGRESS: { text: 'Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-gray-200 text-gray-800' },
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
    const [filter, setFilter] = useState<'all' | 'active' | 'pending_review' | 'completed' | 'cancelled'>('active');

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/orders');
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Gagal memuat data pesanan.');
            }
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
    
    // ✨ 2. Logika perhitungan dan filter sekarang menggunakan properti 'review'
    const pendingReviewCount = useMemo(() => {
        return orders.filter(order => order.status === 'COMPLETED' && !order.review).length;
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const activeStatus: Order['status'][] = ['PENDING_ACCEPTANCE', 'ACCEPTED', 'PROVIDER_SELF_VERIFIED', 'IN_PROGRESS'];
            const cancelledStatus: Order['status'][] = ['REJECTED_BY_PROVIDER', 'CANCELLED_BY_CUSTOMER', 'DISPUTED'];

            const isPendingReview = order.status === 'COMPLETED' && !order.review;
            const isCompleted = order.status === 'REVIEWED' || (order.status === 'COMPLETED' && !!order.review);

            switch (filter) {
                case 'active':
                    return activeStatus.includes(order.status);
                case 'pending_review':
                    return isPendingReview;
                case 'completed':
                    return isCompleted;
                case 'cancelled':
                    return cancelledStatus.includes(order.status);
                case 'all':
                default:
                    return true;
            }
        });
    }, [orders, filter]);

    const FilterButton = ({ value, label, showNotification = false }: { value: typeof filter, label: string, showNotification?: boolean }) => (
        <button 
            onClick={() => setFilter(value)}
            className={`relative px-4 py-2 shadow-sm rounded-lg text-sm font-semibold transition-colors ${filter === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}
        >
            {label}
            {showNotification && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
            )}
        </button>
    );

    if (isLoading) return <div className="flex justify-center items-center h-64"><Hourglass className="animate-spin" /> <span className="ml-2">Memuat riwayat pesanan...</span></div>;
    if (error) return <div className="text-center py-20 text-red-600 bg-red-50 p-4 rounded-lg"><AlertTriangle className="mx-auto mb-2" /> Error: {error}</div>;

    return (
        <div className="bg-gray-50 min-h-screen text-gray-800">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Riwayat Pesanan Saya</h1>

                <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200">
                    <FilterButton value="active" label="Aktif" />
                    <FilterButton 
                        value="pending_review" 
                        label="Menunggu Ulasan" 
                        showNotification={pendingReviewCount > 0 && filter !== 'pending_review'} 
                    />
                    <FilterButton value="completed" label="Selesai" />
                    <FilterButton value="cancelled" label="Batal/Ditolak" />
                    <FilterButton value="all" label="Semua" />
                </div>

                <div className="space-y-4">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                             <Link href={`/customer/orders/${order.id}`} key={order.id} className="block group">
                                <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 group-hover:border-blue-500 group-hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-gray-500">Pesanan #{order.id}</p>
                                                <StatusBadge status={order.status} hasReview={!!order.review} />
                                            </div>
                                            <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{order.providerService.serviceTitle}</h2>
                                            <div className="text-sm text-gray-600 mt-2 space-y-2">
                                                <p className="flex items-center gap-2">
                                                    <Avatar 
                                                        src={order.provider.profilePictureUrl} 
                                                        email={order.provider.email || ''} 
                                                        alt={order.provider.fullName}
                                                        size={24}
                                                    />
                                                    <span>{order.provider.fullName}</span>
                                                </p>
                                                <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-gray-400" />{new Date(order.scheduledDate).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                        <div className="self-center">
                                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-transform duration-300 group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                    {order.status === 'COMPLETED' && !order.review && (
                                        <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 rounded-r-lg">
                                            <p className="text-sm font-semibold">Pesanan selesai! Silakan berikan ulasan Anda untuk membantu penyedia jasa.</p>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
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