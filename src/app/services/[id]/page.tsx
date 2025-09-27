"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Tag, CheckCircle, ShoppingCart, MessageSquare, Calendar, X as XIcon, MapPin } from 'lucide-react';
import { StartChatButton } from '@/components/chat/StartChatButton';
// --- Tipe Data ---
interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    fullName: string;
    profilePictureUrl: string | null;
  }
}
interface ServiceDetail {
  id: number;
  serviceName: string;
  description: string;
  price: number;
  category: {
    name: string;
  };
  provider: {
    id: number;
    fullName: string;
    profilePictureUrl: string | null;
    rating: number;
    reviewCount: number;
  };
  reviews: Review[];
}

// --- Komponen Modal Pemesanan (Dengan Perbaikan) ---
const OrderModal = ({ service, onClose, onSubmit, isSubmitting }: { service: ServiceDetail; onClose: () => void; onSubmit: (data: any) => void; isSubmitting: boolean; }) => {
  const [schedule, setSchedule] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [notes, setNotes] = useState('');

 const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Validasi untuk mencegah 'Invalid time value'
    if (!schedule) {
        alert("Harap pilih tanggal dan waktu pelaksanaan terlebih dahulu.");
        return;
    }
    onSubmit({ 
        providerServiceId: service.id,
        scheduledDate: schedule,
        jobAddress, 
        district, 
        subDistrict, 
        ward, 
        notes 
    });
  };

  return (
    // --- PERBAIKAN 1: Mengubah cara styling background ---
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center backdrop-blur-xs justify-center z-50 p-4 text-gray-600">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Detail & Jadwal Pesanan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={24} /></button>
        </div>
        {/* --- PERBAIKAN 2: Menambahkan input field untuk alamat --- */}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Layanan:</p>
              <p className="font-semibold text-lg">{service.serviceName}</p>
            </div>
            {/* Jadwal */}
            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2 flex items-center m-2">
                <Calendar className="mr-2 h-5 w-5"/> Pilih Jadwal Pelaksanaan <span className="text-red-500 ml-1">*</span>
              </label>
              <input type="datetime-local" id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} required className="w-full input-style duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            {/* Alamat */}
             <div className="p-4 border-t-gray-800 mt-4">
                 <h3 className="text-md font-semibold mb-3 flex items-center"><MapPin className="mr-2 h-5 w-5"/> Alamat Pengerjaan</h3>
                 <div className="space-y-3">
                     <input type="text" placeholder="Alamat Lengkap (Jalan, No. Rumah)*" value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} required className="w-full input-style p-3 duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                     <input type="text" placeholder="Kecamatan*" value={district} onChange={(e) => setDistrict(e.target.value)} required className="w-full input-style p-3 duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                     <input type="text" placeholder="Kelurahan/Desa*" value={subDistrict} onChange={(e) => setSubDistrict(e.target.value)} required className="w-full input-style p-3 duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                     <input type="text" placeholder="RT/RW*" value={ward} onChange={(e) => setWard(e.target.value)} required className="w-full input-style p-3 border-b-blue-500 duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                 </div>
             </div>
            {/* Catatan */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2 ">Catatan Tambahan (Opsional)</label>
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Tolong bawa peralatan lengkap." className="w-full input-style duration-300 bg-gray-100 hover:bg-gray-200 rounded-lg p-3"></textarea>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-b-lg sticky bottom-0">
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Pesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// --- Komponen Halaman Utama ---
export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: serviceId } = params;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      try {
        const resService = await fetch(`/api/services/search?id=${serviceId}`);
        const serviceData = await resService.json();
        if (!resService.ok || !serviceData.data || serviceData.data.length === 0) {
            throw new Error('Layanan tidak ditemukan.');
        }
        const resReviews = await fetch(`/api/reviews?serviceId=${serviceId}`);
        const reviewsData = await resReviews.json();
        const fullServiceData = {
          ...serviceData.data[0],
          reviews: resReviews.ok ? reviewsData.data : []
        };
        setService(fullServiceData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServiceDetails();
  }, [serviceId]);

  const handleCreateOrder = async (formData: any) => {
    if (!service) return;
    setIsOrdering(true);
    setError(null);
    try {
      // Menyiapkan data sesuai yang dibutuhkan API backend
      const payload = {
          providerServiceId: formData.providerServiceId,
          scheduledDate: new Date(formData.scheduledDate).toISOString(), // Format ISO 8601 yang diterima backend
          jobAddress: formData.jobAddress,
          district: formData.district,
          subDistrict: formData.subDistrict,
          ward: formData.ward,
          notes: formData.notes,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Mengirim payload yang sudah lengkap
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat pesanan. Pastikan semua field terisi.');
      }

      const newOrderId = result.data.id;
      setIsModalOpen(false);
      router.push(`/customer/orders/${newOrderId}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsOrdering(false);
    }
  };
  
  

  if (isLoading) return <div className="text-center py-20">Memuat detail layanan...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
  if (!service) return <div className="text-center py-20">Layanan tidak ditemukan.</div>;

  return (
    <>
      {isModalOpen && service && (
        <OrderModal 
          service={service} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreateOrder}
          isSubmitting={isOrdering}
        />
      )}
      <div className="bg-white min-h-screen text-gray-600">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                 <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{service.serviceName}</h1>
                 <div className="flex items-center space-x-4 mb-6 text-gray-600">
                     <div className="flex items-center"><Tag className="mr-2 h-5 w-5 text-blue-500"/> {service.category.name}</div>
                     <div className="flex items-center"><Star className="mr-1 h-5 w-5 text-yellow-500" fill="currentColor"/> <span className="font-bold text-yellow-500">{(service.provider.rating || 0).toFixed(1)}</span><span className="ml-1 text-gray-500">({service.reviews.length} ulasan)</span></div>
                     <div className="flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-green-500"/> {service.provider.reviewCount} ulasan total</div>
                 </div>
                 <p className="text-gray-700 leading-relaxed mb-8">{service.description}</p>
                 <div className="mt-12">
                     <h2 className="text-2xl font-bold text-gray-800 mb-6">Ulasan Pelanggan</h2>
                     <div className="space-y-6">
                         {service.reviews.length > 0 ? (
                             service.reviews.map(review => (
                                 <div key={review.id} className="border-b pb-6">
                                     <div className="flex items-start">
                                         <img src={review.customer.profilePictureUrl || '/default-avatar.png'} alt={review.customer.fullName} className="w-12 h-12 rounded-full mr-4 object-cover"/>
                                         <div>
                                             <p className="font-bold">{review.customer.fullName}</p>
                                             <div className="flex items-center">
                                                 {[...Array(5)].map((_, i) => ( <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor"/> ))}
                                             </div>
                                         </div>
                                     </div>
                                     <p className="mt-3 text-gray-600">{review.comment}</p>
                                 </div>
                             ))
                         ) : (<p className="text-gray-500">Belum ada ulasan untuk layanan ini.</p>)}
                     </div>
                 </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg shadow-md sticky top-28">
                  <div className="text-center border-b pb-4 mb-4">
                      <img src={service.provider.profilePictureUrl || '/default-avatar.png'} alt={service.provider.fullName} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"/>
                      <h3 className="text-xl font-bold">{service.provider.fullName}</h3>
                      <p className="text-sm text-gray-500">Penyedia Jasa</p>
                  </div>
                  <div className="text-2xl text-center font-bold text-gray-800 my-4">Rp{new Intl.NumberFormat('id-ID').format(service.price)}</div>
                  <p className="text-xs text-center text-gray-500 mb-6">Harga final dapat bervariasi</p>
                  <div className="space-y-3">
                      <button 
                          onClick={() => setIsModalOpen(true)}
                          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-lg"
                      >
                          <ShoppingCart className="mr-3 h-6 w-6"/>
                          Pesan Sekarang
                      </button>
                        <StartChatButton
                          participantId={service.provider.id}
                          buttonText="Chat Provider"
                      />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}