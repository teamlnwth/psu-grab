'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../app/supabase';
import { User, PromoCode } from '../../types';

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [message, setMessage] = useState<string | null>(null);

  // States
  const [merchants, setMerchants] = useState<User[]>([]);
  const [adminPromoCodes, setAdminPromoCodes] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');

  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantEmail, setNewMerchantEmail] = useState('');
  const [newMerchantPhone, setNewMerchantPhone] = useState('');
  const [newMerchantShopName, setNewMerchantShopName] = useState('');
  const [newMerchantType, setNewMerchantType] = useState<'restaurant' | 'minimart'>('restaurant');
  const [newMerchantPassword, setNewMerchantPassword] = useState('');
  const [merchantRatings, setMerchantRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Initial loads
  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'merchant');
      if (error) throw error;
      setMerchants(data || []);
    } catch (err: any) {
      console.error('Failed to fetch merchants:', err.message || err);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAdminPromoCodes(data || []);
    } catch (err: any) {
      console.error('Failed to fetch promo codes:', err.message || err);
    }
  };

  const fetchMerchantAverages = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('merchant_id, shop_rating')
        .not('shop_rating', 'is', null);
      if (error) throw error;

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      data?.forEach((o: any) => {
        if (!ratingsMap[o.merchant_id]) {
          ratingsMap[o.merchant_id] = { sum: 0, count: 0 };
        }
        ratingsMap[o.merchant_id].sum += o.shop_rating;
        ratingsMap[o.merchant_id].count += 1;
      });

      const averages: Record<string, { avg: number; count: number }> = {};
      Object.keys(ratingsMap).forEach((mid) => {
        averages[mid] = {
          avg: parseFloat((ratingsMap[mid].sum / ratingsMap[mid].count).toFixed(1)),
          count: ratingsMap[mid].count,
        };
      });
      setMerchantRatings(averages);
    } catch (err) {
      console.error('Failed to fetch merchant rating averages', err);
    }
  };

  useEffect(() => {
    fetchMerchants();
    fetchPromoCodes();
    fetchMerchantAverages();

    const ordersChannel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchMerchantAverages();
      })
      .subscribe();

    const promosChannel = supabase
      .channel('admin-promos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, (payload) => {
        fetchPromoCodes();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        fetchMerchants();
        fetchMerchantAverages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(promosChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  // Handlers
  const handleAdminAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMerchantName ||
      !newMerchantEmail ||
      !newMerchantPhone ||
      !newMerchantShopName ||
      !newMerchantPassword
    ) {
      alert('กรอกข้อมูลร้านค้าให้ครบก่อนนะ');
      return;
    }

    const merchantId = 'merch-' + Math.random().toString(36).substr(2, 9);
    try {
      const { error } = await supabase.from('profiles').insert([
        {
          id: merchantId,
          name: newMerchantName.trim(),
          email: newMerchantEmail.trim(),
          phone: newMerchantPhone.trim(),
          role: 'merchant',
          shop_name: newMerchantShopName.trim(),
          merchant_type: newMerchantType,
          password: newMerchantPassword,
          is_partner: true,
        },
      ]);

      if (error) throw error;

      // Seed initial products for the newly created merchant
      const initialProducts =
        newMerchantType === 'restaurant'
          ? [
              { id: `p1-${merchantId}`, merchant_id: merchantId, name: '🍔 ข้าวกะเพราไก่ไข่ดาว', price: 50 },
              { id: `p2-${merchantId}`, merchant_id: merchantId, name: '🍜 ข้าวผัดต้มยำทะเล', price: 65 },
              { id: `p3-${merchantId}`, merchant_id: merchantId, name: '🥤 ชาเขียวนมสด (โรงช้าง)', price: 30 },
            ]
          : [
              { id: `p1-${merchantId}`, merchant_id: merchantId, name: '🥤 น้ำดื่ม ม.อ. (ขวดใหญ่)', price: 12 },
              { id: `p2-${merchantId}`, merchant_id: merchantId, name: '🍜 บะหมี่กึ่งสำเร็จรูปรสต้มยำ', price: 15 },
              { id: `p3-${merchantId}`, merchant_id: merchantId, name: '🍪 ขนมขบเคี้ยวตราก๊อบกอบ', price: 20 },
            ];

      await supabase.from('products').insert(initialProducts);

      setMessage(`เพิ่มร้าน "${newMerchantShopName}" แล้ว!`);
      setNewMerchantName('');
      setNewMerchantEmail('');
      setNewMerchantPhone('');
      setNewMerchantShopName('');
      setNewMerchantPassword('');
      fetchMerchants();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`เพิ่มร้านไม่ได้: ${err.message}`);
    }
  };

  const handleAdminAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode || !newPromoDiscount) {
      alert('ใส่โค้ดกับจำนวนส่วนลดด้วย');
      return;
    }
    const discount = parseFloat(newPromoDiscount);
    if (isNaN(discount) || discount <= 0) {
      alert('ใส่ส่วนลดให้ถูกต้องด้วยนะ');
      return;
    }

    try {
      const { error } = await supabase.from('promo_codes').insert([
        {
          code: newPromoCode.trim().toUpperCase(),
          discount_amount: discount,
          description: newPromoDesc.trim() || null,
        },
      ]);

      if (error) throw error;

      setMessage(`สร้างโค้ด "${newPromoCode.toUpperCase()}" แล้ว!`);
      setNewPromoCode('');
      setNewPromoDiscount('');
      setNewPromoDesc('');
      fetchPromoCodes();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`สร้างโค้ดไม่ได้: ${err.message}`);
    }
  };

  const handleAdminDeletePromo = async (code: string) => {
    if (!confirm(`ลบโค้ด "${code}" เลยนะ?`)) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('code', code);
      if (error) throw error;

      setMessage(`ลบโค้ด "${code}" แล้ว`);
      fetchPromoCodes();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`ลบไม่ได้: ${err.message}`);
    }
  };

  const handleAdminTogglePartner = async (merchantId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase.from('profiles').update({ is_partner: newStatus }).eq('id', merchantId);
      if (error) throw error;

      setMessage(`อัปเดตสถานะร้านแล้ว!`);
      fetchMerchants();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่ได้: ${err.message}`);
    }
  };

  const handleAdminDeleteMerchant = async (merchantId: string, shopName: string) => {
    if (!confirm(`⚠️ ยืนยันลบร้าน "${shopName}" และบัญชีร้านค้านี้ออกจากระบบ?\n\nข้อมูลสินค้าและออเดอร์ที่เกี่ยวข้องจะถูกลบทั้งหมด`)) return;
    try {
      // ลบสินค้าของร้านค้า
      await supabase.from('products').delete().eq('merchant_id', merchantId);
      // ลบออเดอร์ที่เกี่ยวข้องกับร้านค้า
      await supabase.from('orders').delete().eq('merchant_id', merchantId);
      // ลบบัญชี profile ของร้านค้า
      const { error } = await supabase.from('profiles').delete().eq('id', merchantId);
      if (error) throw error;

      setMessage(`ลบร้าน "${shopName}" และบัญชีร้านค้าออกจากระบบแล้ว`);
      fetchMerchants();
      fetchMerchantAverages();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`ลบร้านค้าไม่ได้: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in text-left">
      {/* Floating alert */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-secondary text-white px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-secondary/20 animate-fade-in text-sm font-semibold max-w-md w-[90%] justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Left Column: Admin Profile & Add Merchant Partner */}
      <div className="lg:col-span-5 space-y-6">
        {/* Admin Profile Card */}
        <div className="bg-gradient-to-br from-secondary via-secondary-hover to-[#1e293b] rounded-3xl p-6 text-white shadow-md text-center space-y-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-8 -translate-y-8">
            <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="10" />
            </svg>
          </div>
          <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-white/20 relative z-10 shadow-inner">
            ⚙️
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black text-secondary-light bg-white/10 border border-white/15 px-3 py-1 rounded-full uppercase tracking-wider">
              แอดมินระบบ
            </span>
            <h3 className="text-xl font-black mt-3">{user.name}</h3>
            <p className="text-xs text-secondary-light/75 mt-1 font-semibold">อีเมลติดต่อ: {user.email}</p>
          </div>
        </div>

        {/* Add Merchant Partner Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5 uppercase tracking-wider text-left">
            🏢 <span>ลงทะเบียนร้านค้าพาร์ทเนอร์ใหม่</span>
          </h4>
          <form onSubmit={handleAdminAddMerchant} className="space-y-3.5 text-xs text-left font-sans">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                ชื่อร้านค้า (Shop Name)
              </label>
              <input
                type="text"
                value={newMerchantShopName}
                onChange={(e) => setNewMerchantShopName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition font-semibold"
                placeholder="เช่น ครัว ม.อ. หรือ พีเอสยู มาร์ท"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                  ชื่อผู้ดูแลร้านค้า
                </label>
                <input
                  type="text"
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                  placeholder="เช่น คุณสมชาย"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                  ประเภทธุรกิจ
                </label>
                <select
                  value={newMerchantType}
                  onChange={(e: any) => setNewMerchantType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition font-black cursor-pointer text-slate-700"
                >
                  <option value="restaurant">🍴 ร้านอาหาร</option>
                  <option value="minimart">🛍️ มินิมาร์ท</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                เบอร์โทรศัพท์มือถือ
              </label>
              <input
                type="tel"
                value={newMerchantPhone}
                onChange={(e) => setNewMerchantPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition font-semibold"
                placeholder="เช่น 0812345678"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                อีเมลล็อกอิน (Email)
              </label>
              <input
                type="email"
                value={newMerchantEmail}
                onChange={(e) => setNewMerchantEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder="เช่น shop@gmail.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                รหัสผ่านเข้าระบบ
              </label>
              <input
                type="password"
                value={newMerchantPassword}
                onChange={(e) => setNewMerchantPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder="ใส่รหัสผ่าน 6 ตัวขึ้นไป"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-secondary hover:bg-secondary-hover text-white text-xs font-black rounded-xl transition duration-300 shadow cursor-pointer text-center active:scale-95 btn-scale"
            >
              ลงทะเบียนร้านค้าพาร์ทเนอร์ใหม่
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Manage Promos & Merchants */}
      <div className="lg:col-span-7 space-y-6">
        {/* Create and list Promo Codes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
            🎟️ <span>สร้างคูปองส่วนลดใหม่ (Add Coupons)</span>
          </h4>
          <form onSubmit={handleAdminAddPromo} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-left font-sans">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                รหัสคูปอง
              </label>
              <input
                type="text"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50 text-xs transition font-black uppercase text-slate-700"
                placeholder="เช่น PSUNEW"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                ส่วนลด (บาท)
              </label>
              <input
                type="number"
                value={newPromoDiscount}
                onChange={(e) => setNewPromoDiscount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder="เช่น 50"
                min="1"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wide">
                คำอธิบายสิทธิ์
              </label>
              <input
                type="text"
                value={newPromoDesc}
                onChange={(e) => setNewPromoDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder="เช่น สำหรับลูกค้าใหม่"
              />
            </div>
            <div className="md:col-span-3 text-right">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition duration-300 shadow cursor-pointer active:scale-95 btn-scale"
              >
                สร้างคูปองจัดโปรโมชัน
              </button>
            </div>
          </form>

          {/* List of active Promo Codes */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">
              รายการคูปองส่วนลดที่มีในระบบ:
            </h5>
            {adminPromoCodes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ไม่มีคูปองจัดโปรโมชันในระบบ</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {adminPromoCodes.map((promo) => (
                  <div key={promo.code} className="py-3 flex justify-between items-center text-xs">
                    <div className="text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-700 bg-primary-light border border-primary/20 px-2 py-0.5 rounded text-[9.5px] uppercase">
                          {promo.code}
                        </span>
                        <span className="font-extrabold text-primary-dark">ลด ฿{promo.discount_amount}</span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 font-bold">{promo.description || 'ส่วนลดซื้อของในวิทยาเขต ม.อ.'}</p>
                    </div>
                    <button
                      onClick={() => handleAdminDeletePromo(promo.code)}
                      className="px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer active:scale-95"
                    >
                      ลบคูปอง
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Registered Stores list */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center uppercase tracking-wider">
            <span>🏬 ร้านค้าในระบบพาร์ทเนอร์ทั้งหมด</span>
            <span className="text-[10px] font-black text-secondary bg-secondary-light border border-secondary/10 px-2.5 py-0.5 rounded-full">
              {merchants.length} ร้าน
            </span>
          </h3>

          {merchants.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">ยังไม่มีร้านค้าในระบบตอนนี้</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {merchants.map((shop) => (
                <div key={shop.id} className="py-3.5 flex justify-between items-center text-xs text-left">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">{shop.shop_name}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider border ${
                          shop.merchant_type === 'restaurant'
                            ? 'bg-indigo-50 text-indigo-650 border-indigo-200/60'
                            : 'bg-amber-50 text-amber-600 border-amber-250/60'
                        }`}
                      >
                        {shop.merchant_type === 'restaurant' ? 'ร้านอาหาร' : 'มินิมาร์ท'}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black border ${
                          shop.is_partner
                            ? 'bg-primary-light text-primary-dark border-primary/20'
                            : 'bg-rose-50 text-rose-600 border-rose-250/60'
                        }`}
                      >
                        {shop.is_partner ? '✓ แนะนำเด่น' : 'ร้านปกติ'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-450 font-bold leading-relaxed">
                      อีเมลล็อกอิน: <b>{shop.email}</b> • โทร: <b>{shop.phone}</b> • ผู้จัดการ:{' '}
                      <b>คุณ {shop.name}</b> • เรตติ้งร้าน:{' '}
                      <span className="text-amber-500">
                        ★ {merchantRatings[shop.id]?.avg || '5.0'} ({merchantRatings[shop.id]?.count || 0})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAdminTogglePartner(shop.id, !!shop.is_partner)}
                      className={`px-3 py-2 text-[10px] font-black rounded-lg transition duration-200 cursor-pointer border ${
                        shop.is_partner
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                          : 'bg-primary-light hover:bg-primary-light/80 text-primary-dark border-primary/20'
                      }`}
                    >
                      {shop.is_partner ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นร้านแนะนำ'}
                    </button>
                    <button
                      onClick={() => handleAdminDeleteMerchant(shop.id, shop.shop_name || shop.name)}
                      className="px-3 py-2 text-[10px] font-black rounded-lg transition duration-200 cursor-pointer border bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      title="ลบร้านค้าและบัญชี"
                    >
                      🗑️ ลบร้านค้า
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
