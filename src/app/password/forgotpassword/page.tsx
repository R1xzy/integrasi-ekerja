"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isValid, setIsValid] = useState(false);

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(regex.test(value));
    setEmail(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Link reset password telah dikirim ke ${email} (dummy)`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Lupa Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Masukkan email Anda untuk menerima link reset password
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => validateEmail(e.target.value)}
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={!isValid}
                className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isValid
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 opacity-50 cursor-not-allowed"
                }`}
              >
                Kirim Link Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
