'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<'customer' | 'rider'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = register({
      name,
      email,
      phone,
      studentId: studentId || undefined,
      role,
      password,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-300">
        
        {/* Progress/Role Selector Header */}
        <div className="relative p-8 pb-4 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">สมัครสมาชิก</h1>
          <p className="text-slate-500">สร้างบัญชีผู้ใช้ PSU Grab ของคุณ</p>
          
          {/* Role Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mt-6 relative z-10">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                role === 'customer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ลูกค้าทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setRole('rider')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                role === 'rider'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              คนขับ/ไรเดอร์
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center animate-fade-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce ${
              role === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">สมัครสมาชิกสำเร็จ!</h2>
            <p className="text-slate-500">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                }`}
                placeholder="เช่น สมชาย รักดี"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                    role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                  }`}
                  placeholder="เช่น 0812345678"
                  required
                />
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  รหัสนักศึกษา <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                    role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                  }`}
                  placeholder="เช่น 6410110xxx"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                }`}
                placeholder="เช่น somchai@gmail.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                }`}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none transition focus:ring-2 focus:border-transparent ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'
                }`}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                role === 'customer' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
              } ${isSubmitting ? 'opacity-85 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังลงทะเบียน...</span>
                </>
              ) : (
                <span>สมัครสมาชิก</span>
              )}
            </button>

            {/* Links */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-500">
                มีบัญชีอยู่แล้วใช่ไหม?{' '}
                <Link 
                  href="/login" 
                  className={`font-semibold hover:underline ${
                    role === 'customer' ? 'text-blue-600' : 'text-amber-500'
                  }`}
                >
                  เข้าสู่ระบบ
                </Link>
              </p>
              <div className="mt-4">
                <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  กลับหน้าหลัก
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
