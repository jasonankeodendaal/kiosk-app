

import { createClient } from '@supabase/supabase-js';
import { KioskRegistry } from '../types';

// Helper to safely get env vars without crashing if import.meta or process is undefined
export const getEnv = (key: string, fallback: string) => {
  try {
    // Check Vite / Modern Standards
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // Check Webpack / Node / Create React App
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors in strict environments
  }
  return fallback;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'YOUR_SUPABASE_PROJECT_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_PUBLIC_KEY');

// Export supabase instance so other services can use it
export let supabase: any = null;

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
      const parsed = parseInt(data[0].id.replace('LOC-', ''), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    const nextId = "LOC-" + nextNum.toString().padStart(3, '0');
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
  
  // Register in DB
  if (supabase) {
      try {
        const kioskData: KioskRegistry = {
          id,
          name: shopName,
          status: 'online',
          last_seen: new Date().toISOString(),
          wifiStrength: 100,
          ipAddress: 'Unknown',
          version: '1.0.4',
          locationDescription: 'Newly Registered',
          assignedZone: 'Unassigned'
        };

        // 1. Write to Telemetry Table (Keep Alive)
        await supabase.from('kiosks').upsert(kioskData);

        // 2. Update the Global Store Config JSON so Admin Hub sees it in the list immediately
        const { data: currentConfig, error } = await supabase
          .from('store_config')
          .select('data')
          .eq('id', 1)
          .single();

        let newFleet: KioskRegistry[] = [];
        let configData = {};

        if (error || !currentConfig) {
             configData = { brands: [], fleet: [] };
        } else {
             configData = currentConfig.data || {};
             newFleet = (configData as any).fleet || [];
        }

        // Add or Update Fleet Item
        const existingIndex = newFleet.findIndex((k: KioskRegistry) => k.id === id);
        if (existingIndex >= 0) {
             newFleet[existingIndex] = { ...newFleet[existingIndex], name: shopName, status: 'online', last_seen: new Date().toISOString() };
        } else {
             newFleet.push(kioskData);
        }
        
        await supabase
          .from('store_config')
          .upsert({ 
              id: 1, 
              data: { ...configData, fleet: newFleet } 
          });

      } catch(e) {
        console.error("Failed to register kiosk in cloud", e);
      }
  }
  
  return true;
};

// 7. Send Heartbeat (now supports snapshot)
export const sendHeartbeat = async (snapshotBase64?: string) => {
  const id = getKioskId();
  const name = getShopName();
  if (!id || !name || !supabase) return;
  
  try {
      // Estimate connection info
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let wifiStrength = 100;
      let ipAddress = 'Unknown';
      
      if(connection) {
          // Rough estimate based on downlink
          if(connection.downlink < 1) wifiStrength = 20;
          else if(connection.downlink < 5) wifiStrength = 50;
          else if(connection.downlink < 10) wifiStrength = 80;
      }

      // 1. Telemetry
      const payload: any = {
          id,
          name, // Ensure name is always fresh
          last_seen: new Date().toISOString(),
          status: 'online',
          wifi_strength: wifiStrength,
          ip_address: connection ? `${connection.effectiveType} | ${connection.downlink}Mbps` : 'Unknown'
      };

      // Only send snapshot if provided (to save bandwidth)
      if (snapshotBase64) {
          // In a real app, upload to Storage and save URL. For this MVP, we might store base64 in a separate column or limited field
          // NOTE: Storing large base64 in a row is not ideal for performance, but fine for prototype.
          // Ideally: await supabase.storage.from('snapshots').upload(...)
      }

      await supabase.from('kiosks').upsert(payload, { onConflict: 'id' });
      
      // Update Fleet Registry in Main Config if snapshot is present (so Admin sees it)
      if (snapshotBase64) {
          const { data: currentConfig } = await supabase.from('store_config').select('data').eq('id', 1).single();
          if (currentConfig && currentConfig.data && currentConfig.data.fleet) {
              const fleet = currentConfig.data.fleet as KioskRegistry[];
              const idx = fleet.findIndex(k => k.id === id);
              if (idx !== -1) {
                  fleet[idx] = { 
                      ...fleet[idx], 
                      last_seen: new Date().toISOString(), 
                      status: 'online',
                      snapshotUrl: snapshotBase64,
                      requestSnapshot: false, // RESET FLAG
                      wifiStrength: wifiStrength,
                      ipAddress: connection ? `${connection.effectiveType} | ${connection.downlink}Mbps` : 'Unknown'
                  };
                  await supabase.from('store_config').update({ data: { ...currentConfig.data, fleet } }).eq('id', 1);
              }
          }
      }

  } catch (e) {
      console.warn("Heartbeat failed", e);
  }
};