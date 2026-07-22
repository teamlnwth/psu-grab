'use client';

import React, { useState, useEffect } from 'react';

interface CustomerFoodViewProps {
  user: { name: string };
  deliveryDest: string;
  onOpenMapModal: () => void;
  activeCategory: 'all' | 'food';
  setActiveCategory: (cat: 'all' | 'food') => void;
  merchants: any[];
  filteredMerchants: any[];
  selectedMerchant: any | null;
  onSelectMerchant: (merchant: any) => void;
  onDeselectMerchant: () => void;
  selectedMerchantProducts: any[];
  cart: { id: string; name: string; price: number; quantity: number }[];
  onAddToCart: (product: any) => void;
  onRemoveFromCart: (productId: string) => void;
  onPlaceOrder: () => void;
  promoCodeInput: string;
  setPromoCodeInput: (val: string) => void;
  activePromo: any;
  setActivePromo: (promo: any) => void;
  promoError: string | null;
  onApplyPromoCode: (code: string) => void;
  setIsPromoModalOpen: (open: boolean) => void;
  adminPromoCodes: any[];
  merchantRatings: Record<string, { avg: number; count: number }>;
  selectedMerchantReviews: any[];
  merchantReviewsTab: 'menu' | 'reviews';
  setMerchantReviewsTab: (tab: 'menu' | 'reviews') => void;
}

export default function CustomerFoodView({
  user,
  deliveryDest,
  onOpenMapModal,
  activeCategory,
  setActiveCategory,
  merchants,
  filteredMerchants,
  selectedMerchant,
  onSelectMerchant,
  onDeselectMerchant,
  selectedMerchantProducts,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onPlaceOrder,
  promoCodeInput,
  setPromoCodeInput,
  activePromo,
  setActivePromo,
  promoError,
  onApplyPromoCode,
  setIsPromoModalOpen,
  adminPromoCodes,
  merchantRatings,
  selectedMerchantReviews,
  merchantReviewsTab,
  setMerchantReviewsTab,
}: CustomerFoodViewProps) {
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = activePromo ? activePromo.discount_amount : 0;
  const deliveryFee = 15;
  const cartTotal = Math.max(0, cartSubtotal - discount) + (cart.length > 0 ? deliveryFee : 0);

  const recommendedMerchants = merchants.filter((m) => m.is_partner === true);

  // Recommended carousel index
  const [carouselIndex, setCarouselIndex] = useState(0);

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans">
      {/* Hero Welcome & Campus Location Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              ม.อ. หาดใหญ่ Express 🍔
            </span>
            <span className="text-xs font-semibold text-slate-500">
              สวัสดีคุณ <b className="text-slate-900">{user.name}</b> 👋
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            สั่งอาหารและมินิมาร์ท ส่งตรงถึงหอพัก/ตึกเรียน
          </h1>
          {/* Location Bar */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={onOpenMapModal}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-emerald-50/60 hover:bg-emerald-100/60 px-3.5 py-2 rounded-xl border border-emerald-200/60 transition cursor-pointer active:scale-95"
            >
              <span className="text-emerald-600 text-sm">📍</span>
              <span>
                {deliveryDest ? `จัดส่งที่: ${deliveryDest}` : 'เลือกจุดปักหมุดรับสินค้าในวิทยาเขต ม.อ.'}
              </span>
              <span className="text-xs text-emerald-600 font-extrabold ml-1">เปลี่ยนตำแหน่ง ✎</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('food')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'food'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🍴 ร้านอาหาร
          </button>
        </div>
      </div>

      {/* Campus Promo Codes Section */}
      {adminPromoCodes.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-rose-500 text-lg">🎟️</span> คูปองส่วนลดและข้อเสนอพิเศษวันนี้ (Offers & Promos)
            </h3>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              มี {adminPromoCodes.length} ข้อเสนอแนะนำ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminPromoCodes.map((promo) => {
              const isSelected = activePromo?.code === promo.code;
              return (
                <div
                  key={promo.code}
                  onClick={() => {
                    setPromoCodeInput(promo.code);
                    onApplyPromoCode(promo.code);
                  }}
                  className={`relative bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 rounded-2xl border text-white transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 group overflow-hidden flex min-h-[96px] ${
                    isSelected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* Left Ticket Color Pillar */}
                  <div className="w-24 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex flex-col items-center justify-center shrink-0 text-white relative select-none p-2">
                    <span className="text-2xl font-black drop-shadow-sm group-hover:scale-110 transition duration-300">🎟️</span>
                    <span className="text-[9px] font-black tracking-widest uppercase bg-black/20 px-2 py-0.5 rounded-full mt-1 border border-white/20">
                      DISCOUNT
                    </span>
                    <div className="absolute right-0 top-0 bottom-0 border-r-2 border-dashed border-white/30"></div>
                  </div>

                  {/* Punch Cutouts */}
                  <div className="absolute left-[88px] -top-2 w-4 h-4 bg-white rounded-full border-b border-slate-300 z-20"></div>
                  <div className="absolute left-[88px] -bottom-2 w-4 h-4 bg-white rounded-full border-t border-slate-300 z-20"></div>

                  {/* Right Content Body */}
                  <div className="flex-1 p-4 pl-5 flex justify-between items-center gap-3 relative z-10 text-left">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md">
                          {promo.code}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            ✓ กำลังใช้งาน
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-black text-white pt-0.5">
                        ส่วนลด <span className="text-emerald-400 font-black">฿{promo.discount_amount}</span>
                      </h4>
                      <p className="text-xs text-slate-300 font-medium truncate max-w-[200px]">
                        {promo.description || 'ใช้ส่วนลดได้กับทุกออเดอร์ใน ม.อ.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`px-4 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition duration-200 cursor-pointer active:scale-95 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white group-hover:scale-105'
                      }`}
                    >
                      {isSelected ? 'เลือกแล้ว ✓' : 'ใช้คูปองนี้'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Shops Section (ร้านเด็ดต้องลอง) */}
      {recommendedMerchants.length > 0 && !selectedMerchant && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-amber-200/80 space-y-4 text-left relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-amber-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="text-amber-500 text-lg">⭐</span> ร้านเด็ดต้องลอง (Recommended Shops)
            </h3>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60">
              ร้านพาร์ทเนอร์แนะนำ ({recommendedMerchants.length} ร้าน)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendedMerchants.map((merchant) => {
              const ratingInfo = merchantRatings[merchant.id] || { avg: 5.0, count: 0 };
              return (
                <div
                  key={`rec-${merchant.id}`}
                  onClick={() => onSelectMerchant(merchant)}
                  className="bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 rounded-3xl p-5 border border-amber-300/80 shadow-sm hover:shadow-md hover:border-amber-400 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group text-left relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold border border-amber-200 group-hover:scale-105 transition">
                        {merchant.merchant_type === 'restaurant' ? '🍳' : '🛍️'}
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                        ร้านเด็ด ⭐
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition">
                        {merchant.shop_name || merchant.name}
                      </h4>
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
                        <span className="text-amber-500 font-bold">★ {ratingInfo.avg}</span>
                        <span>({ratingInfo.count} รีวิว)</span>
                        <span>•</span>
                        <span>ส่งด่วน ~15-20 นาที</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-100 flex justify-between items-center text-xs font-bold text-amber-700">
                    <span>เลือกระบุเมนูอาหาร</span>
                    <span className="group-hover:translate-x-1 transition font-black">เลือกเมนู →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Merchants vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Merchants List or Selected Merchant Menu */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedMerchant ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  ร้านค้าในวิทยาเขตทั้งหมด ({filteredMerchants.length} ร้าน)
                </h3>
              </div>

              {filteredMerchants.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
                  <span className="text-4xl">🏪</span>
                  <p className="text-sm font-semibold text-slate-500">ไม่พบร้านค้าในหมวดหมู่นี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMerchants.map((merchant) => {
                    const ratingInfo = merchantRatings[merchant.id] || { avg: 5.0, count: 0 };
                    return (
                      <div
                        key={merchant.id}
                        onClick={() => onSelectMerchant(merchant)}
                        className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group text-left"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-2xl font-bold border border-emerald-200/60 group-hover:scale-105 transition">
                              {merchant.merchant_type === 'restaurant' ? '🍳' : '🛍️'}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                              {merchant.merchant_type === 'restaurant' ? 'ร้านอาหาร' : 'มินิมาร์ท'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
                              {merchant.shop_name || merchant.name}
                            </h4>
                            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-medium">
                              <span className="text-amber-500 font-bold">★ {ratingInfo.avg}</span>
                              <span>({ratingInfo.count} รีวิว)</span>
                              <span>•</span>
                              <span>ส่งด่วน ~15-20 นาที</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-emerald-600">
                          <span>เลือกระบุเมนูอาหาร</span>
                          <span className="group-hover:translate-x-1 transition font-black">เลือกเมนู →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Selected Merchant Product Menu Panel */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 animate-fade-in">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <button
                  type="button"
                  onClick={onDeselectMerchant}
                  className="text-xs font-extrabold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 transition cursor-pointer"
                >
                  ← ย้อนกลับไปเลือกร้านอื่น
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {selectedMerchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                </span>
              </div>

              {/* Merchant Title Banner */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-bold shrink-0">
                  {selectedMerchant.merchant_type === 'restaurant' ? '🍳' : '🛍️'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedMerchant.shop_name || selectedMerchant.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    เบอร์ติดต่อ: {selectedMerchant.phone} • การส่งด่วนถึงที่พักในวิทยาเขต ม.อ.
                  </p>
                </div>
              </div>

              {/* Menu Tabs: Products vs Reviews */}
              <div className="flex border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMerchantReviewsTab('menu')}
                  className={`pb-3 px-4 transition ${
                    merchantReviewsTab === 'menu'
                      ? 'border-b-2 border-emerald-500 text-emerald-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🍽️ รายการเมนูอาหาร/สินค้า ({selectedMerchantProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMerchantReviewsTab('reviews')}
                  className={`pb-3 px-4 transition ${
                    merchantReviewsTab === 'reviews'
                      ? 'border-b-2 border-emerald-500 text-emerald-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⭐ รีวิวจากลูกค้า ({selectedMerchantReviews.length})
                </button>
              </div>

              {/* Menu Items List */}
              {merchantReviewsTab === 'menu' ? (
                selectedMerchantProducts.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400 font-semibold">ยังไม่มีรายการสินค้าในร้านนี้</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {selectedMerchantProducts.map((product) => (
                      <div key={product.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex justify-between items-center gap-3 transition">
                        <div className="space-y-1 min-w-0 text-left">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                          <span className="text-xs font-black text-emerald-600 block">฿{product.price}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl transition shadow cursor-pointer active:scale-95 shrink-0"
                        >
                          + สั่งซื้อ
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                selectedMerchantReviews.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400 font-semibold">ยังไม่มีรีวิวสำหรับร้านนี้</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {selectedMerchantReviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">คุณ {rev.customer_name}</span>
                          <span className="text-amber-500 font-bold">★ {rev.shop_rating} / 5</span>
                        </div>
                        {rev.shop_review && <p className="text-slate-600 font-medium">{rev.shop_review}</p>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Right Column: Cart & Checkout Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <span>🛒</span>
                <span>ตะกร้าสินค้าของคุณ</span>
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                {cart.reduce((s, i) => s + i.quantity, 0)} รายการ
              </span>
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-slate-400">
                <span className="text-4xl block">🛍️</span>
                <p className="text-xs font-bold text-slate-600">ยังไม่มีสินค้าในตะกร้า</p>
                <p className="text-[11px] text-slate-400 font-medium">เลือกร้านค้าเพื่อเริ่มสั่งซื้ออาหารหรือมินิมาร์ท</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected items */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="space-y-0.5 text-left min-w-0 pr-2">
                        <p className="font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">฿{item.price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900">฿{item.price * item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          className="w-6 h-6 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo box */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {activePromo ? (
                    <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs">
                      <span className="font-bold text-emerald-800">
                        🎉 ส่วนลด {activePromo.code} (-฿{activePromo.discount_amount})
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
                        placeholder="กรอกโค้ดส่วนลด"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => onApplyPromoCode(promoCodeInput)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        ใช้
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-[11px] font-semibold text-red-500">{promoError}</p>}
                </div>

                {/* Delivery location input for order */}
                <div className="space-y-1 pt-2 border-t border-slate-100 text-left">
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    ระบุปลายทางรับของใน ม.อ. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryDest}
                    onChange={() => onOpenMapModal()}
                    placeholder="เช่น หอ 11 ห้อง 420 หรือ ตึกวิศวะชั้น 2"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                    readOnly
                  />
                </div>

                {/* Receipt breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>ค่าสินค้า</span>
                    <span className="font-bold text-slate-800">฿{cartSubtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>ส่วนลด</span>
                      <span>-฿{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ค่าจัดส่ง (ไรเดอร์ ม.อ.)</span>
                    <span className="font-bold text-slate-800">฿{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-extrabold text-base">
                    <span>ยอดสุทธิ</span>
                    <span className="text-2xl text-emerald-600 font-black">฿{cartTotal}</span>
                  </div>
                </div>

                {/* Checkout button */}
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold rounded-2xl shadow-md shadow-emerald-500/20 transition duration-300 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>ยืนยันการสั่งซื้ออาหาร/ของชำ</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">฿{cartTotal}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
