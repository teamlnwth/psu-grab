'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { LocationPoint } from '@/types/map';

interface CampusMapProps {
  pickup: LocationPoint | null;
  destination: LocationPoint | null;
  userGps: LocationPoint | null;
  selectionMode: 'pickup' | 'destination';
  onSelectLocation: (mode: 'pickup' | 'destination', point: LocationPoint) => void;
  center?: [number, number];
  zoom?: number;
}

// Dynamically import Leaflet map with SSR disabled for Next.js App Router
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-3xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-400 animate-pulse">
      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-semibold">กำลังโหลดแผนที่ ม.อ....</span>
    </div>
  ),
});

export default function CampusMap(props: CampusMapProps) {
  return <LeafletMapInner {...props} />;
}
