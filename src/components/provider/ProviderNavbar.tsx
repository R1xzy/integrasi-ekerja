"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, BarChart3, Briefcase, ShoppingBag, Settings, MessageSquare } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";

// Interface untuk NavItem (tidak berubah)
interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

// **PERUBAHAN 1: Tambahkan interface untuk data user**
interface UserData {
  name: string;
  [key: string]: any;
}

const navItems: NavItem[] = [
  { href: "/provider/dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { href: "/provider/services", label: "Layanan Saya", icon: <Briefcase className="w-4 h-4" /> },
  { href: "/provider/orders", label: "Pesanan Masuk", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/provider/profile", label: "Profil", icon: <Settings className="w-4 h-4" /> },
  { href: "/provider/chat", label: "Inbox", icon: <MessageSquare className="w-4 h-4" /> },
];

export default function ProviderNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // **PERUBAHAN 2: Tambahkan state untuk menyimpan data user**
  const [user, setUser] = useState<UserData | null>(null);

  // **PERUBAHAN 3: useEffect untuk mengambil data user dari localStorage**
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const parsedUser: UserData = JSON.parse(userString);
        setUser(parsedUser);
      } catch (e) {
        console.error("Gagal parse user dari localStorage", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const isActiveLink = (href: string) => {
    if (href === "/provider/dashboard") {
      return pathname === "/provider/dashboard";
    }
    return pathname.startsWith(href);
  };

  // **PERUBAHAN 4: Saring item menu untuk desktop**
  const desktopNavItems = navItems.filter(
    (item) => item.href !== "/provider/profile"
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/provider/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">E-Kerja Karawang</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {desktopNavItems.map((item) => ( // Menggunakan item yang sudah difilter
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? "text-green-600 bg-green-50"
                    : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* **PERUBAHAN 5: Ganti span statis dengan Link dinamis** */}
            {user ? (
              <Link
                href="/provider/profile"
                className={`font-medium hidden sm:inline transition-colors ${
                  isActiveLink("/provider/profile")
                    ? "text-green-600"
                    : "text-gray-700 hover:text-green-600"
                }`}
              >
                {user.name}
              </Link>
            ) : (
              <span className="text-gray-700 font-medium hidden sm:inline">Provider</span>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`
            md:hidden border-gray-200 overflow-hidden
            transition-all duration-300 ease-in-out
            ${isMobileMenuOpen ? 'max-h-96 py-4 border-t' : 'max-h-0'}
          `}
        >
          <nav className="flex flex-col space-y-2 px-4">
            {navItems.map((item) => ( // Menggunakan navItems asli untuk mobile
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? "text-green-600 bg-green-50"
                    : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}