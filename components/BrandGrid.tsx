
import React, { useEffect, useState } from 'react';
import { Brand, Catalogue, HeroConfig, AdConfig, AdItem } from '../types'; 
import { Download, Globe, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BrandGridProps {
  brands: Brand[];
  heroConfig?: HeroConfig;
  globalCatalog?: Catalogue; 
  storeCatalogs?: Catalogue[]; // Not used here anymore but kept for type compatibility if passed
  ads?: AdConfig;
  onSelectBrand: (brand: Brand) => void;
  onViewGlobalCatalog: (pages: string[]) => void; 
  onExport: () => void; 
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
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === index ? 'bg-white' : 'bg-white/50'}`}></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BrandGrid: React.FC<BrandGridProps> = ({ brands, heroConfig, ads, onSelectBrand, onViewGlobalCatalog }) => {
  
  // Filter for valid Pamphlet (Start/End Date)
  const activePamphlet = React.useMemo(() => {
     if (!heroConfig?.pamphlet) return null;
     const now = new Date();
     if (heroConfig.pamphlet.startDate && new Date(heroConfig.pamphlet.startDate) > now) return null;
     if (heroConfig.pamphlet.endDate && new Date(heroConfig.pamphlet.endDate) < now) return null;
     return heroConfig.pamphlet;
  }, [heroConfig?.pamphlet]);

  const handleDownloadPdf = async (pages: string[], title: string) => {
      try {
          const doc = new jsPDF();
          for (let i = 0; i < pages.length; i++) {
              if (i > 0) doc.addPage();
              const imgData = pages[i];
              const img = new Image();
              img.src = imgData;
              await new Promise((resolve) => { img.onload = resolve; });
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              const widthRatio = pageWidth / img.width;
              const heightRatio = pageHeight / img.height;
              const ratio = Math.min(widthRatio, heightRatio);
              const w = img.width * ratio;
              const h = img.height * ratio;
              const x = (pageWidth - w) / 2;
              const y = (pageHeight - h) / 2;
              doc.addImage(imgData, 'JPEG', x, y, w, h);
          }
          doc.save(`${title}.pdf`);
      } catch (e) {
          console.error("PDF Gen Error", e);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fade-in">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white shrink-0 relative overflow-hidden min-h-[40vh] md:min-h-[50vh] flex flex-col justify-end p-4 md:p-8">
        
        {/* Dynamic Background */}
        {heroConfig?.backgroundImageUrl && (
            <div className="absolute inset-0 z-0">
                <img src={heroConfig.backgroundImageUrl} alt="" className="w-full h-full object-cover opacity-60 blur-[2px] scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"></div>
            </div>
        )}

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 pt-6 w-full max-w-7xl mx-auto h-full">
          {/* Left: Text Content */}
          <div className="w-full md:max-w-[60%] lg:max-w-[50%] mb-4 md:mb-0">
            {heroConfig?.logoUrl ? (
                <img src={heroConfig.logoUrl} alt="Brand Logo" className="h-10 md:h-16 w-auto object-contain mb-4 drop-shadow-md" />
            ) : (
                <span className="bg-yellow-400 text-slate-900 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider mb-4 inline-block">Welcome</span>
            )}
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 text-white leading-tight">
               {heroConfig?.title || "Our Partners"}
            </h1>
            <p className="text-slate-300 text-sm md:text-xl font-light mb-6 line-clamp-3">
               {heroConfig?.subtitle || "Select a brand to explore."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
                {activePamphlet && activePamphlet.pages.length > 0 && (
                     <button 
                        onClick={() => onViewGlobalCatalog(activePamphlet.pages)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 animate-pulse-slow ring-4 ring-blue-600/20"
                    >
                        <Eye size={18} /> View Pamphlet
                    </button>
                )}
                 {heroConfig?.websiteUrl && (
                     <a 
                        href={heroConfig.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                    >
                        <Globe size={18} /> Website
                    </a>
                )}
            </div>
          </div>

          {/* Right: Floating Pamphlet (If active) - Now properly responsive */}
          {activePamphlet && activePamphlet.pages[0] && (
             <div className="relative md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2 w-48 md:w-[25%] lg:w-[20%] aspect-[3/4] z-20 group perspective-1000 hidden md:block">
                <div 
                   onClick={() => onViewGlobalCatalog(activePamphlet.pages)}
                   className="w-full h-full relative cursor-pointer transform transition-transform duration-500 group-hover:rotate-y-12 group-hover:scale-105 preserve-3d"
                >
                    <img 
                       src={activePamphlet.pages[0]} 
                       alt="Pamphlet Cover" 
                       className="w-full h-full object-cover rounded-lg shadow-2xl border-2 border-white/20" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent rounded-lg pointer-events-none"></div>
                    
                    {/* Floating Badge */}
                    <div className="absolute -top-4 -right-4 bg-red-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center shadow-lg animate-bounce">
                        <span className="text-[9px] md:text-[10px] font-black uppercase">New</span>
                        <span className="text-[7px] md:text-[8px] font-bold">Deal</span>
                    </div>

                    {/* Hover Action */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                        Tap to Read
                    </div>

                    <button 
                       onClick={(e) => { e.stopPropagation(); handleDownloadPdf(activePamphlet.pages, activePamphlet.title); }}
                       className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                       title="Download PDF"
                    >
                        <Download size={14} />
                    </button>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (Brands + Bottom Ads) */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
            
            {/* Brands Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 w-full">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => onSelectBrand(brand)}
                  className="group aspect-square bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 flex flex-col items-center justify-center p-3 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-100 group-hover:opacity-0 transition-opacity"></div>
                  {brand.logoUrl ? (
                    <img 
                      src={brand.logoUrl} 
                      alt={brand.name} 
                      className="w-[80%] h-[80%] object-contain filter grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-500 relative z-10"
                    />
                  ) : (
                    <span className="text-4xl font-black text-slate-200 group-hover:text-blue-500 transition-colors relative z-10">{brand.name[0]}</span>
                  )}
                  <div className="absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Open
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Ads - Stack on mobile, grid on desktop */}
            {ads && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto w-full">
                    <AdUnit items={ads.homeBottomLeft} className="aspect-[3/1] md:aspect-[2/1] w-full" />
                    <AdUnit items={ads.homeBottomRight} className="aspect-[3/1] md:aspect-[2/1] w-full" />
                </div>
            )}
        </div>

        {/* Right Column (Side Ad) - Hidden on mobile */}
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
