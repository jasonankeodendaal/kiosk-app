
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
}

const ANIMATIONS = [
  'animate-ken-burns',
  'animate-zoom-in-jump',
  'animate-pop-rotate',
  'animate-fade-drift',
  'animate-bounce-scale'
];

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, pamphlets = [], onWake }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Merge ALL content into a massive playlist
  const playlist = useMemo<PlaylistItem[]>(() => {
    const list: PlaylistItem[] = [];

    // 1. Add Screensaver Ads specifically
    ads.forEach((ad, i) => {
      list.push({
        id: `ad-${ad.id}-${i}`,
        type: ad.type,
        url: ad.url,
        title: "Sponsored",
        subtitle: ""
      });
    });

    // 2. Add All Product Content
    products.forEach((p, i) => {
        // A. Product Main Image
        if (p.imageUrl) {
            list.push({
                id: `prod-img-${p.id}`,
                type: 'image',
                url: p.imageUrl,
                title: p.brandName,
                subtitle: p.name
            });
        }
        
        // B. Product Gallery Images
        if (p.galleryUrls && p.galleryUrls.length > 0) {
            p.galleryUrls.forEach((gUrl, gIdx) => {
                list.push({
                    id: `prod-gal-${p.id}-${gIdx}`,
                    type: 'image',
                    url: gUrl,
                    title: p.brandName,
                    subtitle: `${p.name} - Gallery`
                });
            });
        }

        // C. Product Video if available
        if (p.videoUrl) {
            list.push({
                id: `prod-vid-${p.id}`,
                type: 'video',
                url: p.videoUrl,
                title: p.brandName,
                subtitle: `${p.name} - Official Video`
            });
        }
    });
    
    // 3. Add Pamphlet Pages (Catalogues)
    pamphlets.forEach((pamphlet) => {
       if (pamphlet.pages && pamphlet.pages.length > 0) {
          pamphlet.pages.forEach((pageUrl, pIdx) => {
             list.push({
                id: `pamphlet-${pamphlet.id}-${pIdx}`,
                type: 'image',
                url: pageUrl,
                title: "Showcase Pamphlet",
                subtitle: pamphlet.title
             });
          });
       }
    });

    // Shuffle slightly to ensure variety
    return list.sort(() => Math.random() - 0.5); 
  }, [products, ads, pamphlets]);

  const handleNext = () => {
     setCurrentIndex((prev) => (prev + 1) % playlist.length);
     // Pick a random animation for the next slide (only affects images)
     const nextAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
     setCurrentAnimation(nextAnim);
  };

  useEffect(() => {
    if (playlist.length === 0) return;
    
    const currentItem = playlist[currentIndex];
    let timer: number;

    if (currentItem.type === 'image') {
        // Image: Fixed Duration (e.g., 6 seconds)
        timer = window.setTimeout(handleNext, 6000);
    } else {
        // Video: handled primarily by onEnded event on the <video> tag.
        // However, we add a fallback safety timeout (e.g. 180s) in case video hangs or is infinite loop, 
        // to ensure screensaver doesn't get stuck forever on one broken video.
        timer = window.setTimeout(handleNext, 180000); // 3 minutes max safety
    }

    return () => clearTimeout(timer);
  }, [currentIndex, playlist]);

  if (playlist.length === 0) return null;

  const item = playlist[currentIndex];

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-black cursor-pointer overflow-hidden"
    >
      <div key={item.id} className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
         {item.type === 'video' ? (
             <video 
               ref={videoRef}
               src={item.url} 
               autoPlay 
               muted 
               playsInline
               className="w-full h-full object-contain"
               onEnded={handleNext}
               onError={(e) => { console.warn("Video Error, skipping", e); handleNext(); }} 
             />
         ) : (
             <img 
               src={item.url} 
               alt="Screensaver" 
               className={`w-full h-full object-contain origin-center ${currentAnimation}`}
               onError={(e) => { console.warn("Image Error, skipping", e); handleNext(); }}
             />
         )}

         {/* Overlay Text */}
         <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-80 text-shadow-lg animate-fade-in pointer-events-none z-10">
            {item.title && (
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl text-right">
                    {item.title}
                </h1>
            )}
            {item.subtitle && (
                <h2 className="text-2xl md:text-4xl font-bold text-yellow-400 drop-shadow-md text-right">
                    {item.subtitle}
                </h2>
            )}
         </div>
         
         {/* Call to Action */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-overlay z-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-lg shadow-2xl animate-pulse-slow">
               Touch to Start
            </div>
         </div>
      </div>
      
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1.0) translate(0,0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scale(1.05) translate(-1%, -1%); opacity: 1; }
        }

        @keyframes zoomInJump {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes popRotate {
          0% { transform: scale(0.8) rotate(-2deg); opacity: 0; }
          50% { transform: scale(1.02) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes fadeDrift {
          0% { transform: translateX(2%) scale(1.0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(-2%) scale(1.0); opacity: 1; }
        }

        @keyframes bounceScale {
            0% { transform: scale(0.95); opacity: 0; }
            40% { transform: scale(1.02); opacity: 1; }
            60% { transform: scale(0.98); }
            80% { transform: scale(1.01); }
            100% { transform: scale(1); }
        }
        
        @keyframes pulseSlow {
           0%, 100% { transform: scale(1); opacity: 0.8; }
           50% { transform: scale(1.1); opacity: 1; }
        }

        .animate-ken-burns { animation: kenBurns 6s ease-out forwards; }
        .animate-zoom-in-jump { animation: zoomInJump 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-pop-rotate { animation: popRotate 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .animate-fade-drift { animation: fadeDrift 6s linear forwards; }
        .animate-bounce-scale { animation: bounceScale 2s ease-out forwards; }
        
        .animate-pulse-slow { animation: pulseSlow 3s infinite; }
        
        .text-shadow-lg { text-shadow: 2px 2px 10px rgba(0,0,0,0.8); }
      `}</style>
    </div>
  );
};

export default Screensaver;
