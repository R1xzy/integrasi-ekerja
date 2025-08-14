"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";

type FAQ = {
  id: number;
  question: string;
  answer: string;
};

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    if (editId !== null) {
      setFaqs((prev) =>
        prev.map((faq) =>
          faq.id === editId ? { ...faq, question, answer } : faq
        )
      );
      setEditId(null);
    } else {
      setFaqs((prev) => [...prev, { id: Date.now(), question, answer }]);
    }
    setQuestion("");
    setAnswer("");
    setModalOpen(false);
  }

  function handleEdit(faq: FAQ) {
    setEditId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setModalOpen(true);
  }

  function handleDelete(id: number) {
    setFaqs((prev) => prev.filter((faq) => faq.id !== id));
    if (editId === id) {
      setEditId(null);
      setQuestion("");
      setAnswer("");
      setModalOpen(false);
    }
  }

  function openAddModal() {
    setEditId(null);
    setQuestion("");
    setAnswer("");
    setModalOpen(true);
  }

  const columns = [
    {
      header: "#",
      cell: (_row: FAQ, idx: number) => <span>{idx + 1}</span>,
    },
    {
      header: "Pertanyaan",
      accessorKey: "question" as keyof FAQ,
      sortable: true,
      cell: (row: FAQ) => <span className="font-medium">{row.question}</span>,
    },
    {
      header: "Jawaban",
      accessorKey: "answer" as keyof FAQ,
      sortable: true,
    },
    {
      header: "Aksi",
      cell: (row: FAQ) => (
        <div className="space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:underline"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">FAQ Admin</h1>

        <div className="bg-white p-4 rounded-lg shadow flex justify-between mb-4">
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Tambah FAQ
          </button>
        </div>

        <ReusableTable
          data={faqs}
          columns={columns}
          enableSearch
          enablePagination
          itemsPerPage={5}
        />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow max-w-lg w-full p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-gray-600 text-lg font-semibold mb-4">
              {editId ? "Edit FAQ" : "Tambah FAQ"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-600 block text-sm font-medium mb-1">
                  Pertanyaan
                </label>
                <input
                  className="text-gray-600 w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-gray-600 block text-sm font-medium mb-1">
                  Jawaban
                </label>
                <textarea
                  className="text-gray-600 w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editId ? "Update" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
