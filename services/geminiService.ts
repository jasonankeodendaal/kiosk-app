
import { StoreData } from "../types";
import { supabase } from "./kioskService";

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

// 1. Fetch Data (Supabase -> LocalStorage Fallback)
const generateStoreData = async (): Promise<StoreData> => {
  // Try Cloud First
  if (supabase) {
      try {
          const { data, error } = await supabase
              .from('store_config')
              .select('data')
              .eq('id', 1)
              .single();
          
          if (data && data.data) {
              const rawData = data.data;
              
              // FIX: Merge with default structure to prevent crash if JSON is partial or empty ({})
              const mergedData: StoreData = {
                  ...DEFAULT_DATA,
                  ...rawData,
                  // Explicitly ensure arrays exist, even if DB has them as undefined
                  brands: rawData.brands || [],
                  fleet: rawData.fleet || [],
                  ads: rawData.ads || DEFAULT_DATA.ads,
                  hero: { ...DEFAULT_DATA.hero, ...(rawData.hero || {}) },
                  catalog: { ...DEFAULT_DATA.catalog, ...(rawData.catalog || {}) }
              };

              // Cache it locally
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(mergedData));
              return mergedData;
          }
      } catch (e) {
          console.warn("Supabase fetch failed, falling back to local", e);
      }
  }

  // Fallback to Local Storage
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      return JSON.parse(stored);
    }
    // Save defaults if nothing exists
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to load local data", e);
    return DEFAULT_DATA;
  }
};

// 2. Save Data (Supabase + LocalStorage)
const saveStoreData = async (data: StoreData): Promise<void> => {
    // Save Locally
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));

    // Save to Cloud
    if (supabase) {
        try {
            const { error } = await supabase
                .from('store_config')
                .upsert({ id: 1, data: data });
            
            if (error) throw error;
            console.log("Global Config Saved to Supabase");
        } catch (e) {
            console.error("Failed to save to Supabase", e);
            alert("Saved locally, but Cloud Sync failed. Check internet connection.");
        }
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };
