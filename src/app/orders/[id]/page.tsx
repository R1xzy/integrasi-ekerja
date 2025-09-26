"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    User, 
    Calendar, 
    MapPin, 
    DollarSign, 
    ShieldCheck, 
    CheckCircle,
    Info,
    MessageSquare,
    Star,
    X,
    AlertTriangle,
    ThumbsUp, // Icon baru untuk setuju
    ThumbsDown // Icon baru untuk tolak
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/auth-client';
import Image from 'next/image';

// --- Tipe Data ---
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
    finalAmount: number | null;
    providerService: {
        serviceTitle: string;
        price: number;
    };
    provider: {
        id: number;
        fullName: string;
        profilePictureUrl: string | null;
        phoneNumber: string;
    };
    // PERBAIKAN 1: Menambahkan kembali quantity dan pricePerUnit
    orderDetails: {
        id: number;
        description: string;
        quantity: number;
        pricePerUnit: number;
        status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROPOSED'; // Menambahkan PROPOSED
    }[];
}
// --- Komponen StatusBadge ---
const StatusBadge = ({ status }: { status: OrderDetail['status'] }) => {
    const statusInfo = {
        PENDING_ACCEPTANCE: { text: 'Menunggu Persetujuan', color: 'bg-yellow-100 text-yellow-800' },
        ACCEPTED: { text: 'Telah Diterima', color: 'bg-blue-100 text-blue-800' },
        REJECTED_BY_PROVIDER: { text: 'Ditolak Provider', color: 'bg-red-100 text-red-800' },
        IN_PROGRESS: { text: 'Sedang Dikerjakan', color: 'bg-indigo-100 text-indigo-800' },
        COMPLETED: { text: 'Selesai', color: 'bg-green-100 text-green-800' },
        CANCELLED_BY_CUSTOMER: { text: 'Dibatalkan', color: 'bg-gray-100 text-gray-800' },
        DISPUTED: { text: 'Kehadiran Provider Telah Anda Tolak', color: 'bg-orange-100 text-orange-800' }
    };
    const info = statusInfo[status] || { text: 'Status Tidak Dikenal', color: 'bg-gray-200' };
    return <span className={`px-3 py-1 text-sm font-medium rounded-full ${info.color}`}>{info.text}</span>;
};


// --- Komponen Halaman Utama ---
export default function CustomerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id: orderId } = params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [customerReview, setCustomerReview] = useState<any>(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'verify' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        try {
            const response = await authenticatedFetch(`/api/orders/${orderId}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gagal memuat detail pesanan.');
            setOrder(result.data);
            
            // Fetch review jika order COMPLETED
            if (result.data.status === 'COMPLETED') {
                fetchCustomerReview();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    const fetchCustomerReview = async () => {
        if (!orderId) return;
        setLoadingReview(true);
        try {
            // Try to get all reviews and find review for this order by this customer
            const response = await authenticatedFetch(`/api/reviews`);
            const result = await response.json();
            if (response.ok && result.success && result.data) {
                // Find review for this specific order by current customer
                // Assuming the API returns reviews with order information
                const orderReview = result.data.find((review: any) => {
                    return review.order && review.order.id === parseInt(orderId as string);
                });
                if (orderReview) {
                    setCustomerReview(orderReview);
                }
            }
        } catch (err: any) {
            console.log('No review found for this order:', err);
        } finally {
            setLoadingReview(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    const handleVerificationAction = async () => {
        if (!modalAction) return;
        
        const actionType = modalAction === 'verify' ? 'verifying' : 'rejecting';
        setActionInProgress(actionType);
        
        try {
            const verificationStatus = modalAction === 'verify' ? 'verified' : 'rejected';
            const notes = modalAction === 'reject' ? rejectionReason : 'Provider verified by customer.';

            const res = await authenticatedFetch(`/api/orders/${orderId}/customer-verification`, {
                method: 'PATCH',
                body: JSON.stringify({ verificationStatus, notes })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Gagal ${modalAction === 'verify' ? 'memverifikasi' : 'menolak'} kehadiran.`);
            }

            alert(`Kehadiran provider berhasil di-${modalAction === 'verify' ? 'verifikasi' : 'tolak'}.`);
            await fetchOrderDetails();

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
            setIsModalOpen(false);
            setRejectionReason('');
        }
    };
    
    const handleCancelOrder = async () => {
        if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat diurungkan.")) {
            setActionInProgress('cancelOrder');
            try {
                // API untuk membatalkan pesanan. Methodnya bisa PUT atau PATCH
                const res = await authenticatedFetch(`/api/orders/${orderId}`, { 
                    method: 'PUT',
                    body: JSON.stringify({ status: 'CANCELLED_BY_CUSTOMER' })
                });
                if (!res.ok) throw new Error("Gagal membatalkan pesanan.");
                alert("Pesanan berhasil dibatalkan.");
                await fetchOrderDetails();
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            } finally {
                setActionInProgress(null);
            }
        }
    };

    const handleCostAction = async (detailId: number, action: 'APPROVED' | 'REJECTED') => {
        setActionInProgress(`cost-${action}-${detailId}`);
        try {
            const res = await authenticatedFetch(`/api/orders/${orderId}/details/${detailId}`, {
                method: 'PUT', // Menggunakan PUT sesuai API
                body: JSON.stringify({ status: action })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Gagal ${action === 'APPROVED' ? 'menyetujui' : 'menolak'} biaya.`);
            }

            alert(`Biaya tambahan berhasil di-${action === 'APPROVED' ? 'setujui' : 'tolak'}.`);
            await fetchOrderDetails(); // Refresh data untuk melihat status baru

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-screen">Memuat detail pesanan...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    if (!order) return <div className="text-center py-20">Pesanan tidak ditemukan.</div>;
    
    // ====================================================================
    // PERBAIKAN: Menggunakan nama properti yang benar
    // ====================================================================
    const isVerifiedByCustomer = order.customerVerificationStatus === 'VERIFIED';
    const isRejectedByCustomer = order.customerVerificationStatus === 'REJECTED';
    const showVerificationCard = order.status === 'ACCEPTED' && order.providerAttendanceStatus === 'ARRIVED' && !isVerifiedByCustomer && !isRejectedByCustomer;
    const showVerifiedMessage = isVerifiedByCustomer;
    const showRejectedMessage = isRejectedByCustomer;
    const canBeCancelled = !['COMPLETED', 'DISPUTED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_PROVIDER'].includes(order.status);

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 text-gray-600">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {showVerificationCard && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-500">
                        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Provider Telah Tiba di Lokasi</h2>
                        <div className="flex flex-col items-center gap-4">
                            <Image 
                                src={order.provider.profilePictureUrl || '/default-avatar.png'} 
                                alt={order.provider.fullName}
                                width={100}
                                height={100}
                                className="rounded-full object-cover"
                            />
                            <p className="text-lg font-semibold">{order.provider.fullName}</p>
                            <p className="text-gray-600 text-center">Pastikan data provider sesuai dengan yang datang ke lokasi Anda sebelum melakukan verifikasi.</p>
                            
                            <div className="w-full max-w-sm flex items-center gap-2 mt-2">
                                <button 
                                    onClick={() => { setModalAction('reject'); setIsModalOpen(true); }}
                                    disabled={!!actionInProgress}
                                    className="w-1/5 flex-shrink-0 px-4 py-3 rounded-lg font-bold transition-colors bg-red-800 hover:bg-red-900 text-white disabled:opacity-50 flex items-center justify-center"
                                    title="Tolak Verifikasi"
                                >
                                    <X className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => { setModalAction('verify'); setIsModalOpen(true); }}
                                    disabled={!!actionInProgress}
                                    className="w-4/5 flex-grow px-4 py-3 rounded-lg font-bold transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center justify-center"
                                >
                                    <ShieldCheck className="mr-2"/> Verifikasi Kehadiran
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showVerifiedMessage && (
                     <div className="bg-green-50 text-green-800 rounded-xl shadow-lg p-6 flex items-center justify-center gap-4">
                        <CheckCircle className="h-8 w-8"/>
                        <div>
                            <p className="text-lg font-semibold">Anda telah memverifikasi kehadiran provider.</p>
                            <p className="text-sm">Pekerjaan akan segera dimulai.</p>
                        </div>
                    </div>
                )}

                {showRejectedMessage && (
                     <div className="bg-red-50 text-red-800 rounded-xl shadow-lg p-6 flex items-center justify-center gap-4">
                        <AlertTriangle className="h-8 w-8"/>
                        <div>
                            <p className="text-lg font-semibold">Anda telah menolak verifikasi provider.</p>
                            <p className="text-sm">Silakan hubungi customer service jika ada masalah.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg p-8">
                   <div className="flex justify-between items-start mb-6 border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{order.providerService.serviceTitle}</h1>
                            <p className="text-gray-500">Pesanan #{order.id}</p>
                        </div>
                        <StatusBadge status={order.status} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold mb-4 flex items-center"><User className="mr-2"/> Info Penyedia Jasa</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative h-16 w-16">
                                    <Image
                                        src={order.provider.profilePictureUrl || '/default-avatar.png'}
                                        alt={order.provider.fullName}
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-full"
                                    />
                                </div>
                                <div className="space-y-1 text-gray-700">
                                    <p><strong>Nama:</strong> {order.provider.fullName}</p>
                                    <p><strong>Telepon:</strong> {order.provider.phoneNumber}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                             <h3 className="text-lg font-bold mb-4 flex items-center"><Calendar className="mr-2"/> Info Layanan</h3>
                             <div className="space-y-2 text-gray-700">
                                 <p><strong>Jadwal:</strong> {new Date(order.scheduledDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                 <p><strong>Alamat:</strong></p>
                                 <address className="not-italic pl-4 border-l-2">
                                     {order.jobAddress}<br/>
                                     {order.subDistrict}, {order.district}<br/>
                                     RT/RW {order.ward}
                                 </address>
                                 {order.notes && <p className="mt-2"><strong>Catatan Anda:</strong> {order.notes}</p>}
                             </div>
                        </div>
                   </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><DollarSign className="mr-2"/> Rincian Biaya</h2>
                    <div className="space-y-4">
                        <div className="border-b pb-2 text-gray-700 space-y-2">
                            <div className="flex justify-between">
                                <span>Harga Jasa Awal</span>
                                <span>Rp{new Intl.NumberFormat('id-ID').format(order.providerService.price)}</span>
                            </div>

                            {/* ==================================================================== */}
                            {/* PERBAIKAN 3: Menambahkan tombol aksi pada item biaya tambahan */}
                            {/* ==================================================================== */}
                            {order.orderDetails.map(cost => (
                                <div key={cost.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2">
                                    <div className="flex-grow">
                                        <span>{cost.description}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">
                                                ({cost.quantity} x {new Intl.NumberFormat('id-ID').format(cost.pricePerUnit)})
                                            </span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                cost.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                                cost.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {cost.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-semibold text-gray-800">
                                            Rp{new Intl.NumberFormat('id-ID').format(cost.quantity * cost.pricePerUnit)}
                                        </span>
                                        
                                        {/* Tampilkan tombol hanya jika statusnya PENDING/PROPOSED */}
                                        {(cost.status === 'PENDING' || cost.status === 'PROPOSED') && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCostAction(cost.id, 'REJECTED')}
                                                    disabled={!!actionInProgress}
                                                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                                    title="Tolak Biaya"
                                                >
                                                    <ThumbsDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCostAction(cost.id, 'APPROVED')}
                                                    disabled={!!actionInProgress}
                                                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                                    title="Setujui Biaya"
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-800 pt-2">
                            <span>Total Biaya</span>
                            <span>Rp{new Intl.NumberFormat('id-ID').format(order.finalAmount || order.providerService.price)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Aksi Lainnya</h2>
                     
                    {canBeCancelled && (
                        <button 
                            onClick={handleCancelOrder}
                            disabled={!!actionInProgress}
                            className="w-full px-4 py-3 rounded-lg font-bold transition-colors bg-red-800 hover:bg-red-700 text-white disabled:opacity-50 mb-4">
                            Batalkan Pesanan
                        </button>
                    )}

                    {/* Tombol ulasan hanya muncul saat selesai */}
                    {order.status === 'COMPLETED' && (
                        <button 
                            onClick={() => router.push(`/reviews/new?orderId=${order.id}`)}
                            className="w-full px-4 py-3 rounded-lg font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                            disabled={loadingReview}
                        >
                            <Star className="mr-2"/> 
                            {loadingReview ? 'Memuat...' : customerReview ? 'Edit Ulasan' : 'Beri Ulasan'}
                        </button>
                    )}

                    {/* Pesan jika tidak ada aksi */}
                    {!canBeCancelled && order.status !== 'COMPLETED' && (
                        <p className="text-center text-gray-500">Tidak ada aksi yang bisa dilakukan pada tahap ini.</p>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all duration-300">
                        {modalAction === 'verify' ? (
                            <>
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                <h3 className="text-lg font-medium text-gray-900 mt-4">Konfirmasi Kehadiran?</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Apakah Anda yakin provider ini sudah tiba di lokasi Anda?
                                </p>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                                <h3 className="text-lg font-medium text-gray-900 mt-4">Tolak Verifikasi?</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Berikan alasan penolakan (opsional):
                                </p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full mt-2 p-2 border rounded-md text-sm"
                                    rows={3}
                                    placeholder="Contoh: Provider yang datang berbeda."
                                />
                            </>
                        )}

                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={!!actionInProgress}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleVerificationAction}
                                disabled={!!actionInProgress}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${modalAction === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {actionInProgress ? 'Memproses...' : (modalAction === 'verify' ? 'Ya, Verifikasi' : 'Ya, Tolak')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}