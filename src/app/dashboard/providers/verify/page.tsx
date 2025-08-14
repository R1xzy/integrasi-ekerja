"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";

interface Provider {
  id: number;
  name: string;
  email: string;
  ktpUrl: string;
  certificateUrl: string;
  status: "pending" | "approved" | "rejected";
}

type ModalState =
  | { type: "document"; title: string; url: string }
  | { type: "approve"; provider: Provider }
  | { type: "reject"; provider: Provider }
  | null;

const initialProviders: Provider[] = [
  { id: 1, name: "Andi Prasetyo", email: "andi@mail.com", ktpUrl: "...", certificateUrl: "...", status: "pending" },
  { id: 2, name: "Budi Santoso", email: "budi@mail.com", ktpUrl: "...", certificateUrl: "...", status: "approved" },
  { id: 3, name: "Citra Lestari", email: "citra@mail.com", ktpUrl: "...", certificateUrl: "...", status: "rejected" },
  { id: 4, name: "Dewi Anggraini", email: "dewi@mail.com", ktpUrl: "...", certificateUrl: "...", status: "pending" },
  { id: 5, name: "Eko Wijoyo", email: "eko@mail.com", ktpUrl: "...", certificateUrl: "...", status: "approved" },
  { id: 6, name: "Fajar Nugroho", email: "fajar@mail.com", ktpUrl: "...", certificateUrl: "...", status: "pending" },
  { id: 7, name: "Gita Permata", email: "gita@mail.com", ktpUrl: "...", certificateUrl: "...", status: "approved" },
  { id: 8, name: "Hendra Gunawan", email: "hendra@mail.com", ktpUrl: "...", certificateUrl: "...", status: "rejected" },
  { id: 9, name: "Indah Puspita", email: "indah@mail.com", ktpUrl: "...", certificateUrl: "...", status: "pending" },
  { id: 10, name: "Joko Susilo", email: "joko@mail.com", ktpUrl: "...", certificateUrl: "...", status: "approved" },
];

export default function VerifyProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = (providerId: number) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status: "approved" } : p))
    );
    setModalState(null);
  };

  const handleReject = (providerId: number) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status: "rejected" } : p))
    );
    setModalState(null);
    setRejectionReason("");
  };

  const columns = [
    {
      header: "#",
      cell: (_row: Provider, index: number) => <span>{index + 1}</span>,
    },
    
    { header: "ID Provider", accessorKey: "id" as keyof Provider, sortable: true },
    { header: "Nama", accessorKey: "name" as keyof Provider, sortable: true },
    { header: "Email", accessorKey: "email" as keyof Provider, sortable: true },
    {
      header: "KTP",
      cell: (row: Provider) => (
        <button
          onClick={() =>
            setModalState({ type: "document", title: `KTP - ${row.name}`, url: row.ktpUrl })
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
              title: `Sertifikat - ${row.name}`,
              url: row.certificateUrl,
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
      accessorKey: "status" as keyof Provider,
      sortable: true,
      filterValues: ["pending", "approved", "rejected"], // otomatis filter dropdown
      cell: (row: Provider) => (
        <>
          {row.status === "approved" && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Disetujui
            </span>
          )}
          {row.status === "rejected" && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Ditolak
            </span>
          )}
          {row.status === "pending" && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Pending
            </span>
          )}
        </>
      ),
    },
    {
      header: "Aksi",
      cell: (row: Provider) => (
        <div className="space-x-2">
          {row.status === "pending" ? (
            <>
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
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Verifikasi Penyedia</h1>

        <ReusableTable
          data={providers}
          columns={columns}
          enableSearch
          enablePagination
          itemsPerPage={5}
        />
      </div>

      {/* --- MODALS --- */}
      {modalState?.type === "document" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full overflow-hidden shadow">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">{modalState.title}</h2>
              <button
                onClick={() => setModalState(null)}
                className="text-gray-500 duration-300 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={modalState.url} alt={modalState.title} className="w-full h-auto" />
          </div>
        </div>
      )}

      {modalState?.type === "approve" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Approve</h3>
            <p className="text-sm text-gray-600 mb-4">
              Yakin ingin menyetujui penyedia <b>{modalState.provider.name}</b>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded duration-300 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleApprove(modalState.provider.id)}
                className="px-4 py-2 bg-green-600 text-white rounded duration-300 hover:bg-green-900"
              >
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
              Tolak Penyedia: {modalState.provider.name}
            </h3>
            <textarea
              rows={3}
              className="w-full p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500 text-gray-600"
              placeholder="Alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setModalState(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded duration-300 hover:bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={() => handleReject(modalState.provider.id)}
                className="px-4 py-2 bg-red-600 text-white rounded duration-300 hover:bg-red-900"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
