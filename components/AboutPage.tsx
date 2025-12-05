import React, { useRef, useState } from 'react';
import { StoreData } from '../types';
import { ArrowLeft, Play, Pause, Info, Server, Tablet, Cloud, RefreshCw, AudioLines } from 'lucide-react';

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

  const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">{icon}</div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in flex flex-col">
       <header className="bg-slate-900 text-white p-6 shadow-xl z-20 sticky top-0">
           <div className="max-w-4xl mx-auto flex items-center gap-4">
               <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors">
                   <ArrowLeft size={20} />
               </button>
               <h1 className="text-2xl font-black uppercase tracking-widest">About System</h1>
           </div>
       </header>
       
       <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
           
           {/* Audio Player Section */}
           {storeData.about?.audioUrl && (
               <div className="bg-slate-900 text-white rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <button 
                            onClick={toggleAudio}
                            className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform"
                        >
                            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
                                <AudioLines className="text-green-400" /> Audio Guide
                            </h2>
                            <p className="text-slate-300 text-lg font-medium">Too lazy to read? Listen to the system overview.</p>
                        </div>
                    </div>
                    <audio ref={audioRef} src={storeData.about.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    
                    {/* Visual Waveform Effect */}
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                        <div className="flex items-end gap-1 h-32">
                             {[...Array(20)].map((_,i) => (
                                 <div key={i} className="w-4 bg-white animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                             ))}
                        </div>
                    </div>
               </div>
           )}

           <div className="space-y-12">
               <section>
                   <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight text-center md:text-left">Architecture Overview</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <FeatureCard 
                          icon={<Server size={32} />} 
                          title="Admin Hub" 
                          desc="The central control center. Runs on a PC/Laptop. This is where you manage products, prices, and upload media. It pushes updates to the Cloud." 
                       />
                       <FeatureCard 
                          icon={<Tablet size={32} />} 
                          title="Kiosk Unit" 
                          desc="The touch terminals in your shop. They pull data from the Cloud and cache it locally, ensuring they work even if the internet goes down." 
                       />
                       <FeatureCard 
                          icon={<Cloud size={32} />} 
                          title="Cloud Sync" 
                          desc="Powered by Supabase. Acts as the bridge between Admin and Kiosks. Stores images, videos, and database records securely." 
                       />
                       <FeatureCard 
                          icon={<RefreshCw size={32} />} 
                          title="Realtime Updates" 
                          desc="Changes made in the Admin Hub appear on Kiosks instantly without restarting. Fleet management allows remote restart and snapshots." 
                       />
                   </div>
               </section>
               
               <section className="bg-white rounded-3xl p-8 border border-slate-200">
                    <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">System Details</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                            <p className="text-slate-600 text-sm"><strong>Hybrid Offline Mode:</strong> Kiosks download all essential data to their internal storage. If Wi-Fi fails, customers can still browse products.</p>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                            <p className="text-slate-600 text-sm"><strong>Media Optimization:</strong> Images are compressed automatically. Videos are streamed but cached where possible to save bandwidth.</p>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                            <p className="text-slate-600 text-sm"><strong>Security:</strong> The Admin Hub is password protected. Kiosk units are locked to 'Kiosk Mode' to prevent unauthorized access to the tablet OS.</p>
                        </li>
                    </ul>
               </section>
           </div>
       </main>
    </div>
  );
};

export default AboutPage;