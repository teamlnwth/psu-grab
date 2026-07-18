'use client';

import React, { useState, useEffect } from 'react';

export const CAMPUS_HOTSPOTS = [
  { name: 'หอพักนักศึกษา 11 (ชาย)', x: 30, y: 75, emoji: '🏢', color: 'bg-emerald-500' },
  { name: 'หอพักนักศึกษา 10 (หญิง)', x: 45, y: 75, emoji: '🏢', color: 'bg-emerald-500' },
  { name: 'คณะวิศวกรรมศาสตร์', x: 22, y: 52, emoji: '⚙️', color: 'bg-red-500' },
  { name: 'คณะวิทยาศาสตร์ (ตึกฟักทอง)', x: 32, y: 35, emoji: '🎃', color: 'bg-amber-500' },
  { name: 'ศูนย์ทรัพยากรการเรียนรู้ LRC', x: 62, y: 55, emoji: '📚', color: 'bg-blue-500' },
  { name: 'อ่างเก็บน้ำศรีตรัง', x: 82, y: 80, emoji: '🏞️', color: 'bg-sky-400' },
  { name: 'โรงพยาบาลสงขลานครินทร์ (ม.อ.)', x: 55, y: 18, emoji: '🏥', color: 'bg-rose-500' },
  { name: 'โรงอาหารโรงช้าง', x: 74, y: 62, emoji: '🍽️', color: 'bg-orange-500' },
  { name: 'ตึกอธิการบดี (ม.อ.)', x: 65, y: 35, emoji: '🏛️', color: 'bg-indigo-500' },
];

interface MapPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fullDest: string, pinCoords: { x: number; y: number }, buildingName: string) => void;
  initialBuilding: string | null;
  initialCoords: { x: number; y: number } | null;
}

export default function MapPinModal({
  isOpen,
  onClose,
  onSave,
  initialBuilding,
  initialCoords,
}: MapPinModalProps) {
  const [selectedPinCoords, setSelectedPinCoords] = useState<{ x: number; y: number } | null>(initialCoords);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(initialBuilding);
  const [mapDetailInput, setMapDetailInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPinCoords(initialCoords || { x: 30, y: 75 });
      setSelectedBuilding(initialBuilding || 'หอพักนักศึกษา 11 (ชาย)');
      setMapDetailInput('');
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#F7F9FA]/50">
          <div className="space-y-0.5 text-left">
            <h3 className="text-sm font-black text-slate-800">ปักหมุดตำแหน่งจัดส่ง (ม.อ. หาดใหญ่)</h3>
            <p className="text-[10px] text-slate-400 font-bold">เลือกตำแหน่งบนแผนที่จำลองวิทยาเขต</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-350 text-slate-655 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-center">
          {/* Informative tips */}
          <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-3.5 text-left text-[11px] text-slate-500 font-medium">
            💡 <b>คำแนะนำ:</b> คลิกบนปุ่มสถานที่หรือส่วนใดๆ บนแผนที่เพื่อย้ายหมุดแดง (📍) ระบบจะคำนวณตำแหน่งที่ใกล้ที่สุดให้โดยอัตโนมัติ
          </div>

          {/* Interactive PSU Map Grid Container */}
          <div className="relative aspect-[5/4] w-full max-w-[480px] mx-auto bg-slate-100 border border-slate-200 rounded-3xl overflow-hidden shadow-inner select-none">
            {/* Map Grid Pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {/* Illustrated Roads / Paths */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%] border-4 border-dashed border-slate-200 rounded-[40px] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-0 left-[25%] w-0.5 h-full bg-slate-200"></div>
              <div className="absolute top-[40%] left-0 w-full h-0.5 bg-slate-200"></div>
            </div>

            {/* Sri-Trang Lake (🏞️) Decoration */}
            <div className="absolute top-[68%] left-[72%] w-[22%] h-[18%] bg-sky-105 border border-sky-300 rounded-[50px] flex flex-col items-center justify-center pointer-events-none shadow-inner">
              <span className="text-xl">🏞️</span>
              <span className="text-[8px] font-bold text-sky-600 mt-0.5">อ่างศรีตรัง</span>
            </div>

            {/* Clickable Overlay Layer for Coordinate Math */}
            <div onClick={handleMapClick} className="absolute inset-0 z-20 cursor-crosshair"></div>

            {/* Hotspots Marker Buttons */}
            {CAMPUS_HOTSPOTS.map((spot) => {
              const isCurrentSelection = selectedBuilding === spot.name;
              return (
                <button
                  key={spot.name}
                  type="button"
                  onClick={() => {
                    setSelectedPinCoords({ x: spot.x, y: spot.y });
                    setSelectedBuilding(spot.name);
                  }}
                  className={`absolute z-35 -translate-x-1/2 -translate-y-1/2 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl flex items-center gap-0.5 sm:gap-1 shadow-md hover:scale-105 active:scale-95 transition-all text-[8px] sm:text-[9.5px] font-black border cursor-pointer ${
                    isCurrentSelection
                      ? 'bg-primary border-primary text-white ring-4 ring-blue-105 z-30'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'
                  }`}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                >
                  <span className="text-[10px] sm:text-xs shrink-0">{spot.emoji}</span>
                  <span className="truncate max-w-[40px] sm:max-w-[80px]">{spot.name.split(' (')[0]}</span>
                </button>
              );
            })}

            {/* Floating Red Marker Pin */}
            {selectedPinCoords && (
              <div
                className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                style={{ left: `${selectedPinCoords.x}%`, top: `${selectedPinCoords.y}%` }}
              >
                {/* Animated Pulse Ring underneath the pin */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-2 bg-red-500/35 rounded-full blur-xs animate-ping"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-1 bg-red-500 rounded-full"></div>

                {/* Visual Marker Pin icon */}
                <div className="text-3xl filter drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)] animate-bounce">
                  📍
                </div>
              </div>
            )}
          </div>

          {/* Pin Selection Details Form */}
          {selectedBuilding && (
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 text-left space-y-4 animate-fade-in font-sans">
              <div className="flex gap-3 items-center">
                <span className="text-3xl">📍</span>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">พิกัดสถานที่ปัจจุบัน</span>
                  <h4 className="text-sm font-black text-slate-800">{selectedBuilding}</h4>
                  {selectedPinCoords && (
                    <span className="text-[9px] text-slate-400 font-semibold">
                      (พิกัดแผนที่: X={selectedPinCoords.x.toFixed(1)}%, Y={selectedPinCoords.y.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                  รายละเอียดอาคาร / ชั้น / เลขห้อง (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={mapDetailInput}
                  onChange={(e) => setMapDetailInput(e.target.value)}
                  placeholder="เช่น ชั้น 3 ห้อง 302, หรือ ใต้ตึกวิศวะเครื่องกล"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-xs transition font-semibold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-[#F7F9FA]/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition duration-200 text-center cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSavePin}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition duration-200 text-center cursor-pointer shadow-md shadow-blue-100"
          >
            บันทึกและใช้พิกัดนี้
          </button>
        </div>
      </div>
    </div>
  );
}
