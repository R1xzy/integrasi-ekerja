import Link from "next/link";
import { Star, MapPin, Clock, Shield, Award, MessageCircle, Calendar, ChevronRight, Phone, Mail, CheckCircle, Users, Trophy, Loader } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// =================================================================
// 1. DEFINISI TIPE & DATA FETCHING (Tetap sama)
// =================================================================

// --- Tipe Data ---
interface ReviewApi {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  customer: { fullName: string; profilePictureUrl: string | null; };
  order: { jobAddress: string | null; } | null;
}
interface ServiceApi {
  id: number;
  serviceTitle: string;
  description: string;
  price: number;
  priceUnit: string;
  category: { name: string };
  image: string; 
}
interface PortfolioApi {
  id: number;
  title: string;
  description: string;
  filePath: string;
  completedAt: string;
}
interface CertificationApi {
  id: number;
  documentType: string;
  verifiedAt: string | null;
  filePath: string;
}
interface ProviderData {
  id: number;
  fullName: string;
  profilePictureUrl: string | null;
  address: string | null;
  providerBio: string | null;
  createdAt: string;
  phoneNumber: string | null;
  email: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rating: number;
  reviewCount: number;
  completedOrders: number;
  providerServices: ServiceApi[];
  providerPortfolios: PortfolioApi[];
  providerDocuments: CertificationApi[];
  reviews: ReviewApi[];
  responseTime: string; 
  coverImage: string; 
  workingHours: { [key: string]: string };
}

// --- Fungsi Fetch Data ---
async function fetchProviderData(id: string): Promise<ProviderData> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/providers/${id}`, {
    cache: 'no-store' 
  });
  
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Gagal memuat detail penyedia');
  }
  
  const result = await response.json();
  
  return {
    ...result.data,
    responseTime: '< 1 jam',
    coverImage: '/api/placeholder/800/300',
    workingHours: {
      monday: "08:00 - 17:00", tuesday: "08:00 - 17:00", wednesday: "08:00 - 17:00",
      thursday: "08:00 - 17:00", friday: "08:00 - 17:00", saturday: "08:00 - 15:00",
      sunday: "Tutup"
    },
  } as ProviderData;
}


// =================================================================
// 2. KOMPONEN-KOMPONEN LOKAL (Bagian yang Diperbaiki)
// =================================================================
// Setiap bagian UI dipecah menjadi fungsi komponen yang lebih kecil dan fokus.



function ProviderHeader({ provider }: { provider: ProviderData }) {
    const isVerified = provider.verificationStatus === 'VERIFIED';
    const badges = [
        isVerified ? 'Verified' : null,
        provider.rating >= 4.7 ? 'Top Rated' : null,
        'Fast Response'
    ].filter(Boolean) as string[];

    const getBadgeColor = (badge: string) => {
        if (badge === 'Top Rated') return 'bg-yellow-100 text-yellow-800';
        if (badge === 'Verified') return 'bg-green-100 text-green-800';
        if (badge === 'Fast Response') return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };
    
    return (
        <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                <img src={provider.coverImage} alt="Cover" className="w-full h-full object-cover opacity-20"/>
            </div>
            <div className="p-6 flex flex-col md:flex-row md:items-start gap-6">
                <div className="relative -mt-24 flex-shrink-0">
                    <img src={provider.profilePictureUrl || '/default-avatar.png'} alt={provider.fullName} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"/>
                    {isVerified && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{provider.fullName}</h1>
                            <div className="flex items-center mt-2 gap-4 text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                    <span className="font-semibold text-gray-800">{provider.rating.toFixed(1)}</span>
                                    <span>({provider.reviewCount} ulasan)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span>{provider.address || 'Lokasi tidak tersedia'}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {badges.map(badge => <span key={badge} className={`px-3 py-1 text-sm font-medium rounded-full ${getBadgeColor(badge)}`}>{badge}</span>)}
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0 flex-shrink-0">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold">
                                <MessageCircle className="w-4 h-4" /> Chat
                            </button>
                            <a href={`tel:${provider.phoneNumber || '#'}`} className="p-2 border rounded-lg hover:bg-gray-100">
                                <Phone className="w-5 h-5 text-blue-600" />
                            </a>
                            <a href={`mailto:${provider.email || '#'}`} className="p-2 border rounded-lg hover:bg-gray-100">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
            {children}
        </div>
    );
}

function AboutSection({ provider }: { provider: ProviderData }) {
    const specialties = Array.from(new Set(provider.providerServices.map(s => s.category.name)));
    const stats = [
        { icon: Trophy, value: provider.completedOrders, label: 'Pesanan Selesai', color: 'blue' },
        { icon: Users, value: provider.reviewCount, label: 'Ulasan Pelanggan', color: 'green' },
        { icon: Award, value: provider.rating.toFixed(1), label: 'Rating Rata-rata', color: 'yellow' },
    ];

    return (
        <Section title="Tentang Penyedia">
            <p className="text-gray-600 leading-relaxed mb-6">{provider.providerBio || 'Provider ini belum mengisi bio.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {stats.map(stat => (
                    <div key={stat.label} className={`text-center p-4 bg-${stat.color}-50 rounded-lg`}>
                        <stat.icon className={`w-8 h-8 text-${stat.color}-600 mx-auto mb-2`} />
                        <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                ))}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Keahlian</h3>
                <div className="flex flex-wrap gap-2">
                    {specialties.map(specialty => (
                        <span key={specialty} className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">{specialty}</span>
                    ))}
                </div>
            </div>
        </Section>
    );
}

function ServiceList({ services }: { services: ServiceApi[] }) {
    if (services.length === 0) return <Section title="Layanan"><p className="text-gray-500 italic">Penyedia ini belum menawarkan layanan.</p></Section>;

    return (
        <Section title="Layanan yang Ditawarkan">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                    <div key={service.id} className="border rounded-lg overflow-hidden group hover:shadow-lg transition-shadow">
                        <div className="h-36 bg-gray-200">
                             <img src={`/api/placeholder/300/200?text=${encodeURIComponent(service.serviceTitle)}`} alt={service.serviceTitle} className="w-full h-full object-cover"/>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-800 truncate">{service.serviceTitle}</h3>
                            <p className="text-sm text-gray-600 mt-1 h-10 line-clamp-2">{service.description}</p>
                            <div className="flex items-center justify-between mt-3">
                                <p className="text-lg font-bold text-blue-600">{formatCurrency(service.price)}<span className="text-sm font-normal text-gray-500">/{service.priceUnit}</span></p>
                                <Link href={`/services/${service.id}`} className="text-blue-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Lihat Detail &rarr;</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function ReviewList({ reviews, reviewCount }: { reviews: ReviewApi[], reviewCount: number }) {
    if (reviews.length === 0) return <Section title="Ulasan Pelanggan"><p className="text-gray-500 italic">Belum ada ulasan untuk penyedia ini.</p></Section>;
    
    return (
        <Section title={`Ulasan Pelanggan (${reviewCount})`}>
            <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="flex gap-4 border-b pb-6 last:border-0 last:pb-0">
                        <img src={review.customer.profilePictureUrl || '/default-avatar.png'} alt={review.customer.fullName} className="w-12 h-12 rounded-full object-cover"/>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{review.customer.fullName}</h4>
                                    <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}
                                </div>
                            </div>
                            <p className="text-gray-700 mt-2">{review.comment}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

function ProviderSidebar({ provider }: { provider: ProviderData }) {
    return (
        <div className="sticky top-8 space-y-6">
            <Section title="Informasi & Jam Kerja">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Bergabung</span> <span className="font-medium">{new Date(provider.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Waktu Respon</span> <span className="font-medium">{provider.responseTime}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Status</span> <span className="font-medium text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Terverifikasi</span></div>
                </div>
                <div className="border-t my-4"></div>
                <div className="space-y-2 text-sm">
                    {Object.entries(provider.workingHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{day}</span>
                            <span className="font-medium text-gray-800">{hours}</span>
                        </div>
                    ))}
                </div>
            </Section>
            {provider.providerDocuments.length > 0 && (
                <Section title="Sertifikasi">
                    <div className="space-y-3">
                        {provider.providerDocuments.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3">
                                <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{doc.documentType}</p>
                                    <p className="text-xs text-gray-500">Terverifikasi: {doc.verifiedAt ? new Date(doc.verifiedAt).getFullYear() : 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}


// =================================================================
// 3. KOMPONEN UTAMA HALAMAN (Sekarang Jauh Lebih Rapi)
// =================================================================

export default async function ProviderDetailPage({ params }: { params: { id: string } }) {
  let providerData: ProviderData;
  
  try {
    providerData = await fetchProviderData(params.id);
  } catch (err: any) {
    return <div className="text-center py-20 text-red-600">Error: {err.message}</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        
        <ProviderHeader provider={providerData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Kolom Konten Utama */}
          <div className="lg:col-span-2 space-y-6">
            <AboutSection provider={providerData} />
            <ServiceList services={providerData.providerServices} />
            {/* Portfolio bisa ditambahkan di sini dengan pola yang sama */}
            <ReviewList reviews={providerData.reviews} reviewCount={providerData.reviewCount} />
          </div>

          {/* Kolom Sidebar */}
          <div className="lg:col-span-1">
            <ProviderSidebar provider={providerData} />
          </div>
        </div>
      </main>
    </div>
  );
}