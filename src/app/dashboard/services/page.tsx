"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, PlusCircle, X } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";

// Tipe data untuk kategori
interface Category {
  id: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  _count: {
    providerServices: number;
  };
}

// Tipe data untuk form
interface CategoryFormData {
  name: string;
  description: string;
  icon_url: string;
}

type ModalState =
  | { type: "add" }
  | { type: "edit"; category: Category }
  | { type: "delete"; category: Category }
  | null;

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: "", description: "", icon_url: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error("Gagal memuat data kategori.");
      const data = await response.json();
      setCategories(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleOpenModal = (type: 'add' | 'edit' | 'delete', category?: Category) => {
    if (type === 'add') {
      setFormData({ name: "", description: "", icon_url: "" });
      setModalState({ type: 'add' });
    } else if (type === 'edit' && category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        icon_url: category.iconUrl || "",
      });
      setModalState({ type: 'edit', category });
    } else if (type === 'delete' && category) {
      setModalState({ type: 'delete', category });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = modalState?.type === 'edit';
    const url = isEditing ? `/api/admin/categories/${(modalState as any).category.id}` : '/api/admin/categories';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Gagal ${isEditing ? 'memperbarui' : 'menambah'} kategori.`);
      }
      
      setModalState(null);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus kategori.');
      }
      setModalState(null);
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const columns = [
    { header: "Nama Kategori", accessorKey: "name" as keyof Category, sortable: true },
    { header: "Deskripsi", accessorKey: "description" as keyof Category },
    {
      header: "Jumlah Layanan",
      cell: (row: Category) => <span className="text-center block">{row._count.providerServices}</span>,
      sortable: true,
      // PERBAIKAN: Gunakan sortAccessor untuk mengurutkan berdasarkan nilai _count
      sortAccessor: (row: Category) => row._count.providerServices,
    },
    {
      header: "Aksi",
      cell: (row: Category) => (
        <div className="flex space-x-2">
          <button onClick={() => handleOpenModal('edit', row)} className="p-2 text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleOpenModal('delete', row)} className="p-2 text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="p-6 text-gray-600">Memuat data kategori...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    // PERBAIKAN: Tambahkan text-gray-600 di div terluar
    <div className="min-h-screen bg-gray-50 p-6 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Kategori Layanan</h1>
          <button onClick={() => handleOpenModal('add')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 duration-300">
            <PlusCircle className="w-5 h-5" />
            Tambah Kategori
          </button>
        </div>
        <ReusableTable
          data={categories}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari kategori..."
          enablePagination // <-- Ini sudah benar (shorthand untuk true)
          itemsPerPage={5} // PERBAIKAN: Paginasi sekarang akan menampilkan 5 item per halaman
        />
      </div>

      {/* ... (Modal code remains the same) ... */}
      {(modalState?.type === 'add' || modalState?.type === 'edit') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">{modalState.type === 'edit' ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <button type="button" onClick={() => setModalState(null)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" rows={3}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Ikon (Opsional)</label>
                  <input type="text" value={formData.icon_url} onChange={(e) => setFormData({...formData, icon_url: e.target.value})} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
                <button type="button" onClick={() => setModalState(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalState?.type === 'delete' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800">Hapus Kategori</h3>
            <p className="my-4 text-sm text-gray-600">Yakin ingin menghapus kategori <b>"{modalState.category.name}"</b>? Ini tidak dapat diurungkan.</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModalState(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Batal</button>
              <button onClick={() => handleDelete(modalState.category.id)} className="px-4 py-2 bg-red-600 text-white rounded-md">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
