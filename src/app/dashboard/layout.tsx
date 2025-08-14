"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
// Data navigasi


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      

      {/* Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8">{children}</main>

      {/* Footer */}
    </div>
  );
}
