'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId?: string;
  role: 'customer' | 'rider' | 'merchant' | 'admin';
  shopName?: string;
  merchantType?: 'restaurant' | 'minimart';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrStudentId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize: Check session and ensure seed data exists in Supabase
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load active session from localStorage
        const session = localStorage.getItem('psu_grab_session');
        if (session) {
          setUser(JSON.parse(session));
        }

        // Define seed accounts to auto-populate in user's Supabase database
        const seedUsers = [
          {
            id: '1',
            name: 'สมชาย รักดี',
            email: 'somchai@gmail.com',
            phone: '0812345678',
            student_id: '6410110001',
            role: 'customer',
            shop_name: null,
            merchant_type: null,
            password: 'password123'
          },
          {
            id: '2',
            name: 'สมหญิง สปีดดี',
            email: 'somying@gmail.com',
            phone: '0898765432',
            student_id: '6410110002',
            role: 'rider',
            shop_name: null,
            merchant_type: null,
            password: 'password123'
          },
          {
            id: '3',
            name: 'ป้าศรี หมีข้าวยำ',
            email: 'krua_psu@gmail.com',
            phone: '0855555555',
            student_id: null,
            role: 'merchant',
            shop_name: 'ครัว ม.อ. (Krua PSU)',
            merchant_type: 'restaurant',
            password: 'password123'
          },
          {
            id: '4',
            name: 'เจ๊กิม ขายของชำ',
            email: 'psu_mart@gmail.com',
            phone: '0866666666',
            student_id: null,
            role: 'merchant',
            shop_name: 'ม.อ. มาร์ท (PSU Mart)',
            merchant_type: 'minimart',
            password: 'password123'
          },
          {
            id: '5',
            name: 'ผู้ดูแลระบบ PSU Grab',
            email: 'admin@gmail.com',
            phone: '0800000000',
            student_id: null,
            role: 'admin',
            shop_name: null,
            merchant_type: null,
            password: 'password123'
          }
        ];

        // Seed users to database using upsert
        await supabase.from('profiles').upsert(seedUsers, { onConflict: 'email' });

        // Seed default products for the mock merchants if products table is empty
        const { data: existingProds } = await supabase.from('products').select('id').limit(1);
        if (!existingProds || existingProds.length === 0) {
          const initialProducts = [
            { id: 'p1-3', merchant_id: '3', name: 'ข้าวกะเพราไก่ไข่ดาว', price: 50, category: 'อาหาร' },
            { id: 'p2-3', merchant_id: '3', name: 'ข้าวผัดต้มยำทะเล', price: 65, category: 'อาหาร' },
            { id: 'p3-3', merchant_id: '3', name: 'ชาเขียวนมสด (โรงช้าง)', price: 30, category: 'เครื่องดื่ม' },
            { id: 'p1-4', merchant_id: '4', name: 'น้ำดื่ม ม.อ. (ขวดใหญ่)', price: 12, category: 'เครื่องดื่ม' },
            { id: 'p2-4', merchant_id: '4', name: 'บะหมี่กึ่งสำเร็จรูปรสต้มยำ', price: 15, category: 'อาหารแห้ง' },
            { id: 'p3-4', merchant_id: '4', name: 'ขนมขบเคี้ยวตราก๊อบกอบ', price: 20, category: 'ของกินเล่น' }
          ];
          await supabase.from('products').upsert(initialProducts, { onConflict: 'id' });
        }

        // Seed default promo codes if promo codes table is empty
        const { data: existingPromos } = await supabase.from('promo_codes').select('code').limit(1);
        if (!existingPromos || existingPromos.length === 0) {
          const initialPromos = [
            { code: 'PSUNEW50', discount_amount: 50, description: 'ส่วนลด 50 บาท ต้อนรับนักศึกษาใหม่ ม.อ.' },
            { code: 'FREE15', discount_amount: 15, description: 'คูปองส่งฟรี ส่วนลด 15 บาทสำหรับจัดส่ง' },
            { code: 'PSUGRAB10', discount_amount: 10, description: 'โค้ดส่วนลดทั่วไป 10 บาท ไม่มีขั้นต่ำ' }
          ];
          await supabase.from('promo_codes').upsert(initialPromos, { onConflict: 'code' });
        }
      } catch (err) {
        console.warn(
          'Supabase database check failed. Please ensure schema.sql tables are created in the SQL Editor.',
          err
        );
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (emailOrStudentId: string, password: string) => {
    try {
      const trimmedInput = emailOrStudentId.trim();

      // Query database for matching user
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${trimmedInput},student_id.eq.${trimmedInput}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        return { 
          success: false, 
          error: `เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล: ${error.message} (ตรวจสอบว่าได้รันสคริปต์ใน SQL Editor แล้วยัง)` 
        };
      }

      if (data) {
        const safeUser: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          studentId: data.student_id || undefined,
          role: data.role as any,
          shopName: data.shop_name || undefined,
          merchantType: data.merchant_type as any
        };

        localStorage.setItem('psu_grab_session', JSON.stringify(safeUser));
        setUser(safeUser);
        return { success: true };
      } else {
        return { success: false, error: 'อีเมล/รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง' };
      }
    } catch (e) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการล็อกอิน' };
    }
  };

  const register = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      const id = Math.random().toString(36).substr(2, 9); // Create a short text ID

      // Insert new profile record
      const { error } = await supabase
        .from('profiles')
        .insert([{
          id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          student_id: userData.studentId || null,
          role: userData.role,
          shop_name: userData.shopName || null,
          merchant_type: userData.merchantType || null,
          password: userData.password
        }]);

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
        }
        return { success: false, error: `สมัครสมาชิกล้มเหลว: ${error.message} (ตรวจสอบว่าสร้างตาราง profiles หรือยัง)` };
      }

      // If registering as a merchant, insert initial products for that merchant
      if (userData.role === 'merchant') {
        const initialProducts = userData.merchantType === 'restaurant'
          ? [
              { id: `p1-${id}`, merchant_id: id, name: 'ข้าวกะเพราไก่ไข่ดาว', price: 50, category: 'อาหาร' },
              { id: `p2-${id}`, merchant_id: id, name: 'ข้าวผัดต้มยำทะเล', price: 65, category: 'อาหาร' },
              { id: `p3-${id}`, merchant_id: id, name: 'ชาเขียวนมสด (โรงช้าง)', price: 30, category: 'เครื่องดื่ม' }
            ]
          : [
              { id: `p1-${id}`, merchant_id: id, name: 'น้ำดื่ม ม.อ. (ขวดใหญ่)', price: 12, category: 'เครื่องดื่ม' },
              { id: `p2-${id}`, merchant_id: id, name: 'บะหมี่กึ่งสำเร็จรูปรสต้มยำ', price: 15, category: 'อาหารแห้ง' },
              { id: `p3-${id}`, merchant_id: id, name: 'ขนมขบเคี้ยวตราก๊อบกอบ', price: 20, category: 'ของกินเล่น' }
            ];
            
        await supabase.from('products').insert(initialProducts);
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสมัครสมาชิก' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('psu_grab_session');
      setUser(null);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
