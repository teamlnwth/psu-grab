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

    // Validation
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
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-lg border border-slate-100/50 overflow-hidden transition-all duration-300 animate-fade-in">
        
        {/* Header & Role Toggle */}
        <div className="p-8 pb-4 text-center">
          <Link href="/" className="inline-block mb-2">
            <span className="text-3xl font-black text-blue-600 tracking-tight flex items-center gap-1.5 justify-center">
              PSU Grab <span>🛵</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-5">สร้างบัญชีผู้ใช้ใหม่ในระบบ</p>
          
          {/* Dual Blue Role Selection */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl relative z-10 border border-slate-200/30">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                role === 'customer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👤 ลูกค้าทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setRole('rider')}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                role === 'rider'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛵 คนขับ/ไรเดอร์
            </button>
          </div>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 animate-bounce ${
              role === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-sky-50 text-sky-600'
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">ลงทะเบียนเรียบร้อยแล้ว!</h2>
            <p className="text-slate-400 text-xs font-medium">ระบบกำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-start gap-2.5">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-red-700 font-semibold">{error}</span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">ชื่อ - นามสกุล <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                }`}
                placeholder="สมชาย รักเรียน"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                    role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                  }`}
                  placeholder="0812345678"
                  required
                />
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">รหัสนักศึกษา <span className="text-slate-400 font-normal lowercase">(ถ้ามี)</span></label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                    role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                  }`}
                  placeholder="641011xxxx"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">อีเมล <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                }`}
                placeholder="somchai@gmail.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">รหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                }`}
                placeholder="กำหนดรหัสผ่าน (6 ตัวขึ้นไป)"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition ${
                  role === 'customer' ? 'focus:ring-blue-500' : 'focus:ring-sky-500'
                }`}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-extrabold py-4 px-4 rounded-2xl transition duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                role === 'customer' 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' 
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-100'
              } ${isSubmitting ? 'opacity-85 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <span>ลงทะเบียนสมัครสมาชิก</span>
              )}
            </button>

            {/* Links */}
            <div className="text-center pt-3 space-y-4">
              <p className="text-xs text-slate-400 font-semibold">
                มีบัญชีเดิมอยู่แล้ว?{' '}
                <Link 
                  href="/login" 
                  className={`font-extrabold hover:underline ${
                    role === 'customer' ? 'text-blue-600' : 'text-sky-600'
                  }`}
                >
                  คลิกเข้าสู่ระบบ
                </Link>
              </p>
              <div className="pt-2 border-t border-slate-100">
                <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1 font-bold">
                  ← กลับไปหน้าหลัก
                </Link>
              </div>
            </div>

          </form>
        )}
      </div>
    </main>
  );
}
