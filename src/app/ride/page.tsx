'use client';

import React from 'react';
import RideBookingMap from '@/components/customer/RideBookingMap';
import Link from 'next/link';

export default function RideBookingPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/" className="hover:text-emerald-600 transition">
            🏠 หน้าแรก CampusGo
          </Link>
          <span>/</span>
          <span className="text-slate-800">🛵 บริการเรียกรถ & แผนที่ ม.อ.</span>
        </div>

        {/* Ride Booking Map Component */}
        <RideBookingMap />
      </div>
    </main>
  );
}
