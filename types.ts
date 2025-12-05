

export interface Dimensions {
  label?: string; // e.g. "Main Unit", "Subwoofer"
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
  boxContents?: string[]; 
  dimensions: Dimensions[]; // Changed to Array for multiple units
  imageUrl: string;
  galleryUrls?: string[]; 
  videoUrl?: string; 
  manualUrl?: string; 
  manualImages?: string[]; 
}

export interface Category {
  id: string;
  name: string;
  icon: string; 
  products: Product[];
}

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  themeColor?: string; 
  categories: Category[];
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  backgroundImageUrl?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface Catalogue {
  id: string;
  brandId?: string; 
  title: string;
  type: 'catalogue' | 'pamphlet'; // Explicit type distinction
  year?: number; // Used for Brand Catalogues
  startDate?: string; // Used for Pamphlets
  endDate?: string;   // Used for Pamphlets
  pdfUrl?: string; 
  pages: string[]; 
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
  idleTimeout: number; 
  imageDuration: number; 
  muteVideos: boolean;
  showProductImages: boolean;
  showProductVideos: boolean;
  showPamphlets: boolean;
  showCustomAds: boolean;
}

export interface KioskRegistry {
  id: string;
  name: string;
  deviceType?: 'kiosk' | 'mobile'; 
  status: 'online' | 'offline';
  last_seen: string;
  wifiStrength: number; 
  ipAddress: string;
  version: string;
  locationDescription?: string;
  assignedZone?: string;
  notes?: string; // Added editable notes
  snapshotUrl?: string; 
  requestSnapshot?: boolean; 
  restartRequested?: boolean; 
}

export interface ArchiveData {
    brands: Brand[];
    products: { product: Product, originalBrand: string, originalCategory: string }[];
    catalogues: Catalogue[];
    deletedAt: Record<string, string>; 
}

export interface StoreData {
  companyLogoUrl?: string; 
  hero: HeroConfig;
  catalogues?: Catalogue[]; 
  brands: Brand[];
  ads?: AdConfig;
  screensaverSettings?: ScreensaverSettings; 
  fleet?: KioskRegistry[]; 
  archive?: ArchiveData; 
}

export interface FlatProduct extends Product {
  brandName: string;
  categoryName: string;
}