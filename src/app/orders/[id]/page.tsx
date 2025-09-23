"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    MessageSquare, Clock, Play, Check, X, Star, FileText, PlusCircle, AlertTriangle, Ban, Hourglass, CheckCheck
} from 'lucide-react';

// --- Tipe Data ---
interface OrderDetail {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'PROVIDER_SELF_VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REVIEWED' | 'DISPUTED';
    orderDate: string;
    notes: string | null;
    information: string | null;
    // PERBAIKAN: Menggunakan 'providerService' dan 'serviceTitle'
    providerService: {
        serviceTitle: string;
        price: number;
    };
    provider: {
        id: number;
        fullName: string;
        profilePictureUrl: string | null;
    };
    additionalCosts: {
        id: number;
        description: string;
        amount: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }[];
    review: {
        rating: number;
        comment: string;
    } | null;
}
// --- PERBAIKAN: Komponen-komponen kecil dipindahkan ke luar ---

const StatusBadge = ({ status }: { status: OrderDetail['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Pesanan Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak Provider', color: 'bg-red-100 text-red-800' },
        PROVIDER_SELF_VERIFIED: { text: 'Provider Siap Mulai', color: 'bg-cyan-100 text-cyan-800' },
        IN_PROGRESS: { text: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
        REVIEWED: { text: 'Telah Diulas', color: 'bg-gray-100 text-gray-800' },
        DISPUTED: { text: 'Dalam Sengketa', color: 'bg-orange-100 text-orange-800' }
    };
    const info = statusInfo[status] || { text: 'Unknown', color: 'bg-gray-200' };
    return <span className={`px-3 py-1 text-sm font-medium rounded-full ${info.color}`}>{info.text}</span>;
};

const ActionButton = ({ onClick, children, disabled = false, variant = 'primary' }: any) => {
    const colors = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-white hover:bg-gray-50 text-gray-700 border',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`w-full px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center ${colors[variant]}`}>
            {children}
        </button>
    );
};

const ReviewForm = ({ onSubmit, isLoading }: { onSubmit: (rating: number, comment: string) => void, isLoading: boolean }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating > 0) {
            onSubmit(rating, comment);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-gray-600">
            <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill={rating >= star ? 'currentColor' : 'none'}
                    />
                ))}
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ceritakan pengalaman Anda (opsional)..."
                rows={4}
                className="w-full p-2 border rounded-md"
            />
            <button type="submit" disabled={isLoading || rating === 0} className="w-full bg-yellow-500 text-white font-bold py-2 rounded-md hover:bg-yellow-600 disabled:bg-gray-400">
                {isLoading ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
        </form>
    );
};

// --- Komponen Utama ---
export default function CustomerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id: orderId } = params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const fetchOrderDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal memuat detail pesanan.');
            setOrder(result.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, fetchOrderDetails]);

    // --- (Fungsi-fungsi handle... tetap di dalam komponen utama) ---
    const handleConfirmAttendance = async () => {
        setActionInProgress('confirmAttendance');
        try {
            const res = await fetch(`/api/orders/${orderId}/customer-verification`, { method: 'POST' });
            if (!res.ok) throw new Error('Gagal mengonfirmasi kehadiran.');
            await fetchOrderDetails(); // Refresh data
        } catch (err: any) { setError(err.message); } finally { setActionInProgress(null); }
    };

    const handleCostResponse = async (detailId: number, approve: boolean) => {
        setActionInProgress(`cost-${detailId}`);
        try {
            const res = await fetch(`/api/orders/${orderId}/details/${detailId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: approve ? 'APPROVED' : 'REJECTED' })
            });
            if (!res.ok) throw new Error('Gagal merespons biaya tambahan.');
            await fetchOrderDetails();
        } catch (err: any) { setError(err.message); } finally { setActionInProgress(null); }
    };
    
    const handleReviewSubmit = async (rating: number, comment: string) => {
        setActionInProgress('submitReview');
        try {
            const res = await fetch(`/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order?.id, rating, comment })
            });
            if (!res.ok) throw new Error('Gagal mengirim ulasan.');
            await fetchOrderDetails();
        } catch (err: any) { setError(err.message); } finally { setActionInProgress(null); }
    };
    
    const handleChat = async () => {
        if (!order) return;
        // API untuk chat room bisa menerima providerId atau orderId
        // Mengirim orderId lebih spesifik untuk konteks ini
        router.push(`/chat?orderId=${order.id}`); 
    };

    if (isLoading) return <div className="text-center py-20">Memuat pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    if (!order) return <div className="text-center py-20">Pesanan tidak ditemukan.</div>;

    // --- Render Halaman ---
    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 text-gray-600">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 border-b pb-6">
                        <div>
                            {/* PERBAIKAN: Menggunakan order.providerService.serviceTitle */}
                            <h1 className="text-3xl font-bold">{order.providerService.serviceTitle}</h1>
                            <p className="text-gray-500">Pesanan #{order.id}</p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>

                    {/* Konten Dinamis Berdasarkan Status */}
                    <div className="space-y-8">
                        {order.status === 'PENDING_ACCEPTANCE' && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg text-center">
                                <Hourglass className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                                <h2 className="text-xl font-bold text-yellow-800 mb-2">Menunggu Persetujuan</h2>
                                <p className="mb-4 text-yellow-700">Pesanan Anda telah diteruskan ke provider. Mohon tunggu konfirmasi dari mereka.</p>
                            </div>
                        )}

                         {(order.status === 'REJECTED_BY_PROVIDER' || order.status === 'CANCELLED_BY_CUSTOMER') && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg text-center">
                                <Ban className="h-12 w-12 mx-auto text-red-500 mb-4" />
                                <h2 className="text-xl font-bold text-red-800 mb-2">Pesanan Dibatalkan</h2>
                                <p className="mb-4 text-red-700">Maaf, pesanan ini tidak dapat dilanjutkan.</p>
                                {order.information && (
                                    <div className="text-left bg-red-100 p-3 rounded-md text-sm">
                                        <p className="font-semibold">Alasan:</p>
                                        <p className="italic">"{order.information}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {order.status === 'ACCEPTED' && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg text-center">
                                <CheckCheck className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                                <h2 className="text-xl font-bold text-blue-800 mb-2">Pesanan Diterima!</h2>
                                <p className="mb-4 text-blue-700">Provider telah menerima pesanan Anda dan akan segera bersiap. Tunggu provider mengonfirmasi kehadiran di lokasi Anda.</p>
                            </div>
                        )}
                        
                        {order.status === 'PROVIDER_SELF_VERIFIED' && (
                            <div className="bg-cyan-50 border-l-4 border-cyan-500 p-6 rounded-lg text-center">
                                <h2 className="text-xl font-bold text-cyan-800 mb-2">Provider Siap Memulai!</h2>
                                <p className="mb-4 text-cyan-700">Provider telah mengonfirmasi kehadiran di lokasi. Mohon konfirmasi untuk memulai pekerjaan.</p>
                                <ActionButton onClick={handleConfirmAttendance} disabled={actionInProgress === 'confirmAttendance'} variant="success">
                                    <Play className="mr-2 h-5 w-5" />
                                    {actionInProgress === 'confirmAttendance' ? 'Memproses...' : 'Konfirmasi & Mulai Pekerjaan'}
                                </ActionButton>
                            </div>
                        )}
                        
                        {order.status === 'IN_PROGRESS' && order.additionalCosts.some(c => c.status === 'PENDING') && (
                             <div>
                                <h3 className="text-lg font-bold mb-4 flex items-center"><PlusCircle className="mr-2" />Biaya Tambahan Menunggu Persetujuan</h3>
                                <div className="space-y-3">
                                    {order.additionalCosts.filter(c => c.status === 'PENDING').map(cost => (
                                        <div key={cost.id} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p>{cost.description}</p>
                                                <p className="font-bold">Rp{new Intl.NumberFormat('id-ID').format(cost.amount)}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleCostResponse(cost.id, false)} disabled={!!actionInProgress} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-4 w-4"/></button>
                                                <button onClick={() => handleCostResponse(cost.id, true)} disabled={!!actionInProgress} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><Check className="h-4 w-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.status === 'COMPLETED' && (
                           <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-yellow-800 mb-2">Pekerjaan Selesai!</h2>
                                <p className="mb-4 text-yellow-700">Bagaimana pengalaman Anda? Berikan ulasan untuk membantu pelanggan lain.</p>
                                <ReviewForm onSubmit={handleReviewSubmit} isLoading={actionInProgress === 'submitReview'} />
                            </div>
                        )}

                        {order.status === 'REVIEWED' && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                                <h2 className="text-xl font-bold text-green-800 mb-2">Terima Kasih!</h2>
                                <p className="mb-4 text-green-700">Anda telah memberikan ulasan untuk pesanan ini.</p>
                                {/* Tampilkan ulasan yang diberikan */}
                                <div className="bg-white p-4 rounded-md">
                                    <div className="flex items-center mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-5 w-5 ${i < (order.review?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor"/>
                                        ))}
                                    </div>
                                    <p className="italic text-gray-600">"{order.review?.comment}"</p>
                                </div>
                            </div>
                        )}

                        {/* Detail Pesanan Umum */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold mb-2">Provider</h3>
                                <div className="flex items-center">
                                    <img src={order.provider.profilePictureUrl || '/default-avatar.png'} alt={order.provider.fullName} className="w-10 h-10 rounded-full mr-3" />
                                    <p>{order.provider.fullName}</p>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-bold mb-2">Jadwal</h3>
                                <p>{new Date(order.orderDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            </div>
                        </div>
                        
                        <ActionButton onClick={handleChat} variant="secondary">
                            <MessageSquare className="mr-2 h-5 w-5" /> Hubungi Provider
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
}