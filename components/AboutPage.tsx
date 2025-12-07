
import React, { useRef, useState } from 'react';
import { StoreData } from '../types';
import { ArrowLeft, Play, Pause, AudioLines, Info, Share2, Check, Headphones, Globe, MessageSquare } from 'lucide-react';

interface AboutPageProps {
  storeData: StoreData;
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ storeData, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleShare = async () => {
    const shareData = {
        title: storeData.about?.title || 'Kiosk Pro',
        text: storeData.about?.text?.substring(0, 100) + '...',
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (e) {
            console.warn("Share cancelled");
        }
    } else {
        // Fallback for desktop/unsupported
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const pageTitle = storeData.about?.title || "About Us";
  const pageText = storeData.about?.text || "Welcome.";

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in flex flex-col">
       <header className="bg-slate-900 text-white p-4 md:p-6 shadow-xl z-20 sticky top-0 shrink-0">
           <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-4">
                   <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-xl transition-colors backdrop-blur-sm border border-white/5 group">
                       <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                   </button>
                   <div>
                       <h1 className="text-xl md:text-3xl font-black uppercase tracking-widest leading-none">{pageTitle}</h1>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Kiosk</span>
                       </div>
                   </div>
               </div>
               
               <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg hover:shadow-blue-900/50"
               >
                   {copied ? <Check size={16} /> : <Share2 size={16} />}
                   <span>{copied ? 'Link Copied' : 'Share'}</span>
               </button>
           </div>
       </header>
       
       <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 h-full">
               
               {/* LEFT COLUMN (Media / Context) */}
               <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
                   {/* Audio Player Card */}
                   {storeData.about?.audioUrl ? (
                       <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden group border border-slate-800">
                            {/* Decorative Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 z-0"></div>
                            
                            {/* Explicit Share Button for Audio Card with Text */}
                            <button 
                                onClick={handleShare}
                                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 z-20 text-xs font-bold uppercase tracking-wide"
                                title="Share Audio Page"
                            >
                                <Share2 size={14} /> Share
                            </button>
                            
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <button 
                                    onClick={toggleAudio}
                                    className={`w-20 h-20 md:w-24 md:h-24 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-110 transition-transform mb-6 ${isPlaying ? 'scale-105 ring-4 ring-white/20' : ''}`}
                                >
                                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                </button>
                                
                                <div className="space-y-2">
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Headphones size={24} className="text-blue-400" /> Audio Guide
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                        Listen to our company vision and story.
                                    </p>
                                </div>

                                {/* Visual Waveform Effect */}
                                <div className="flex items-end gap-1 h-12 mt-6 justify-center">
                                     {[...Array(12)].map((_,i) => (
                                         <div 
                                            key={i} 
                                            className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-1 opacity-20'}`} 
                                            style={{ 
                                                height: isPlaying ? `${Math.random() * 100}%` : '4px', 
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                         ></div>
                                     ))}
                                </div>
                            </div>
                            <audio ref={audioRef} src={storeData.about.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                       </div>
                   ) : (
                       <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                           <AudioLines size={48} className="mb-4 opacity-20" />
                           <span className="text-xs font-bold uppercase tracking-widest">No Audio Guide Available</span>
                       </div>
                   )}
                   
                   {/* Info Cards */}
                   <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
                               <Globe size={20} />
                           </div>
                           <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Website</span>
                           <span className="text-xs font-bold text-slate-800 truncate w-full">kioskpro.com</span>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                           <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                               <MessageSquare size={20} />
                           </div>
                           <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Contact</span>
                           <span className="text-xs font-bold text-slate-800 truncate w-full">Support 24/7</span>
                       </div>
                   </div>
               </div>

               {/* RIGHT COLUMN (Text Content) */}
               <div className="md:col-span-7 lg:col-span-8">
                   <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Info size={200} />
                        </div>
                        
                        <div className="prose prose-lg prose-slate max-w-none relative z-10">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                                Our Story
                            </h3>
                            
                            {pageText.split('\n').map((paragraph, idx) => (
                                paragraph.trim() !== '' && (
                                    <p key={idx} className="mb-6 text-slate-700 leading-relaxed font-medium text-sm md:text-base">
                                        {paragraph}
                                    </p>
                                )
                            ))}
                            
                            {pageText.trim() === '' && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                     <Info size={48} className="mb-4 opacity-20" />
                                     <p className="uppercase font-bold text-xs tracking-widest">No description available.</p>
                                </div>
                            )}

                            {/* New Share Button Area */}
                            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center md:justify-start">
                                <button 
                                    onClick={handleShare}
                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all border border-slate-200 group"
                                >
                                    <Share2 size={16} className="group-hover:scale-110 transition-transform" /> 
                                    <span>{copied ? 'Link Copied' : 'Share this Page'}</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Footer Signature */}
                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-4 opacity-60">
                             <img src={storeData.companyLogoUrl || "https://i.ibb.co/cS36Vp5w/maskable-icon.png"} className="h-8 object-contain grayscale" alt="Logo" />
                             <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                 &copy; {new Date().getFullYear()} Kiosk Pro Systems
                             </div>
                        </div>
                   </div>
               </div>

           </div>
       </main>
    </div>
  );
};

export default AboutPage;
