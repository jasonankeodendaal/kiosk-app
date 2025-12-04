
import { createClient } from '@supabase/supabase-js';
import { KioskRegistry } from '../types';

// Helper to safely get env vars without crashing
export const getEnv = (key: string, fallback: string = ''): string => {
  // 1. Check Process Env (Standard for Vercel / Next.js / Node)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  // 2. Check Import Meta Env (Standard for Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key] as string;
    }
  } catch (e) {}

  return fallback;
};

// Auto-detect Supabase configuration
const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL', getEnv('VITE_SUPABASE_URL', ''));
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', getEnv('VITE_SUPABASE_ANON_KEY', ''));

// Export supabase instance
export let supabase: any = null;

// Initialize helper
export const initSupabase = () => {
  if (supabase) return true;

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase Client Initialized");
      return true;
    } catch (e) {
      console.warn("Supabase init failed", e);
    }
  }
  return false;
};

const STORAGE_KEY_ID = 'kiosk_pro_device_id';
const STORAGE_KEY_NAME = 'kiosk_pro_shop_name';

export const getKioskId = (): string | null => localStorage.getItem(STORAGE_KEY_ID);
export const setCustomKioskId = (id: string) => localStorage.setItem(STORAGE_KEY_ID, id);

export const provisionKioskId = async (): Promise<string> => {
  let id = localStorage.getItem(STORAGE_KEY_ID);
  if (id) return id;

  const fallback = "LOC-" + Math.floor(Math.random() * 999).toString().padStart(3, '0');
  
  if (!supabase && !initSupabase()) {
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
      const parsed = parseInt(data[0].id.replace('LOC-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    const nextId = "LOC-" + nextNum.toString().padStart(3, '0');
    localStorage.setItem(STORAGE_KEY_ID, nextId);
    return nextId;
  } catch (e) {
    localStorage.setItem(STORAGE_KEY_ID, fallback);
    return fallback;
  }
};

export const getShopName = (): string | null => localStorage.getItem(STORAGE_KEY_NAME);
export const isKioskConfigured = (): boolean => !!getKioskId() && !!getShopName();

export const completeKioskSetup = async (shopName: string): Promise<boolean> => {
  const id = getKioskId();
  if (!id) return false;
  localStorage.setItem(STORAGE_KEY_NAME, shopName);
  
  if (!supabase) initSupabase();

  if (supabase) {
      try {
        await supabase.from('kiosks').upsert({
            id,
            name: shopName,
            status: 'online',
            last_seen: new Date().toISOString(),
            version: '1.0.5'
        });

        // Register in fleet config
        const { data: currentConfig } = await supabase
          .from('store_config')
          .select('data')
          .eq('id', 1)
          .single();

        const configData = currentConfig?.data || {};
        const newFleet = (configData.fleet || []).filter((k: KioskRegistry) => k.id !== id);
        
        const myKiosk: KioskRegistry = {
            id,
            name: shopName,
            status: 'online',
            last_seen: new Date().toISOString(),
            wifiStrength: 100,
            ipAddress: '192.168.1.1',
            version: '1.0.5',
            locationDescription: 'New Setup',
            assignedZone: 'Unassigned'
        };
        newFleet.push(myKiosk);

        await supabase
          .from('store_config')
          .upsert({ id: 1, data: { ...configData, fleet: newFleet } });

      } catch(e) {
        console.error("Cloud registration failed", e);
      }
  }
  return true;
};

export const sendHeartbeat = async () => {
  const id = getKioskId();
  if (!id || !supabase) return;
  try {
      await supabase.from('kiosks').upsert({
          id,
          last_seen: new Date().toISOString(),
          status: 'online'
      }, { onConflict: 'id' });
  } catch (e) {
      // Silent fail
  }
};
