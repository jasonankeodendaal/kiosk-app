
import { StoreData } from "../types";
import { supabase, getEnv } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

const DEFAULT_DATA: StoreData = {
  companyLogoUrl: "",
  hero: {
    title: "Our Partners",
    subtitle: "Select a brand to explore.",
    backgroundImageUrl: "", 
    logoUrl: "",
    websiteUrl: ""
  },
  catalogues: [], 
  ads: {
    homeBottomLeft: [],
    homeBottomRight: [],
    homeSideVertical: [],
    screensaver: []
  },
  fleet: [], 
  brands: [
    {
      id: "b1",
      name: "Nexus",
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
              specs: { processor: "Octa-Core 3.2GHz", memory: "12GB RAM" },
              features: ["Ceramic Shield", "Night Sight 4.0"],
              dimensions: { width: "75mm", height: "160mm", depth: "8mm", weight: "190g" },
              imageUrl: "https://picsum.photos/seed/nexus1/600/600"
            }
          ]
        }
      ]
    }
  ]
};

// LOAD: Priority = API/Cloud -> Local Cache
export const loadStoreData = async (): Promise<StoreData> => {
  const apiUrl = getEnv('NEXT_PUBLIC_API_URL', getEnv('VITE_API_URL', ''));

  // 1. Try PC Hub / API
  if (apiUrl) {
      try {
          const res = await fetch(`${apiUrl}/api/config`);
          if (res.ok) {
              const remoteData = await res.json();
              if (remoteData && Object.keys(remoteData).length > 0) {
                   const merged = { ...DEFAULT_DATA, ...remoteData };
                   localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(merged));
                   return merged;
              }
          }
      } catch (e) { console.warn("API load failed", e); }
  }

  // 2. Try Supabase
  if (supabase) {
      try {
          const { data, error } = await supabase.from('store_config').select('data').eq('id', 1).single();
          if (data && data.data) {
              const mergedData = { ...DEFAULT_DATA, ...data.data };
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(mergedData));
              return mergedData;
          }
      } catch (e) { console.warn("Supabase load failed", e); }
  }

  // 3. Fallback to Cache (For Offline Reading ONLY)
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  return DEFAULT_DATA;
};

// SAVE: Strict Cloud-First. Throws error on failure. NO local fallback for writes.
export const saveStoreData = async (data: StoreData): Promise<void> => {
    let saved = false;
    const apiUrl = getEnv('NEXT_PUBLIC_API_URL', getEnv('VITE_API_URL', ''));

    // 1. Try API
    if (apiUrl) {
        try {
            const res = await fetch(`${apiUrl}/api/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) saved = true;
        } catch (e) { console.warn("API save failed", e); }
    }

    // 2. Try Supabase
    if (!saved && supabase) {
        const { error } = await supabase.from('store_config').upsert({ id: 1, data: data });
        if (!error) saved = true;
        else console.warn("Supabase save error", error);
    }

    if (saved) {
        // Only update local cache if cloud accepted the data
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        console.log("Cloud sync successful.");
    } else {
        // Critical Error: User requested strict cloud sync
        throw new Error("Cloud Sync Failed. Check internet or API configuration. Data NOT saved.");
    }
};

export const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};
