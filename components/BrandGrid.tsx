
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Brand, Catalogue, HeroConfig, AdConfig, AdItem } from '../types';
import { BookOpen, Globe, ChevronRight, X, Grid } from 'lucide-react';

interface BrandGridProps {
  brands: Brand[];
  heroConfig?: HeroConfig;
  allCatalogs?: Catalogue[]; 
  ads?: AdConfig;
  onSelectBrand: (brand: Brand) => void;
  onViewGlobalCatalog: (catalogue: Catalogue) => void; 
  onExport: () => void; 
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

// Improved AdUnit with robust playback logic
const AdUnit = ({ items, className }: { items?: AdItem[], className?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timeoutRef = useRef<number | null>(null);

    // If items change, reset to 0
    useEffect(() => {
        setCurrentIndex(0);
    }, [items?.length]);

    const activeItem = items && items.length > 0 ? items[currentIndex % items.length] : null;

    useEffect(() => {
        if (!activeItem) return;
        if (items && items.length <= 1 && activeItem.type !== 'video') return; // Static image doesn't need rotation logic if alone

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (activeItem.type === 'image') {
            // Display Image for 6 seconds then switch
            timeoutRef.current = window.setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % items!.length);
            }, 6000);
        } else {
            // For Video, we rely on onEnded, but add a safety timeout
            // Try to play
            if(videoRef.current) {
                videoRef.current.play().catch(e => console.warn("Ad auto-play failed", e));
            }
            timeoutRef.current = window.setTimeout(() => {
                console.warn("Video timeout in AdUnit, forcing next.");
                setCurrentIndex(prev => (prev + 1) % items!.length);
            }, 180000); // 3 min max safety
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex, activeItem, items]);

    // Watchdog Timer for Video Freezing
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeItem?.type === 'video' && videoRef.current) {
                // If paused but not ended, and has source, force play
                if (videoRef.current.paused && !videoRef.current.ended && videoRef.current.readyState > 2) {
                    console.log("AdUnit Watchdog: Restarting frozen video...");
                    videoRef.current.play().catch(() => {});
                }
            }
        }, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [activeItem]);

    if (!items || items.length === 0) return (
       <div className={`relative overflow-hidden rounded-xl border border-slate-200/50 bg-slate-50/50 ${className}`}></div>
    );

    const handleVideoEnded = () => {
        if (items.length > 1) {
            setCurrentIndex(prev => (prev + 1) % items.length);
        } else if (videoRef.current) {
            // Explicitly handle single video loop
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(e => {});
        }
    };

    return (
        <div className={`relative overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white group ${className}`}>
            <div className="absolute top-2 right-2 z-10 bg-black/30 text-white px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">Ad</div>
            
            <div key={`${activeItem!.id}-${currentIndex}`} className="w-full h-full animate-fade-in bg-slate-50">
                {activeItem!.type === 'video' ? (
                    <video 
                        ref={videoRef}
                        src={activeItem!.url} 
                        muted 
                        playsInline
                        autoPlay
                        loop={items.length === 1} // Important for single video stability
                        className="w-full h-full object-cover"
                        onEnded={handleVideoEnded}
                    />
                ) : (
                    <img 
                        src={activeItem!.url} 
                        alt="Advertisement" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                )}
            </div>

            {items.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {items.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === (currentIndex % items.length) ? 'bg-white' : 'bg-white/50'}`}
                        ></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BrandGrid: React.FC<BrandGridProps> = ({ brands, heroConfig, allCatalogs, ads, onSelectBrand, onViewGlobalCatalog, onExport, screensaverEnabled, onToggleScreensaver }) => {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(11);
  
  // Dynamic Responsive Limit: Show 2 rows based on grid columns
  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
            // Mobile (4 cols): 2 rows = 8 slots -> 7 brands + view all
            setDisplayLimit(7);
        } else if (width < 768) {
            // Tablet SM (5 cols): 2 rows = 10 slots -> 9 brands + view all
            setDisplayLimit(9);
        } else {
            // Desktop (6 cols): 2 rows = 12 slots -> 11 brands + view all
            setDisplayLimit(11);
        }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const globalPamphlets = allCatalogs?.filter(c => !c.brandId) || [];
  const mainPamphlet = globalPamphlets[0]; 

  // Sort brands alphabetically
  const sortedBrands = useMemo(() => {
      return [...brands].sort((a, b) => a.name.localeCompare(b.name));
  }, [brands]);

  // Limit visible brands based on screen size
  const visibleBrands = sortedBrands.slice(0, displayLimit);
  const hasMoreBrands = sortedBrands.length > displayLimit;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fade-in pb-24">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white relative overflow-hidden shrink-0 min-h-[20vh] md:min-h-[40vh] flex flex-col">
        {heroConfig?.backgroundImageUrl ? (
            <div className="absolute inset-0 z-0">
                <img src={heroConfig.backgroundImageUrl} alt="" className="w-full h-full object-cover opacity-40 blur-sm scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/30"></div>
            </div>
        ) : (
             <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
        )}

        <div className="relative z-10 flex-1 flex flex-row items-center justify-center p-2 md:p-8 gap-2 md:gap-8 max-w-7xl mx-auto w-full">
            <div className="flex-1 flex flex-col justify-center text-left space-y-0.5 md:space-y-4 max-w-[55%] md:max-w-2xl shrink-0 h-full">
                {heroConfig?.logoUrl && (
                    <img src={heroConfig.logoUrl} alt="Logo" className="h-10 md:h-28 object-contain mb-1 md:mb-4 mr-auto drop-shadow-md" />
                )}
                <div>
                   <h1 className="text-lg md:text-5xl font-black tracking-tight leading-none md:leading-tight mb-0.5">
                      {heroConfig?.title || "Welcome"}
                   </h1>
                   <div className="h-0.5 w-6 md:w-20 bg-blue-500 rounded-full mr-auto mb-1 md:mb-2"></div>
                   <p className="text-[9px] md:text-lg text-slate-300 font-light leading-tight line-clamp-2 md:line-clamp-none">
                      {heroConfig?.subtitle || "Explore our premium collection."}
                   </p>
                </div>

                <div className="flex flex-wrap gap-1 md:gap-3 justify-start pt-1 md:pt-3">
                     {mainPamphlet && (
                        <button 
                            onClick={() => onViewGlobalCatalog(mainPamphlet)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-[8px] md:text-sm shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1 md:gap-2"
                        >
                            <BookOpen size={10} className="md:size-auto" /> 
                            <span className="hidden md:block">Open Main Catalogue</span>
                            <span className="md:hidden">View</span>
                        </button>
                     )}
                     {heroConfig?.websiteUrl && (
                         <a 
                            href={heroConfig.websiteUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white px-2 py-1 md:px-6 md:py-2.5 rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-[8px] md:text-sm border border-white/20 hover:-translate-y-0.5 transition-all flex items-center gap-1 md:gap-2"
                         >
                            <Globe size={10} className="md:size-auto" /> 
                            <span className="hidden md:block">Website</span>
                            <span className="md:hidden">Web</span>
                         </a>
                     )}
                </div>
            </div>

            {mainPamphlet && (
                <div className="perspective-1000 shrink-0 w-[40%] md:w-[280px] max-w-[140px] md:max-w-none flex items-center justify-center">
                    <div 
                        className="relative w-full aspect-[2/3] cursor-pointer animate-float"
                        onClick={() => onViewGlobalCatalog(mainPamphlet)}
                        role="button"
                    >
                        <div className="book-container absolute inset-0 bg-white rounded-r-sm md:rounded-r-lg shadow-2xl">
                             {mainPamphlet.thumbnailUrl || (mainPamphlet.pages && mainPamphlet.pages[0]) ? (
                                <img 
                                    src={mainPamphlet.thumbnailUrl || mainPamphlet.pages[0]} 
                                    className="w-full h-full object-cover rounded-r-sm md:rounded-r-lg book-cover border-l-2 md:border-l-4 border-slate-200"
                                    alt={`${mainPamphlet.title} Cover`}
                                />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold uppercase text-[10px]">No Cover</div>
                             )}
                             <div className="absolute top-0 bottom-0 left-0 w-0.5 md:w-1 bg-gradient-to-r from-slate-300 to-slate-100"></div>
                             <div className="absolute bottom-1 md:bottom-4 left-0 right-0 text-center bg-black/80 text-white py-0.5 md:py-1.5">
                                <span className="text-[6px] md:text-xs font-black uppercase tracking-widest block truncate px-1">{mainPamphlet.title}</span>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Pamphlet Strip - Fixed flex gap issues by using space-x-3 for margin injection */}
      {globalPamphlets.length > 0 && (
            <div className="bg-slate-100 border-b border-slate-200 p-2 md:p-4">
                 <div className="max-w-7xl mx-auto">
                     <div className="flex space-x-3 md:space-x-6 overflow-x-auto no-scrollbar items-start py-2">
                        {globalPamphlets.map((catalog, idx) => (
                             <button 
                                 key={catalog.id} 
                                 onClick={() => onViewGlobalCatalog(catalog)}
                                 className="flex flex-col items-center group w-24 md:w-32 shrink-0 text-left"
                             >
                                 <div className="w-full aspect-[2/3] rounded-md overflow-hidden border border-slate-300 shadow-md group-hover:scale-105 transition-transform bg-white relative">
                                    {catalog.thumbnailUrl || (catalog.pages && catalog.pages[0]) ? (
                                        <img src={catalog.thumbnailUrl || catalog.pages[0]} className="w-full h-full object-cover" alt={catalog.title} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-[8px] text-slate-400">No Cover</div>
                                    )}
                                 </div>
                                 <div className="mt-2 w-full">
                                     <h3 className="text-[9px] md:text-xs font-bold text-slate-800 leading-tight line-clamp-2 uppercase group-hover:text-blue-600 transition-colors">
                                         {catalog.title}
                                     </h3>
                                     {(catalog.startDate || catalog.endDate) && (
                                         <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                                             {formatDate(catalog.startDate)}
                                         </p>
                                     )}
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
            </div>
      )}

      {/* Featured Brands */}
      <div className="w-full bg-slate-50 py-4 text-center">
            <h2 className="text-lg md:text-3xl font-black text-slate-800 uppercase tracking-widest inline-block border-b-2 border-slate-200 px-6 pb-1">
                Featured Brands
            </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (Brands + Bottom Ads) */}
        <div className="flex-1 flex flex-col gap-8">
            
            {/* Grid - 4 Columns on Mobile (3 Brands + View All) -> Now showing 2 rows */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 gap-2 md:gap-8 w-full">
              {visibleBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => onSelectBrand(brand)}
                  className="group flex flex-col items-center justify-start gap-2 p-2 hover:bg-slate-100 rounded-xl transition-all duration-300"
                  title={brand.name} // Keeps hover tooltip for accessibility/desktop
                >
                  <div className="relative w-12 h-12 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.name} 
                        className="w-full h-full object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-200 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-xl font-black transition-colors duration-300">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Name STRICTLY removed per user request - Logo only */}
                </button>
              ))}

              {/* VIEW ALL BUTTON */}
              {hasMoreBrands && (
                <button
                  onClick={() => setShowAllBrands(true)}
                  className="group flex flex-col items-center justify-start gap-2 p-2 hover:bg-slate-100 rounded-xl transition-all duration-300"
                >
                   <div className="relative w-12 h-12 md:w-20 md:h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 rounded-full bg-slate-200 group-hover:bg-blue-600 text-slate-400 group-hover:text-white">
                       <Grid size={24} />
                   </div>
                   <span className="text-[8px] md:text-xs font-bold text-slate-500 group-hover:text-blue-900 uppercase tracking-wide text-center leading-tight">
                      View All
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Ads Area */}
            {ads && (
                <div className="grid grid-cols-2 gap-4 mt-auto w-full">
                    <AdUnit items={ads.homeBottomLeft} className="aspect-[2/1] w-full" />
                    <AdUnit items={ads.homeBottomRight} className="aspect-[2/1] w-full" />
                </div>
            )}
        </div>

        {/* Right Column (Side Ad) */}
        <div className="hidden lg:block w-72 shrink-0">
             {ads && (
                 <AdUnit items={ads.homeSideVertical} className="h-full w-full min-h-[500px]" />
             )}
        </div>
      </div>

      {/* ALL BRANDS MODAL - Removed Backdrop Blur */}
      {showAllBrands && (
        <div className="fixed inset-0 z-[60] bg-white/95 p-4 md:p-12 animate-fade-in flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                   <Grid className="text-blue-600" /> All Brands
                </h2>
                <button 
                  onClick={() => setShowAllBrands(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-3 rounded-full transition-colors"
                >
                   <X size={24} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4">
                 {sortedBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => {
                          setShowAllBrands(false);
                          onSelectBrand(brand);
                      }}
                      className="group flex flex-col items-center justify-center gap-2 transition-transform duration-300 hover:scale-110 p-4 rounded-xl hover:bg-white/50 border border-transparent hover:border-slate-200/50"
                      title={brand.name}
                    >
                      <div className="relative w-12 h-12 md:w-24 md:h-24 flex items-center justify-center">
                        {brand.logoUrl ? (
                          <img 
                            src={brand.logoUrl} 
                            alt={brand.name} 
                            className="w-full h-full object-contain transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-lg"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-200 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-xl font-black transition-colors duration-300">
                            {brand.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600 hidden">{brand.name}</span>
                    </button>
                  ))}
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BrandGrid;
