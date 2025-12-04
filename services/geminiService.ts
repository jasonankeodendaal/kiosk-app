
import { StoreData } from "../types";
import { supabase, getEnv } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

// Full Static Default Data (Non-AI)
const DEFAULT_DATA: StoreData = {
  companyLogoUrl: "",
  hero: {
    title: "Our Partners",
    subtitle: "Select a brand to explore.",
    backgroundImageUrl: "", // Empty will use default gradient
    logoUrl: "",
    websiteUrl: ""
  },
  catalog: {
    pdfUrl: "",
    pages: []
  },
  ads: {
    homeBottomLeft: [],
    homeBottomRight: [],
    homeSideVertical: [],
    screensaver: []
  },
  fleet: [], // Fleet is now managed via kioskService/Supabase kiosks table mostly, but we keep this for legacy structure
  brands: [
    {
      id: "b1",
      name: "Nexus",
      logoUrl: "", 
      categories: [
        {
          id: "c1",
          name: "Smartphone",
          icon: "Smartphone",
          products: [
            {
              id: "p1",
              name: "Nexus Prime X1",
              description: "The ultimate flagship with a bezel-less ceramic display.",
              specs: { processor: "Octa-Core 3.2GHz", memory: "12GB RAM", screen: "6.8 inch OLED", battery: "5000mAh" },
              features: ["Ceramic Shield", "Night Sight 4.0", "Wireless Charging"],
              dimensions: { width: "75mm", height: "160mm", depth: "8mm", weight: "190g" },
              imageUrl: "https://picsum.photos/seed/nexus1/600/600"
            }
          ]
        }
      ]
    }
  ]
};

// 1. Fetch Data (Priority: API/Hub -> Supabase -> Local Cache)
const generateStoreData = async (): Promise<StoreData> => {
  const apiUrl = getEnv('VITE_API_URL', '');

  // A. Try API / PC Hub (Strategy A)
  // Auto-detect: If VITE_API_URL is set, OR if we are running without Supabase config (assume local hub)
  if (apiUrl || !supabase) {
      try {
          const endpoint = apiUrl ? `${apiUrl}/api/config` : '/api/config';
          const res = await fetch(endpoint);
          if (res.ok) {
              const remoteData = await res.json();
              if (remoteData && Object.keys(remoteData).length > 0) {
                   const merged = { ...DEFAULT_DATA, ...remoteData };
                   localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(merged));
                   return merged;
              }
          }
      } catch (e) {
          console.warn("Hub API fetch failed, trying next strategy...", e);
      }
  }

  // B. Try Supabase (Strategy B)
  if (supabase) {
      try {
          const { data, error } = await supabase
              .from('store_config')
              .select('data')
              .eq('id', 1)
              .single();
          
          if (data && data.data) {
              const rawData = data.data;
              const mergedData: StoreData = {
                  ...DEFAULT_DATA,
                  ...rawData,
                  brands: rawData.brands || [],
                  fleet: rawData.fleet || [],
                  ads: rawData.ads || DEFAULT_DATA.ads,
                  hero: { ...DEFAULT_DATA.hero, ...(rawData.hero || {}) },
                  catalog: { ...DEFAULT_DATA.catalog, ...(rawData.catalog || {}) }
              };
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(mergedData));
              return mergedData;
          }
      } catch (e) {
          console.warn("Supabase fetch failed", e);
      }
  }

  // C. Fallback to Local Storage (Offline Mode)
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to load local data", e);
    return DEFAULT_DATA;
  }
};

// 2. Save Data (Strict Cloud First)
const saveStoreData = async (data: StoreData): Promise<void> => {
    let saved = false;
    const apiUrl = getEnv('VITE_API_URL', '');

    // A. Try API / PC Hub
    if (apiUrl || !supabase) {
        try {
            const endpoint = apiUrl ? `${apiUrl}/api/update` : '/api/update';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) saved = true;
        } catch (e) {
            console.warn("Hub API save failed", e);
        }
    }

    // B. Try Supabase
    if (!saved && supabase) {
        try {
            const { error } = await supabase
                .from('store_config')
                .upsert({ id: 1, data: data });
            
            if (error) throw error;
            saved = true;
        } catch (e) {
            console.warn("Supabase save failed", e);
        }
    }

    // C. Handle Result
    if (saved) {
        // Only update local cache if cloud sync succeeded
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        console.log("Data synced to Remote successfully");
    } else {
        // Critical Error: Do NOT silently save to local storage if cloud failed.
        // User requested: "should never upload local" -> imply strict sync requirement.
        throw new Error("Connection Failed: Could not sync to Server or Database. Changes not saved.");
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };
