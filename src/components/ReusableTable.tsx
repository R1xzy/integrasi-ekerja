// src/components/ReusableTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

type Column<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterValues?: string[]; // jika ada, otomatis buat filter dropdown
};

type SortConfig<T> = {
  key: keyof T;
  direction: "ascending" | "descending";
} | null;

type ReusableTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  enableSearch?: boolean;
  enablePagination?: boolean;
  itemsPerPage?: number;
};

export default function ReusableTable<T extends object>({
  data,
  columns,
  enableSearch = false,
  enablePagination = false,
  itemsPerPage = 5,
}: ReusableTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: keyof T) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof T) => {
    if (!sortConfig || sortConfig.key !== key) {
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

    // filter kolom
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "Semua") {
        temp = temp.filter((row) => String(row[key as keyof T]) === value);
      }
    });

    // search global
    if (searchTerm.trim() !== "") {
      temp = temp.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // sorting
    if (sortConfig) {
      temp.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return temp;
  }, [data, searchTerm, sortConfig, filters]);

  // pagination
  const totalPages = enablePagination ? Math.ceil(filteredData.length / itemsPerPage) : 1;
  const paginatedData = enablePagination
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredData;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto p-4 space-y-4">
      {/* Search */}
      {enableSearch && (
        <input
          type="text"
          placeholder="Cari..."
          className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 text-gray-600"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Filter otomatis */}
      <div className="flex flex-wrap gap-4">
        {columns
          .filter((col) => col.filterValues)
          .map((col) => (
            <select
              key={col.header}
              className="text-gray-600 border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={filters[col.accessorKey as string] || "Semua"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  [col.accessorKey as string]: e.target.value,
                }))
              }
            >
              <option value="Semua">Semua {col.header}</option>
              {col.filterValues?.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          ))}
      </div>

      {/* Table */}
      <table className="min-w-full table-auto text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.sortable && col.accessorKey ? (
                  <button
                    onClick={() => handleSort(col.accessorKey!)}
                    className="flex items-center gap-2 duration-300 hover:text-gray-900 focus:outline-none"
                  >
                    {col.header}
                    {getSortIcon(col.accessorKey!)}
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
                <td
                  key={`${rowIndex}-${col.header}`}
                  className="text-gray-600 px-6 py-4 whitespace-nowrap"
                >
                  {col.cell
                    ? col.cell(row, rowIndex)
                    : col.accessorKey
                    ? (row[col.accessorKey] as React.ReactNode)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {enablePagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-medium">
                {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
              </span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              dari <span className="font-medium">{filteredData.length}</span> hasil
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-2 border rounded-md bg-white text-sm text-gray-500 duration-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-2 border rounded-md bg-white text-sm text-gray-500 duration-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
