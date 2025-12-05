

import { StoreData, Product, Catalogue, ArchiveData } from "../types";
import { supabase, getEnv, initSupabase } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

// Helper to migrate legacy data structures
const migrateData = (data: any): StoreData => {
    // Migrate Dimensions: Object -> Array
    if (data.brands) {
        data.brands.forEach((b: any) => {
            b.categories.forEach((c: any) => {
                c.products.forEach((p: any) => {
                    // Check if dimensions is an object (legacy) instead of array
                    if (p.dimensions && !Array.isArray(p.dimensions)) {
                        p.dimensions = [{
                            label: "Dimensions",
                            ...p.dimensions
                        }];
                    }
                });
            });
        });
    }
    
    // Ensure Catalogue Types
    if (data.catalogues) {
        data.catalogues.forEach((c: any) => {
             if(!c.type) {
                 c.type = c.brandId ? 'catalogue' : 'pamphlet';
             }
        });
    }

    return data as StoreData;
};

// Auto-Archive Expired Pamphlets
const handleExpiration = async (data: StoreData): Promise<StoreData> => {
    if (!data.catalogues) return data;

    const now = new Date();
    const activeCatalogues: Catalogue[] = [];
    const expiredCatalogues: Catalogue[] = [];

    data.catalogues.forEach(c => {
        // Only expire items with an Explicit End Date
        if (c.endDate && new Date(c.endDate) < now) {
            console.log(`Auto-Archiving Expired Item: ${c.title}`);
            expiredCatalogues.push(c);
        } else {
            activeCatalogues.push(c);
        }
    });

    if (expiredCatalogues.length > 0) {
        const newArchive: ArchiveData = {
            ...data.archive,
            brands: data.archive?.brands || [],
            products: data.archive?.products || [],
            catalogues: [...(data.archive?.catalogues || []), ...expiredCatalogues],
            deletedAt: {
                ...(data.archive?.deletedAt || {}),
                ...expiredCatalogues.reduce((acc, curr) => ({ ...acc, [curr.id]: new Date().toISOString() }), {})
            }
        };

        const updatedData = { ...data, catalogues: activeCatalogues, archive: newArchive };
        
        // If we are online, save this cleanup immediately
        if (supabase) {
             await supabase.from('store_config').update({ data: updatedData }).eq('id', 1);
        }
        
        return updatedData;
    }

    return data;
};

// Full Static Default Data (Fallback)
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
  catalogues: [],
  ads: {
    homeBottomLeft: [],
    homeBottomRight: [],
    homeSideVertical: [],
    screensaver: []
  },
  fleet: [],
  brands: []
};

// 1. Fetch Data - STRATEGY: AGGRESSIVE CLOUD FETCH
const generateStoreData = async (): Promise<StoreData> => {
  if (!supabase) initSupabase();

  // A. Try Supabase FIRST (Primary Source)
  if (supabase) {
      try {
          console.log("Fetching data from Cloud...");
          const { data, error } = await supabase
              .from('store_config')
              .select('data')
              .eq('id', 1)
              .single();
          
          if (data && data.data) {
              console.log("Cloud Data Received.");
              let processedData = migrateData(data.data);
              
              // Run expiration check
              processedData = await handleExpiration(processedData);

              // Update Local Cache
              try {
                  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(processedData));
              } catch (e) {
                  console.warn("LocalStorage quota exceeded.");
              }
              
              return processedData;
          } else if (error) {
              console.warn("Supabase returned error, falling back to local.", error.message);
          }
      } catch (e) {
          console.warn("Supabase fetch failed", e);
      }
  }

  // B. Fallback to Local Storage
  console.log("Loading from Local Storage...");
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      const parsed = JSON.parse(stored);
      return migrateData(parsed);
    }
  } catch (e) {
    console.error("Failed to load local data", e);
  }

  return DEFAULT_DATA;
};

// 2. Save Data
const saveStoreData = async (data: StoreData): Promise<void> => {
    let savedRemote = false;

    // 1. Local Save
    try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    } catch (e) {
        console.warn("CRITICAL: LocalStorage Quota Exceeded.");
    }

    if (!supabase) initSupabase();

    // 2. Remote Save
    if (supabase) {
        try {
            const { error } = await supabase
                .from('store_config')
                .upsert({ id: 1, data: data });
            
            if (error) throw error;
            savedRemote = true;
        } catch (e) {
            console.warn("Supabase save failed", e);
        }
    }

    if (savedRemote) {
        console.log("Data synced to Remote successfully");
    } else {
        console.error("Connection Failed: Could not sync to Database. Changes saved LOCALLY only.");
        throw new Error("Connection Failed: Remote sync failed. Changes saved locally only.");
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };