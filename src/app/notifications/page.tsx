'use client';

import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertTriangle, Info, PlusCircle } from "lucide-react";

type NotificationType = "order_completed" | "order_rejected" | "extra_fee" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  orderId?: string;
  extraFee?: number;
}

export default function NotificationsPage() {
  const router = useRouter();

  const notifications: Notification[] = [
    {
      id: "1",
      type: "order_completed",
      title: "Pesanan Selesai",
      message: "Pesanan AC untuk rumah Anda telah selesai.",
      date: "2025-08-10",
      orderId: "ORD-001",
    },
    {
      id: "2",
      type: "order_rejected",
      title: "Pesanan Ditolak",
      message: "Pesanan perbaikan listrik ditolak oleh penyedia layanan.",
      date: "2025-08-09",
      orderId: "ORD-002",
    },
    {
      id: "3",
      type: "extra_fee",
      title: "Permintaan Biaya Tambahan",
      message: "Penyedia meminta tambahan Rp 150.000 untuk pembelian sparepart.",
      date: "2025-08-08",
      orderId: "ORD-003",
      extraFee: 150000,
    },
    {
      id: "4",
      type: "info",
      title: "Promo Baru",
      message: "Dapatkan diskon 10% untuk layanan kebersihan minggu ini!",
      date: "2025-08-07",
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAcceptFee = (id: string) => {
    console.log("Biaya tambahan disetujui untuk notifikasi:", id);
  };

  const handleRejectFee = (id: string) => {
    console.log("Biaya tambahan ditolak untuk notifikasi:", id);
  };

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case "order_completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "order_rejected":
        return <XCircle className="w-6 h-6 text-red-500" />;
      case "extra_fee":
        return <PlusCircle className="w-6 h-6 text-yellow-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Notifikasi</h1>
        <p className="text-gray-600 mb-6">Lihat pembaruan terbaru terkait pesanan dan informasi lainnya.</p>

        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className="duration-300 bg-white rounded-lg p-4 shadow-sm hover:shadow-md hover:bg-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                {renderIcon(notif.type)}
                <div>
                  <h2 className="font-semibold text-gray-900">{notif.title}</h2>
                  <p className="text-gray-600 text-sm">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notif.date)}</p>
                </div>
              </div>

              {/* Aksi untuk biaya tambahan */}
              {notif.type === "extra_fee" && notif.extraFee && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptFee(notif.id)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Terima
                  </button>
                  <button
                    onClick={() => handleRejectFee(notif.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Tolak
                  </button>
                </div>
              )}

              {/* Tombol lihat detail jika ada orderId */}
              {notif.orderId && notif.type !== "extra_fee" && (
                <button
                  onClick={() => router.push(`/orders/${notif.orderId}`)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Lihat Detail
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
