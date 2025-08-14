import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Grid Utama */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold">E-Kerja Karawang</span>
            </div>
            <p className="text-gray-400">
              Platform terpercaya untuk menemukan penyedia jasa profesional di Indonesia.
            </p>

            {/* Social Media */}
            <div className="flex space-x-4 mt-4">
              <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors duration-300">
                <Facebook className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-pink-500 transition-colors duration-300">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-sky-500 transition-colors duration-300">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 bg-gray-800 rounded-full hover:bg-blue-700 transition-colors duration-300">
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Layanan */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2 text-gray-400">
              {[
                { href: "/services/ac", label: "Service AC" },
                { href: "/services/cleaning", label: "Jasa Kebersihan" },
                { href: "/services/construction", label: "Tukang Bangunan" },
                { href: "/services/electronics", label: "Elektronik" },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="hover:text-white transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Perusahaan</h3>
            <ul className="space-y-2 text-gray-400">
              {[
                { href: "/about", label: "Tentang Kami" },
                { href: "/careers", label: "Karir" },
                { href: "/contact", label: "Kontak" },
                { href: "/help", label: "Bantuan" },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="hover:text-white transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dukungan */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dukungan</h3>
            <ul className="space-y-2 text-gray-400">
              {[
                { href: "/privacy", label: "Kebijakan Privasi" },
                { href: "/terms", label: "Syarat & Ketentuan" },
                { href: "/faq", label: "FAQ" },
              ].map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className="hover:text-white transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Garis Bawah & Hak Cipta */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} E-Kerja Karawang. Semua hak dilindungi.</p>
          <p className="mt-2 md:mt-0">Karawang, Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
