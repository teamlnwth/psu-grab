'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();
  
  // Custom states for interactive features
  const [activeTab, setActiveTab] = useState<'services' | 'history'>('services');
  const [jobs, setJobs] = useState([
    { id: 1, shop: 'ร้านก๋วยเตี๋ยวป้าแว่น', destination: 'หอพักนักศึกษา 11', price: 25, distance: '1.2 กม.' },
    { id: 2, shop: 'KFC บิ๊กซี เอ็กซ์ตร้า', destination: 'ตึกคณะวิศวกรรมศาสตร์ (ตึกแดง)', price: 40, distance: '3.5 กม.' },
    { id: 3, shop: 'ชาพะยอม หน้า ม.อ.', destination: 'ตึกฟักทอง คณะวิทยาศาสตร์', price: 20, distance: '0.8 กม.' },
  ]);
  const [wallet, setWallet] = useState(350);
  const [riderHistory, setRiderHistory] = useState([
    { id: 101, details: 'ข้าวผัดกระเพรา ร้านลุงดำ -> หอพัก 10', income: 30, time: 'วันนี้ 12:30 น.' },
    { id: 102, details: 'ส่งผู้โดยสาร หน้า ม.อ. -> ตึก LRC', income: 45, time: 'วันนี้ 11:15 น.' },
  ]);
  const [message, setMessage] = useState<string | null>(null);

  const handleAcceptJob = (jobId: number, price: number, shop: string) => {
    // Remove job from list
    setJobs(jobs.filter(j => j.id !== jobId));
    // Add income to wallet
    setWallet(prev => prev + price);
    // Add to history
    setRiderHistory(prev => [
      { 
        id: Date.now(), 
        details: `ส่งอาหารจาก ${shop} (สำเร็จ)`, 
        income: price, 
        time: 'เพิ่งเสร็จสิ้น' 
      },
      ...prev
    ]);
    
    setMessage(`รับงานสำเร็จ! คุณได้รับค่าส่ง ${price} บาท เรียบร้อยแล้ว`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleWithdraw = () => {
    if (wallet <= 0) {
      alert('ยอดเงินคงเหลือไม่เพียงพอสำหรับการถอน');
      return;
    }
    alert(`ระบบจำลอง: ทำการถอนเงินจำนวน ${wallet} บาท เข้าบัญชีธนาคารเรียบร้อยแล้ว!`);
    setWallet(0);
  };

  // Loading Screen
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-500">กำลังดาวน์โหลดข้อมูล PSU Grab...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-blue-600 flex items-center gap-1.5 hover:opacity-95 transition">
              PSU Grab <span className="text-xl">🛵</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800">{user.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    user.role === 'customer' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {user.role === 'customer' ? 'ลูกค้า' : 'คนขับ/ไรเดอร์'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition duration-300 cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition duration-300"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 hover:shadow-lg transition duration-300"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Toast Alert Message */}
      {message && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-emerald-500 animate-slide-up">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-sm">{message}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center">
        
        {/* CASE 1: NOT LOGGED IN (GUEST VIEW) */}
        {!user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                🚀 พัฒนาสำหรับวิทยาเขตหาดใหญ่และชาว ม.อ.
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 leading-tight">
                ความอร่อยและทุกการเดินทาง <br />
                <span className="text-blue-600">จัดการได้ในคลิกเดียว</span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg max-w-xl leading-relaxed">
                PSU Grab มอบบริการส่งอาหารจากร้านค้าภายในและรอบ ม.อ. รวมถึงระบบเรียกจักรยานยนต์รับส่งอย่างปลอดภัย รวดเร็ว และเป็นกันเองโดยนักศึกษาเพื่อนักศึกษา
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-center shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition duration-300"
                >
                  เริ่มต้นใช้งานเลย
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-2xl text-center shadow-sm hover:shadow hover:-translate-y-0.5 transition duration-300"
                >
                  สมัครเป็นพาร์ทเนอร์คนขับ
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 text-xl font-bold">🍔</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">สั่งอาหารเลย</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">ส่งตรงจากโรงช้าง หอพัก และย่านใกล้เคียง ม.อ.</p>
                  <Link href="/login" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                    สั่งเลย <span>→</span>
                  </Link>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex flex-col justify-between hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-500 text-xl font-bold">🛵</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">เรียกรถรับ-ส่ง</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">เดินทางสะดวก ไปเรียน/กลับหอ ปลอดภัย มีหมวกกันน็อค</p>
                  <Link href="/login" className="text-xs font-bold text-amber-500 hover:underline inline-flex items-center gap-1">
                    เรียกเลย <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: CUSTOMER DASHBOARD */}
        {user && user.role === 'customer' && (
          <div className="space-y-8 py-4">
            {/* Header Greeting */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                <svg width="250" height="250" viewBox="0 0 100 100" fill="none"><circle cx="70" cy="80" r="60" fill="white" /></svg>
              </div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-2xl md:text-3xl font-extrabold">สวัสดีคุณ {user.name} 👋</h2>
                <p className="text-blue-100 text-sm md:text-base">วันนี้อยากสั่งอาหารอร่อยๆ หรือจะเดินทางไปที่ไหนใน ม.อ. ดีครับ?</p>
              </div>
              <div className="relative z-10 flex gap-2">
                <button 
                  onClick={() => setActiveTab('services')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'services' ? 'bg-white text-blue-600 shadow' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
                  }`}
                >
                  บริการของเรา
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'history' ? 'bg-white text-blue-600 shadow' : 'bg-blue-500/30 text-white hover:bg-blue-500/50'
                  }`}
                >
                  ประวัติการสั่งซื้อ
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'services' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service 1: Food Order */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition duration-300">
                  <div className="w-24 h-24 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-4xl shrink-0">🍔</div>
                  <div className="text-center md:text-left space-y-2 flex-1">
                    <h3 className="text-xl font-bold text-slate-800">สั่งอาหารออนไลน์</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">ค้นหาร้านอาหารใกล้คุณ ไม่ว่าจะเป็นที่โรงช้าง หรือร้านหน้า ม.อ. ค่าส่งถูก เริ่มต้นเพียง 15 บาท</p>
                    <button 
                      onClick={() => alert('ฟังก์ชันสั่งอาหารกำลังอยู่ระหว่างพัฒนาสำหรับก้าวต่อไป!')}
                      className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      เลือกเมนูอาหาร
                    </button>
                  </div>
                </div>

                {/* Service 2: Ride Hailing */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg transition duration-300">
                  <div className="w-24 h-24 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-4xl shrink-0">🛵</div>
                  <div className="text-center md:text-left space-y-2 flex-1">
                    <h3 className="text-xl font-bold text-slate-800">เรียกรถรับ-ส่ง</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">เดินทางไปเรียนด่วน สอบ หรือไปจุดต่างๆ ในวิทยาเขตได้รวดเร็วทันใจ ปลอดภัยกับผู้ขับขี่ที่เชื่อถือได้</p>
                    <button 
                      onClick={() => alert('ฟังก์ชันเรียกรถรับ-ส่งกำลังอยู่ระหว่างพัฒนาสำหรับก้าวต่อไป!')}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      เรียกพี่วินทันที
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">ประวัติการทำรายการล่าสุด</h3>
                <div className="divide-y divide-slate-100">
                  <div className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">🍔</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">สั่งข้าวมันไก่เจ๊เจน (โรงช้าง)</p>
                        <p className="text-[11px] text-slate-400">17 กรกฎาคม 2026 • 12:45 น.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">฿55.00</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">เสร็จสิ้นแล้ว</span>
                    </div>
                  </div>

                  <div className="py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">🛵</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">เรียกจักรยานยนต์: ตึกวิศวะ (ตึกแดง) ไป หอ 11</p>
                        <p className="text-[11px] text-slate-400">16 กรกฎาคม 2026 • 16:30 น.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">฿25.00</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">เสร็จสิ้นแล้ว</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASE 3: RIDER DASHBOARD */}
        {user && user.role === 'rider' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
            {/* Left Column: Profile & Balance Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 text-center space-y-4">
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl">🛵</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                  <p className="text-xs text-slate-400">พาร์ทเนอร์ผู้ขับขี่ PSU Grab</p>
                </div>
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                  <p className="text-xs font-semibold text-slate-500 mb-1">ยอดเงินในกระเป๋า</p>
                  <p className="text-3xl font-black text-amber-600">฿{wallet.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleWithdraw}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-amber-100 hover:shadow-lg transition cursor-pointer"
                >
                  ถอนเงินเข้าบัญชี
                </button>
              </div>

              {/* Rider Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-4">สถิติวันนี้</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">รับงานสำเร็จ</p>
                    <p className="text-lg font-bold text-slate-800">{riderHistory.length} งาน</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">คะแนนรีวิว</p>
                    <p className="text-lg font-bold text-slate-800">4.9 ★</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Open Jobs & Job History */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Active Jobs Selection */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    📦 งานว่างในระบบ
                    {jobs.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        {jobs.length} ใหม่
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-slate-400">อัปเดตแบบเรียลไทม์</span>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3">😴</span>
                    <p className="text-sm font-bold text-slate-600">ไม่มีงานว่างในขณะนี้</p>
                    <p className="text-xs text-slate-400 mt-1">กรุณารอรับงานชิ้นใหม่ที่กำลังจะเข้ามา</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">สั่งซื้ออาหาร</span>
                            <span className="text-xs text-slate-400">ระยะทาง {job.distance}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">ต้นทาง: {job.shop}</h4>
                          <p className="text-xs text-slate-500">ปลายทาง: {job.destination}</p>
                        </div>
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] text-slate-400 font-semibold">ค่าตอบแทนรวม</p>
                            <p className="text-lg font-black text-amber-600">฿{job.price}</p>
                          </div>
                          <button
                            onClick={() => handleAcceptJob(job.id, job.price, job.shop)}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow shadow-amber-100 hover:shadow-md transition cursor-pointer"
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
              <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">ประวัติการขับขี่วันนี้</h3>
                <div className="divide-y divide-slate-100">
                  {riderHistory.map((historyItem) => (
                    <div key={historyItem.id} className="py-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{historyItem.details}</p>
                          <p className="text-[10px] text-slate-400">{historyItem.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+฿{historyItem.income}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 PSU Grab. พัฒนาขึ้นโดยความร่วมมือและเทคโนโลยีสมัยใหม่ สำหรับบุคลากรและนักศึกษา ม.อ. ทุกท่าน</p>
      </footer>
    </div>
  );
}