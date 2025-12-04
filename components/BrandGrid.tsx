
import React, { useEffect, useState } from 'react';
import { Brand, Catalogue, HeroConfig, AdConfig, AdItem } from '../types'; // Import Catalogue
import { Download, BookOpen, Globe, ChevronRight } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface BrandGridProps {
  brands: Brand[];
  heroConfig?: HeroConfig;
  globalCatalog?: Catalogue; // Changed from 'catalog' to 'globalCatalog' with new type
  ads?: AdConfig;
  onSelectBrand: (brand: Brand) => void;
  onViewGlobalCatalog: (pages: string[]) => void; // New prop for global catalog view
  onExport: () => void; 
}

const AdUnit = ({ items, className }: { items?: AdItem[], className?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!items || items.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000); // 6 Seconds Rotation
        return () => clearInterval(interval);
    }, [items]);

    if (!items || items.length === 0) return (
       // Empty placeholder that maintains layout for the "red box" requirement, but transparent if empty in production
       <div className={`relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 ${className}`}></div>
    );
    
    // Ensure index is valid
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

            {/* Dots for carousel */}
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

// CatalogStrip now receives a single Catalog
const CatalogStrip = ({ pages, onView }: { pages?: string[], onView: () => void }) => {
  if (!pages || pages.length === 0) return null;
  
  // Use horizontal scroll with snap for touch-friendly "swipe" gestures
  return (
    <div className="w-full bg-slate-100 border-b border-slate-200 relative h-36 flex items-center group touch-pan-x">
       <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none"></div>
       <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none"></div>
       
       <div className="flex gap-4 px-6 overflow-x-auto w-full h-full items-center no-scrollbar snap-x snap-mandatory py-4">
          <div className="shrink-0 snap-center flex flex-col justify-center items-start pr-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Catalog</span>
              <div className="flex items-center gap-1 text-slate-900 font-bold text-xs uppercase whitespace-nowrap">
                 <BookOpen size={14} className="text-blue-600" />
                 Preview
              </div>
          </div>

          {pages.map((page, idx) => (
             <button 
                key={idx} 
                onClick={onView} 
                className="h-28 aspect-[2/3] bg-white shadow-sm hover:shadow-md rounded-lg border border-slate-200 shrink-0 transition-transform transform active:scale-95 overflow-hidden relative snap-center"
             >
                <img src={page} className="w-full h-full object-cover" alt={`Page ${idx + 1}`} />
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] font-bold px-1 rounded backdrop-blur-sm">
                    {idx + 1}
                </div>
             </button>
          ))}
          
          <button 
            onClick={onView}
            className="h-28 aspect-[2/3] bg-white rounded-lg border-2 border-dashed border-slate-300 shrink-0 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors gap-2 snap-center group/btn"
          >
             <div className="w-8 h-8 rounded-full bg-slate-100 group-hover/btn:bg-white flex items-center justify-center shadow-sm transition-colors">
                <ChevronRight size={16} />
             </div>
             <span className="text-[9px] font-bold uppercase tracking-widest">Open</span>
          </button>
       </div>
       
       <style>{`
         .no-scrollbar::-webkit-scrollbar {
           display: none;
         }
         .no-scrollbar {
           -ms-overflow-style: none;
           scrollbar-width: none;
         }
       `}</style>
    </div>
  )
}

const BrandGrid: React.FC<BrandGridProps> = ({ brands, heroConfig, globalCatalog, ads, onSelectBrand, onViewGlobalCatalog, onExport }) => {
  
  const handleDownloadPdf = async () => {
    if (globalCatalog?.pdfUrl) {
        // If an original PDF exists, download it
        const link = document.createElement('a');
        link.href = globalCatalog.pdfUrl;
        link.download = `${globalCatalog.title || 'store_catalog'}.pdf`; // Use catalog title if available
        link.click();
    } else if (globalCatalog?.pages && globalCatalog.pages.length > 0) {
        // If only images exist (Multi-Image Upload), generate a PDF using jsPDF
        try {
            const doc = new jsPDF();
            for (let i = 0; i < globalCatalog.pages.length; i++) {
                if (i > 0) doc.addPage();
                
                const imgData = globalCatalog.pages[i];
                // Get image dimensions to fit page
                const img = new Image();
                img.src = imgData;
                await new Promise((resolve) => { img.onload = resolve; });
                
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                // Calculate scale to fit
                const widthRatio = pageWidth / img.width;
                const heightRatio = pageHeight / img.height;
                const ratio = Math.min(widthRatio, heightRatio);
                
                const w = img.width * ratio;
                const h = img.height * ratio;
                
                // Keep default margin 0 to full bleed or centered
                // Center the image
                const x = (pageWidth - w) / 2;
                const y = (pageHeight - h) / 2;
                
                doc.addImage(imgData, 'JPEG', x, y, w, h);
            }
            doc.save(`${globalCatalog.title || 'store_catalog'}.pdf`); // Use catalog title
        } catch (e) {
            console.error("Failed to generate PDF", e);
            alert("Could not generate PDF from images.");
        }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fade-in">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white p-6 md:p-8 shrink-0 relative overflow-hidden min-h-[400px] flex flex-col justify-end">
        
        {/* Dynamic Background Image */}
        {heroConfig?.backgroundImageUrl && (
            <div className="absolute inset-0 z-0">
                <img src={heroConfig.backgroundImageUrl} alt="" className="w-full h-full object-cover opacity-50 blur-sm scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"></div>
            </div>
        )}

        {/* Abstract shapes (Fallback if no image or blended) */}
        {!heroConfig?.backgroundImageUrl && (
            <>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
            </>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 pt-6">
          <div className="w-full max-w-2xl">
            {heroConfig?.logoUrl ? (
                <img src={heroConfig.logoUrl} alt="Brand Logo" className="h-16 w-auto object-contain mb-6 drop-shadow-md" />
            ) : (
                <div className="flex items-center gap-2 mb-4">
                   <span className="bg-yellow-400 text-slate-900 text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">Showcase</span>
                </div>
            )}
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-white leading-tight">
               {heroConfig?.title || "Our Partners"}
            </h1>
            <p className="text-slate-300 text-xl font-light max-w-lg mb-8">
               {heroConfig?.subtitle || "Select a brand to explore."}
            </p>

            {/* Catalog Actions & Website Button */}
            <div className="flex flex-wrap items-center gap-4">
                {/* ALWAYS SHOW CATALOG BUTTON if pages exist */}
                {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
                    <button 
                        onClick={() => onViewGlobalCatalog(globalCatalog.pages)}
                        className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 animate-pulse-slow ring-4 ring-blue-600/20"
                    >
                        <BookOpen size={20} /> View Latest Catalog
                    </button>
                )}
                
                {/* Download PDF / View Website Buttons */}
                <div className="flex items-center gap-3">
                     {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
                         <button 
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm backdrop-blur-sm border border-white/20 transition-all"
                        >
                            <Download size={18} /> PDF
                        </button>
                     )}

                     {heroConfig?.websiteUrl && (
                         <a 
                            href={heroConfig.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white text-slate-900 px-6 py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                        >
                            <Globe size={18} /> Website
                        </a>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Teaser Strip (Swiper) */}
      {globalCatalog && globalCatalog.pages && globalCatalog.pages.length > 0 && (
          <CatalogStrip pages={globalCatalog.pages} onView={() => onViewGlobalCatalog(globalCatalog.pages)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-4 pt-6 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (Brands + Bottom Ads) */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full">
              {brands.map((brand, idx) => (
                <button
                  key={brand.id}
                  onClick={() => onSelectBrand(brand)}
                  className="group flex flex-col items-center justify-center transition-all duration-300 focus:outline-none"
                >
                  {/* Logo Area */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-110">
                    <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-full blur-xl transition-colors duration-300"></div>
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200 text-slate-400 group-hover:bg-slate-900 group-hover:text-yellow-400 flex items-center justify-center text-2xl font-black shadow-inner transition-colors duration-300">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Ads Area - Fixed to 2 columns on mobile to prevent stacking */}
            {ads && (
                <div className="grid grid-cols-2 gap-2 md:gap-4 mt-auto w-full">
                    {/* Render ads blocks even if empty to maintain layout if requested, though AdUnit handles content */}
                    <AdUnit items={ads.homeBottomLeft} className="aspect-[2/1] w-full min-h-[80px] md:min-h-[150px]" />
                    <AdUnit items={ads.homeBottomRight} className="aspect-[2/1] w-full min-h-[80px] md:min-h-[150px]" />
                </div>
            )}
        </div>

        {/* Right Column (Side Ad) - Only show if content exists or layout demands */}
        <div className="hidden lg:block w-72 shrink-0">
             {ads && (
                 <AdUnit items={ads.homeSideVertical} className="h-full w-full min-h-[400px]" />
             )}
        </div>
      </div>
    </div>
  );
};

export default BrandGrid;