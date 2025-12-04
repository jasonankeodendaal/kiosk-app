
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FlatProduct, AdItem } from '../types';

interface ScreensaverProps {
  products: FlatProduct[];
  ads: AdItem[];
  onWake: () => void;
}

const ANIMATIONS = [
  'animate-ken-burns',
  'animate-zoom-in-jump',
  'animate-pop-rotate',
  'animate-fade-drift',
  'animate-bounce-scale'
];

const Screensaver: React.FC<ScreensaverProps> = ({ products, ads, onWake }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(ANIMATIONS[0]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Merge products and ads into a single playlist
  const playlist = useMemo(() => {
    const mixed: any[] = [];
    const adPool = [...ads];
    
    // Create a rich playlist: Products + Ads mixed
    products.forEach((p, i) => {
        mixed.push({ type: 'product', data: p });
        // Inject an ad every few items
        if ((i + 1) % 3 === 0 && adPool.length > 0) {
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

  const currentItem = playlist[currentIndex];
  const isVideo = currentItem?.type === 'ad' && currentItem?.data?.type === 'video';

  // Rotation Logic
  useEffect(() => {
    if (playlist.length === 0) return;

    let timeout: NodeJS.Timeout;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
        const nextAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
        setCurrentAnimation(nextAnim);
    };

    if (isVideo) {
        // If it's a video, the onEnded event on the <video> tag handles the transition
        // But we set a failsafe timeout in case video stalls
        timeout = setTimeout(nextSlide, 30000); // 30s max for video failsafe
    } else {
        // Standard image duration
        timeout = setTimeout(nextSlide, 6000); // 6 seconds per slide
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, playlist.length, isVideo]);

  // Movement Detection to Wake
  useEffect(() => {
    const handleActivity = () => onWake();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('keydown', handleActivity);
    };
  }, [onWake]);

  if (playlist.length === 0) return null;

  const content = currentItem.data;
  const isAd = currentItem.type === 'ad';

  const handleVideoEnded = () => {
      // Move to next immediately when video ends
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black cursor-none overflow-hidden">
      <div key={currentIndex} className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
         
         {isAd && content.type === 'video' ? (
             <video 
               ref={videoRef}
               src={content.url} 
               autoPlay 
               muted 
               onEnded={handleVideoEnded}
               className="w-full h-full object-contain"
             />
         ) : (
             <img 
               src={isAd ? content.url : content.imageUrl} 
               alt="Screensaver" 
               className={`w-full h-full object-contain origin-center ${currentAnimation}`}
             />
         )}

         {/* Info Text (Only for Products) */}
         {!isAd && (
             <div className="absolute bottom-10 left-10 flex flex-col items-start opacity-90 text-shadow-lg animate-fade-in max-w-[80%]">
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-2">
                    {content.brandName}
                </h1>
                <h2 className="text-xl md:text-3xl font-bold text-yellow-400 drop-shadow-md">
                    {content.name}
                </h2>
                <div className="h-1 w-24 bg-blue-500 mt-4"></div>
             </div>
         )}
      </div>

      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1.0) translate(0,0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scale(1.1) translate(-2%, -2%); opacity: 1; }
        }
        @keyframes zoomInJump {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes popRotate {
          0% { transform: scale(0.8) rotate(-2deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeDrift {
          0% { transform: translateX(2%) scale(1.0); opacity: 0; }
          100% { transform: translateX(-2%) scale(1.0); opacity: 1; }
        }
        @keyframes bounceScale {
            0% { transform: scale(0.95); opacity: 0; }
            50% { transform: scale(1.02); opacity: 1; }
            100% { transform: scale(1); }
        }
        .animate-ken-burns { animation: kenBurns 7s ease-out forwards; }
        .animate-zoom-in-jump { animation: zoomInJump 6s ease-out forwards; }
        .animate-pop-rotate { animation: popRotate 6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .animate-fade-drift { animation: fadeDrift 7s linear forwards; }
        .animate-bounce-scale { animation: bounceScale 7s ease-out forwards; }
        .text-shadow-lg { text-shadow: 2px 2px 10px rgba(0,0,0,0.8); }
      `}</style>
    </div>
  );
};

export default Screensaver;
