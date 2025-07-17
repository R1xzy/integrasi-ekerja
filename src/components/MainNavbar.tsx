"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, User, ShoppingBag, Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
}

export default function MainNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to get cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  // Function to check user authentication status
  const checkUserStatus = async () => {
    console.log('MainNavbar: Checking user status...');
    
    // First check localStorage (most reliable for client-side)
    const localUser = localStorage.getItem('user');
    console.log('MainNavbar: LocalStorage user:', localUser);
    
    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        console.log('MainNavbar: Using localStorage data:', userData);
        setUser({
          id: userData.id.toString(),
          name: userData.name || userData.fullName,
          email: userData.email,
          role: userData.role as 'customer' | 'provider' | 'admin'
        });
        setIsLoading(false);
        return;
      } catch (e) {
        console.log('MainNavbar: Failed to parse localStorage:', e);
        localStorage.removeItem('user'); // Clear corrupted data
      }
    }
    
    // Fallback: check client-side cookies
    const clientSessionCookie = getCookie('user-session-client');
    console.log('MainNavbar: Client session cookie:', clientSessionCookie);
    
    if (clientSessionCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(clientSessionCookie));
        console.log('MainNavbar: Using client cookie data:', userData);
        const userObj = {
          id: userData.id.toString(),
          name: userData.fullName,
          email: userData.email,
          role: userData.role as 'customer' | 'provider' | 'admin'
        };
        setUser(userObj);
        // Also save to localStorage for consistency
        localStorage.setItem('user', JSON.stringify(userObj));
        setIsLoading(false);
        return;
      } catch (e) {
        console.log('MainNavbar: Failed to parse client cookie:', e);
      }
    }
    
    // Final fallback: API call
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });

      console.log('MainNavbar: Auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('MainNavbar: User data received:', data);
        const userData = {
          id: data.user.id.toString(),
          name: data.user.fullName,
          email: data.user.email,
          role: data.user.role as 'customer' | 'provider' | 'admin'
        };
        console.log('MainNavbar: Setting user:', userData);
        setUser(userData);
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('MainNavbar: No user authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('MainNavbar: Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check user authentication status on mount
  useEffect(() => {
    checkUserStatus();

    // Listen for storage changes (for cross-tab login detection)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        console.log('MainNavbar: User storage changed, refreshing auth...');
        checkUserStatus();
      }
    };

    // Listen for custom login event
    const handleUserLogin = (event: CustomEvent) => {
      console.log('MainNavbar: User login event received:', event.detail);
      setUser({
        id: event.detail.id,
        name: event.detail.name,
        email: event.detail.email,
        role: event.detail.role
      });
      setIsLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLogin', handleUserLogin as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleUserLogin as EventListener);
    };
  }, []);

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
      
      // Clear client-side cookies manually
      document.cookie = 'auth-token-client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user-session-client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
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
      document.cookie = 'auth-token-client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'user-session-client=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/';
    }
  };

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">E-Kerja Karawang</span>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          </div>
        </div>
      </header>
    );
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
            <Link
              href="/"
              className={`font-medium transition-colors ${
                isActiveLink("/") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/services"
              className={`font-medium transition-colors ${
                isActiveLink("/services") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Layanan
            </Link>
            <Link
              href="/providers"
              className={`font-medium transition-colors ${
                isActiveLink("/providers") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Penyedia
            </Link>
            <Link
              href="/about"
              className={`font-medium transition-colors ${
                isActiveLink("/about") ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Tentang
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              // Logged in user menu
              <>
                {user.role === 'customer' && (
                  <>
                    <Link
                      href="/orders"
                      className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span className="hidden sm:inline">Pesanan</span>
                    </Link>
                    <button className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
                      <Bell className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                    </button>
                  </>
                )}
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-gray-700 font-medium hidden sm:inline">{user.name}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              // Not logged in
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Daftar
                </Link>
              </>
            )}

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
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink("/") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Beranda
              </Link>
              <Link
                href="/services"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink("/services") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Layanan
              </Link>
              <Link
                href="/providers"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink("/providers") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Penyedia
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md font-medium transition-colors ${
                  isActiveLink("/about") ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Tentang
              </Link>
              
              {user ? (
                <>
                  {user.role === 'customer' && (
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-2 rounded-md font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      Pesanan Saya
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-3 py-2 rounded-md font-medium text-red-600 hover:text-red-700 hover:bg-red-50 text-left"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-md font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
