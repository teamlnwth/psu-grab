'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../app/supabase';
import { User, Product, Order } from '../../types';

const REST_EMOJIS = ['🍔', '🍕', '🍜', '🍛', '🍱', '🥗', '🥤', '🍵', '🍰', '🍨', '🍳', '🍗'];
const MART_EMOJIS = ['🥤', '🥛', '🍪', '🍫', '🍜', '🧴', '🧼', '🧻', '🔋', '🩹', '🧺', '🍎'];

interface MerchantDashboardProps {
  user: User;
}

export default function MerchantDashboard({ user }: MerchantDashboardProps) {
  const [message, setMessage] = useState<string | null>(null);

  // Merchant states
  const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [merchantOrders, setMerchantOrders] = useState<Order[]>([]);
  const [merchantRevenue, setMerchantRevenue] = useState<number>(0);
  const [selectedEmoji, setSelectedEmoji] = useState('🍔');

  useEffect(() => {
    if (user) {
      setSelectedEmoji(user.merchantType === 'restaurant' ? '🍔' : '🥤');
    }
  }, [user]);

  // Load and Subscribe data
  const fetchMerchantProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('merchant_id', user.id);
      if (error) throw error;
      setMerchantProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch merchant products', err);
    }
  };

  const fetchMerchantOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMerchantOrders(data || []);

      // Calculate revenue (excluding ฿15 delivery fee)
      const totalRev = (data || [])
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + (o.total_price - 15), 0);
      setMerchantRevenue(totalRev);
    } catch (err) {
      console.error('Failed to fetch merchant orders', err);
    }
  };

  useEffect(() => {
    fetchMerchantProducts();
    fetchMerchantOrders();

    const ordersChannel = supabase
      .channel('merchant-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchMerchantOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  // Handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;
    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price <= 0) {
      alert('ใส่ราคาให้ถูกต้องด้วยนะ');
      return;
    }

    const prodId = 'prod-' + Math.random().toString(36).substr(2, 9);
    const fullName = `${selectedEmoji} ${newProductName.trim()}`;
    try {
      const { error } = await supabase.from('products').insert([
        {
          id: prodId,
          merchant_id: user.id,
          name: fullName,
          price: price,
        },
      ]);

      if (error) throw error;

      setNewProductName('');
      setNewProductPrice('');
      setMessage(`เพิ่ม "${newProductName}" เข้าร้านแล้ว!`);
      fetchMerchantProducts();
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      alert(`เพิ่มสินค้าไม่ได้: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`ลบ "${name}" ออกจากรายการสินค้าหน้าร้านเลยนะ?`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      setMessage(`ลบ "${name}" แล้ว`);
      fetchMerchantProducts();
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      alert(`ลบไม่ได้: ${err.message}`);
    }
  };

  const handleMerchantUpdateStatus = async (
    orderId: string,
    nextStatus: 'preparing' | 'calling_rider' | 'delivering',
    items: string
  ) => {
    try {
      const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
      if (error) throw error;

      setMessage(
        nextStatus === 'preparing'
          ? `รับออเดอร์ "${items}" แล้ว`
          : `จัดเตรียมเสร็จสิ้น! ให้ไรเดอร์นำส่งต่อ 🛵💨`
      );
      fetchMerchantOrders();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่ได้: ${err.message}`);
    }
  };

  const handleWithdraw = () => {
    if (merchantRevenue <= 0) {
      alert('ยอดเงินไม่พอถอน');
      return;
    }
    alert(`ถอนเงิน ฿${merchantRevenue} เข้าบัญชีแล้ว!`);
    setMerchantRevenue(0);
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

      {/* Left Column: Store Profile & Add Product Form */}
      <div className="lg:col-span-4 space-y-6">
        {/* Store Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 bg-secondary-light text-secondary rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold border border-secondary/20 shadow-xs">
            {user.merchantType === 'restaurant' ? '🍔' : '🛒'}
          </div>
          <div>
            <span className="text-xs font-semibold text-secondary-dark bg-secondary-light px-3 py-1 rounded-full border border-secondary/20">
              {user.merchantType === 'restaurant' ? 'ร้านอาหารพาร์ทเนอร์' : 'มินิมาร์ทพาร์ทเนอร์'}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-3">{user.shopName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">ผู้จัดการร้าน: {user.name}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              รายได้การขายสะสม (ยอดโอนเข้าบัญชี)
            </span>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-2xl font-bold text-secondary">฿{merchantRevenue.toLocaleString()}</span>
              <button
                onClick={handleWithdraw}
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                ถอนเงินสด →
              </button>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span>➕</span> เพิ่มรายการ {user.merchantType === 'restaurant' ? 'เมนูอาหาร' : 'สินค้ามินิมาร์ท'}
          </h4>
          <form onSubmit={handleAddProduct} className="space-y-4 text-xs font-sans">
            {/* Emoji Selector */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-600">
                เลือกอิโมจิสินค้า
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                {(user.merchantType === 'restaurant' ? REST_EMOJIS : MART_EMOJIS).map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all cursor-pointer ${
                      selectedEmoji === emoji
                        ? 'bg-secondary text-white font-bold scale-105 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">ชื่อสินค้า / รายการเมนู</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder={
                  user.merchantType === 'restaurant'
                    ? 'เช่น ข้าวไข่เจียวทรงเครื่อง, นมชมพู'
                    : 'เช่น บะหมี่กึ่งสำเร็จรูป, น้ำมันพืช'
                }
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">ราคาจำหน่าย (บาท)</label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none bg-slate-50 text-xs transition"
                placeholder="เช่น 45"
                min="1"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer shadow-xs active:scale-95"
            >
              เพิ่มเข้าหน้าร้านพาร์ทเนอร์
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Menu List & Simulated Orders Feed */}
      <div className="lg:col-span-8 space-y-6">
        {/* Product List Manager */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-slate-805 pb-3 border-b border-slate-100 flex justify-between items-center uppercase tracking-wider">
            <span>📋 สินค้าในหน้าร้านทั้งหมด</span>
            <span className="text-[10px] font-black text-secondary bg-secondary-light border border-secondary/10 px-2.5 py-0.5 rounded-full">
              {merchantProducts.length} รายการ
            </span>
          </h3>

          {merchantProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">
              ไม่มีสินค้าในหน้าร้าน กรุณาเพิ่มรายการสินค้าใหม่ด้านซ้าย
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {merchantProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 border border-slate-200/50 bg-[#F7F9FA]/30 rounded-2xl flex justify-between items-center hover:bg-[#F7F9FA] transition duration-300 text-left group"
                >
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-black text-slate-700">{prod.name}</p>
                    <p className="text-xs font-black text-primary-dark">฿{prod.price}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(prod.id, prod.name)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-555 hover:text-red-700 rounded-lg transition text-[10.5px] font-black cursor-pointer active:scale-95 border border-red-150/20"
                    title="ลบสินค้านี้"
                  >
                    ลบออก
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Orders simulator */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
            🔔 คำสั่งซื้ออาหารและสินค้าเรียลไทม์ (Order Desk)
          </h3>

          <div className="space-y-3.5">
            {merchantOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center font-bold border border-dashed border-slate-200 rounded-2xl">ยังไม่มีคำสั่งซื้อส่งเข้ามาในขณะนี้</p>
            ) : (
              merchantOrders.map((ord) => (
                <div
                  key={ord.id}
                  className={`p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300 text-left ${
                    ord.status === 'completed'
                      ? 'border-slate-100 bg-[#F7F9FA]/20 opacity-70'
                      : 'border-secondary/20 bg-secondary-light/10'
                  }`}
                >
                  <div className="space-y-1.5 text-xs text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                        #00{ord.id.substr(-4)}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-bold">
                        📍 ปลายทาง: {ord.dest}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-850 pt-0.5">{ord.items}</h4>
                    <p className="text-[10.5px] text-slate-500">
                      ยอดสุทธิของร้าน: <b className="text-slate-800">฿{ord.total_price - 15}</b> • ลูกค้า:{' '}
                      <b className="text-slate-800">คุณ {ord.customer_name}</b> • ไรเดอร์:{' '}
                      <b className="text-primary-dark">คุณ {ord.rider_name || 'พาร์ทเนอร์'}</b>
                    </p>
                  </div>

                  {/* Interactive order steps */}
                  <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto text-right">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleMerchantUpdateStatus(ord.id, 'preparing', ord.items)}
                        className="w-full md:w-auto px-4.5 py-2.5 bg-secondary hover:bg-secondary-hover text-white text-xs font-black rounded-xl transition duration-300 cursor-pointer shadow shadow-secondary/10 btn-scale active:scale-95"
                      >
                        รับออเดอร์นี้
                      </button>
                    )}
                    {ord.status === 'preparing' && (
                      <button
                        onClick={() => handleMerchantUpdateStatus(ord.id, 'delivering', ord.items)}
                        className="w-full md:w-auto px-4.5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition duration-300 cursor-pointer shadow shadow-primary/10 btn-scale active:scale-95"
                      >
                        จัดเตรียมเสร็จสิ้น (ให้ไรเดอร์นำส่ง)
                      </button>
                    )}
                    {ord.status === 'delivering' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-secondary bg-secondary-light px-3 py-2.5 rounded-xl border border-secondary/10">
                        🏍️ ไรเดอร์ คุณ {ord.rider_name || 'พาร์ทเนอร์'} กำลังนำส่ง...
                      </span>
                    )}
                    {ord.status === 'completed' && (
                      <span className="text-xs font-black text-emerald-650 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/50 inline-block">
                        ✓ จัดส่งสำเร็จ ได้รับยอดขายแล้ว
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
