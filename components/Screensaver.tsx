import React, { useEffect, useState, useMemo } from 'react';
import { FlatProduct, AdItem } from '../types';

interface ScreensaverProps {
  products: FlatProduct[];
  ads: AdItem[];
  onWake: () => void;
}

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, onWake }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Merge products and ads into a single playlist
  const playlist = useMemo(() => {
    const mixed: any[] = [];
    const adPool = [...ads];
    
    products.forEach((p, i) => {
        mixed.push({ type: 'product', data: p });
        // Inject an ad every 3 products if available, or loop ads
        if ((i + 1) % 3 === 0 && adPool.length > 0) {
            const ad = adPool.shift(); // take one
            if(ad) {
                mixed.push({ type: 'ad', data: ad });
                adPool.push(ad); // put back at end for rotation
            }
        }
    });

    // If no products but ads exist (rare), just show ads
    if (mixed.length === 0 && ads.length > 0) {
        return ads.map(a => ({ type: 'ad', data: a }));
    }

    return mixed;
  }, [products, ads]);

  useEffect(() => {
    if (playlist.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, [playlist.length]);

  if (playlist.length === 0) return null;

  const currentItem = playlist[currentIndex];
  const isAd = currentItem.type === 'ad';
  const content = currentItem.data;

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-50 bg-black text-white cursor-pointer overflow-hidden animate-fade-in"
    >
      {/* Background with slight zoom effect */}
      <div className="absolute inset-0 opacity-40">
        {isAd && content.type === 'video' ? (
             <video 
               src={content.url} 
               autoPlay muted loop 
               className="w-full h-full object-cover blur-sm scale-105"
             />
        ) : (
             <img 
               src={isAd ? content.url : content.imageUrl} 
               alt="Background" 
               className="w-full h-full object-cover blur-sm scale-110 transition-transform duration-[8000ms] ease-linear transform hover:scale-125"
             />
        )}
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 text-center bg-gradient-to-t from-black/80 via-transparent to-black/40">
        
        {/* Content Container */}
        {isAd ? (
             <div className="w-full h-full flex items-center justify-center p-8">
                 {content.type === 'video' ? (
                     <video src={content.url} autoPlay muted loop className="max-h-full max-w-full rounded-2xl shadow-2xl" />
                 ) : (
                     <img src={content.url} alt="Ad" className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain" />
                 )}
             </div>
        ) : (
            <>
                <div className="mb-8 relative group">
                  <div className="absolute -inset-4 bg-yellow-400 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <img 
                    src={content.imageUrl} 
                    alt={content.name} 
                    className="w-96 h-96 object-contain relative z-10 drop-shadow-2xl rounded-xl bg-white/5 p-4"
                  />
                </div>

                <h2 className="text-xl tracking-widest text-yellow-400 uppercase font-bold mb-2">
                  {content.brandName}
                </h2>
                
                <h1 className="text-6xl font-extrabold mb-6 tracking-tight">
                  {content.name}
                </h1>
                
                <p className="text-2xl text-gray-300 max-w-3xl leading-relaxed line-clamp-2">
                  {content.description}
                </p>
            </>
        )}

        <div className="mt-12 flex items-center space-x-3 text-sm font-medium tracking-wide text-gray-400 absolute bottom-12">
          <span className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full"></span>
          <span>Touch screen to explore</span>
        </div>
      </div>

      {/* Progress Bar for slide timing */}
      <div key={currentIndex} className="absolute bottom-0 left-0 h-2 bg-yellow-400 w-full origin-left animate-progress"></div>
      
      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 8s linear;
        }
      `}</style>
    </div>
  );
};

export default Screensaver;