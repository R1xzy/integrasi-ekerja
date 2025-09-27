"use client";

import { useState, type FormEvent, type ChangeEvent, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from 'use-debounce';

// --- KUMPULAN IKON SVG (TIDAK BERUBAH) ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>;
// ---------------------------------------------

type Role = "customer" | "provider";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [ktpDocument, setKtpDocument] = useState<File | null>(null);
  const [certificateDocument, setCertificateDocument] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // Error dari API
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- STATE BARU UNTUK VALIDASI ---
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  // --- DEBOUNCING UNTUK CEK KEUNIKAN ---
  const [debouncedEmail] = useDebounce(formData.email, 500);
  const [debouncedPhoneNumber] = useDebounce(formData.phoneNumber, 500);

  // --- LOGIKA VALIDASI DINAMIS ---
  const validateField = useCallback((name: string, value: string) => {
      let errorMsg = '';
      switch (name) {
          case 'password':
              if (value.length < 8) {
                  errorMsg = 'Password harus minimal 8 karakter.';
              } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                  errorMsg = 'Kombinasi huruf besar, kecil, dan angka.';
              }
              break;
          case 'confirmPassword':
              if (formData.password !== value) {
                  errorMsg = 'Password dan konfirmasi tidak cocok.';
              }
              break;
          case 'email':
              if (!/\S+@\S+\.\S+/.test(value)) {
                  errorMsg = 'Format email tidak valid.';
              }
              break;
          case 'phoneNumber':
              // Memeriksa apakah hanya berisi angka dan panjangnya 10-14 digit
              if (!/^\d{10,14}$/.test(value)) {
                  errorMsg = 'Nomor telepon harus 10-14 digit angka.';
              }
              break;
          case 'fullName':
              if (!value.trim()) {
                  errorMsg = 'Nama lengkap tidak boleh kosong.';
              }
              break;
      }
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
      return !errorMsg; // return true jika valid
  }, [formData.password]);

  // --- EFEK UNTUK CEK KEUNIKAN EMAIL (DEBOUNCED) ---
  useEffect(() => {
    const checkEmailUniqueness = async () => {
        // Hanya cek jika format email dasar sudah benar dan tidak kosong
        if (debouncedEmail && !errors.email) {
            try {
                // TODO: Buat endpoint API ini di backend Anda
                // Contoh: GET /api/auth/check-uniqueness?field=email&value=...
                const response = await fetch(`/api/auth/check-uniqueness?field=email&value=${debouncedEmail}`);
                if (response.ok) {
                    const data = await response.json();
                    if (!data.isUnique) {
                        setErrors(prev => ({ ...prev, email: 'Email ini sudah terdaftar.' }));
                    }
                }
            } catch (err) {
                console.error("Gagal memeriksa keunikan email:", err);
            }
        }
    };
    checkEmailUniqueness();
  }, [debouncedEmail, errors.email]);

  // --- EFEK UNTUK CEK KEUNIKAN NOMOR TELEPON (DEBOUNCED) ---
  useEffect(() => {
    const checkPhoneUniqueness = async () => {
        if (debouncedPhoneNumber && !errors.phoneNumber) {
             try {
                // TODO: Buat endpoint API ini di backend Anda
                // Contoh: GET /api/auth/check-uniqueness?field=phoneNumber&value=...
                const response = await fetch(`/api/auth/check-uniqueness?field=phoneNumber&value=${debouncedPhoneNumber}`);
                if (response.ok) {
                    const data = await response.json();
                    if (!data.isUnique) {
                        setErrors(prev => ({ ...prev, phoneNumber: 'Nomor telepon ini sudah terdaftar.' }));
                    }
                }
            } catch (err) {
                console.error("Gagal memeriksa keunikan nomor telepon:", err);
            }
        }
    };
    checkPhoneUniqueness();
  }, [debouncedPhoneNumber, errors.phoneNumber]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (e.target.name === 'ktpDocument') setKtpDocument(file);
    else if (e.target.name === 'certificateDocument') setCertificateDocument(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    // --- PENGECEKAN VALIDASI FINAL SEBELUM SUBMIT ---
    const isFullNameValid = validateField('fullName', formData.fullName);
    const isEmailValid = validateField('email', formData.email);
    const isPhoneValid = validateField('phoneNumber', formData.phoneNumber);
    const isPasswordValid = validateField('password', formData.password);
    const isConfirmPasswordValid = validateField('confirmPassword', confirmPassword);

    // Cek juga error dari state, karena cek keunikan bersifat async
    if (!isFullNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isConfirmPasswordValid || errors.email || errors.phoneNumber) {
      setApiError("Harap perbaiki semua kesalahan pada form sebelum mendaftar.");
      return;
    }
    
    setIsLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key as keyof typeof formData]));
    data.append('role', role);

    if (role === 'provider') {
      if (!ktpDocument || !certificateDocument) {
        setApiError('Untuk Penyedia Jasa, KTP dan Sertifikat wajib diunggah.');
        setIsLoading(false);
        return;
      }
      data.append('ktpDocument', ktpDocument);
      data.append('certificateDocument', certificateDocument);
    }

    try {
      const response = await fetch('/api/auth/register', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Registrasi gagal.');
      
      setSuccess('Registrasi berhasil! Anda akan dialihkan ke halaman login.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-gray-600">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Buat Akun Baru</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Masuk di sini</Link>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setRole('customer')} className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${role === 'customer' ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-500' : 'bg-white hover:bg-gray-100'}`}>
                <UserCheckIcon />
                <span className="font-semibold">Saya Pelanggan</span>
            </button>
            <button onClick={() => setRole('provider')} className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${role === 'provider' ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-500' : 'bg-white hover:bg-gray-100'}`}>
                <BriefcaseIcon />
                <span className="font-semibold">Saya Penyedia Jasa</span>
            </button>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon /></div>
                <input id="fullName" name="fullName" type="text" required onChange={handleChange} className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${errors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="Masukkan nama lengkap"/>
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MailIcon /></div>
                <input id="email" name="email" type="email" autoComplete="email" required onChange={handleChange} className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="Masukkan email"/>
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
             <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><PhoneIcon /></div>
                <input id="phoneNumber" name="phoneNumber" type="tel" required onChange={handleChange} className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="081234567890"/>
              </div>
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>
             <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Alamat</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPinIcon /></div>
                <input id="address" name="address" type="text" required onChange={handleChange} className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Masukkan alamat lengkap"/>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon /></div>
                <input id="password" name="password" type={showPassword ? "text" : "password"} required onChange={handleChange} className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} placeholder="Masukkan password"/>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
               {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><LockIcon /></div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      validateField('confirmPassword', e.target.value);
                  }}
                  onPaste={(e) => e.preventDefault()}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                  placeholder="Ketik ulang password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className={role === 'provider' ? 'block' : 'hidden'}>
                <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Dokumen Verifikasi</h3>
                    <div>
                        <label htmlFor="ktpDocument" className="block text-sm font-medium text-gray-700">Scan KTP</label>
                        <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                            <UploadIcon />
                            <input id="ktpDocument" name="ktpDocument" type="file" required={role === 'provider'} onChange={handleFileChange} className="text-sm w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                        {ktpDocument && <p className="text-xs text-green-600 mt-1">{ktpDocument.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="certificateDocument" className="block text-sm font-medium text-gray-700">Sertifikat Keahlian</label>
                        <div className="mt-1 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                            <UploadIcon />
                            <input id="certificateDocument" name="certificateDocument" type="file" required={role === 'provider'} onChange={handleFileChange} className="text-sm w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                        {certificateDocument && <p className="text-xs text-green-600 mt-1">{certificateDocument.name}</p>}
                    </div>
                </div>
            </div>
            
            {apiError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{apiError}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</p>}

            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}