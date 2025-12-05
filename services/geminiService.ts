

import { StoreData } from "../types";
import { supabase, getEnv, initSupabase } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

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
       title: "Main Showcase Catalogue",
       year: 2025,
       startDate: "2025-01-01",
       endDate: "2025-12-31",
       pages: [
         "https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?q=80&w=1000&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5?q=80&w=1000&auto=format&fit=crop",
         "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1000&auto=format&fit=crop"
       ]
    },
    {
       id: "cat-nexus-tech",
       brandId: "b1", // Nexus Tech
       title: "Nexus Features Catalogue",
       year: 2024,
       startDate: "2024-03-01",
       endDate: "2024-09-30",
       pages: [
          "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1000&auto=format&fit=crop"
       ]
    },
    {
       id: "cat-urban-fit",
       brandId: "b3", // Urban Fit
       title: "Urban Collection Catalogue",
       year: 2025,
       startDate: "2025-02-15",
       endDate: "2025-08-15",
       pages: [
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1560769629-975e13f0c470?q=80&w=1000&auto=format&fit=crop"
       ]
    }
  ],
  ads: {
    homeBottomLeft: [
       { id: "ad1", type: "image", url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1000&auto=format&fit=crop" }
    ],
    homeBottomRight: [
       { id: "ad2", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" }
    ],
    homeSideVertical: [
       { id: "ad3", type: "image", url: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=1000&auto=format&fit=crop" }
    ],
    screensaver: [
       { id: "ss-v1", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
       { id: "ss-i1", type: "image", url: "https://images.unsplash.com/photo-1550745165-9010d9559854?q=80&w=2000&auto=format&fit=crop" },
       { id: "ss-v2", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" }
    ]
  },
  fleet: [],
  brands: [
    {
      id: "b1",
      name: "Nexus Tech",
      logoUrl: "https://cdn-icons-png.flaticon.com/512/732/732221.png", 
      categories: [
        {
          id: "c1",
          name: "Smartphone",
          icon: "Smartphone",
          products: [
            {
              id: "p1",
              name: "Nexus Prime X1",
              description: "The ultimate flagship with a bezel-less ceramic display and AI-core processing.",
              specs: { processor: "Octa-Core 3.2GHz", memory: "12GB RAM", screen: "6.8 inch OLED", battery: "5000mAh" },
              features: ["Ceramic Shield", "Night Sight 4.0", "Wireless Charging"],
              dimensions: { width: "75mm", height: "160mm", depth: "8mm", weight: "190g" },
              imageUrl: "https://images.unsplash.com/photo-1598327770170-3a8e72d263ba?q=80&w=1000&auto=format&fit=crop",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              galleryUrls: [
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1556656793-02715d8dd660?q=80&w=1000&auto=format&fit=crop"
              ]
            },
            {
              id: "p2",
              name: "Nexus Fold",
              description: "Unfold infinite possibilities with the 7.6-inch main screen.",
              specs: { processor: "Snapdragon 8 Gen 2", memory: "16GB RAM", screen: "7.6 inch Foldable" },
              features: ["Multi-window", "Flex Mode", "S-Pen Support"],
              dimensions: { width: "130mm", height: "160mm", depth: "6mm", weight: "260g" },
              imageUrl: "https://images.unsplash.com/photo-1612444530582-fc66183b16f7?q=80&w=1000&auto=format&fit=crop",
              galleryUrls: [
                 "https://images.unsplash.com/photo-1660149021666-6b22b6222b05?q=80&w=1000&auto=format&fit=crop"
              ]
            }
          ]
        },
        {
            id: "c2",
            name: "Laptop",
            icon: "Laptop",
            products: [
                {
                    id: "p3",
                    name: "Nexus Book Pro",
                    description: "Power meets portability in this sleek aluminum chassis.",
                    specs: { cpu: "M2 Chip", ram: "16GB", storage: "1TB SSD" },
                    features: ["Retina Display", "20h Battery", "Touch Bar"],
                    dimensions: { width: "300mm", height: "200mm", depth: "15mm", weight: "1.2kg" },
                    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=1000&auto=format&fit=crop",
                    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                }
            ]
        }
      ]
    },
    {
        id: "b2",
        name: "Luxe Living",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/5977/5977585.png",
        categories: [
            {
                id: "c3",
                name: "Furniture",
                icon: "Box",
                products: [
                    {
                        id: "p4",
                        name: "Eames Style Chair",
                        description: "Mid-century modern design for the contemporary home.",
                        specs: { material: "Walnut & Leather", style: "Mid-Century" },
                        features: ["Ergonomic", "Premium Leather", "Hand-finished"],
                        dimensions: { width: "80cm", height: "90cm", depth: "80cm", weight: "15kg" },
                        imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop",
                        galleryUrls: [
                           "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1000&auto=format&fit=crop"
                        ]
                    },
                    {
                        id: "p5",
                        name: "Minimalist Lamp",
                        description: "Warm lighting with a sleek industrial design.",
                        specs: { material: "Brass", bulb: "LED 10W" },
                        features: ["Dimmable", "Touch Control"],
                        dimensions: { width: "20cm", height: "50cm", depth: "20cm", weight: "2kg" },
                        imageUrl: "https://images.unsplash.com/photo-1507473888900-52e1adad5481?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b3",
        name: "Urban Fit",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/2589/2589903.png",
        categories: [
            {
                id: "c4",
                name: "Shoes",
                icon: "Box",
                products: [
                    {
                        id: "p6",
                        name: "Runner X 200",
                        description: "High-performance running shoes for the marathon elite.",
                        specs: { size: "US 7-13", material: "Mesh", weight: "200g" },
                        features: ["Air Cushion", "Breathable", "Reflective"],
                        dimensions: { width: "10cm", height: "15cm", depth: "30cm", weight: "400g" },
                        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
                        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                    },
                    {
                        id: "p7",
                        name: "Urban Street Hoodie",
                        description: "Cotton fleece hoodie for everyday comfort.",
                        specs: { size: "S-XL", material: "100% Cotton" },
                        features: ["Kangaroo Pocket", "Double-stitch", "Pre-shrunk"],
                        dimensions: { width: "N/A", height: "N/A", depth: "N/A", weight: "0.5kg" },
                        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    // --- NEW MOCK BRANDS FOR TESTING ---
    {
        id: "b4",
        name: "Zenith Watches",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/2784/2784461.png",
        categories: [
            {
                id: "c5",
                name: "Chronographs",
                icon: "Watch",
                products: [
                    {
                        id: "p8",
                        name: "ChronoMaster T500",
                        description: "Precision engineering meets timeless elegance.",
                        specs: { movement: "Automatic", glass: "Sapphire" },
                        features: ["Water Resistant 100m", "Date Window"],
                        dimensions: { width: "42mm", height: "12mm", depth: "42mm", weight: "120g" },
                        imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b5",
        name: "Gourmet Chef",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/1830/1830839.png",
        categories: [
            {
                id: "c6",
                name: "Kitchen",
                icon: "Box",
                products: [
                    {
                        id: "p9",
                        name: "Pro Series Blender",
                        description: "Blend smoothies, soups, and more in seconds.",
                        specs: { power: "1200W", capacity: "2L" },
                        features: ["Ice Crush Mode", "Self Cleaning"],
                        dimensions: { width: "20cm", height: "45cm", depth: "20cm", weight: "3kg" },
                        imageUrl: "https://images.unsplash.com/photo-1570222094114-28a9d88a27e6?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b6",
        name: "Velocity Cycle",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
        categories: [
            {
                id: "c7",
                name: "Road Bikes",
                icon: "Box",
                products: [
                    {
                        id: "p10",
                        name: "Carbon Aero 500",
                        description: "Lightweight carbon fiber frame for maximum speed.",
                        specs: { frame: "Carbon Fiber", gears: "Shimano 21-Speed" },
                        features: ["Aerodynamic Rims", "Hydraulic Brakes"],
                        dimensions: { width: "50cm", height: "100cm", depth: "180cm", weight: "8kg" },
                        imageUrl: "https://images.unsplash.com/photo-1485965120184-e224f7a1db69?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b7",
        name: "Visionary Lens",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/685/685655.png",
        categories: [
            {
                id: "c8",
                name: "Cameras",
                icon: "Box",
                products: [
                    {
                        id: "p11",
                        name: "Alpha DSLR 90D",
                        description: "Capture the world in stunning 4K detail.",
                        specs: { sensor: "Full Frame", resolution: "45MP" },
                        features: ["Wi-Fi Transfer", "Touch Screen"],
                        dimensions: { width: "14cm", height: "10cm", depth: "8cm", weight: "700g" },
                        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b8",
        name: "Audio X",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/3659/3659898.png",
        categories: [
            {
                id: "c9",
                name: "Headphones",
                icon: "Headphones",
                products: [
                    {
                        id: "p12",
                        name: "Studio Pro NC",
                        description: "Industry-leading noise cancellation.",
                        specs: { battery: "30 Hours", connectivity: "Bluetooth 5.2" },
                        features: ["Active Noise Cancel", "Transparency Mode"],
                        dimensions: { width: "18cm", height: "20cm", depth: "8cm", weight: "250g" },
                        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b9",
        name: "Solaris Power",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png",
        categories: [
            {
                id: "c10",
                name: "Smart Home",
                icon: "Box",
                products: [
                    {
                        id: "p13",
                        name: "Home Battery Wall",
                        description: "Store solar energy for use anytime.",
                        specs: { capacity: "13.5kWh", warranty: "10 Years" },
                        features: ["App Monitoring", "Backup Protection"],
                        dimensions: { width: "80cm", height: "120cm", depth: "15cm", weight: "120kg" },
                        imageUrl: "https://images.unsplash.com/photo-1592833159057-65a284572bfe?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    },
    {
        id: "b10",
        name: "Titan Gaming",
        logoUrl: "https://cdn-icons-png.flaticon.com/512/686/686589.png",
        categories: [
            {
                id: "c11",
                name: "Consoles",
                icon: "Box",
                products: [
                    {
                        id: "p14",
                        name: "Titan Box Series X",
                        description: "The most powerful console ever made.",
                        specs: { gpu: "12 TFLOPS", storage: "1TB SSD" },
                        features: ["8K Gaming", "Ray Tracing"],
                        dimensions: { width: "15cm", height: "30cm", depth: "15cm", weight: "4kg" },
                        imageUrl: "https://images.unsplash.com/photo-1621259182902-88055ebbef0f?q=80&w=1000&auto=format&fit=crop"
                    }
                ]
            }
        ]
    }
  ]
};

// 1. Fetch Data - STRATEGY: SUPABASE FIRST
const generateStoreData = async (): Promise<StoreData> => {
  // Check both standard Vite and Vercel/Next.js environment variables
  const apiUrl = getEnv('VITE_API_URL', getEnv('NEXT_PUBLIC_API_URL', ''));

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
              const rawData = data.data;
              const mergedData: StoreData = {
                  ...DEFAULT_DATA,
                  ...rawData,
                  brands: rawData.brands || [],
                  fleet: rawData.fleet || [],
                  ads: rawData.ads || DEFAULT_DATA.ads,
                  hero: { ...DEFAULT_DATA.hero, ...(rawData.hero || {}) },
                  catalogues: rawData.catalogues || [],
                  screensaverSettings: { ...DEFAULT_DATA.screensaverSettings, ...(rawData.screensaverSettings || {}) }
              };
              
              // Safe Save to LocalStorage
              try {
                  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(mergedData));
              } catch (e) {
                  console.warn("LocalStorage quota exceeded during fetch. Skipping cache update.");
              }
              
              return mergedData;
          }
      } catch (e) {
          console.warn("Supabase fetch failed", e);
      }
  }

  // B. Try API / PC Hub (Secondary Source / Local Dev)
  if (apiUrl) {
      try {
          const endpoint = apiUrl ? `${apiUrl}/api/config` : '/api/config';
          const res = await fetch(endpoint);
          if (res.ok) {
              const remoteData = await res.json();
              if (remoteData && Object.keys(remoteData).length > 0) {
                   const merged = { ...DEFAULT_DATA, ...remoteData };
                   try {
                       localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(merged));
                   } catch(e) {
                       console.warn("LocalStorage full.");
                   }
                   return merged;
              }
          }
      } catch (e) {
          console.warn("Hub API fetch failed", e);
      }
  }

  // C. Fallback to Local Storage (Offline Mode)
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
    try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_DATA));
    } catch(e) {
        // Ignore quota error for default data
    }
    return DEFAULT_DATA;
  } catch (e) {
    console.error("Failed to load local data", e);
    return DEFAULT_DATA;
  }
};

// 2. Save Data - STRATEGY: SUPABASE FIRST, BUT ALWAYS SAVE LOCAL
const saveStoreData = async (data: StoreData): Promise<void> => {
    let savedRemote = false;
    const apiUrl = getEnv('VITE_API_URL', getEnv('NEXT_PUBLIC_API_URL', ''));

    // Always save to Local Storage first (Safety)
    // WRAPPED IN TRY/CATCH TO PREVENT QUOTA CRASH
    try {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    } catch (e) {
        console.warn("CRITICAL: LocalStorage Quota Exceeded. Data saved to memory but not cached locally.");
    }

    // Ensure Supabase is init
    if (!supabase) initSupabase();

    // A. Try Supabase
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

    // B. Try API / PC Hub (If Supabase failed or not available)
    if (!savedRemote && apiUrl) {
        try {
            const endpoint = apiUrl ? `${apiUrl}/api/update` : '/api/update';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) savedRemote = true;
        } catch (e) {
            console.warn("Hub API save failed", e);
        }
    }

    // C. Handle Result
    if (savedRemote) {
        console.log("Data synced to Remote successfully");
    } else {
        // We do NOT throw error here if local save worked, but we warn the user.
        console.error("Connection Failed: Could not sync to Database. Changes saved LOCALLY only.");
        throw new Error("Connection Failed: Remote sync failed. Changes saved locally only.");
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };