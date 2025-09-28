"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  User,
  ShoppingBag,
  Settings,
  Search,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface UserData {
  name: string;
  [key: string]: any;
}

// Daftar item navigasi utama
const navItems: NavItem[] = [
  {
    href: "/customer/dashboard",
    label: "Dashboard",
    icon: <User className="w-4 h-4" />,
  },
  {
    href: "/services",
    label: "Cari Layanan",
    icon: <Search className="w-4 h-4" />,
  },
  {
    href: "/customer/orders",
    label: "Pesanan Saya",
    icon: <ShoppingBag className="w-4 h-4" />,
  },
  {
    href: "/customer/profile",
    label: "Profil",
    icon: <Settings className="w-4 h-4" />,
  },
  {
    href: "/chat",
    label: "Inbox",
    icon: <MessageSquare className="w-4 h-4" />,
  },
];

export default function CustomerNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const parsedUser: UserData = JSON.parse(userString);
        setUser(parsedUser);
      } catch (e) {
        console.error("Gagal parse user dari localStorage", e);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const isActiveLink = (href: string) => {
    return pathname.startsWith(href);
  };

  // **PERUBAHAN 1: Saring item menu untuk desktop**
  // Hapus "Profil" dari navigasi utama di desktop karena sudah diwakili oleh nama user.
  const desktopNavItems = navItems.filter(
    (item) => item.href !== "/customer/profile"
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/customer/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              E-Kerja Karawang
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {/* Menggunakan item yang sudah difilter */}
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 min-w-[150px] justify-end">
              {hasHydrated && user ? (
                <>
                  {/* **PERUBAHAN 2: Ubah nama user menjadi Link** */}
                  <Link
                    href="/customer/profile"
                    className={`font-medium hidden sm:inline transition-colors ${
                      isActiveLink("/customer/profile")
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600"
                    }`}
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-96 py-4 border-t" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col space-y-2 px-4">
          {/* **PERUBAHAN 3: Tetap gunakan navItems asli untuk mobile** */}
          {/* Di sini, "Profil" akan selalu ditampilkan */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                isActiveLink(item.href)
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}