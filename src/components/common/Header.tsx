'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '../../app/context/AuthContext';

interface HeaderProps {
  user: User | null;
  logout: () => void;
}

export default function Header({ user, logout }: HeaderProps) {
  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 z-50 shadow-xs transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-lg shadow-sm shadow-primary/20 group-hover:scale-105 transition duration-200">
            🛵
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Campus<span className="text-primary">Go</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              PSU Express
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80">
                <div className="w-7 h-7 rounded-full bg-primary-light text-primary-dark font-bold text-xs flex items-center justify-center border border-primary/20">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-none">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 capitalize leading-tight">
                    {user.role === 'customer'
                      ? 'ลูกค้า'
                      : user.role === 'rider'
                      ? 'ไรเดอร์'
                      : user.role === 'admin'
                      ? 'แอดมิน'
                      : `ร้าน: ${user.shopName || user.name}`}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200 rounded-full transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition duration-200"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-full shadow-sm hover:shadow-md transition duration-200 active:scale-95"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
