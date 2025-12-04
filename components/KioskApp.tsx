
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StoreData, Brand, Category, Product, FlatProduct } from '../types';
import { 
  getKioskId, 
  provisionKioskId,
  completeKioskSetup, 
  isKioskConfigured, 
  sendHeartbeat, 
  setCustomKioskId,
  getShopName
} from '../services/kioskService';
import BrandGrid from './BrandGrid';
import CategoryGrid from './CategoryGrid';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Screensaver from './Screensaver';
import Flipbook from './Flipbook';
import { Store, RotateCcw, X, Loader2, Wifi, WifiOff, Clock, MapPin, ShieldCheck } from 'lucide-react';

// UPDATED TIMEOUT: 1 Minute = 60,000 ms
const IDLE_TIMEOUT = 60000;

// --- CREATOR POPUP COMPONENT ---
export const CreatorPopup = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <div 
    className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
    onClick={onClose}
  >
    <div 
      className={`relative w-full max-w-xs md:max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/20 aspect-[4/5] flex flex-col items-center justify-center text-center p-6 transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}
      style={{ 
        backgroundImage: 'url(https://i.ibb.co/dsh2c2hp/unnamed.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        {/* Creator Logo - Free View */}
        <div className="w-32 h-32 mb-2 hover:scale-105 transition-transform duration-500">
           <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        
        <h2 className="text-white font-black text-3xl mb-1 drop-shadow-lg tracking-tight">JSTYP.me</h2>
        <p className="text-white/90 text-sm font-bold mb-4 drop-shadow-md italic max-w-[90%]">"Jason's Solution To Your Problems, Yes me!"</p>
        
        {/* New Marketing Text */}
        <p className="text-white text-xs font-bold mb-8 drop-shadow-md text-center px-4 leading-relaxed uppercase tracking-wide bg-black/20 rounded-lg py-2 backdrop-blur-sm border border-white/10">
            Need a website/ APP or a special tool, get in touch today!
        </p>
        
        {/* Contact Links - ICONS ONLY (Free View) */}
        <div className="flex items-center justify-center gap-8">
           <a href="https://wa.me/27695989427" target="_blank" rel="noreferrer" className="transition-transform hover:scale-125 duration-300" title="WhatsApp">
              <img src="https://i.ibb.co/Z1YHvjgT/image-removebg-preview-1.png" className="w-12 h-12 object-contain drop-shadow-lg" alt="WhatsApp" />
           </a>
           
           <a href="mailto:jstypme@gmail.com" className="transition-transform hover:scale-125 duration-300" title="Email">
              <img src="https://i.ibb.co/r2HkbjLj/image-removebg-preview-2.png" className="w-12 h-12 object-contain drop-shadow-lg" alt="Email" />
           </a>
        </div>
      </div>

      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/20 p-1 rounded-full backdrop-blur-sm transition-colors">
         <X size={20} />
      </button>
    </div>
  </div>
);

// --- SETUP SCREEN COMPONENT ---
export const SetupScreen = ({ 
  kioskId, 
  onComplete,
  onRestoreId
}: { 
  kioskId: string, 
  onComplete: (name: string) => void,
  onRestoreId: (id: string) => void
}) => {
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [customId, setCustomId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    if(isRestoreMode && customId.trim()) {
       onRestoreId(customId.trim());
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    onComplete(shopName);
    setIsSubmitting(false);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-10 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-yellow-400"></div>
        <div className="mb-8 text-center">
           <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600"><Store size={32} /></div>
           <h1 className="text-3xl font-black text-slate-900 mb-2">Device Setup</h1>
           <p className="text-slate-500">Initialize this kiosk for your location.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned ID</span>
                <button type="button" onClick={() => setIsRestoreMode(!isRestoreMode)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline flex items-center gap-1"><RotateCcw size={10} /> {isRestoreMode ? 'Cancel Restore' : 'Restore Device'}</button>
             </div>
             {isRestoreMode ? (
               <input type="text" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="Enter ID (e.g. LOC-001)" className="w-full font-mono font-bold text-slate-700 bg-white px-3 py-2 rounded border border-blue-300 outline-none text-lg" autoFocus />
             ) : (
               <span className="font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 text-lg block text-center">{kioskId}</span>
             )}
          </div>
          <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Shop / Location Name</label><input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Downtown Mall - Entrance 1" className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-lg text-slate-900" autoFocus /></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
             {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN KIOSK APP COMPONENT ---
export const KioskApp = ({ storeData, onGoToAdmin }: { storeData: StoreData | null, onGoToAdmin: () => void }) => {
  const [isSetup, setIsSetup] = useState(isKioskConfigured());
  const [kioskId, setKioskId] = useState(getKioskId());
  
  // Navigation State
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // UX State
  const [isIdle, setIsIdle] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [flipbookPages, setFlipbookPages] = useState<string[]>([]);
  
  // Footer/System State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Idle Timer
  const timerRef = useRef<number | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setIsIdle(true);
      // Reset navigation on idle
      setActiveProduct(null);
      setActiveCategory(null);
      setActiveBrand(null);
      setShowFlipbook(false);
      setShowCreator(false);
    }, IDLE_TIMEOUT);
  }, []);

  useEffect(() => {
    // Events to reset timer
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    
    // Status Intervals
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    resetIdleTimer();
    
    return () => {
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      clearInterval(clockInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetIdleTimer]);

  // Setup Effect
  useEffect(() => {
    if (!kioskId) {
      provisionKioskId().then(id => setKioskId(id));
    }
  }, [kioskId]);

  // Heartbeat
  useEffect(() => {
    if (isSetup) {
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 60000);
      return () => clearInterval(interval);
    }
  }, [isSetup]);

  // Preload Creator Assets
  useEffect(() => {
      const preloadImages = [
        'https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png',
        'https://i.ibb.co/dsh2c2hp/unnamed.jpg',
        'https://i.ibb.co/Z1YHvjgT/image-removebg-preview-1.png',
        'https://i.ibb.co/r2HkbjLj/image-removebg-preview-2.png'
      ];
      preloadImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
  }, []);

  const handleSetupComplete = (name: string) => {
    completeKioskSetup(name).then(() => setIsSetup(true));
  };

  const handleRestore = (id: string) => {
    setCustomKioskId(id);
    setKioskId(id);
    setIsSetup(true); // Assume configured if restoring ID
  };
  
  // Render Logic
  if (!isSetup && kioskId) {
    return <SetupScreen kioskId={kioskId} onComplete={handleSetupComplete} onRestoreId={handleRestore} />;
  }
  
  if (!storeData) return null; // Loading handled in App.tsx

  // Flatten products for Screensaver
  const allProducts = storeData.brands.flatMap(b => 
    b.categories.flatMap(c => 
      c.products.map(p => ({...p, brandName: b.name, categoryName: c.name} as FlatProduct))
    )
  );

  return (
    <div className="h-full w-full relative bg-slate-100 overflow-hidden flex flex-col">
       {/* Screensaver Overlay */}
       {isIdle && (
         <Screensaver 
           products={allProducts} 
           ads={storeData.ads?.screensaver || []} 
           onWake={resetIdleTimer} 
         />
       )}

       {/* Main Content Stack (Flex Grow) */}
       <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* Top Bar / Header could go here or be part of components */}
          
          <div className="flex-1 overflow-hidden relative">
             {!activeBrand ? (
               <BrandGrid 
                 brands={storeData.brands} 
                 heroConfig={storeData.hero}
                 globalCatalog={storeData.catalogues?.find(c => !c.brandId)} // Pass global catalog
                 ads={storeData.ads}
                 onSelectBrand={setActiveBrand}
                 onViewGlobalCatalog={(pages) => { setFlipbookPages(pages); setShowFlipbook(true); }}
                 onExport={() => {}} // Remove or implement if needed
               />
             ) : !activeCategory ? (
               <CategoryGrid 
                 brand={activeBrand} 
                 onSelectCategory={setActiveCategory} 
                 onBack={() => setActiveBrand(null)} 
               />
             ) : !activeProduct ? (
               <ProductList 
                 category={activeCategory} 
                 brand={activeBrand}
                 storeCatalogs={storeData.catalogues || []}
                 onSelectProduct={setActiveProduct} 
                 onBack={() => setActiveCategory(null)}
                 onViewCatalog={(pages) => { setFlipbookPages(pages); setShowFlipbook(true); }}
               />
             ) : (
               <ProductDetail 
                 product={activeProduct} 
                 onBack={() => setActiveProduct(null)} 
               />
             )}
          </div>
       </div>

       {/* PERSISTENT FOOTER */}
       <footer className="shrink-0 bg-slate-900 text-white h-12 flex items-center justify-between px-6 z-50 border-t border-slate-800 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
          {/* Left: Identity */}
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {isOnline ? 'System Online' : 'Offline Mode'}
                 </span>
              </div>
              <div className="h-4 w-[1px] bg-slate-700"></div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                 <ShieldCheck size={12} className="text-blue-500" />
                 <span>ID: <span className="font-mono text-white">{kioskId}</span></span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400">
                 <MapPin size={12} />
                 <span className="truncate max-w-[200px]">{getShopName()}</span>
              </div>
          </div>

          {/* Right: Time & Branding */}
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                 <Clock size={12} className="text-blue-400" />
                 <span className="text-xs font-mono font-bold">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </div>
              {/* Creator Trigger (Integrated in footer now for cleaner UI) */}
              <button 
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                 <span>Powered by JSTYP</span>
                 <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" className="w-4 h-4 object-contain opacity-50" alt="" />
              </button>
          </div>
       </footer>

       {/* Admin Trigger (Invisible - Top Left Corner) */}
       <button 
         onClick={onGoToAdmin} 
         className="absolute top-0 left-0 w-16 h-16 z-50 opacity-0" 
         title="Admin Access"
       />

       {/* Creator Popup Modal */}
       <CreatorPopup isOpen={showCreator} onClose={() => setShowCreator(false)} />

       {/* Flipbook Modal */}
       {showFlipbook && (
         <Flipbook pages={flipbookPages} onClose={() => setShowFlipbook(false)} />
       )}
    </div>
  );
};
