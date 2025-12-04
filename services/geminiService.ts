
import { StoreData } from "../types";

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
  fleet: [
    {
      id: "LOC-001",
      name: "Main Entrance",
      status: 'online',
      last_seen: new Date().toISOString(),
      wifiStrength: 95,
      ipAddress: '192.168.1.10',
      version: '1.0.4',
      locationDescription: 'Front lobby, facing security desk',
      assignedZone: 'Lobby',
      notes: 'Primary traffic point'
    },
    {
      id: "LOC-002",
      name: "Checkout Lane 4",
      status: 'offline',
      last_seen: new Date(Date.now() - 3600000).toISOString(),
      wifiStrength: 0,
      ipAddress: '192.168.1.12',
      version: '1.0.3',
      locationDescription: 'Near express checkout',
      assignedZone: 'Sales Floor',
      notes: 'Maintenance required'
    }
  ],
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
            },
            {
              id: "p2",
              name: "Nexus Lite",
              description: "Essential performance in a compact form factor.",
              specs: { processor: "Hexa-Core 2.8GHz", memory: "8GB RAM", screen: "6.1 inch OLED", battery: "4000mAh" },
              features: ["All-day Battery", "5G Ready", "Compact Design"],
              dimensions: { width: "70mm", height: "145mm", depth: "7.5mm", weight: "160g" },
              imageUrl: "https://picsum.photos/seed/nexus2/600/600"
            },
            {
              id: "p1a",
              name: "Nexus Pro Max",
              description: "Professional grade photography in your pocket.",
              specs: { processor: "Octa-Core 3.4GHz", memory: "16GB RAM", screen: "6.9 inch OLED", battery: "5500mAh" },
              features: ["100x Zoom", "8K Video", "Titanium Frame"],
              dimensions: { width: "78mm", height: "165mm", depth: "8.5mm", weight: "210g" },
              imageUrl: "https://picsum.photos/seed/nexuspromax/600/600"
            },
            {
              id: "p1b",
              name: "Nexus Flip",
              description: "Nostalgia meets future tech.",
              specs: { processor: "Octa-Core 3.0GHz", memory: "8GB RAM", screen: "6.7 inch Foldable", battery: "3800mAh" },
              features: ["Cover Screen", "Flex Mode", "Compact Fold"],
              dimensions: { width: "72mm", height: "165mm", depth: "7mm", weight: "185g" },
              imageUrl: "https://picsum.photos/seed/nexusflip/600/600"
            },
            {
              id: "p1c",
              name: "Nexus A50",
              description: "Mid-range champion with premium features.",
              specs: { processor: "Octa-Core 2.4GHz", memory: "6GB RAM", screen: "6.4 inch LCD", battery: "4500mAh" },
              features: ["90Hz Display", "Quad Camera", "3.5mm Jack"],
              dimensions: { width: "74mm", height: "158mm", depth: "8mm", weight: "180g" },
              imageUrl: "https://picsum.photos/seed/nexusa50/600/600"
            }
          ]
        },
        {
          id: "c2",
          name: "Tablet",
          icon: "Tablet",
          products: [
            {
              id: "p3",
              name: "Nexus Tab Pro",
              description: "A canvas for your creativity.",
              specs: { processor: "M1X Chip", memory: "16GB RAM", screen: "12.9 inch Mini-LED", battery: "10000mAh" },
              features: ["Stylus Included", "Quad Speakers", "Keyboard Support"],
              dimensions: { width: "215mm", height: "280mm", depth: "6mm", weight: "600g" },
              imageUrl: "https://picsum.photos/seed/nexustab/600/600"
            },
            {
              id: "p4",
              name: "Nexus Tab Mini",
              description: "Power in your pocket.",
              specs: { processor: "A15 Chip", memory: "6GB RAM", screen: "8.3 inch LCD", battery: "5000mAh" },
              features: ["Ultra Portable", "Reading Mode", "USB-C"],
              dimensions: { width: "135mm", height: "195mm", depth: "6.5mm", weight: "300g" },
              imageUrl: "https://picsum.photos/seed/nexustabmini/600/600"
            }
          ]
        }
      ]
    },
    {
      id: "b2",
      name: "Volt",
      logoUrl: "",
      categories: [
        {
          id: "c3",
          name: "Laptop",
          icon: "Laptop",
          products: [
            {
              id: "p5",
              name: "Volt Book Air",
              description: "Impossibly thin. Unbelievably powerful.",
              specs: { processor: "Volt V5", memory: "16GB RAM", screen: "13.3 inch Retina", battery: "18 Hours" },
              features: ["Silent Fanless Design", "Touch ID", "Aluminum Unibody"],
              dimensions: { width: "304mm", height: "212mm", depth: "11mm", weight: "1.2kg" },
              imageUrl: "https://picsum.photos/seed/voltbook/600/600"
            },
            {
              id: "p6",
              name: "Volt Station",
              description: "Workstation power in a portable chassis.",
              specs: { processor: "Volt V9 Pro", memory: "64GB RAM", screen: "16 inch XDR", battery: "12 Hours" },
              features: ["Hardware Ray Tracing", "Studio Mic", "HDMI 2.1"],
              dimensions: { width: "350mm", height: "240mm", depth: "16mm", weight: "2.1kg" },
              imageUrl: "https://picsum.photos/seed/voltstation/600/600"
            },
            {
              id: "p6a",
              name: "Volt 14",
              description: "Balanced performance for everyday tasks.",
              specs: { processor: "Volt V7", memory: "16GB RAM", screen: "14 inch LCD", battery: "15 Hours" },
              features: ["MagSafe", "SD Card Slot", "1080p Webcam"],
              dimensions: { width: "310mm", height: "220mm", depth: "15mm", weight: "1.5kg" },
              imageUrl: "https://picsum.photos/seed/volt14/600/600"
            }
          ]
        },
        {
          id: "c4",
          name: "Watch",
          icon: "Watch",
          products: [
            {
              id: "p7",
              name: "Volt Watch Ultra",
              description: "Rugged durability for extreme athletes.",
              specs: { processor: "S8 SiP", memory: "32GB Storage", screen: "49mm OLED", battery: "36 Hours" },
              features: ["Titanium Case", "Water Resist 100m", "Action Button"],
              dimensions: { width: "49mm", height: "44mm", depth: "14mm", weight: "61g" },
              imageUrl: "https://picsum.photos/seed/voltwatch/600/600"
            },
            {
              id: "p8",
              name: "Volt Band",
              description: "Track your fitness effortlessly.",
              specs: { processor: "S5 SiP", memory: "16GB Storage", screen: "41mm OLED", battery: "24 Hours" },
              features: ["Heart Rate", "Sleep Tracking", "Always-On Display"],
              dimensions: { width: "41mm", height: "35mm", depth: "10mm", weight: "32g" },
              imageUrl: "https://picsum.photos/seed/voltband/600/600"
            }
          ]
        }
      ]
    },
    {
      id: "b3",
      name: "Zenith",
      logoUrl: "",
      categories: [
        {
          id: "c5",
          name: "Headphones",
          icon: "Headphones",
          products: [
            {
              id: "p9",
              name: "Zenith ANC Pro",
              description: "Silence the world. Immerse yourself.",
              specs: { processor: "QN1 Chip", memory: "N/A", screen: "N/A", battery: "30 Hours" },
              features: ["Active Noise Cancel", "Transparency Mode", "Multipoint"],
              dimensions: { width: "180mm", height: "200mm", depth: "80mm", weight: "250g" },
              imageUrl: "https://picsum.photos/seed/zenithanc/600/600"
            },
            {
              id: "p10",
              name: "Zenith Buds",
              description: "True wireless freedom.",
              specs: { processor: "V1 Chip", memory: "N/A", screen: "N/A", battery: "8 Hours + Case" },
              features: ["IPX4 Water Resist", "Wireless Charging Case", "Voice Assistant"],
              dimensions: { width: "20mm", height: "20mm", depth: "15mm", weight: "5g" },
              imageUrl: "https://picsum.photos/seed/zenithbuds/600/600"
            }
          ]
        }
      ]
    }
  ]
};

// Simplified Data Service - No AI, just Local Storage
const generateStoreData = async (): Promise<StoreData> => {
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

const saveStoreData = async (data: StoreData): Promise<void> => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
};

const resetStoreData = async (): Promise<StoreData> => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
};

export { generateStoreData, saveStoreData, resetStoreData };