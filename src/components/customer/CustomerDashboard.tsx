'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '../../app/supabase';
import { User } from '../../app/context/AuthContext';
import MapPinModal, { CAMPUS_HOTSPOTS } from './MapPinModal';
import PromoModal from './PromoModal';
import RatingForm from './RatingForm';
import CustomerFoodView from './CustomerFoodView';
import CustomerRideView from './CustomerRideView';

interface CustomerDashboardProps {
  user: User;
  logout: () => void;
}

export default function CustomerDashboard({ user, logout }: CustomerDashboardProps) {
  // Active category filter ('all' | 'food')
  const [activeCategory, setActiveCategory] = useState<'all' | 'food'>('all');
  const [activeServiceTab, setActiveServiceTab] = useState<'food' | 'ride'>('food');
  const [message, setMessage] = useState<string | null>(null);

  // Ride Hailing state
  const [ridePickup, setRidePickup] = useState('📍 คณะวิศวกรรมศาสตร์');
  const [rideDropoff, setRideDropoff] = useState('📍 ศูนย์ทรัพยากรการเรียนรู้ LRC');
  const [ridePickupCoords, setRidePickupCoords] = useState<{ x: number; y: number } | null>({ x: 22, y: 52 });
  const [rideDropoffCoords, setRideDropoffCoords] = useState<{ x: number; y: number } | null>({ x: 62, y: 55 });
  const [vehicleType, setVehicleType] = useState<'motorbike' | 'car' | 'scooter'>('motorbike');
  const [passengers, setPassengers] = useState<number>(1);
  const [rideNote, setRideNote] = useState('');
  const [mapTargetType, setMapTargetType] = useState<'pickup' | 'dropoff' | 'delivery'>('delivery');
  const [isRideBooking, setIsRideBooking] = useState(false);

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

  const getBaseRideFare = (type: 'motorbike' | 'car' | 'scooter') => {
    switch (type) {
      case 'motorbike': return 15;
      case 'car': return 30;
      case 'scooter': return 12;
      default: return 15;
    }
  };

  const handlePlaceRideOrder = async () => {
    if (!ridePickup.trim() || !rideDropoff.trim()) {
      alert('กรุณาเลือกทั้งจุดรับและจุดส่งผู้โดยสารก่อนเรียกรถครับ');
      return;
    }
    if (ridePickup === rideDropoff) {
      alert('จุดรับและจุดส่งต้องไม่เป็นสถานที่เดียวกันครับ');
      return;
    }

    const orderId = 'ride-' + Math.random().toString(36).substr(2, 9);
    const baseFare = getBaseRideFare(vehicleType);
    const discount = activePromo ? activePromo.discount_amount : 0;
    const finalFare = Math.max(0, baseFare - discount);

    const vehicleName =
      vehicleType === 'motorbike'
        ? 'วินมอเตอร์ไซค์ ม.อ. (PSU Bike)'
        : vehicleType === 'car'
        ? 'รถยนต์ EV ม.อ. (PSU Car)'
        : 'สกู๊ตเตอร์ไฟฟ้า (EV Scooter)';
    const vehicleIcon = vehicleType === 'motorbike' ? '🏍️' : vehicleType === 'car' ? '🚗' : '🛴';

    const itemsDescription = `${vehicleIcon} ${vehicleName} | ผู้โดยสาร ${passengers} ท่าน ${
      rideNote.trim() ? `(${rideNote.trim()})` : ''
    }`;

    setIsRideBooking(true);
    try {
      const { error } = await supabase.from('orders').insert([
        {
          id: orderId,
          customer_id: user.id,
          customer_name: user.name,
          merchant_id: 'ride-hailing-service',
          merchant_name: vehicleName,
          items: itemsDescription + (activePromo ? ` (ใช้โค้ดส่วนลด ${activePromo.code}: -฿${discount})` : ''),
          total_price: finalFare,
          dest: rideDropoff.trim(),
          pickup_dest: ridePickup.trim(),
          order_type: 'ride',
          vehicle_type: vehicleType,
          passenger_count: passengers,
          status: 'finding_rider',
        },
      ]);

      if (error) throw error;

      setMessage(`เรียกรถเรียบร้อยแล้ว! ระบบกำลังค้นหาไรเดอร์ให้คุณ 🛵✨`);
      setActivePromo(null);
      setPromoCodeInput('');
      setRideNote('');
      setShowSuccessOverlay(true);
      setIsTrackerCollapsed(false);
      fetchCustomerOrders();
      setTimeout(() => setShowSuccessOverlay(false), 5000);
    } catch (err: any) {
      alert(`ไม่สามารถเรียกรถได้: ${err.message}`);
    } finally {
      setIsRideBooking(false);
    }
  };

  const handleMapPinSave = (fullDest: string, pinCoords: { x: number; y: number }, buildingName: string) => {
    if (mapTargetType === 'pickup') {
      setRidePickup(fullDest);
      setRidePickupCoords(pinCoords);
      setMessage(`ตั้งจุดรับผู้โดยสาร: "${buildingName}" 📍`);
    } else if (mapTargetType === 'dropoff') {
      setRideDropoff(fullDest);
      setRideDropoffCoords(pinCoords);
      setMessage(`ตั้งจุดส่งผู้โดยสาร: "${buildingName}" 🏁`);
    } else {
      setDeliveryDest(fullDest);
      setSelectedPinCoords(pinCoords);
      setSelectedBuilding(buildingName);
      setMessage(`ปักหมุดตำแหน่ง: "${buildingName}" แล้ว! 📍`);
    }
    setIsMapModalOpen(false);
    setTimeout(() => setMessage(null), 2500);
  };

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

  // Filter merchants based on category selection
  const filteredMerchants = merchants.filter((m) => {
    if (activeCategory === 'all') return true;
    return m.merchant_type === 'restaurant';
  });

  return (
    <div className="space-y-6 py-2 animate-fade-in">
      {/* Map Pinning Modal */}
      <MapPinModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSave={handleMapPinSave}
        initialBuilding={selectedBuilding}
        initialCoords={selectedPinCoords}
        title={
          mapTargetType === 'pickup'
            ? 'ปักหมุดจุดรับผู้โดยสาร'
            : mapTargetType === 'dropoff'
            ? 'ปักหมุดจุดส่งผู้โดยสาร'
            : 'GrabExpress PSU Campus'
        }
        subtitle={
          mapTargetType === 'pickup'
            ? 'เลือกหรือคลิกบนแผนที่ ม.อ. เพื่อกำหนดจุดให้ไรเดอร์ไปรับคุณ'
            : mapTargetType === 'dropoff'
            ? 'เลือกหรือคลิกบนแผนที่ ม.อ. เพื่อกำหนดจุดหมายปลายทาง'
            : 'เลือกตำแหน่งปักหมุดจัดส่งอาหารและสินค้าในวิทยาเขต'
        }
        targetType={mapTargetType}
      />

      {/* Main Service Mode Navigation Bar */}
      <div className="flex items-center justify-center sm:justify-start gap-3 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveServiceTab('food')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer ${
            activeServiceTab === 'food'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="text-lg">🍔</span>
          <span>สั่งอาหาร & มินิมาร์ท</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveServiceTab('ride')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all duration-300 cursor-pointer relative ${
            activeServiceTab === 'ride'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="text-lg">🛵</span>
          <span>เรียกรถเดินทาง ม.อ.</span>
          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
            NEW
          </span>
        </button>
      </div>

      {/* Dedicated View: Food & Mart View vs Ride Hailing View */}
      {activeServiceTab === 'food' ? (
        <CustomerFoodView
          user={user}
          deliveryDest={deliveryDest}
          onOpenMapModal={() => {
            setMapTargetType('delivery');
            setIsMapModalOpen(true);
          }}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          merchants={merchants}
          filteredMerchants={filteredMerchants}
          selectedMerchant={selectedMerchant}
          onSelectMerchant={(merchant) => {
            setSelectedMerchant(merchant);
            fetchSelectedMerchantProducts(merchant.id);
          }}
          onDeselectMerchant={() => setSelectedMerchant(null)}
          selectedMerchantProducts={selectedMerchantProducts}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onPlaceOrder={handlePlaceOrder}
          promoCodeInput={promoCodeInput}
          setPromoCodeInput={setPromoCodeInput}
          activePromo={activePromo}
          setActivePromo={setActivePromo}
          promoError={promoError}
          onApplyPromoCode={handleApplyPromoCode}
          setIsPromoModalOpen={setIsPromoModalOpen}
          adminPromoCodes={adminPromoCodes}
          merchantRatings={merchantRatings}
          selectedMerchantReviews={selectedMerchantReviews}
          merchantReviewsTab={merchantReviewsTab}
          setMerchantReviewsTab={setMerchantReviewsTab}
        />
      ) : (
        <CustomerRideView
          user={user}
          ridePickup={ridePickup}
          setRidePickup={setRidePickup}
          rideDropoff={rideDropoff}
          setRideDropoff={setRideDropoff}
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          passengers={passengers}
          setPassengers={setPassengers}
          rideNote={rideNote}
          setRideNote={setRideNote}
          promoCodeInput={promoCodeInput}
          setPromoCodeInput={setPromoCodeInput}
          activePromo={activePromo}
          setActivePromo={setActivePromo}
          promoError={promoError}
          onApplyPromoCode={handleApplyPromoCode}
          onPlaceRideOrder={handlePlaceRideOrder}
          isRideBooking={isRideBooking}
          getBaseRideFare={getBaseRideFare}
          onOpenMapForPickup={() => {
            setMapTargetType('pickup');
            setIsMapModalOpen(true);
          }}
          onOpenMapForDropoff={() => {
            setMapTargetType('dropoff');
            setIsMapModalOpen(true);
          }}
        />
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

              {/* Minimap Graphic - Real Live Google Maps View */}
              <div className="relative w-full h-[140px] bg-slate-200 border-b border-slate-200 overflow-hidden select-none">
                <iframe
                  title="Tracker Google Maps PSU Hat Yai"
                  width="100%"
                  height="100%"
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-85"
                  src="https://maps.google.com/maps?q=Prince%20of%20Songkla%20University%20Hat%20Yai&t=m&z=16&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                ></iframe>

                {/* Connecting path line SVG layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <line
                    x1={`${merchantCoords.x}%`}
                    y1={`${merchantCoords.y}%`}
                    x2={`${customerCoords.x}%`}
                    y2={`${customerCoords.y}%`}
                    stroke="#00B14F"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    className="opacity-90"
                  />
                </svg>

                {/* Merchant Location Pin */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${merchantCoords.x}%`, top: `${merchantCoords.y}%` }}
                >
                  <span className="text-base filter drop-shadow-md select-none">🏪</span>
                  <span className="text-[9px] font-bold text-slate-800 bg-white/95 px-1.5 py-0.5 rounded-md border border-slate-200 shadow-sm">
                    {order.merchant_name}
                  </span>
                </div>

                {/* Customer Location Pin */}
                <div
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${customerCoords.x}%`, top: `${customerCoords.y}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute animate-ping h-5 w-5 rounded-full bg-primary/40 opacity-75"></span>
                    <span className="text-lg relative filter drop-shadow-md select-none animate-bounce">📍</span>
                  </div>
                  <span className="text-[9px] font-bold text-primary-dark bg-white/95 px-1.5 py-0.5 rounded-md border border-primary/20 shadow-sm">
                    คุณ (จุดส่ง)
                  </span>
                </div>

                {/* Animated Rider Scooter Marker */}
                <div
                  className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ease-out"
                  style={{ left: `${riderCoords.x}%`, top: `${riderCoords.y}%` }}
                >
                  <div className="relative flex items-center justify-center bg-white border border-primary shadow-lg rounded-full w-8 h-8">
                    <span className="absolute animate-ping h-9 w-9 rounded-full bg-primary/30 opacity-60"></span>
                    <div className="text-base animate-pulse">
                      🛵
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap mt-0.5">
                    {order.rider_name ? `คุณ ${order.rider_name}` : 'กำลังหาไรเดอร์'}
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
