'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '../../app/supabase';
import { User } from '../../app/context/AuthContext';
import MapPinModal, { CAMPUS_HOTSPOTS } from './MapPinModal';
import PromoModal from './PromoModal';
import RatingForm from './RatingForm';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
}

export default function CustomerDashboard({ user, logout }: CustomerDashboardProps) {
  // Active category filter ('all' | 'food')
  const [activeCategory, setActiveCategory] = useState<'all' | 'food'>('all');
  const [message, setMessage] = useState<string | null>(null);

  // States
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [selectedMerchantProducts, setSelectedMerchantProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [deliveryDest, setDeliveryDest] = useState('');
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromo, setActivePromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState<{ merchantName: string; items: typeof cart; total: number; dest: string; discount: number } | null>(null);
  const [isTrackerCollapsed, setIsTrackerCollapsed] = useState(false);
  const [isOrderBreakdownOpen, setIsOrderBreakdownOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartCoords = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    dragStartCoords.current = {
      x: e.clientX,
      y: e.clientY
    };
    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Global window listeners for smooth, responsive dragging across the entire screen
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isDragging]);

  // Map pinning states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedPinCoords, setSelectedPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [riderProgress, setRiderProgress] = useState(0.1);

  // Rating & Review states
  const [merchantRatings, setMerchantRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [selectedMerchantReviews, setSelectedMerchantReviews] = useState<any[]>([]);
  const [merchantReviewsTab, setMerchantReviewsTab] = useState<'menu' | 'reviews'>('menu');
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);

  // Carousel states for recommended shops
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(true);
  const [adminPromoCodes, setAdminPromoCodes] = useState<any[]>([]);

  // Fetch initial configs & responsive state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const recommended = merchants.filter((m) => m.is_partner === true);

  // Recommended carousel interval
  useEffect(() => {
    if (recommended.length <= (isMobile ? 1 : 2)) {
      setCarouselIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const maxIndex = isMobile ? recommended.length - 1 : recommended.length - 2;
        if (prev >= maxIndex) return 0;
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [recommended.length, isMobile]);

  const nextSlide = () => {
    const maxIndex = isMobile ? recommended.length - 1 : recommended.length - 2;
    setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    const maxIndex = isMobile ? recommended.length - 1 : recommended.length - 2;
    setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Data fetching functions
  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'merchant');
      if (error) throw error;
      setMerchants(data || []);
    } catch (err: any) {
      console.error('Failed to fetch merchants:', err.message || err);
    }
  };

  const fetchSelectedMerchantProducts = async (merchantId: string) => {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('merchant_id', merchantId);
      if (error) throw error;
      setSelectedMerchantProducts(data || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err.message || err);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err) {
      console.error('Failed to fetch customer orders', err);
    }
  };

  const fetchMerchantAverages = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('merchant_id, shop_rating')
        .not('shop_rating', 'is', null);
      if (error || !data) return;

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      data.forEach((o: any) => {
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
    } catch {
      // ยังไม่มีข้อมูล rating — ข้ามไป
    }
  };

  const fetchMerchantReviews = async (merchantId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', merchantId)
        .not('shop_rating', 'is', null)
        .order('created_at', { ascending: false });
      if (error || !data) return;
      setSelectedMerchantReviews(data);
    } catch {
      // ยังไม่มีรีวิว — ข้ามไป
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

  // Real-time triggers & initial load
  useEffect(() => {
    fetchMerchants();
    fetchCustomerOrders();
    fetchPromoCodes();
    fetchMerchantAverages();

    const ordersChannel = supabase
      .channel('orders-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchCustomerOrders();
        fetchMerchantAverages();
        if (selectedMerchant) {
          fetchMerchantReviews(selectedMerchant.id);
        }
      })
      .subscribe();

    const promosChannel = supabase
      .channel('promos-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, (payload) => {
        fetchPromoCodes();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-realtime-changes')
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
  }, [selectedMerchant]);

  // Load reviews on selecting merchant
  useEffect(() => {
    if (selectedMerchant) {
      fetchMerchantReviews(selectedMerchant.id);
      setMerchantReviewsTab('menu');
    } else {
      setSelectedMerchantReviews([]);
    }
  }, [selectedMerchant]);

  // Simulated rider delivery progress animation
  useEffect(() => {
    const activeOrders = customerOrders.filter((o) => o.status !== 'completed');
    const hasDelivering = activeOrders.some((o) => o.status === 'delivering');
    if (!hasDelivering) {
      setRiderProgress(0.1);
      return;
    }

    const interval = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 1.0) return 0.1;
        return parseFloat((prev + 0.05).toFixed(2));
      });
    }, 850);

    return () => clearInterval(interval);
  }, [customerOrders]);

  // Handlers
  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setMessage(`เพิ่ม "${product.name}" ใส่ตะกร้าแล้ว`);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handlePlaceOrder = async () => {
    if (!selectedMerchant || cart.length === 0) return;
    if (!deliveryDest.trim()) {
      alert('ใส่ที่อยู่จัดส่งด้วยนะ');
      return;
    }

    const orderId = 'ord-' + Math.random().toString(36).substr(2, 9);
    const itemsText = cart.map((item) => `${item.name} (${item.quantity}x)`).join(', ');
    const discount = activePromo ? activePromo.discount_amount : 0;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Math.max(0, subtotal - discount) + 15; // ฿15 delivery fee

    try {
      const { error } = await supabase.from('orders').insert([
        {
          id: orderId,
          customer_id: user.id,
          customer_name: user.name,
          merchant_id: selectedMerchant.id,
          merchant_name: selectedMerchant.shop_name || selectedMerchant.shopName || selectedMerchant.name,
          items: itemsText + (activePromo ? ` (ใช้ส่วนลด ${activePromo.code}: -฿${discount})` : ''),
          total_price: total,
          dest: deliveryDest.trim(),
          status: 'finding_rider',
        },
      ]);

      if (error) throw error;

      const orderInfo = {
        merchantName: selectedMerchant.shop_name || selectedMerchant.name,
        items: [...cart],
        total,
        dest: deliveryDest.trim(),
        discount,
      };
      setLastOrderInfo(orderInfo);
      setCart([]);
      setDeliveryDest('');
      setSelectedMerchant(null);
      setActivePromo(null);
      setPromoCodeInput('');
      setShowSuccessOverlay(true);
      setIsTrackerCollapsed(false);
      fetchCustomerOrders();
      setTimeout(() => setShowSuccessOverlay(false), 6000);
    } catch (err: any) {
      alert(`สั่งไม่ได้: ${err.message}`);
    }
  };

  const handleCancelOrder = async (order: any) => {
    if (order.status === 'delivering') {
      alert('ไม่สามารถยกเลิกได้เนื่องจากไรเดอร์กำลังนำส่งอาหาร 🏍️💨');
      return;
    }

    let confirmMsg = `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกออเดอร์จากร้าน ${order.merchant_name}?`;
    if (order.status === 'preparing') {
      confirmMsg = `⚠️ ร้านค้ากำลังปรุงอาหารของคุณอยู่ คุณแน่ใจหรือไม่ว่าต้องการยกเลิกออเดอร์นี้?`;
    } else if (order.status === 'calling_rider') {
      confirmMsg = `⚠️ อาหารเสร็จแล้วและกำลังเรียกไรเดอร์ คุณแน่ใจหรือไม่ว่าต้องการยกเลิกออเดอร์นี้?`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      const { error } = await supabase.from('orders').delete().eq('id', order.id);
      if (error) throw error;

      setMessage('ยกเลิกออเดอร์เรียบร้อยแล้ว ✕');
      fetchCustomerOrders();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`ยกเลิกออเดอร์ไม่ได้: ${err.message}`);
    }
  };

  const handleApplyPromoCode = async (code: string) => {
    setPromoError(null);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActivePromo(data);
        setMessage(`ใช้โค้ด "${data.code}" แล้ว! ลด ฿${data.discount_amount}`);
        setTimeout(() => setMessage(null), 3000);
        setIsPromoModalOpen(false);
      } else {
        setPromoError('โค้ดนี้ไม่ถูกต้อง หรือหมดอายุแล้ว');
      }
    } catch (err: any) {
      setPromoError('เช็คโค้ดไม่ได้ ลองใหม่อีกที');
    }
  };

  const handleSubmitRating = async (
    orderId: string,
    shopRating: number,
    shopReview: string,
    riderRating: number,
    riderReview: string
  ) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          shop_rating: shopRating,
          shop_review: shopReview.trim() || null,
          rider_rating: riderRating,
          rider_review: riderReview.trim() || null,
        })
        .eq('id', orderId);
      if (error) throw error;

      setMessage('ขอบคุณสำหรับการรีวิวครับ! ⭐');
      setRatingOrderId(null);
      fetchCustomerOrders();
      fetchMerchantAverages();
      if (selectedMerchant) {
        fetchMerchantReviews(selectedMerchant.id);
      }
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`ไม่สามารถบันทึกรีวิวได้: ${err.message}`);
    }
  };

  const handleMapPinSave = (fullDest: string, pinCoords: { x: number; y: number }, buildingName: string) => {
    setDeliveryDest(fullDest);
    setSelectedPinCoords(pinCoords);
    setSelectedBuilding(buildingName);
    setIsMapModalOpen(false);
    setMessage(`ปักหมุดตำแหน่ง: "${buildingName}" แล้ว! 📍`);
    setTimeout(() => setMessage(null), 2500);
  };

  // Filter merchants based on category selection
  const filteredMerchants = merchants.filter((m) => {
    if (activeCategory === 'all') return true;
    return m.merchant_type === 'restaurant';
  });

  return (
    <div className="space-y-8 py-2 animate-fade-in">
      {/* Floating alert */}
      {message && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-blue-500 animate-fade-in text-sm font-semibold max-w-md w-[90%] justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Header profile */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 text-left">
          <span className="text-xs font-black text-primary bg-primary-light px-3 py-1 rounded-lg">
            ลูกค้า
          </span>
          <h2 className="text-2xl font-black text-slate-800 mt-2">สวัสดี {user.name} 👋</h2>
          <p className="text-xs text-slate-400">เลือกร้านที่ชอบแล้วสั่งได้เลย!</p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeCategory === 'all'
                ? 'bg-white shadow text-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setActiveCategory('food')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeCategory === 'food'
                ? 'bg-white shadow text-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🍴 ร้านอาหาร
          </button>
        </div>
      </div>

      {/* Real-time Current Active Orders Tracker at the top */}
      {customerOrders.filter((o) => o.status !== 'completed').length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 px-1 text-left">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span>ติดตามสถานะออเดอร์ปัจจุบันของคุณ (Active Order Tracker)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerOrders
              .filter((o) => o.status !== 'completed')
              .map((order) => {
                const statusSteps = ['finding_rider', 'pending', 'preparing', 'delivering'];
                const stepNames = ['หาไรเดอร์', 'ส่งร้านค้า', 'กำลังทำ', 'กำลังส่ง'];
                const currentStepIndex = statusSteps.indexOf(order.status);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 border border-blue-100 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px] transition hover:shadow-lg text-left"
                  >
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl pointer-events-none -mr-8 -mt-8"></div>

                    <div className="relative z-10 flex justify-between items-start gap-4">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100/50">
                          🛵 {order.status === 'finding_rider' && 'กำลังหาไรเดอร์'}
                          {order.status === 'pending' && 'ได้ไรเดอร์แล้ว (รอร้านรับ)'}
                          {order.status === 'preparing' && 'ร้านกำลังจัดปรุง'}
                          {order.status === 'delivering' && 'กำลังเดินทางส่ง'}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 pt-1">
                          ร้าน {order.merchant_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[240px]">
                          {order.items}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 block font-bold">ยอดชำระ</span>
                        <span className="text-sm font-black text-slate-800">฿{order.total_price}</span>
                      </div>
                    </div>

                    {/* Interactive Steps Visual Indicator */}
                    <div className="relative z-10 pt-4 space-y-2">
                      <div className="flex justify-between text-[8px] font-bold text-slate-400 px-1">
                        {stepNames.map((name, idx) => (
                          <span
                            key={idx}
                            className={idx <= currentStepIndex ? 'text-blue-600' : 'text-slate-350'}
                          >
                            {name}
                          </span>
                        ))}
                      </div>

                      {/* Progress Line */}
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex relative">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${(currentStepIndex / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {order.rider_name && (
                      <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-blue-650">
                        <span>🏍️ กำลังนำส่งโดย คุณ {order.rider_name}</span>
                        <span className="animate-pulse">🛵💨 กำลังมา</span>
                      </div>
                    )}

                    {order.status !== 'delivering' && (
                      <div className="relative z-10 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[9px] text-slate-400 font-semibold">
                          ออเดอร์นี้ยกเลิกได้หากจำเป็น
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          className="px-2.5 py-1 text-[9.5px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-black border border-red-100 transition cursor-pointer"
                        >
                          ✕ ยกเลิกออเดอร์
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Campus Promo Codes Section */}
      {adminPromoCodes.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 space-y-3.5 animate-slide-up text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>🎟️</span> คูปองส่วนลดและข้อเสนอพิเศษวันนี้ (Offers & Promos)
            </h3>
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
              มี {adminPromoCodes.length} ข้อเสนอแนะนำ
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminPromoCodes.map((promo) => (
              <div
                key={promo.code}
                onClick={() => {
                  setPromoCodeInput(promo.code);
                  setActivePromo(promo);
                  setPromoError(null);
                  setMessage(`ใช้คูปอง "${promo.code}" แล้ว!`);
                  setTimeout(() => setMessage(null), 2000);
                }}
                className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex items-center min-h-[90px] relative cursor-pointer group ticket-shadow"
              >
                {/* Left Pane: Ticket Color Block */}
                <div className="w-20 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 self-stretch select-none relative">
                  <span className="text-2xl">🎟️</span>
                  <span className="text-[8px] font-black tracking-widest uppercase opacity-75 mt-1">
                    PROMO
                  </span>
                  <div className="absolute right-0 top-0 bottom-0 border-r border-dashed border-white/30"></div>
                </div>

                {/* Ticket Circular Cutouts */}
                <div className="absolute left-[74px] -top-1.5 w-3 h-3 bg-[#F7F9FA] rounded-full border-b border-slate-200 z-10"></div>
                <div className="absolute left-[74px] -bottom-1.5 w-3 h-3 bg-[#F7F9FA] rounded-full border-t border-slate-200 z-10"></div>

                {/* Right Pane: Coupon Details */}
                <div className="flex-1 p-4 pr-12 text-left space-y-1 relative">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h5 className="font-black text-sm text-slate-800">ส่วนลด ฿{promo.discount_amount}</h5>
                    <span className="text-[8px] font-black text-primary bg-primary-light border border-primary-light/40 px-1.5 py-0.5 rounded uppercase">
                      {promo.code}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                    {promo.description || 'ใช้ส่วนลดสำหรับสินค้าในวิทยาเขต ม.อ.'}
                  </p>
                  <span className="text-[8px] text-slate-400 block pt-0.5 font-medium">
                    ⏳ คูปองแนะนำพิเศษสำหรับสิทธิ์ล็อกอินนี้
                  </span>
                </div>

                {/* Checkbox */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      activePromo?.code === promo.code
                        ? 'border-blue-600 bg-primary text-white'
                        : 'border-slate-350 group-hover:border-blue-400 bg-white'
                    }`}
                  >
                    {activePromo?.code === promo.code && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shopping & Ordering Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Left Column: Stores & Cart */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedMerchant ? (
            <div className="space-y-8 animate-fade-in">
              {/* Recommended Shops Section */}
              {recommended.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <span>⭐</span> ร้านเด็ดต้องลอง (Recommended Shops)
                  </h3>

                  <div className="relative group/carousel">
                    {/* Left Navigation Arrow */}
                    {recommended.length > (isMobile ? 1 : 2) && (
                      <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-105 shadow-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                        title="ย้อนกลับ"
                      >
                        ❮
                      </button>
                    )}

                    {/* Viewport */}
                    <div className="overflow-hidden -mx-2 p-1">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{
                          transform: `translateX(-${carouselIndex * (isMobile ? 100 : 50)}%)`,
                        }}
                      >
                        {recommended.map((merchant) => (
                          <div key={merchant.id} className="w-full md:w-1/2 shrink-0 px-2">
                            <div
                              onClick={() => {
                                setSelectedMerchant(merchant);
                                fetchSelectedMerchantProducts(merchant.id);
                              }}
                              className="bg-[#FFFDF9] rounded-3xl p-6 border border-amber-200 glow-gold hover:-translate-y-1 transition-all duration-300 flex items-center justify-between cursor-pointer group relative overflow-hidden h-full min-h-[110px]"
                            >
                              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-100/30 rounded-full blur-xl pointer-events-none -mr-8 -mt-8 transition-all group-hover:scale-125"></div>

                              <div className="flex items-center gap-4 relative z-10">
                                <span className="w-14 h-14 rounded-2xl bg-amber-100/50 group-hover:bg-amber-200/60 text-3xl flex items-center justify-center transition duration-300 ring-4 ring-amber-50">
                                  {merchant.merchant_type === 'restaurant' ? '🍔' : '🛒'}
                                </span>
                                <div className="space-y-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-slate-850 group-hover:text-amber-700 transition">
                                      {merchant.shop_name || merchant.name}
                                    </h4>
                                    <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider scale-95 origin-left">
                                      แนะนำ ⭐
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-semibold">
                                    <span
                                      className={
                                        merchant.merchant_type === 'restaurant'
                                          ? 'text-indigo-650'
                                          : 'text-amber-600'
                                      }
                                    >
                                      {merchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                                    </span>
                                    <span>•</span>
                                    <span className="text-amber-500">
                                      ⭐ {merchantRatings[merchant.id]?.avg || '5.0'} (
                                      {merchantRatings[merchant.id]?.count || 0})
                                    </span>
                                    <span>•</span>
                                    <span>⏳ 10-20 นาที</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-amber-600 group-hover:text-amber-700 group-hover:translate-x-1.5 transition-all duration-300 font-black shrink-0 relative z-10">
                                สั่งเลย →
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Navigation Arrow */}
                    {recommended.length > (isMobile ? 1 : 2) && (
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-105 shadow-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                        title="ถัดไป"
                      >
                        ❯
                      </button>
                    )}
                  </div>

                  {/* Page Indicator Dots */}
                  {recommended.length > (isMobile ? 1 : 2) && (
                    <div className="flex justify-center gap-1.5 pt-2">
                      {Array.from({
                        length: isMobile ? recommended.length : recommended.length - 1,
                      }).map((_, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            carouselIndex === idx ? 'bg-amber-500 w-4' : 'bg-slate-200'
                          }`}
                          title={`หน้า ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Campus Shops Section */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>🏪</span> ร้านค้าทั้งหมดในมหาลัย (All Campus Shops)
                </h3>
                {filteredMerchants.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-xs text-slate-400">
                    ยังไม่มีร้านค้าในระบบตอนนี้
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMerchants.map((merchant) => {
                      const isRecommended = merchant.is_partner === true;
                      return (
                        <div
                          key={merchant.id}
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            fetchSelectedMerchantProducts(merchant.id);
                          }}
                          className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                            isRecommended
                              ? 'border-amber-100 hover:border-amber-200 bg-amber-50/5'
                              : 'border-slate-100/80 hover:border-slate-250'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center transition duration-300 ${
                                isRecommended
                                  ? 'bg-amber-100/40 group-hover:bg-amber-100/70'
                                  : 'bg-primary-light/50 group-hover:bg-primary-light'
                              }`}
                            >
                              {merchant.merchant_type === 'restaurant' ? '🍔' : '🛒'}
                            </span>
                            <div className="space-y-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-black text-slate-800 group-hover:text-primary transition">
                                  {merchant.shop_name || merchant.name}
                                </h4>
                                {isRecommended && (
                                  <span className="text-[8px] font-extrabold text-amber-705 bg-amber-100/80 px-1.5 py-0.2 rounded uppercase scale-90">
                                    แนะนำ
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-semibold">
                                <span
                                  className={
                                    merchant.merchant_type === 'restaurant'
                                      ? 'text-indigo-650'
                                      : 'text-amber-600'
                                  }
                                >
                                  {merchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                                </span>
                                <span>•</span>
                                <span className="text-amber-500">
                                  ⭐ {merchantRatings[merchant.id]?.avg || '5.0'} (
                                  {merchantRatings[merchant.id]?.count || 0})
                                </span>
                                <span>•</span>
                                <span>⏳ 15-25 นาที</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-primary group-hover:translate-x-1.5 transition-all duration-300 font-bold shrink-0">
                            สั่งซื้อเลย →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-white rounded-3xl px-6 py-4.5 border border-slate-100 shadow-sm">
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="text-xs font-black text-slate-400 hover:text-slate-605 flex items-center gap-1.5 transition cursor-pointer"
                >
                  ← ย้อนกลับ
                </button>
                <h3 className="text-sm font-black text-primary uppercase flex items-center gap-2">
                  <span>{selectedMerchant.merchant_type === 'restaurant' ? '🍔' : '🛒'}</span>
                  {selectedMerchant.shop_name || selectedMerchant.name}
                </h3>
              </div>

              {/* Tab Navigation Menu vs Reviews */}
              <div className="flex border-b border-slate-200 gap-6 text-xs font-extrabold text-slate-400 px-6 pt-1 bg-white rounded-3xl shadow-sm border border-slate-100">
                <button
                  type="button"
                  onClick={() => setMerchantReviewsTab('menu')}
                  className={`pb-3.5 pt-3 transition cursor-pointer relative ${
                    merchantReviewsTab === 'menu' ? 'text-primary' : 'hover:text-slate-600'
                  }`}
                >
                  🍽️ รายการเมนูสินค้า
                  {merchantReviewsTab === 'menu' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMerchantReviewsTab('reviews')}
                  className={`pb-3.5 pt-3 transition cursor-pointer relative ${
                    merchantReviewsTab === 'reviews' ? 'text-primary' : 'hover:text-slate-655'
                  }`}
                >
                  ⭐ รีวิวร้าน ({selectedMerchantReviews.length} รีวิว)
                  {merchantReviewsTab === 'reviews' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>
                  )}
                </button>
              </div>

              {merchantReviewsTab === 'menu' ? (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
                    รายการสินค้าในร้าน:
                  </h4>
                  {selectedMerchantProducts.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">ไม่มีรายการสินค้าจัดแสดงในขณะนี้</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedMerchantProducts.map((prod) => (
                        <div key={prod.id} className="py-3.5 flex justify-between items-center text-xs">
                          <div className="text-left">
                            <p className="font-bold text-slate-700">{prod.name}</p>
                            <p className="font-bold text-primary mt-0.5">฿{prod.price}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[10px] font-extrabold rounded-lg transition cursor-pointer"
                          >
                            + ใส่ตะกร้า
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 animate-fade-in text-left">
                  {/* Rating Summary Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    {/* Left Column: Big Average Score */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-1">
                      <span className="text-4xl font-black text-slate-800">
                        {selectedMerchantReviews.length > 0
                          ? (
                              selectedMerchantReviews.reduce((sum, r) => sum + r.shop_rating, 0) /
                              selectedMerchantReviews.length
                            ).toFixed(1)
                          : '5.0'}
                      </span>
                      <div className="text-amber-500 text-sm font-black">
                        {'★'.repeat(
                          Math.round(
                            selectedMerchantReviews.length > 0
                              ? selectedMerchantReviews.reduce((sum, r) => sum + r.shop_rating, 0) /
                                  selectedMerchantReviews.length
                              : 5
                          )
                        ) +
                          '☆'.repeat(
                            5 -
                              Math.round(
                                selectedMerchantReviews.length > 0
                                  ? selectedMerchantReviews.reduce((sum, r) => sum + r.shop_rating, 0) /
                                      selectedMerchantReviews.length
                                  : 5
                              )
                          )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        อิงจาก {selectedMerchantReviews.length} รีวิว
                      </span>
                    </div>

                    {/* Right Column: Star Progress Distribution */}
                    <div className="md:col-span-8 space-y-1.5 text-xs text-slate-500 flex flex-col justify-center">
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = selectedMerchantReviews.filter((r) => r.shop_rating === stars).length;
                        const percentage =
                          selectedMerchantReviews.length > 0
                            ? (count / selectedMerchantReviews.length) * 100
                            : stars === 5
                            ? 100
                            : 0;
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="w-10 font-bold shrink-0 text-right">{stars} ดาว</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-8 font-bold text-slate-400 shrink-0">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Reviews Feed */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      ความคิดเห็นจากนักศึกษา:
                    </h4>
                    {selectedMerchantReviews.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-150 rounded-2xl">
                        ยังไม่มีรีวิวสำหรับร้านค้านี้ สั่งซื้อแล้วมารีวิวเป็นคนแรกกันเถอะ!
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                        {selectedMerchantReviews.map((rev) => {
                          const maskedName = rev.customer_name
                            ? rev.customer_name.charAt(0) +
                              '***' +
                              rev.customer_name.charAt(rev.customer_name.length - 1)
                            : 'ผู้ใช้ CampusGo';
                          return (
                            <div key={rev.id} className="py-4 space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-705">{maskedName}</span>
                                  <span className="text-amber-500 font-extrabold">
                                    {'★'.repeat(rev.shop_rating) + '☆'.repeat(5 - rev.shop_rating)}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(rev.created_at).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-650 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 mt-1">
                                {rev.shop_review || '👍 อร่อย บริการดีเยี่ยม'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Cart & Active Orders Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Checkout Cart Container */}
          {cart.length > 0 && (
            <div
              id="checkout-cart"
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4 animate-slide-up scroll-mt-20 text-left font-sans"
            >
              <h3 className="text-sm font-black text-slate-850 pb-2 border-b border-slate-100">
                🛒 ตะกร้าสินค้าของคุณ ({selectedMerchant?.shop_name || selectedMerchant?.name})
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-750">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity}x • ฿{item.price * item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition cursor-pointer"
                    >
                      ลบออก
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">ราคาสินค้า</span>
                  <span>฿{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span>
                </div>
                {activePromo && (
                  <div className="flex justify-between text-emerald-655 font-bold">
                    <span>ส่วนลดคูปอง ({activePromo.code})</span>
                    <span>-฿{activePromo.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">ค่าจัดส่งโดยไรเดอร์</span>
                  <span className="text-primary font-bold">฿15</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-slate-100 pt-2 text-slate-800">
                  <span>ราคารวมทั้งหมด</span>
                  <span>
                    ฿
                    {Math.max(
                      0,
                      cart.reduce((sum, item) => sum + item.price * item.quantity, 0) -
                        (activePromo ? activePromo.discount_amount : 0)
                    ) + 15}
                  </span>
                </div>
              </div>

              {/* Grab-style Promo selector bar */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(true)}
                  className="w-full py-3 px-4 bg-[#F7F9FA] hover:bg-slate-50/80 border border-slate-100/70 rounded-2xl flex justify-between items-center text-xs text-slate-700 font-bold transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base text-primary">🏷️</span>
                    {activePromo ? (
                      <div className="flex items-center gap-1.5 text-left">
                        <span className="bg-primary text-white text-[9px] px-2 py-0.5 rounded font-black tracking-wide uppercase">
                          {activePromo.code}
                        </span>
                        <span className="text-primary font-black">
                          ลดแล้ว ฿{activePromo.discount_amount}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-extrabold">
                        ใช้คูปองเพื่อรับส่วนลด (Offers & Promos)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                    {activePromo ? (
                      <span className="text-[9px] text-primary font-bold bg-primary-light border border-primary-light/40 px-2 py-0.5 rounded-lg group-hover:bg-blue-100">
                        เปลี่ยน
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-200/50 px-2 py-0.5 rounded-lg group-hover:bg-slate-200">
                        เลือก
                      </span>
                    )}
                    <span className="text-slate-400 font-medium">❯</span>
                  </div>
                </button>
              </div>

              {/* Delivery Destination Input */}
              <div className="space-y-1 pt-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                    ระบุปลายทางรับของใน ม.อ. <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedPinCoords) {
                        setSelectedPinCoords({ x: 30, y: 75 });
                        setSelectedBuilding('หอพักนักศึกษา 11 (ชาย)');
                      }
                      setIsMapModalOpen(true);
                    }}
                    className="text-[10px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    📍 ปักหมุดบนแผนที่ (PSU Map)
                  </button>
                </div>
                <input
                  type="text"
                  value={deliveryDest}
                  onChange={(e) => setDeliveryDest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition font-semibold"
                  placeholder="เช่น หอ 11 ห้อง 420 หรือ ตึกวิศวะชั้น 2"
                  required
                />
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition duration-300 shadow shadow-emerald-100/50 cursor-pointer"
              >
                ยืนยันการสั่งซื้ออาหาร/ของชำ
              </button>
            </div>
          )}

          {/* Customer Active Orders Tracker in Side panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-850 pb-2 border-b border-slate-100 text-left">
              🔔 ออเดอร์และสถานะเดินทางสด (Real-time Tracker)
            </h3>
            {customerOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">ไม่มีรายการออเดอร์ในปัจจุบัน</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {customerOrders.map((order) => (
                  <div key={order.id} className="py-4 space-y-1.5 text-xs text-left">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700">{order.merchant_name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                          order.status === 'pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : order.status === 'preparing'
                            ? 'bg-indigo-50 text-indigo-650 border border-indigo-100'
                            : order.status === 'calling_rider'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : order.status === 'delivering'
                            ? 'bg-primary-light text-primary border border-primary-light/40 animate-pulse'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                      >
                        {order.status === 'pending' && 'รอรับออเดอร์'}
                        {order.status === 'preparing' && 'กำลังจัดปรุง'}
                        {order.status === 'calling_rider' && 'กำลังเรียกคนขับ'}
                        {order.status === 'delivering' && 'กำลังจัดส่ง'}
                        {order.status === 'completed' && 'ส่งเรียบร้อยแล้ว'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] leading-relaxed">{order.items}</p>
                    <p className="text-[10px] text-slate-400">
                      ยอดชำระ: <b>฿{order.total_price}</b> • ปลายทาง: <b>{order.dest}</b>
                    </p>
                    {order.rider_name && (
                      <p className="text-[9px] text-primary font-bold bg-primary-light px-2 py-1 rounded">
                        🏍️ ไรเดอร์ผู้จัดส่ง: คุณ {order.rider_name}
                      </p>
                    )}

                    {order.status !== 'completed' && order.status !== 'delivering' && (
                      <div className="pt-1 text-left">
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order)}
                          className="px-2.5 py-1 text-[9.5px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-black border border-red-100 transition cursor-pointer"
                        >
                          ✕ ยกเลิกออเดอร์นี้
                        </button>
                      </div>
                    )}

                    {/* Completed Order Ratings */}
                    {order.status === 'completed' && order.shop_rating && (
                      <div className="mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[10px] text-slate-500 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <span className="font-bold text-slate-600">🏪 รีวิวร้านค้า:</span>
                          <span className="text-amber-500 font-extrabold">
                            {'★'.repeat(order.shop_rating) + '☆'.repeat(5 - order.shop_rating)}
                          </span>
                          {order.shop_review && (
                            <span className="text-slate-400 italic">"{order.shop_review}"</span>
                          )}
                        </div>
                        {order.rider_name && order.rider_rating && (
                          <div className="flex flex-wrap items-center gap-x-2">
                            <span className="font-bold text-slate-600">🏍️ รีวิวไรเดอร์:</span>
                            <span className="text-amber-500 font-extrabold">
                              {'★'.repeat(order.rider_rating) + '☆'.repeat(5 - order.rider_rating)}
                            </span>
                            {order.rider_review && (
                              <span className="text-slate-400 italic">"{order.rider_review}"</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {order.status === 'completed' && !order.shop_rating && (
                      <div className="mt-2 text-left">
                        {ratingOrderId === order.id ? (
                          <RatingForm
                            order={order}
                            onSubmit={async (sr, srv, rr, rrv) => {
                              await handleSubmitRating(order.id, sr, srv, rr, rrv);
                            }}
                            onCancel={() => setRatingOrderId(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRatingOrderId(order.id)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 font-black tracking-wide text-[9px] uppercase cursor-pointer hover:scale-[1.02] active:scale-95 transition-all text-left"
                          >
                            ⭐ รีวิวและให้คะแนนบริการ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-40 animate-slide-up">
          <button
            type="button"
            onClick={() => document.getElementById('checkout-cart')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-2xl shadow-xl flex justify-between items-center font-bold text-sm cursor-pointer border border-blue-500 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <span>🛒</span>
              <span>ตะกร้าสินค้า ({cart.reduce((sum, item) => sum + item.quantity, 0)} รายการ)</span>
            </div>
            <div className="flex items-center gap-1.5 font-black">
              <span>
                ฿
                {Math.max(
                  0,
                  cart.reduce((sum, item) => sum + item.price * item.quantity, 0) -
                    (activePromo ? activePromo.discount_amount : 0)
                ) + 15}
              </span>
              <span>❯</span>
            </div>
          </button>
        </div>
      )}

      {/* Promo Selection Modal */}
      <PromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        promoCodes={adminPromoCodes}
        activePromo={activePromo}
        onSelectPromo={(promo) => {
          setPromoCodeInput(promo.code);
          setActivePromo(promo);
          setPromoError(null);
        }}
        onClearPromo={() => {
          setActivePromo(null);
          setPromoCodeInput('');
        }}
        onApplyCode={handleApplyPromoCode}
        promoError={promoError}
        setPromoError={setPromoError}
      />

      {/* Campus Map Pin Modal */}
      <MapPinModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSave={handleMapPinSave}
        initialBuilding={selectedBuilding}
        initialCoords={selectedPinCoords}
      />

      {/* Success Animation Overlay — Premium Design (Portal to body) */}
      {typeof document !== 'undefined' && showSuccessOverlay && createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowSuccessOverlay(false)}>
          <div className="max-w-sm w-full bg-white rounded-[32px] relative overflow-hidden shadow-2xl animate-pop-in border border-slate-100/50" onClick={(e) => e.stopPropagation()}>
            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {Array.from({ length: 50 }).map((_, i) => {
                const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316'];
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 2;
                const randomSize = Math.random() * 8 + 4;
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                return (
                  <div
                    key={i}
                    className="absolute rounded-full animate-confetti-fall"
                    style={{
                      left: `${randomLeft}%`,
                      top: `-20px`,
                      width: `${randomSize}px`,
                      height: `${randomSize}px`,
                      backgroundColor: randomColor,
                      animationDelay: `${randomDelay}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Top gradient banner */}
            <div className="relative bg-gradient-to-br from-primary via-emerald-500 to-teal-500 px-6 pt-8 pb-10 text-center text-white">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 left-4 text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎉</div>
                <div className="absolute top-6 right-6 text-3xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎊</div>
                <div className="absolute bottom-3 left-8 text-2xl animate-bounce" style={{ animationDelay: '0.7s' }}>✨</div>
                <div className="absolute bottom-2 right-4 text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</div>
              </div>
              
              {/* Checkmark */}
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30 shadow-lg animate-success-check">
                  <svg className="w-10 h-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black mb-1 drop-shadow-sm">สั่งซื้อสำเร็จแล้ว! 🎉</h3>
                <p className="text-[11px] font-semibold text-white/80">ออเดอร์ของคุณถูกส่งไปยังร้านค้าแล้ว</p>
              </div>
            </div>

            {/* Order Details */}
            <div className="px-5 -mt-5 relative z-10">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">
                {/* Merchant name */}
                {lastOrderInfo && (
                  <>
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">🏪</div>
                      <div className="text-left min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ร้านค้า</p>
                        <p className="text-xs font-black text-slate-800 truncate">{lastOrderInfo.merchantName}</p>
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="px-4 py-3 space-y-1.5 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายการสั่งซื้อ</p>
                      {lastOrderInfo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700 font-semibold truncate pr-2">{item.name} <span className="text-slate-400">×{item.quantity}</span></span>
                          <span className="font-bold text-slate-800 shrink-0">฿{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & total */}
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-base">📍</span>
                        <div className="text-left min-w-0">
                          <p className="text-[10px] font-bold text-slate-400">ส่งที่</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{lastOrderInfo.dest}</p>
                        </div>
                      </div>
                      {lastOrderInfo.discount > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-emerald-600 font-bold">🎟️ ส่วนลดคูปอง</span>
                          <span className="text-emerald-600 font-black">-฿{lastOrderInfo.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-bold">🛵 ค่าจัดส่ง</span>
                        <span className="text-slate-600 font-bold">฿15</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                        <span className="text-xs font-black text-slate-800">ยอดรวมทั้งหมด</span>
                        <span className="text-base font-black text-primary">฿{lastOrderInfo.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Scooter animation track */}
            <div className="px-5 pt-4 pb-2">
              <div className="h-9 bg-slate-50 rounded-xl relative overflow-hidden flex items-center border border-slate-200/50 shadow-inner px-3">
                <span className="absolute left-2.5 text-[8px] font-bold text-slate-400">🏪 ร้านค้า</span>
                <span className="absolute right-2.5 text-[8px] font-bold text-slate-400">📍 คุณ</span>
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[40px] text-lg animate-scooter-ride z-10">
                  🛵💨
                </div>
                <div className="w-full border-t-2 border-dashed border-slate-200 mt-0.5"></div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="px-5 pb-5 pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowSuccessOverlay(false)}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition duration-300 shadow-md cursor-pointer text-center active:scale-95"
              >
                ✓ ติดตามสถานะออเดอร์
              </button>
              <p className="text-center text-[9px] text-slate-400 font-semibold">แตะที่ไหนก็ได้เพื่อปิด • หน้านี้จะปิดอัตโนมัติ</p>
            </div>
          </div>
        </div>
      , document.body)}


      {/* Grab-style floating order status tracker (Expanded / Collapsed sheets) — Portal to body */}
      {typeof document !== 'undefined' && createPortal((() => {
        const activeOrders = customerOrders.filter((o) => o.status !== 'completed');
        if (activeOrders.length === 0) return null;

        const order = activeOrders[0];
        const statusSteps = ['finding_rider', 'pending', 'preparing', 'delivering'];
        const currentStepIndex = statusSteps.indexOf(order.status);

        const steps = [
          {
            title: 'กำลังจัดหาไรเดอร์',
            desc:
              order.status === 'finding_rider'
                ? 'ระบบกำลังหาไรเดอร์ที่พร้อมรับงานให้คุณ...'
                : `ไรเดอร์คุณ ${order.rider_name || 'พาร์ทเนอร์'} รับงานแล้ว!`,
            emoji: '🛵',
            isActive: true,
            isCurrent: order.status === 'finding_rider',
          },
          {
            title: 'ร้านค้ารับออเดอร์ / เตรียมของ',
            desc:
              order.status === 'pending'
                ? 'ออเดอร์ถูกส่งไปยังร้านค้าแล้ว รอร้านค้ารับออเดอร์...'
                : 'ครัวได้รับออเดอร์แล้ว กำลังจัดเตรียมสินค้า...',
            emoji: '🍳',
            isActive:
              order.status === 'pending' ||
              order.status === 'preparing' ||
              order.status === 'delivering',
            isCurrent: order.status === 'pending' || order.status === 'preparing',
          },
          {
            title: 'ไรเดอร์กำลังไปส่ง',
            desc: order.rider_name
              ? `คุณ ${order.rider_name} กำลังนำออเดอร์มาส่งให้คุณ`
              : 'ไรเดอร์กำลังนำสินค้าส่งไปยังจุดหมายของคุณ',
            emoji: '🏍️',
            isActive: order.status === 'delivering',
            isCurrent: order.status === 'delivering',
          },
        ];

        if (isTrackerCollapsed) {
          return (
            <div
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                touchAction: 'none',
                transition: isDragging ? 'none' : undefined
              }}
              className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[320px] z-50 animate-slide-up"
            >
              <div
                onPointerDown={handlePointerDown}
                onClick={(e) => {
                  const distance = Math.hypot(e.clientX - dragStartCoords.current.x, e.clientY - dragStartCoords.current.y);
                  if (distance < 6) {
                    setIsTrackerCollapsed(false);
                  }
                }}
                className="bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-xl shadow-2xl flex justify-between items-center font-bold text-[10.5px] cursor-move select-none touch-none border border-primary-hover hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[12px] shrink-0">🛵</span>
                  <span className="truncate text-left font-black">
                    ร้าน {order.merchant_name}: {order.status === 'finding_rider' && 'หาไรเดอร์...'}
                    {order.status === 'pending' && 'รอร้านรับ'}
                    {order.status === 'preparing' && 'เตรียมสินค้า'}
                    {order.status === 'calling_rider' && 'ไรเดอร์ไปรับ'}
                    {order.status === 'delivering' && 'กำลังส่ง 💨'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wide">
                    ขยาย
                  </span>
                  <span className="text-[8.5px]">❯</span>
                </div>
              </div>
            </div>
          );
        }

        // Expanded tracker sheet
        let merchantCoords = { x: 74, y: 62 };
        if (order.merchant_name.includes('วิศวะ')) {
          merchantCoords = { x: 22, y: 52 };
        } else if (order.merchant_name.includes('มินิมาร์ท') || order.merchant_name.includes('LRC')) {
          merchantCoords = { x: 62, y: 55 };
        } else if (order.merchant_name.includes('แพทย์') || order.merchant_name.includes('โรงพยาบาล')) {
          merchantCoords = { x: 55, y: 18 };
        } else if (order.merchant_name.includes('วิทย')) {
          merchantCoords = { x: 32, y: 35 };
        }

        let customerCoords = { x: 30, y: 75 };
        if (selectedPinCoords) {
          customerCoords = selectedPinCoords;
        } else {
          const destText = order.dest || '';
          const match = CAMPUS_HOTSPOTS.find(
            (spot) =>
              destText.includes(spot.name.split(' (')[0]) || destText.includes(spot.name.substring(0, 8))
          );
          if (match) {
            customerCoords = { x: match.x, y: match.y };
          }
        }

        let riderCoords = { x: merchantCoords.x, y: merchantCoords.y };
        if (order.status === 'calling_rider') {
          riderCoords = {
            x: merchantCoords.x + (50 - merchantCoords.x) * 0.3,
            y: merchantCoords.y + (50 - merchantCoords.y) * 0.3,
          };
        } else if (order.status === 'delivering') {
          riderCoords = {
            x: merchantCoords.x + (customerCoords.x - merchantCoords.x) * riderProgress,
            y: merchantCoords.y + (customerCoords.y - merchantCoords.y) * riderProgress,
          };
        }

        return (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              touchAction: 'none',
              transition: isDragging ? 'none' : undefined
            }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[320px] z-50 animate-slide-up p-0"
          >
            <div className="bg-white rounded-[24px] shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col max-h-[80vh] sm:max-h-none text-left">
              {/* Header */}
              <div
                onPointerDown={handlePointerDown}
                className="px-4.5 py-3 border-b border-slate-100 bg-[#F7F9FA] flex justify-between items-center cursor-move select-none touch-none active:bg-slate-150 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛵</span>
                  <div className="text-left">
                    <h3 className="text-xs font-black text-slate-800">ติดตามสถานะจัดส่ง</h3>
                    <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">CampusGo Express</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrackerCollapsed(true)}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-650 hover:text-slate-800 text-[8.5px] font-black rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  พับหน้าจอ
                </button>
              </div>

              {/* Order Info with Receipt Breakdown */}
              <div className="p-4 border-b border-slate-200/40 bg-[#FFFDF9] text-left">
                <div className="flex justify-between items-start gap-3">
                  <div className="text-left flex-1">
                    <span className="text-[8px] font-black bg-primary-light text-primary-dark px-2 py-0.5 rounded border border-primary/10">
                      ร้านค้าพาร์ทเนอร์
                    </span>
                    <h4 className="text-xs font-black text-slate-805 mt-1">{order.merchant_name}</h4>
                    <p className="text-[9.5px] text-slate-450 font-semibold truncate max-w-[170px] mt-0.5">
                      รายการ: {order.items}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsOrderBreakdownOpen(!isOrderBreakdownOpen)}
                      className="text-[8.5px] text-primary hover:text-primary-hover font-black block uppercase tracking-wide cursor-pointer select-none pb-0.5"
                    >
                      ดูใบเสร็จ {isOrderBreakdownOpen ? '▼' : '▲'}
                    </button>
                    <span className="text-xs font-black text-slate-850">฿{order.total_price}</span>
                  </div>
                </div>

                {isOrderBreakdownOpen && (
                  <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 text-[9.5px] font-bold text-slate-500 space-y-1 animate-fade-in">
                    <div className="flex justify-between">
                      <span>ค่าอาหารและสินค้า</span>
                      <span>฿{order.total_price - 15}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ค่าบริการส่งอาหาร (ไรเดอร์)</span>
                      <span className="text-primary-dark">฿15</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-1.5 font-black text-slate-800 text-[11px]">
                      <span>ยอดสุทธิ</span>
                      <span className="text-primary-dark">฿{order.total_price}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Minimap Graphic - Beautiful custom PSU Campus SVG */}
              <div className="relative w-full h-[120px] bg-slate-50 border-b border-slate-200/50 overflow-hidden select-none">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid-mini" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-mini)" />

                  {/* Si Trang Reservoir (อ่างศรีตรัง) */}
                  <ellipse cx="84%" cy="73%" rx="38" ry="18" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="1" opacity="0.8" />
                  <text x="84%" y="76%" fill="#0284c7" fontSize="6.5" fontWeight="black" textAnchor="middle" opacity="0.7">อ่างศรีตรัง 🏞️</text>

                  {/* Campus Roads network */}
                  <path d="M 0 55 Q 50 55 100 55" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <path d="M 32 0 Q 32 55 52 100" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                  <path d="M 72 0 Q 62 55 32 100" stroke="#e2e8f0" strokeWidth="4" fill="none" opacity="0.7" />

                  {/* Connecting path line */}
                  <line
                    x1={`${merchantCoords.x}%`}
                    y1={`${merchantCoords.y}%`}
                    x2={`${customerCoords.x}%`}
                    y2={`${customerCoords.y}%`}
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="opacity-70"
                  />
                </svg>

                {/* Stylish Campus Labels */}
                <div className="absolute top-[38%] left-[73%] -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-slate-200/80 shadow-sm rounded px-1 py-0.2 text-[6px] font-black text-slate-455 pointer-events-none select-none scale-90">
                  หอสมุด
                </div>
                <div className="absolute top-[28%] left-[34%] -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-slate-200/80 shadow-sm rounded px-1 py-0.2 text-[6px] font-black text-slate-455 pointer-events-none select-none scale-90">
                  ตึกฟักทอง
                </div>
                <div className="absolute top-[62%] left-[19%] -translate-x-1/2 -translate-y-1/2 bg-white/90 border border-slate-200/80 shadow-sm rounded px-1 py-0.2 text-[6px] font-black text-slate-455 pointer-events-none select-none scale-90">
                  วิศวะ
                </div>

                {/* Merchant Location Pin */}
                <div
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center scale-90"
                  style={{ left: `${merchantCoords.x}%`, top: `${merchantCoords.y}%` }}
                >
                  <span className="text-base filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] select-none">🏪</span>
                  <span className="text-[6.5px] font-black text-slate-650 bg-white/95 px-1 py-0.2 rounded border border-slate-200 shadow-md">
                    ร้านค้า
                  </span>
                </div>

                {/* Customer Location Pin */}
                <div
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center scale-90"
                  style={{ left: `${customerCoords.x}%`, top: `${customerCoords.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute animate-ping h-4 w-4 rounded-full bg-primary/30 opacity-75"></span>
                    <span className="text-base relative filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)] select-none animate-bounce">📍</span>
                  </div>
                  <span className="text-[6.5px] font-black text-primary-dark bg-white/95 px-1 py-0.2 rounded border border-primary/20 shadow-md">
                    คุณ
                  </span>
                </div>

                {/* Rider Floating Pin */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ease-out scale-90"
                  style={{ left: `${riderCoords.x}%`, top: `${riderCoords.y}%` }}
                >
                  <div className="relative flex items-center justify-center bg-white border border-emerald-250 shadow-md rounded-full w-7 h-7">
                    <span className="absolute animate-ping h-8 w-8 rounded-full bg-primary/20 opacity-60"></span>
                    <div className="text-sm animate-pulse filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                      🛵
                    </div>
                  </div>
                  <span className="text-[6.5px] font-black text-emerald-700 bg-white border border-emerald-250 px-1 py-0.2 rounded shadow-sm whitespace-nowrap mt-0.5">
                    {order.status === 'finding_rider' && 'หาไรเดอร์'}
                    {order.status === 'pending' && 'รอร้านรับ'}
                    {order.status === 'preparing' && 'เตรียมสินค้า'}
                    {order.status === 'calling_rider' && 'ไรเดอร์ไปรับ'}
                    {order.status === 'delivering' && 'กำลังไปส่ง 💨'}
                  </span>
                </div>
              </div>

              {/* Steps Checklist - perfectly centered timelines */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[160px] sm:max-h-none text-left">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3.5 relative group">
                    {idx < steps.length - 1 && (
                      <div
                        className={`absolute left-[14px] top-7.5 bottom-0 w-[2px] -translate-x-1/2 rounded-full ${
                          steps[idx + 1].isActive ? 'bg-primary' : 'bg-slate-100'
                        }`}
                      ></div>
                    )}

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border-2 transition-all duration-300 z-10 relative ${
                        step.isCurrent
                          ? 'border-primary bg-primary text-white scale-105 shadow-md shadow-primary/20 ring-2 ring-primary-light'
                          : step.isActive
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {step.isCurrent ? (
                        <span className="scale-90">{step.emoji}</span>
                      ) : step.isActive ? (
                        <div className="relative flex items-center justify-center">
                          <span className="opacity-60 scale-90">{step.emoji}</span>
                          <span className="absolute -right-1 -bottom-1 bg-primary text-white text-[6.5px] rounded-full w-3 h-3 flex items-center justify-center border border-white font-black">
                            ✓
                          </span>
                        </div>
                      ) : (
                        <span className="scale-90">{step.emoji}</span>
                      )}
                    </div>

                    <div className="space-y-0.5 pt-0.5 flex-1">
                      <h5
                        className={`text-[10.5px] font-black transition-colors ${
                          step.isCurrent
                            ? 'text-primary'
                            : step.isActive
                            ? 'text-slate-800'
                            : 'text-slate-455'
                        }`}
                      >
                        {step.title}
                      </h5>
                      <p
                        className={`text-[9px] font-semibold leading-relaxed ${
                          step.isActive ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assigned Rider Info */}
              {order.rider_name && (
                <div className="p-3 bg-primary-light/40 border-t border-slate-100 flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg shrink-0">
                      🏍️
                    </div>
                    <div>
                      <p className="text-[7.5px] text-slate-455 font-bold uppercase tracking-wider">
                        ไรเดอร์ผู้ส่งของ
                      </p>
                      <p className="text-[10.5px] font-black text-slate-805">คุณ {order.rider_name}</p>
                    </div>
                  </div>

                  <a
                    href="tel:0800000000"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`โทรหาไรเดอร์ คุณ ${order.rider_name} (เบอร์จำลอง) 📞`);
                    }}
                    className="px-2.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-[8.5px] font-bold rounded-lg transition shadow shadow-primary/20 shrink-0 cursor-pointer active:scale-95"
                  >
                    📞 โทรหาไรเดอร์
                  </a>
                </div>
              )}

              {/* Collapse Bottom Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-150/50 flex flex-col gap-1.5">
                {order.status !== 'delivering' && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order)}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-655 hover:text-red-700 text-[10.5px] font-black rounded-lg transition duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    ✕ ยกเลิกออเดอร์นี้
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTrackerCollapsed(true)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold rounded-lg transition duration-200 shadow-sm cursor-pointer text-center active:scale-95"
                >
                  พับหน้าจอไปสั่งต่อ
                </button>
                <div className="text-center pt-0.5">
                  <span className="text-[8.5px] text-slate-400 font-bold">
                    📍 ปลายทางจัดส่ง: {order.dest}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
    </div>
  );
}
