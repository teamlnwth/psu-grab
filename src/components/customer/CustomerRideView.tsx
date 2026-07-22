'use client';

import React from 'react';
import { CAMPUS_HOTSPOTS } from './MapPinModal';

interface CustomerRideViewProps {
  user: { name: string; email: string };
  ridePickup: string;
  setRidePickup: (val: string) => void;
  rideDropoff: string;
  setRideDropoff: (val: string) => void;
  vehicleType: 'motorbike' | 'car' | 'scooter';
  setVehicleType: (val: 'motorbike' | 'car' | 'scooter') => void;
  passengers: number;
  setPassengers: (val: number) => void;
  rideNote: string;
  setRideNote: (val: string) => void;
  promoCodeInput: string;
  setPromoCodeInput: (val: string) => void;
  activePromo: any;
  setActivePromo: (promo: any) => void;
  promoError: string | null;
  onApplyPromoCode: (code: string) => void;
  onPlaceRideOrder: () => void;
  isRideBooking: boolean;
  getBaseRideFare: (type: 'motorbike' | 'car' | 'scooter') => number;
  onOpenMapForPickup: () => void;
  onOpenMapForDropoff: () => void;
}

export default function CustomerRideView({
  user,
  ridePickup,
  setRidePickup,
  rideDropoff,
  setRideDropoff,
  vehicleType,
  setVehicleType,
  passengers,
  setPassengers,
  rideNote,
  setRideNote,
  promoCodeInput,
  setPromoCodeInput,
  activePromo,
  setActivePromo,
  promoError,
  onApplyPromoCode,
  onPlaceRideOrder,
  isRideBooking,
  getBaseRideFare,
  onOpenMapForPickup,
  onOpenMapForDropoff,
}: CustomerRideViewProps) {
  const baseFare = getBaseRideFare(vehicleType);
  const discount = activePromo ? activePromo.discount_amount : 0;
  const finalFare = Math.max(0, baseFare - discount);

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {/* Premium Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-emerald-500/20">
        {/* Decorative Background Circles */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
              ⚡ บริการเรียกรถรับ-ส่ง ม.อ. หาดใหญ่ (Ride Hailing)
            </span>
            <span className="px-2.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              24 ชั่วโมง
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            เดินทางสะดวก รวดเร็ว ปลอดภัย ทั่วทุกมุมมหาลัย
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
            เลือกจุดรับ-จุดส่งตามคณะ หอพัก ตึกเรียน หรือปักหมุดบนแผนที่ ม.อ. โดยไรเดอร์นักศึกษาที่คุณไว้วางใจได้
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] font-semibold text-emerald-100 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              ⏱️ ถึงจุดรับใน ~3-5 นาที
            </span>
            <span className="text-[11px] font-semibold text-emerald-100 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              🛡️ หมวกกันน็อคและระบบความปลอดภัยครบ
            </span>
          </div>
        </div>

        <div className="text-5xl sm:text-6xl bg-white/15 p-5 rounded-3xl border border-white/20 backdrop-blur-md shrink-0 select-none shadow-inner relative z-10 hover:scale-105 transition">
          🛵💨
        </div>
      </div>

      {/* Ride Form & Route Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Selector & Vehicle Cards */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="text-emerald-600">🗺️</span> กำหนดการเดินทาง (Select Pick-up & Drop-off)
          </h3>

          {/* Pickup & Dropoff Inputs */}
          <div className="space-y-4 relative">
            {/* Connected Path Line Graphic */}
            <div className="absolute left-[13px] top-[38px] bottom-[38px] w-0.5 bg-gradient-to-b from-emerald-500 via-slate-300 to-rose-500 z-0"></div>

            {/* Pickup */}
            <div className="space-y-1.5 relative z-10 pl-7">
              <div className="absolute left-[-1.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-2 ring-emerald-200"></div>
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="font-extrabold text-slate-900">จุดรับผู้โดยสาร (Pick-up Point)</span>
                <button
                  type="button"
                  onClick={onOpenMapForPickup}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-extrabold cursor-pointer hover:underline"
                >
                  📍 ปักหมุดแผนที่ ม.อ. ✎
                </button>
              </label>
              <select
                value={ridePickup}
                onChange={(e) => setRidePickup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
              >
                {CAMPUS_HOTSPOTS.map((spot) => (
                  <option key={`pickup-${spot.name}`} value={`📍 ${spot.name}`}>
                    {spot.emoji} {spot.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Hotspot Chips */}
            <div className="pl-7 flex flex-wrap gap-1.5 py-1">
              <span className="text-[10px] text-slate-400 font-bold self-center mr-1">จุดด่วน:</span>
              {CAMPUS_HOTSPOTS.slice(0, 4).map((spot) => (
                <button
                  key={`chip-${spot.name}`}
                  type="button"
                  onClick={() => setRidePickup(`📍 ${spot.name}`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 rounded-lg text-[10.5px] font-bold border border-slate-200/70 transition cursor-pointer"
                >
                  {spot.emoji} {spot.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Dropoff */}
            <div className="space-y-1.5 relative z-10 pl-7 pt-2">
              <div className="absolute left-[-1.5px] top-3.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm ring-2 ring-rose-200"></div>
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="font-extrabold text-slate-900">จุดส่งปลายทาง (Drop-off Point)</span>
                <button
                  type="button"
                  onClick={onOpenMapForDropoff}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-extrabold cursor-pointer hover:underline"
                >
                  🏁 ปักหมุดแผนที่ ม.อ. ✎
                </button>
              </label>
              <select
                value={rideDropoff}
                onChange={(e) => setRideDropoff(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
              >
                {CAMPUS_HOTSPOTS.map((spot) => (
                  <option key={`dropoff-${spot.name}`} value={`📍 ${spot.name}`}>
                    {spot.emoji} {spot.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vehicle Selection Cards */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-extrabold text-slate-900 block">
              เลือกประเภทยานพาหนะ (Select Vehicle Type)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Motorbike */}
              <button
                type="button"
                onClick={() => setVehicleType('motorbike')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                  vehicleType === 'motorbike'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {vehicleType === 'motorbike' && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🏍️</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    ฿15
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">วินมอเตอร์ไซค์ ม.อ.</h4>
                  <p className="text-[10px] text-slate-500 font-medium">รวดเร็ว คล่องตัว (1 คน)</p>
                </div>
              </button>

              {/* Car */}
              <button
                type="button"
                onClick={() => setVehicleType('car')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                  vehicleType === 'car'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {vehicleType === 'car' && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🚗</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    ฿30
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">รถยนต์ EV ม.อ.</h4>
                  <p className="text-[10px] text-slate-500 font-medium">นั่งสบาย มีแอร์ (1-4 คน)</p>
                </div>
              </button>

              {/* Scooter */}
              <button
                type="button"
                onClick={() => setVehicleType('scooter')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                  vehicleType === 'scooter'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {vehicleType === 'scooter' && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-3xl">🛴</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    ฿12
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">สกู๊ตเตอร์ไฟฟ้า</h4>
                  <p className="text-[10px] text-slate-500 font-medium">สายชิว ประหยัดพลังงาน</p>
                </div>
              </button>
            </div>
          </div>

          {/* Passenger count & Rider note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900 block">จำนวนผู้โดยสาร</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPassengers(num)}
                    className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      passengers === num ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {num} คน
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900 block">ข้อความถึงคนขับ (ถ้ามี)</label>
              <input
                type="text"
                value={rideNote}
                onChange={(e) => setRideNote(e.target.value)}
                placeholder="เช่น รออยู่หน้าซุ้มตึกวิศวะ, ใส่หมวกกันน็อค L"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Fare Calculation & Booking CTA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <span>💳</span>
                <span>สรุปค่าเดินทาง (Fare Summary)</span>
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                คำนวณอัตโนมัติ
              </span>
            </h3>

            {/* Route Box Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-500 font-extrabold">🟢</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">จุดรับ</span>
                  <p className="font-extrabold text-slate-900">{ridePickup}</p>
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2.5 flex items-start gap-2.5">
                <span className="text-rose-500 font-extrabold">🔴</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">จุดส่ง</span>
                  <p className="font-extrabold text-slate-900">{rideDropoff}</p>
                </div>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-slate-700 block">คูปองส่วนลดค่าเดินทาง</label>
              {activePromo ? (
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs">
                  <span className="font-bold text-emerald-800">
                    🎉 ใช้โค้ด {activePromo.code} (ลด ฿{activePromo.discount_amount})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePromo(null)}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="กรอกโค้ดส่วนลด (เช่น WELCOME)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => onApplyPromoCode(promoCodeInput)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    ใช้โค้ด
                  </button>
                </div>
              )}
              {promoError && <p className="text-[11px] font-semibold text-red-500">{promoError}</p>}
            </div>

            {/* Receipt Breakdown */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>ค่าเดินทาง ({vehicleType === 'motorbike' ? 'วินมอเตอร์ไซค์' : vehicleType === 'car' ? 'รถยนต์ EV' : 'สกู๊ตเตอร์'})</span>
                <span className="font-bold text-slate-900">฿{baseFare}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>ส่วนลดโปรโมชัน ({activePromo.code})</span>
                  <span>-฿{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>ระยะเวลาเดินทางโดยประมาณ</span>
                <span className="font-bold text-slate-800">⏱️ ~3-5 นาที</span>
              </div>

              <div className="flex justify-between items-baseline border-t border-slate-200 pt-3 text-slate-900 font-extrabold text-base">
                <span>ราคารวมสุทธิ</span>
                <span className="text-3xl text-emerald-600 font-black">฿{finalFare}</span>
              </div>
            </div>

            {/* Book Ride Button */}
            <button
              type="button"
              disabled={isRideBooking}
              onClick={onPlaceRideOrder}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 transition duration-300 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isRideBooking ? (
                <span>กำลังค้นหาไรเดอร์...</span>
              ) : (
                <>
                  <span>🛵 เรียกไรเดอร์รับส่งทันที</span>
                  <span className="text-xs bg-white/25 px-2.5 py-0.5 rounded-full font-extrabold">
                    ฿{finalFare}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
