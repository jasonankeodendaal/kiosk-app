import React, { useState, useEffect, useRef } from 'react';
import { StoreData, TVBrand } from '../types';
import { Play, Tv, ArrowLeft, ChevronLeft, ChevronRight, Pause, RotateCcw, MonitorPlay, MonitorStop } from 'lucide-react';

interface TVModeProps {
  storeData: StoreData;
  onRefresh: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const TVMode: React.FC<TVModeProps> = ({ storeData, onRefresh, screensaverEnabled, onToggleScreensaver }) => {
  const [activeBrand, setActiveBrand] = useState<TVBrand | null>(null);
  const [globalPlaylist, setGlobalPlaylist] = useState<string[]>([]);
  const [isPlayingGlobal, setIsPlayingGlobal] = useState(false);
  
  // Player State
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<number | null>(null);

  const tvBrands = storeData.tv?.brands || [];

  // Build Global Playlist on Mount (Shuffle all brand videos)
  useEffect(() => {
    if (tvBrands.length > 0) {
        const allVideos = tvBrands.flatMap(b => b.videoUrls || []);
        // Shuffle
        for (let i = allVideos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allVideos[i], allVideos[j]] = [allVideos[j], allVideos[i]];
        }
        setGlobalPlaylist(allVideos);
    }
  }, [tvBrands]);

  // Controls Logic
  const handleUserActivity = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = window.setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      return () => {
          window.removeEventListener('mousemove', handleUserActivity);
          window.removeEventListener('touchstart', handleUserActivity);
          window.removeEventListener('keydown', handleUserActivity);
          if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      };
  }, []);

  const handleBrandSelect = (brand: TVBrand) => {
      if (!brand.videoUrls || brand.videoUrls.length === 0) {
          alert("No videos available for this brand.");
          return;
      }
      setActiveBrand(brand);
      setCurrentVideoIndex(0);
      setIsPlayingGlobal(false);
      setIsPlaying(true);
  };

  const handlePlayGlobal = () => {
      if (globalPlaylist.length === 0) {
          alert("No videos found in system.");
          return;
      }
      setActiveBrand(null);
      setIsPlayingGlobal(true);
      setCurrentVideoIndex(0);
      setIsPlaying(true);
  };

  const handleVideoEnded = () => {
      const playlist = isPlayingGlobal ? globalPlaylist : (activeBrand?.videoUrls || []);
      setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      const playlist = isPlayingGlobal ? globalPlaylist : (activeBrand?.videoUrls || []);
      setCurrentVideoIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      const playlist = isPlayingGlobal ? globalPlaylist : (activeBrand?.videoUrls || []);
      setCurrentVideoIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const exitPlayer = () => {
      setActiveBrand(null);
      setIsPlayingGlobal(false);
      setIsPlaying(false);
  };

  // If Player Active
  if (activeBrand || isPlayingGlobal) {
      const currentPlaylist = isPlayingGlobal ? globalPlaylist : (activeBrand?.videoUrls || []);
      const currentUrl = currentPlaylist[currentVideoIndex];
      const title = isPlayingGlobal ? "Global TV Loop" : activeBrand?.name;

      return (
          <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center overflow-hidden group cursor-none">
              <video 
                  ref={videoRef}
                  src={currentUrl} 
                  className="w-full h-full object-contain"
                  autoPlay={isPlaying}
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
              />
              
              {/* Controls Overlay */}
              <div className={`absolute inset-0 flex flex-col justify-between p-8 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto cursor-auto' : 'opacity-0 pointer-events-none'}`}>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start">
                      <button onClick={exitPlayer} className="bg-black/50 hover:bg-black/80 text-white p-4 rounded-full backdrop-blur-md transition-transform hover:scale-105 border border-white/10">
                          <ArrowLeft size={32} />
                      </button>
                      <div className="bg-black/50 px-6 py-2 rounded-xl backdrop-blur-md border border-white/10 text-center">
                          <h2 className="text-white font-black uppercase tracking-widest text-lg">{title}</h2>
                          <div className="text-white/50 text-xs font-bold uppercase mt-1">Video {currentVideoIndex + 1} / {currentPlaylist.length}</div>
                      </div>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center justify-center gap-8">
                      <button onClick={handlePrev} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-transform active:scale-95"><ChevronLeft size={48} /></button>
                      <button 
                        onClick={() => {
                            if (videoRef.current) {
                                if (isPlaying) videoRef.current.pause();
                                else videoRef.current.play();
                                setIsPlaying(!isPlaying);
                            }
                        }} 
                        className="p-6 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform"
                      >
                          {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                      </button>
                      <button onClick={handleNext} className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-transform active:scale-95"><ChevronRight size={48} /></button>
                  </div>

                  {/* Bottom Bar */}
                  <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                       {/* Basic progress simulation if needed, or just a bar */}
                       <div className="h-full bg-blue-500 animate-pulse w-full"></div>
                  </div>
              </div>
          </div>
      );
  }

  // Home Screen (Grid)
  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col animate-fade-in overflow-hidden">
        {/* TV Header */}
        <header className="p-6 md:p-10 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                    <Tv size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest leading-none">TV Mode</h1>
                    <p className="text-white/50 text-xs md:text-sm font-bold uppercase tracking-wide mt-1">Select a Channel</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePlayGlobal}
                    className="flex items-center gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                >
                    <Play size={20} fill="currentColor" /> Play Global Loop
                </button>
                <div className="h-10 w-[1px] bg-white/20 mx-2"></div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-black text-white/40 uppercase tracking-widest">System Time</div>
                    <div className="text-xl font-mono font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            </div>
        </header>

        {/* Brands Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                 {tvBrands.map((brand) => (
                     <button 
                        key={brand.id}
                        onClick={() => handleBrandSelect(brand)}
                        className="group bg-white/5 border border-white/10 rounded-3xl aspect-video md:aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:-translate-y-2"
                     >
                         <div className="w-full h-full p-8 flex items-center justify-center relative z-10">
                             {brand.logoUrl ? (
                                 <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain filter drop-shadow-lg" />
                             ) : (
                                 <Tv size={64} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                             )}
                         </div>
                         
                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 z-20">
                             <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                 <h3 className="text-white font-black uppercase tracking-wider text-lg leading-none mb-1">{brand.name}</h3>
                                 <p className="text-blue-400 text-xs font-bold uppercase tracking-wide">{brand.videoUrls?.length || 0} Videos</p>
                             </div>
                         </div>
                     </button>
                 ))}
                 
                 {tvBrands.length === 0 && (
                     <div className="col-span-full h-64 flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/10 rounded-3xl">
                         <Tv size={48} className="mb-4" />
                         <div className="text-sm font-bold uppercase tracking-widest">No Channels Configured</div>
                         <div className="text-xs mt-2">Use Admin Hub to add TV Brands</div>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default TVMode;
