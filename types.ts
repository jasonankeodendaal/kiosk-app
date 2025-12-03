
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

export interface Catalog {
  pdfUrl?: string; // The raw PDF data URL
  pages: string[]; // Array of images generated from the PDF
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

export interface StoreData {
  companyLogoUrl?: string; // Global app logo displayed on Home Page TopBar
  hero: HeroConfig;
  catalog?: Catalog;
  brands: Brand[];
  ads?: AdConfig;
}

// Helper type for flatten product list used in Screensaver
export interface FlatProduct extends Product {
  brandName: string;
  categoryName: string;
}
