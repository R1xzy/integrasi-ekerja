"use client";

import { useState, useEffect } from "react";

export default function TestAuth() {
  const [authData, setAuthData] = useState<any>(null);
  const [cookieData, setCookieData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAuth = async () => {
      try {
        // Test auth/me endpoint
        console.log('Testing /api/auth/me...');
        const authResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
        
        console.log('Auth response status:', authResponse.status);
        const authResult = await authResponse.json();
        console.log('Auth result:', authResult);
        setAuthData({ status: authResponse.status, data: authResult });

        // Test cookie endpoint
        console.log('Testing /api/test-cookies...');
        const cookieResponse = await fetch('/api/test-cookies');
        const cookieResult = await cookieResponse.json();
        console.log('Cookie result:', cookieResult);
        setCookieData(cookieResult);

      } catch (error) {
        console.error('Test error:', error);
        setAuthData({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };

    testAuth();
  }, []);

  const testLogin = async () => {
    try {
      console.log('Testing login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'customer@example.com',
          password: 'customer123'
        }),
      });

      const result = await response.json();
      console.log('Login result:', result);
      
      // Refresh the page to test auth state
      window.location.reload();
    } catch (error) {
      console.error('Login test error:', error);
    }
  };

  const testLogout = async () => {
    try {
      console.log('Testing logout...');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Logout result:', result);
      
      // Refresh the page to test auth state
      window.location.reload();
    } catch (error) {
      console.error('Logout test error:', error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading test...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={testLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Login (Customer)
            </button>
            <button 
              onClick={testLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Test Logout
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Auth Status (/api/auth/me)</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Cookie Data (/api/test-cookies)</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(cookieData, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Data</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              user: localStorage.getItem('user'),
              allKeys: Object.keys(localStorage)
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
