
import React, { useEffect, useState } from 'react';
import { Brand, Catalogue, HeroConfig, AdConfig, AdItem } from '../types';
import { BookOpen, Globe, ChevronRight, MonitorPlay, MonitorStop } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BrandGridProps {
  brands: Brand[];
  heroConfig?: HeroConfig;
  globalCatalog?: Catalogue; 
  ads?: AdConfig;
  onSelectBrand: (brand: Brand) => void;
  onViewGlobalCatalog: (pages: string[]) => void;
  onExport: () => void; 
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const AdUnit = ({ items, className }: { items?: AdItem[], className?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!items || items.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [items]);

    if (!items || items.length === 0) return (
       <div className={`relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 ${className}`}></div>
    );
    
    const index = currentIndex % items.length;
    const item = items[index];

    return (
        <div className={`relative overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white group ${className}`}>
            <div className="absolute top-2 right-2 z-10 bg-black/10 text-black/50 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest backdrop-blur-sm">Ad</div>
            
            <div key={item.id} className="w-full h-full animate-fade-in bg-slate-50">
                {item.type === 'video' ? (
                    <video src={item.url} autoPlay muted loop className="w-full h-full object-cover" />
                ) : (
                    <img src={item.url} alt="Advertisement" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
            </div>

            {items.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {items.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === index ? 'bg-white' : 'bg-white/50'}`}
                        ></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BrandGrid: React.FC<BrandGridProps> = ({ brands, heroConfig, globalCatalog, ads, onSelectBrand, onViewGlobalCatalog, onExport, screensaverEnabled, onToggleScreensaver }) => {
  
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fade-in">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white relative overflow-hidden shrink-0 min-h-[50vh] flex flex-col">
        
        {/* Dynamic Background Image */}
        {heroConfig?.backgroundImageUrl ? (
            <div className="absolute inset-0 z-0">
                <img src={heroConfig.backgroundImageUrl} alt="" className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/30"></div>
            </div>
        ) : (
             <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
        )}

        {/* Screensaver Toggle (Top Left) */}
        <div className="absolute top-4 left-4 z-50">
           <button 
             onClick={onToggleScreensaver}
             className={`flex items-center justify-center p-2 rounded-full border transition-all ${screensaverEnabled ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500 hover:text-white' : 'bg-white/10 text-slate-400 border-white/20 hover:bg-white/20 hover:text-white'}`}
             title={screensaverEnabled ? "Auto-Play On" : "Auto-Play Off"}
           >
              {screensaverEnabled ? <MonitorPlay size={20} /> : <MonitorStop size={20} />}
           </button>
        </div>

        {/* Hero Content Grid */}
        <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between p-6 md:p-12 gap-8 max-w-7xl mx-auto w-full">
            
            {/* Left: Text Content */}
            <div className="flex-1 text-center md:text-left space-y-6 max-w-2xl">
                {heroConfig?.logoUrl && (
                    <img src={heroConfig.logoUrl} alt="Logo" className="h-16 md:h-20 object-contain mb-4 mx-auto md:mx-0 drop-shadow-md" />
                )}
                
                <div>
                   <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-2">
                      {heroConfig?.title || "Welcome to Kiosk Pro"}
                   </h1>
                   <div className="h-1.5 w-24 bg-blue-500 rounded-full mx-auto md:mx-0 mb-4"></div>
                   <p className="text-xl text-slate-300 font-light leading-relaxed">
                      {heroConfig?.subtitle || "Explore our premium collection of brands and products."}
                   </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
                     {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
                        <button 
                            onClick={() => onViewGlobalCatalog(globalCatalog.pages)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                            <BookOpen size={20} /> Open Main Pamphlet
                        </button>
                     )}
                     {heroConfig?.websiteUrl && (
                         <a 
                            href={heroConfig.websiteUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20 hover:-translate-y-1 transition-all flex items-center gap-2"
                         >
                            <Globe size={20} /> Website
                         </a>
                     )}
                </div>
            </div>

            {/* Right: Floating 3D Pamphlet (Global Catalog) */}
            {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
                <div className="perspective-1000 hidden md:block">
                    <div 
                        className="relative w-[280px] aspect-[2/3] cursor-pointer animate-float"
                        onClick={() => onViewGlobalCatalog(globalCatalog.pages)}
                    >
                        {/* Book Body */}
                        <div className="book-container absolute inset-0 bg-white rounded-r-lg shadow-2xl">
                             <img 
                                src={globalCatalog.pages[0]} 
                                className="w-full h-full object-cover rounded-r-lg book-cover border-l-4 border-slate-200"
                                alt="Pamphlet Cover"
                             />
                             {/* Spine effect */}
                             <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-slate-300 to-slate-100"></div>
                             
                             {/* Label */}
                             <div className="absolute bottom-4 left-0 right-0 text-center bg-black/60 backdrop-blur-md text-white py-2">
                                <span className="text-xs font-black uppercase tracking-widest">Main Showcase</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Strip: Pamphlet Thumbnails */}
        {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
            <div className="relative z-20 bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
                 <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto no-scrollbar items-center py-2">
                     <span className="text-white/50 text-[10px] font-black uppercase tracking-widest rotate-180 py-2 vertical-rl hidden md:block">
                         Inside the Pamphlet
                     </span>
                     {globalCatalog.pages.slice(0, 6).map((page, idx) => (
                         <button 
                             key={idx} 
                             onClick={() => onViewGlobalCatalog(globalCatalog.pages)}
                             className="h-20 aspect-[2/3] rounded-md overflow-hidden border border-white/20 hover:border-blue-400 hover:scale-110 transition-all shadow-lg shrink-0"
                         >
                             <img src={page} className="w-full h-full object-cover" alt={`Page ${idx+1}`} />
                         </button>
                     ))}
                     <button 
                         onClick={() => onViewGlobalCatalog(globalCatalog.pages)}
                         className="h-20 aspect-[2/3] rounded-md border-2 border-dashed border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white transition-all shrink-0"
                     >
                         <ChevronRight size={20} />
                     </button>
                 </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (Brands + Bottom Ads) */}
        <div className="flex-1 flex flex-col gap-8">
            
            {/* Grid - Minimum 2 Columns on Mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 w-full">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => onSelectBrand(brand)}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-400 transition-all duration-300 p-4 flex flex-col items-center justify-center aspect-square overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 group-hover:from-blue-50 group-hover:to-white transition-colors duration-500"></div>
                  
                  {/* Logo Area */}
                  <div className="relative z-10 w-2/3 h-2/3 flex items-center justify-center mb-2">
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-2xl font-black transition-colors duration-300">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <span className="relative z-10 font-bold text-slate-500 group-hover:text-blue-900 text-xs uppercase tracking-wider transition-colors">
                      {brand.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Ads Area - Fixed to 2 columns on mobile */}
            {ads && (
                <div className="grid grid-cols-2 gap-4 mt-auto w-full">
                    <AdUnit items={ads.homeBottomLeft} className="aspect-[2/1] w-full" />
                    <AdUnit items={ads.homeBottomRight} className="aspect-[2/1] w-full" />
                </div>
            )}
        </div>

        {/* Right Column (Side Ad) - Hidden on Mobile */}
        <div className="hidden lg:block w-72 shrink-0">
             {ads && (
                 <AdUnit items={ads.homeSideVertical} className="h-full w-full min-h-[500px]" />
             )}
        </div>
      </div>
    </div>
  );
};

export default BrandGrid;
