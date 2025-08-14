"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

// Definisikan tipe data untuk kategori
interface Category {
  id: string;
  name: string;
  description: string;
}

// Komponen Modal Kustom (pengganti <Modal> dari Flowbite)
const CustomModal = ({ show, onClose, title, children }: { show: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat diklik di dalam konten
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
            onClick={onClose}
          >
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};


export default function ServiceCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([
    { id: "CAT-001", name: "Service AC", description: "Layanan perbaikan dan perawatan AC" },
    { id: "CAT-002", name: "Bersih Rumah", description: "Layanan kebersihan rumah" },
    { id: "CAT-003", name: "Tukang Kayu", description: "Layanan pertukangan kayu" },
    { id: "CAT-004", name: "Plumbing", description: "Layanan perbaikan pipa" },
  ]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userString = localStorage.getItem("user");
      if (!userString) {
        router.push("/login?error=unauthenticated");
        return;
      }
      
      const user = JSON.parse(userString);
      const roleName = user?.role;

      if (roleName !== "admin") {
        const redirectPath = roleName === "provider" ? "/provider/dashboard" : "/";
        router.push(redirectPath);
      }
    }
  }, [router]);

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      cat.description.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleOpenAddModal = () => {
    setIsEdit(false);
    setCurrentCategory({ id: "", name: "", description: "" });
    setShowModal(true);
  };
  
  const handleOpenEditModal = (category: Category) => {
    setIsEdit(true);
    setCurrentCategory(category);
    setShowModal(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!currentCategory?.name) {
        setError("Nama kategori tidak boleh kosong.");
        return;
    }

    if (isEdit) {
      setCategories(categories.map((cat) => (cat.id === currentCategory.id ? currentCategory : cat)));
    } else {
      const newCategory = { ...currentCategory, id: `CAT-${Date.now()}` };
      setCategories([...categories, newCategory]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };
  
  const handleModalInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (currentCategory) {
        setCurrentCategory({ ...currentCategory, [id]: value });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kategori Layanan</h1>
        <p className="text-gray-600 mt-2">Kelola kategori layanan untuk E-Kerja Karawang</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        {/* Pengganti TextInput */}
        <input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3 block p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
        />
        {/* Pengganti Button */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
        >
          Tambah Kategori
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Pengganti Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">ID</th>
              <th scope="col" className="px-6 py-3">Nama Kategori</th>
              <th scope="col" className="px-6 py-3">Deskripsi</th>
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr key={category.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{category.id}</td>
                <td className="px-6 py-4">{category.name}</td>
                <td className="px-6 py-4">{category.description}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(category)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Penggunaan Modal Kustom */}
      <CustomModal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        title={isEdit ? "Edit Kategori" : "Tambah Kategori Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">
              Nama Kategori
            </label>
            <input
              type="text"
              id="name"
              value={currentCategory?.name || ""}
              onChange={handleModalInputChange}
              required
              placeholder="Masukkan nama kategori"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">
              Deskripsi
            </label>
            <input
              type="text"
              id="description"
              value={currentCategory?.description || ""}
              onChange={handleModalInputChange}
              placeholder="Masukkan deskripsi kategori"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}