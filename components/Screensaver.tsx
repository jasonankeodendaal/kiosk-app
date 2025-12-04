import React, { useEffect, useState, useMemo } from 'react';
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
    }, 5000); // 5 seconds per slide for energy

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
      <div key={currentIndex} className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
         {/* Full Screen Layer - Free View (No heavy overlay) */}
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
               className={`w-full h-full object-cover origin-center ${currentAnimation}`}
             />
         )}

         {/* Very subtle text at bottom, not obstructing view */}
         {!isAd && (
             <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-80 text-shadow-lg animate-fade-in">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                    {content.brandName}
                </h1>
                <h2 className="text-2xl font-bold text-yellow-400 drop-shadow-md">
                    {content.name}
                </h2>
             </div>
         )}
         
         {/* Floating Call to Action - Bouncing */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-lg shadow-2xl animate-pulse-slow opacity-0 animate-appear-delay">
               Touch to Start
            </div>
         </div>
      </div>

      <style>{`
        /* Ken Burns: Slow pan/zoom */
        @keyframes kenBurns {
          0% { transform: scale(1.1) translate(0,0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: scale(1.25) translate(-2%, -2%); opacity: 1; }
        }

        /* Zoom In Jump: Quick zoom in then settle */
        @keyframes zoomInJump {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Pop Rotate: Pop in with slight tilt */
        @keyframes popRotate {
          0% { transform: scale(0.8) rotate(-5deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        /* Fade Drift: Classic fade with lateral movement */
        @keyframes fadeDrift {
          0% { transform: translateX(5%) scale(1.1); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(-5%) scale(1.1); opacity: 1; }
        }

        /* Bounce Scale: Subtle bounce effect */
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
        
        @keyframes appearDelay {
            0% { opacity: 0; }
            80% { opacity: 0; }
            100% { opacity: 1; }
        }

        .animate-ken-burns { animation: kenBurns 6s ease-out forwards; }
        .animate-zoom-in-jump { animation: zoomInJump 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-pop-rotate { animation: popRotate 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
        .animate-fade-drift { animation: fadeDrift 6s linear forwards; }
        .animate-bounce-scale { animation: bounceScale 2s ease-out forwards; }
        
        .animate-pulse-slow { animation: pulseSlow 3s infinite; }
        .animate-appear-delay { animation: appearDelay 1s forwards; }
        
        .text-shadow-lg { text-shadow: 2px 2px 10px rgba(0,0,0,0.8); }
      `}</style>
    </div>
  );
};

export default Screensaver;