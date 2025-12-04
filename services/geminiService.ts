
import { StoreData } from "../types";
import { supabase, getEnv } from "./kioskService";

const STORAGE_KEY_DATA = 'kiosk_pro_store_data';

// Full Static Default Data (Mock Data for Testing)
const DEFAULT_DATA: StoreData = {
  companyLogoUrl: "https://placehold.co/100x100/3b82f6/white?text=LOGO",
  hero: {
    title: "Experience the Future",
    subtitle: "Explore the latest collection of premium innovative products.",
    backgroundImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    logoUrl: "https://placehold.co/200x80/transparent/white?text=STORE+PRO",
    websiteUrl: "https://example.com"
  },
  catalogues: [
    {
      id: "cat_global_1",
      title: "Store Monthly Highlights",
      year: 2024,
      month: 10,
      pages: [
        "https://placehold.co/600x800/1e293b/white?text=Cover+Page",
        "https://placehold.co/600x800/334155/white?text=Page+1+Highlights",
        "https://placehold.co/600x800/475569/white?text=Page+2+Deals"
      ]
    },
    {
      id: "cat_brand_1",
      brandId: "b1",
      title: "Apex Tech Catalog",
      year: 2024,
      pages: [
        "https://placehold.co/600x800/2563eb/white?text=Apex+Cover",
        "https://placehold.co/600x800/3b82f6/white?text=Apex+Phones",
        "https://placehold.co/600x800/60a5fa/white?text=Apex+Laptops"
      ]
    }
  ],
  ads: {
    homeBottomLeft: [
      { id: "ad1", type: "image", url: "https://placehold.co/800x400/1e293b/white?text=Big+Summer+Sale" },
      { id: "ad2", type: "image", url: "https://placehold.co/800x400/b91c1c/white?text=Clearance+Event" }
    ],
    homeBottomRight: [
      { id: "ad3", type: "image", url: "https://placehold.co/800x400/15803d/white?text=New+Arrivals" }
    ],
    homeSideVertical: [
      { id: "ad4", type: "image", url: "https://placehold.co/600x1200/4338ca/white?text=Featured+Partner" }
    ],
    screensaver: [
      { id: "ss1", type: "image", url: "https://images.unsplash.com/photo-1468495244123-6c6ef332ad22?q=80&w=2070&auto=format&fit=crop" },
      { id: "ss2", type: "image", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" }
    ]
  },
  fleet: [
    {
      id: "LOC-001",
      name: "Main Entrance Kiosk",
      status: "online",
      last_seen: new Date().toISOString(),
      wifiStrength: 85,
      ipAddress: "192.168.1.101",
      version: "1.0.4",
      locationDescription: "Ground Floor, North Wing",
      assignedZone: "Entrance",
      notes: "High traffic area."
    },
    {
      id: "LOC-002",
      name: "Electronics Dept",
      status: "online",
      last_seen: new Date().toISOString(),
      wifiStrength: 92,
      ipAddress: "192.168.1.102",
      version: "1.0.4",
      locationDescription: "Floor 2, Electronics Section",
      assignedZone: "Tech",
      notes: "Near the TV wall."
    },
    {
      id: "LOC-003",
      name: "Cafeteria Stand",
      status: "offline",
      last_seen: new Date(Date.now() - 86400000).toISOString(),
      wifiStrength: 0,
      ipAddress: "192.168.1.105",
      version: "1.0.3",
      locationDescription: "Food Court",
      assignedZone: "Dining",
      notes: "Needs maintenance."
    }
  ],
  brands: [
    {
      id: "b1",
      name: "Apex Tech",
      logoUrl: "https://placehold.co/200x200/2563eb/white?text=APEX",
      categories: [
        {
          id: "c1",
          name: "Smartphones",
          icon: "Smartphone",
          products: [
            {
              id: "p1",
              name: "Apex Prime X1",
              description: "The ultimate flagship with a bezel-less ceramic display and AI-powered photography.",
              sku: "APX-001",
              specs: { processor: "Octa-Core 3.2GHz", memory: "12GB RAM", screen: "6.8 inch OLED", battery: "5000mAh" },
              features: ["Ceramic Shield", "Night Sight 4.0", "Wireless Charging", "5G Ready"],
              dimensions: { width: "75mm", height: "160mm", depth: "8mm", weight: "190g" },
              imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780&auto=format&fit=crop",
              galleryUrls: [
                "https://images.unsplash.com/photo-1598327105666-5b89351aff70?q=80&w=1920&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=1934&auto=format&fit=crop"
              ]
            },
            {
              id: "p2",
              name: "Apex Lite 5",
              description: "Power and performance in a compact form factor. Perfect for everyday use.",
              sku: "APX-002",
              specs: { processor: "Hexa-Core 2.4GHz", memory: "8GB RAM", screen: "6.1 inch OLED", battery: "4000mAh" },
              features: ["All-day Battery", "Dual Camera System", "Water Resistant"],
              dimensions: { width: "70mm", height: "145mm", depth: "7.5mm", weight: "160g" },
              imageUrl: "https://images.unsplash.com/photo-1592899677712-a5a25450336b?q=80&w=1920&auto=format&fit=crop"
            }
          ]
        },
        {
          id: "c2",
          name: "Laptops",
          icon: "Laptop",
          products: [
            {
              id: "p3",
              name: "ApexBook Pro 16",
              description: "A powerhouse for creators. 16-inch Retina display and next-gen silicon.",
              sku: "APX-NB-16",
              specs: { processor: "M2 Max", memory: "32GB RAM", storage: "1TB SSD", screen: "16 inch Liquid Retina" },
              features: ["Magic Keyboard", "Touch Bar", "Studio Quality Mics"],
              dimensions: { width: "350mm", height: "240mm", depth: "16mm", weight: "2.1kg" },
              imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop"
            }
          ]
        }
      ]
    },
    {
      id: "b2",
      name: "Luxe Home",
      logoUrl: "https://placehold.co/200x200/ea580c/white?text=LUXE",
      categories: [
        {
          id: "c3",
          name: "Furniture",
          icon: "Box",
          products: [
            {
              id: "p4",
              name: "Velvet Lounge Sofa",
              description: "Mid-century modern design with plush velvet upholstery and brass legs.",
              sku: "LUX-SF-001",
              specs: { material: "Royal Velvet", legs: "Brass", seats: "3 Seater" },
              features: ["Stain Resistant", "High Density Foam", "Handcrafted"],
              dimensions: { width: "220cm", height: "85cm", depth: "90cm", weight: "45kg" },
              imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop"
            },
            {
              id: "p5",
              name: "Minimalist Oak Table",
              description: "Solid oak dining table with a natural finish. Seats 6 comfortably.",
              sku: "LUX-TB-05",
              specs: { material: "Solid Oak", finish: "Matte Lacquer" },
              features: ["Sustainable Wood", "Easy Assembly"],
              dimensions: { width: "180cm", height: "75cm", depth: "90cm", weight: "30kg" },
              imageUrl: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=2070&auto=format&fit=crop"
            }
          ]
        }
      ]
    },
    {
      id: "b3",
      name: "Urban Style",
      logoUrl: "https://placehold.co/200x200/7c3aed/white?text=URBAN",
      categories: [
        {
          id: "c4",
          name: "Streetwear",
          icon: "Watch",
          products: [
            {
              id: "p6",
              name: "Signature Hoodie",
              description: "Heavyweight cotton blend hoodie with embroidered logo.",
              sku: "URB-HD-01",
              specs: { material: "80% Cotton", size: "Unisex S-XL" },
              features: ["Double Stitching", "Kangaroo Pocket"],
              dimensions: { width: "N/A", height: "N/A", depth: "N/A", weight: "0.5kg" },
              imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070&auto=format&fit=crop"
            }
          ]
        },
        {
          id: "c5",
          name: "Accessories",
          icon: "Watch",
          products: [
            {
              id: "p7",
              name: "Chronograph Watch",
              description: "Matte black stainless steel watch with leather strap.",
              sku: "URB-WA-99",
              specs: { movement: "Quartz", water_resistance: "50m" },
              features: ["Scratch Resistant Glass", "Luminous Hands"],
              dimensions: { width: "42mm dial", height: "10mm", depth: "N/A", weight: "80g" },
              imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1999&auto=format&fit=crop"
            }
          ]
        }
      ]
    }
  ]
};

// 1. Fetch Data (Priority: API/Hub -> Supabase -> Local Cache)
const generateStoreData = async (): Promise<StoreData> => {
  // Check both standard Vite and Vercel/Next.js environment variables
  const apiUrl = getEnv('VITE_API_URL', getEnv('NEXT_PUBLIC_API_URL', ''));

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
                  catalogues: rawData.catalogues || [], // Changed to handle array of catalogues
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

// 2. Save Data (Strict Cloud First - Never fallback to local on failure)
const saveStoreData = async (data: StoreData): Promise<void> => {
    let saved = false;
    // Check both standard Vite and Vercel/Next.js environment variables
    const apiUrl = getEnv('VITE_API_URL', getEnv('NEXT_PUBLIC_API_URL', ''));

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
        try {
            localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        } catch (e) {
            console.warn("Local storage update failed (likely quota exceeded), but Cloud sync was successful.");
        }
        console.log("Data synced to Remote successfully");
    } else {
        // Critical Error: Do NOT silently save to local storage if cloud failed.
        // User requested: "should never upload local" -> imply strict sync requirement.
        throw new Error("Connection Failed: Could not sync to Server or Database. Changes not saved locally.");
    }
};

const resetStoreData = async (): Promise<StoreData> => {
    await saveStoreData(DEFAULT_DATA);
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };
