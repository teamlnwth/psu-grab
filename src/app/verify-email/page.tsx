'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const processVerification = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('ไม่พบข้อมูลโทเคนสำหรับยืนยันอีเมล');
        }
        return;
      }

      const result = await verifyEmail(token);
      
      if (isMounted) {
        if (result.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(result.error || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
        }
      }
    };

    processVerification();

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail]);

  return (
    <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 md:p-10 text-center transition-all duration-300 animate-fade-in space-y-6">
      <div className="text-center mb-2">
        <Link href="/" className="inline-block transition hover:scale-105">
          <span className="text-3xl font-black text-primary tracking-tight flex items-center gap-1.5 justify-center">
            CampusGo <span className="text-2xl">🛵</span>
          </span>
        </Link>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">ระบบยืนยันตัวตน</p>
      </div>

      {status === 'loading' && (
        <div className="py-8 space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <h2 className="text-lg font-bold text-slate-800">กำลังตรวจสอบการยืนยันอีเมล...</h2>
          <p className="text-xs text-slate-400">โปรดรอสักครู่ ระบบกำลังอัปเดตข้อมูลบัญชีของคุณ</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 space-y-5 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">ยืนยันอีเมลสำเร็จ! 🎉</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              บัญชี CampusGo ของคุณได้รับการเปิดใช้งานเรียบร้อยแล้ว สามารถเข้าสู่ระบบเพื่อใช้งานบริการต่างๆ ได้ทันที
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              <span>เข้าสู่ระบบเพื่อใช้งาน</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 space-y-5 animate-fade-in">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">ยืนยันอีเมลไม่สำเร็จ</h2>
            <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-2xl border border-red-100">
              {errorMessage}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-6 rounded-2xl transition text-xs"
            >
              ไปที่หน้าเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <Suspense fallback={
        <div className="p-8 text-center text-xs text-slate-400">กำลังโหลด...</div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
