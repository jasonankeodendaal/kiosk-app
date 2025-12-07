import React, { useEffect, useState, useRef } from 'react';
import { FlatProduct, AdItem, Catalogue, ScreensaverSettings } from '../types';
import { Moon } from 'lucide-react';

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
  const [isSleepMode, setIsSleepMode] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Default config
  const config: ScreensaverSettings = {
      idleTimeout: 60,
      imageDuration: 8,
      muteVideos: false,
      showProductImages: true,
      showProductVideos: true,
      showPamphlets: true,
      showCustomAds: true,
      displayStyle: 'contain',
      showInfoOverlay: true,
      enableSleepMode: false,
      activeHoursStart: '08:00',
      activeHoursEnd: '20:00',
      ...settings
  };

  // Check Active Hours for Sleep Mode
  useEffect(() => {
      if (!config.enableSleepMode || !config.activeHoursStart || !config.activeHoursEnd) {
          setIsSleepMode(false);
          return;
      }

      const checkTime = () => {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          
          const [startH, startM] = config.activeHoursStart!.split(':').map(Number);
          const [endH, endM] = config.activeHoursEnd!.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          let isActive = false;
          if (startMinutes < endMinutes) {
              isActive = currentMinutes >= startMinutes && currentMinutes < endMinutes;
          } else {
              // Night shift scenario
              isActive = currentMinutes >= startMinutes || currentMinutes < endMinutes;
          }
          
          setIsSleepMode(!isActive);
      };

      checkTime();
      const interval = setInterval(checkTime, 60000); // Check every minute
      return () => clearInterval(interval);
  }, [config.activeHoursStart, config.activeHoursEnd, config.enableSleepMode]);

  // 1. Build & Shuffle Playlist
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
        if (config.showProductVideos) {
            // Support legacy single video
            if (p.videoUrl) {
                 list.push({
                    id: `prod-vid-${p.id}`,
                    type: 'video',
                    url: p.videoUrl,
                    title: p.brandName,
                    subtitle: `${p.name} - Official Video`
                 });
            }
            // Support multiple videos
            if (p.videoUrls) {
                p.videoUrls.forEach((url, idx) => {
                    if (url !== p.videoUrl) {
                        list.push({
                            id: `prod-vid-${p.id}-${idx}`,
                            type: 'video',
                            url: url,
                            title: p.brandName,
                            subtitle: `${p.name} - Video Showcase`
                        });
                    }
                });
            }
        }
    });

    // Simple Shuffle
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }

    setPlaylist(list);
    setCurrentIndex(0);
  }, [products.length, ads.length, pamphlets.length, config.showProductImages, config.showProductVideos, config.showCustomAds, config.showPamphlets]);

  // Helper to move to next slide
  const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const handleMediaError = () => {
      console.warn("Media failed to load:", currentItem?.url);
      timerRef.current = window.setTimeout(() => {
          nextSlide();
      }, 2000); 
  };

  // 2. Playback Logic
  const currentItem = playlist[currentIndex];

  useEffect(() => {
    if (isSleepMode) return; // Stop playback logic in sleep mode
    if (!currentItem || playlist.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentItem.type === 'image') {
        const duration = (config.imageDuration && config.imageDuration > 0) ? config.imageDuration * 1000 : 8000;
        timerRef.current = window.setTimeout(() => {
            nextSlide();
        }, duration);
    } else {
        timerRef.current = window.setTimeout(() => {
            console.warn("Video timeout reached, skipping.");
            nextSlide();
        }, 180000); 
    }

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, currentItem, config.imageDuration, playlist.length, isSleepMode]);

  // Sleep Mode Render
  if (isSleepMode) {
      return (
          <div 
             onClick={onWake} 
             className="fixed inset-0 z-[100] bg-black cursor-pointer flex items-center justify-center"
          >
              <div className="flex flex-col items-center opacity-30 animate-pulse">
                  <Moon size={48} className="text-blue-500 mb-4" />
                  <div className="text-white font-mono text-sm">Sleep Mode Active</div>
                  <div className="text-white/50 text-xs mt-2">Tap to Wake</div>
              </div>
          </div>
      );
  }

  // Initial buffer
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

  const objectFitClass = config.displayStyle === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <div 
      onClick={onWake}
      className="fixed inset-0 z-[100] bg-black cursor-pointer flex items-center justify-center overflow-hidden"
    >
      <style>{`
        .ken-burns {
          animation: kenBurns 20s ease-out forwards;
        }
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .blur-in {
          animation: blurIn 1.5s ease-out forwards;
        }
        @keyframes blurIn {
          0% { opacity: 0; filter: blur(20px); }
          100% { opacity: 1; filter: blur(0); }
        }
      `}</style>

      {/* Background Ambience Layer - Improved Look for "Contain" style */}
      <div 
        key={`bg-${currentItem.id}`} 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-3xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: `url(${currentItem.url})` }}
      />
      
      {/* Dark Overlay to make text readable */}
      <div className="absolute inset-0 bg-black/30 z-10" />

      {/* Main Content Layer */}
      <div key={currentItem.id} className="w-full h-full relative z-20 flex items-center justify-center p-8 md:p-16">
         
         {currentItem.type === 'video' ? (
             <video 
               src={currentItem.url} 
               className={`w-full h-full max-w-full max-h-full ${objectFitClass} shadow-2xl rounded-sm animate-fade-in`}
               muted={config.muteVideos} 
               autoPlay
               playsInline
               onEnded={nextSlide} 
               onError={handleMediaError} 
             />
         ) : (
             <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-sm shadow-2xl relative">
                <img 
                  src={currentItem.url} 
                  alt="Screensaver" 
                  className={`w-full h-full max-w-full max-h-full ${objectFitClass} ken-burns blur-in`}
                  onError={handleMediaError}
                />
             </div>
         )}

         {/* Enhanced Overlay Info */}
         {config.showInfoOverlay && (currentItem.title || currentItem.subtitle) && (
             <div className="absolute bottom-16 left-16 max-w-[80%] pointer-events-none z-30 slide-up">
                {currentItem.title && (
                    <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl mb-4 leading-none opacity-90">
                        {currentItem.title}
                    </h1>
                )}
                
                <div className="flex flex-wrap gap-4 items-center">
                    {currentItem.subtitle && (
                        <div className="backdrop-blur-xl bg-white/10 border border-white/20 px-6 py-3 rounded-2xl shadow-xl">
                            <h2 className="text-xl md:text-3xl font-bold text-white tracking-wide">
                                {currentItem.subtitle}
                            </h2>
                        </div>
                    )}
                    
                    {(currentItem.startDate || currentItem.endDate) && (
                        <div className="backdrop-blur-xl bg-blue-600/80 border border-blue-400/30 px-6 py-3 rounded-2xl shadow-xl">
                            <p className="text-lg md:text-xl text-white font-mono font-bold uppercase tracking-widest">
                                {currentItem.startDate && formatDate(currentItem.startDate)}
                                {currentItem.startDate && currentItem.endDate && ` — `}
                                {currentItem.endDate && formatDate(currentItem.endDate)}
                            </p>
                        </div>
                    )}
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default Screensaver;