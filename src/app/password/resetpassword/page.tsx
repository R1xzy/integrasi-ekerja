// src/app/password/resetpassword/page.tsx

"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Ambil token/kode dari URL. Email biasanya menyertakan ?token=... atau ?code=...
    // Sesuaikan 'token' jika nama parameternya berbeda.
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError("Token reset tidak valid atau tidak ditemukan di URL.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (newPassword && confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(null);
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) {
      setError("Password tidak cocok.");
      return;
    }
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // PERBAIKAN: Mengarah ke endpoint baru /api/password/reset
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mereset password.');
      }

      setMessage(data.message);
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-gray-600">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Atur Ulang Password Anda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Masukkan password baru Anda di bawah ini.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {!message ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Password Baru</label>
                <div className="mt-1">
                  <input id="newPassword" name="newPassword" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Masukkan password baru"/>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                <div className="mt-1">
                  <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Ketik ulang password baru"/>
                </div>
                {passwordMatch === true && <p className="mt-2 text-xs text-green-600">✔ Password cocok</p>}
                {passwordMatch === false && <p className="mt-2 text-xs text-red-600">✖ Password tidak cocok</p>}
              </div>
              
              {error && <div className="bg-red-50 border-l-4 border-red-400 p-4"><p className="text-sm text-red-700">{error}</p></div>}

              <div>
                <button type="submit" disabled={isLoading || !passwordMatch || !token} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {isLoading ? 'Memproses...' : 'Reset Password'}
                </button>
              </div>
            </form>
          ) : (
             <div className="text-center">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                 <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
               </div>
               <h3 className="mt-5 text-lg leading-6 font-medium text-gray-900">Berhasil!</h3>
               <div className="mt-2 px-7 py-3">
                 <p className="text-sm text-gray-500">{message}</p>
               </div>
                <div className="mt-4">
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
                    Kembali ke Login
                  </Link>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}