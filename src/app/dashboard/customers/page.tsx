"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { authenticatedFetch } from "@/lib/auth-client";
import Avatar from "@/components/Avatar";
import ReusableTable from "@/components/ReusableTable";
import { 
  Eye,
  Mail,
  Phone,
  Calendar,
  Users,
  Loader2,
  Plus
} from "lucide-react";

// Tipe data sesuai respons API (termasuk _count)
interface Customer {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  isActive: boolean;
  _count: {
    customerOrders: number;
    customerReviews: number;
  };
}

// Tipe untuk kolom tabel
type CustomerColumn = {
  header: string;
  accessorKey?: keyof Customer;
  cell?: (row: Customer) => React.ReactNode;
  sortable?: boolean;
};

// Tipe untuk info paginasi dari API
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk interaksi server-side
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ✨ FUNGSI UTAMA: Fetch data dari API dengan parameter dinamis
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const res = await authenticatedFetch(`/api/admin/customers?${params.toString()}`);
      const responseData = await res.json();
      
      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || 'Gagal memuat data pelanggan.');
      }
      
      setCustomers(responseData.data.data); // data pelanggan ada di dalam data.data
      setPagination(responseData.data.pagination); // info paginasi

    } catch (err: any) {
      setError(err.message);
      console.error('Gagal memuat pelanggan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Definisikan kolom untuk ReusableTable
  const columns: CustomerColumn[] = [
    {
      header: "Pelanggan",
      accessorKey: "fullName",
      cell: (customer) => (
        <div className="flex items-center">
          <Avatar 
            src={customer.profilePictureUrl}
            email={customer.email}
            alt={customer.fullName}
            size={40}
            className="mr-4 flex-shrink-0"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
            <div className="text-sm text-gray-500">{customer.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (customer) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          customer.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {customer.isActive ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      header: "Statistik",
      cell: (customer) => (
        <div className="text-sm text-gray-800">
          <p>{customer._count.customerOrders} Pesanan</p>
          <p>{customer._count.customerReviews} Ulasan</p>
        </div>
      ),
    },
    {
      header: "Bergabung",
      accessorKey: "createdAt",
      cell: (customer) => formatDate(customer.createdAt),
    },
    {
      header: "Aksi",
      cell: (customer) => (
        <button className="text-blue-600 hover:text-blue-900 p-1" title="Lihat Detail">
          <Eye className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pelanggan</h1>
          <p className="text-gray-600 mt-2">Kelola semua pelanggan yang terdaftar di platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
                      <p className="text-2xl font-bold text-gray-900">{pagination?.total ?? '...'}</p>
                  </div>
              </div>
          </div>
        </div>

        {/* Tabel dirender di dalam komponennya sendiri */}
        <ReusableTable<Customer>
            columns={columns}
            data={customers}
            isLoading={isLoading}
            error={error}
            pagination={pagination}
            onPageChange={setCurrentPage}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cari nama, email..."
        />
      </div>
    </div>
  );
}