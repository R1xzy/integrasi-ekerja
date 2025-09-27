// src/app/dashboard/orders/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import ReusableTable, { Column } from "@/components/ReusableTable";
import { authenticatedFetch } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/utils_new";
import Image from "next/image"; // Import Image

// Tipe data disesuaikan dengan respons dari API
interface Customer {
  id: string;
  fullName: string;
  profilePictureUrl?: string | null; // Disesuaikan dengan skema
}

interface Provider {
  id: string;
  fullName: string;
}

interface Service {
  id: string;
  serviceTitle: string;
}

interface Order {
  id: number;
  orderNumber: string;
  status: 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED_BY_PROVIDER' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'DISPUTED';
  finalAmount: number;
  createdAt: string;
  scheduledDate: string;
  customer: Customer;
  provider: Provider;
  providerService: Service;
}

interface OrdersResponse {
  data: {
    orders: Order[];
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Omit<OrdersResponse['data'], 'orders'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch('/api/admin/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengambil data pesanan.");
      }
      const data: { data: OrdersResponse['data'] } = await response.json();
      
      setOrders(data.data.orders);
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusClassMap: Record<string, string> = {
      'COMPLETED': "bg-green-100 text-green-800",
      'IN_PROGRESS': "bg-blue-100 text-blue-800",
      'PENDING_ACCEPTANCE': "bg-yellow-100 text-yellow-800",
      'CANCELLED_BY_CUSTOMER': "bg-red-100 text-red-800",
      'REJECTED_BY_PROVIDER': "bg-red-100 text-red-800",
    };
    const statusIconMap: Record<string, React.ReactNode> = {
      'COMPLETED': <CheckCircle className="w-3 h-3 mr-1" />,
      'IN_PROGRESS': <Clock className="w-3 h-3 mr-1" />,
      'PENDING_ACCEPTANCE': <AlertCircle className="w-3 h-3 mr-1" />,
      'CANCELLED_BY_CUSTOMER': <XCircle className="w-3 h-3 mr-1" />,
      'REJECTED_BY_PROVIDER': <XCircle className="w-3 h-3 mr-1" />,
    };
    const statusTextMap: Record<string, string> = {
      'COMPLETED': "Selesai",
      'IN_PROGRESS': "Berlangsung",
      'PENDING_ACCEPTANCE': "Menunggu",
      'CANCELLED_BY_CUSTOMER': "Dibatalkan",
      'REJECTED_BY_PROVIDER': "Ditolak",
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClassMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusIconMap[status]}
        {statusTextMap[status] || status.replace(/_/g, ' ')}
      </span>
    );
  };
  
  const columns: Column<Order>[] = [
    { header: "Nomor Pesanan", accessorKey: "orderNumber", sortable: true },
    {
        header: "Pelanggan",
        accessorKey: "customer.fullName",
        cell: (row) => (
            <div className="flex items-center gap-2">
                <Image 
                    src={row.customer.profilePictureUrl || '/default-avatar.png'} 
                    alt={row.customer.fullName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                />
                <span>{row.customer.fullName}</span>
            </div>
        ),
        sortable: true,
        sortAccessor: (row) => row.customer.fullName
    },
    {
        header: "Penyedia",
        accessorKey: "provider.fullName",
        sortable: true,
        sortAccessor: (row) => row.provider.fullName
    },
    {
        header: "Layanan",
        accessorKey: "providerService.serviceTitle",
        sortable: true,
        sortAccessor: (row) => row.providerService.serviceTitle
    },
    {
        header: "Total",
        accessorKey: "finalAmount",
        cell: (row) => <span>{formatCurrency(row.finalAmount)}</span>,
        sortable: true,
        sortAccessor: (row) => row.finalAmount
    },
    {
        header: "Status",
        accessorKey: "status",
        cell: (row) => getStatusBadge(row.status),
        sortable: true,
        sortAccessor: (row) => row.status
    },
    {
        header: "Tanggal",
        accessorKey: "createdAt",
        cell: (row) => (
            <div>
                <div className="text-sm text-gray-900">{formatDate(new Date(row.createdAt))}</div>
                <div className="text-sm text-gray-500">Jadwal: {formatDate(new Date(row.scheduledDate))}</div>
            </div>
        ),
        sortable: true,
        sortAccessor: (row) => new Date(row.createdAt).getTime()
    },
    {
        header: "Aksi",
        cell: (row) => (
            <Link href={`/dashboard/orders/${row.id}`} className="text-blue-600 hover:text-blue-900">
                <Eye className="w-5 h-5"/>
            </Link>
        )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Memuat data pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
          <p className="text-gray-600 mt-2">Monitor dan kelola semua pesanan di platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Berlangsung</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inProgressOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dibatalkan</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.cancelledOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <ReusableTable
          data={orders || []}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari berdasarkan nama, layanan..."
          enablePagination
          itemsPerPage={10}
        />
      </div>
    </div>
  );
}