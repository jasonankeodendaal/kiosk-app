import React, { useRef, useState } from 'react';
import { StoreData } from '../types';
import { ArrowLeft, Play, Pause, AudioLines, Info } from 'lucide-react';

interface AboutPageProps {
  storeData: StoreData;
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ storeData, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
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

  const pageTitle = storeData.about?.title || "About Us";
  const pageText = storeData.about?.text || "Welcome.";

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in flex flex-col">
       <header className="bg-slate-900 text-white p-6 shadow-xl z-20 sticky top-0">
           <div className="max-w-4xl mx-auto flex items-center gap-4">
               <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors">
                   <ArrowLeft size={20} />
               </button>
               <h1 className="text-2xl font-black uppercase tracking-widest">{pageTitle}</h1>
           </div>
       </header>
       
       <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
           
           {/* Audio Player Section */}
           {storeData.about?.audioUrl && (
               <div className="bg-slate-900 text-white rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <button 
                            onClick={toggleAudio}
                            className={`w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform ${isPlaying ? 'scale-105' : ''}`}
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
                                <AudioLines className="text-green-400" /> Audio Guide
                            </h2>
                            <p className="text-slate-300 text-lg font-medium">Listen to the introduction.</p>
                        </div>
                    </div>
                    <audio ref={audioRef} src={storeData.about.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    
                    {/* Visual Waveform Effect */}
                    <div className={`absolute right-0 bottom-0 opacity-10 pointer-events-none transition-opacity duration-1000 ${isPlaying ? 'opacity-20' : 'opacity-5'}`}>
                        <div className="flex items-end gap-1 h-32">
                             {[...Array(20)].map((_,i) => (
                                 <div key={i} className={`w-4 bg-white ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s`, animationDuration: isPlaying ? '0.8s' : '0s' }}></div>
                             ))}
                        </div>
                    </div>
               </div>
           )}

           <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm">
                <div className="prose prose-lg prose-slate max-w-none">
                    {pageText.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4 text-slate-700 leading-relaxed font-medium">
                            {paragraph}
                        </p>
                    ))}
                    {pageText.trim() === '' && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                             <Info size={48} className="mb-4 opacity-20" />
                             <p>No description available.</p>
                        </div>
                    )}
                </div>
           </div>
       </main>
    </div>
  );
};

export default AboutPage;