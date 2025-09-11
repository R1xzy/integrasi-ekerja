"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";
import { authenticatedFetch } from "@/lib/auth-client";

// Tipe data disesuaikan dengan respons dari API backend
interface ProviderDocument {
  id: number;
  documentType: 'KTP' | 'CERTIFICATE';
  filePath: string;
}

interface Provider {
  id: number;
  fullName: string;
  email: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  providerDocuments: ProviderDocument[];
}

type ModalState =
  | { type: "document"; title: string; url: string }
  | { type: "approve"; provider: Provider }
  | { type: "reject"; provider: Provider }
  | null;

export default function VerifyProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/admin/verification?status=PENDING');
      if (!response.ok) {
        throw new Error("Gagal mengambil data penyedia jasa.");
      }
      const data = await response.json();
      setProviders(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ambil data saat komponen pertama kali dimuat
  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk mengirim update verifikasi ke API
  const handleVerification = async (providerId: number, status: "VERIFIED" | "REJECTED", reason?: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/verification?providerId=${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }), // Kirim status dan alasan
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui status.');
      }

      // Hapus provider dari daftar setelah berhasil diupdate
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
      setModalState(null);
      setRejectionReason("");

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Helper untuk mencari URL dokumen
  const findDocumentUrl = (provider: Provider, type: 'KTP' | 'CERTIFICATE') => {
    const doc = provider.providerDocuments.find(d => d.documentType === type);
    return doc ? doc.filePath : '/placeholder.png'; // Ganti dengan URL placeholder jika perlu
  };

  const columns = [
    {
      header: "#",
      cell: (_row: Provider, index: number) => <span>{index + 1}</span>,
    },
    { header: "Nama", accessorKey: "fullName" as keyof Provider, sortable: true },
    { header: "Email", accessorKey: "email" as keyof Provider, sortable: true },
    {
      header: "KTP",
      cell: (row: Provider) => (
        <button
          onClick={() =>
            setModalState({ type: "document", title: `KTP - ${row.fullName}`, url: findDocumentUrl(row, 'KTP') })
          }
          className="text-blue-600 duration-300 hover:text-blue-900"
        >
          Lihat
        </button>
      ),
    },
    {
      header: "Sertifikat",
      cell: (row: Provider) => (
        <button
          onClick={() =>
            setModalState({
              type: "document",
              title: `Sertifikat - ${row.fullName}`,
              url: findDocumentUrl(row, 'CERTIFICATE'),
            })
          }
          className="text-blue-600 duration-300 hover:text-blue-900"
        >
          Lihat
        </button>
      ),
    },
    {
      header: "Status",
      accessorKey: "verificationStatus" as keyof Provider,
      sortable: true,
      cell: (row: Provider) => (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Pending
        </span>
      ),
    },
    {
      header: "Aksi",
      cell: (row: Provider) => (
        <div className="space-x-2">
          <button
            onClick={() => setModalState({ type: "approve", provider: row })}
            className="bg-green-500 text-white px-3 py-1.5 rounded duration-300 hover:bg-green-600 text-xs"
          >
            Approve
          </button>
          <button
            onClick={() => setModalState({ type: "reject", provider: row })}
            className="bg-red-500 text-white px-3 py-1.5 rounded duration-300 hover:bg-red-600 text-xs"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-6">Memuat data verifikasi...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Verifikasi Penyedia Jasa (Pending)</h1>
        <ReusableTable
          data={providers}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari nama atau email..."
          enablePagination
          itemsPerPage={10}
        />
      </div>

      {/* --- MODALS --- */}
      {modalState?.type === "document" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">{modalState.title}</h2>
              <button onClick={() => setModalState(null)} className="text-gray-500 duration-300 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Menggunakan <iframe> untuk menampilkan PDF atau gambar */}
            <iframe src={modalState.url} className="w-full h-[80vh]" title={modalState.title}></iframe>
          </div>
        </div>
      )}

      {modalState?.type === "approve" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Approve</h3>
            <p className="text-sm text-gray-600 mb-4">
              Yakin ingin menyetujui penyedia <b>{modalState.provider.fullName}</b>?
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalState(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded duration-300 hover:bg-gray-300">
                Batal
              </button>
              <button onClick={() => handleVerification(modalState.provider.id, "VERIFIED")} className="px-4 py-2 bg-green-600 text-white rounded duration-300 hover:bg-green-900">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {modalState?.type === "reject" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tolak Penyedia: {modalState.provider.fullName}
            </h3>
            <textarea
              rows={3}
              className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500 text-gray-600"
              placeholder="Alasan penolakan (opsional)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalState(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded duration-300 hover:bg-gray-300">
                Batal
              </button>
              <button onClick={() => handleVerification(modalState.provider.id, "REJECTED", rejectionReason)} className="px-4 py-2 bg-red-600 text-white rounded duration-300 hover:bg-red-900">
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
