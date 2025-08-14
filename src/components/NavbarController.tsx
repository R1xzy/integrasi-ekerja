"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// Impor semua komponen navbar Anda
import MainNavbar from "@/components/MainNavbar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ProviderNavbar from "@/components/provider/ProviderNavbar";
import CustomerNavbar from "@/components/customer/CustomerNavbar";

interface User {
  role: "customer" | "provider" | "admin";
}

export default function NavbarController() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      try {
        setUser(JSON.parse(localUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, [pathname]);

  if (isLoading) {
    return <header className="h-[68px] bg-white border-b"></header>;
  }

  // Admin dashboard
  if (pathname.startsWith("/dashboard")) {
    return <DashboardNavbar />;
  }

  // Provider area
  if (pathname.startsWith("/provider")) {
    return <ProviderNavbar />;
  }

  // Customer special layout → hanya tampilkan navbar jika memang mau
  if (user?.role === "customer" && pathname.startsWith("/customer")) {
    return <CustomerNavbar />;
  }

  // Jika halaman customer tertentu ingin tanpa navbar sama sekali


  // Default (public) navbar
  return <MainNavbar />;
}
