'use client';

import React from 'react';
import { useAuth } from './context/AuthContext';
import { isSupabaseConfigured } from './supabase';
import Header from '../components/common/Header';
import GuestDashboard from '../components/guest/GuestDashboard';
import CustomerDashboard from '../components/customer/CustomerDashboard';
import MerchantDashboard from '../components/merchant/MerchantDashboard';
import RiderDashboard from '../components/rider/RiderDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';

export default function Home() {
  const { user, loading, logout } = useAuth();

  // Loading skeleton screen
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-500 animate-pulse">กำลังเชื่อมต่อข้อมูล CampusGo...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-slate-800 flex flex-col antialiased font-sans">
      {/* Global Header */}
      <Header user={user} logout={logout} />

      {/* Database Setup Warning */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-y border-amber-200 py-4.5 text-center text-xs text-amber-800 font-bold flex flex-col items-center justify-center gap-1.5 animate-fade-in">
          <span className="text-sm">⚠️ ยังไม่ได้ตั้งค่า Supabase ในไฟล์ .env.local</span>
          <span className="font-normal text-slate-500">กด <b>Ctrl + C</b> ใน Terminal แล้วรัน <b>npm run dev</b> ใหม่อีกทีนะ</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* CASE 1: GUEST VIEW (NOT LOGGED IN) */}
        {!user && <GuestDashboard />}

        {/* CASE 2: CUSTOMER DASHBOARD */}
        {user && user.role === 'customer' && (
          <CustomerDashboard user={user} logout={logout} />
        )}

        {/* CASE 3: RIDER DASHBOARD */}
        {user && user.role === 'rider' && (
          <RiderDashboard user={user} />
        )}

        {/* CASE 4: MERCHANT DASHBOARD */}
        {user && user.role === 'merchant' && (
          <MerchantDashboard user={user} />
        )}

        {/* CASE 5: ADMIN DASHBOARD */}
        {user && user.role === 'admin' && (
          <AdminDashboard user={user} />
        )}
      </main>
    </div>
  );
}