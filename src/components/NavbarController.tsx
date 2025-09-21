"use client";

import { useState, useEffect } from "react";
import MainNavbar from "@/components/MainNavbar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ProviderNavbar from "@/components/provider/ProviderNavbar";
import CustomerNavbar from "@/components/customer/CustomerNavbar";

interface User {
  role: "customer" | "provider" | "admin";
}

export default function NavbarController() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ambil user dari localStorage/cookie
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
  }, []);

  if (isLoading) {
    return <header className="h-[68px] bg-white border-b"></header>;
  }

  // Tampilkan navbar sesuai role user yang sedang login
  if (user?.role === "admin") {
    return <DashboardNavbar />;
  }
  if (user?.role === "provider") {
    return <ProviderNavbar />;
  }
  if (user?.role === "customer") {
    return <CustomerNavbar />;
  }

  // Jika belum login, tampilkan navbar umum
  return <MainNavbar />;
}
