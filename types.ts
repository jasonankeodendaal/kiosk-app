

export interface Dimensions {
  width: string;
  height: string;
  depth: string;
  weight: string;
}

export interface Product {
  id: string;
  sku?: string; // Stock Keeping Unit
  name: string;
  description: string;
  terms?: string; // Terms & Conditions text
  specs: Record<string, string>;
  features: string[];
  dimensions: Dimensions;
  imageUrl: string;
  galleryUrls?: string[]; // Additional images
  videoUrl?: string; // MP4/WAV URL
  manualUrl?: string; // PDF Data URL (Original)
  manualImages?: string[]; // Converted PDF pages as images for Flipbook
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Icon name for lucide-react
  products: Product[];
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  themeColor?: string; // Hex code override
  categories: Category[];
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

// New Catalogue interface for flexible catalog management
export interface Catalogue {
  id: string;
  brandId?: string; // Optional: Links to a specific brand. If not present, it's a global catalog.
  title: string;
  year?: number;
  month?: number; // 1-12 (e.g., 1 for January, 12 for December)
  startDate?: string; // ISO Date string (e.g., "2024-01-01")
  endDate?: string;   // ISO Date string (e.g., "2024-12-31")
  pdfUrl?: string; // The raw PDF data URL (if uploaded as PDF)
  pages: string[]; // Array of images generated from the PDF or uploaded directly
}

export interface AdItem {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface AdConfig {
  homeBottomLeft: AdItem[];
  homeBottomRight: AdItem[];
  homeSideVertical: AdItem[];
  screensaver: AdItem[];
}

export interface ScreensaverSettings {
  idleTimeout: number; // Seconds
  imageDuration: number; // Seconds
  muteVideos: boolean;
  showProductImages: boolean;
  showProductVideos: boolean;
  showPamphlets: boolean;
  showCustomAds: boolean;
}

export interface KioskRegistry {
  id: string;
  name: string;
  deviceType?: 'kiosk' | 'mobile'; // New Field
  status: 'online' | 'offline';
  last_seen: string;
  wifiStrength: number; // 0-100
  ipAddress: string;
  version: string;
  // Enhanced Fields
  locationDescription?: string;
  assignedZone?: string;
  notes?: string;
  snapshotUrl?: string; // Base64 or URL of latest camera snapshot
  requestSnapshot?: boolean; // Admin triggers this to true, Kiosk resets to false
  restartRequested?: boolean; // Admin triggers this to true, Kiosk reloads and resets to false
}

export interface StoreData {
  companyLogoUrl?: string; // Global app logo displayed on Home Page TopBar
  hero: HeroConfig;
  catalogues?: Catalogue[]; // Changed from singular `catalog` to an array of `catalogues`
  brands: Brand[];
  ads?: AdConfig;
  screensaverSettings?: ScreensaverSettings; // New configuration object
  fleet?: KioskRegistry[]; // Persisted fleet data
}

// Helper type for flatten product list used in Screensaver
export interface FlatProduct extends Product {
  brandName: string;
  categoryName: string;
}