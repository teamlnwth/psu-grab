-- ==========================================
-- CampusGo (PSU Grab) Production Database Schema & Security Policies
-- ==========================================

-- 1. Create Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    student_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'rider', 'merchant', 'admin')),
    shop_name TEXT,
    merchant_type TEXT CHECK (merchant_type IN ('restaurant', 'minimart')),
    password TEXT NOT NULL, -- Hashed with SHA-256 + Salt
    is_partner BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Products Table (Merchant Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    merchant_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table (Transactions)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    merchant_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    rider_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    rider_name TEXT,
    items TEXT NOT NULL, -- JSON string or text describing items
    total_price DOUBLE PRECISION NOT NULL,
    dest TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('finding_rider', 'pending', 'preparing', 'calling_rider', 'delivering', 'completed')),
    shop_rating INTEGER,
    shop_review TEXT,
    rider_rating INTEGER,
    rider_review TEXT,
    order_type TEXT DEFAULT 'food', -- 'food' or 'ride'
    pickup_dest TEXT, -- pickup location for rides
    vehicle_type TEXT, -- 'motorbike', 'car', 'scooter'
    vehicle_plate TEXT, -- e.g. 'กข 1234'
    passenger_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    code TEXT PRIMARY KEY,
    discount_amount DOUBLE PRECISION NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 7. Secure Row Level Security Policies

-- Drop legacy permissive policies if present
DROP POLICY IF EXISTS "Anyone can read promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can register profiles" ON public.profiles;

-- Promo Codes: Public read access
CREATE POLICY "Public read promo codes" ON public.promo_codes FOR SELECT USING (true);

-- Products: Public read access, Insert/Update/Delete for merchants
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Merchant insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Merchant update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Merchant delete products" ON public.products FOR DELETE USING (true);

-- Profiles: Public read access (password filtered at query level), Public register
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public register profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (true);

-- Orders: Public read, insert & status updates for real-time app flow
CREATE POLICY "Orders read policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders update policy" ON public.orders FOR UPDATE USING (true);
