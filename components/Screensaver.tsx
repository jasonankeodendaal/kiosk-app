

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number | null>(null);

  // Default settings fallback
  const config = settings || {
      idleTimeout: 60,
      imageDuration: 8,
      muteVideos: false,
      showProductImages: true,
      showProductVideos: true,
      showPamphlets: true,
      showCustomAds: true
  };

  // 1. Build Playlist (Memoized to prevent shuffling on every render)
  const playlist = useMemo<PlaylistItem[]>(() => {
    const list: PlaylistItem[] = [];

    // Custom Ads
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

    // Pamphlet Covers
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

    // Products
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
    
    // Shuffle
    return list.sort(() => Math.random() - 0.5); 
  }, [products, ads, pamphlets, config]);

  // 2. Navigation Logic
  const handleNext = () => {
     if (timeoutRef.current) clearTimeout(timeoutRef.current);
     setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const currentItem = playlist[currentIndex];

  // 3. Playback Logic (The Engine)
  useEffect(() => {
    if (!currentItem) return;

    // Clear previous timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (currentItem.type === 'image') {
        // --- IMAGE LOGIC ---
        // Display for Configured Duration
        timeoutRef.current = window.setTimeout(() => {
            handleNext();
        }, config.imageDuration * 1000);
    } else {
        // --- VIDEO LOGIC ---
        // Video handling is primarily done via the <video onEnded> event in the JSX.
        // However, we set a "Safety Timeout" of 2 minutes in case video stalls or loops incorrectly.
        timeoutRef.current = window.setTimeout(() => {
            handleNext();
        }, 120000); 

        // Force play if needed (React sometimes needs a nudge)
        if (videoRef.current) {
            videoRef.current.load();
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay prevented:", error);
                    // If autoplay fails (browser policy), skip immediately to avoid black screen
                    handleNext();
                });
            }
        }
    }

    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, currentItem, config.imageDuration]);

  if (playlist.length === 0) return (
      <div onClick={onWake} className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer">
          <div className="text-white opacity-50 text-sm font-mono">No Screensaver Content Available</div>
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
      {/* Background is PURE BLACK. Content uses object-contain to 'Shrink to Fit' without cropping */}
      
      <div key={currentItem.id} className="w-full h-full relative animate-fade-in flex items-center justify-center">
         
         {currentItem.type === 'video' ? (
             <video 
               ref={videoRef}
               src={currentItem.url} 
               className="w-full h-full object-contain" 
               muted={config.muteVideos} 
               playsInline
               onEnded={handleNext} // The main trigger for next slide
               onError={(e) => { 
                   console.warn("Video Error, skipping:", currentItem.url); 
                   handleNext(); 
               }} 
             />
         ) : (
             <img 
               src={currentItem.url} 
               alt="Screensaver" 
               className="w-full h-full object-contain" 
               onError={() => handleNext()}
             />
         )}

         {/* Overlay Text */}
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
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Screensaver;