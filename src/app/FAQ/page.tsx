"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

// Tipe data untuk FAQ
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

// Custom hook untuk debouncing
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timeout untuk update value setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Bersihkan timeout jika value berubah (misalnya user lanjut mengetik)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function FAQPage() {
  // State untuk menyimpan semua FAQ dari server
  const [allFaqs, setAllFaqs] = useState<FAQ[]>([]); 
  const [categories, setCategories] = useState<string[]>([]);
  
  // State untuk filter dan search dari input user
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Gunakan debounced search term untuk filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Jeda 300ms

  // Ambil semua data (FAQ dan kategori) sekali saat komponen dimuat
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch semua FAQ
        const faqsResponse = await fetch('/api/admin/faqs?limit=100');
        if (!faqsResponse.ok) throw new Error("Gagal mengambil data FAQ.");
        const faqsData = await faqsResponse.json();
        const fetchedFaqs = faqsData.data?.data || [];
        setAllFaqs(fetchedFaqs);

        // Ekstrak kategori unik dari data FAQ yang sudah diambil
        const uniqueCategories = Array.from(
          new Set(fetchedFaqs.map((faq: FAQ) => faq.category).filter(Boolean))
        );
        setCategories(uniqueCategories as string[]);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Lakukan filtering di sisi client setiap kali filter atau search term berubah
  const filteredFaqs = useMemo(() => {
    return allFaqs.filter(faq => {
      const matchCategory = selectedCategory ? faq.category === selectedCategory : true;
      const matchSearch = debouncedSearchTerm 
        ? faq.question.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
          faq.answer.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        : true;
      return matchCategory && matchSearch;
    });
  }, [allFaqs, selectedCategory, debouncedSearchTerm]);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };
  
  // Tampilan loading dan error tetap sama
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="mt-2 text-gray-600">Memuat FAQ...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Pusat Bantuan</h1>
          <p className="text-lg text-gray-600">Temukan jawaban dari pertanyaan yang sering diajukan</p>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari pertanyaan atau jawaban..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-gray-50 overflow-hidden hover:shadow-sm duration-300 "
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex justify-between items-center text-left p-6 font-semibold text-gray-800 hover:bg-gray-50 transition-colors duration-200 focus:outline-none"
                >
                  <span className="pr-4 text-xl">
                    {faq.question}
                    {faq.category && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs  text-blue-400 font-normal hover:bg-white">{faq.category}</span>
                    )}
                  </span>
                  {openFaqId === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openFaqId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-6 pt-0 text-gray-600 prose max-w-none">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10 bg-white rounded-xl border border-gray-200">
              <p className="font-semibold">Tidak ada FAQ yang ditemukan.</p>
              <p className="text-sm">Coba ubah kata kunci pencarian atau filter kategori Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
