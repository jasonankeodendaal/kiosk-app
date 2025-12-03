import { createClient } from '@supabase/supabase-js';

// NOTE: In a real environment, import these from a config file
// We check for Vite/Vercel environment variables first
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_PUBLIC_KEY';

let supabase: any = null;

// Initialize helper (can be called from App.tsx)
export const initSupabase = () => {
  if (supabase) return true;

  // 1. Try initializing with values (Env vars or manual replacement)
  if (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } catch (e) {
      console.warn("Supabase init failed with provided keys", e);
    }
  }

  // 2. Fallback to global CDN object if present
  if ((window as any).supabase && (window as any).supabase.createClient) {
    try {
      supabase = (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } catch (e) {
      // Ignore
    }
  }
  return false;
};

export interface KioskRegistry {
  id: string;
  name: string;
  status: 'online' | 'offline';
  last_seen: string;
  wifiStrength: number; // 0-100
  ipAddress: string;
  version: string;
}

const STORAGE_KEY_ID = 'kiosk_pro_device_id';
const STORAGE_KEY_NAME = 'kiosk_pro_shop_name';

// 1. Get Device ID (Local Only)
export const getKioskId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_ID);
};

// 2. Set Device ID Manually (For Restore)
export const setCustomKioskId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_ID, id);
};

// 3. Provision New ID (Async - Database Aware)
export const provisionKioskId = async (): Promise<string> => {
  let id = localStorage.getItem(STORAGE_KEY_ID);
  if (id) return id;

  if (!supabase && !initSupabase()) {
    const fallback = "LOC-" + Math.floor(Math.random() * 999).toString().padStart(3, '0');
    localStorage.setItem(STORAGE_KEY_ID, fallback);
    return fallback;
  }

  try {
    const { data } = await supabase
      .from('kiosks')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const parsed = parseInt(data[0].id, 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    const nextId = nextNum.toString().padStart(3, '0');
    localStorage.setItem(STORAGE_KEY_ID, nextId);
    return nextId;
  } catch (e) {
    const fallback = "ERR-" + Math.floor(Math.random() * 99).toString().padStart(3, '0');
    localStorage.setItem(STORAGE_KEY_ID, fallback);
    return fallback;
  }
};

// 4. Get Shop Name
export const getShopName = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_NAME);
};

// 5. Check Config
export const isKioskConfigured = (): boolean => {
  return !!getKioskId() && !!getShopName();
};

// 6. Complete Setup
export const completeKioskSetup = async (shopName: string): Promise<boolean> => {
  const id = getKioskId();
  if (!id) return false;
  localStorage.setItem(STORAGE_KEY_NAME, shopName);
  return true;
};

// 7. Send Heartbeat
export const sendHeartbeat = async () => {
  const id = getKioskId();
  const name = getShopName();
  if (!id || !name) return;
  // In real implementation, send generic heartbeat to backend
};

// 8. Fetch Fleet (Mocked for Demo since no backend is connected)
export const fetchKioskFleet = async (): Promise<KioskRegistry[]> => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 600));

  const currentId = getKioskId() || 'LOC-001';
  const currentName = getShopName() || 'This Device';

  // Mock Data mimicking a real fleet response
  return [
    {
      id: currentId,
      name: currentName + " (You)",
      status: 'online',
      last_seen: new Date().toISOString(),
      wifiStrength: Math.floor(Math.random() * (100 - 60) + 60), // Random 60-100
      ipAddress: '192.168.1.45',
      version: '1.0.4'
    },
    {
      id: 'LOC-004',
      name: 'West Wing Entrance',
      status: 'online',
      last_seen: new Date().toISOString(),
      wifiStrength: 88,
      ipAddress: '192.168.1.102',
      version: '1.0.4'
    },
    {
      id: 'LOC-009',
      name: 'Food Court Pillar',
      status: 'offline',
      last_seen: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      wifiStrength: 0,
      ipAddress: '192.168.1.115',
      version: '1.0.3'
    },
    {
      id: 'LOC-012',
      name: 'Checkout Lane 5',
      status: 'online',
      last_seen: new Date().toISOString(),
      wifiStrength: 45, // Weak signal
      ipAddress: '192.168.1.120',
      version: '1.0.4'
    }
  ];
};