import { StoreData, Product, Catalogue, ArchiveData, KioskRegistry, Manual, AdminUser } from "../types";
import { supabase, getEnv, initSupabase } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

const DEFAULT_ADMIN: AdminUser = {
    id: 'super-admin',
    name: 'Admin',
    pin: '1723',
    isSuperAdmin: true,
    permissions: {
        inventory: true,
        marketing: true,
        tv: true,
        screensaver: true,
        fleet: true,
        history: true,
        settings: true,
        pricelists: true
    }
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
  pricelists: [],
  brands: [],
  tv: {
    brands: []
  },
  ads: {
    homeBottomLeft: [],
    homeBottomRight: [],
    homeSideVertical: [],
    screensaver: []
  },
  fleet: [],
  about: {
      title: "About Our Vision",
      text: "Welcome to the Kiosk Pro Showcase.\n\nWe are a premier provider of digital retail solutions, dedicated to bridging the gap between physical stores and the digital world. Our mission is to empower customers with information.\n\nThis kiosk is designed to provide you with a comprehensive view of our product catalog, complete with high-definition visuals, detailed specifications, and instant access to stock availability. We believe in transparency and quality, ensuring that every product you see meets our rigorous standards.\n\nExplore our curated selection of top-tier brands, compare features side-by-side, and discover new arrivals daily. Whether you are a tech enthusiast, a fashion forward individual, or simply looking for the best deals, our platform is built for you.\n\nIf you require assistance, our knowledgeable staff is just a tap away. Thank you for choosing us for your shopping journey.",
      audioUrl: ""
  },
  admins: [DEFAULT_ADMIN],
  appConfig: {
      kioskIconUrl: "https://i.ibb.co/S7Nxv1dD/android-launchericon-512-512.png",
      adminIconUrl: "https://i.ibb.co/RG6qW4Nw/maskable-icon.png"
  }
};

// Helper to migrate legacy data structures and Hydrate empty DB responses
const migrateData = (data: any): StoreData => {
    // 1. Force Critical Arrays to Exist (Fixes 'flatMap' error on fresh DB)
    if (!data.brands || !Array.isArray(data.brands)) data.brands = [];
    if (!data.catalogues || !Array.isArray(data.catalogues)) data.catalogues = [];
    if (!data.pricelists || !Array.isArray(data.pricelists)) data.pricelists = [];
    if (!data.fleet || !Array.isArray(data.fleet)) data.fleet = [];
    
    // 2. Force Config Objects to Exist
    if (!data.hero) data.hero = { ...DEFAULT_DATA.hero };
    if (!data.ads) data.ads = { ...DEFAULT_DATA.ads };
    if (!data.screensaverSettings) data.screensaverSettings = { ...DEFAULT_DATA.screensaverSettings };
    if (!data.about) data.about = { ...DEFAULT_DATA.about };
    
    // Admin Config & Migration
    if (!data.admins || !Array.isArray(data.admins) || data.admins.length === 0) {
        data.admins = [DEFAULT_ADMIN];
    } else {
        // Enforce permissions for existing admins to ensure new features (like pricelists) appear
        data.admins.forEach((admin: any) => {
             if (!admin.permissions) {
                 admin.permissions = { ...DEFAULT_ADMIN.permissions };
             }
             
             // Backfill 'pricelists' permission if missing, or if Super Admin
             if (typeof admin.permissions.pricelists === 'undefined' || admin.isSuperAdmin) {
                 admin.permissions.pricelists = true;
             }

             // CRITICAL FIX: Force the main "Admin" (1723) to always have full permissions
             // Using case-insensitive check for robustness
             if (admin.name.toLowerCase() === 'admin' && admin.pin === '1723') {
                 admin.isSuperAdmin = true;
                 admin.permissions = {
                    inventory: true,
                    marketing: true,
                    tv: true,
                    screensaver: true,
                    fleet: true,
                    history: true,
                    settings: true,
                    pricelists: true
                 };
             }
        });
    }

    // App Icons Config
    if (!data.appConfig) {
        data.appConfig = { ...DEFAULT_DATA.appConfig };
    } else {
        // Fix for old local data pointing to missing SVGs or old defaults
        if (data.appConfig.kioskIconUrl === "/icon-kiosk.svg") data.appConfig.kioskIconUrl = DEFAULT_DATA.appConfig!.kioskIconUrl;
        if (data.appConfig.adminIconUrl === "/icon-admin.svg") data.appConfig.adminIconUrl = DEFAULT_DATA.appConfig!.adminIconUrl;
    }
    
    // TV Config
    if (!data.tv) data.tv = { brands: [] };
    if (data.tv && !data.tv.brands) data.tv.brands = [];

    // 3. Migrate Deep Structures
    if (data.brands) {
        data.brands.forEach((b: any) => {
            if (!b.categories) b.categories = [];
            b.categories.forEach((c: any) => {
                if (!c.products) c.products = [];
                c.products.forEach((p: any) => {
                    // Check if dimensions is an object (legacy) instead of array
                    if (p.dimensions && !Array.isArray(p.dimensions)) {
                        p.dimensions = [{
                            label: "Dimensions",
                            ...p.dimensions
                        }];
                    }

                    // Migrate Legacy Single Manual to Array
                    if (!p.manuals) p.manuals = [];
                    if ((p.manualUrl || (p.manualImages && p.manualImages.length > 0)) && p.manuals.length === 0) {
                        p.manuals.push({
                            id: `legacy-manual-${p.id}`,
                            title: 'User Manual',
                            images: p.manualImages || [],
                            pdfUrl: p.manualUrl
                        });
                        // Clean legacy to avoid duplication on logic later
                        // p.manualUrl = undefined;
                        // p.manualImages = undefined;
                    }
                });
            });
        });
    }

    // 4. Migrate TV Brands (Videos directly on Brand -> Videos in Models)
    if (data.tv && data.tv.brands) {
        data.tv.brands.forEach((tvb: any) => {
            if (!tvb.models) tvb.models = [];
            
            // If legacy videoUrls exist on the brand, move them to a generic model
            if (tvb.videoUrls && Array.isArray(tvb.videoUrls) && tvb.videoUrls.length > 0) {
                // Only create if empty to avoid duplication on re-run
                if (tvb.models.length === 0) {
                    tvb.models.push({
                        id: `migrated-model-${tvb.id}`,
                        name: "General Showcase",
                        imageUrl: tvb.logoUrl, // Fallback to logo
                        videoUrls: [...tvb.videoUrls]
                    });
                }
                // Clear legacy
                tvb.videoUrls = undefined;
            }
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

// 1. Fetch Data - STRATEGY: AGGRESSIVE CLOUD FETCH + FLEET MERGE
const generateStoreData = async (): Promise<StoreData> => {
  if (!supabase) initSupabase();

  // A. Try Supabase FIRST (Primary Source)
  if (supabase) {
      try {
          console.log("Fetching data from Cloud...");
          
          // Parallel Fetch: Config JSON + Kiosks Table
          const [configResponse, fleetResponse] = await Promise.all([
              supabase.from('store_config').select('data').eq('id', 1).single(),
              supabase.from('kiosks').select('*')
          ]);
          
          const rawConfig = configResponse.data?.data || {};
          let processedData = migrateData(rawConfig);
          
          // CRITICAL FIX: Override JSON fleet with SQL Table fleet
          if (fleetResponse.data) {
              const mappedFleet: KioskRegistry[] = fleetResponse.data.map((k: any) => ({
                  id: k.id,
                  name: k.name,
                  device_type: k.device_type,
                  status: k.status,
                  last_seen: k.last_seen,
                  wifiStrength: k.wifi_strength,
                  ipAddress: k.ip_address,
                  version: k.version,
                  locationDescription: k.location_description,
                  assignedZone: k.assigned_zone,
                  notes: k.notes,
                  snapshotUrl: k.snapshot_url,
                  requestSnapshot: k.request_snapshot,
                  restartRequested: k.restart_requested
              }));
              processedData.fleet = mappedFleet;
          }
              
          // Run expiration check
          processedData = await handleExpiration(processedData);

          // Update Local Cache
          try {
              localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(processedData));
          } catch (e) {
              console.warn("LocalStorage quota exceeded.");
          }
          
          return processedData;
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

  return migrateData(DEFAULT_DATA);
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
            // We do NOT save fleet back to the JSON blob to avoid race conditions.
            // Fleet is managed via the 'kiosks' table exclusively.
            const { fleet, ...dataToSave } = data;
            
            const { error } = await supabase
                .from('store_config')
                .upsert({ id: 1, data: dataToSave });
            
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