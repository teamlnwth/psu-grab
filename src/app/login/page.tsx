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
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-lg border border-slate-100/50 overflow-hidden p-8 transition-all duration-300 animate-fade-in">
        
        {/* Logo and Greeting */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <span className="text-3xl font-black text-blue-600 tracking-tight flex items-center gap-1.5 justify-center">
              PSU Grab <span>🛵</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">เข้าสู่ระบบการสั่งซื้อและการขับขี่</p>
        </div>

        {success ? (
          <div className="text-center py-8 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">ยินดีต้อนรับเข้าสู่ระบบ!</h2>
            <p className="text-slate-400 text-xs font-medium">กำลังพาคุณไปยังหน้าหลัก...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-start gap-2.5">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-red-700 font-semibold">{error}</span>
              </div>
            )}

            {/* Email/Student ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">อีเมล หรือ รหัสนักศึกษา</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50/100 text-sm transition"
                placeholder="somchai@gmail.com หรือ 641011xxxx"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">รหัสผ่าน</label>
                <a href="#" className="text-[11px] font-bold text-blue-600 hover:underline">ลืมรหัสผ่าน?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50/100 text-sm transition"
                placeholder="ระบุรหัสผ่านของคุณ"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-4 rounded-2xl transition duration-300 shadow-md shadow-blue-100 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <span>เข้าสู่ระบบ</span>
              )}
            </button>
          </form>
        )}

        {/* Links */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-xs text-slate-400 font-semibold">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-extrabold">สมัครสมาชิกที่นี่</Link>
          </p>
          <div className="pt-2 border-t border-slate-100">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1 font-bold">
              ← กลับไปหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Testing Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs">
          <h4 className="font-bold text-slate-700 mb-1">💡 บัญชีจำลองสำหรับทดสอบ:</h4>
          <div className="text-[10px] text-slate-500 space-y-1">
            <p>• <b>ลูกค้า:</b> somchai@gmail.com (รหัส: password123)</p>
            <p>• <b>ไรเดอร์:</b> somying@gmail.com (รหัส: password123)</p>
            <p>• <b>ร้านอาหาร:</b> krua_psu@gmail.com (รหัส: password123)</p>
            <p>• <b>ร้านมินิมาร์ท:</b> psu_mart@gmail.com (รหัส: password123)</p>
          </div>
        </div>

      </div>
    </main>
  );
}