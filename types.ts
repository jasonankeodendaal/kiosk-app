

export interface DimensionSet {
  label?: string; // e.g. "Device", "Stand", "Box 1"
  width: string;
  height: string;
  depth: string;
  weight: string;
}

export interface Manual {
  id: string;
  title: string;
  images: string[]; // Converted pages
  pdfUrl?: string;  // Optional backing PDF
  thumbnailUrl?: string; // New field for cover image
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
  // New Multiple Manuals Support
  manuals?: Manual[];
  // Legacy support fields (will be migrated)
  manualUrl?: string; 
  manualImages?: string[]; 
  dateAdded?: string; // New: For aging logic
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

export interface TVModel {
  id: string;
  name: string; // e.g. "OLED 65-inch G3"
  imageUrl?: string; // Optional cover image for the model
  videoUrls: string[];
}

export interface TVBrand {
  id: string;
  name: string;
  logoUrl?: string;
  models: TVModel[];
  // Legacy support (to be migrated)
  videoUrls?: string[];
}

export interface TVConfig {
  brands: TVBrand[];
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
  thumbnailUrl?: string; // New Cover/Thumbnail Image
  pages: string[]; // Legacy support for image-based flipbooks
}

// New Interface for decoupled Pricelist Brands
export interface PricelistBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Pricelist {
  id: string;
  brandId: string;
  title: string;
  url: string; // PDF URL
  thumbnailUrl?: string; // New: Cover Image
  month: string;
  year: string;
}

export interface AdItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  dateAdded?: string; // New: For aging logic
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
  // New Enhanced Controls
  displayStyle?: 'contain' | 'cover';
  showInfoOverlay?: boolean;
  activeHoursStart?: string; // e.g. "08:00"
  activeHoursEnd?: string;   // e.g. "20:00"
  enableSleepMode?: boolean; // Turn screen black outside active hours
}

export interface KioskRegistry {
  id: string;
  name: string;
  deviceType?: 'kiosk' | 'mobile' | 'tv'; 
  status: 'online' | 'offline';
  last_seen: string;
  wifiStrength: number; 
  ipAddress: string;
  version: string;
  locationDescription?: string;
  assignedZone?: string;
  notes?: string;
  restartRequested?: boolean; 
}

export interface ArchiveData {
    brands: Brand[];
    products: { product: Product, originalBrand: string, originalCategory: string }[];
    catalogues: Catalogue[];
    deletedAt: Record<string, string>; 
}

export interface AboutConfig {
    title?: string;
    text?: string;
    audioUrl?: string;
}

export interface AppConfig {
    kioskIconUrl?: string;
    adminIconUrl?: string;
}

export interface AdminPermissions {
    inventory: boolean;
    marketing: boolean;
    tv: boolean;
    screensaver: boolean;
    fleet: boolean;
    history: boolean;
    settings: boolean;
    pricelists: boolean;
}

export interface AdminUser {
    id: string;
    name: string;
    pin: string;
    isSuperAdmin: boolean;
    permissions: AdminPermissions;
}

export interface StoreData {
  companyLogoUrl?: string; 
  hero: HeroConfig;
  catalogues?: Catalogue[]; 
  pricelists?: Pricelist[];
  pricelistBrands?: PricelistBrand[]; // New independent list
  brands: Brand[];
  tv?: TVConfig; // New TV Configuration
  ads?: AdConfig;
  screensaverSettings?: ScreensaverSettings; 
  fleet?: KioskRegistry[]; 
  archive?: ArchiveData; 
  about?: AboutConfig;
  admins: AdminUser[]; // New Admin Management
  appConfig?: AppConfig; // New App Icon Configuration
}

export interface FlatProduct extends Product {
  brandName: string;
  categoryName: string;
}