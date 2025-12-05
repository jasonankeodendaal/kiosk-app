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
  // 1. Try initializing with values (Env vars or manual replacement)
  if (SUPABASE_URL && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 10) {
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

// NEW: Real Network Check (Not just config check)
export const checkCloudConnection = async (): Promise<boolean> => {
    if (!supabase) {
        initSupabase();
        if(!supabase) return false;
    }
    try {
        // Perform a lightweight check against the database
        const { error, count } = await supabase
            .from('store_config')
            .select('id', { count: 'exact', head: true });
        
        if (error) {
            console.warn("Cloud Ping Failed:", error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.warn("Cloud Network Error");
        return false;
    }
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

  // Use a random component to prevent collision without needing a DB read lock
  const randomSuffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const nextId = "LOC-" + randomSuffix;
  localStorage.setItem(STORAGE_KEY_ID, nextId);
  return nextId;
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
  
  // Persist locally immediately
  localStorage.setItem(STORAGE_KEY_NAME, shopName);
  localStorage.setItem(STORAGE_KEY_TYPE, deviceType);
  
  // Ensure DB is ready
  initSupabase();
  
  if (supabase) {
      try {
        console.log(`Registering Device: ${id} (${shopName}) Type: ${deviceType}...`);
        
        // Map to SQL column names (snake_case)
        const kioskData = {
          id,
          name: shopName,
          device_type: deviceType, // snake_case for DB
          status: 'online',
          last_seen: new Date().toISOString(),
          wifi_strength: 100,
          ip_address: 'Unknown',
          version: '1.0.5',
          location_description: 'Newly Registered',
          assigned_zone: 'Unassigned',
          request_snapshot: false,
          restart_requested: false
        };

        // Write directly to Telemetry Table
        // This acts as the Source of Truth.
        const { error: telemetryError } = await supabase.from('kiosks').upsert(kioskData);
        
        if (telemetryError) {
             console.warn("Registration failed:", telemetryError.message);
             // If error is 42501 (Permission Denied), it's specifically the RLS issue
             if (telemetryError.code === '42501') {
                 throw new Error("Permission Denied: Run the SQL script in Admin Setup to unlock table access.");
             }
             throw telemetryError;
        }

        console.log("Device registered in Cloud Fleet successfully.");

      } catch(e: any) {
        console.error("Failed to register kiosk in cloud", e);
        
        // AUTO-RECOVERY FALLBACK
        // If the error is missing columns (Schema drift), try to register with minimal data
        if (e.message && (e.message.includes('assigned_zone') || e.message.includes('column'))) {
            console.warn("Detected Schema Mismatch. Attempting Legacy Registration...");
            try {
                const minimalData = {
                     id, 
                     name: shopName, 
                     device_type: deviceType, 
                     status: 'online', 
                     last_seen: new Date().toISOString()
                };
                const { error: retryError } = await supabase.from('kiosks').upsert(minimalData);
                if (!retryError) {
                    console.log("Legacy Registration Successful. Please run updated SQL scripts in Admin Hub.");
                    return true;
                }
            } catch (retryEx) {
                console.error("Legacy retry failed", retryEx);
            }
        }

        alert(`Setup Warning: Cloud registration failed (${e.message}). Device is running locally. Please check Admin Hub -> Settings -> System Setup.`);
      }
  } else {
      console.warn("Supabase not configured. Kiosk running in local mode.");
  }
  
  return true;
};

// 7. Send Heartbeat (Now supports snapshot and writes to SQL Table)
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
          if(connection.downlink < 1) wifiStrength = 20;
          else if(connection.downlink < 5) wifiStrength = 50;
          else if(connection.downlink < 10) wifiStrength = 80;
      }

      // 1. Telemetry Payload
      const payload: any = {
          id,
          name, // Ensure name is always fresh
          device_type: deviceType,
          last_seen: new Date().toISOString(),
          status: 'online',
          wifi_strength: wifiStrength,
          ip_address: connection ? `${connection.effectiveType} | ${connection.downlink}Mbps` : 'Unknown',
      };

      // 2. Handle Snapshot Response
      if (snapshotBase64) {
          console.log("Uploading Snapshot...");
          payload.snapshot_url = snapshotBase64;
          payload.request_snapshot = false; // Reset the flag since we are fulfilling it
      }

      // Upsert to SQL table (Partial update works with upsert in Supabase if all keys not present? 
      // Upsert usually replaces. We should ideally use Update, but Upsert ensures existence.
      // To be safe, we rely on the DB definition allowing nulls or we provide current vals if needed.
      // But upsert is best for heartbeat.)
      const { error } = await supabase.from('kiosks').upsert(payload, { onConflict: 'id' });
      
      if (error) console.warn("Heartbeat Error:", error.message);

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