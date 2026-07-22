'use client';

import React, { useState, useEffect } from 'react';

export const CAMPUS_HOTSPOTS = [
  { name: 'หอพักนักศึกษา 11 (ชาย)', x: 30, y: 75, emoji: '🏢', category: 'Dorm' },
  { name: 'หอพักนักศึกษา 10 (หญิง)', x: 45, y: 75, emoji: '🏢', category: 'Dorm' },
  { name: 'คณะวิศวกรรมศาสตร์', x: 22, y: 52, emoji: '⚙️', category: 'Faculty' },
  { name: 'คณะวิทยาศาสตร์ (ตึกฟักทอง)', x: 32, y: 35, emoji: '🎃', category: 'Faculty' },
  { name: 'ศูนย์ทรัพยากรการเรียนรู้ LRC', x: 62, y: 55, emoji: '📚', category: 'Library' },
  { name: 'อ่างเก็บน้ำศรีตรัง', x: 82, y: 80, emoji: '🏞️', category: 'Park' },
  { name: 'โรงพยาบาลสงขลานครินทร์ (ม.อ.)', x: 55, y: 18, emoji: '🏥', category: 'Hospital' },
  { name: 'โรงอาหารโรงช้าง', x: 74, y: 62, emoji: '🍽️', category: 'Food' },
  { name: 'ตึกอธิการบดี (ม.อ.)', x: 65, y: 35, emoji: '🏛️', category: 'Admin' },
];

interface MapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fullDest: string, pinCoords: { x: number; y: number }, buildingName: string) => void;
  initialBuilding: string | null;
  initialCoords: { x: number; y: number } | null;
  title?: string;
  subtitle?: string;
  targetType?: 'pickup' | 'dropoff' | 'delivery';
}

export default function MapPinModal({
  isOpen,
  onClose,
  onSave,
  initialBuilding,
  initialCoords,
  title = 'GrabExpress',
  subtitle = 'เลือกตำแหน่งปักหมุดจัดส่งอาหารและสินค้าในวิทยาเขต',
  targetType = 'delivery',
}: MapPinModalProps) {
  const [selectedPinCoords, setSelectedPinCoords] = useState<{ x: number; y: number } | null>(initialCoords);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(initialBuilding);
  const [mapDetailInput, setMapDetailInput] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [zoomScale, setZoomScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPinCoords(initialCoords || { x: 30, y: 75 });
      setSelectedBuilding(initialBuilding || 'หอพักนักศึกษา 11 (ชาย)');
      setMapDetailInput('');
      setSearchQuery('');
    }
  }, [isOpen, initialCoords, initialBuilding]);

  if (!isOpen) return null;

  const getClosestHotspot = (x: number, y: number) => {
    let closest = CAMPUS_HOTSPOTS[0];
    let minDistance = Math.sqrt(Math.pow(x - closest.x, 2) + Math.pow(y - closest.y, 2));

    CAMPUS_HOTSPOTS.forEach((spot) => {
      const dist = Math.sqrt(Math.pow(x - spot.x, 2) + Math.pow(y - spot.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closest = spot;
      }
    });

    return closest;
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setSelectedPinCoords({ x: clampedX, y: clampedY });
    const closest = getClosestHotspot(clampedX, clampedY);
    setSelectedBuilding(closest.name);
  };

  const handleSavePin = () => {
    if (!selectedBuilding || !selectedPinCoords) {
      alert('กรุณาเลือกหรือปักหมุดตำแหน่งก่อนครับ');
      return;
    }
    const fullDest = `📍 ${selectedBuilding}${
      mapDetailInput.trim() ? ` (${mapDetailInput.trim()})` : ''
    }`;
    onSave(fullDest, selectedPinCoords, selectedBuilding);
  };

  const filteredHotspots = CAMPUS_HOTSPOTS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-slide-up">
        {/* Grab Express Location Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3 text-left">
            {/* Location Header */}
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-primary/20">
              {targetType === 'pickup' ? '📍' : targetType === 'dropoff' ? '🏁' : '🛵'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                  PSU Campus
                </span>
              </div>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-center">
          {/* Google Maps Search Bar & Map Layer Switcher */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Google Search Bar Input */}
            <div className="relative flex-1 text-left">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาตึก/คณะ/อาคารใน ม.อ. หาดใหญ่..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Google Map Mode Toggle (Roadmap vs Satellite) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start">
              <button
                type="button"
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mapType === 'roadmap'
                    ? 'bg-white shadow-xs text-blue-600 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🗺️ แผนที่
              </button>
              <button
                type="button"
                onClick={() => setMapType('satellite')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  mapType === 'satellite'
                    ? 'bg-slate-900 shadow-xs text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛰️ ดาวเทียม
              </button>
            </div>
          </div>

          {/* Interactive Google Maps Viewport Container */}
          <div
            className="relative aspect-[5/4] w-full max-w-[480px] mx-auto rounded-2xl overflow-hidden border border-slate-300 shadow-md select-none transition-all duration-300 bg-slate-200"
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
          >
            {/* Real Live Google Maps Embedded View for PSU Hat Yai Campus */}
            <iframe
              title="Real Google Maps PSU Hat Yai"
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-85"
              src={
                mapType === 'satellite'
                  ? 'https://maps.google.com/maps?q=Prince%20of%20Songkla%20University%20Hat%20Yai&t=k&z=16&ie=UTF8&iwloc=&output=embed'
                  : 'https://maps.google.com/maps?q=Prince%20of%20Songkla%20University%20Hat%20Yai&t=&z=16&ie=UTF8&iwloc=&output=embed'
              }
              loading="lazy"
            ></iframe>

            {/* Clickable Overlay Layer for Coordinate Math */}
            <div onClick={handleMapClick} className="absolute inset-0 z-20 cursor-crosshair"></div>

            {/* Google Maps Watermark Badge (Bottom Left) */}
            <div className="absolute bottom-2 left-3 z-30 pointer-events-none flex items-center gap-1.5 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-slate-200/60">
              <span className="text-xs font-black tracking-tight text-slate-800">
                Google <span className="text-[10px] text-slate-500 font-normal">Maps</span>
              </span>
            </div>

            {/* Google Maps Zoom Controls (+ / -) (Bottom Right) */}
            <div className="absolute bottom-3 right-3 z-30 flex flex-col bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.3, z + 0.1))}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer border-b border-slate-100"
                title="ขยาย"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(1.0, z - 0.1))}
                className="w-8 h-8 flex items-center justify-center text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="ย่อ"
              >
                −
              </button>
            </div>

            {/* Google POI Place Markers */}
            {filteredHotspots.map((spot) => {
              const isCurrentSelection = selectedBuilding === spot.name;
              return (
                <button
                  key={spot.name}
                  type="button"
                  onClick={() => {
                    setSelectedPinCoords({ x: spot.x, y: spot.y });
                    setSelectedBuilding(spot.name);
                  }}
                  className={`absolute z-35 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition text-[10px] font-bold border cursor-pointer ${
                    isCurrentSelection
                      ? 'bg-[#1a73e8] border-[#1a73e8] text-white ring-4 ring-blue-500/20 z-30 scale-105'
                      : mapType === 'satellite'
                      ? 'bg-slate-900/90 border-slate-700 text-slate-100'
                      : 'bg-white/95 border-slate-200 text-slate-800 hover:border-blue-400'
                  }`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <span className="text-xs shrink-0">{spot.emoji}</span>
                  <span className="truncate max-w-[90px]">{spot.name.split(' (')[0]}</span>
                </button>
              );
            })}

            {/* Google Red Marker Pin SVG */}
            {selectedPinCoords && (
              <div
                className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                style={{ left: `${selectedPinCoords.x}%`, top: `${selectedPinCoords.y}%` }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Google Maps Drop Pin SVG Icon */}
                  <svg className="w-8 h-10 filter drop-shadow-md animate-bounce" viewBox="0 0 24 36" fill="none">
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37 18.63 0 12 0Z"
                      fill="#EA4335"
                    />
                    <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
                  </svg>
                  {/* Shadow pulse under pin */}
                  <div className="w-3 h-1 bg-black/40 rounded-full blur-xs -mt-1 animate-pulse"></div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Pin Details Card */}
          {selectedBuilding && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 animate-fade-in text-xs font-sans">
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-full bg-red-100 text-[#ea4335] flex items-center justify-center text-base shrink-0 font-bold">
                  📍
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    จุดปักหมุดที่เลือกใน Google Maps
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{selectedBuilding}</h4>
                  {selectedPinCoords && (
                    <span className="text-[10px] text-slate-400">
                      พิกัดจำลอง: {selectedPinCoords.x.toFixed(1)}° N, {selectedPinCoords.y.toFixed(1)}° E
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  ระบุรายละเอียดเพิ่มเติม (เช่น ชั้น, เลขห้อง, หรือจุดสังเกต)
                </label>
                <input
                  type="text"
                  value={mapDetailInput}
                  onChange={(e) => setMapDetailInput(e.target.value)}
                  placeholder="เช่น ชั้น 3 ห้อง 302, หรือ ข้างซุ้มเครื่องดื่ม"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-xs transition font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition duration-200 text-center cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSavePin}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition duration-200 text-center cursor-pointer shadow-sm shadow-primary/20 active:scale-95"
          >
            {targetType === 'pickup' ? '📌 ยืนยันจุดรับผู้โดยสาร' : targetType === 'dropoff' ? '🏁 ยืนยันจุดส่งผู้โดยสาร' : 'ปักหมุดตำแหน่งจัดส่งนี้'}
          </button>
        </div>
      </div>
    </div>
  );
}
