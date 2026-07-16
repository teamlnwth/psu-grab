'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError('กรุณากรอกอีเมล/รหัสนักศึกษา และรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = login(identifier, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } else {
      setError(result.error || 'การเข้าสู่ระบบล้มเหลว');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <h1 className="text-3xl font-extrabold text-blue-600 mb-2">เข้าสู่ระบบ</h1>
          <p className="text-slate-500">PSU Grab ยินดีต้อนรับ</p>
        </div>

        {/* Success Transition */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">เข้าสู่ระบบสำเร็จ!</h2>
            <p className="text-slate-500">กำลังนำคุณไปยังหน้าแรก...</p>
          </div>
        ) : (
          <div className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Error Box */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                </div>
              )}

              {/* Identifier Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  อีเมล หรือ รหัสนักศึกษา
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="เช่น somchai@gmail.com หรือ 6410110xxx"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">
                    รหัสผ่าน
                  </label>
                  <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer ${
                  isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>กำลังตรวจสอบสิทธิ์...</span>
                  </>
                ) : (
                  <span>เข้าสู่ระบบ</span>
                )}
              </button>
            </form>

            {/* Bottom Links */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                ยังไม่มีบัญชีใช่ไหม?{' '}
                <Link href="/register" className="text-blue-600 hover:underline font-bold">
                  สมัครสมาชิก
                </Link>
              </p>
              <div className="mt-5">
                <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  กลับหน้าหลัก
                </Link>
              </div>
            </div>

            {/* Mock Accounts Helper */}
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">บัญชีผู้ใช้จำลองสำหรับทดสอบ:</h4>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <p>• <b>ลูกค้า:</b> somchai@gmail.com หรือ 6410110001 (รหัส: password123)</p>
                    <p>• <b>ไรเดอร์:</b> somying@gmail.com หรือ 6410110002 (รหัส: password123)</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}