

import React, { useState, useEffect, useRef } from 'react';
import { StoreData, TVBrand, TVModel } from '../types';
import { Play, Tv, ArrowLeft, ChevronLeft, ChevronRight, Pause, RotateCcw, MonitorPlay, MonitorStop, Film, LayoutGrid, SkipForward, Monitor } from 'lucide-react';

interface TVModeProps {
  storeData: StoreData;
  onRefresh: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const TVMode: React.FC<TVModeProps> = ({ storeData, onRefresh, screensaverEnabled, onToggleScreensaver }) => {
  // Navigation State
  const [viewingBrand, setViewingBrand] = useState<TVBrand | null>(null);
  const [viewingModel, setViewingModel] = useState<TVModel | null>(null);
  
  // Player State
  const [activePlaylist, setActivePlaylist] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Controls the full screen player visibility
  const [isPaused, setIsPaused] = useState(false); // Controls the video element playback
  const [playerTitle, setPlayerTitle] = useState("");

  // Controls Visibility
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<number | null>(null);

  const tvBrands = storeData.tv?.brands || [];

  // --- CONTROLS LOGIC ---
  const handleUserActivity = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = window.setTimeout(() => setShowControls(false), 4000);
  };

  useEffect(() => {
      if (isPlaying) {
          window.addEventListener('mousemove', handleUserActivity);
          window.addEventListener('touchstart', handleUserActivity);
          window.addEventListener('keydown', handleUserActivity);
          handleUserActivity();
      }
      return () => {
          window.removeEventListener('mousemove', handleUserActivity);
          window.removeEventListener('touchstart', handleUserActivity);
          window.removeEventListener('keydown', handleUserActivity);
          if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      };
  }, [isPlaying]);


  // --- PLAYBACK LOGIC ---

  // 1. Play Global Loop (All videos from all brands/models)
  const handlePlayGlobal = () => {
      if (tvBrands.length === 0) {
          alert("No brands configured.");
          return;
      }
      // Gather ALL videos
      const allVideos = tvBrands.flatMap(b => (b.models || []).flatMap(m => m.videoUrls || []));
      
      if (allVideos.length === 0) {
          alert("No videos found in system.");
          return;
      }
      
      // Shuffle
      const shuffled = [...allVideos];
      for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      setActivePlaylist(shuffled);
      setCurrentVideoIndex(0);
      setPlayerTitle("Global TV Loop");
      setIsPlaying(true);
      setIsPaused(false);
  };

  // 2. Play Model Playlist
  const handlePlayModel = (model: TVModel, startIndex: number = 0) => {
      if (!model.videoUrls || model.videoUrls.length === 0) {
          alert("No videos available for this model.");
          return;
      }
      setActivePlaylist(model.videoUrls);
      setCurrentVideoIndex(startIndex);
      setPlayerTitle(model.name);
      setIsPlaying(true);
      setIsPaused(false);
  };

  // 3. Play Whole Brand Loop
  const handlePlayBrandLoop = (brand: TVBrand) => {
      const allBrandVideos = (brand.models || []).flatMap(m => m.videoUrls || []);
      if (allBrandVideos.length === 0) {
          alert("No videos for this brand.");
          return;
      }
      setActivePlaylist(allBrandVideos);
      setCurrentVideoIndex(0);
      setPlayerTitle(`${brand.name} - Full Loop`);
      setIsPlaying(true);
      setIsPaused(false);
  };

  // 3. Loop Logic
  const handleVideoEnded = () => {
      // Always loop to next video in playlist
      setCurrentVideoIndex((prev) => (prev + 1) % activePlaylist.length);
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentVideoIndex((prev) => (prev + 1) % activePlaylist.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentVideoIndex((prev) => (prev - 1 + activePlaylist.length) % activePlaylist.length);
  };

  const exitPlayer = () => {
      setIsPlaying(false);
      setActivePlaylist([]);
  };

  // Ensure playback continues when index changes (Robust Loop)
  useEffect(() => {
    if (isPlaying && videoRef.current) {
        videoRef.current.load();
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Auto-play prevented by browser policy:", error);
            });
        }
    }
  }, [currentVideoIndex, isPlaying]);

  // --- RENDER: FULL SCREEN PLAYER ---
  if (isPlaying && activePlaylist.length > 0) {
      const currentUrl = activePlaylist[currentVideoIndex];
      return (
          <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center overflow-hidden group cursor-none">
              <video 
                  key={`${currentUrl}-${currentVideoIndex}`} // Force remount ensuring clean state for each video in loop
                  ref={videoRef}
                  src={currentUrl} 
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPaused(false)}
                  onPause={() => setIsPaused(true)}
              />
              
              {/* Controls Overlay */}
              <div className={`absolute inset-0 flex flex-col justify-between p-4 md:p-8 transition-opacity duration-300 bg-gradient-to-b from-black/60 via-transparent to-black/60 ${showControls ? 'opacity-100 pointer-events-auto cursor-auto' : 'opacity-0 pointer-events-none'}`}>
                  {/* Top Bar */}
                  <div className="flex justify-between items-start">
                      <button onClick={exitPlayer} className="bg-white/10 hover:bg-white/20 text-white p-3 md:p-4 rounded-full transition-transform hover:scale-105 border border-white/10">
                          <ArrowLeft size={24} className="md:w-8 md:h-8" />
                      </button>
                      <div className="bg-black/60 px-6 py-2 rounded-xl border border-white/10 text-center">
                          <h2 className="text-white font-black uppercase tracking-widest text-sm md:text-lg">{playerTitle}</h2>
                          <div className="text-blue-400 text-[10px] md:text-xs font-bold uppercase mt-1 flex items-center justify-center gap-2">
                              <Film size={12} /> Video {currentVideoIndex + 1} of {activePlaylist.length}
                          </div>
                      </div>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center justify-center gap-8 md:gap-16">
                      <button onClick={handlePrev} className="p-4 md:p-6 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform active:scale-95 border border-white/10 group">
                          <ChevronLeft size={32} className="md:w-12 md:h-12 group-hover:-translate-x-1 transition-transform" />
                      </button>
                      
                      <button 
                        onClick={() => {
                            if (videoRef.current) {
                                if (isPaused) videoRef.current.play().catch(() => {});
                                else videoRef.current.pause();
                                setIsPaused(!isPaused);
                            }
                        }} 
                        className="p-6 md:p-8 bg-white text-black rounded-full shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-110 transition-transform flex items-center justify-center"
                      >
                          {isPaused ? <Play size={40} fill="currentColor" className="ml-2 md:w-12 md:h-12" /> : <Pause size={40} fill="currentColor" className="md:w-12 md:h-12" />}
                      </button>
                      
                      <button onClick={handleNext} className="p-4 md:p-6 bg-white/10 hover:bg-white/20 rounded-full text-white transition-transform active:scale-95 border border-white/10 group">
                          <ChevronRight size={32} className="md:w-12 md:h-12 group-hover:translate-x-1 transition-transform" />
                      </button>
                  </div>

                  {/* Bottom Bar */}
                  <div className="flex items-center gap-4">
                      <div className="text-white text-xs font-mono font-bold">
                           {currentVideoIndex + 1} / {activePlaylist.length}
                      </div>
                      <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                           <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${((currentVideoIndex + 1) / activePlaylist.length) * 100}%` }}
                           ></div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: MODEL DETAIL VIEW (List of videos) ---
  if (viewingBrand && viewingModel) {
      return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col animate-fade-in relative overflow-hidden">
             {/* Background blur effect */}
             <div className="absolute inset-0 z-0">
                 {viewingBrand.logoUrl && (
                     <img src={viewingBrand.logoUrl} className="w-full h-full object-cover opacity-5 blur-3xl scale-150" alt="" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/80"></div>
             </div>

             {/* Header */}
             <header className="relative z-10 p-6 md:p-10 flex items-center justify-between shrink-0">
                 <button 
                    onClick={() => setViewingModel(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs md:text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5"
                 >
                     <ArrowLeft size={16} /> Back to Models
                 </button>
                 <div className="text-right">
                     <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">{viewingModel.name}</h1>
                     <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">{viewingBrand.name}</p>
                 </div>
             </header>

             <main className="relative z-10 flex-1 overflow-hidden flex flex-col md:flex-row p-6 md:p-10 gap-8 md:gap-16">
                 
                 {/* Left Panel: Info & Play All */}
                 <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left gap-8">
                     <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-3xl p-8 flex items-center justify-center shadow-2xl shadow-black/50 border border-white/10 overflow-hidden">
                         {viewingModel.imageUrl ? (
                             <img src={viewingModel.imageUrl} alt={viewingModel.name} className="w-full h-full object-cover rounded-xl" />
                         ) : viewingBrand.logoUrl ? (
                             <img src={viewingBrand.logoUrl} alt={viewingBrand.name} className="max-w-full max-h-full object-contain" />
                         ) : (
                             <Monitor size={80} className="text-slate-300" />
                         )}
                     </div>
                     
                     <div className="space-y-4 w-full max-w-sm">
                         <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                             <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Playlist Size</div>
                             <div className="text-2xl font-black text-white">{viewingModel.videoUrls?.length || 0} Videos</div>
                         </div>
                         
                         <button 
                            onClick={() => handlePlayModel(viewingModel, 0)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm md:text-lg shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] hover:scale-105 transition-all flex items-center justify-center gap-3"
                         >
                             <Play size={24} fill="currentColor" /> Play Model Loop
                         </button>
                     </div>
                 </div>

                 {/* Right Panel: Video Grid */}
                 <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-800/30 rounded-3xl border border-white/5">
                     <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-2">
                         <LayoutGrid size={16} className="text-blue-500" />
                         <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Playlist Content</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
                         {viewingModel.videoUrls?.map((url, idx) => (
                             <button
                                key={idx}
                                onClick={() => handlePlayModel(viewingModel, idx)}
                                className="group relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 hover:border-blue-500 transition-colors shadow-lg flex flex-col"
                             >
                                 <div className="flex-1 relative w-full h-full flex items-center justify-center bg-slate-900">
                                     <video src={url} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" preload="metadata" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-blue-600 text-white flex items-center justify-center transition-all group-hover:scale-110">
                                             <Play size={20} fill="currentColor" className="ml-1" />
                                         </div>
                                     </div>
                                 </div>
                                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                                     <div className="text-white font-bold text-xs uppercase tracking-wide truncate text-left">Video {idx + 1}</div>
                                 </div>
                             </button>
                         ))}
                         {(!viewingModel.videoUrls || viewingModel.videoUrls.length === 0) && (
                             <div className="col-span-full py-12 text-center text-slate-500 font-bold uppercase text-xs">No videos configured for this model.</div>
                         )}
                     </div>
                 </div>

             </main>
        </div>
      );
  }

  // --- RENDER: BRAND DETAIL VIEW (Select Model) ---
  if (viewingBrand) {
      return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col animate-fade-in relative overflow-hidden">
             {/* Background blur effect */}
             <div className="absolute inset-0 z-0">
                 {viewingBrand.logoUrl && (
                     <img src={viewingBrand.logoUrl} className="w-full h-full object-cover opacity-5 blur-3xl scale-150" alt="" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/80"></div>
             </div>

             {/* Header */}
             <header className="relative z-10 p-6 md:p-10 flex items-center justify-between shrink-0">
                 <button 
                    onClick={() => setViewingBrand(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs md:text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5"
                 >
                     <ArrowLeft size={16} /> Back to Brands
                 </button>
                 <div className="text-right">
                     <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">{viewingBrand.name}</h1>
                     <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">Select TV Model</p>
                 </div>
             </header>

             <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                     
                     {/* "Play All" Card */}
                     <button
                        onClick={() => handlePlayBrandLoop(viewingBrand)}
                        className="bg-blue-600 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform shadow-lg shadow-blue-900/20 aspect-[4/3]"
                     >
                         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                             <Play size={32} fill="currentColor" />
                         </div>
                         <h3 className="text-xl font-black uppercase">Play Full Loop</h3>
                         <p className="text-xs font-bold text-blue-200 mt-2">All {viewingBrand.name} Videos</p>
                     </button>

                     {/* Models List */}
                     {(viewingBrand.models || []).map(model => (
                         <button
                            key={model.id}
                            onClick={() => setViewingModel(model)}
                            className="bg-slate-800/50 border border-white/10 rounded-3xl overflow-hidden hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] transition-all group aspect-[4/3] relative"
                         >
                             <div className="absolute inset-0 flex items-center justify-center p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                 {model.imageUrl ? (
                                     <img src={model.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                 ) : viewingBrand.logoUrl ? (
                                     <img src={viewingBrand.logoUrl} alt="" className="w-full h-full object-contain opacity-20" />
                                 ) : (
                                     <Monitor size={64} className="text-slate-600" />
                                 )}
                             </div>
                             
                             {/* Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-6 text-left">
                                 <h3 className="text-lg md:text-xl font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">{model.name}</h3>
                                 <p className="text-xs font-bold text-slate-400 uppercase mt-1">{model.videoUrls?.length || 0} Videos</p>
                             </div>
                         </button>
                     ))}
                 </div>
                 
                 {(viewingBrand.models || []).length === 0 && (
                     <div className="mt-12 text-center text-slate-500 font-bold uppercase tracking-widest border-2 border-dashed border-white/5 rounded-3xl p-12">
                         No models configured for this brand.
                     </div>
                 )}
             </main>
        </div>
      );
  }

  // --- RENDER: HOME SCREEN (Brand Grid) ---
  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex flex-col animate-fade-in overflow-hidden relative">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 z-0 pointer-events-none"></div>

        {/* TV Header */}
        <header className="relative z-10 p-6 md:p-10 flex items-center justify-between border-b border-white/5 shrink-0 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/20">
                    <Tv size={32} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest leading-none drop-shadow-lg">TV Mode</h1>
                    <p className="text-white/50 text-xs md:text-sm font-bold uppercase tracking-wide mt-1">Select Channel or Global Loop</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <button 
                    onClick={handlePlayGlobal}
                    className="flex items-center gap-3 bg-white text-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105 border border-white/20"
                >
                    <SkipForward size={20} fill="currentColor" /> Play Global Loop
                </button>
                <div className="h-10 w-[1px] bg-white/10 mx-2 hidden md:block"></div>
                <button 
                   onClick={onToggleScreensaver} 
                   className={`p-3 rounded-xl border transition-colors hidden md:block ${screensaverEnabled ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                >
                   {screensaverEnabled ? <MonitorPlay size={20} /> : <MonitorStop size={20} />}
                </button>
            </div>
        </header>

        {/* Brands Grid */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                 {tvBrands.map((brand) => (
                     <button 
                        key={brand.id}
                        onClick={() => setViewingBrand(brand)}
                        className="group bg-slate-800/50 border border-white/5 rounded-3xl aspect-video md:aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:bg-slate-800 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(37,99,235,0.25)] hover:-translate-y-2"
                     >
                         {/* Logo Area */}
                         <div className="w-full h-full p-8 flex items-center justify-center relative z-10">
                             {brand.logoUrl ? (
                                 <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain filter drop-shadow-xl transition-transform duration-500 group-hover:scale-110" />
                             ) : (
                                 <div className="flex flex-col items-center gap-2">
                                     <Tv size={64} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
                                     <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Logo</span>
                                 </div>
                             )}
                         </div>
                         
                         {/* Info Footer (Always visible but enhanced on hover) */}
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-end">
                              <div className="text-left">
                                  <h3 className="text-white font-black uppercase tracking-wider text-sm md:text-base leading-none mb-1 group-hover:text-blue-400 transition-colors">{brand.name}</h3>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                                      <Monitor size={10} /> {brand.models?.length || 0} Models
                                  </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                  <ChevronRight size={16} />
                              </div>
                         </div>
                     </button>
                 ))}
                 
                 {tvBrands.length === 0 && (
                     <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/20">
                         <Tv size={64} className="mb-6 opacity-50" />
                         <div className="text-xl font-black uppercase tracking-widest text-slate-400">No Channels Configured</div>
                         <div className="text-sm mt-2 font-bold opacity-60">Add brands in Admin Hub &rarr; TV Tab</div>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default TVMode;
