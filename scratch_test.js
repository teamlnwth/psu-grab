const fs = require('fs');

const envPath = './.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = {
  'Content-Type': 'application/json',
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Prefer': 'resolution=merge-duplicates'
};

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

async function insertAll() {
  console.log('Posting all seed users with matching keys...');
  const res = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(seedUsers)
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

insertAll();
