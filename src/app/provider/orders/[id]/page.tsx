"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    MessageSquare, User, Calendar, MapPin, DollarSign, Send, Check, X, ShieldCheck, Hammer
} from 'lucide-react';

// --- Tipe Data (sesuai API GET /api/orders/[id]) ---
interface OrderDetail {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'PROVIDER_SELF_VERIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REVIEWED' | 'DISPUTED';
    scheduledDate: string;
    jobAddress: string;
    district: string;
    subDistrict: string;
    ward: string;
    notes: string | null;
    information: string | null;
    finalAmount: number | null;
    providerService: {
        serviceTitle: string;
        price: number;
    };
    customer: {
        id: number;
        fullName: string;
        profilePictureUrl: string | null;
        phoneNumber: string;
    };
    additionalCosts: {
        id: number;
        description: string;
        amount: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED';
    }[];
}

// --- Komponen-komponen Kecil (didefinisikan di luar) ---
const StatusBadge = ({ status }: { status: OrderDetail['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Perlu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
        PROVIDER_SELF_VERIFIED: { text: 'Siap Mulai', color: 'bg-cyan-100 text-cyan-800' },
        IN_PROGRESS: { text: 'Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-gray-500 text-gray-800' },
        REVIEWED: { text: 'Telah Diulas', color: 'bg-gray-100 text-gray-800' },
        DISPUTED: { text: 'Sengketa', color: 'bg-orange-100 text-orange-800' }
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

const AddCostForm = ({ onSubmit, isLoading }: { onSubmit: (desc: string, amount: number) => void; isLoading: boolean; }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (description && numAmount > 0) {
            onSubmit(description, numAmount);
            setDescription('');
            setAmount('');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi biaya" required className="flex-1 p-2 border rounded-md" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Jumlah" required className="w-32 p-2 border rounded-md" />
            <button type="submit" disabled={isLoading} className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <Send className="h-5 w-5" />
            </button>
        </form>
    );
};

// --- Komponen Halaman Utama ---
export default function ProviderOrderDetailPage() {
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
        if (orderId) { fetchOrderDetails(); }
    }, [orderId, fetchOrderDetails]);

    const handleUpdateStatus = async (status: OrderDetail['status'], information?: string) => {
        setActionInProgress(status);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, information })
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || 'Gagal mengubah status pesanan.');
            }
            await fetchOrderDetails();
        } catch (err: any) { alert(`Error: ${err.message}`); } finally { setActionInProgress(null); }
    };
    
    const handleReject = () => {
        const reason = prompt("Harap masukkan alasan penolakan:");
        if (reason && reason.trim() !== "") {
            handleUpdateStatus('REJECTED_BY_PROVIDER', reason);
        }
    };

    const handleConfirmAttendance = async () => {
    setActionInProgress('confirmAttendance');
    try {
        const res = await fetch(`/api/orders/${orderId}/attendance`, { 
            method: 'PUT', // Menggunakan method PUT sesuai API
            headers: { 'Content-Type': 'application/json' },
            // Mengirim body yang dibutuhkan oleh API
            body: JSON.stringify({ attendanceStatus: 'ARRIVED' })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Gagal mengonfirmasi kehadiran.');
        }

        await fetchOrderDetails(); // Refresh data untuk melihat status baru

    } catch (err: any) { 
        alert(`Error: ${err.message}`); 
    } finally { 
        setActionInProgress(null); 
    }
};
    
    const handleAddCost = async (description: string, amount: number) => {
        setActionInProgress('addCost');
        try {
            const res = await fetch(`/api/orders/${orderId}/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, amount })
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || 'Gagal menambah biaya.');
            }
            await fetchOrderDetails();
        } catch (err: any) { alert(`Error: ${err.message}`); } finally { setActionInProgress(null); }
    };

    if (isLoading) return <div className="text-center py-20">Memuat pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    if (!order) return <div className="text-center py-20">Pesanan tidak ditemukan.</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Kotak Aksi Utama */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Aksi Saat Ini</h2>
                    {order.status === 'PENDING_ACCEPTANCE' && (
                        <div className="flex gap-4">
                            <ActionButton onClick={handleReject} disabled={!!actionInProgress} variant="danger"><X className="mr-2"/> Tolak</ActionButton>
                            <ActionButton onClick={() => handleUpdateStatus('ACCEPTED')} disabled={!!actionInProgress} variant="success"><Check className="mr-2"/> Terima Pesanan</ActionButton>
                        </div>
                    )}
                    {order.status === 'ACCEPTED' && (
                        <ActionButton onClick={handleConfirmAttendance} disabled={actionInProgress === 'confirmAttendance'}>
                            <ShieldCheck className="mr-2"/> Konfirmasi Kehadiran di Lokasi
                        </ActionButton>
                    )}
                     {order.status === 'IN_PROGRESS' && (
                        <ActionButton onClick={() => handleUpdateStatus('COMPLETED')} disabled={actionInProgress === 'COMPLETED'}>
                            <Hammer className="mr-2"/> Selesaikan Pekerjaan
                        </ActionButton>
                    )}
                    {['REJECTED_BY_PROVIDER', 'COMPLETED', 'REVIEWED', 'CANCELLED_BY_CUSTOMER', 'PROVIDER_SELF_VERIFIED', 'DISPUTED'].includes(order.status) && (
                        <p className="text-gray-500 text-center">Tidak ada aksi yang diperlukan pada tahap ini.</p>
                    )}
                </div>

                {/* Detail Pesanan */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex justify-between items-start mb-6 border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold">{order.providerService.serviceTitle}</h1>
                            <p className="text-gray-500">Pesanan #{order.id}</p>
                        </div>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center"><User className="mr-2"/> Info Pelanggan</h3>
                            <div className="space-y-2 text-gray-700">
                                <p><strong>Nama:</strong> {order.customer.fullName}</p>
                                <p><strong>Telepon:</strong> {order.customer.phoneNumber}</p>
                                <p><strong>Alamat:</strong></p>
                                <address className="not-italic pl-4 border-l-2">
                                    {order.jobAddress}<br/>
                                    {order.subDistrict}, {order.district}<br/>
                                    RT/RW {order.ward}
                                </address>
                            </div>
                        </div>
                        <div>
                             <h3 className="text-lg font-bold mb-4 flex items-center"><Calendar className="mr-2"/> Info Layanan</h3>
                             <div className="space-y-2 text-gray-700">
                                <p><strong>Jadwal:</strong> {new Date(order.scheduledDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                <p><strong>Harga Awal:</strong> Rp{new Intl.NumberFormat('id-ID').format(order.providerService.price)}</p>
                                {order.notes && <p><strong>Catatan Pelanggan:</strong> {order.notes}</p>}
                                {order.information && <p><strong>Info Tambahan:</strong> {order.information}</p>}
                             </div>
                        </div>
                    </div>
                </div>

                {/* Biaya Tambahan */}
                {['IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'DISPUTED'].includes(order.status) && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center"><DollarSign className="mr-2"/> Rincian Biaya</h2>
                        <div className="space-y-4">
                           <div className="border-b pb-2 text-gray-700 space-y-2">
                               <div className="flex justify-between"><span>Harga Jasa Awal</span><span>Rp{new Intl.NumberFormat('id-ID').format(order.providerService.price)}</span></div>
                               {order.additionalCosts.map(cost => (
                                   <div key={cost.id} className="flex justify-between items-center">
                                       <span>{cost.description} 
                                            <span className={`text-xs ml-2 font-semibold ${cost.status === 'APPROVED' ? 'text-green-600' : cost.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                ({cost.status})
                                            </span>
                                       </span>
                                       <span>Rp{new Intl.NumberFormat('id-ID').format(cost.amount)}</span>
                                   </div>
                               ))}
                           </div>
                           <div className="flex justify-between font-bold text-lg text-gray-800">
                               <span>Total Biaya</span>
                               <span>Rp{new Intl.NumberFormat('id-ID').format(order.finalAmount || 0)}</span>
                           </div>
                           {order.status === 'IN_PROGRESS' && (
                                <div className="pt-6 border-t">
                                    <h3 className="text-md font-semibold mb-2">Tambah Biaya Baru</h3>
                                    <AddCostForm onSubmit={handleAddCost} isLoading={actionInProgress === 'addCost'} />
                                </div>
                           )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}