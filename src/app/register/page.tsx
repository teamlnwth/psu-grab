'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../supabase';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<'customer' | 'rider' | 'merchant'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Merchant specific states
  const [shopName, setShopName] = useState('');
  const [merchantType, setMerchantType] = useState<'restaurant' | 'minimart'>('restaurant');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('กรอกข้อมูลให้ครบก่อนนะ');
      return;
    }

    if (role === 'merchant' && !shopName) {
      setError('ใส่ชื่อร้านด้วยนะ');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน ลองเช็คอีกที');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวนะ');
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await register({
      name,
      email,
      phone,
      studentId: studentId || undefined,
      role,
      shopName: role === 'merchant' ? shopName : undefined,
      merchantType: role === 'merchant' ? merchantType : undefined,
      password,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setVerificationToken(result.verificationToken || null);
      setRegisteredEmail(result.email || email);
    } else {
      setError(result.error || 'สมัครไม่ได้ ลองใหม่อีกที');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 md:p-8 font-sans animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden transition-all duration-300">
        
        {/* Warning banner */}
        {!isSupabaseConfigured && (
          <div className="mx-8 mt-8 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl text-[11px] text-amber-800 space-y-1">
            <p className="font-bold">⚠️ ยังไม่ได้ตั้งค่า Supabase</p>
            <p>กด <b>Ctrl + C</b> ใน Terminal แล้วรัน <b>npm run dev</b> ใหม่ เพื่อโหลดค่าจาก <b>.env.local</b></p>
          </div>
        )}
        
        {/* Header & Role Toggle */}
        <div className="p-8 pb-4 text-center">
          <Link href="/" className="inline-block mb-2 transition hover:scale-105">
            <span className="text-3xl font-black text-primary tracking-tight flex items-center gap-1.5 justify-center">
              CampusGo <span className="text-2xl">🛵</span>
            </span>
          </Link>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-5">สมัครสมาชิกใหม่</p>
          
          {/* Triple Green Role Selection */}
          {!success && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl relative z-10 border border-slate-200/30 gap-1">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 py-3 text-[10px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'customer'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                }`}
              >
                👤 ลูกค้า
              </button>
              <button
                type="button"
                onClick={() => setRole('rider')}
                className={`flex-1 py-3 text-[10px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'rider'
                    ? 'bg-primary-dark text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                }`}
              >
                🛵 ไรเดอร์
              </button>
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`flex-1 py-3 text-[10px] sm:text-xs font-extrabold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                  role === 'merchant'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                }`}
              >
                🏪 ร้านค้า
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-8 pt-2 text-center flex flex-col items-center justify-center animate-fade-in space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1.5">ส่งอีเมลยืนยันตัวตนแล้ว!</h2>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                ระบบได้ส่งลิงก์เปิดใช้งานบัญชีไปยัง <br/>
                <span className="font-bold text-slate-700">{registeredEmail}</span>
              </p>
            </div>

            {/* Mock Email Inbox Simulator Toast */}
            {verificationToken && (
              <div className="w-full bg-slate-900 text-white p-5 rounded-3xl text-left space-y-3 shadow-lg border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    📬 กล่องข้อความจำลอง (Mock Inbox)
                  </span>
                  <span className="text-[10px] text-slate-400">เมื่อครู่นี้</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-200">หัวข้อ: [CampusGo] ยืนยันอีเมลเพื่อเริ่มใช้งาน</p>
                  <p className="text-[11px] text-slate-400">จาก: noreply@campusgo.psu.ac.th</p>
                </div>
                
                <Link
                  href={`/verify-email?token=${verificationToken}`}
                  className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>✉️ กดยืนยันอีเมลทันที (Verify Email)</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            )}

            <div className="pt-2 space-y-3 w-full">
              <Link
                href="/login"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition text-xs flex items-center justify-center"
              >
                ไปที่หน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-start gap-2.5">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs text-red-700 font-semibold text-left">{error}</span>
              </div>
            )}

            {/* Merchant Shop Details Form Section */}
            {role === 'merchant' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 animate-slide-up">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-slate-200/50 pb-2 text-left">ข้อมูลร้านค้า</h3>
                
                {/* Shop Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">ชื่อร้านค้า <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-sm transition"
                    placeholder="เช่น ครัวมะม่วงเบา, ม.อ. คอนเนอร์"
                    required={role === 'merchant'}
                  />
                </div>

                {/* Shop Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">ประเภทของร้านค้า <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMerchantType('restaurant')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        merchantType === 'restaurant'
                          ? 'border-primary bg-primary-light text-primary-dark font-bold'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350'
                      }`}
                    >
                      <span className="text-xl">🍔</span>
                      <span className="text-[11px]">ร้านอาหาร</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMerchantType('minimart')}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        merchantType === 'minimart'
                          ? 'border-primary bg-primary-light text-primary-dark font-bold'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-355'
                      }`}
                    >
                      <span className="text-xl">🛒</span>
                      <span className="text-[11px]">ร้านมินิมาร์ท</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Owner/Contact Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">
                {role === 'merchant' ? 'ชื่อผู้ดูแลร้านค้า (เจ้าของ)' : 'ชื่อ - นามสกุล'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                placeholder="สมชาย รักเรียน"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                  placeholder="0812345678"
                  required
                />
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">
                  {role === 'merchant' ? 'รหัสนักศึกษา (พาร์ทเนอร์)' : 'รหัสนักศึกษา'} <span className="text-slate-400 font-normal lowercase">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                  placeholder="641011xxxx"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">อีเมลร้านค้า / อีเมลผู้ใช้ <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                placeholder="somchai@gmail.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">รหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                placeholder="กำหนดรหัสผ่าน (6 ตัวขึ้นไป)"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide text-left">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50/50 hover:bg-slate-50 text-sm transition-all duration-200"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-extrabold py-4 px-4 rounded-2xl transition duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                role === 'customer' 
                  ? 'bg-primary hover:bg-primary-hover shadow-emerald-100/50' 
                  : role === 'rider' 
                  ? 'bg-primary-dark hover:bg-primary-hover shadow-emerald-100/50'
                  : 'bg-emerald-700 hover:bg-emerald-850 shadow-emerald-150/50'
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
                    role === 'customer' ? 'text-primary' : role === 'rider' ? 'text-primary-dark' : 'text-emerald-700'
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
