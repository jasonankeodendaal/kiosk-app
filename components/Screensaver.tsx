
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FlatProduct, AdItem, Catalogue } from '../types';

interface ScreensaverProps {
  products: FlatProduct[];
  ads: AdItem[];
  pamphlets?: Catalogue[];
  onWake: () => void;
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

const ANIMATIONS = [
  'animate-fade-in-slow', 
];

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, pamphlets = [], onWake }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Default to a simpler fade to prevent layout shifting/flashing during transitions
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Merge ALL content into a massive playlist with weighting for Ads/Pamphlets
  const playlist = useMemo<PlaylistItem[]>(() => {
    const finalList: PlaylistItem[] = [];
    const promoItems: PlaylistItem[] = [];
    const productItems: PlaylistItem[] = [];

    // 1. Prepare Screensaver Ads (Promotional)
    ads.forEach((ad, i) => {
      promoItems.push({
        id: `ad-${ad.id}-${i}`,
        type: ad.type,
        url: ad.url,
        title: "Sponsored",
        subtitle: ""
      });
    });

    // 2. Prepare Pamphlet Pages (Promotional)
    pamphlets.forEach((pamphlet) => {
       if (pamphlet.pages && pamphlet.pages.length > 0) {
          // Add first page (cover) of the pamphlet
          promoItems.push({
            id: `pamphlet-${pamphlet.id}-cover`,
            type: 'image',
            url: pamphlet.pages[0],
            title: pamphlet.title,
            subtitle: "Showcase Catalogue",
            startDate: pamphlet.startDate,
            endDate: pamphlet.endDate
         });
       }
    });

    // 3. Prepare Product Content (Standard)
    products.forEach((p) => {
        if (p.imageUrl) {
            productItems.push({
                id: `prod-img-${p.id}`,
                type: 'image',
                url: p.imageUrl,
                title: p.brandName,
                subtitle: p.name
            });
        }
        if (p.videoUrl) {
            productItems.push({
                id: `prod-vid-${p.id}`,
                type: 'video',
                url: p.videoUrl,
                title: p.brandName,
                subtitle: `${p.name} - Official Video`
            });
        }
    });
    
    // 4. Assemble Weighted List
    finalList.push(...productItems);

    // Add Promotional items (Weight: 3x)
    const PROMO_WEIGHT = 3; 
    for (let i = 0; i < PROMO_WEIGHT; i++) {
        const weightedPromos = promoItems.map(item => ({
            ...item,
            id: `${item.id}-w${i}` 
        }));
        finalList.push(...weightedPromos);
    }

    // 5. Shuffle
    return finalList.sort(() => Math.random() - 0.5); 
  }, [products, ads, pamphlets]);

  const handleNext = () => {
     setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const item = playlist[currentIndex];

  useEffect(() => {
    if (!item) return;

    let timer: number;

    // Strict Logic Separation
    if (item.type === 'image') {
        // Display images for 10 seconds fixed
        timer = window.setTimeout(handleNext, 10000);
    } 
    // If VIDEO: We do NOTHING here. We rely strictly on the <video onEnded={handleNext}> event.
    
    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [item]); // Only re-run when the specific item changes

  if (playlist.length === 0) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-black cursor-pointer overflow-hidden flex items-center justify-center"
    >
      {/* Background container is pure black to support shrink-to-fit */}
      <div key={item.id} className="w-full h-full flex items-center justify-center bg-black animate-fade-in-slow">
         
         {item.type === 'video' ? (
             <video 
               key={item.url} // Force remount on URL change
               ref={videoRef}
               src={item.url} 
               autoPlay 
               playsInline
               // Removed 'muted' to allow sound if desired, add 'muted' back if autoplay policies block it
               className="max-w-full max-h-full w-full h-full object-contain"
               onEnded={handleNext}
               onError={(e) => { 
                   console.warn("Video Error, skipping:", item.url); 
                   handleNext(); 
               }} 
             />
         ) : (
             <img 
               key={item.id}
               src={item.url} 
               alt="Screensaver" 
               className="max-w-full max-h-full w-full h-full object-contain"
               onError={(e) => { 
                   console.warn("Image Error, skipping:", item.url); 
                   handleNext(); 
               }}
             />
         )}

         {/* Overlay Text */}
         <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-90 text-shadow-lg pointer-events-none z-10">
            {item.title && (
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl text-right">
                    {item.title}
                </h1>
            )}
            {item.subtitle && (
                <h2 className="text-2xl md:text-4xl font-bold text-yellow-400 drop-shadow-md text-right mb-2">
                    {item.subtitle}
                </h2>
            )}
            {(item.startDate || item.endDate) && (
                <p className="text-xl md:text-2xl text-slate-300 font-medium drop-shadow-md text-right bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
                    {item.startDate && `From: ${formatDate(item.startDate)}`}
                    {item.startDate && item.endDate && ` • `}
                    {item.endDate && `To: ${formatDate(item.endDate)}`}
                </p>
            )}
         </div>
      </div>
      
      <style>{`
        @keyframes fadeInSlow {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-slow { animation: fadeInSlow 1s ease-out forwards; } 
        .text-shadow-lg { text-shadow: 2px 2px 15px rgba(0,0,0,0.9); }
      `}</style>
    </div>
  );
};

export default Screensaver;
