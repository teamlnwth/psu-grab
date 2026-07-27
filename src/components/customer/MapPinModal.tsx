'use client';

import React, { useState, useEffect } from 'react';

export const CAMPUS_HOTSPOTS = [
  { name: 'หอพักนักศึกษา 11 (ชาย)', x: 30, y: 75, emoji: '🏢', category: 'Dorm' },
  { name: 'หอพักนักศึกษา 10 (หญิง)', x: 45, y: 75, emoji: '🏢', category: 'Dorm' },
  { name: 'คณะวิศวกรรมศาสตร์', x: 22, y: 52, emoji: '⚙️', category: 'Faculty' },
  { name: 'คณะวิทยาศาสตร์', x: 32, y: 35, emoji: '🍅', category: 'Faculty' },
  { name: 'ศูนย์ทรัพยากรการเรียนรู้ LRC', x: 62, y: 55, emoji: '📚', category: 'Library' },
  { name: 'อ่างเก็บน้ำศรีตรัง', x: 82, y: 80, emoji: '🏞️', category: 'Park' },
  { name: 'โรงพยาบาลสงขลานครินทร์ (ม.อ.)', x: 55, y: 18, emoji: '🏥', category: 'Hospital' },
  { name: 'โรงอาหารโรงช้าง', x: 74, y: 62, emoji: '🍽️', category: 'Food' },
  { name: 'ตึกอธิการบดี', x: 65, y: 35, emoji: '🏛️', category: 'Admin' },
];

interface MapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fullDest: string, pinCoords: { x: number; y: number }, buildingName: string) => void;
  initialBuilding?: string | null;
  initialCoords?: { x: number; y: number } | null;
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
  const [selectedPinCoords, setSelectedPinCoords] = useState<{ x: number; y: number } | null>(initialCoords || { x: 30, y: 75 });
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(initialBuilding || 'หอพักนักศึกษา 11 (ชาย)');
  const [mapDetailInput, setMapDetailInput] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  useEffect(() => {
    if (isOpen) {
      setSelectedPinCoords(initialCoords || { x: 30, y: 75 });
      setSelectedBuilding(initialBuilding || 'หอพักนักศึกษา 11 (ชาย)');
      setMapDetailInput('');
    }
  }, [isOpen, initialCoords, initialBuilding]);

  if (!isOpen) return null;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setSelectedPinCoords({ x: clampedX, y: clampedY });
  };

  const handleSavePin = () => {
    if (!selectedBuilding || !selectedPinCoords) {
      alert('กรุณาเลือกตำแหน่งก่อนครับ');
      return;
    }
    const fullDest = `📍 ${selectedBuilding}${mapDetailInput.trim() ? ` (${mapDetailInput.trim()})` : ''}`;
    onSave(fullDest, selectedPinCoords, selectedBuilding);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100 animate-pop-in">
        {/* Header matching Image 1 */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3.5 text-left">
            {/* Green Scooter Icon */}
            <div className="w-11 h-11 rounded-2xl bg-[#00B14F] text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-500/20 shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
                <span className="text-[10px] font-black text-[#00B14F] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  PSU Campus
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4 text-left overflow-y-auto">
          {/* Map Viewport matching Image 1 */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-[#E5E3DF] select-none">
            {/* Embedded Live Map Background */}
            <iframe
              title="Google Maps PSU Campus"
              width="100%"
              height="100%"
              className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90 filter contrast-[1.02]"
              src={
                mapType === 'satellite'
                  ? 'https://maps.google.com/maps?q=Prince%20of%20Songkla%20University%20Hat%20Yai&t=k&z=16&ie=UTF8&iwloc=&output=embed'
                  : 'https://maps.google.com/maps?q=Prince%20of%20Songkla%20University%20Hat%20Yai&t=&z=16&ie=UTF8&iwloc=&output=embed'
              }
              loading="lazy"
            ></iframe>

            {/* Clickable Overlay Layer */}
            <div onClick={handleMapClick} className="absolute inset-0 z-20 cursor-pointer"></div>

            {/* Location Chips on Map matching Image 1 */}
            {CAMPUS_HOTSPOTS.map((spot) => {
              const isSelected = selectedBuilding === spot.name;
              return (
                <button
                  key={spot.name}
                  type="button"
                  onClick={() => {
                    setSelectedPinCoords({ x: spot.x, y: spot.y });
                    setSelectedBuilding(spot.name);
                  }}
                  className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md hover:scale-105 transition-all text-[11px] font-extrabold cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1a73e8] border-[#1a73e8] text-white ring-4 ring-blue-500/20 z-40 scale-105'
                      : 'bg-white/95 text-slate-800 border-slate-200/90 hover:border-slate-400'
                  }`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <span className="text-xs">{spot.emoji}</span>
                  <span className="truncate max-w-[110px]">{spot.name.split(' (')[0]}</span>
                </button>
              );
            })}

            {/* Red Drop Pin Indicator matching Image 1 */}
            {selectedPinCoords && (
              <div
                className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                style={{ left: `${selectedPinCoords.x}%`, top: `${selectedPinCoords.y}%` }}
              >
                <div className="relative flex flex-col items-center">
                  <svg className="w-8 h-10 filter drop-shadow-lg animate-bounce" viewBox="0 0 24 36" fill="none">
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37 18.63 0 12 0Z"
                      fill="#EA4335"
                    />
                    <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
                  </svg>
                  <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] -mt-1 animate-pulse"></div>
                </div>
              </div>
            )}

            {/* Bottom-Left Google Watermark */}
            <div className="absolute bottom-2.5 left-3 z-30 pointer-events-none bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
              <span className="text-[11px] font-black text-slate-800 tracking-tight">
                Google <span className="font-semibold text-slate-500">Maps</span>
              </span>
            </div>

            {/* Bottom-Right Zoom Controls matching Image 1 */}
            <div className="absolute bottom-2.5 right-3 z-30 flex flex-col bg-white rounded-lg shadow-md border border-slate-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer border-b border-slate-100"
                title="สลับโหมดแผนที่"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="สลับโหมดแผนที่"
              >
                −
              </button>
            </div>
          </div>

          {/* Selected Pin Details Card matching Image 1 */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
            <div className="flex gap-3.5 items-center">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center text-lg shrink-0 font-bold">
                📍
              </div>
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                  จุดปักหมุดที่เลือกใน GOOGLE MAPS
                </span>
                <h4 className="text-sm font-black text-slate-900">{selectedBuilding || 'เลือกจุดปักหมุดใน ม.อ.'}</h4>
                {selectedPinCoords && (
                  <span className="text-[10.5px] font-semibold text-slate-400 block">
                    พิกัดจำลอง: {selectedPinCoords.x.toFixed(1)}° N, {selectedPinCoords.y.toFixed(1)}° E
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-[11px] font-bold text-slate-700">
                ระบุรายละเอียดเพิ่มเติม (เช่น ชั้น, เลขห้อง, หรือจุดสังเกต)
              </label>
              <input
                type="text"
                value={mapDetailInput}
                onChange={(e) => setMapDetailInput(e.target.value)}
                placeholder="เช่น ชั้น 3 ห้อง 302 หรือ ข้างซุ้มม้านั่ง"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00B14F] focus:border-transparent outline-none bg-white text-xs font-semibold text-slate-800 transition"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSavePin}
            className="flex-1 py-3 bg-[#00B14F] hover:bg-[#008F3E] text-white text-xs font-black rounded-2xl transition cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            {targetType === 'pickup' ? '📌 ยืนยันจุดรับ' : targetType === 'dropoff' ? '🏁 ยืนยันจุดส่ง' : 'ปักหมุดตำแหน่งนี้'}
          </button>
        </div>
      </div>
    </div>
  );
}
