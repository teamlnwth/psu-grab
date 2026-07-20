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
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1.5 group">
          <span className="text-lg sm:text-2xl font-black text-primary tracking-tight flex items-center gap-1.5 hover:scale-[1.02] transition-all duration-200 shrink-0">
            CampusGo <span className="text-sm sm:text-xl transform group-hover:translate-x-0.5 transition-transform">🛵</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="flex flex-col items-end leading-none text-right">
                <span className="text-xs sm:text-sm font-black text-slate-800 truncate max-w-[90px] sm:max-w-[140px] block">
                  {user.name}
                </span>
                <span
                  className={`text-[8.5px] sm:text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1.5 border ${
                    user.role === 'customer'
                      ? 'bg-primary-light text-primary-dark border-primary/10'
                      : user.role === 'rider'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                      : user.role === 'admin'
                      ? 'bg-purple-50 text-purple-600 border-purple-200/60'
                      : 'bg-secondary-light text-secondary border-secondary/10'
                  }`}
                >
                  {user.role === 'customer'
                    ? 'ลูกค้า'
                    : user.role === 'rider'
                    ? 'ไรเดอร์'
                    : user.role === 'admin'
                    ? 'แอดมิน'
                    : `ร้าน: ${user.shopName}`}
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-200 rounded-xl transition-all duration-250 cursor-pointer shrink-0 active:scale-95"
              >
                <span>ออกจากระบบ</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition duration-200"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2.5 text-[10px] sm:text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition duration-300 active:scale-95"
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
