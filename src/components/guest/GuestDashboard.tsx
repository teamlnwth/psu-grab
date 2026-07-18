'use client';

import React from 'react';
import Link from 'next/link';

export default function GuestDashboard() {
  return (
    <div className="space-y-12 py-4 animate-fade-in text-left">
      {/* Banner Card */}
      <div className="bg-gradient-to-br from-primary via-primary-hover to-secondary rounded-[32px] p-8 md:p-14 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
        {/* Background visual flares */}
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-20 -translate-y-20">
          <svg width="400" height="400" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" />
          </svg>
        </div>
        <div className="absolute left-1/3 bottom-0 opacity-10 pointer-events-none translate-y-16">
          <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 space-y-6 lg:max-w-xl text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/10 backdrop-blur-sm">
            📍 บริการจัดส่งและเรียกรถรับส่ง ม.อ. หาดใหญ่
          </span>
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
            สะดวก รวดเร็ว <br className="hidden md:inline" />
            เชื่อมโยงทุกมุม ม.อ. กับ <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-250 font-black">PSU Grab</span>
          </h1>
          <p className="text-emerald-50 text-sm md:text-base font-medium leading-relaxed max-w-lg">
            บริการเรียกรถเดินทางและสั่งซื้ออาหาร/สินค้าสะดวกซื้อจากร้านพาร์ทเนอร์ในวิทยาเขต จัดส่งโดยนักศึกษาไรเดอร์ ตลอด 24 ชั่วโมง
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
            <Link
              href="/login"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              เข้าสู่ระบบเลย
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-extrabold rounded-2xl text-center border border-white/25 transition-all duration-300 active:scale-95"
            >
              สมัครสมาชิกใหม่
            </Link>
          </div>
        </div>

        {/* Mockup visual block */}
        <div className="relative z-10 w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6.5 shadow-2xl border border-slate-100 self-stretch flex flex-col justify-between min-h-[300px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-left">
              <span className="text-xs font-extrabold text-primary bg-primary-light px-3 py-1 rounded-lg border border-primary/10">
                PSU Grab App
              </span>
              <span className="text-[11px] font-bold text-slate-400">ยินดีต้อนรับ</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl flex items-center gap-2.5 text-slate-450 text-xs border border-slate-200/50">
              <span>🔍</span>
              <span className="font-medium">ค้นหาร้านอาหาร หรือจุดรับส่งใน ม.อ.</span>
            </div>
          </div>

          {/* Quick links block */}
          <div className="grid grid-cols-4 gap-3 my-6">
            <Link href="/login" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-primary-light group-hover:bg-primary/20 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm border border-primary/5 active:scale-90">
                🍔
              </div>
              <span className="text-[11.5px] font-black text-slate-650 group-hover:text-primary transition">สั่งอาหาร</span>
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-primary-light group-hover:bg-primary/20 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm border border-primary/5 active:scale-90">
                🛵
              </div>
              <span className="text-[11.5px] font-black text-slate-655 group-hover:text-primary transition">เรียกรถ</span>
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-primary-light group-hover:bg-primary/20 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm border border-primary/5 active:scale-90">
                📦
              </div>
              <span className="text-[11.5px] font-black text-slate-655 group-hover:text-primary transition">ส่งของ</span>
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-primary-light group-hover:bg-primary/20 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm border border-primary/5 active:scale-90">
                🛒
              </div>
              <span className="text-[11.5px] font-black text-slate-655 group-hover:text-primary transition">มาร์ท</span>
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-4.5 flex justify-between items-center text-xs">
            <span className="text-[11.5px] text-slate-400 font-bold flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              ระบบจัดส่งแบบสด
            </span>
            <Link href="/login" className="font-black text-primary hover:text-primary-hover hover:underline">
              เริ่มสั่งซื้อเลย →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
