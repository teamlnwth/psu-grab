'use client';

import React, { useState, useEffect } from 'react';
import { PromoCode } from '../../types';

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoCodes: PromoCode[];
  activePromo: PromoCode | null;
  onSelectPromo: (promo: PromoCode) => void;
  onClearPromo: () => void;
  onApplyCode: (code: string) => Promise<void>;
  promoError: string | null;
  setPromoError: (err: string | null) => void;
}

export default function PromoModal({
  isOpen,
  onClose,
  promoCodes,
  activePromo,
  onSelectPromo,
  onClearPromo,
  onApplyCode,
  promoError,
  setPromoError,
}: PromoModalProps) {
  const [promoInput, setPromoInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPromoInput(activePromo ? activePromo.code : '');
      setPromoError(null);
    }
  }, [isOpen, activePromo, setPromoError]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!promoInput.trim()) return;
    await onApplyCode(promoInput.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-slide-up">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#F7F9FA]/50">
          <div className="space-y-0.5 text-left">
            <h3 className="text-sm font-black text-slate-800">เลือกคูปองส่วนลด</h3>
            <p className="text-[10px] text-slate-400 font-bold">Offers & Promos</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-350 text-slate-600 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Promo input row */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">
              กรอกรหัสโปรโมชันด้วยตนเอง
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setPromoError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-250 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition uppercase font-black text-slate-800"
                placeholder="ใส่รหัสส่วนลด เช่น FREE15"
              />
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-2xl transition cursor-pointer shadow-sm shadow-emerald-100/50"
              >
                ใช้งาน
              </button>
            </div>
            {promoError && (
              <p className="text-[10px] text-red-500 font-bold text-left">{promoError}</p>
            )}
            {activePromo && (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1 text-left">
                <span>✓</span> กำลังใช้คูปอง ลดเพิ่ม ฿{activePromo.discount_amount}
              </p>
            )}
          </div>

          {/* Coupons List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                คูปองส่วนลดที่ใช้ได้สำหรับคุณ
              </span>
              {activePromo && (
                <button
                  onClick={() => {
                    onClearPromo();
                    setPromoInput('');
                  }}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  ล้างการเลือก
                </button>
              )}
            </div>

            {promoCodes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                ไม่มีคูปองแนะนำในขณะนี้
              </div>
            ) : (
              <div className="space-y-3">
                {promoCodes.map((promo) => {
                  const isSelected = activePromo?.code === promo.code;
                  return (
                    <div
                      key={promo.code}
                      onClick={() => {
                        setPromoInput(promo.code);
                        onSelectPromo(promo);
                      }}
                      className={`relative bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-2xl border text-white transition-all duration-300 flex items-center min-h-[90px] cursor-pointer group text-left overflow-hidden ${
                        isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {/* Left Pane: Ticket Color Block */}
                      <div className="w-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex flex-col items-center justify-center text-white shrink-0 self-stretch select-none relative p-2">
                        <span className="text-xl font-black drop-shadow-sm group-hover:scale-110 transition duration-300">🎟️</span>
                        <span className="text-[8px] font-black tracking-widest uppercase bg-black/20 px-1.5 py-0.5 rounded-full mt-1 border border-white/20">
                          PROMO
                        </span>
                        {/* Dashed separator */}
                        <div className="absolute right-0 top-0 bottom-0 border-r-2 border-dashed border-white/30"></div>
                      </div>

                      {/* Ticket Circular Cutouts */}
                      <div className="absolute left-[72px] -top-2 w-4 h-4 bg-white rounded-full border-b border-slate-300 z-10"></div>
                      <div className="absolute left-[72px] -bottom-2 w-4 h-4 bg-white rounded-full border-t border-slate-300 z-10"></div>

                      {/* Right Pane: Coupon Details */}
                      <div className="flex-1 p-3.5 pl-5 text-left space-y-1 relative">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
                            {promo.code}
                          </span>
                          {isSelected && (
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded-full">
                              ✓ เลือกอยู่
                            </span>
                          )}
                        </div>
                        <h5 className="font-black text-base text-white">
                          ส่วนลด <span className="text-emerald-400">฿{promo.discount_amount}</span>
                        </h5>
                        <p className="text-[10.5px] text-slate-300 font-medium truncate max-w-[180px]">
                          {promo.description || 'ใช้ส่วนลดสำหรับบริการในวิทยาเขต ม.อ.'}
                        </p>
                      </div>

                      {/* Apply Checkbox */}
                      <div className="pr-4 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-500 text-white shadow-sm'
                              : 'border-slate-600 bg-slate-800/80 group-hover:border-emerald-400'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-[#F7F9FA]/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-2xl transition duration-300 shadow shadow-emerald-100/50 cursor-pointer text-center"
          >
            ตกลงเลือกใช้นี้
          </button>
        </div>
      </div>
    </div>
  );
}
