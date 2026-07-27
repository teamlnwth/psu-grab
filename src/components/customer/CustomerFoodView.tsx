'use client';

import React, { useState } from 'react';

interface CustomerFoodViewProps {
  user: { name: string; email?: string };
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = activePromo ? activePromo.discount_amount : 0;
  const deliveryFee = 15;
  const cartTotal = Math.max(0, cartSubtotal - discount) + (cart.length > 0 ? deliveryFee : 0);

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: '🍽️', color: 'bg-emerald-100/80 text-emerald-800' },
    { id: 'fastfood', name: 'Fast Food', icon: '🍟', color: 'bg-amber-100/80 text-amber-800' },
    { id: 'rice', name: 'Rice Item', icon: '🍚', color: 'bg-rose-100/80 text-rose-800' },
    { id: 'seafood', name: 'Sea Food', icon: '🦞', color: 'bg-[#FF2B6D]/10 text-[#FF2B6D]' },
    { id: 'crispy', name: 'Crispy Stix', icon: '🍢', color: 'bg-purple-100/80 text-purple-800' },
    { id: 'drinks', name: 'Beverages', icon: '🧋', color: 'bg-blue-100/80 text-blue-800' },
    { id: 'salads', name: 'Salads', icon: '🥗', color: 'bg-teal-100/80 text-teal-800' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans pb-24">
      {/* Top Mobile/Desktop Header matching Image 2 */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* User Profile & Location Picker */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF2B6D] to-rose-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-rose-500/20 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 cursor-pointer" onClick={onOpenMapModal}>
              <span className="text-[11px] font-bold text-slate-400">Location</span>
              <span className="text-xs text-[#FF2B6D] font-black">▼</span>
            </div>
            <h2
              onClick={onOpenMapModal}
              className="text-sm font-extrabold text-slate-900 cursor-pointer hover:text-[#FF2B6D] transition flex items-center gap-1.5 line-clamp-1"
            >
              <span>{deliveryDest || 'ม.อ. หาดใหญ่ (เลือกจุดส่ง)'}</span>
              <span className="text-xs text-slate-400">✏️</span>
            </h2>
          </div>
        </div>

        {/* Search Input & Action Icons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food, restaurant..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF2B6D] focus:bg-white transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsPromoModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-[#FF2B6D] flex items-center justify-center text-base font-bold shadow-xs hover:bg-rose-100 transition shrink-0 cursor-pointer"
            title="ดูคูปองส่วนลด"
          >
            🎟️
          </button>
        </div>
      </div>

      {/* Hero Offer Banner Carousel matching Image 2 */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-rose-950 rounded-[32px] p-6 sm:p-8 text-white shadow-xl overflow-hidden flex justify-between items-center border border-slate-800">
        {/* Background Visual Flares */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#FF2B6D]/20 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="space-y-3 relative z-10 max-w-md text-left">
          <span className="inline-block px-3 py-1 bg-[#FF2B6D] text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
            Special Promo
          </span>
          <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
            Up to <span className="text-[#FF2B6D]">35% offer</span> <br />
            Enjoy our PSU Campus deals every day
          </h2>
          <p className="text-xs font-medium text-slate-300">
            สั่งอาหารและมินิมาร์ทส่งตรงถึงหอพัก/ตึกเรียน จัดส่งด่วนโดยไรเดอร์นักศึกษา ม.อ.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsPromoModalOpen(true)}
              className="px-6 py-3 bg-[#FF2B6D] hover:bg-rose-600 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-rose-500/30 transition active:scale-95 cursor-pointer"
            >
              Shop Now →
            </button>
          </div>
        </div>

        {/* Hero Food Visual Image */}
        <div className="hidden sm:flex shrink-0 relative z-10 w-40 h-40 bg-white/10 backdrop-blur-md rounded-3xl p-3 items-center justify-center text-7xl border border-white/15 shadow-2xl">
          🍔🍗
        </div>
      </div>

      {/* Circular Categories Section matching Image 2 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-black text-slate-900">Categories</h3>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className="text-xs font-extrabold text-[#FF2B6D] hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex flex-col items-center gap-2 shrink-0 transition-all cursor-pointer group ${
                  isSelected ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xs border ${
                    isSelected
                      ? 'bg-[#FF2B6D] text-white border-[#FF2B6D] shadow-md shadow-rose-500/25 ring-4 ring-rose-500/20'
                      : `${cat.color} border-transparent group-hover:border-slate-300`
                  }`}
                >
                  {cat.icon}
                </div>
                <span className={`text-xs font-extrabold ${isSelected ? 'text-[#FF2B6D]' : 'text-slate-700'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Restaurants & Food Items Grid vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Items / Restaurants List */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedMerchant ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-base font-black text-slate-900">
                  Popular Items & Restaurants ({filteredMerchants.length})
                </h3>
                <span className="text-xs font-bold text-slate-400">PSU Hat Yai Campus</span>
              </div>

              {filteredMerchants.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
                  <span className="text-4xl">🏪</span>
                  <p className="text-sm font-bold text-slate-600">ไม่พบร้านค้าในหมวดหมู่นี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMerchants.map((merchant) => {
                    const ratingInfo = merchantRatings[merchant.id] || { avg: 4.8, count: 250 };
                    return (
                      <div
                        key={merchant.id}
                        onClick={() => onSelectMerchant(merchant)}
                        className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group text-left relative overflow-hidden"
                      >
                        <div className="space-y-3">
                          {/* Image Thumbnail Block */}
                          <div className="h-36 w-full rounded-2xl bg-gradient-to-br from-slate-100 to-rose-50 flex items-center justify-center text-5xl relative overflow-hidden border border-slate-100 group-hover:scale-[1.02] transition duration-300">
                            {merchant.merchant_type === 'restaurant' ? '🍱' : '🛒'}
                            <span className="absolute top-2.5 right-2.5 text-[10px] font-black text-[#FF2B6D] bg-white px-2.5 py-1 rounded-full shadow-sm border border-rose-100">
                              ⏱️ 10-15 mins
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                              <span className="text-amber-500 font-extrabold">⭐ {ratingInfo.avg}</span>
                              <span>({ratingInfo.count}+ reviews)</span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 group-hover:text-[#FF2B6D] transition pt-1">
                              {merchant.shop_name || merchant.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium">
                              {merchant.merchant_type === 'restaurant' ? 'อาหารตามสั่ง & กับข้าว' : 'มินิมาร์ทของชำ'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-black text-[#FF2B6D]">
                          <span>เลือกระบุเมนูอาหาร</span>
                          <span className="group-hover:translate-x-1 transition">Order Now →</span>
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
                  className="text-xs font-extrabold text-slate-500 hover:text-[#FF2B6D] flex items-center gap-1.5 transition cursor-pointer"
                >
                  ← ย้อนกลับไปเลือกร้านอื่น
                </button>
                <span className="text-xs font-bold text-[#FF2B6D] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {selectedMerchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                </span>
              </div>

              {/* Merchant Title Banner */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-[#FF2B6D] flex items-center justify-center text-3xl font-bold shrink-0">
                  {selectedMerchant.merchant_type === 'restaurant' ? '🍳' : '🛍️'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedMerchant.shop_name || selectedMerchant.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    ส่งด่วนถึงหอพัก/ตึกเรียนในวิทยาเขต ม.อ. ~10-15 นาที
                  </p>
                </div>
              </div>

              {/* Menu Items Grid matching Image 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {selectedMerchantProducts.map((product) => {
                  const cartItem = cart.find((item) => item.id === product.id);
                  return (
                    <div
                      key={product.id}
                      className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3 text-left"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-3xl flex items-center justify-center shrink-0">
                          🍲
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{product.name}</h4>
                          <span className="text-sm font-black text-[#FF2B6D] block">฿{product.price}</span>
                        </div>
                      </div>

                      {/* Quantity Controls (- 1 +) matching Image 2 */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">ราคา/ชิ้น</span>
                        <div className="flex items-center gap-2">
                          {cartItem ? (
                            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(product.id)}
                                className="w-6 h-6 rounded-lg bg-white text-rose-600 font-black text-xs shadow-xs hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                              >
                                −
                              </button>
                              <span className="text-xs font-black text-slate-800">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onAddToCart(product)}
                                className="w-6 h-6 rounded-lg bg-[#FF2B6D] text-white font-black text-xs shadow-xs hover:bg-rose-600 flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onAddToCart(product)}
                              className="px-3 py-1.5 bg-[#FF2B6D] hover:bg-rose-600 text-white text-xs font-black rounded-xl transition shadow cursor-pointer active:scale-95"
                            >
                              + สั่งซื้อ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cart & Checkout Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5 sticky top-24">
            <h3 className="text-base font-black text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <span>🛒</span>
                <span>My Cart</span>
              </span>
              <span className="text-xs font-extrabold text-[#FF2B6D] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-slate-400">
                <span className="text-4xl block">🛍️</span>
                <p className="text-xs font-bold text-slate-600">ยังไม่มีสินค้าในตะกร้า</p>
                <p className="text-[11px] text-slate-400 font-medium">เลือกร้านค้าเพื่อเริ่มสั่งอาหารหรือมินิมาร์ท</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Items */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
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

                {/* Delivery Location Selector Button */}
                <div className="space-y-1 pt-2 border-t border-slate-100 text-left">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    จุดส่งในวิทยาเขต ม.อ.
                  </label>
                  <button
                    type="button"
                    onClick={onOpenMapModal}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">📍 {deliveryDest || 'คลิกปักหมุดจุดส่งบนแผนที่'}</span>
                    <span className="text-[11px] text-emerald-600 shrink-0 font-black">เปลี่ยน ✎</span>
                  </button>
                </div>

                {/* Receipt Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">฿{cartSubtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Promo Discount</span>
                      <span>-฿{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-slate-800">฿{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900 font-black text-base">
                    <span>Total</span>
                    <span className="text-2xl text-[#FF2B6D] font-black">฿{cartTotal}</span>
                  </div>
                </div>

                {/* Checkout Button matching Image 2 */}
                <button
                  type="button"
                  onClick={onPlaceOrder}
                  className="w-full py-4 bg-[#FF2B6D] hover:bg-rose-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-rose-500/25 transition duration-300 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Checkout Order</span>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">฿{cartTotal}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Navigation Bar matching Image 2 */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-slate-200/80 z-40 flex items-center gap-8 sm:hidden">
        <button type="button" onClick={() => setActiveCategory('all')} className="flex flex-col items-center text-slate-600 hover:text-[#FF2B6D]">
          <span className="text-xl">🏠</span>
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button type="button" onClick={() => setActiveCategory('food')} className="flex flex-col items-center text-slate-600 hover:text-[#FF2B6D]">
          <span className="text-xl">🏪</span>
          <span className="text-[9px] font-bold">Shops</span>
        </button>

        {/* Center Floating Pink Action Button */}
        <button
          type="button"
          onClick={onOpenMapModal}
          className="w-12 h-12 -mt-7 rounded-full bg-gradient-to-tr from-[#FF2B6D] to-rose-500 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-500/40 border-4 border-white active:scale-90 transition cursor-pointer"
        >
          🛵
        </button>

        <button type="button" onClick={() => setIsPromoModalOpen(true)} className="flex flex-col items-center text-slate-600 hover:text-[#FF2B6D]">
          <span className="text-xl">🎟️</span>
          <span className="text-[9px] font-bold">Promos</span>
        </button>

        <button type="button" onClick={() => onOpenMapModal()} className="flex flex-col items-center text-slate-600 hover:text-[#FF2B6D]">
          <span className="text-xl">📍</span>
          <span className="text-[9px] font-bold">Map</span>
        </button>
      </div>
    </div>
  );
}
