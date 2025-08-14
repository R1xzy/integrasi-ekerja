"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

// Catatan: Komponen ini sekarang HANYA untuk pengguna yang belum login (guest).
// Middleware akan mengarahkan pengguna yang sudah login ke dashboard masing-masing
// di mana mereka akan melihat navbar yang sesuai (CustomerNavbar, ProviderNavbar, dll).

const NavLink = ({ href, currentPath, children }: { href: string; currentPath: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className={`font-medium transition-colors ${
      currentPath === href ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
    }`}
  >
    {children}
  </Link>
);

export default function MainNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Efek ini digunakan untuk mengatasi hydration error.
  // Komponen akan me-render null di server dan render penuh di client.
  useEffect(() => {
    setIsClient(true);
  }, []);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/services", label: "Layanan" },
    { href: "/providers", label: "Penyedia" },
    { href: "/about", label: "Tentang" },
  ];

  // Jangan render apapun di server atau sebelum client-side mount
  if (!isClient) {
    return null;
  }

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
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <NavLink key={link.href} href={link.href} currentPath={pathname ?? ''}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Menu (Guest Only) */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium">Masuk</Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Daftar</Link>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 py-4 border-t' : 'max-h-0'}`}>
          <nav className="flex flex-col space-y-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md font-medium ${ pathname === link.href ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50" }`}>
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-4 mt-2 space-y-2 sm:hidden">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Masuk</Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Daftar</Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}