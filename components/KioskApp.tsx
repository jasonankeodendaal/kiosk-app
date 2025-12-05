

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StoreData, Brand, Category, Product, FlatProduct } from '../types';
import { 
  getKioskId, 
  provisionKioskId, 
  completeKioskSetup, 
  isKioskConfigured, 
  sendHeartbeat, 
  setCustomKioskId, 
  getShopName,
  getDeviceType,
  supabase,
  checkCloudConnection
} from '../services/kioskService';
import BrandGrid from './BrandGrid';
import CategoryGrid from './CategoryGrid';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Screensaver from './Screensaver';
import Flipbook from './Flipbook';
import { Store, RotateCcw, X, Loader2, Wifi, WifiOff, Clock, MapPin, ShieldCheck, MonitorPlay, MonitorStop, Tablet, Smartphone, Check, Cloud, HardDrive, RefreshCw } from 'lucide-react';

const DEFAULT_IDLE_TIMEOUT = 60000;

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
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-popup-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <div className="w-32 h-32 mb-2 hover:scale-105 transition-transform duration-500">
           <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        
        <h2 id="creator-popup-title" className="text-white font-black text-3xl mb-1 drop-shadow-lg tracking-tight">JSTYP.me</h2>
        <p className="text-white/90 text-sm font-bold mb-4 drop-shadow-md italic max-w-[90%]">"Jason's Solution To Your Problems, Yes me!"</p>
        
        <p className="text-white text-xs font-bold mb-8 drop-shadow-md text-center px-4 leading-relaxed uppercase tracking-wide bg-black/20 rounded-lg py-2 backdrop-blur-sm border border-white/10">
            Need a website/ APP or a special tool, get in touch today!
        </p>
        
        <div className="flex items-center justify-center gap-8">
           <a href="https://wa.me/27695989427" target="_blank" rel="noreferrer" className="transition-transform hover:scale-125 duration-300" title="WhatsApp">
              <img src="https://i.ibb.co/Z1YHvjgT/image-removebg-preview-1.png" className="w-12 h-12 object-contain drop-shadow-lg" alt="WhatsApp" />
           </a>
           
           <a href="mailto:jstypme@gmail.com" className="transition-transform hover:scale-125 duration-300" title="Email">
              <img src="https://i.ibb.co/r2HkbjLj/image-removebg-preview-2.png" className="w-12 h-12 object-contain drop-shadow-lg" alt="Email" />
           </a>
        </div>
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/20 p-1 rounded-full backdrop-blur-sm transition-colors" aria-label="Close creator information">
         <X size={20} />
      </button>
    </div>
  </div>
);

export const SetupScreen = ({ 
  kioskId, 
  onComplete,
  onRestoreId
}: { 
  kioskId: string, 
  onComplete: (name: string, type: 'kiosk' | 'mobile') => void,
  onRestoreId: (id: string) => void
}) => {
  const [shopName, setShopName] = useState('');
  const [deviceType, setDeviceType] = useState<'kiosk' | 'mobile'>('kiosk');
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
    onComplete(shopName, deviceType);
    setIsSubmitting(false);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-10 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-yellow-400"></div>
        <div className="mb-8 text-center">
           <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600"><Store size={32} /></div>
           <h1 className="text-3xl font-black text-slate-900 mb-2">Device Setup</h1>
           <p className="text-slate-500">Initialize this device for your location.</p>
        </div>
        <form onSubmit={handleSubmit}>
          
          {/* Device Type Selection */}
          <div className="mb-6 grid grid-cols-2 gap-4">
             <button
                type="button" 
                onClick={() => setDeviceType('kiosk')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deviceType === 'kiosk' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
             >
                 <Tablet size={32} />
                 <span className="text-xs font-black uppercase tracking-wider">Kiosk Display</span>
                 {deviceType === 'kiosk' && <div className="absolute top-2 right-2 text-blue-500"><Check size={16} /></div>}
                 <span className="text-[9px] text-center opacity-70 leading-tight">Screensaver & Camera Active</span>
             </button>

             <button 
                type="button"
                onClick={() => setDeviceType('mobile')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deviceType === 'mobile' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
             >
                 <Smartphone size={32} />
                 <span className="text-xs font-black uppercase tracking-wider">Personal Mobile</span>
                 {deviceType === 'mobile' && <div className="absolute top-2 right-2 text-purple-500"><Check size={16} /></div>}
                 <span className="text-[9px] text-center opacity-70 leading-tight">No Screensaver / Camera Off</span>
             </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned ID</span>
                <button type="button" onClick={() => setIsRestoreMode(!isRestoreMode)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline flex items-center gap-1" aria-expanded={isRestoreMode} aria-controls="custom-id-input"><RotateCcw size={10} /> {isRestoreMode ? 'Cancel Restore' : 'Restore Device'}</button>
             </div>
             {isRestoreMode ? (
               <input type="text" id="custom-id-input" value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="Enter ID (e.g. LOC-001)" className="w-full font-mono font-bold text-slate-700 bg-white px-3 py-2 rounded border border-blue-300 outline-none text-lg" autoFocus aria-label="Custom Kiosk ID" />
             ) : (
               <span className="font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 text-lg block text-center" aria-label="Current Kiosk ID">{kioskId}</span>
             )}
          </div>
          <div className="mb-6"><label htmlFor="shop-name" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Shop / Location Name</label><input type="text" id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Downtown Mall - Entrance 1" className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-lg text-slate-900" autoFocus aria-required="true" /></div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
             {isSubmitting ? <Loader2 className="animate-spin" aria-label="Submitting" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const KioskApp = ({ storeData, onGoToAdmin, lastSyncTime }: { storeData: StoreData | null, onGoToAdmin: () => void, lastSyncTime?: string }) => {
  const [isSetup, setIsSetup] = useState(isKioskConfigured());
  const [kioskId, setKioskId] = useState(getKioskId());
  const [deviceType, setDeviceTypeState] = useState(getDeviceType());
  
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  const [isIdle, setIsIdle] = useState(false);
  const [screensaverEnabled, setScreensaverEnabled] = useState(true);

  const [showCreator, setShowCreator] = useState(false);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [flipbookPages, setFlipbookPages] = useState<string[]>([]);
  const [flipbookTitle, setFlipbookTitle] = useState<string | undefined>(undefined); 
  const [flipbookStartDate, setFlipbookStartDate] = useState<string | undefined>(undefined);
  const [flipbookEndDate, setFlipbookEndDate] = useState<string | undefined>(undefined);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  const idleTimeout = (storeData?.screensaverSettings?.idleTimeout || 60) * 1000;

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Only set idle timer if screensaver is enabled AND device is a Kiosk
    if (screensaverEnabled && deviceType === 'kiosk') {
      timerRef.current = window.setTimeout(() => {
        setIsIdle(true);
        setActiveProduct(null);
        setActiveCategory(null);
        setActiveBrand(null);
        setShowFlipbook(false);
        setShowCreator(false);
      }, idleTimeout);
    }
  }, [screensaverEnabled, idleTimeout, deviceType]);

  // Hidden Camera Capture Logic
  const captureSnapshot = useCallback(async () => {
    if (deviceType !== 'kiosk') return undefined;

    if (videoRef.current) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const base64Data = canvas.toDataURL('image/jpeg', 0.5); 
                return base64Data;
            }
        } catch (e) {
            console.warn("Snapshot failed", e);
        }
    }
    return undefined;
  }, [deviceType]);

  useEffect(() => {
    if (deviceType === 'kiosk' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => console.warn("Camera access denied or missing", err));
    }
  }, [deviceType]);

  // Network & Time
  useEffect(() => {
    window.addEventListener('touchstart', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);
    
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    resetIdleTimer();
    
    // Initial Real Cloud Check
    checkCloudConnection().then(setIsCloudConnected);
    const cloudInterval = setInterval(() => {
        checkCloudConnection().then(setIsCloudConnected);
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('touchstart', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      clearInterval(clockInterval);
      clearInterval(cloudInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!kioskId) {
      provisionKioskId().then(id => setKioskId(id));
    }
  }, [kioskId]);

  useEffect(() => {
    if (isSetup) {
      const performHeartbeat = async () => {
         sendHeartbeat();
      };
      performHeartbeat();
      const interval = setInterval(performHeartbeat, 60000);
      return () => clearInterval(interval);
    }
  }, [isSetup]);

  useEffect(() => {
     if (isSetup && storeData?.fleet && kioskId) {
         const myRegistry = storeData.fleet.find(k => k.id === kioskId);
         if (myRegistry) {
             if (myRegistry.requestSnapshot && deviceType === 'kiosk') {
                 console.log("Admin requested snapshot. Capturing...");
                 captureSnapshot().then(snap => {
                     if (snap) {
                         sendHeartbeat(snap);
                     }
                 });
             }
             if (myRegistry.restartRequested) {
                 console.log("Admin requested REBOOT. Restarting system...");
                 if(supabase) {
                    supabase.from('store_config').select('data').eq('id', 1).single().then(({data}: any) => {
                         if(data && data.data) {
                             const fleet = data.data.fleet.map((k: any) => k.id === kioskId ? { ...k, restartRequested: false } : k);
                             supabase.from('store_config').update({ data: { ...data.data, fleet } }).eq('id', 1).then(() => {
                                 window.location.reload();
                             });
                         }
                    });
                 } else {
                     window.location.reload();
                 }
             }
         }
     }
  }, [storeData, isSetup, kioskId, captureSnapshot, deviceType]);

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

  // Filter Expired Content
  const filteredCatalogs = useMemo(() => {
      if(!storeData?.catalogues) return [];
      const now = new Date();
      return storeData.catalogues.filter(c => !c.endDate || new Date(c.endDate) >= now);
  }, [storeData?.catalogues]);

  // MEMOIZED TO PREVENT SCREENSAVER RE-RENDERS
  const allProducts = useMemo(() => {
      if (!storeData) return [];
      return storeData.brands.flatMap(b => 
        b.categories.flatMap(c => 
          c.products.map(p => ({...p, brandName: b.name, categoryName: c.name} as FlatProduct))
        )
      );
  }, [storeData]);

  const handleSetupComplete = (name: string, type: 'kiosk' | 'mobile') => {
    completeKioskSetup(name, type).then(() => {
        setDeviceTypeState(type);
        setIsSetup(true);
    });
  };

  const handleRestore = (id: string) => {
    setCustomKioskId(id);
    setKioskId(id);
    setDeviceTypeState(getDeviceType());
    setIsSetup(true);
  };

  const handleViewCatalog = (pages: string[], title?: string, startDate?: string, endDate?: string) => {
    setFlipbookPages(pages);
    setFlipbookTitle(title);
    setFlipbookStartDate(startDate);
    setFlipbookEndDate(endDate);
    setShowFlipbook(true);
  };
  
  if (!isSetup && kioskId) {
    return <SetupScreen kioskId={kioskId} onComplete={handleSetupComplete} onRestoreId={handleRestore} />;
  }
  
  if (!storeData) return null;

  return (
    <div className="h-[100dvh] w-full relative bg-slate-100 overflow-hidden flex flex-col">
       <video ref={videoRef} autoPlay playsInline muted className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" />

       {isIdle && screensaverEnabled && deviceType === 'kiosk' && (
         <Screensaver 
           products={allProducts} 
           ads={storeData.ads?.screensaver || []} 
           pamphlets={filteredCatalogs}
           onWake={resetIdleTimer}
           settings={storeData.screensaverSettings}
         />
       )}

       {/* --- NEW SYSTEM HEADER BAR --- */}
       <header className="shrink-0 h-10 bg-slate-900 text-white flex items-center justify-between px-4 z-50 border-b border-slate-800 shadow-md">
           <div className="flex items-center gap-4">
               {storeData.companyLogoUrl ? (
                   <img src={storeData.companyLogoUrl} className="h-6 object-contain opacity-80" alt="Logo" />
               ) : (
                   <Store size={16} className="text-blue-500" />
               )}
               <div className="h-4 w-[1px] bg-slate-700"></div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  {deviceType === 'mobile' ? <Smartphone size={12} className="text-purple-500" /> : <ShieldCheck size={12} className="text-blue-500" />}
                  <span>ID: <span className="font-mono text-white tracking-wider">{kioskId}</span></span>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <MapPin size={12} />
                  <span className="truncate max-w-[150px]">{getShopName()}</span>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full ${isCloudConnected ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-orange-900/50 text-orange-300 border border-orange-800'}`}>
                    {isCloudConnected ? <Cloud size={10} /> : <HardDrive size={10} />}
                    <span className="text-[9px] font-black uppercase">{isCloudConnected ? 'Cloud' : 'Local'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-xs font-mono font-bold">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
           </div>
       </header>

       <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-hidden relative">
             {!activeBrand ? (
               <BrandGrid 
                 brands={storeData.brands} 
                 heroConfig={storeData.hero}
                 allCatalogs={filteredCatalogs} 
                 ads={storeData.ads}
                 onSelectBrand={setActiveBrand}
                 onViewGlobalCatalog={handleViewCatalog} 
                 onExport={() => {}} 
                 screensaverEnabled={screensaverEnabled}
                 onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
               />
             ) : !activeCategory ? (
               <CategoryGrid 
                 brand={activeBrand} 
                 storeCatalogs={filteredCatalogs}
                 onSelectCategory={setActiveCategory}
                 onViewCatalog={handleViewCatalog} 
                 onBack={() => setActiveBrand(null)} 
                 screensaverEnabled={screensaverEnabled}
                 onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
               />
             ) : !activeProduct ? (
               <ProductList 
                 category={activeCategory} 
                 brand={activeBrand}
                 storeCatalogs={filteredCatalogs}
                 onSelectProduct={setActiveProduct} 
                 onBack={() => setActiveCategory(null)}
                 onViewCatalog={handleViewCatalog} 
                 screensaverEnabled={screensaverEnabled}
                 onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
               />
             ) : (
               <ProductDetail 
                 product={activeProduct} 
                 onBack={() => setActiveProduct(null)} 
                 screensaverEnabled={screensaverEnabled}
                 onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
               />
             )}
          </div>
       </div>

       <footer className="shrink-0 bg-white border-t border-slate-200 text-slate-500 h-8 flex items-center justify-between px-6 z-50 text-[10px]">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <span className="font-bold uppercase tracking-wider">
                    {isOnline ? 'Network Online' : 'Network Offline'}
                 </span>
              </div>
          </div>

          <div className="flex items-center gap-6">
              {lastSyncTime && (
                  <div className="flex items-center gap-1.5 font-bold">
                      <RefreshCw size={10} />
                      <span>Last Sync: {lastSyncTime}</span>
                  </div>
              )}
              <button 
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-2 font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
                aria-label="Powered by JSTYP"
              >
                 <span>Powered by JSTYP</span>
                 <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" className="w-3 h-3 object-contain opacity-50" alt="" />
              </button>
          </div>
       </footer>

       <CreatorPopup isOpen={showCreator} onClose={() => setShowCreator(false)} />

       {showFlipbook && (
         <Flipbook 
           pages={flipbookPages} 
           onClose={() => setShowFlipbook(false)} 
           catalogueTitle={flipbookTitle}
           startDate={flipbookStartDate}
           endDate={flipbookEndDate}
         />
       )}
    </div>
  );
};