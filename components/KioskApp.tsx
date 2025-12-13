




import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StoreData, Brand, Category, Product, FlatProduct, Catalogue, Pricelist, PricelistBrand } from '../types';
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
  checkCloudConnection,
  initSupabase,
  getCloudProjectName
} from '../services/kioskService';
import BrandGrid from './BrandGrid';
import CategoryGrid from './CategoryGrid';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Screensaver from './Screensaver';
import Flipbook from './Flipbook';
import PdfViewer from './PdfViewer';
import TVMode from './TVMode';
import { Store, RotateCcw, X, Loader2, Wifi, WifiOff, Clock, MapPin, ShieldCheck, MonitorPlay, MonitorStop, Tablet, Smartphone, Check, Cloud, HardDrive, RefreshCw, ZoomIn, ZoomOut, Tv, FileText, Monitor } from 'lucide-react';

const DEFAULT_IDLE_TIMEOUT = 60000;

// Helper to determine if item is "New" (< 7 days old)
const isNew = (dateString?: string) => {
    if (!dateString) return false;
    const addedDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - addedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 7;
};

// Custom R Icon for Pricelists
const RIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 5v14" />
    <path d="M7 5h5.5a4.5 4.5 0 0 1 0 9H7" />
    <path d="M11.5 14L17 19" />
  </svg>
);

export const CreatorPopup = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <div 
    className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`} 
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
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <div className="w-32 h-32 mb-2 hover:scale-105 transition-transform duration-500">
           <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        
        <h2 id="creator-popup-title" className="text-white font-black text-3xl mb-1 drop-shadow-lg tracking-tight">JSTYP.me</h2>
        <p className="text-white/90 text-sm font-bold mb-4 drop-shadow-md italic max-w-[90%]">"Jason's Solution To Your Problems, Yes me!"</p>
        
        <p className="text-white text-xs font-bold mb-8 drop-shadow-md text-center px-4 leading-relaxed uppercase tracking-wide bg-black/40 rounded-lg py-2 border border-white/10">
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

      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/40 p-1 rounded-full transition-colors" aria-label="Close creator information">
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
  onComplete: (name: string, type: 'kiosk' | 'mobile' | 'tv') => void,
  onRestoreId: (id: string) => void
}) => {
  const [shopName, setShopName] = useState('');
  const [deviceType, setDeviceType] = useState<'kiosk' | 'mobile' | 'tv'>('kiosk');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [customId, setCustomId] = useState('');

  // Allow landscape during setup for easier typing/TV setup
  useEffect(() => {
    document.body.classList.add('allow-landscape');
    return () => document.body.classList.remove('allow-landscape');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    
    setIsSubmitting(true);

    if(isRestoreMode && customId.trim()) {
       onRestoreId(customId.trim());
    }
    
    await new Promise(r => setTimeout(r, 800));
    onComplete(shopName, deviceType);
    setIsSubmitting(false);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl p-10 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-yellow-400"></div>
        <div className="mb-8 text-center">
           <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600"><Store size={32} /></div>
           <h1 className="text-3xl font-black text-slate-900 mb-2">Device Setup</h1>
           <p className="text-slate-500">Initialize this device for your location.</p>
        </div>
        <form onSubmit={handleSubmit}>
          
          {/* Device Type Selection */}
          <div className="mb-6 grid grid-cols-3 gap-2">
             <button
                type="button" 
                onClick={() => setDeviceType('kiosk')}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deviceType === 'kiosk' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
             >
                 <Tablet size={24} />
                 <span className="text-[10px] font-black uppercase tracking-wider">Kiosk</span>
                 {deviceType === 'kiosk' && <div className="absolute top-2 right-2 text-blue-500"><Check size={12} /></div>}
             </button>

             <button 
                type="button"
                onClick={() => setDeviceType('mobile')}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deviceType === 'mobile' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
             >
                 <Smartphone size={24} />
                 <span className="text-[10px] font-black uppercase tracking-wider">Mobile</span>
                 {deviceType === 'mobile' && <div className="absolute top-2 right-2 text-purple-500"><Check size={12} /></div>}
             </button>

             <button 
                type="button"
                onClick={() => setDeviceType('tv')}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${deviceType === 'tv' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-500'}`}
             >
                 <Tv size={24} />
                 <span className="text-[10px] font-black uppercase tracking-wider">TV Mode</span>
                 {deviceType === 'tv' && <div className="absolute top-2 right-2 text-indigo-500"><Check size={12} /></div>}
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

export const KioskApp = ({ storeData, lastSyncTime }: { storeData: StoreData | null, lastSyncTime?: string }) => {
  const [isSetup, setIsSetup] = useState(isKioskConfigured());
  const [kioskId, setKioskId] = useState(getKioskId());
  const [deviceType, setDeviceTypeState] = useState(getDeviceType());
  const [currentShopName, setCurrentShopName] = useState(getShopName());
  
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  const [isIdle, setIsIdle] = useState(false);
  const [screensaverEnabled, setScreensaverEnabled] = useState(true);

  const [showCreator, setShowCreator] = useState(false);
  const [showPricelistModal, setShowPricelistModal] = useState(false);
  
  // Viewer State (PDF or Flipbook)
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [flipbookPages, setFlipbookPages] = useState<string[]>([]);
  const [flipbookTitle, setFlipbookTitle] = useState<string | undefined>(undefined); 
  const [flipbookStartDate, setFlipbookStartDate] = useState<string | undefined>(undefined);
  const [flipbookEndDate, setFlipbookEndDate] = useState<string | undefined>(undefined);
  
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  
  // ZOOM CONTROL
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedBrandForPricelist, setSelectedBrandForPricelist] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const idleTimeout = (storeData?.screensaverSettings?.idleTimeout || 60) * 1000;

  // TV Mode Landscape Support
  useEffect(() => {
    if (deviceType === 'tv') {
      document.body.classList.add('allow-landscape');
    } else {
      document.body.classList.remove('allow-landscape');
    }
    return () => document.body.classList.remove('allow-landscape');
  }, [deviceType]);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Only set idle timer if screensaver is enabled AND device is a Kiosk AND Setup is complete
    if (screensaverEnabled && deviceType === 'kiosk' && isSetup) {
      timerRef.current = window.setTimeout(() => {
        setIsIdle(true);
        setActiveProduct(null);
        setActiveCategory(null);
        setActiveBrand(null);
        setShowFlipbook(false);
        setViewingPdf(null);
        setShowCreator(false);
        setShowPricelistModal(false);
      }, idleTimeout);
    }
  }, [screensaverEnabled, idleTimeout, deviceType, isSetup]);

  // --- REALTIME SUBSCRIPTION FOR COMMANDS (Restart & Delete) ---
  useEffect(() => {
      if (!isSetup || !kioskId) return;

      initSupabase();
      if (!supabase) return;

      console.log(`Subscribing to commands for ${kioskId}...`);
      
      const channel = supabase.channel(`kiosk_commands_${kioskId}`)
          .on(
              'postgres_changes',
              { 
                  event: '*', // Listen to All Events (UPDATE, DELETE)
                  schema: 'public', 
                  table: 'kiosks', 
                  filter: `id=eq.${kioskId}` 
              },
              async (payload: any) => {
                  console.log("Command Received:", payload);
                  
                  // 1. DELETE Command (Reset Device)
                  if (payload.eventType === 'DELETE') {
                      console.log("Device deleted from Fleet. Resetting...");
                      localStorage.removeItem('kiosk_pro_device_id');
                      localStorage.removeItem('kiosk_pro_shop_name');
                      localStorage.removeItem('kiosk_pro_device_type');
                      window.location.reload(); // Will reload into Setup Screen
                      return;
                  }

                  // 2. UPDATE Commands
                  if (payload.eventType === 'UPDATE') {
                      const newData = payload.new;

                      // Restart Command
                      if (newData.restart_requested) {
                          console.log("Restart requested. Reloading...");
                          await supabase.from('kiosks').update({ restart_requested: false }).eq('id', kioskId);
                          window.location.reload();
                      }
                      
                      // Live Type Update
                      if (newData.device_type && newData.device_type !== deviceType) {
                          localStorage.setItem('kiosk_pro_device_type', newData.device_type);
                          setDeviceTypeState(newData.device_type);
                      }
                  }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [isSetup, kioskId, deviceType]);


  // Network & Time & Heartbeat Loop
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
    
    checkCloudConnection().then(setIsCloudConnected);
    const cloudInterval = setInterval(() => {
        checkCloudConnection().then(setIsCloudConnected);
    }, 60000);

    if (isSetup) {
      const performHeartbeat = async () => {
         const syncResult = await sendHeartbeat();
         
         // --- SYNC CONFIGURATION ---
         if (syncResult) {
             if (syncResult.restart) window.location.reload();
             
             // Update Local State if config changed remotely
             if (syncResult.deviceType && syncResult.deviceType !== deviceType) {
                 console.log("Applying Remote Type Change:", syncResult.deviceType);
                 setDeviceTypeState(syncResult.deviceType as any);
             }
             if (syncResult.name && syncResult.name !== currentShopName) {
                 console.log("Applying Remote Name Change:", syncResult.name);
                 setCurrentShopName(syncResult.name);
             }
         }
      };
      
      performHeartbeat();
      const interval = setInterval(performHeartbeat, 60000);
      return () => {
          clearInterval(interval);
          window.removeEventListener('touchstart', resetIdleTimer);
          window.removeEventListener('click', resetIdleTimer);
          window.removeEventListener('scroll', resetIdleTimer);
          window.removeEventListener('online', onlineHandler);
          window.removeEventListener('offline', offlineHandler);
          clearInterval(clockInterval);
          clearInterval(cloudInterval);
          if (timerRef.current) clearTimeout(timerRef.current);
      }
    }

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
  }, [resetIdleTimer, isSetup, kioskId, deviceType, currentShopName]); 

  useEffect(() => {
    if (!kioskId) {
      provisionKioskId().then(id => setKioskId(id));
    }
  }, [kioskId]);

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
      if(!storeData?.catalogues || !Array.isArray(storeData.catalogues)) return [];
      const now = new Date();
      return storeData.catalogues.filter(c => !c.endDate || new Date(c.endDate) >= now);
  }, [storeData?.catalogues]);

  // MEMOIZED TO PREVENT SCREENSAVER RE-RENDERS
  const allProducts = useMemo(() => {
      if (!storeData || !Array.isArray(storeData.brands)) return [];
      return storeData.brands.flatMap(b => 
        (b.categories || []).flatMap(c => 
          (c.products || []).map(p => ({...p, brandName: b.name, categoryName: c.name} as FlatProduct))
        )
      );
  }, [storeData]);
  
  // UPDATED: Use Independent Pricelist Brands, automatically sorted alphabetically
  const pricelistBrands = useMemo(() => {
      if (storeData?.pricelistBrands && storeData.pricelistBrands.length > 0) {
          // SORT: Alphabetical A-Z
          return [...storeData.pricelistBrands].sort((a, b) => a.name.localeCompare(b.name));
      }
      return [];
  }, [storeData]);

  const handleSetupComplete = (name: string, type: 'kiosk' | 'mobile' | 'tv') => {
    completeKioskSetup(name, type).then(() => {
        setDeviceTypeState(type);
        setCurrentShopName(name);
        setIsSetup(true);
    });
  };

  const handleRestore = (id: string) => {
    setCustomKioskId(id);
    setKioskId(id);
    setDeviceTypeState(getDeviceType());
    setCurrentShopName(getShopName());
    setIsSetup(true);
  };

  const handleViewCatalog = (catalogue: Catalogue) => {
      if (catalogue.pdfUrl) {
          setViewingPdf({ url: catalogue.pdfUrl, title: catalogue.title });
      } else if (catalogue.pages && catalogue.pages.length > 0) {
          setFlipbookPages(catalogue.pages);
          setFlipbookTitle(catalogue.title);
          setFlipbookStartDate(catalogue.startDate);
          setFlipbookEndDate(catalogue.endDate);
          setShowFlipbook(true);
      }
  };
  
  if (!isSetup && kioskId) {
    return <SetupScreen kioskId={kioskId} onComplete={handleSetupComplete} onRestoreId={handleRestore} />;
  }
  
  if (!storeData) return null;

  // TV Mode Route
  if (deviceType === 'tv') {
      return (
          <TVMode 
             storeData={storeData} 
             onRefresh={() => window.location.reload()} 
             screensaverEnabled={screensaverEnabled}
             onToggleScreensaver={() => setScreensaverEnabled(!screensaverEnabled)}
          />
      );
  }

  // --- RENDER MAIN KIOSK ---
  return (
    <div className="relative bg-slate-100 overflow-hidden flex flex-col h-[100dvh] w-full">

       {isIdle && screensaverEnabled && deviceType === 'kiosk' && (
         <Screensaver 
           products={allProducts} 
           ads={storeData.ads?.screensaver || []} 
           pamphlets={filteredCatalogs} 
           onWake={resetIdleTimer}
           settings={storeData.screensaverSettings}
         />
       )}

       {/* --- HEADER BAR (Optimized for Mobile) --- */}
       <header className="shrink-0 h-10 bg-slate-900 text-white flex items-center justify-between px-2 md:px-4 z-50 border-b border-slate-800 shadow-md">
           <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
               {storeData.companyLogoUrl ? (
                   <img src={storeData.companyLogoUrl} className="h-4 md:h-6 object-contain opacity-80" alt="Logo" />
               ) : (
                   <Store size={16} className="text-blue-500" />
               )}
               <div className="h-4 w-[1px] bg-slate-700 hidden md:block"></div>
               
               {/* Device Info - Compact on Mobile */}
               <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-bold text-slate-300">
                  {deviceType === 'mobile' ? <Smartphone size={10} className="text-purple-500 md:w-3 md:h-3" /> : <ShieldCheck size={10} className="text-blue-500 md:w-3 md:h-3" />}
                  <span className="font-mono text-white tracking-wider truncate max-w-[60px] md:max-w-none">{kioskId}</span>
               </div>
               
               {/* Hide Shop Name on Small Screens */}
               <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <MapPin size={12} />
                  <span className="truncate max-w-[150px]">{currentShopName}</span>
               </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
                {/* Connection Status - Compact with Cloud Name */}
                <div className={`flex items-center gap-1 md:gap-2 px-1.5 md:px-2 py-0.5 rounded-full ${isCloudConnected ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-orange-900/50 text-orange-300 border border-orange-800'}`}>
                    {isCloudConnected ? <Cloud size={8} className="md:w-[10px] md:h-[10px]" /> : <HardDrive size={8} className="md:w-[10px] md:h-[10px]" />}
                    <span className="text-[7px] md:text-[9px] font-black uppercase hidden sm:inline">
                        {isCloudConnected ? getCloudProjectName() : 'Local Mode'}
                    </span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-700 pl-2 md:pl-4">
                    {/* SCREEN SAVER TOGGLE - HIDDEN ON MOBILE DEVICES */}
                    {deviceType === 'kiosk' && (
                        <button 
                           onClick={() => setScreensaverEnabled(!screensaverEnabled)} 
                           className={`p-1 rounded ${screensaverEnabled ? 'text-green-400 bg-green-900/30' : 'text-slate-500 bg-slate-800'}`}
                           title={screensaverEnabled ? "Screensaver On" : "Screensaver Off"}
                        >
                           {screensaverEnabled ? <MonitorPlay size={12} className="md:w-3.5 md:h-3.5" /> : <MonitorStop size={12} className="md:w-3.5 md:h-3.5" />}
                        </button>
                    )}
                    
                    {/* ZOOM CONTROL - Hidden on very small screens to save space, or just icon */}
                    <button 
                       onClick={() => setZoomLevel(zoomLevel === 1 ? 0.75 : 1)}
                       className={`p-1 rounded flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase w-6 md:w-12 justify-center transition-colors ${zoomLevel === 1 ? 'text-blue-400 bg-blue-900/30' : 'text-purple-400 bg-purple-900/30'}`}
                       title="Toggle UI Zoom"
                    >
                       {zoomLevel === 1 ? <ZoomIn size={12} className="md:w-3.5 md:h-3.5" /> : <ZoomOut size={12} className="md:w-3.5 md:h-3.5" />}
                       <span className="hidden md:inline">{Math.round(zoomLevel * 100)}%</span>
                    </button>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-xs font-mono font-bold">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
           </div>
       </header>

       {/* MAIN CONTENT WRAPPER WITH ZOOM APPLIED HERE ONLY */}
       {/* Ensure overflow is handled on the flex container, and zoom is applied to the content inside */}
       <div className="flex-1 relative flex flex-col min-h-0" style={{ zoom: zoomLevel }}>
         {!activeBrand ? (
           <BrandGrid 
             brands={storeData.brands || []} 
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
             pricelists={storeData.pricelists || []}
             onSelectCategory={setActiveCategory}
             onViewCatalog={handleViewCatalog} 
             onBack={() => setActiveBrand(null)} 
             screensaverEnabled={screensaverEnabled}
             onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
             showScreensaverButton={deviceType === 'kiosk'}
           />
         ) : !activeProduct ? (
           <ProductList 
             category={activeCategory} 
             brand={activeBrand}
             storeCatalogs={filteredCatalogs}
             onSelectProduct={setActiveProduct} 
             onBack={() => setActiveCategory(null)}
             onViewCatalog={(pages) => {}} // Unused in ProductList, kept for compatibility
             screensaverEnabled={screensaverEnabled}
             onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
             showScreensaverButton={deviceType === 'kiosk'}
           />
         ) : (
           <ProductDetail 
             product={activeProduct} 
             onBack={() => setActiveProduct(null)} 
             screensaverEnabled={screensaverEnabled}
             onToggleScreensaver={() => setScreensaverEnabled(prev => !prev)}
             showScreensaverButton={deviceType === 'kiosk'}
           />
         )}
       </div>

       {/* Footer remains outside the zoomed container */}
       <footer className="shrink-0 bg-white border-t border-slate-200 text-slate-500 h-8 flex items-center justify-between px-2 md:px-6 z-50 text-[8px] md:text-[10px]">
          <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-1.5">
                 <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${isOnline ? 'bg-green-50' : 'bg-red-50'}`}></div>
                 <span className="font-bold uppercase tracking-wider">
                    {isOnline ? 'Online' : 'Offline'}
                 </span>
              </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
              {/* NEW PRICELIST BUTTON */}
              {pricelistBrands.length > 0 && (
                  <button 
                     onClick={() => {
                        setSelectedBrandForPricelist(null);
                        setShowPricelistModal(true);
                     }}
                     className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors"
                     title="View Pricelists"
                  >
                     <RIcon size={12} className="md:w-3.5 md:h-3.5" />
                  </button>
              )}

              {lastSyncTime && (
                  <div className="flex items-center gap-1 md:gap-1.5 font-bold">
                      <RefreshCw size={8} className="md:w-[10px] md:h-[10px]" />
                      <span>Sync: {lastSyncTime}</span>
                  </div>
              )}
              <button 
                onClick={() => setShowCreator(true)}
                className="flex items-center gap-1 md:gap-2 font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
                aria-label="Powered by JSTYP"
              >
                 <span className="hidden md:inline">Powered by</span>
                 <span>JSTYP</span>
                 <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" className="w-2 md:w-3 h-2 md:h-3 object-contain opacity-50" alt="" />
              </button>
          </div>
       </footer>

       <CreatorPopup isOpen={showCreator} onClose={() => setShowCreator(false)} />

       {showPricelistModal && (
           <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-12 animate-fade-in" onClick={() => setShowPricelistModal(false)}>
               <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                   <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                       <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                           <RIcon size={28} className="text-green-600" /> Official Pricelists
                       </h2>
                       <button onClick={() => setShowPricelistModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-500" /></button>
                   </div>
                   
                   <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                       {/* Left Sidebar: Brands List */}
                       <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 overflow-y-auto max-h-[25vh] md:max-h-full grid grid-cols-3 md:flex md:flex-col p-1 md:p-0 gap-1 md:gap-0">
                           {pricelistBrands.map(brand => {
                               const hasNewLists = storeData.pricelists?.some(p => p.brandId === brand.id && isNew(p.dateAdded));
                               return (
                               <button 
                                   key={brand.id} 
                                   onClick={() => setSelectedBrandForPricelist(brand.id)}
                                   className={`w-full text-left md:p-4 p-2 transition-colors flex flex-col md:flex-row items-center justify-center md:justify-between group gap-2 md:gap-3 rounded-lg md:rounded-none border md:border-0 md:border-b border-slate-100 relative ${selectedBrandForPricelist === brand.id ? 'bg-white border-green-500 ring-2 ring-green-500 md:ring-0 md:border-l-4 md:border-l-green-500 shadow-sm md:shadow-none' : 'hover:bg-white bg-white/50 md:bg-transparent'}`}
                               >
                                   <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                                       <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 relative">
                                            {brand.logoUrl ? <img src={brand.logoUrl} className="w-full h-full object-contain" /> : <span className="font-black text-slate-300">{brand.name.charAt(0)}</span>}
                                            {hasNewLists && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] font-bold px-1 rounded-full animate-bounce">NEW</div>}
                                       </div>
                                       <span className={`font-bold text-[8px] md:text-sm uppercase text-center md:text-left leading-tight line-clamp-2 md:line-clamp-1 ${selectedBrandForPricelist === brand.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{brand.name}</span>
                                   </div>
                                   {selectedBrandForPricelist === brand.id && <div className="hidden md:block w-2 h-2 rounded-full bg-green-500"></div>}
                               </button>
                           )})}
                       </div>
                       
                       {/* Right Content: Pricelist Grid */}
                       <div className="flex-1 overflow-y-auto p-2 md:p-8 bg-slate-100/50">
                           {selectedBrandForPricelist ? (
                               <div className="grid grid-cols-3 gap-2 md:gap-4">
                                   {storeData.pricelists?.filter(p => p.brandId === selectedBrandForPricelist)
                                   .sort((a, b) => {
                                        // SORT: Date Descending (Closest date first)
                                        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                                        const yearA = parseInt(a.year) || 0;
                                        const yearB = parseInt(b.year) || 0;
                                        if (yearA !== yearB) return yearB - yearA;
                                        return months.indexOf(b.month) - months.indexOf(a.month);
                                   })
                                   .map(pl => (
                                       <button 
                                          key={pl.id}
                                          onClick={() => setViewingPdf({ url: pl.url, title: pl.title })}
                                          className="bg-white rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-200 hover:border-green-400 transition-all group text-left flex flex-col h-full relative"
                                       >
                                           <div className="aspect-[3/4] bg-white relative overflow-hidden border-b border-slate-100 p-2">
                                               {pl.thumbnailUrl ? (
                                                   <img src={pl.thumbnailUrl} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" alt={pl.title} />
                                               ) : (
                                                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                                       <FileText size={24} className="md:w-8 md:h-8" />
                                                       <span className="text-[8px] md:text-[10px] font-bold uppercase">PDF Doc</span>
                                                   </div>
                                               )}
                                               <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white text-[6px] md:text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">PDF</div>
                                               {isNew(pl.dateAdded) && <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-blue-600 text-white text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider animate-pulse">NEW</div>}
                                           </div>
                                           <div className="p-2 md:p-4 flex flex-col flex-1">
                                               {/* UPDATED: Name wraps and fits container */}
                                               <h3 className="font-bold text-slate-900 text-[9px] md:text-sm uppercase mb-1 leading-tight whitespace-normal break-words">{pl.title}</h3>
                                               <div className="mt-auto pt-1 md:pt-2 flex flex-col md:flex-row md:items-center justify-between text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">
                                                   <span>{pl.month} {pl.year}</span>
                                                   <span className="text-green-600 group-hover:underline hidden md:inline">View</span>
                                               </div>
                                           </div>
                                       </button>
                                   ))}
                               </div>
                           ) : (
                               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                   <RIcon size={48} className="mb-4 opacity-20 md:w-16 md:h-16" />
                                   <p className="uppercase font-bold text-xs tracking-widest text-center">Select a brand to view pricelists</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           </div>
       )}

       {showFlipbook && (
         <Flipbook 
           pages={flipbookPages} 
           onClose={() => setShowFlipbook(false)} 
           catalogueTitle={flipbookTitle}
           startDate={flipbookStartDate}
           endDate={flipbookEndDate}
         />
       )}
       
       {viewingPdf && (
           <PdfViewer 
               url={viewingPdf.url} 
               title={viewingPdf.title} 
               onClose={() => setViewingPdf(null)} 
           />
       )}
    </div>
  );
};