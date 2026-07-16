'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId?: string;
  role: 'customer' | 'rider' | 'merchant';
  shopName?: string;
  merchantType?: 'restaurant' | 'minimart';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrStudentId: string, password: string) => { success: boolean; error?: string };
  register: (userData: Omit<User, 'id'> & { password: string }) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize: Load users and check active session
  useEffect(() => {
    try {
      // Create seed data if no users exist or append merchant seeds
      const existingUsersJson = localStorage.getItem('psu_grab_users');
      let usersList = existingUsersJson ? JSON.parse(existingUsersJson) : [];

      const seedUsers = [
        {
          id: '1',
          name: 'สมชาย รักดี',
          email: 'somchai@gmail.com',
          phone: '0812345678',
          studentId: '6410110001',
          role: 'customer',
          password: 'password123'
        },
        {
          id: '2',
          name: 'สมหญิง สปีดดี',
          email: 'somying@gmail.com',
          phone: '0898765432',
          studentId: '6410110002',
          role: 'rider',
          password: 'password123'
        },
        {
          id: '3',
          name: 'ป้าศรี หมีข้าวยำ',
          email: 'krua_psu@gmail.com',
          phone: '0855555555',
          role: 'merchant',
          shopName: 'ครัว ม.อ. (Krua PSU)',
          merchantType: 'restaurant',
          password: 'password123'
        },
        {
          id: '4',
          name: 'เจ๊กิม ขายของชำ',
          email: 'psu_mart@gmail.com',
          phone: '0866666666',
          role: 'merchant',
          shopName: 'ม.อ. มาร์ท (PSU Mart)',
          merchantType: 'minimart',
          password: 'password123'
        }
      ];

      // Add only missing seed users
      let updated = false;
      seedUsers.forEach(seed => {
        if (!usersList.some((u: any) => u.email === seed.email)) {
          usersList.push(seed);
          updated = true;
        }
      });

      if (!existingUsersJson || updated) {
        localStorage.setItem('psu_grab_users', JSON.stringify(usersList));
      }

      // Check current session
      const session = localStorage.getItem('psu_grab_session');
      if (session) {
        setUser(JSON.parse(session));
      }
    } catch (e) {
      console.error('Failed to access localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (emailOrStudentId: string, password: string) => {
    try {
      const usersJson = localStorage.getItem('psu_grab_users');
      if (!usersJson) return { success: false, error: 'ไม่พบบัญชีผู้ใช้ในระบบ' };

      const users = JSON.parse(usersJson);
      const trimmedInput = emailOrStudentId.trim();

      const foundUser = users.find(
        (u: any) => 
          (u.email === trimmedInput || u.studentId === trimmedInput) && 
          u.password === password
      );

      if (foundUser) {
        // Exclude password from user object in session
        const { password: _, ...safeUser } = foundUser;
        localStorage.setItem('psu_grab_session', JSON.stringify(safeUser));
        setUser(safeUser as User);
        return { success: true };
      } else {
        return { success: false, error: 'อีเมล/รหัสนักศึกษา หรือรหัสผ่านไม่ถูกต้อง' };
      }
    } catch (e) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    }
  };

  const register = (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      const usersJson = localStorage.getItem('psu_grab_users');
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Check if user already exists
      const emailExists = users.some((u: any) => u.email === userData.email);
      const studentIdExists = userData.studentId 
        ? users.some((u: any) => u.studentId === userData.studentId) 
        : false;

      if (emailExists) {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' };
      }
      if (studentIdExists) {
        return { success: false, error: 'รหัสนักศึกษานี้ถูกใช้งานแล้ว' };
      }

      const newUser = {
        ...userData,
        id: Math.random().toString(36).substr(2, 9),
      };

      users.push(newUser);
      localStorage.setItem('psu_grab_users', JSON.stringify(users));
      return { success: true };
    } catch (e) {
      return { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' };
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
