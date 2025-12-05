

import { StoreData, Catalogue, ArchiveData } from "../types";
import { supabase, getEnv, initSupabase } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

// Helper to migrate legacy single-dimension objects to array
const migrateDimensions = (data: any): any => {
    if(!data || !data.brands) return data;
    
    data.brands.forEach((brand: any) => {
        brand.categories.forEach((cat: any) => {
            cat.products.forEach((prod: any) => {
                // If dimensions is an object but not an array, wrap it
                if (prod.dimensions && !Array.isArray(prod.dimensions)) {
                     prod.dimensions = [{ ...prod.dimensions, label: 'Standard' }];
                }
                // Ensure default if missing
                if (!prod.dimensions) prod.dimensions = [];
            });
        });
    });
    return data;
};

// Helper to check and move expired pamphlets to archive
const archiveExpiredContent = (data: StoreData): StoreData => {
    if (!data.catalogues) return data;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const active: Catalogue[] = [];
    const expired: Catalogue[] = [];

    data.catalogues.forEach(cat => {
        // Rules:
        // 1. If type is 'catalogue' (Brand), it never expires based on date (Yearly).
        // 2. If type is 'pamphlet' (Global), check endDate.
        
        let isExpired = false;
        
        // Auto-detect type if missing based on fields
        if (!cat.type) {
            cat.type = cat.brandId ? 'catalogue' : 'pamphlet';
        }

        if (cat.type === 'pamphlet' && cat.endDate) {
            if (cat.endDate < todayStr) {
                isExpired = true;
            }
        }

        if (isExpired) {
            expired.push(cat);
        } else {
            active.push(cat);
        }
    });

    if (expired.length > 0) {
        console.log(`Archiving ${expired.length} expired pamphlets...`);
        const newArchive: ArchiveData = {
            ...data.archive,
            brands: data.archive?.brands || [],
            products: data.archive?.products || [],
            catalogues: [...(data.archive?.catalogues || []), ...expired],
            deletedAt: {
                ...data.archive?.deletedAt,
                ...expired.reduce((acc, curr) => ({ ...acc, [curr.id]: new Date().toISOString() }), {})
            }
        };

        return {
            ...data,
            catalogues: active,
            archive: newArchive
        };
    }

    return data;
};

// Full Static Default Data (Mock Data for Testing)
const DEFAULT_DATA: StoreData = {
  companyLogoUrl: "https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png",
  hero: {
    title: "Future Retail Experience",
    subtitle: "Discover the latest in Tech, Fashion, and Lifestyle.",
    backgroundImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    logoUrl: "https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png",
    websiteUrl: "https://jstyp.me"
  },
  screensaverSettings: {
    idleTimeout: 60,
    imageDuration: 8,
    muteVideos: false,
    showProductImages: true,
    showProductVideos: true,
    showPamphlets: true,
    showCustomAds: true
  },
  catalogues: [
    {
       id: "cat-main-2025",
       title: "Main Showcase Pamphlet",
       type: 'pamphlet',
       year: 2025,
       startDate: "2025-01-01",
       endDate: "2025-12-31",
       pages: [
         "https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?q=80&w=1000&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?q=80&w=1000&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1000&auto=format&fit=crop"
       ]
    }
  ],
  ads: {
    homeBottomLeft: [],
    homeBottomRight: [],
    homeSideVertical: [],
    screensaver: []
  },
  fleet: [],
  brands: []
};

// 1. Fetch Data - STRATEGY: SUPABASE FIRST
const generateStoreData = async (): Promise<StoreData> => {
  // Ensure Supabase is init
  if (!supabase) initSupabase();

  // A. Try Supabase FIRST (Primary Source)
  if (supabase) {
      try {
          const { data, error } = await supabase
              .from('store_config')
              .select('data')
              .eq('id', 1)
              .single();
          
          if (data && data.data) {
              let fetchedData = data.data;
              
              // 1. Migrate Data Structure (Dimensions)
              fetchedData = migrateDimensions(fetchedData);
              
              // 2. Archive Expired Content
              fetchedData = archiveExpiredContent(fetchedData);

              const mergedData: StoreData = {
                  ...DEFAULT_DATA,
                  ...fetchedData,
                  brands: fetchedData.brands || [],
                  fleet: fetchedData.fleet || [],
                  ads: fetchedData.ads || DEFAULT_DATA.ads,
                  hero: { ...DEFAULT_DATA.hero, ...(fetchedData.hero || {}) },
                  catalogues: fetchedData.catalogues || [],
                  screensaverSettings: { ...DEFAULT_DATA.screensaverSettings, ...(fetchedData.screensaverSettings || {}) }
              };
              
              // Safe Save to LocalStorage
              try {
                  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(mergedData));
              } catch (e) {
                  console.warn("LocalStorage quota exceeded during fetch.");
              }
              
              return mergedData;
          }
      } catch (e) {
          console.warn("Supabase fetch failed", e);
      }
  }

  // B. Fallback to Local Storage (Offline Mode)
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      let parsed = JSON.parse(stored);
      parsed = migrateDimensions(parsed);
      parsed = archiveExpiredContent(parsed);
      return parsed;
    }
    try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_DATA));
    } catch(e) {}
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to load local data", e);
    return DEFAULT_DATA;
  }
};

// 2. Save Data - STRATEGY: SUPABASE FIRST, BUT ALWAYS SAVE LOCAL
const saveStoreData = async (data: StoreData): Promise<void> => {
    // 1. Run Archiver before saving (clean up expired stuff)
    const cleanData = archiveExpiredContent(data);

    // Always save to Local Storage first (Safety)
    try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(cleanData));
    } catch (e) {
        console.warn("CRITICAL: LocalStorage Quota Exceeded.");
    }

    // Ensure Supabase is init
    if (!supabase) initSupabase();

    if (supabase) {
        try {
            const { error } = await supabase
                .from('store_config')
                .upsert({ id: 1, data: cleanData });
            
            if (error) throw error;
        } catch (e: any) {
            console.error("Supabase save failed:", e.message);
            throw new Error(`Connection Failed: ${e.message}`);
        }
    } else {
        throw new Error("Cloud database not configured. Saved locally only.");
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };