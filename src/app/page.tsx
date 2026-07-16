'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();
  
  // Simulated State for Interactive Features
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'ride' | 'express'>('all');
  const [wallet, setWallet] = useState(350);
  const [message, setMessage] = useState<string | null>(null);
  
  // Mock food stores for Customer to order from
  const mockStores = [
    { id: 1, name: 'ข้าวมันไก่โกต๊อบ (โรงช้าง)', rating: '4.8 ★', time: '15-20 นาที', distance: '0.8 กม.', image: '🍗', category: 'food' },
    { id: 2, name: 'เครปยักษ์หน้า ม.อ.', rating: '4.7 ★', time: '10-15 นาที', distance: '1.2 กม.', image: '🥞', category: 'food' },
    { id: 3, name: 'ชานมไข่มุกตึกฟักทอง', rating: '4.9 ★', time: '5-10 นาที', distance: '0.2 กม.', image: '🧋', category: 'food' },
  ];

  // Mock open jobs for Rider to accept
  const [jobs, setJobs] = useState([
    { id: 1, type: 'food', title: 'ข้าวมันไก่โกต๊อบ -> หอพัก 11', price: 25, distance: '1.2 กม.', time: '10 นาที' },
    { id: 2, type: 'ride', title: 'ตึกวิศวกรรมศาสตร์ -> หน้า ม.อ.', price: 35, distance: '2.4 กม.', time: '15 นาที' },
    { id: 3, type: 'express', title: 'ส่งเอกสารด่วน: ตึก LRC -> คณะวิทย์', price: 20, distance: '0.6 กม.', time: '5 นาที' },
  ]);

  const [riderHistory, setRiderHistory] = useState([
    { id: 101, title: 'ส่งข้าวผัดกระเพราไข่ดาว', income: 30, time: '12:30 น.' },
    { id: 102, title: 'รับส่งนักศึกษา ตึกแดง -> หอ 9', income: 25, time: '11:15 น.' },
  ]);

  const handleOrderFood = (storeName: string) => {
    setMessage(`สั่งซื้อจาก "${storeName}" สำเร็จ! ไรเดอร์กำลังเตรียมรับงานของคุณ 🛵`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleBookRide = (destination: string) => {
    setMessage(`กำลังเรียกคนขับมารับคุณเพื่อเดินทางไปยัง "${destination}"... 🛵`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleAcceptJob = (jobId: number, price: number, title: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
    setWallet(prev => prev + price);
    setRiderHistory(prev => [
      { id: Date.now(), title: `สำเร็จ: ${title}`, income: price, time: 'เมื่อครู่นี้' },
      ...prev
    ]);
    setMessage(`รับงาน "${title}" สำเร็จ! ได้รับเงินโอนเข้ากระเป๋า ฿${price}`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleWithdraw = () => {
    if (wallet <= 0) {
      alert('ยอดเงินในกระเป๋าของคุณไม่เพียงพอสำหรับการถอน');
      return;
    }
    alert(`ระบบทำการโอนเงิน ฿${wallet} เข้าบัญชีธนาคารของคุณสำเร็จแล้ว!`);
    setWallet(0);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-500">กำลังโหลด PSU Grab...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tight flex items-center gap-2 hover:opacity-90 transition">
              PSU Grab <span className="text-xl">🛵</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800">{user.name}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                    user.role === 'customer' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {user.role === 'customer' ? 'ลูกค้า' : 'คนขับ / ไรเดอร์'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition duration-300 cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition duration-300"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 hover:shadow-lg transition duration-300"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Notifications */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-blue-500 animate-fade-in text-sm font-semibold max-w-md w-[90%] justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">

        {/* CASE 1: GUEST VIEW (NOT LOGGED IN) */}
        {!user && (
          <div className="space-y-10 py-4 animate-fade-in">
            {/* Grab Style Banner Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-8">
              {/* Decorative circle grids to simulate Grab app's abstract branding */}
              <div className="absolute right-0 top-0 opacity-15 pointer-events-none translate-x-20 -translate-y-20">
                <svg width="400" height="400" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" /></svg>
              </div>
              <div className="absolute left-1/3 bottom-0 opacity-10 pointer-events-none translate-y-16">
                <svg width="200" height="200" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="white" /></svg>
              </div>

              <div className="relative z-10 space-y-5 lg:max-w-xl text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/10">
                  📍 พัฒนาขึ้นเฉพาะชาว ม.อ. วิทยาเขตหาดใหญ่
                </span>
                <h1 className="text-3xl md:text-5xl font-black leading-tight">
                  สั่งอาหารก็ง่าย <br className="hidden md:inline" />
                  เดินทางก็สบายกับ <span className="underline decoration-wavy decoration-yellow-400">PSU Grab</span>
                </h1>
                <p className="text-blue-100 text-sm md:text-base font-medium leading-relaxed">
                  ครบจบในเว็บเดียว ทั้งบริการส่งอาหารจากโรงช้างและรอบๆ ม.อ. และระบบเรียกรถมอเตอร์ไซค์ด่วน สะดวก รวดเร็ว สบายกระเป๋าสำหรับคนในวิทยาเขต
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-white hover:bg-slate-50 text-blue-600 font-extrabold rounded-2xl text-center shadow-lg transition hover:-translate-y-0.5 duration-300"
                  >
                    เริ่มต้นใช้งาน
                  </Link>
                  <Link
                    href="/register"
                    className="px-8 py-4 bg-blue-500/30 hover:bg-blue-500/50 text-white font-extrabold rounded-2xl text-center border border-white/20 transition hover:-translate-y-0.5 duration-300"
                  >
                    สมัครเป็นคนขับ/ไรเดอร์
                  </Link>
                </div>
              </div>

              {/* Grab app mock view block */}
              <div className="relative z-10 w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100/50 self-stretch flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">บริการยอดนิยม</span>
                    <span className="text-[11px] font-semibold text-slate-400">เข้าสู่ระบบเพื่อใช้งาน</span>
                  </div>
                  {/* Mock search input */}
                  <div className="bg-slate-100 p-3 rounded-2xl flex items-center gap-2 text-slate-400 text-xs border border-slate-200/50">
                    <span>🔍</span>
                    <span>ค้นหาร้านอาหาร หรือจุดรับส่งใน ม.อ.</span>
                  </div>
                </div>

                {/* 4-Item Quick Grid */}
                <div className="grid grid-cols-4 gap-3 my-6">
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🍔</div>
                    <span className="text-[11px] font-bold text-slate-600">ส่งอาหาร</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🛵</div>
                    <span className="text-[11px] font-bold text-slate-600">เรียกรถ</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">📦</div>
                    <span className="text-[11px] font-bold text-slate-600">ส่งของ</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🛒</div>
                    <span className="text-[11px] font-bold text-slate-600">มาร์ท</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-semibold">มีรหัสนักศึกษาลดค่าส่งเพิ่ม!</span>
                  <Link href="/login" className="text-xs font-bold text-blue-600 hover:underline">คลิกล็อกอิน →</Link>
                </div>
              </div>
            </div>

            {/* Promo slider */}
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                🔥 โปรโมชันสุดคุ้มประจำวิทยาเขต
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                <div className="min-w-[280px] md:min-w-[320px] bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-md flex-1">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-blue-100">สำหรับลูกค้ารายใหม่</p>
                  <h3 className="text-lg font-black mt-1 mb-2">ลด 50% ต้อนรับชาว ม.อ.</h3>
                  <p className="text-xs text-blue-100 mb-4">ใส่โค้ด: <span className="font-bold bg-white/20 px-2 py-0.5 rounded-lg text-white">PSUNEW50</span></p>
                  <span className="text-[10px] bg-white text-blue-600 px-3 py-1 rounded-full font-bold">ใช้ได้ทันที</span>
                </div>
                <div className="min-w-[280px] md:min-w-[320px] bg-gradient-to-r from-cyan-500 to-blue-600 p-6 rounded-3xl text-white shadow-md flex-1">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-blue-100">โปรขวัญใจหอพัก</p>
                  <h3 className="text-lg font-black mt-1 mb-2">ส่งฟรีทั่วทุกหอใน</h3>
                  <p className="text-xs text-blue-100 mb-4">ค่าบริการส่งฟรีเมื่อมียอดครบ ฿120 ขึ้นไป</p>
                  <span className="text-[10px] bg-white text-blue-600 px-3 py-1 rounded-full font-bold">คุ้มตลอดวัน</span>
                </div>
                <div className="min-w-[280px] md:min-w-[320px] bg-gradient-to-r from-blue-600 to-indigo-800 p-6 rounded-3xl text-white shadow-md flex-1">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-blue-100">สิทธิพิเศษไรเดอร์</p>
                  <h3 className="text-lg font-black mt-1 mb-2">รับส่วนแบ่ง 90% เต็ม</h3>
                  <p className="text-xs text-blue-100 mb-4">สมัครไรเดอร์ไม่มีค่าคอมมิชชันแอบแฝง</p>
                  <span className="text-[10px] bg-white text-blue-600 px-3 py-1 rounded-full font-bold">สมัครเลย</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: CUSTOMER DASHBOARD */}
        {user && user.role === 'customer' && (
          <div className="space-y-8 py-2 animate-fade-in">
            {/* Soft Header Profile */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">ยินดีต้อนรับกลับ</span>
                <h2 className="text-2xl font-black text-slate-800 mt-2">สวัสดีคุณ {user.name} 👋</h2>
                <p className="text-xs text-slate-400">รหัสนักศึกษา/อีเมลผู้ใช้: {user.studentId || user.email}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                    activeCategory === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setActiveCategory('food')}
                  className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all ${
                    activeCategory === 'food' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🍔 สั่งอาหาร
                </button>
              </div>
            </div>

            {/* Quick Actions Grid for Customer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Booking & Ordering Area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Quick Booking Ride Card (GrabBike style) */}
                {(activeCategory === 'all') && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <span>🛵</span> เรียกรถรับ-ส่งทันที (GrabRide)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ระบุพิกัดปลายทางที่ต้องการไปใน ม.อ. เพื่อเรียกรถมอเตอร์ไซค์จากนักศึกษาพาร์ทเนอร์ของเราได้อย่างรวดเร็ว
                    </p>
                    
                    {/* Mock Destinations */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => handleBookRide('ตึกฟักทอง คณะวิทยาศาสตร์')}
                        className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-left border border-slate-100 hover:border-blue-100 transition duration-300 font-bold text-xs flex flex-col justify-between h-20 cursor-pointer"
                      >
                        <span>ตึกฟักทอง คณะวิทย์</span>
                        <span className="text-[10px] font-semibold text-slate-400">ใช้บ่อย 📍</span>
                      </button>
                      <button
                        onClick={() => handleBookRide('สำนักทรัพยากรการเรียนรู้ (ตึก LRC)')}
                        className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-left border border-slate-100 hover:border-blue-100 transition duration-300 font-bold text-xs flex flex-col justify-between h-20 cursor-pointer"
                      >
                        <span>ตึก LRC (หอสมุด)</span>
                        <span className="text-[10px] font-semibold text-slate-400">ใช้บ่อย 📍</span>
                      </button>
                      <button
                        onClick={() => handleBookRide('โรงช้าง (ศูนย์อาหาร ม.อ.)')}
                        className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-2xl text-left border border-slate-100 hover:border-blue-100 transition duration-300 font-bold text-xs flex flex-col justify-between h-20 cursor-pointer"
                      >
                        <span>โรงช้าง ม.อ.</span>
                        <span className="text-[10px] font-semibold text-slate-400">เดินทาง 📍</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Restaurants Section (GrabFood style) */}
                {(activeCategory === 'all' || activeCategory === 'food') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800">
                      🍔 สั่งอาหารจากร้านเด่นใน ม.อ. (GrabFood)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {mockStores.map((store) => (
                        <div key={store.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold">{store.image}</div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 leading-tight">{store.name}</h4>
                              <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1 font-semibold">
                                <span className="text-amber-500">{store.rating}</span>
                                <span>•</span>
                                <span>{store.time}</span>
                                <span>•</span>
                                <span>{store.distance}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOrderFood(store.name)}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition cursor-pointer"
                          >
                            สั่งซื้อทันที
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Sidebar Info (Order History & Promo Info) */}
              <div className="space-y-6">
                {/* Active promotion voucher display */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md space-y-4">
                  <h4 className="text-sm font-bold tracking-wider uppercase text-blue-100">โปรโมชันพิเศษเฉพาะคุณ</h4>
                  <div className="border-t border-white/10 pt-3">
                    <h3 className="text-base font-extrabold">โค้ดลดค่าส่งพิเศษ ฿15</h3>
                    <p className="text-xs text-blue-100 mt-1">ใช้โค้ดลดทันทีไม่มีขั้นต่ำสำหรับหอใน ม.อ.</p>
                    <div className="bg-white/15 border border-white/10 rounded-xl p-2.5 mt-3 text-center text-xs font-bold font-mono tracking-wider">
                      PSURIDE15
                    </div>
                  </div>
                </div>

                {/* History widget */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">ประวัติการเดินทาง / สั่งซื้อ</h4>
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-3 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-700">สั่งข้าวมันไก่โกต๊อบ (โรงช้าง)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">วันนี้ 12:45 น. • GrabFood</p>
                      </div>
                      <span className="font-bold text-emerald-600">สำเร็จแล้ว</span>
                    </div>
                    <div className="py-3 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-700">เรียกมอเตอร์ไซค์ ตึกแดง -&gt; หอ 11</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">เมื่อวาน 16:30 น. • GrabRide</p>
                      </div>
                      <span className="font-bold text-emerald-600">สำเร็จแล้ว</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CASE 3: RIDER DASHBOARD */}
        {user && user.role === 'rider' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in">
            {/* Left Column: Driver Wallet & Stats */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center space-y-5">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">🛵</div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{user.name}</h3>
                  <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                    พาร์ทเนอร์คนขับ PSU Grab
                  </p>
                </div>
                
                {/* Grab Wallet Style */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายได้คงเหลือ (กระเป๋าเงิน)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black text-blue-600">฿{wallet.toLocaleString()}</span>
                    <button
                      onClick={handleWithdraw}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ถอนเงิน →
                    </button>
                  </div>
                </div>
              </div>

              {/* Today statistics */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">ผลงานในวันนี้ของคุณ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">รับงานสำเร็จ</p>
                    <p className="text-lg font-bold text-slate-800">{riderHistory.length} งาน</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">เรทผู้ขับขี่</p>
                    <p className="text-lg font-bold text-slate-800">4.9 ★</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Open jobs in system */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Job Feed */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <span>📦</span> งานที่พร้อมรับบริการใน ม.อ.
                    {jobs.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        {jobs.length} งานใหม่
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">อัปเดตอัตโนมัติ</span>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-4xl">😴</span>
                    <p className="text-sm font-bold text-slate-600">ไม่มีงานว่างอยู่ในขณะนี้</p>
                    <p className="text-xs text-slate-400">เรากำลังสแกนหาคำสั่งซื้อใหม่ๆ จากชาว ม.อ.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="p-5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              job.type === 'food' 
                                ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                : job.type === 'ride' 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-purple-50 text-purple-600 border border-purple-100'
                            }`}>
                              {job.type === 'food' ? 'ส่งอาหาร' : job.type === 'ride' ? 'เรียกรถ' : 'ส่งของด่วน'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{job.distance} ({job.time})</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{job.title}</h4>
                        </div>
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <div className="text-left md:text-right">
                            <span className="text-[9px] text-slate-400 font-semibold block">คุณจะได้รับ</span>
                            <span className="text-lg font-black text-blue-600">฿{job.price}</span>
                          </div>
                          <button
                            onClick={() => handleAcceptJob(job.id, job.price, job.title)}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer"
                          >
                            กดรับงานนี้
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">ประวัติการทำงานวันนี้ของคุณ</h3>
                <div className="divide-y divide-slate-100">
                  {riderHistory.map((historyItem) => (
                    <div key={historyItem.id} className="py-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                        <div>
                          <p className="font-bold text-slate-700">{historyItem.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">วันนี้ • {historyItem.time}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-blue-600">+฿{historyItem.income}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-16 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 PSU Grab. พัฒนาขึ้นโดยใช้เทคโนโลยีความพรีเมียมเฉพาะตัวและแอนิเมชันสำหรับชาว ม.อ.</p>
      </footer>
    </div>
  );
}