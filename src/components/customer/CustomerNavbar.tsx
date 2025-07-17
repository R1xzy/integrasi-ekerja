"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, User, ShoppingBag, Settings, Search } from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: <User className="w-4 h-4" /> },
  { href: "/customer/services", label: "Cari Layanan", icon: <Search className="w-4 h-4" /> },
  { href: "/customer/orders", label: "Pesanan Saya", icon: <ShoppingBag className="w-4 h-4" /> },
  { href: "/customer/profile", label: "Profil", icon: <Settings className="w-4 h-4" /> },
];

export default function CustomerNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear localStorage regardless of response
      localStorage.removeItem('user');
      
      if (response.ok) {
        // Force page reload to clear all state
        window.location.href = '/';
      } else {
        console.error('Logout failed');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state and redirect even on error
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const isActiveLink = (href: string) => {
    if (href === "/customer/dashboard") {
      return pathname === "/customer/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">E-Kerja Karawang</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
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
            <span className="text-gray-700 font-medium">Customer</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>

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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
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
        )}
      </div>
    </header>
  );
}
