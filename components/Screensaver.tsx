import React, { useEffect, useState, useMemo } from 'react';
import { FlatProduct, AdItem } from '../types';

interface ScreensaverProps {
  products: FlatProduct[];
  ads: AdItem[];
  onWake: () => void;
}

const ANIMATIONS = [
  'animate-ken-burns',
  'animate-slow-zoom-out',
  'animate-pan-left',
  'animate-pan-right',
  'animate-pop-in'
];

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, onWake }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);

  // Merge products and ads into a single playlist
  const playlist = useMemo(() => {
    const mixed: any[] = [];
    const adPool = [...ads];
    
    // Create a rich playlist
    products.forEach((p, i) => {
        mixed.push({ type: 'product', data: p });
        // Inject an ad every 2 items for variety
        if ((i + 1) % 2 === 0 && adPool.length > 0) {
            const ad = adPool.shift(); // take one
            if(ad) {
                mixed.push({ type: 'ad', data: ad });
                adPool.push(ad); // put back at end for rotation
            }
        }
    });

    // If empty playlist but we have ads, just use ads
    if (mixed.length === 0 && ads.length > 0) {
        return ads.map(a => ({ type: 'ad', data: a }));
    }

    return mixed;
  }, [products, ads]);

  useEffect(() => {
    if (playlist.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
      // Pick a random animation for the next slide
      const nextAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
      setCurrentAnimation(nextAnim);
    }, 6000); // Fast, fun transitions every 6 seconds

    return () => clearInterval(interval);
  }, [playlist.length]);

  if (playlist.length === 0) return null;

  const currentItem = playlist[currentIndex];
  const isAd = currentItem.type === 'ad';
  const content = currentItem.data;

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-black cursor-pointer overflow-hidden"
    >
      <div key={currentIndex} className="absolute inset-0 w-full h-full">
         {/* Full Screen Background Layer */}
         {isAd && content.type === 'video' ? (
             <video 
               src={content.url} 
               autoPlay muted loop 
               className="w-full h-full object-cover"
             />
         ) : (
             <img 
               src={isAd ? content.url : content.imageUrl} 
               alt="Screensaver" 
               className={`w-full h-full object-cover ${currentAnimation}`}
             />
         )}

         {/* Optional Subtle Gradient for text readability if product, but mostly clear */}
         {!isAd && (
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12 pb-20">
                <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-lg transform translate-y-4 opacity-0 animate-slide-up">
                    {content.brandName}
                </h1>
                <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mt-2 transform translate-y-4 opacity-0 animate-slide-up-delay">
                    {content.name}
                </h2>
             </div>
         )}
         
         {/* Fun overlay elements */}
         <div className="absolute top-12 right-12 animate-pulse">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl">
               Touch to Explore
            </div>
         </div>
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes zoomOut {
          0% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes panLeft {
          0% { transform: scale(1.1) translate(0,0); }
          100% { transform: scale(1.1) translate(-2%, 0); }
        }
        @keyframes panRight {
          0% { transform: scale(1.1) translate(0,0); }
          100% { transform: scale(1.1) translate(2%, 0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          10% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .animate-ken-burns { animation: kenBurns 7s ease-out forwards; }
        .animate-slow-zoom-out { animation: zoomOut 7s ease-out forwards; }
        .animate-pan-left { animation: panLeft 7s linear forwards; }
        .animate-pan-right { animation: panRight 7s linear forwards; }
        .animate-pop-in { animation: popIn 6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        .animate-slide-up { animation: slideUp 0.8s ease-out forwards 0.3s; }
        .animate-slide-up-delay { animation: slideUp 0.8s ease-out forwards 0.5s; }
      `}</style>
    </div>
  );
};

export default Screensaver;