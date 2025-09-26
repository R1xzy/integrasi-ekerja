"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  X, Plus, Pencil, Trash2, Save, PlusCircle, PenTool, 
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight 
} from "lucide-react";

// =================================================================
// Types
// =================================================================

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category?: string;
};

type Column<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  filterValues?: string[];
};

type SortConfig<T> = {
  key: keyof T | ((row: T) => string | number);
  direction: "ascending" | "descending";
} | null;

type ReusableTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enablePagination?: boolean;
  itemsPerPage?: number;
};

// =================================================================
// Reusable Table Component (Latest Version Inlined)
// =================================================================
function ReusableTable<T extends object>({
  data,
  columns,
  enableSearch = false,
  searchPlaceholder = "Cari...",
  enablePagination = false,
  itemsPerPage = 10,
}: ReusableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (column: Column<T>) => {
    const sortKey = column.sortAccessor || column.accessorKey;
    if (!sortKey) return;

    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === sortKey && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    if (typeof sortKey === "function") {
      setSortConfig({ key: sortKey, direction });
    } else if (typeof sortKey === "string" || typeof sortKey === "number") {
      setSortConfig({ key: sortKey as keyof T, direction });
    } else {
      return;
    }
  };

  const getSortIcon = (column: Column<T>) => {
    const sortKey = column.sortAccessor || column.accessorKey;
    if (!sortConfig || sortConfig.key !== sortKey) {
      return <span className="w-4 h-4"></span>;
    }
    return sortConfig.direction === "ascending" ? (
      <ArrowUp className="w-3 h-3 text-gray-800" />
    ) : (
      <ArrowDown className="w-3 h-3 text-gray-800" />
    );
  };

  const filteredData = useMemo(() => {
    let temp = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "Semua") {
        temp = temp.filter((row) => String(row[key as keyof T]) === value);
      }
    });

    if (searchTerm.trim() !== "") {
      temp = temp.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig) {
      temp.sort((a, b) => {
        const aValue = typeof sortConfig.key === 'function' ? sortConfig.key(a) : a[sortConfig.key as keyof T];
        const bValue = typeof sortConfig.key === 'function' ? sortConfig.key(b) : b[sortConfig.key as keyof T];
        
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return temp;
  }, [data, searchTerm, sortConfig, filters]);
  
  const totalPages = enablePagination ? Math.ceil(filteredData.length / itemsPerPage) : 1;
  const paginatedData = enablePagination
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredData;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
          {enableSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 text-gray-600"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          )}

          {columns.filter((col) => col.filterValues).map((col) => (
            <select
              key={col.header}
              className="text-gray-600 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters[col.accessorKey as string] || "Semua"}
              onChange={(e) => setFilters((prev) => ({...prev, [col.accessorKey as string]: e.target.value,}))}
            >
              <option value="Semua">Semua {col.header}</option>
              {col.filterValues?.map((val) => (<option key={val} value={val}>{val}</option>))}
            </select>
            ))}
      </div>
      
      <table className="min-w-full table-auto text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.sortable ? (
                  <button onClick={() => handleSort(col)} className="flex items-center gap-2 duration-300 hover:text-gray-900 focus:outline-none">
                    {col.header}
                    {getSortIcon(col)}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex} className="duration-300 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${rowIndex}-${col.header}`} className="px-6 py-4 whitespace-nowrap">
                  {col.cell ? col.cell(row, rowIndex + (currentPage - 1) * itemsPerPage) : col.accessorKey ? (row[col.accessorKey] as React.ReactNode) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {enablePagination && totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-b-lg">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> sampai <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="font-medium">{filteredData.length}</span> hasil
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-2 border rounded-md bg-white text-sm text-gray-500 duration-300 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700"> Halaman {currentPage} dari {totalPages} </span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-2 border rounded-md bg-white text-sm text-gray-500 duration-300 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================
// Modal Component
// =================================================================
const FAQModal = ({ modalOpen, setModalOpen, editId, question, setQuestion, answer, setAnswer, category, setCategory, categories, newCategory, setNewCategory, handleSubmit, loading, errorMsg }: any) => {
  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative transform transition-all duration-300 ease-in-out scale-100 opacity-100 animate-fade-in-up">
        
        <button
          onClick={() => setModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-gray-800 text-2xl font-bold mb-6 flex items-center gap-2">
          {editId ? <PenTool className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
          {editId ? "Edit FAQ" : "Tambah FAQ"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="text-gray-700 block text-sm font-semibold mb-2">
              Pertanyaan
            </label>
            <input
              id="question"
              className="text-gray-800 w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={500}
              placeholder="Tulis pertanyaan FAQ"
            />
          </div>

          <div>
            <label htmlFor="answer" className="text-gray-700 block text-sm font-semibold mb-2">
              Jawaban
            </label>
            <textarea
              id="answer"
              className="text-gray-800 w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              maxLength={2000}
              rows={4}
              placeholder="Tulis jawaban FAQ"
            />
          </div>

          <div>
            <label htmlFor="category" className="text-gray-700 block text-sm font-semibold mb-2">
              Kategori
            </label>
            <div className="flex gap-4">
              <select
                id="category"
                className="border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat: any) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                className="border border-gray-300 rounded-md px-4 py-2.5 text-gray-700 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Atau tambah kategori baru"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-200 transition-colors duration-200"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              disabled={loading}
            >
              <Save className="w-5 h-5" />
              {editId ? "Update" : "Tambah"}
            </button>
          </div>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-md mt-4">
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


// =================================================================
// Main Page Component
// =================================================================
export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function fetchFaqs() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/faqs?limit=100");
      const data = await res.json();
      setFaqs(data.data?.data || []);
    } catch (err: any) {
      setErrorMsg("Gagal mengambil FAQ");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/faqs?distinct=category");
      const data = await res.json();
      const uniqueCategories = Array.from(
        new Set(
          (data.data?.data || [])
            .map((faq: FAQ) => faq.category)
            .filter(Boolean)
        )
      );
      setCategories(uniqueCategories as string[]);
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, []);

  function openAddModal() {
    setEditId(null);
    setQuestion("");
    setAnswer("");
    setCategory("");
    setNewCategory("");
    setModalOpen(true);
    setErrorMsg(null);
  }

  function openEditModal(faq: FAQ) {
    setEditId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || "");
    setNewCategory("");
    setModalOpen(true);
    setErrorMsg(null);
  }

  function getAuthToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth-token");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const usedCategory = newCategory.trim() ? newCategory.trim() : category;
    if (!question.trim() || !answer.trim()) {
      setErrorMsg("Pertanyaan dan jawaban wajib diisi.");
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (editId === null) {
        const res = await fetch("/api/admin/faqs", {
          method: "POST",
          headers,
          body: JSON.stringify({
            question,
            answer,
            category: usedCategory,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Gagal menambah FAQ");
        }
      } else {
        const res = await fetch(`/api/admin/faqs/${editId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            question,
            answer,
            category: usedCategory,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Gagal mengedit FAQ");
        }
      }
      setModalOpen(false);
      fetchFaqs();
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Yakin ingin menghapus FAQ ini?")) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Gagal menghapus FAQ");
      }
      fetchFaqs();
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus FAQ");
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<FAQ>[] = [
    {
      header: "#",
      cell: (_row, idx) => <span>{idx + 1}</span>,
    },
    {
      header: "Pertanyaan",
      accessorKey: "question",
      sortable: true,
      cell: (row) => <span className="font-medium text-gray-800">{row.question}</span>,
    },
    {
      header: "Jawaban",
      accessorKey: "answer",
      sortable: true,
      cell: (row) => (
        <span className="text-gray-600">
          {row.answer.length > 80
            ? row.answer.slice(0, 80) + "..."
            : row.answer}
        </span>
      ),
    },
    {
      header: "Kategori",
      accessorKey: "category",
      sortable: true,
      cell: (row) =>
        row.category ? (
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {row.category}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        ),
    },
    {
      header: "Aksi",
      cell: (row) => (
        <div className="space-x-2 flex">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Kelola FAQ</h1>
            <button
                onClick={openAddModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
            >
                <PlusCircle className="w-5 h-5" />
                Tambah FAQ
            </button>
        </div>

        {errorMsg && !modalOpen && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-md mb-4 border border-red-200">
            {errorMsg}
          </div>
        )}

        <ReusableTable
          data={faqs}
          columns={columns}
          enableSearch
          searchPlaceholder="Cari pertanyaan, jawaban, atau kategori..."
          enablePagination
          itemsPerPage={8}
        />
      </div>

      <FAQModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editId={editId}
        question={question}
        setQuestion={setQuestion}
        answer={answer}
        setAnswer={setAnswer}
        category={category}
        setCategory={setCategory}
        categories={categories}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleSubmit={handleSubmit}
        loading={loading}
        errorMsg={errorMsg}
      />
    </div>
  );
}

