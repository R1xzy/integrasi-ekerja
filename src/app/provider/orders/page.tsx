"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Check, X, Hammer, Info, ChevronRight, Package, User, Calendar
} from 'lucide-react';

// --- Tipe Data ---
interface Order {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'PROVIDER_SELF_VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REVIEWED' | 'DISPUTED';
    scheduledDate: string;
    customer: {
        fullName: string;
        profilePictureUrl: string | null;
    };
    providerService: {
        serviceTitle: string;
    };
}

// --- Komponen-komponen Kecil ---
const StatusBadge = ({ status }: { status: Order['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Perlu Persetujuan', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        ACCEPTED: { text: 'Diterima', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800 border-red-200' },
        PROVIDER_SELF_VERIFIED: { text: 'Siap Mulai', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
        IN_PROGRESS: { text: 'Dikerjakan', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800 border-green-200' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan Pelanggan', color: 'bg-red-100 text-red-800 border-red-200' },
        REVIEWED: { text: 'Telah Diulas', color: 'bg-gray-100 text-gray-800 border-gray-200' },
        DISPUTED: { text: 'Sengketa', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    };
    const info = statusInfo[status] || { text: 'Unknown', color: 'bg-gray-200' };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${info.color}`}>{info.text}</span>;
};

// --- Komponen Halaman Utama ---
export default function ProviderOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<number | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            // API GET /api/orders akan secara otomatis memfilter pesanan untuk provider yang login
            const response = await fetch('/api/orders');
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Gagal memuat data pesanan.');
            }
            // Mengurutkan pesanan agar yang butuh aksi muncul di atas
            const sortedOrders = result.data.sort((a: Order, b: Order) => {
                const statusOrder = [
                    'PENDING_ACCEPTANCE', 'ACCEPTED', 'PROVIDER_SELF_VERIFIED', 'IN_PROGRESS', 
                    'COMPLETED', 'REVIEWED', 'REJECTED_BY_PROVIDER', 'CANCELLED_BY_CUSTOMER', 'DISPUTED'
                ];
                return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
            });
            setOrders(sortedOrders);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleUpdateStatus = async (orderId: number, status: Order['status'], information?: string) => {
        setActionInProgress(orderId);
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, information }),
            });
            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || `Gagal mengubah status pesanan.`);
            }
            await fetchOrders(); // Refresh daftar pesanan setelah berhasil
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };
    
    const handleReject = (orderId: number) => {
        const reason = prompt("Harap masukkan alasan penolakan pesanan:");
        if (reason) { // Hanya proses jika provider memasukkan alasan
            handleUpdateStatus(orderId, 'REJECTED_BY_PROVIDER', reason);
        }
    };

    if (isLoading) return <div className="text-center py-20">Memuat pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Daftar Pesanan Masuk</h1>
            <div className="space-y-4">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow-md transition-all hover:shadow-lg">
                            <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">{order.providerService.serviceTitle}</h2>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                                        <span className="flex items-center"><User className="w-4 h-4 mr-2" />{order.customer.fullName}</span>
                                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{new Date(order.scheduledDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </div>
                                </div>
                                
                                {/* --- Tombol Aksi Cepat (Shortcut) --- */}
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    {/* Aksi untuk Pesanan Baru */}
                                    {order.status === 'PENDING_ACCEPTANCE' && (
                                        <>
                                            <button onClick={() => handleReject(order.id)} disabled={actionInProgress === order.id} className="btn-action-sm btn-danger"><X className="w-4 h-4" /></button>
                                            <button onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')} disabled={actionInProgress === order.id} className="btn-action-sm btn-success"><Check className="w-4 h-4" /></button>
                                        </>
                                    )}

                                    {/* Aksi untuk Menyelesaikan Pesanan */}
                                    {order.status === 'IN_PROGRESS' && (
                                        <button onClick={() => handleUpdateStatus(order.id, 'COMPLETED')} disabled={actionInProgress === order.id} className="btn-action btn-success">
                                            <Hammer className="w-4 h-4 mr-2" /> Selesaikan
                                        </button>
                                    )}

                                    {/* Tombol Lihat Detail (selalu ada, tapi bisa diganti teksnya) */}
                                    <Link href={`/provider/orders/${order.id}`} className="btn-action btn-secondary w-full justify-center">
                                        {['PENDING_ACCEPTANCE', 'ACCEPTED', 'PROVIDER_SELF_VERIFIED', 'IN_PROGRESS'].includes(order.status) ? 'Detail & Aksi' : 'Lihat Detail'}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-10">Tidak ada pesanan.</p>
                )}
            </div>
        </div>
    );
}

