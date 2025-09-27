"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { Star, Tag, Search, List, ArrowUpDown } from 'lucide-react';
import Avatar from '@/components/Avatar';
// Tipe data yang akan kita gunakan
interface Service {
  id: number;
  serviceName: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string; // <-- PERUBAHAN 1: Menggunakan 'name'
  };
  provider: {
    fullName: string;
    profilePictureUrl: string | null;
    rating: number;
    reviewCount: number;
    email: string;
  };
}

interface Category {
  id: number;
  name: string; // <-- PERUBAHAN 2: Menggunakan 'name'
}

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Komponen Paginasi (tidak ada perubahan)
const Pagination = ({ pagination, onPageChange }: { pagination: PaginationInfo, onPageChange: (page: number) => void }) => {
  if (pagination.totalPages <= 1) return null;
  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center space-x-2 mt-12">
      <button onClick={() => onPageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50">
        Sebelumnya
      </button>
      {pageNumbers.map(number => (
        <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 border rounded-md ${pagination.currentPage === number ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
          {number}
        </button>
      ))}
      <button onClick={() => onPageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50">
        Berikutnya
      </button>
    </div>
  );
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('rating-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/service-categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Gagal memuat kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  const fetchServices = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const [sortField, sortOrder] = sortBy.split('-');
      const params = new URLSearchParams({ page: String(page), limit: '20', sortBy: sortField, sortOrder: sortOrder });
      if (debouncedSearchTerm) params.append('query', debouncedSearchTerm);
      if (selectedCategory) params.append('categoryId', String(selectedCategory));

      const response = await fetch(`/api/services/search?${params.toString()}`);
      if (!response.ok) throw new Error('Gagal memuat data layanan.');
      
      const data = await response.json();
      setServices(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    fetchServices(1);
  }, [fetchServices]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
       fetchServices(newPage);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-600">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Temukan Layanan Terbaik</h1>
            <p className="text-gray-500">Jelajahi berbagai layanan profesional yang siap membantu Anda.</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="lg:sticky lg:top-28 bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-6">Filter & Cari</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Cari layanan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="mb-6">
                  <label htmlFor="sort-by" className="flex items-center text-sm font-medium text-gray-700 mb-2"><ArrowUpDown className="h-4 w-4 mr-2" /> Urutkan Berdasarkan</label>
                  <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    <option value="rating-desc">Rating Tertinggi</option>
                    <option value="price-asc">Harga Terendah</option>
                    <option value="price-desc">Harga Tertinggi</option>
                    <option value="serviceName-asc">Nama (A-Z)</option>
                  </select>
              </div>

              <div>
                <h3 className="flex items-center text-sm font-medium text-gray-700 mb-3"><List className="h-4 w-4 mr-2" /> Kategori Layanan</h3>
                <div className="space-y-2">
                  <button onClick={() => setSelectedCategory(null)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedCategory ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>
                    Semua Kategori
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>
                      {cat.name} {/* <-- PERUBAHAN 3: Menampilkan 'name' */}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:w-3/4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse"></div>)}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500"><p>Error: {error}</p></div>
            ) : services.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {services.map((service) => (
                    <Link href={`/services/${service.id}`} key={service.id}>
                       <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out cursor-pointer h-full flex flex-col">
                        <div className="p-6 flex-grow">
                          <div className="flex items-center mb-4">
                            <Avatar
                                                        src={service.provider.profilePictureUrl}
                                                        email={service.provider.email}
                                                        alt={service.provider.fullName}
                                                        size={48} // 48px (w-12 h-12)
                                                        className="mr-4"
                                                    />
                            <div>
                              <p className="font-semibold text-gray-800">{service.provider.fullName}</p>
                              <div className="flex items-center text-sm text-yellow-500">
                                <Star className="mr-1 h-4 w-4" fill="currentColor" />
                                <span>{(service.provider.rating || 0).toFixed(1)} ({service.provider.reviewCount} ulasan)</span>
                              </div>
                            </div>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{service.serviceName}</h2>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                          <div className="flex items-center text-sm text-blue-600 font-medium">
                              <Tag className="mr-2 h-4 w-4"/>
                              {service.category.name} {/* <-- PERUBAHAN 4: Menampilkan 'name' */}
                          </div>
                          <p className="text-xl font-bold text-gray-800">Rp{new Intl.NumberFormat('id-ID').format(service.price)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {pagination && <Pagination pagination={pagination} onPageChange={handlePageChange} />}
              </>
            ) : (
              <div className="text-center py-20 text-gray-500"><p>Tidak ada layanan yang cocok dengan kriteria Anda.</p></div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}