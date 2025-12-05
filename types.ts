

export interface DimensionSet {
  label?: string; // e.g. "Device", "Stand", "Box 1"
  width: string;
  height: string;
  depth: string;
  weight: string;
}

export interface ProductManual {
  id: string;
  title: string;
  images: string[]; // Converted JPG pages
}

export interface Product {
  id: string;
  sku?: string; 
  name: string;
  description: string;
  terms?: string; 
  specs: Record<string, string>;
  features: string[];
  boxContents?: string[]; 
  // Changed to Array for multiple dimension sets
  dimensions: DimensionSet[]; 
  imageUrl: string;
  galleryUrls?: string[]; 
  videoUrl?: string; // Legacy support
  videoUrls?: string[]; // Support for multiple videos
  
  // Legacy Manual Support (Deprecated but kept for migration)
  manualUrl?: string; 
  manualImages?: string[]; 
  
  // New Multi-Manual Support
  manuals?: ProductManual[];
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
  year?: number; // For Catalogues
  startDate?: string; // For Pamphlets
  endDate?: string;   // For Pamphlets (Auto-expiry)
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
  notes?: string;
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