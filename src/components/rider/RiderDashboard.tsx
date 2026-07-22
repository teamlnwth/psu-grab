'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../app/supabase';
import { User, Order } from '../../types';

interface RiderDashboardProps {
  user: User;
}

export default function RiderDashboard({ user }: RiderDashboardProps) {
  const [message, setMessage] = useState<string | null>(null);

  // States
  const [riderJobs, setRiderJobs] = useState<Order[]>([]);
  const [riderHistory, setRiderHistory] = useState<Order[]>([]);
  const [riderEarnings, setRiderEarnings] = useState<number>(0);
  const [riderRating, setRiderRating] = useState<number>(5);
  const [riderRatingCount, setRiderRatingCount] = useState<number>(0);
  const [jobCategoryFilter, setJobCategoryFilter] = useState<'all' | 'food' | 'ride'>('all');

  // Load initial data
  const fetchRiderJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or('status.eq.finding_rider,status.eq.pending,status.eq.preparing,status.eq.delivering')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Filter: jobs with no rider or delivery assigned to current rider
      const filtered = (data || []).filter((o: any) => !o.rider_id || o.rider_id === user.id);
      setRiderJobs(filtered);
    } catch (err) {
      console.error('Failed to fetch rider jobs', err);
    }
  }, [user.id]);

  const fetchRiderHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('rider_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRiderHistory(data || []);

      // Calculate earnings: ฿15 delivery fee per completed order
      setRiderEarnings((data || []).length * 15);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  }, [user.id]);

  const fetchRiderRating = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('rider_rating')
        .eq('rider_id', user.id)
        .not('rider_rating', 'is', null);
      if (error) throw error;

      if (data && data.length > 0) {
        const sum = data.reduce((s: number, o: any) => s + o.rider_rating, 0);
        setRiderRating(parseFloat((sum / data.length).toFixed(1)));
        setRiderRatingCount(data.length);
      } else {
        setRiderRating(5.0);
        setRiderRatingCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch rating', err);
    }
  }, [user.id]);

  useEffect(() => {
    fetchRiderJobs();
    fetchRiderHistory();
    fetchRiderRating();

    const ordersChannel = supabase
      .channel('rider-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchRiderJobs();
        fetchRiderHistory();
        fetchRiderRating();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchRiderJobs, fetchRiderHistory, fetchRiderRating]);

  // Handlers
  const handleAcceptJob = async (orderId: string, items: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          rider_id: user.id,
          rider_name: user.name,
          status: 'pending',
        })
        .eq('id', orderId);

      if (error) throw error;

      setMessage(`รับออเดอร์ "${items}" สำเร็จ! ส่งรายการสินค้าให้ร้านค้าเรียบร้อยแล้ว 🛵🍳`);
      fetchRiderJobs();
      fetchRiderHistory();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`กดรับงานไม่ได้: ${err.message}`);
    }
  };

  const handleAcceptRideJob = async (job: Order) => {
    try {
      const vehiclePlate = 'ม.อ. ' + Math.floor(1000 + Math.random() * 9000);
      const { error } = await supabase
        .from('orders')
        .update({
          rider_id: user.id,
          rider_name: user.name,
          vehicle_plate: vehiclePlate,
          status: 'delivering',
        })
        .eq('id', job.id);

      if (error) throw error;

      setMessage(`ตอบรับงานรับส่งผู้โดยสารสำเร็จ! กำลังมุ่งหน้าไปรับคุณ ${job.customer_name} 🛵💨`);
      fetchRiderJobs();
      fetchRiderHistory();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`รับงานเรียกรถไม่สำเร็จ: ${err.message}`);
    }
  };

  const handleCompleteJob = async (orderId: string, items: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;

      setMessage(`ส่งออเดอร์ "${items}" เรียบร้อยแล้ว! ได้รับค่าบริการ ฿15 💸`);
      fetchRiderJobs();
      fetchRiderHistory();
      fetchRiderRating();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่สำเร็จ: ${err.message}`);
    }
  };

  const handleWithdrawEarnings = () => {
    if (riderEarnings <= 0) {
      alert('ยอดเงินในกระเป๋าไม่พอที่จะถอนเงิน');
      return;
    }
    alert(`โอนเงินสด ฿${riderEarnings} เข้าบัญชีธนาคารพร้อมเพย์ของคุณแล้ว! 💸`);
    setRiderEarnings(0);
  };

  // Divide jobs: current active delivery vs other requests
  const activeJob = riderJobs.find((o) => o.rider_id === user.id && o.status !== 'completed');
  const availableRequests = riderJobs.filter((o) => !o.rider_id && o.status === 'finding_rider');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in text-left">
      {/* Floating alert */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-primary/20 animate-fade-in text-sm font-semibold max-w-md w-[90%] justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Left Column: Rider profile & Earnings */}
      <div className="lg:col-span-4 space-y-6">
        {/* Rider profile info */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 text-center space-y-4">
          <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold border border-primary/20 shadow-xs">
            🏍️
          </div>
          <div>
            <span className="text-xs font-semibold text-primary-dark bg-primary-light px-3 py-1 rounded-full border border-primary/20">
              ไรเดอร์นักศึกษา ม.อ.
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-3">{user.name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">เบอร์ติดต่อไรเดอร์: {user.phone}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left">
              <span className="text-xs font-semibold text-slate-500 block">
                ดาวเฉลี่ย
              </span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                ⭐ {riderRating} <span className="text-xs text-slate-400">({riderRatingCount})</span>
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left">
              <span className="text-xs font-semibold text-slate-500 block">
                งานที่ส่งสำเร็จ
              </span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                {riderHistory.length} เที่ยว
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              กระเป๋าเงินไรเดอร์ (ค่ารอบส่ง)
            </span>
            <div className="flex justify-between items-baseline mt-1.5">
              <span className="text-2xl font-bold text-primary-dark">฿{riderEarnings.toLocaleString()}</span>
              <button
                onClick={handleWithdrawEarnings}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                ถอนเงินสด →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Active Jobs & Available orders */}
      <div className="lg:col-span-8 space-y-6">
        {/* Case 1: Active Assigned Job */}
        {activeJob && (
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-primary/30 space-y-4 animate-slide-up text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span>{activeJob.order_type === 'ride' ? '🛵 งานรับส่งผู้โดยสารที่กำลังดำเนินการ' : '🍔 งานจัดส่งสินค้าที่กำลังดำเนินการ'}</span>
              </h3>
              <span className="text-xs font-bold text-primary-dark bg-primary-light px-3 py-1 rounded-full border border-primary/20">
                ค่าบริการ ฿{activeJob.total_price}
              </span>
            </div>

            {/* Status indicator banner */}
            <div className="p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border bg-emerald-50 text-emerald-800 border-emerald-200">
              <span>
                {activeJob.order_type === 'ride'
                  ? '🛵 ตอบรับงานเรียกรถเรียบร้อย! กำลังมุ่งหน้าไปรับผู้โดยสารที่จุดรับ'
                  : activeJob.status === 'pending'
                  ? '⏳ รับงานสำเร็จแล้ว! ส่งออเดอร์ให้ร้านค้าเรียบร้อย'
                  : activeJob.status === 'preparing'
                  ? '🍳 ร้านค้ากำลังจัดเตรียมสินค้า...'
                  : '✅ ไรเดอร์กำลังนำส่งสินค้าถึงที่หมาย'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs space-y-3">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">หมายเลขออเดอร์</span>
                <span className="text-slate-800">#00{activeJob.id.substr(-4)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">{activeJob.order_type === 'ride' ? 'บริการเดินทาง' : 'รายการสั่งซื้อ'}</span>
                <span className="text-slate-805 text-right max-w-[220px] truncate">{activeJob.items}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200/50 pt-2 text-slate-805">
                <span>ค่าโดยสารสุทธิจากลูกค้า</span>
                <span className="text-primary-dark font-extrabold text-sm">฿{activeJob.total_price}</span>
              </div>
            </div>

            {/* Delivery Locations */}
            <div className="space-y-4 pt-2">
              <div className="flex gap-3 relative text-xs">
                <div className="absolute left-3.5 top-6 bottom-0 w-0.5 -translate-x-1/2 bg-slate-200"></div>
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 z-10 text-xs font-bold">
                  {activeJob.order_type === 'ride' ? '📍' : '🏪'}
                </div>
                <div className="space-y-0.5 pt-0.5 text-left">
                  <h5 className="font-black text-slate-700">{activeJob.order_type === 'ride' ? 'จุดรับผู้โดยสาร (Pick-up)' : 'จุดรับสินค้า (ร้านค้า)'}</h5>
                  <p className="text-[11px] text-slate-700 font-bold">{activeJob.order_type === 'ride' ? (activeJob.pickup_dest || 'จุดรับในวิทยาเขต') : activeJob.merchant_name}</p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200 z-10 text-xs font-bold">
                  🏁
                </div>
                <div className="space-y-0.5 pt-0.5 text-left">
                  <h5 className="font-black text-slate-700">{activeJob.order_type === 'ride' ? 'จุดส่งปลายทาง (Drop-off)' : 'จุดส่งสินค้า (ลูกค้า)'}</h5>
                  <p className="text-[11px] text-slate-700 font-bold">{activeJob.dest}</p>
                  <p className="text-[9.5px] text-slate-400">ผู้โดยสาร/ลูกค้า: <b>คุณ {activeJob.customer_name}</b></p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              <a
                href="tel:0800000000"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`โทรหาคุณ ${activeJob.customer_name} (เบอร์จำลอง 📞)`);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition duration-200 cursor-pointer text-center active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200"
              >
                📞 ติดต่อผู้โดยสาร/ลูกค้า
              </a>
              <button
                onClick={() => handleCompleteJob(activeJob.id, activeJob.items)}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition duration-300 shadow cursor-pointer text-center active:scale-95 btn-scale"
              >
                {activeJob.order_type === 'ride' ? 'ส่งถึงจุดหมายปลายทางแล้ว ✓' : 'จัดส่งสินค้าถึงที่หมายแล้ว ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Case 2: Available Delivery & Ride Jobs Board */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-805 uppercase tracking-wider flex items-center gap-2">
              <span>📋 บอร์ดรับงานด่วน ม.อ. (Job Board)</span>
              <span className="text-[10px] font-black text-primary bg-primary-light border border-primary/10 px-2.5 py-0.5 rounded-full">
                มีงานว่าง {availableRequests.length} งาน
              </span>
            </h3>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setJobCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  jobCategoryFilter === 'all' ? 'bg-white shadow-xs text-primary' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setJobCategoryFilter('food')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  jobCategoryFilter === 'food' ? 'bg-white shadow-xs text-primary' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🍔 งานส่งอาหาร
              </button>
              <button
                type="button"
                onClick={() => setJobCategoryFilter('ride')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  jobCategoryFilter === 'ride' ? 'bg-white shadow-xs text-primary' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛵 งานเรียกรถ
              </button>
            </div>
          </div>

          {activeJob ? (
            <p className="text-xs text-slate-400 py-8 text-center font-bold bg-slate-50 rounded-2xl border border-slate-100">
              คุณมีงานที่ยังนำส่งไม่เสร็จ! กรุณาจัดการงานปัจจุบันด้านบนให้เสร็จสิ้นก่อนรับงานใหม่
            </p>
          ) : (() => {
            const filtered = availableRequests.filter((j) => {
              if (jobCategoryFilter === 'food') return j.order_type !== 'ride';
              if (jobCategoryFilter === 'ride') return j.order_type === 'ride';
              return true;
            });

            if (filtered.length === 0) {
              return (
                <p className="text-xs text-slate-400 py-8 text-center font-bold border border-dashed border-slate-200 rounded-2xl">
                  ยังไม่มีงานว่างในหมวดหมู่นี้ในบอร์ดตอนนี้... 🛵
                </p>
              );
            }

            return (
              <div className="space-y-4">
                {filtered.map((job) => {
                  const isRide = job.order_type === 'ride';
                  return (
                    <div
                      key={job.id}
                      className={`rounded-2xl border p-5 transition duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left shadow-sm hover:shadow ${
                        isRide ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400' : 'bg-white border-slate-200 hover:border-primary/30'
                      }`}
                    >
                      <div className="space-y-2 text-xs flex-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            #00{job.id.substr(-4)}
                          </span>
                          <span className={`text-[10.5px] font-black px-2.5 py-0.5 rounded border ${
                            isRide ? 'text-emerald-800 bg-emerald-100 border-emerald-200' : 'text-primary-dark bg-primary-light border-primary/20'
                          }`}>
                            {isRide ? '🛵 งานรับส่งผู้โดยสาร' : '🍔 งานส่งอาหาร'}
                          </span>
                          <span className="text-[10.5px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            ค่าบริการ ฿{job.total_price}
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-slate-850 pt-0.5">{job.items}</h4>

                        <div className="space-y-1 text-slate-600">
                          {isRide ? (
                            <>
                              <p>📍 จุดรับผู้โดยสาร: <b className="text-slate-800">{job.pickup_dest || 'จุดรับในวิทยาเขต'}</b></p>
                              <p>🏁 จุดส่งปลายทาง: <b className="text-slate-800">{job.dest}</b></p>
                              <p className="text-[10.5px]">ผู้โดยสาร: <b className="text-slate-800">คุณ {job.customer_name}</b></p>
                            </>
                          ) : (
                            <>
                              <p>🏪 ร้านรับของ: <b className="text-slate-750">{job.merchant_name}</b></p>
                              <p>📍 จุดส่งปลายทาง: <b className="text-slate-750">{job.dest}</b></p>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => isRide ? handleAcceptRideJob(job) : handleAcceptJob(job.id, job.items)}
                        className={`w-full md:w-auto shrink-0 px-5 py-3 text-white text-xs font-black rounded-xl transition duration-300 shadow cursor-pointer text-center active:scale-95 btn-scale ${
                          isRide ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-primary hover:bg-primary-hover shadow-primary/10'
                        }`}
                      >
                        {isRide ? 'รับงานเรียกรถนี้ 🛵' : 'รับงานส่งนี้ ⚡'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Rider History Logs */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 space-y-4">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 border-b border-slate-100 pb-3 uppercase tracking-wider">
            📋 บันทึกการวิ่งรอบส่งที่สำเร็จ (History Log)
          </h3>
          {riderHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-bold border border-dashed border-slate-200 rounded-2xl">ยังไม่มีประวัติจัดส่งที่เสร็จสิ้น</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {riderHistory.map((history) => (
                <div key={history.id} className="py-3.5 flex justify-between items-center text-xs">
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-700">{history.merchant_name}</span>
                      <span className="text-[9.5px] font-black text-slate-400">
                        {new Date(history.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-450 text-[10.5px] font-bold">{history.items}</p>
                    <p className="text-[10px] text-slate-400">
                      ค่าบริการจัดส่ง: <b className="text-emerald-600">฿15</b> • ปลายทาง:{' '}
                      <b className="text-slate-600">{history.dest}</b>
                    </p>
                    {history.rider_rating && (
                      <p className="text-[10px] text-amber-500 font-extrabold">
                        คะแนนดาวที่ได้รับ:{' '}
                        {'★'.repeat(history.rider_rating) + '☆'.repeat(5 - history.rider_rating)}
                        {history.rider_review && (
                          <span className="text-slate-400 font-normal italic ml-2">"{history.rider_review}"</span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg shrink-0">
                    สำเร็จ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
