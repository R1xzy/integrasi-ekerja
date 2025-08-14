'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, AlertCircle, CheckCircle, XCircle, Star, MapPin, Calendar } from "lucide-react";
import { sampleOrders, Order } from "@/lib/sampleOrders";

interface AdditionalCost {
  id: string;
  description: string;
  amount: number;
}

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order & { additionalCosts?: AdditionalCost[] } | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    const found = sampleOrders.find((o) => o.id === id);
    if (found) {
      // Contoh data tambahan
      setOrder({
        ...found,
        additionalCosts: [
          { id: "AC-001", description: "Ganti spare part", amount: 50000 },
          { id: "AC-002", description: "Beli cat pelapis", amount: 30000 }
        ]
      });
    }
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-semibold text-gray-700 mb-4">Pesanan tidak ditemukan</h1>
          <button
            onClick={() => router.push('/orders')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke daftar pesanan
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Dikerjakan
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Dibatalkan
          </span>
        );
      default:
        return null;
    }
  };

  const renderStars = (ratingValue: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        onClick={() => setRating(i + 1)}
        className={`w-6 h-6 cursor-pointer ${
          i < ratingValue ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmitReview = () => {
    console.log("Rating:", rating, "Review:", review);
    alert("Ulasan berhasil dikirim!");
  };

  const handleApproveCost = () => {
    alert("Biaya tambahan disetujui!");
  };

  const handleRejectCost = () => {
    alert("Biaya tambahan ditolak!");
  };

  const totalAdditional = order.additionalCosts?.reduce((sum, item) => sum + item.amount, 0) || 0;
  const totalPrice = order.amount + totalAdditional;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{order.service}</h1>
          {getStatusBadge(order.status)}
        </div>

        {/* Detail provider & waktu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Provider</h2>
            <p className="text-sm text-gray-600">Nama</p>
            <p className="font-medium text-gray-900 mb-2">{order.provider}</p>
            <p className="text-sm text-gray-600">Telepon</p>
            <p className="font-medium text-gray-900">{order.providerPhone}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lokasi & Waktu</h2>
            <div className="flex items-center mb-2 text-gray-600 ">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span>{order.location}</span>
            </div>
            <div className="text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span>{formatDate(order.date)} - {order.time}</span>
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Deskripsi</h2>
          <p className="text-gray-900">{order.description}</p>
        </div>

        {/* Estimasi selesai */}
        {order.estimatedCompletion && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Estimasi Selesai</h2>
            <p className="text-gray-900">{formatDateTime(order.estimatedCompletion)}</p>
          </div>
        )}

        {/* Biaya tambahan saat in_progress */}
        {order.status === 'in_progress' && order.additionalCosts && order.additionalCosts.length > 0 && (
  <div className="bg-white rounded-lg shadow p-6 mb-8">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Permintaan Biaya Tambahan</h2>
    <ul className="space-y-4">
      {order.additionalCosts.map((item) => (
        <li key={item.id} className="shadow-sm hover:shadow-md rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900">{item.description}</p>
            <p className="text-blue-600 font-semibold">{formatCurrency(item.amount)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                alert(`Biaya "${item.description}" disetujui!`);
              }}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
            >
              Setujui
            </button>
            <button
              onClick={() => {
                alert(`Biaya "${item.description}" ditolak!`);
              }}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tolak
            </button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

        {/* Kalkulasi harga akhir saat completed */}
        {order.status === 'completed' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rincian Biaya</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className=" text-gray-500 ">Biaya Awal</span>
                <span className=" text-gray-500 ">{formatCurrency(order.amount)}</span>
              </div>
              {order.additionalCosts?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className=" text-gray-500 ">{item.description}</span>
                  <span className=" text-gray-500 ">{formatCurrency(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span className=" text-gray-500 ">Total</span>
                <span className=" text-gray-500 ">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form ulasan */}
        {order.status === 'completed' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Beri Ulasan</h2>
            <div className="flex items-center mb-4 space-x-1">
              {renderStars(rating)}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
              placeholder="Tulis ulasan Anda di sini..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
            <button
              onClick={handleSubmitReview}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kirim Ulasan
            </button>
          </div>
        )}

        {/* Total & tombol kembali */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPrice)}</p>
            </div>
            <button
              onClick={() => router.push('/orders')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
