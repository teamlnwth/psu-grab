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
    password TEXT NOT NULL,
    is_partner BOOLEAN DEFAULT FALSE,
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
    status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'calling_rider', 'delivering', 'completed')),
    shop_rating INTEGER,
    shop_review TEXT,
    rider_rating INTEGER,
    rider_review TEXT,
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

-- 6. Disable Row Level Security (RLS) for Development/Testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes DISABLE ROW LEVEL SECURITY;
