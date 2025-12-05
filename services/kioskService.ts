

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

// IMPROVED: Check multiple naming conventions for Vercel/Next.js/Vite compatibility
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 
    getEnv('NEXT_PUBLIC_SUPABASE_URL', 
        getEnv('SUPABASE_URL', 'YOUR_SUPABASE_PROJECT_URL')
    )
);

const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY', 
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 
        getEnv('SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_PUBLIC_KEY')
    )
);

// Export supabase instance so other services can use it
export let supabase: any = null;

// Initialize helper (can be called from App.tsx)
export const initSupabase = () => {
  if (supabase) return true;

  console.log("Initializing Supabase...");
  console.log("URL Configured:", SUPABASE_URL?.startsWith('http') ? 'YES' : 'NO');
  console.log("Key Configured:", SUPABASE_ANON_KEY?.length > 10 ? 'YES' : 'NO');

  // 1. Try initializing with values (Env vars or manual replacement)
  if (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase Client Created Successfully");
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
const STORAGE_KEY_TYPE = 'kiosk_pro_device_type';

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

// 4. Get Shop Name & Type
export const getShopName = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_NAME);
};

export const getDeviceType = (): 'kiosk' | 'mobile' => {
    return (localStorage.getItem(STORAGE_KEY_TYPE) as 'kiosk' | 'mobile') || 'kiosk';
};

// 5. Check Config
export const isKioskConfigured = (): boolean => {
  return !!getKioskId() && !!getShopName();
};

// 6. Complete Setup (Robust Version)
export const completeKioskSetup = async (shopName: string, deviceType: 'kiosk' | 'mobile'): Promise<boolean> => {
  const id = getKioskId();
  if (!id) return false;
  
  localStorage.setItem(STORAGE_KEY_NAME, shopName);
  localStorage.setItem(STORAGE_KEY_TYPE, deviceType);
  
  // Ensure DB is ready
  initSupabase();
  
  if (supabase) {
      try {
        console.log(`Registering Kiosk: ${id} (${shopName})...`);
        const kioskData: KioskRegistry = {
          id,
          name: shopName,
          deviceType,
          status: 'online',
          last_seen: new Date().toISOString(),
          wifiStrength: 100,
          ipAddress: 'Unknown',
          version: '1.0.5',
          locationDescription: 'Newly Registered',
          assignedZone: 'Unassigned',
          requestSnapshot: false,
          restartRequested: false
        };

        // 1. Write to Telemetry Table (Individual Record)
        const { error: telemetryError } = await supabase.from('kiosks').upsert(kioskData);
        if (telemetryError) {
             console.warn("Telemetry update failed:", telemetryError.message);
             throw new Error("Telemetry Write Failed");
        }

        // 2. Update the Global Store Config JSON
        // CRITICAL: Fetch LATEST config first to avoid overwriting other fleet members
        const { data: currentConfig, error: fetchError } = await supabase
          .from('store_config')
          .select('data')
          .eq('id', 1)
          .single();

        if (fetchError) {
             console.warn("Could not fetch current fleet config:", fetchError.message);
        }

        let configData: any = { brands: [], fleet: [] };
        if (currentConfig && currentConfig.data) {
             configData = currentConfig.data;
        }

        const currentFleet = Array.isArray(configData.fleet) ? configData.fleet : [];
        
        // Remove self if exists (update scenario), then append
        const newFleet = currentFleet.filter((k: KioskRegistry) => k.id !== id);
        newFleet.push(kioskData);
        
        const { error: updateError } = await supabase
          .from('store_config')
          .upsert({ 
              id: 1, 
              data: { ...configData, fleet: newFleet } 
          });
          
        if (updateError) {
            console.error("Fleet registry update failed:", updateError.message);
            alert("Warning: Failed to update Global Fleet list. However, device telemetry is active.");
        } else {
            console.log("Fleet list updated successfully.");
        }

      } catch(e: any) {
        console.error("Failed to register kiosk in cloud", e);
        alert(`Setup Warning: Cloud registration failed (${e.message}). Kiosk is running locally.`);
      }
  } else {
      console.warn("Supabase not configured. Kiosk running in local mode.");
  }
  
  return true;
};

// 7. Send Heartbeat (now supports snapshot)
export const sendHeartbeat = async (snapshotBase64?: string) => {
  const id = getKioskId();
  const name = getShopName();
  const deviceType = getDeviceType();

  if (!id || !name) return;

  // Attempt init if not ready
  if (!supabase) initSupabase();
  if (!supabase) return;
  
  try {
      // Estimate connection info
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let wifiStrength = 100;
      
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
          device_type: deviceType,
          last_seen: new Date().toISOString(),
          status: 'online',
          wifi_strength: wifiStrength,
          ip_address: connection ? `${connection.effectiveType} | ${connection.downlink}Mbps` : 'Unknown'
      };

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

// 8. NEW: Upload File to Supabase Storage Bucket
export const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!supabase) initSupabase();
    if (!supabase) {
        throw new Error("Supabase client not initialized.");
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Attempt upload to 'kiosk-media' bucket
        // User must create this bucket in Supabase Dashboard and set to Public
        const { data, error } = await supabase.storage
            .from('kiosk-media')
            .upload(filePath, file);

        if (error) {
            console.error(`Storage Upload Error: ${error.message}`);
            // Specific errors
            if (error.message.includes('row-level security')) {
                throw new Error("Supabase Error: Row-Level Security policy violation. Check bucket permissions.");
            }
            if (error.message.includes('bucket not found') || error.message.includes('The resource was not found')) {
                 throw new Error("Supabase Error: Storage Bucket 'kiosk-media' not found. Please run the SQL script in Setup Guide.");
            }
            throw new Error(`Supabase Storage Error: ${error.message}`);
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('kiosk-media')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (e: any) {
        console.error("Unexpected storage error", e);
        throw e; // Re-throw to be caught by FileUpload component
    }
};