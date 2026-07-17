'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { supabase, isSupabaseConfigured } from './supabase';

const REST_EMOJIS = ['🍔', '🍕', '🍜', '🍛', '🍱', '🥗', '🥤', '🍵', '🍰', '🍨', '🍳', '🍗'];
const MART_EMOJIS = ['🥤', '🥛', '🍪', '🍫', '🍜', '🧴', '🧼', '🧻', '🔋', '🩹', '🧺', '🍎'];

export default function Home() {
  const { user, loading, logout } = useAuth();

  // Custom states for interactive features
  const [activeCategory, setActiveCategory] = useState<'all' | 'food'>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [dbError, setDbError] = useState<boolean>(false);

  // Customer states
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

  // Carousel states for recommended shops
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const recommended = merchants.filter(m => m.is_partner === true);

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

  // Merchant states
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [merchantOrders, setMerchantOrders] = useState<any[]>([]);
  const [merchantRevenue, setMerchantRevenue] = useState<number>(0);
  const [selectedEmoji, setSelectedEmoji] = useState('🍔');

  useEffect(() => {
    if (user && user.role === 'merchant') {
      setSelectedEmoji(user.merchantType === 'restaurant' ? '🍔' : '🥤');
    }
  }, [user]);

  // Rider states
  const [riderJobs, setRiderJobs] = useState<any[]>([]);
  const [riderHistory, setRiderHistory] = useState<any[]>([]);
  const [riderWallet, setRiderWallet] = useState<number>(0);

  // Admin states
  const [adminPromoCodes, setAdminPromoCodes] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');

  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantEmail, setNewMerchantEmail] = useState('');
  const [newMerchantPhone, setNewMerchantPhone] = useState('');
  const [newMerchantShopName, setNewMerchantShopName] = useState('');
  const [newMerchantType, setNewMerchantType] = useState<'restaurant' | 'minimart'>('restaurant');
  const [newMerchantPassword, setNewMerchantPassword] = useState('');

  // -------------------------------------------------------------
  // CUSTOMER ACTIONS & SYNC
  // -------------------------------------------------------------
  const fetchMerchants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'merchant');
      if (error) throw error;
      setMerchants(data || []);
      setDbError(false);
    } catch (err: any) {
      console.error('Failed to fetch merchants:', err.message || err);
      setDbError(true);
    }
  };

  const fetchSelectedMerchantProducts = async (merchantId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId);
      if (error) throw error;
      setSelectedMerchantProducts(data || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err.message || err);
    }
  };

  const fetchCustomerOrders = async () => {
    if (!user) return;
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

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    setMessage(`เพิ่ม "${product.name}" ใส่ตะกร้าแล้ว`);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedMerchant || cart.length === 0) return;
    if (!deliveryDest.trim()) {
      alert('ใส่ที่อยู่จัดส่งด้วยนะ');
      return;
    }

    const orderId = 'ord-' + Math.random().toString(36).substr(2, 9);
    const itemsText = cart.map(item => `${item.name} (${item.quantity}x)`).join(', ');
    const discount = activePromo ? activePromo.discount_amount : 0;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Math.max(0, subtotal - discount) + 15; // ฿15 delivery fee

    try {
      const { error } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          customer_id: user.id,
          customer_name: user.name,
          merchant_id: selectedMerchant.id,
          merchant_name: selectedMerchant.shopName || selectedMerchant.name,
          items: itemsText + (activePromo ? ` (ใช้ส่วนลด ${activePromo.code}: -฿${discount})` : ''),
          total_price: total,
          dest: deliveryDest.trim(),
          status: 'pending'
        }]);

      if (error) throw error;

      setCart([]);
      setDeliveryDest('');
      setSelectedMerchant(null);
      setActivePromo(null);
      setPromoCodeInput('');
      setShowSuccessOverlay(true);
      fetchCustomerOrders();
      setTimeout(() => setShowSuccessOverlay(false), 4000);
    } catch (err: any) {
      alert(`สั่งไม่ได้: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // MERCHANT ACTIONS & SYNC
  // -------------------------------------------------------------
  const fetchMerchantProducts = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', user.id);
      if (error) throw error;
      setMerchantProducts(data || []);
    } catch (err) {
      console.error('Failed to fetch merchant products', err);
    }
  };

  const fetchMerchantOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMerchantOrders(data || []);

      // Calculate revenue
      const totalRev = (data || [])
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + o.total_price - 15, 0); // subtract delivery fee
      setMerchantRevenue(totalRev);
    } catch (err) {
      console.error('Failed to fetch merchant orders', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProductName || !newProductPrice) return;
    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price <= 0) {
      alert('ใส่ราคาให้ถูกต้องด้วยนะ');
      return;
    }

    const prodId = 'prod-' + Math.random().toString(36).substr(2, 9);
    const fullName = `${selectedEmoji} ${newProductName.trim()}`;
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          id: prodId,
          merchant_id: user.id,
          name: fullName,
          price: price
        }]);

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
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setMessage(`ลบ "${name}" แล้ว`);
      fetchMerchantProducts();
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      alert(`ลบไม่ได้: ${err.message}`);
    }
  };

  const handleMerchantUpdateStatus = async (orderId: string, nextStatus: 'preparing' | 'calling_rider', items: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      if (error) throw error;

      setMessage(nextStatus === 'preparing' ? `รับออเดอร์ "${items}" แล้ว` : `เตรียมของเสร็จ! เรียกไรเดอร์มารับ 🛵`);
      fetchMerchantOrders();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่ได้: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // RIDER ACTIONS & SYNC
  // -------------------------------------------------------------
  const fetchRiderJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'calling_rider')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRiderJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch rider jobs', err);
    }
  };

  const fetchRiderHistory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('rider_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRiderHistory(data || []);

      // Rider earns delivery fee (฿15 per delivery)
      const walletSum = (data || [])
        .filter((o: any) => o.status === 'completed')
        .length * 15;
      setRiderWallet(walletSum);
    } catch (err) {
      console.error('Failed to fetch rider history', err);
    }
  };

  const handleRiderAcceptJob = async (orderId: string, title: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivering',
          rider_id: user.id,
          rider_name: user.name
        })
        .eq('id', orderId);
      if (error) throw error;

      setMessage(`รับงานแล้ว! กำลังไปรับของที่ร้าน 🛵`);
      fetchRiderJobs();
      fetchRiderHistory();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`รับงานไม่ได้: ${err.message}`);
    }
  };

  const handleRiderCompleteJob = async (orderId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
      if (error) throw error;

      setMessage(`ส่งเสร็จ! "${title}" — ได้ค่าส่ง ฿15 💰`);
      fetchRiderJobs();
      fetchRiderHistory();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่ได้: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // ADMIN & PROMO ACTIONS
  // -------------------------------------------------------------
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

  const handleApplyPromo = async () => {
    setPromoError(null);
    if (!promoCodeInput.trim()) return;

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCodeInput.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActivePromo(data);
        setMessage(`ใช้โค้ด "${data.code}" แล้ว! ลด ฿${data.discount_amount}`);
        setTimeout(() => setMessage(null), 3000);
      } else {
        setPromoError('โค้ดนี้ไม่ถูกต้อง หรือหมดอายุแล้ว');
      }
    } catch (err: any) {
      setPromoError('เช็คโค้ดไม่ได้ ลองใหม่อีกที');
    }
  };

  const handleAdminAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantName || !newMerchantEmail || !newMerchantPhone || !newMerchantShopName || !newMerchantPassword) {
      alert('กรอกข้อมูลร้านค้าให้ครบก่อนนะ');
      return;
    }

    const merchantId = 'merch-' + Math.random().toString(36).substr(2, 9);
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id: merchantId,
          name: newMerchantName.trim(),
          email: newMerchantEmail.trim(),
          phone: newMerchantPhone.trim(),
          role: 'merchant',
          shop_name: newMerchantShopName.trim(),
          merchant_type: newMerchantType,
          password: newMerchantPassword,
          is_partner: true
        }]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('promo_codes')
        .insert([{
          code: newPromoCode.trim().toUpperCase(),
          discount_amount: discount,
          description: newPromoDesc.trim() || null
        }]);

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
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('code', code);
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
      const { error } = await supabase
        .from('profiles')
        .update({ is_partner: newStatus })
        .eq('id', merchantId);

      if (error) throw error;

      setMessage(`อัปเดตสถานะร้านแล้ว!`);
      fetchMerchants();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(`อัปเดตไม่ได้: ${err.message}`);
    }
  };

  const handleWithdraw = () => {
    const amount = user?.role === 'rider' ? riderWallet : merchantRevenue;
    if (amount <= 0) {
      alert('ยอดเงินไม่พอถอน');
      return;
    }
    alert(`ถอนเงิน ฿${amount} เข้าบัญชีแล้ว!`);
    // Local simulation reset for withdraw
    if (user?.role === 'rider') setRiderWallet(0);
    else setMerchantRevenue(0);
  };

  // -------------------------------------------------------------
  // REAL-TIME DATABASE SUBSCRIPTIONS & EFFECT LOADS
  // -------------------------------------------------------------
  useEffect(() => {
    if (loading) return;

    // Load initial data
    if (!user) {
      fetchMerchants();
    } else {
      if (user.role === 'customer') {
        fetchMerchants();
        fetchCustomerOrders();
        fetchPromoCodes();
      } else if (user.role === 'merchant') {
        fetchMerchantProducts();
        fetchMerchantOrders();
      } else if (user.role === 'rider') {
        fetchRiderJobs();
        fetchRiderHistory();
      } else if (user.role === 'admin') {
        fetchMerchants();
        fetchPromoCodes();
      }
    }

    // Subscribe to all changes in orders table to update statuses across screens
    const ordersChannel = supabase
      .channel('orders-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (!user) return;

        // Refresh states depending on user role
        if (user.role === 'customer') {
          fetchCustomerOrders();
        } else if (user.role === 'merchant') {
          fetchMerchantOrders();
        } else if (user.role === 'rider') {
          fetchRiderJobs();
          fetchRiderHistory();
        }
      })
      .subscribe();

    // Subscribe to all changes in promo_codes table
    const promosChannel = supabase
      .channel('promos-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, (payload) => {
        if (user && (user.role === 'admin' || user.role === 'customer')) {
          fetchPromoCodes();
        }
      })
      .subscribe();

    // Subscribe to all changes in profiles table (to sync merchants)
    const profilesChannel = supabase
      .channel('profiles-realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        fetchMerchants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(promosChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, loading]);

  // Loading skeleton screen
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-slate-500 animate-pulse">กำลังเชื่อมต่อข้อมูล PSU Grab...</span>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-slate-800 flex flex-col antialiased font-sans">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-150 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-primary tracking-tight flex items-center gap-2 hover:scale-[1.02] transition duration-200">
              PSU Grab <span className="text-xl">🛵</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-slate-850">{user.name}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${user.role === 'customer'
                    ? 'bg-primary-light text-primary border border-primary-light/40'
                    : user.role === 'rider'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : user.role === 'admin'
                        ? 'bg-purple-50 text-purple-600 border border-purple-100'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                    {user.role === 'customer'
                      ? 'ลูกค้า'
                      : user.role === 'rider'
                        ? 'คนขับ / ไรเดอร์'
                        : user.role === 'admin'
                          ? 'ผู้ดูแลระบบหลัก'
                          : `ร้าน: ${user.shopName} (${user.merchantType === 'restaurant' ? 'อาหาร' : 'มาร์ท'})`}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition duration-300 cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary-light rounded-xl transition duration-300"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2.5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-emerald-100/50 hover:shadow-lg transition duration-300"
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border border-blue-500 animate-fade-in text-sm font-semibold max-w-md w-[90%] justify-center">
          <svg className="w-5 h-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Database Setup Warning */}
      {!isSupabaseConfigured ? (
        <div className="bg-amber-50 border-y border-amber-200 py-4.5 text-center text-xs text-amber-800 font-bold flex flex-col items-center justify-center gap-1.5 animate-fade-in">
          <span className="text-sm">⚠️ ยังไม่ได้ตั้งค่า Supabase ในไฟล์ .env.local</span>
          <span className="font-normal text-slate-500">กด <b>Ctrl + C</b> ใน Terminal แล้วรัน <b>npm run dev</b> ใหม่อีกทีนะ</span>
        </div>
      ) : dbError ? (
        <div className="bg-red-50 border-y border-red-200 py-4.5 text-center text-xs text-red-700 font-bold flex flex-col items-center justify-center gap-1.5 animate-fade-in">
          <span>⚠️ เชื่อมต่อ Supabase ไม่ได้</span>
          <span className="font-normal text-slate-500">ลองเช็คว่า: 1. ปิด Ad-blocker แล้วหรือยัง (มันอาจบล็อก *.supabase.co) 2. รัน SQL สร้างตารางแล้วรึเปล่า</span>
          <Link href="/schema.sql" className="underline hover:text-red-900 font-bold">ดูสคริปต์ SQL ของโปรเจกต์</Link>
        </div>
      ) : null}

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">

        {/* CASE 1: GUEST VIEW (NOT LOGGED IN) */}
        {!user && (
          <div className="space-y-10 py-4 animate-fade-in">
            {/* Grab Style Banner Card */}
            <div className="bg-gradient-to-br from-primary via-primary-hover to-primary-dark rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-8">
              <div className="absolute right-0 top-0 opacity-15 pointer-events-none translate-x-20 -translate-y-20">
                <svg width="400" height="400" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" /></svg>
              </div>
              <div className="absolute left-1/3 bottom-0 opacity-10 pointer-events-none translate-y-16">
                <svg width="200" height="200" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="white" /></svg>
              </div>

              <div className="relative z-10 space-y-5 lg:max-w-xl text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/10">
                  📍 เชื่อมต่อแบบเรียลไทม์
                </span>
                <h1 className="text-3xl md:text-5xl font-black leading-tight">
                  สั่งอาหารก็ง่าย <br className="hidden md:inline" />
                  เดินทางก็สบายกับ <span className="underline decoration-wavy decoration-yellow-400">PSU Grab</span>
                </h1>
                <p className="text-emerald-50 text-sm md:text-base font-medium leading-relaxed">
                  ลูกค้าสั่ง ➔ ร้านค้ารับออเดอร์ ➔ ไรเดอร์ส่งถึงที่
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-white hover:bg-[#F7F9FA] text-primary font-extrabold rounded-2xl text-center shadow-lg transition hover:-translate-y-0.5 duration-300"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register"
                    className="px-8 py-4 bg-primary-light0/30 hover:bg-primary-light0/50 text-white font-extrabold rounded-2xl text-center border border-white/20 transition hover:-translate-y-0.5 duration-300"
                  >
                    สมัครสมาชิกร้านค้า / ไรเดอร์
                  </Link>
                </div>
              </div>

              {/* Grab app mock view block */}
              <div className="relative z-10 w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-150 self-stretch flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-primary bg-primary-light px-2.5 py-1 rounded-lg">PSU Grab</span>
                    <span className="text-[11px] font-semibold text-slate-400">ล็อกอินเพื่อใช้งาน</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2 text-slate-400 text-xs border border-slate-200/50">
                    <span>🔍</span>
                    <span>ค้นหาร้านอาหาร หรือจุดรับส่งใน ม.อ.</span>
                  </div>
                </div>

                {/* 4-Item Quick Grid */}
                <div className="grid grid-cols-4 gap-3 my-6">
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-primary-light group-hover:bg-blue-100 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🍔</div>
                    <span className="text-[11px] font-bold text-slate-600">สั่งอาหาร</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-primary-light group-hover:bg-blue-100 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🛵</div>
                    <span className="text-[11px] font-bold text-slate-600">เรียกรถ</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-primary-light group-hover:bg-blue-100 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">📦</div>
                    <span className="text-[11px] font-bold text-slate-600">ส่งของ</span>
                  </Link>
                  <Link href="/login" className="flex flex-col items-center gap-1.5 group">
                    <div className="w-12 h-12 bg-primary-light group-hover:bg-blue-100 text-primary rounded-2xl flex items-center justify-center text-2xl transition duration-300 shadow-sm">🛒</div>
                    <span className="text-[11px] font-bold text-slate-600">มาร์ท</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-semibold">อัปเดตแบบเรียลไทม์</span>
                  <Link href="/login" className="text-xs font-bold text-primary hover:underline">ล็อกอิน →</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: CUSTOMER DASHBOARD */}
        {user && user.role === 'customer' && (
          <div className="space-y-8 py-2 animate-fade-in">
            {/* Header profile */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-primary bg-primary-light px-3 py-1 rounded-lg">ลูกค้า</span>
                <h2 className="text-2xl font-black text-slate-800 mt-2">สวัสดี {user.name} 👋</h2>
                <p className="text-xs text-slate-400">เลือกร้านที่ชอบแล้วสั่งได้เลย!</p>
              </div>
            </div>

            {/* Campus Promo Codes Carousel/Section */}
            {adminPromoCodes.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/80 space-y-3.5 animate-slide-up">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <span>🎟️</span> คูปองส่วนลดและข้อเสนอพิเศษวันนี้ (Offers & Promos)
                  </h3>
                  <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                    มี {adminPromoCodes.length} ข้อเสนอแนะนำ
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminPromoCodes.map(promo => (
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
                        <span className="text-[8px] font-black tracking-widest uppercase opacity-75 mt-1">PROMO</span>
                        {/* Dashed line on the right boundary */}
                        <div className="absolute right-0 top-0 bottom-0 border-r border-dashed border-white/30"></div>
                      </div>

                      {/* Ticket Circular Cutouts (Circle punches) */}
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
                        <p className="text-[10px] text-slate-400 font-semibold leading-tight">{promo.description || 'ใช้ส่วนลดสำหรับสินค้าในวิทยาเขต ม.อ.'}</p>
                        <span className="text-[8px] text-slate-400 block pt-0.5 font-medium">⏳ คูปองแนะนำพิเศษสำหรับสิทธิ์ล็อกอินนี้</span>
                      </div>

                      {/* Apply button / Checkbox */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 shrink-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${activePromo?.code === promo.code
                          ? 'border-blue-600 bg-primary text-white'
                          : 'border-slate-300 group-hover:border-blue-400 bg-white'
                          }`}>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Stores & Cart */}
              <div className="lg:col-span-8 space-y-6">

                {/* 1. Shop list or Selected Shop Products */}
                {!selectedMerchant ? (
                  <div className="space-y-8 animate-fade-in">
                    {/* 1. Recommended Shops Section */}
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
                              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-100 shadow-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
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
                                transform: `translateX(-${carouselIndex * (isMobile ? 100 : 50)}%)`
                              }}
                            >
                              {recommended.map((merchant) => (
                                <div
                                  key={merchant.id}
                                  className="w-full md:w-1/2 shrink-0 px-2"
                                >
                                  <div
                                    onClick={() => {
                                      setSelectedMerchant(merchant);
                                      fetchSelectedMerchantProducts(merchant.id);
                                    }}
                                    className="bg-[#FFFDF9] rounded-3xl p-6 border border-amber-250/60 glow-gold hover:-translate-y-1 transition-all duration-300 flex items-center justify-between cursor-pointer group relative overflow-hidden h-full min-h-[110px]"
                                  >
                                    {/* Decorative gold background gradient flare */}
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-100/30 rounded-full blur-xl pointer-events-none -mr-8 -mt-8 transition-all group-hover:scale-125"></div>

                                    <div className="flex items-center gap-4 relative z-10">
                                      <span className="w-14 h-14 rounded-2xl bg-amber-100/50 group-hover:bg-amber-200/60 text-3xl flex items-center justify-center transition duration-300 ring-4 ring-amber-50">
                                        {merchant.merchant_type === 'restaurant' ? '🍔' : '🛒'}
                                      </span>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-sm font-black text-slate-850 group-hover:text-amber-700 transition">
                                            {merchant.shop_name || merchant.name}
                                          </h4>
                                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider scale-95 origin-left">
                                            แนะนำ ⭐
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-semibold">
                                          <span className={merchant.merchant_type === 'restaurant' ? 'text-indigo-650' : 'text-amber-655'}>
                                            {merchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                                          </span>
                                          <span>•</span>
                                          <span className="text-amber-500">⭐ 4.9</span>
                                          <span>•</span>
                                          <span>⏳ 10-20 นาที (ส่งไว)</span>
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
                              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-100 shadow-md hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs font-bold transition-all opacity-0 group-hover/carousel:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                              title="ถัดไป"
                            >
                              ❯
                            </button>
                          )}
                        </div>

                        {/* Page Indicator Dots */}
                        {recommended.length > (isMobile ? 1 : 2) && (
                          <div className="flex justify-center gap-1.5 pt-2">
                            {Array.from({ length: (isMobile ? recommended.length : recommended.length - 1) }).map((_, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setCarouselIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${carouselIndex === idx ? 'bg-amber-500 w-4' : 'bg-slate-200'
                                  }`}
                                title={`หน้า ${idx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 2. All Campus Shops Section */}
                    <div className="space-y-4">
                      <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                        <span>🏪</span> ร้านค้าทั้งหมดในมหาลัย (All Campus Shops)
                      </h3>
                      {merchants.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-xs text-slate-400">
                          ยังไม่มีร้านค้าในระบบตอนนี้
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {merchants.map((merchant) => {
                            const isRecommended = merchant.is_partner === true;
                            return (
                              <div
                                key={merchant.id}
                                onClick={() => {
                                  setSelectedMerchant(merchant);
                                  fetchSelectedMerchantProducts(merchant.id);
                                }}
                                className={`bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between cursor-pointer group ${isRecommended ? 'border-amber-100 hover:border-amber-250 bg-amber-50/5' : 'border-slate-100/80 hover:border-slate-200'
                                  }`}
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center transition duration-300 ${isRecommended ? 'bg-amber-100/40 group-hover:bg-amber-100/70' : 'bg-primary-light/50 group-hover:bg-primary-light'
                                    }`}>
                                    {merchant.merchant_type === 'restaurant' ? '🍔' : '🛒'}
                                  </span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-sm font-black text-slate-800 group-hover:text-primary transition">
                                        {merchant.shop_name || merchant.name}
                                      </h4>
                                      {isRecommended && (
                                        <span className="text-[8px] font-extrabold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded uppercase scale-90">
                                          แนะนำ
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-semibold">
                                      <span className={merchant.merchant_type === 'restaurant' ? 'text-indigo-650' : 'text-amber-655'}>
                                        {merchant.merchant_type === 'restaurant' ? '🍴 ร้านอาหาร' : '🛍️ มินิมาร์ท'}
                                      </span>
                                      <span>•</span>
                                      <span className="text-amber-500">⭐ 4.8</span>
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
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedMerchant(null)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5"
                      >
                        ← ย้อนกลับไปเลือกร้านค้า
                      </button>
                      <h3 className="text-sm font-black text-primary uppercase">
                        {selectedMerchant.shop_name || selectedMerchant.name}
                      </h3>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายการสินค้าในร้าน:</h4>
                      {selectedMerchantProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">ไม่มีรายการสินค้าจัดแสดงในขณะนี้</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {selectedMerchantProducts.map((prod) => (
                            <div key={prod.id} className="py-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-bold text-slate-700">{prod.name}</p>
                                <p className="font-bold text-primary mt-0.5">฿{prod.price}</p>
                              </div>
                              <button
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
                  </div>
                )}
              </div>

              {/* Right Column: Checkout Cart & Active Orders Feed */}
              <div className="lg:col-span-4 space-y-6">

                {/* Checkout Cart Container */}
                {cart.length > 0 && (
                  <div id="checkout-cart" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4 animate-slide-up scroll-mt-20">
                    <h3 className="text-sm font-black text-slate-850 pb-2 border-b border-slate-100">
                      🛒 ตะกร้าสินค้าของคุณ ({selectedMerchant?.shop_name || selectedMerchant?.name})
                    </h3>
                    <div className="divide-y divide-slate-100 text-xs">
                      {cart.map((item) => (
                        <div key={item.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-700">{item.name}</p>
                            <p className="text-[10px] text-slate-400">{item.quantity}x • ฿{item.price * item.quantity}</p>
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
                        <div className="flex justify-between text-emerald-600 font-bold">
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
                        <span>฿{Math.max(0, cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - (activePromo ? activePromo.discount_amount : 0)) + 15}</span>
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
                              <span className="text-primary font-black">ลดแล้ว ฿{activePromo.discount_amount}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-extrabold">ใช้คูปองเพื่อรับส่วนลด (Offers & Promos)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 shrink-0">
                          {activePromo ? (
                            <span className="text-[9px] text-primary font-bold bg-primary-light border border-primary-light/40 px-2 py-0.5 rounded-lg group-hover:bg-blue-100">เปลี่ยน</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold bg-slate-200/50 px-2 py-0.5 rounded-lg group-hover:bg-slate-200">เลือก</span>
                          )}
                          <span className="text-slate-400 font-medium">❯</span>
                        </div>
                      </button>
                    </div>

                    {/* Delivery Destination Input */}
                    <div className="space-y-1 pt-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ระบุปลายทางรับของใน ม.อ. <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={deliveryDest}
                        onChange={(e) => setDeliveryDest(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
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

                {/* Customer Active Orders Tracker */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-850 pb-2 border-b border-slate-100">
                    🔔 ออเดอร์และสถานะเดินทางสด (Real-time Tracker)
                  </h3>
                  {customerOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">ไม่มีรายการออเดอร์ในปัจจุบัน</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="py-4 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{order.merchant_name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${order.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : order.status === 'preparing'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                : order.status === 'calling_rider'
                                  ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                  : order.status === 'delivering'
                                    ? 'bg-primary-light text-primary border border-primary-light/40 animate-pulse'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
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
                    <span>฿{Math.max(0, cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - (activePromo ? activePromo.discount_amount : 0)) + 15}</span>
                    <span>❯</span>
                  </div>
                </button>
              </div>
            )}

          </div>
        )}

        {/* CASE 3: RIDER DASHBOARD */}
        {user && user.role === 'rider' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in">
            {/* Left stats */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center space-y-5">
                <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto text-3xl font-bold">🛵</div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{user.name}</h3>
                  <p className="text-[10px] font-bold text-primary bg-primary-light px-3 py-1 rounded-full inline-block mt-1 uppercase">
                    ไรเดอร์
                  </p>
                </div>

                <div className="bg-[#F7F9FA] border border-slate-100 rounded-2xl p-5 text-left space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">กระเป๋าเงิน</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black text-primary">฿{riderWallet.toLocaleString()}</span>
                    <button
                      onClick={handleWithdraw}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      ถอนรายได้ →
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-850">สรุปงานวันนี้</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F7F9FA] p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">ส่งสำเร็จ</p>
                    <p className="text-lg font-black text-slate-850">
                      {riderHistory.filter(o => o.status === 'completed').length} งาน
                    </p>
                  </div>
                  <div className="bg-[#F7F9FA] p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 mb-0.5">คะแนนสะสม</p>
                    <p className="text-lg font-black text-slate-850">5.0 ★</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Feed (Available Jobs & active jobs) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Rider Active Jobs */}
              {riderHistory.some(o => o.status === 'delivering') && (
                <div className="bg-white rounded-3xl p-6 border-2 border-blue-500 shadow-md space-y-4 animate-slide-up">
                  <h3 className="text-sm font-black text-primary uppercase flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-light0"></span>
                    </span>
                    กำลังส่งอยู่ตอนนี้
                  </h3>

                  {riderHistory.filter(o => o.status === 'delivering').map((activeOrder) => (
                    <div key={activeOrder.id} className="p-5 border border-primary-light/40 bg-primary-light/20 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-black text-slate-850 text-sm">รับของที่: {activeOrder.merchant_name}</p>
                        <p className="font-semibold text-slate-500">นำไปส่งที่: {activeOrder.dest}</p>
                        <p className="text-slate-400">รายการสั่งซื้อ: {activeOrder.items}</p>
                        <p className="text-slate-400">ชื่อลูกค้า: คุณ {activeOrder.customer_name}</p>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-[9px] text-slate-400 block font-bold">ค่าตอบแทน</span>
                          <span className="text-base font-black text-primary">฿15.00</span>
                        </div>
                        <button
                          onClick={() => handleRiderCompleteJob(activeOrder.id, activeOrder.merchant_name)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-emerald-100"
                        >
                          ✓ ส่งเสร็จแล้ว
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rider Available Jobs Feed */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <span>📦</span> งานที่รอรับ
                    {riderJobs.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        {riderJobs.length} งานใหม่
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400">อัปเดตสด</span>
                </div>

                {riderJobs.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                    <span className="text-4xl">😴</span>
                    <p className="text-sm font-bold text-slate-600">ไม่มีงานว่างอยู่ในขณะนี้</p>
                    <p className="text-xs text-slate-400">พอมีออเดอร์ใหม่จะขึ้นตรงนี้เลย</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riderJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-5 border border-slate-100 bg-[#F7F9FA]/50 hover:bg-[#F7F9FA] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300"
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary-light text-primary border border-primary-light/40">
                              สั่งซื้อสินค้า / อาหาร
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">ยอดซื้อรวม: ฿{job.total_price}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-850">ร้านค้า: {job.merchant_name}</h4>
                          <p className="text-slate-500">ปลายทางจัดส่ง: {job.dest}</p>
                          <p className="text-slate-400">รายการของ: {job.items}</p>
                        </div>
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          <div className="text-left md:text-right">
                            <span className="text-[9px] text-slate-400 font-bold block">คุณจะได้ค่าส่ง</span>
                            <span className="text-lg font-black text-primary">฿15</span>
                          </div>
                          <button
                            onClick={() => handleRiderAcceptJob(job.id, job.merchant_name)}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition cursor-pointer shadow shadow-emerald-100/50"
                          >
                            กดรับงานนี้
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rider Completed history */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">ประวัติการวิ่งงานวันนี้ของคุณ</h3>
                <div className="divide-y divide-slate-100">
                  {riderHistory.filter(o => o.status === 'completed').map((historyItem) => (
                    <div key={historyItem.id} className="py-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✓</span>
                        <div>
                          <p className="font-bold text-slate-700">ส่งสำเร็จ: {historyItem.merchant_name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">ปลายทาง: {historyItem.dest} • {historyItem.items}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-primary">+฿15</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* CASE 4: MERCHANT DASHBOARD */}
        {user && user.role === 'merchant' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in">
            {/* Left Column: Store Profile & Add Product Form */}
            <div className="lg:col-span-4 space-y-6">
              {/* Store Profile Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                  {user.merchantType === 'restaurant' ? '🍔' : '🛒'}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    พาร์ทเนอร์: {user.merchantType === 'restaurant' ? 'ร้านอาหาร' : 'มินิมาร์ท'}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 mt-3">{user.shopName}</h3>
                  <p className="text-xs text-slate-400 mt-1">ผู้ดูแลร้าน: {user.name}</p>
                </div>

                <div className="bg-[#F7F9FA] border border-slate-100 rounded-2xl p-4 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">รายได้การขายสะสม (ถอนออกได้)</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-2xl font-black text-indigo-600">฿{merchantRevenue.toLocaleString()}</span>
                    <button
                      onClick={handleWithdraw}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      ถอนเงิน →
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Product Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h4 className="text-sm font-black text-slate-850 pb-2 border-b border-slate-100">
                  ➕ เพิ่มรายการ {user.merchantType === 'restaurant' ? 'เมนูอาหาร' : 'สินค้ามินิมาร์ท'}
                </h4>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  {/* Emoji Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      เลือกอิโมจิประจำรายการ
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#F7F9FA] rounded-2xl border border-slate-150">
                      {(user.merchantType === 'restaurant' ? REST_EMOJIS : MART_EMOJIS).map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition hover:scale-110 cursor-pointer ${selectedEmoji === emoji
                            ? 'bg-indigo-600 shadow text-white font-bold scale-105'
                            : 'bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">ชื่อสินค้า / เมนู</label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder={user.merchantType === 'restaurant' ? 'เช่น ผัดซีอิ๊วหมู, น้ำเก๊กฮวย' : 'เช่น ผงซักฟอก, น้ำอัดลมกระป๋อง'}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">ราคาขาย (บาท)</label>
                    <input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="เช่น 55"
                      min="1"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer shadow-md shadow-indigo-100"
                  >
                    เพิ่มสินค้าเข้าหน้าร้าน
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Menu List & Simulated Orders Feed */}
            <div className="lg:col-span-8 space-y-6">

              {/* Product List Manager */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center">
                  <span>📋 สินค้าในหน้าร้านทั้งหมด</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {merchantProducts.length} รายการ
                  </span>
                </h3>

                {merchantProducts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    ไม่มีสินค้าในหน้าร้าน กรุณาเพิ่มรายการด้านซ้าย
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {merchantProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-4 border border-slate-100 bg-[#F7F9FA]/30 rounded-2xl flex justify-between items-center hover:bg-[#F7F9FA] transition duration-300"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-700">{prod.name}</p>
                          <p className="text-xs font-black text-primary">฿{prod.price}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition text-xs font-bold cursor-pointer"
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
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">
                  🔔 รายการสั่งซื้อสินค้า/อาหารที่เข้าหน้าร้าน (Real-time Order Desk)
                </h3>

                <div className="space-y-3">
                  {merchantOrders.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">ยังไม่มีลูกค้ายื่นคำสั่งซื้อเข้ามาในขณะนี้</p>
                  ) : (
                    merchantOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition duration-300 ${ord.status === 'completed'
                          ? 'border-slate-100 bg-[#F7F9FA]/20 opacity-70'
                          : 'border-indigo-100 bg-indigo-50/10'
                          }`}
                      >
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-600">
                              #00{ord.id.substr(-4)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">ปลายทางจัดส่ง: {ord.dest}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-850">{ord.items}</h4>
                          <p className="text-xs text-slate-500">
                            ยอดรวมร้านค้า: <b>฿{ord.total_price - 15}</b> (+ ค่าส่งไรเดอร์ ฿15) • ชื่อลูกค้า: <b>คุณ {ord.customer_name}</b>
                          </p>
                        </div>

                        {/* Interactive order steps */}
                        <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto text-right">
                          {ord.status === 'pending' && (
                            <button
                              onClick={() => handleMerchantUpdateStatus(ord.id, 'preparing', ord.items)}
                              className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer shadow shadow-indigo-100"
                            >
                              รับออเดอร์นี้
                            </button>
                          )}
                          {ord.status === 'preparing' && (
                            <button
                              onClick={() => handleMerchantUpdateStatus(ord.id, 'calling_rider', ord.items)}
                              className="w-full md:w-auto px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition duration-300 cursor-pointer shadow shadow-indigo-100"
                            >
                              จัดเตรียมเสร็จสิ้น (เรียกไรเดอร์)
                            </button>
                          )}
                          {ord.status === 'calling_rider' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                              ไรเดอร์กำลังรับงานและเดินทางมารับของ...
                            </span>
                          )}
                          {ord.status === 'delivering' && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-light px-3 py-2 rounded-xl">
                              🏍️ ไรเดอร์กำลังเดินทางนำส่ง ({ord.rider_name || 'พาร์ทเนอร์'})
                            </span>
                          )}
                          {ord.status === 'completed' && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 inline-block">
                              จัดส่งสำเร็จ ได้รับเงินแล้ว
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
        )}

        {/* CASE 5: ADMIN DASHBOARD */}
        {user && user.role === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-2 animate-fade-in">

            {/* Left Column: Admin Profile & Add Merchant Partner */}
            <div className="lg:col-span-5 space-y-6">

              {/* Admin Profile Card */}
              <div className="bg-gradient-to-br from-indigo-700 to-blue-800 rounded-3xl p-6 text-white shadow-md text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto text-3xl font-bold border border-white/20">
                  ⚙️
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-200 bg-white/10 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    แอดมิน
                  </span>
                  <h3 className="text-xl font-black mt-3">{user.name}</h3>
                  <p className="text-xs text-blue-200 mt-1">อีเมลติดต่อ: {user.email}</p>
                </div>
              </div>

              {/* Add Merchant Partner Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  🏢 <span>เพิ่มร้านค้าใหม่</span>
                </h4>
                <form onSubmit={handleAdminAddMerchant} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">ชื่อร้านค้า (Shop Name)</label>
                    <input
                      type="text"
                      value={newMerchantShopName}
                      onChange={(e) => setNewMerchantShopName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="เช่น ข้าวมันไก่ป้าแต๋ว, หอหญิงมินิมาร์ท"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">ชื่อผู้ดูแลร้าน (Owner Name)</label>
                      <input
                        type="text"
                        value={newMerchantName}
                        onChange={(e) => setNewMerchantName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                        placeholder="เช่น สมพร รักดี"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">เบอร์โทรศัพท์ (Phone)</label>
                      <input
                        type="text"
                        value={newMerchantPhone}
                        onChange={(e) => setNewMerchantPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                        placeholder="เช่น 0812345678"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">ประเภทบริการ (Merchant Type)</label>
                    <select
                      value={newMerchantType}
                      onChange={(e) => setNewMerchantType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition cursor-pointer"
                    >
                      <option value="restaurant">🍴 ร้านอาหารพาร์ทเนอร์ (Restaurant)</option>
                      <option value="minimart">🛒 ร้านสะดวกซื้อพาร์ทเนอร์ (Minimart)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">อีเมลล็อกอิน (Login Email)</label>
                    <input
                      type="email"
                      value={newMerchantEmail}
                      onChange={(e) => setNewMerchantEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="เช่น shopname@gmail.com"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">รหัสผ่านล็อกอิน (Login Password)</label>
                    <input
                      type="password"
                      value={newMerchantPassword}
                      onChange={(e) => setNewMerchantPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="ความยาวขั้นต่ำ 6 ตัวอักษร"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition duration-300 shadow-md shadow-emerald-100/50 cursor-pointer"
                  >
                    เพิ่มร้านค้า
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Manage Promo Codes & Existing Merchants List */}
            <div className="lg:col-span-7 space-y-6">

              {/* Create Promo Code form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  🏷️ <span>สร้างคูปองส่วนลด</span>
                </h4>
                <form onSubmit={handleAdminAddPromo} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">รหัสโค้ดส่วนลด</label>
                    <input
                      type="text"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition uppercase font-black text-slate-850"
                      placeholder="เช่น LOVEPSU20"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">มูลค่าส่วนลด (บาท)</label>
                    <input
                      type="number"
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="เช่น 20"
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">คำอธิบาย</label>
                    <input
                      type="text"
                      value={newPromoDesc}
                      onChange={(e) => setNewPromoDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition"
                      placeholder="เช่น ลดต้อนรับปีใหม่ ม.อ."
                    />
                  </div>
                  <div className="md:col-span-3 pt-1">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition duration-300 shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      สร้างและเผยแพร่คูปองจัดโปร
                    </button>
                  </div>
                </form>
              </div>

              {/* Promo Codes Manager Table */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3 flex justify-between items-center">
                  <span>🏷️ คูปองส่วนลดในระบบทั้งหมด</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {adminPromoCodes.length} รหัส
                  </span>
                </h3>

                {adminPromoCodes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">ไม่มีคูปองจัดโปรโมชันในระบบ</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {adminPromoCodes.map((promo) => (
                      <div key={promo.code} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 bg-primary-light px-2 py-0.5 rounded border border-primary-light/40 text-[10px] uppercase">
                              {promo.code}
                            </span>
                            <span className="font-bold text-emerald-600">ลด ฿{promo.discount_amount}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{promo.description || 'ไม่มีคำอธิบาย'}</p>
                        </div>
                        <button
                          onClick={() => handleAdminDeletePromo(promo.code)}
                          className="px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          ลบคูปอง
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Registered Stores list */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
                <h3 className="text-base font-extrabold text-slate-805 border-b border-slate-100 pb-3 flex justify-between items-center">
                  <span>🏬 ร้านค้าในระบบทั้งหมด (ข้อมูลผู้ขาย)</span>
                  <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {merchants.length} ร้าน
                  </span>
                </h3>

                {merchants.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">ยังไม่มีร้านค้าระบบพาร์ทเนอร์ในขณะนี้</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {merchants.map((shop) => (
                      <div key={shop.id} className="py-3.5 flex justify-between items-center text-xs text-left">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-700 text-sm">{shop.shop_name}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${shop.merchant_type === 'restaurant'
                              ? 'bg-indigo-50 text-indigo-655 border border-indigo-150'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                              {shop.merchant_type === 'restaurant' ? 'ร้านอาหาร' : 'มินิมาร์ท'}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase border ${shop.is_partner
                              ? 'bg-primary-light text-primary border-primary/20'
                              : 'bg-rose-50 text-rose-600 border-rose-200'
                              }`}>
                              {shop.is_partner ? '✓ พาร์ทเนอร์' : 'ยังไม่ระบุพาร์ทเนอร์'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            อีเมลล็อกอิน: <b>{shop.email}</b> • โทร: <b>{shop.phone}</b> • ผู้ดูแล: <b>คุณ {shop.name}</b>
                          </p>
                        </div>
                        <button
                          onClick={() => handleAdminTogglePartner(shop.id, !!shop.is_partner)}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition duration-200 cursor-pointer border ${shop.is_partner
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
                            : 'bg-primary-light hover:bg-primary-light/80 text-primary border-primary/20'
                            }`}
                        >
                          {shop.is_partner ? 'ยกเลิกพาร์ทเนอร์' : 'ตั้งเป็นพาร์ทเนอร์'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Grab-style Promo Selector Modal Drawer */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 animate-slide-up">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-[#F7F9FA]/50">
              <div className="space-y-0.5 text-left">
                <h3 className="text-sm font-black text-slate-800">เลือกคูปองส่วนลด</h3>
                <p className="text-[10px] text-slate-400 font-bold">Offers & Promos</p>
              </div>
              <button
                onClick={() => setIsPromoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 flex items-center justify-center text-xs font-bold transition cursor-pointer"
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
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value);
                      setPromoError(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-250 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-[#F7F9FA] text-xs transition uppercase font-black text-slate-800"
                    placeholder="ใส่รหัสส่วนลด เช่น FREE15"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyPromo();
                    }}
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
                        setActivePromo(null);
                        setPromoCodeInput('');
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      ล้างการเลือก
                    </button>
                  )}
                </div>

                {adminPromoCodes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                    ไม่มีคูปองแนะนำในขณะนี้
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminPromoCodes.map(promo => (
                      <div
                        key={promo.code}
                        onClick={() => {
                          setPromoCodeInput(promo.code);
                          setActivePromo(promo);
                          setPromoError(null);
                        }}
                        className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow hover:border-blue-200 transition-all duration-300 flex items-center min-h-[90px] relative cursor-pointer group"
                      >
                        {/* Left Pane: Ticket Color Block */}
                        <div className="w-20 bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center text-white shrink-0 self-stretch select-none relative">
                          <span className="text-2xl">🎟️</span>
                          <span className="text-[8px] font-black tracking-widest uppercase opacity-75 mt-1">PROMO</span>
                          {/* Dashed separator */}
                          <div className="absolute right-0 top-0 bottom-0 border-r border-dashed border-white/30"></div>
                        </div>

                        {/* Ticket Circular Cutouts */}
                        <div className="absolute left-[74px] -top-1.5 w-3 h-3 bg-white rounded-full border-b border-slate-200 z-10"></div>
                        <div className="absolute left-[74px] -bottom-1.5 w-3 h-3 bg-white rounded-full border-t border-slate-200 z-10"></div>

                        {/* Right Pane: Coupon Details */}
                        <div className="flex-1 p-4 pr-12 text-left space-y-1 relative">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <h5 className="font-black text-sm text-slate-800">ส่วนลด ฿{promo.discount_amount}</h5>
                            <span className="text-[8px] font-black text-primary bg-primary-light border border-primary-light/40 px-1.5 py-0.5 rounded uppercase">
                              {promo.code}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold leading-tight">{promo.description || 'ใช้ส่วนลดสำหรับสินค้าในวิทยาเขต ม.อ.'}</p>
                          <span className="text-[8px] text-slate-400 block pt-0.5 font-medium">⏳ คูปองแนะนำพิเศษสำหรับสิทธิ์ล็อกอินนี้</span>
                        </div>

                        {/* Apply Radio Checkbox */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${activePromo?.code === promo.code
                            ? 'border-blue-600 bg-primary text-white'
                            : 'border-slate-300 group-hover:border-blue-400 bg-white'
                            }`}>
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
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-[#F7F9FA]/50">
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-2xl transition duration-300 shadow shadow-emerald-100/50 cursor-pointer text-center"
              >
                ตกลงเลือกใช้นี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-[32px] p-8 text-center relative overflow-hidden shadow-2xl animate-pop-in border border-slate-100/50">
            {/* Confetti Container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 45 }).map((_, i) => {
                const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
                const randomLeft = Math.random() * 100;
                const randomDelay = Math.random() * 1.5;
                const randomSize = Math.random() * 8 + 6;
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

            {/* Checkmark Graphic */}
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-md ring-8 ring-emerald-50/50 animate-pulse">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-xl font-black text-slate-850 mb-2">สั่งซื้ออาหารสำเร็จ! 🎉</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              ระบบได้รับคำสั่งซื้อของคุณแล้ว<br />
              ร้านค้านำส่งอัปเดต และไรเดอร์เตรียมเดินทาง 🛵
            </p>

            {/* Riding scooter track */}
            <div className="h-10 bg-slate-50 rounded-2xl relative overflow-hidden flex items-center border border-slate-200/50 shadow-inner px-4 mt-4">
              <span className="absolute left-3 text-[9px] font-bold text-slate-400">ร้านค้า</span>
              <span className="absolute right-3 text-[9px] font-bold text-slate-400">ลูกค้า</span>

              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[40px] text-xl animate-scooter-ride z-10">
                🛵💨
              </div>

              {/* Dotted travel line */}
              <div className="w-full border-t-2 border-dashed border-slate-200 mt-0.5"></div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-16 py-8 text-center text-slate-400 text-xs">
        <p>© 2026 PSU Grab. พัฒนาขึ้นด้วยระบบดาต้าเบสเรียลไทม์ผ่าน Supabase สำหรับชาว ม.อ.</p>
      </footer>
    </div>
  );
}