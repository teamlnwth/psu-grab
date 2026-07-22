export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId?: string;
  role: 'customer' | 'rider' | 'merchant' | 'admin';
  shopName?: string;
  merchantType?: 'restaurant' | 'minimart';
  is_partner?: boolean;
  
  // Raw Supabase database fields
  shop_name?: string;
  merchant_type?: 'restaurant' | 'minimart';
  student_id?: string;
}

export interface Product {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  category?: string;
  created_at?: string;
}

export interface PromoCode {
  code: string;
  discount_amount: number;
  description: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  merchant_id: string;
  merchant_name: string;
  rider_id: string | null;
  rider_name: string | null;
  items: string;
  total_price: number;
  dest: string;
  status: 'finding_rider' | 'pending' | 'preparing' | 'calling_rider' | 'delivering' | 'completed';
  shop_rating: number | null;
  shop_review: string | null;
  rider_rating: number | null;
  rider_review: string | null;
  created_at: string;

  // Ride-hailing fields
  order_type?: 'food' | 'ride';
  pickup_dest?: string;
  vehicle_type?: 'motorbike' | 'car' | 'scooter';
  vehicle_plate?: string;
  passenger_count?: number;
}
