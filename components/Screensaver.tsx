import React, { useEffect, useState, useRef } from 'react';
import { FlatProduct, AdItem, Catalogue, ScreensaverSettings } from '../types';

interface ScreensaverProps {
  products: FlatProduct[];
  ads: AdItem[];
  pamphlets?: Catalogue[];
  onWake: () => void;
  settings?: ScreensaverSettings;
}

interface PlaylistItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
}

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, pamphlets = [], onWake, settings }) => {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Default config
  const config = settings || {
      idleTimeout: 60,
      imageDuration: 8,
      muteVideos: false,
      showProductImages: true,
      showProductVideos: true,
      showPamphlets: true,
      showCustomAds: true
  };

  // 1. Build & Shuffle Playlist (Once on Mount or when data drastically changes)
  useEffect(() => {
    const list: PlaylistItem[] = [];

    // Add Custom Ads
    if (config.showCustomAds) {
        ads.forEach((ad, i) => {
          list.push({
            id: `ad-${ad.id}-${i}`,
            type: ad.type,
            url: ad.url,
            title: "Sponsored",
            subtitle: ""
          });
        });
    }

    // Add Pamphlets
    if (config.showPamphlets) {
        pamphlets.forEach((pamphlet) => {
           if (pamphlet.pages && pamphlet.pages.length > 0) {
              list.push({
                id: `pamphlet-${pamphlet.id}`,
                type: 'image',
                url: pamphlet.pages[0],
                title: pamphlet.title,
                subtitle: "Showcase Catalogue",
                startDate: pamphlet.startDate,
                endDate: pamphlet.endDate
             });
           }
        });
    }

    // Add Products
    products.forEach((p) => {
        if (config.showProductImages && p.imageUrl) {
            list.push({
                id: `prod-img-${p.id}`,
                type: 'image',
                url: p.imageUrl,
                title: p.brandName,
                subtitle: p.name
            });
        }
        if (config.showProductVideos && p.videoUrl) {
            list.push({
                id: `prod-vid-${p.id}`,
                type: 'video',
                url: p.videoUrl,
                title: p.brandName,
                subtitle: `${p.name} - Official Video`
            });
        }
    });

    // Simple Shuffle
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }

    setPlaylist(list);
    setCurrentIndex(0); // Reset index on new playlist
  }, [products.length, ads.length, pamphlets.length, config.showProductImages, config.showProductVideos, config.showCustomAds, config.showPamphlets]);

  // Helper to move to next slide
  const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  // Safer error handling to prevent rapid race condition skipping
  const handleMediaError = () => {
      console.warn("Media failed to load:", currentItem?.url);
      // Delay skip to prevent CPU spinning/rapid flashing if everything fails
      timerRef.current = window.setTimeout(() => {
          nextSlide();
      }, 2000); 
  };

  // 2. Playback Logic
  const currentItem = playlist[currentIndex];

  useEffect(() => {
    if (!currentItem || playlist.length === 0) return;

    // Clean up previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentItem.type === 'image') {
        // IMAGE: Wait for configured duration then next
        // Default to 8000ms if config value is bad
        const duration = (config.imageDuration && config.imageDuration > 0) ? config.imageDuration * 1000 : 8000;
        
        timerRef.current = window.setTimeout(() => {
            nextSlide();
        }, duration);
    } else {
        // VIDEO:
        // Main logic is handled by onEnded event in JSX.
        // But we add a safety fallback (e.g. 3 mins) in case video stalls or loops.
        timerRef.current = window.setTimeout(() => {
            console.warn("Video timeout reached, skipping.");
            nextSlide();
        }, 180000); 
    }

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, currentItem, config.imageDuration, playlist.length]);

  // Initial buffer to prevent rapid mount/unmount cycle on empty list
  if (playlist.length === 0) return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer" onClick={onWake}>
          <div className="text-white opacity-30 text-xs font-mono">...</div>
      </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-black cursor-pointer flex items-center justify-center overflow-hidden"
    >
      {/* 
        Key changes for layout:
        - Fixed inset-0 to cover full screen.
        - bg-black for bars.
        - object-contain to 'Shrink to Fit' without cropping.
      */}
      
      <div key={currentItem.id} className="w-full h-full relative animate-fade-in flex items-center justify-center">
         
         {currentItem.type === 'video' ? (
             <video 
               src={currentItem.url} 
               className="w-full h-full object-contain" 
               // Settings
               muted={config.muteVideos} 
               autoPlay
               playsInline
               // Playback Control
               onEnded={nextSlide} 
               onError={handleMediaError} 
             />
         ) : (
             <img 
               src={currentItem.url} 
               alt="Screensaver" 
               className="w-full h-full object-contain" 
               onError={handleMediaError}
             />
         )}

         {/* Overlay Info */}
         <div className="absolute bottom-12 right-12 flex flex-col items-end max-w-[80%] pointer-events-none z-20">
            {currentItem.title && (
                <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-right mb-2 leading-none">
                    {currentItem.title}
                </h1>
            )}
            {currentItem.subtitle && (
                <h2 className="text-xl md:text-3xl font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-right bg-black/50 px-4 py-1 rounded">
                    {currentItem.subtitle}
                </h2>
            )}
            {(currentItem.startDate || currentItem.endDate) && (
                <p className="mt-4 text-lg md:text-xl text-slate-200 font-mono bg-blue-900/80 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 shadow-lg">
                    {currentItem.startDate && formatDate(currentItem.startDate)}
                    {currentItem.startDate && currentItem.endDate && ` - `}
                    {currentItem.endDate && formatDate(currentItem.endDate)}
                </p>
            )}
         </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 1.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Screensaver;