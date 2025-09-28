"use client";
import Link from 'next/link';
import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, FileText } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";
import { authenticatedFetch } from '@/lib/auth-client';

// Tipe data disesuaikan dengan respons dari API /api/admin/providers
interface Provider {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
}

interface ProviderDocument {
  id: string | number;
  documentType: string;
  documentName: string;
  fileUrl: string;
  issuingOrganization?: string;
  issuedAt?: string;
  createdAt?: string;
}

interface ProviderVerificationDetail {
  id: string | number;
  fullName: string;
  email: string;
  verificationStatus: string;
  providerDocuments: ProviderDocument[];
  verifier?: {
    id: string | number;
    fullName: string;
    email: string;
  };
}

type ModalState =
  | { type: "toggleStatus"; provider: Provider }
  | { type: "viewDocuments"; providerId: string | number }
  | null;

export default function ManageProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationDetail, setVerificationDetail] = useState<ProviderVerificationDetail | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Menggunakan authenticatedFetch untuk otentikasi admin
      const response = await authenticatedFetch('/api/admin/providers');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengambil data penyedia jasa.");
      }
      const data = await response.json();
      setProviders(data.data?.data || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk mengubah status aktif/tidak aktif
  const handleToggleStatus = async (provider: Provider) => {
    const newStatus = !provider.isActive;
    setSubmissionError(null);
    setSuccessMessage(null);
    try {
      // Menggunakan authenticatedFetch untuk otentikasi admin
      const response = await authenticatedFetch(`/api/admin/providers/${provider.id}`, {
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

      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isActive: newStatus } : p))
      );
      setModalState(null);
      setSuccessMessage(`Status penyedia jasa "${provider.fullName}" berhasil diperbarui.`);

    } catch (err: any) {
      setSubmissionError(err.message);
    }
  };

  // Fungsi untuk melihat dokumen provider
  const handleViewDocuments = async (providerId: string | number) => {
    setIsLoadingDocuments(true);
    setDocError(null);
    setVerificationDetail(null);
    setModalState({ type: "viewDocuments", providerId });
    try {
      // Menggunakan authenticatedFetch untuk otentikasi admin
      const response = await authenticatedFetch(`/api/admin/providers/${providerId}/verification`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mengambil dokumen provider.");
      }
      const data = await response.json();
      setVerificationDetail(data.data);
    } catch (err: any) {
      setDocError(err.message);
    } finally {
      setIsLoadingDocuments(false);
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
        <div className="flex gap-2">
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
          <button
            onClick={() => handleViewDocuments(row.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1"
            title="Lihat Dokumen"
          >
            <FileText className="w-4 h-4" />
            Dokumen
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-6">Memuat data penyedia jasa...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Penyedia Jasa</h1>
        {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{successMessage}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setSuccessMessage(null)}>
                    <X className="h-4 w-4 fill-current text-green-700" />
                </span>
            </div>
        )}
        {submissionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{submissionError}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setSubmissionError(null)}>
                    <X className="h-4 w-4 fill-current text-red-700" />
                </span>
            </div>
        )}
        <ReusableTable
          data={providers}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari nama, email, atau no. telepon..."
          enablePagination
          itemsPerPage={10}
        />
        <Link 
      href="/dashboard/providers/verify"
      className="
        inline-flex items-center justify-center 
        px-5 py-2.5 
        font-semibold text-sm text-white 
        bg-blue-600 
        rounded-lg 
        shadow-sm 
        hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-all duration-200 ease-in-out
        transform hover:-translate-y-0.5
        mt-6
      "
    >
      <CheckCircle className="w-4 h-4 mr-2" />
      Lihat halaman verifikasi penyedia jasa
    </Link>
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

      {/* --- MODAL LIHAT DOKUMEN PROVIDER --- */}
      {modalState?.type === "viewDocuments" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => { setModalState(null); setVerificationDetail(null); }}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dokumen Provider</h3>
            {isLoadingDocuments ? (
              <div className="py-4 text-gray-500">Memuat dokumen...</div>
            ) : docError ? (
              <div className="py-4 text-red-500">Error: {docError}</div>
            ) : verificationDetail ? (
              <>
                <div className="mb-2">
                  <div className="font-semibold">{verificationDetail.fullName}</div>
                  <div className="text-sm text-gray-600">{verificationDetail.email}</div>
                  <div className="text-xs text-gray-500 mb-2">Status: <b>{verificationDetail.verificationStatus}</b></div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dokumen:</h4>
                  {verificationDetail.providerDocuments.length === 0 ? (
                    <div className="text-gray-500 text-sm">Belum ada dokumen.</div>
                  ) : (
                    <ul className="space-y-2">
                      {verificationDetail.providerDocuments.map((doc) => (
                        <li key={doc.id} className="border rounded p-2 flex flex-col">
                          <span className="font-medium">{doc.documentName}</span>
                          <span className="text-xs text-gray-500">{doc.documentType}</span>
                          {doc.issuingOrganization && (
                            <span className="text-xs text-gray-500">Diterbitkan oleh: {doc.issuingOrganization}</span>
                          )}
                          {doc.issuedAt && (
                            <span className="text-xs text-gray-500">Tanggal Terbit: {new Date(doc.issuedAt).toLocaleDateString()}</span>
                          )}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-xs mt-1 underline"
                          >
                            Lihat File
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {verificationDetail.verifier && (
                  <div className="mt-4 text-xs text-gray-500">
                    Diverifikasi oleh: {verificationDetail.verifier.fullName} ({verificationDetail.verifier.email})
                  </div>
                )}
              </>
            ) : (
              <div className="py-4 text-gray-500">Tidak ada data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
