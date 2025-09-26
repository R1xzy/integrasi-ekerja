'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Star, ShoppingBag, Loader, XCircle, Tag, Save, X, ArrowLeft, PenTool
} from "lucide-react";
import { authenticatedFetch } from '@/lib/auth-client';
import Link from 'next/link';

// --- Tipe Data dari API ---
interface Category {
  id: number;
  name: string;
}

interface Service {
  id: number;
  serviceTitle: string;
  price: number;
  priceUnit: string; // Harus ada untuk form
  description: string;
  imageUrls?: string[]; 
  isAvailable: boolean; 
  category: {
    id: number;
    name: string;
  };
  // Tambahkan categoryId di level atas untuk konsistensi form/modal
  categoryId: number; 
  ordersCount?: number; 
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
}

interface ProviderStats {
    totalOrders: number;
    averageRating: number;
}

// Data awal untuk formulir (digunakan saat mode 'Add')
const initialFormData = {
  serviceTitle: '',
  description: '',
  price: 0,
  priceUnit: 'per jam', 
  isAvailable: true,
  categoryId: 0, 
};

// =================================================================
// KOMPONEN PEMBANTU: FORMULIR TAMBAH/EDIT LAYANAN (MODAL)
// =================================================================

interface ServiceFormModalProps {
  serviceToEdit: Service | null; // null jika mode 'Add'
  categories: Category[];
  onClose: () => void;
  onSuccess: (newService: Service) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ serviceToEdit, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditMode = !!serviceToEdit;
  const modalTitle = isEditMode ? `Edit Layanan: ${serviceToEdit?.serviceTitle}` : 'Tambah Layanan Baru';

  // Sinkronisasi data saat serviceToEdit berubah
  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        serviceTitle: serviceToEdit.serviceTitle,
        description: serviceToEdit.description,
        price: serviceToEdit.price,
        priceUnit: serviceToEdit.priceUnit,
        isAvailable: serviceToEdit.isAvailable,
        categoryId: serviceToEdit.categoryId,
      });
    } else {
      // Jika mode Add, reset form dan set categoryId default
      setFormData({
        ...initialFormData,
        categoryId: categories[0]?.id || 0 // Set default category ID
      });
    }
  }, [serviceToEdit, categories]);
  
  if (categories.length === 0 && !isLoading) {
    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm">
                <p className="text-red-600">Gagal memuat kategori. Tidak bisa menampilkan formulir.</p>
                <button onClick={onClose} className="mt-4 text-sm text-gray-600">Tutup</button>
            </div>
        </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number | boolean = value;
    if (name === 'price') {
        processedValue = parseFloat(value);
    } else if (name === 'categoryId') {
        processedValue = parseInt(value, 10);
    }

    setFormData(prev => ({
      ...prev!,
      [name]: processedValue,
    }));
  };
  
  const handleToggleAvailable = () => {
    setFormData(prev => ({ ...prev!, isAvailable: !prev!.isAvailable }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `/api/providers/services/${serviceToEdit!.id}` : '/api/providers/services';

    // Data yang dikirim ke API
    const dataToSend = {
      ...formData,
      price: formData.price.toString(),
      categoryId: formData.categoryId.toString(), // Kirim ID sebagai string ke API
    };

    try {
      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} layanan.`);
      }

      // Memanggil callback untuk memperbarui state di halaman induk
      onSuccess({
        ...result.data, // Gunakan data hasil API (termasuk ID jika POST)
        ...dataToSend, 
        id: isEditMode ? serviceToEdit!.id : result.data.id, 
        price: parseFloat(dataToSend.price),
        categoryId: parseInt(dataToSend.categoryId),
        // Tambahkan properti yang mungkin hilang setelah PUT/POST
        ordersCount: serviceToEdit?.ordersCount || 0,
        averageRating: serviceToEdit?.averageRating || 0,
        reviewCount: serviceToEdit?.reviewCount || 0,
      } as Service);
      
      onClose();
      alert(`Layanan berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* PERBAIKAN: Mengubah items-end menjadi items-center untuk centering vertikal eksplisit */}
      <div className="flex items-center justify-center min-h-screen px-4 pb-20 text-center pt-4 sm:p-0">
        
        {/* Background overlay - Pastikan z-index lebih rendah dari modal content */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity z-40" aria-hidden="true"></div> 

        {/* Modal panel (The actual form box) - Tambahkan relative dan z-50 */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-50">
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{modalTitle}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                <XCircle className="w-5 h-5 inline mr-2"/>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              
              <div>
                <label htmlFor="serviceTitle" className="block text-sm font-medium text-gray-700">Judul Layanan</label>
                <input type="text" name="serviceTitle" id="serviceTitle" value={formData.serviceTitle} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Kategori</label>
                  <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2">
                    {categories
                      .filter(c => c.id !== 0) 
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga Dasar (Rp)</label>
                  <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} min="0" step="1000" required className=" p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
                </div>
              </div>

              <div>
                <label htmlFor="priceUnit" className="block text-sm font-medium text-gray-700">Satuan Harga</label>
                <select
                  id="priceUnit"
                  name="priceUnit"
                  value={formData.priceUnit}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2"
                >
                  <option value="per jam">Per Jam</option>
                  <option value="per hari">Per Hari</option>
                  <option value="per project">Per Project</option>
                  <option value="per item">Per Item</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Status Ketersediaan:</span>
                <button type="button" onClick={handleToggleAvailable} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    formData.isAvailable ? 'bg-green-600' : 'bg-gray-200'
                  }`}>
                  <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.isAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`ml-3 text-sm font-medium ${formData.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {formData.isAvailable ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>

              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm disabled:opacity-50"
                >
                  {isLoading ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  {isEditMode ? 'Simpan Perubahan' : 'Tambah Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// KOMPONEN UTAMA: PROVIDER SERVICES PAGE
// =================================================================
export default function ProviderServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [overallStats, setOverallStats] = useState<ProviderStats>({ totalOrders: 0, averageRating: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State untuk Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null); // null untuk mode Add

  const fetchServicesData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        servicesResponse, categoriesResponse, statsResponse
      ] = await Promise.all([
        authenticatedFetch('/api/providers/services'),
        authenticatedFetch('/api/service-categories'),
        authenticatedFetch('/api/provider/statistics')
      ]);

      const [servicesResult, categoriesResult, statsResult] = await Promise.all([
        servicesResponse.json(), categoriesResponse.json(), statsResponse.json()
      ]);
      
      if (!servicesResult.success || !categoriesResult.success || !statsResult.success) {
          throw new Error("Gagal memuat sebagian data dashboard");
      }
      
      setOverallStats(statsResult.data);
      
      const fetchedServices: Service[] = servicesResult.data.map((service: any) => ({
          ...service,
          // Memastikan categoryId ada di level atas (Fix Error Tipe Data)
          categoryId: service.category.id, 
          ordersCount: service.ordersCount || 0,
          averageRating: service.averageRating || 0, 
          reviewCount: service.reviewCount || 0, 
      }));

      // Menambahkan opsi 'Semua Kategori' di awal
      const fetchedCategories: Category[] = [{ id: 0, name: "Semua Kategori" }, ...categoriesResult.data];

      setServices(fetchedServices);
      setCategories(fetchedCategories);

    } catch (err: any) {
      console.error("Gagal memuat data layanan:", err);
      setError(err.message || "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicesData();
  }, [fetchServicesData]);

  // Logika Filter dan Pencarian
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.serviceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || String(service.category.id) === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);


  // --- Action CRUD (C, U, D) ---

  const handleServiceSuccess = (newOrUpdatedService: Service) => {
    setServices(prevServices => {
        if (prevServices.some(s => s.id === newOrUpdatedService.id)) {
            // Mode Edit: Update layanan yang sudah ada
            return prevServices.map(s => s.id === newOrUpdatedService.id ? newOrUpdatedService : s);
        } else {
            // Mode Add: Tambahkan layanan baru
            return [newOrUpdatedService, ...prevServices];
        }
    });
    // Re-fetch data statistik global untuk memastikan total layanan terupdate
    authenticatedFetch('/api/provider/statistics').then(res => res.json()).then(result => {
        if (result.success) {
            setOverallStats(result.data);
        }
    });
  };

  const handleAddService = () => {
    setServiceToEdit(null); // Mode Add
    setIsModalOpen(true);
  };

  const handleEditService = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        setServiceToEdit(service);
        setIsModalOpen(true);
    }
  };

  const handleToggleService = async (serviceId: number, currentStatus: boolean) => {
    if (!confirm(`Apakah Anda yakin ingin ${currentStatus ? 'menonaktifkan' : 'mengaktifkan'} layanan ini?`)) return;
    try {
      const response = await authenticatedFetch(`/api/providers/services/${serviceId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Gagal mengubah status layanan");
      }
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isAvailable: !currentStatus } : s));
    } catch (err: any) {
      alert(`Error mengubah status: ${err.message}`);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm("Apakah Anda yakin ingin MENGHAPUS layanan ini secara permanen?")) return;
    try {
      const response = await authenticatedFetch(`/api/providers/services/${serviceId}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Gagal menghapus layanan. Pastikan tidak ada pesanan aktif.");
      }
      setServices(prev => prev.filter(s => s.id !== serviceId));
      alert("Layanan berhasil dihapus.");
      // Re-fetch data statistik global
      authenticatedFetch('/api/provider/statistics').then(res => res.json()).then(result => {
          if (result.success) {
              setOverallStats(result.data);
          }
      });
    } catch (err: any) {
      alert(`Error menghapus: ${err.message}`);
    }
  };

  const handleViewService = (serviceId: number) => {
    router.push(`/services/${serviceId}`);
  };


  // --- Utility Functions & Stats Calculation ---
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  const totalServices = services.length;
  const activeServices = services.filter(s => s.isAvailable).length;
  const totalOrders = overallStats.totalOrders;
  const averageRating = overallStats.averageRating > 0 ? overallStats.averageRating.toFixed(1) : 'N/A';
  
  // --- Loading dan Error Handling ---
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-10 w-10 text-green-600" /></div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-500 flex items-center justify-center"><XCircle className="w-6 h-6 mr-2"/>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* RENDER MODAL TAMBAH/EDIT */}
      {isModalOpen && (
        <ServiceFormModal
          serviceToEdit={serviceToEdit}
          categories={categories}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleServiceSuccess}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Layanan Saya</h1>
            <p className="text-gray-600 mt-2">Kelola layanan yang Anda tawarkan</p>
          </div>
          <button 
            onClick={handleAddService} // Membuka modal mode Add
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Layanan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Layanan" value={totalServices} icon={<ShoppingBag />} color="bg-green-100 text-green-600" />
          <StatCard title="Layanan Aktif" value={activeServices} icon={activeServices > 0 ? <ToggleRight /> : <ToggleLeft />} color="bg-blue-100 text-blue-600" />
          <StatCard title="Rating Rata-rata" value={averageRating} icon={<Star />} color="bg-yellow-100 text-yellow-600" />
          <StatCard title="Total Pesanan" value={totalOrders} icon={<ShoppingBag />} color="bg-purple-100 text-purple-600" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari layanan..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length > 0 ? filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <img
                  src={service.imageUrls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={service.serviceTitle}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleToggleService(service.id, service.isAvailable)}
                    className={`p-2 rounded-full transition-colors ${
                      service.isAvailable 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {service.isAvailable ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    service.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.isAvailable ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {service.serviceTitle}
                  </h3>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {(service.averageRating ?? 0).toFixed(1)} ({service.reviewCount ?? 0} ulasan)
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {service.ordersCount ?? 0} pesanan
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(service.price)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                       <Tag className="w-3 h-3 mr-1"/>
                       {service.category.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                       Dibuat {formatDate(service.createdAt)}
                    </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewService(service.id)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    Lihat
                  </button>
                  <button
                    onClick={() => handleEditService(service.id)} // Membuka modal mode Edit
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : <div className="lg:col-span-3 text-center py-12 text-gray-500"><PenTool className="w-12 h-12 mx-auto mb-4"/>Belum ada layanan ditemukan.</div>}
        </div>
      </div>
    </div>
  );
}


// Komponen Pembantu untuk Kartu Statistik (Dipindahkan ke luar komponen utama)
const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);