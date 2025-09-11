"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";

// Tipe data disesuaikan dengan respons dari API /api/admin/providers
interface Provider {
  id: string; // ID bisa berupa string (UUID) atau number
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

type ModalState =
  | { type: "toggleStatus"; provider: Provider }
  | null;

export default function ManageProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/providers');
      if (!response.ok) {
        throw new Error("Gagal mengambil data penyedia jasa.");
      }
      const data = await response.json();
      // Sesuaikan dengan struktur data API Anda, yang mungkin berada di dalam data.data
      setProviders(data.data?.data || data.data || []);
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

  // Fungsi untuk mengubah status aktif/tidak aktif
  const handleToggleStatus = async (provider: Provider) => {
    const newStatus = !provider.isActive;
    try {
      const response = await fetch(`/api/admin/providers/${provider.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal memperbarui status.');
      }

      // Update data di state secara lokal agar UI langsung berubah
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isActive: newStatus } : p))
      );
      setModalState(null);

    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      header: "#",
      cell: (_row: Provider, index: number) => <span>{index + 1}</span>,
    },
    { header: "Nama Lengkap", accessorKey: "fullName" as keyof Provider, sortable: true },
    { header: "Email", accessorKey: "email" as keyof Provider, sortable: true },
    { header: "No. Telepon", accessorKey: "phoneNumber" as keyof Provider },
    {
      header: "Status",
      accessorKey: "isActive" as keyof Provider,
      sortable: true,
      cell: (row: Provider) => (
        <>
          {row.isActive ? (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center w-fit">
              <CheckCircle className="w-3 h-3 mr-1" />
              Aktif
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center w-fit">
              <XCircle className="w-3 h-3 mr-1" />
              Tidak Aktif
            </span>
          )}
        </>
      ),
    },
    {
      header: "Aksi",
      cell: (row: Provider) => (
        <button
          onClick={() => setModalState({ type: "toggleStatus", provider: row })}
          className={`text-white px-3 py-1.5 rounded duration-300 text-xs font-semibold
            ${row.isActive 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          {row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        </button>
      ),
    },
  ];

  if (isLoading) return <div className="p-6">Memuat data penyedia jasa...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Penyedia Jasa</h1>
        <ReusableTable
          data={providers}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari nama, email, atau no. telepon..."
          enablePagination
          itemsPerPage={10}
        />
      </div>

      {/* --- MODAL KONFIRMASI --- */}
      {modalState?.type === "toggleStatus" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Perubahan Status
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Yakin ingin <b>{modalState.provider.isActive ? 'menonaktifkan' : 'mengaktifkan'}</b> akun penyedia jasa 
              bernama <b>{modalState.provider.fullName}</b>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded duration-300 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleToggleStatus(modalState.provider)}
                className={`px-4 py-2 text-white rounded duration-300
                  ${modalState.provider.isActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                Ya, {modalState.provider.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
