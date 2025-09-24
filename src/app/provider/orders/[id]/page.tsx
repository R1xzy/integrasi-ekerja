"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { 
    MessageSquare, User, Calendar, MapPin, DollarSign, Send, Check, X, ShieldCheck, Hammer, Clock
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';

// --- Tipe Data (Diperbarui) ---
interface OrderDetail {
    id: number;
    status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'DISPUTED';
    providerAttendanceStatus: 'ON_THE_WAY' | 'ARRIVED' | 'WORKING' | 'COMPLETED' | null;
    customerVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
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
    // PERBAIKAN 1: Mengganti nama properti agar sesuai dengan API
    orderDetails: {
        id: number;
        description: string;
        quantity: number;      // <-- Pastikan ada
        pricePerUnit: number;  // <-- Pastikan ada
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROPOSED';
    }[];
}

// --- Komponen-komponen Kecil (Tidak ada perubahan) ---
const StatusBadge = ({ status }: { status: OrderDetail['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Perlu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
        IN_PROGRESS: { text: 'Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-gray-100 text-gray-800' },
        DISPUTED: { text: 'Kehadiran Anda Ditolak ', color: 'bg-orange-100 text-orange-800' }
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

const AddCostForm = ({ onSubmit, isLoading }: { onSubmit: (desc: string, qty: number, price: number) => void; isLoading: boolean; }) => {
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('1'); // State untuk kuantitas
    const [pricePerUnit, setPricePerUnit] = useState(''); // State untuk harga satuan

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const numQty = parseInt(quantity, 10);
        const numPrice = parseFloat(pricePerUnit);
        if (description && numQty > 0 && numPrice > 0) {
            onSubmit(description, numQty, numPrice);
            setDescription('');
            setQuantity('1');
            setPricePerUnit('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-start">
            <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Deskripsi biaya" 
                required 
                className="sm:col-span-2 p-2 border rounded-md" 
            />
            <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder="Kuantitas" 
                required 
                min="1"
                className="p-2 border rounded-md" 
            />
            <input 
                type="number" 
                value={pricePerUnit} 
                onChange={(e) => setPricePerUnit(e.target.value)} 
                placeholder="Harga Satuan" 
                required 
                min="0"
                className="p-2 border rounded-md" 
            />
            <button type="submit" disabled={isLoading} className="sm:col-start-4 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center">
                <Send className="h-5 w-5" />
            </button>
        </form>
    );
};

// --- Komponen Halaman Utama ---
export default function ProviderOrderDetailPage() {
    const params = useParams();
    const { id: orderId } = params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await authenticatedFetch(`/api/orders/${orderId}`);
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
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleUpdateStatus = async (status: OrderDetail['status'], information?: string) => {
        setActionInProgress(status);
        try {
            const res = await authenticatedFetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ status, information })
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || 'Gagal mengubah status pesanan.');
            }
            await fetchOrderDetails();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
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
            const res = await authenticatedFetch(`/api/orders/${orderId}/attendance`, { 
                method: 'PUT',
                body: JSON.stringify({ attendanceStatus: 'ARRIVED' })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Gagal mengonfirmasi kehadiran.');
            }

            await fetchOrderDetails();
            alert('Kehadiran berhasil dikonfirmasi! Menunggu verifikasi dari pelanggan.');

        } catch (err: any) { 
            alert(`Error: ${err.message}`); 
        } finally { 
            setActionInProgress(null); 
        }
    };
    
    const handleAddCost = async (description: string, quantity: number, pricePerUnit: number) => {
        setActionInProgress('addCost');
        try {
            const res = await authenticatedFetch(`/api/orders/${orderId}/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Kirim payload yang lengkap sesuai kebutuhan API
                body: JSON.stringify({ description, quantity, pricePerUnit })
            });
            if (!res.ok) {
                const result = await res.json();
                throw new Error(result.error || 'Gagal menambah biaya.');
            }
            await fetchOrderDetails();
        } catch (err: any) { 
            alert(`Error: ${err.message}`); 
        } finally { 
            setActionInProgress(null); 
        }
    };

    if (isLoading) return <div className="text-center py-20">Memuat pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    if (!order) return <div className="text-center py-20">Pesanan tidak ditemukan.</div>;
    
    const showAcceptRejectButtons = order.status === 'PENDING_ACCEPTANCE';
    const showConfirmAttendanceButton = order.status === 'ACCEPTED' && order.providerAttendanceStatus !== 'ARRIVED';
    const showWaitingForVerification = order.status === 'ACCEPTED' && order.providerAttendanceStatus === 'ARRIVED' && order.customerVerificationStatus !== 'VERIFIED';
    const showStartWorkButton = order.status === 'ACCEPTED' && order.providerAttendanceStatus === 'ARRIVED' && order.customerVerificationStatus === 'VERIFIED';
    const showCompleteWorkButton = order.status === 'IN_PROGRESS';
    const showAddCostSection = ['IN_PROGRESS', 'COMPLETED', 'DISPUTED'].includes(order.status);
    const noActionMessage = !showAcceptRejectButtons && !showConfirmAttendanceButton && !showWaitingForVerification && !showStartWorkButton && !showCompleteWorkButton;

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Aksi Saat Ini</h2>
                    {showAcceptRejectButtons && (
                        <div className="flex gap-4">
                            <ActionButton onClick={handleReject} disabled={!!actionInProgress} variant="danger"><X className="mr-2"/> Tolak</ActionButton>
                            <ActionButton onClick={() => handleUpdateStatus('ACCEPTED')} disabled={!!actionInProgress} variant="success"><Check className="mr-2"/> Terima Pesanan</ActionButton>
                        </div>
                    )}
                    {showConfirmAttendanceButton && (
                        <ActionButton onClick={handleConfirmAttendance} disabled={actionInProgress === 'confirmAttendance'}>
                            <ShieldCheck className="mr-2"/> Konfirmasi Kehadiran di Lokasi
                        </ActionButton>
                    )}
                    {showWaitingForVerification && (
                        <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg flex items-center justify-center">
                            <Clock className="mr-3 h-6 w-6"/>
                            <div>
                                <p className="font-bold">Menunggu Verifikasi dari Pelanggan</p>
                                <p className="text-sm">Pelanggan akan memverifikasi kehadiran Anda di lokasi.</p>
                            </div>
                        </div>
                    )}
                    {showStartWorkButton && (
                         <ActionButton onClick={() => handleUpdateStatus('IN_PROGRESS')} disabled={!!actionInProgress}>
                            <Hammer className="mr-2"/> Mulai Pekerjaan
                        </ActionButton>
                    )}
                     {showCompleteWorkButton && (
                        <ActionButton onClick={() => handleUpdateStatus('COMPLETED')} disabled={actionInProgress === 'COMPLETED'}>
                            <Hammer className="mr-2"/> Selesaikan Pekerjaan
                        </ActionButton>
                    )}
                    {noActionMessage && (
                        <p className="text-gray-500 text-center">Tidak ada aksi yang diperlukan pada tahap ini.</p>
                    )}
                </div>

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

                {showAddCostSection && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center"><DollarSign className="mr-2"/> Rincian Biaya</h2>
                        <div className="space-y-4">
                           <div className="border-b pb-2 text-gray-700 space-y-2">
                                <div className="flex justify-between"><span>Harga Jasa Awal</span><span>Rp{new Intl.NumberFormat('id-ID').format(order.providerService.price)}</span></div>
                                
                                {/* PERBAIKAN: Tampilkan rincian dengan benar */}
                                {order.orderDetails.map(cost => (
                                    <div key={cost.id} className="flex justify-between items-center">
                                        <span>{cost.description} 
                                            <span className="text-xs text-gray-500 ml-2">({cost.quantity} x {new Intl.NumberFormat('id-ID').format(cost.pricePerUnit)})</span>
                                            <span className={`text-xs ml-2 font-semibold ${cost.status === 'APPROVED' ? 'text-green-600' : cost.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>
                                                ({cost.status})
                                            </span>
                                        </span>
                                        {/* Hitung subtotal */}
                                        <span>Rp{new Intl.NumberFormat('id-ID').format(cost.quantity * cost.pricePerUnit)}</span>
                                    </div>
                                ))}
                           </div>
                           <div className="flex justify-between font-bold text-lg text-gray-800">
                                <span>Total Biaya</span>
                                {/* Tampilkan finalAmount yang sudah dihitung dari backend */}
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