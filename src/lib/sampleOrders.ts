export interface Order {
  id: string;
  service: string;
  provider: string;
  providerPhone: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  date: string; // ISO or yyyy-mm-dd
  time: string; // HH:mm
  location: string;
  description: string;
  rating: number | null;
  estimatedCompletion: string | null; // ISO datetime or null
}

export const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    service: "Service AC Rumah",
    provider: "Ahmad Teknisi",
    providerPhone: "081234567890",
    amount: 150000,
    status: "in_progress",
    date: "2024-01-20",
    time: "09:00",
    location: "Karawang Barat",
    description: "Service AC ruang tamu, tidak dingin",
    rating: null,
    estimatedCompletion: "2024-01-20 12:00",
  },
  {
    id: "ORD-002",
    service: "Perbaikan AC Split",
    provider: "Budi Service",
    providerPhone: "081234567891",
    amount: 200000,
    status: "pending",
    date: "2024-01-19",
    time: "14:00",
    location: "Karawang Timur",
    description: "AC bocor air, perlu perbaikan",
    rating: null,
    estimatedCompletion: null,
  },
  {
    id: "ORD-003",
    service: "Maintenance AC Rutin",
    provider: "Ahmad Teknisi",
    providerPhone: "081234567890",
    amount: 100000,
    status: "completed",
    date: "2024-01-18",
    time: "10:30",
    location: "Karawang Tengah",
    description: "Maintenance rutin bulanan",
    rating: 5,
    estimatedCompletion: "2024-01-18 12:30",
  },
  {
    id: "ORD-004",
    service: "Instalasi AC Baru",
    provider: "Citra AC",
    providerPhone: "081234567892",
    amount: 300000,
    status: "cancelled",
    date: "2024-01-17",
    time: "13:00",
    location: "Karawang Utara",
    description: "Instalasi AC 1 PK untuk kamar",
    rating: null,
    estimatedCompletion: null,
  },
];
