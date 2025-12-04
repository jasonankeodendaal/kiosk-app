
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
import { Loader2, Home, ChevronRight, Store, MonitorPlay, MonitorOff, RotateCcw, X, Info, Check } from 'lucide-react';
import Peer from 'peerjs';

const IDLE_TIMEOUT = 60000;
const HEARTBEAT_INTERVAL = 60000;

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
        <div className="w-32 h-32 mb-2 hover:scale-105 transition-transform duration-500">
           <img src="https://i.ibb.co/ZR8bZRSp/JSTYP-me-Logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
        <h2 className="text-white font-black text-3xl mb-1 drop-shadow-lg tracking-tight">JSTYP.me</h2>
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
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-20 bg-black/20 p-1 rounded-full backdrop-blur-sm transition-colors">
         <X size={20} />
      </button>
    </div>
  </div>
);

export const SetupScreen = ({ kioskId, onComplete, onRestoreId }: { kioskId: string, onComplete: (name: string) => void, onRestoreId: (id: string) => void }) => {
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [customId, setCustomId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    if(isRestoreMode && customId.trim()) {
       onRestoreId(customId.trim());
       await new Promise(r => setTimeout(r, 800));
       onComplete(shopName);
    } else if (!isRestoreMode) {
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 800));
      onComplete(shopName);
      setIsSubmitting(false);
    }
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
          <div className="mb-6"><label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Shop / Location Name</label><input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Downtown Mall - Entrance 1" className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none text-lg shadow-inner font-medium" required /></div>
          <button type="submit" disabled={isSubmitting || (isRestoreMode && !customId.trim()) || !shopName.trim()} className="w-full p-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-wide shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
            {isSubmitting ? 'Initializing...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const KioskApp = ({ storeData, onGoToAdmin }: { storeData: StoreData | null; onGoToAdmin: () => void }) => {
  const [currentView, setCurrentView] = useState<'brands' | 'categories' | 'products' | 'detail'>('brands');
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [idleTimeout, setIdleTimeout] = useState<number | null>(null);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [showCreatorPopup, setShowCreatorPopup] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const [isKioskRegistered, setIsKioskRegistered] = useState(false);
  const [kioskIdState, setKioskIdState] = useState<string | null>(null);
  const [shopNameState, setShopNameState] = useState<string | null>(null);
  const peerRef = useRef<Peer | null>(null);

  const [currentFlipbookPages, setCurrentFlipbookPages] = useState<string[] | null>(null);

  const allProducts = useMemo(() => {
    const products: FlatProduct[] = [];
    storeData?.brands.forEach(brand => {
      brand.categories.forEach(category => {
        category.products.forEach(product => {
          products.push({ ...product, brandName: brand.name, categoryName: category.name });
        });
      });
    });
    return products;
  }, [storeData]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimeout) clearTimeout(idleTimeout);
    setShowScreensaver(false);
    setIdleTimeout(window.setTimeout(() => setShowScreensaver(true), IDLE_TIMEOUT));
  }, [idleTimeout]);

  useEffect(() => {
    document.addEventListener('mousemove', resetIdleTimer);
    document.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('touchstart', resetIdleTimer);
    resetIdleTimer();

    return () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      document.removeEventListener('mousemove', resetIdleTimer);
      document.removeEventListener('keydown', resetIdleTimer);
      document.removeEventListener('touchstart', resetIdleTimer);
    };
  }, [resetIdleTimer, idleTimeout]);

  useEffect(() => {
    const checkRegistration = async () => {
      initSupabase();
      const configured = isKioskConfigured();
      setIsKioskRegistered(configured);
      if (configured) {
        setKioskIdState(getKioskId());
        setShopNameState(getShopName());
        sendHeartbeat();
      } else {
        const newKioskId = await provisionKioskId();
        setKioskIdState(newKioskId);
      }
    };
    checkRegistration();
    const heartbeatInterval = setInterval(() => { if (isKioskConfigured()) sendHeartbeat(); }, HEARTBEAT_INTERVAL);
    return () => clearInterval(heartbeatInterval);
  }, []);

  useEffect(() => {
    if (!isKioskRegistered || !kioskIdState || peerRef.current) return;
    try {
      const peerId = `kiosk-pro-${kioskIdState.replace(/[^a-zA-Z0-9-_]/g, '')}`;
      const peer = new Peer(peerId, { debug: 1 });
      peer.on('call', (call) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            call.answer(stream);
            call.on('close', () => stream.getTracks().forEach(track => track.stop()));
          })
          .catch(console.error);
      });
      peerRef.current = peer;
    } catch (e) { console.warn("PeerJS failed to init", e); }
    return () => { if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; } };
  }, [isKioskRegistered, kioskIdState]);

  const handleCompleteKioskSetup = async (name: string) => {
    const success = await completeKioskSetup(name);
    if (success) { setIsKioskRegistered(true); setShopNameState(name); }
  };

  const handleBack = () => {
    if (currentView === 'detail') { setCurrentView('products'); setSelectedProduct(null); }
    else if (currentView === 'products') { setCurrentView('categories'); setActiveCategory(null); }
    else if (currentView === 'categories') { setCurrentView('brands'); setActiveBrand(null); }
    resetIdleTimer();
  };

  if (!storeData) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mb-4 text-blue-500" size={48} /><p>Loading Data...</p></div>;
  if (!isKioskRegistered && kioskIdState) return <SetupScreen kioskId={kioskIdState} onComplete={handleCompleteKioskSetup} onRestoreId={(id) => { setCustomKioskId(id); setKioskIdState(id); }} />;
  if (!kioskIdState) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" size={48} /></div>;

  const screensaverProducts = allProducts.map(p => ({ ...p }));
  const screensaverAds = storeData.ads?.screensaver || [];
  const globalCatalog = storeData.catalogues?.[0];

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          {storeData.companyLogoUrl && <img src={storeData.companyLogoUrl} alt="Logo" className="h-8 w-auto object-contain" />}
          <button onClick={() => { setCurrentView('brands'); setActiveBrand(null); }} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-bold uppercase"><Home size={18} /> Home</button>
          {activeBrand && <><ChevronRight size={16} className="text-slate-300" /><button onClick={() => { setCurrentView('categories'); setActiveCategory(null); }} className="text-slate-500 hover:text-slate-900 text-sm font-bold uppercase">{activeBrand.name}</button></>}
          {activeCategory && <><ChevronRight size={16} className="text-slate-300" /><span className="text-slate-900 text-sm font-bold uppercase">{activeCategory.name}</span></>}
        </div>
        <div className="flex items-center gap-3">
          {shopNameState && <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{shopNameState}</span>}
          <button onClick={() => setShowCreatorPopup(true)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"><Info size={16} /></button>
          <button onClick={onGoToAdmin} className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700"><MonitorPlay size={16} /></button>
          <button onClick={() => setShowSetupGuide(true)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500"><MonitorOff size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {currentView === 'brands' && <BrandGrid brands={storeData.brands} heroConfig={storeData.hero} globalCatalog={globalCatalog} ads={storeData.ads} onSelectBrand={(b) => { setActiveBrand(b); setCurrentView('categories'); }} onViewGlobalCatalog={(p) => setCurrentFlipbookPages(p)} onExport={onGoToAdmin} />}
        {currentView === 'categories' && activeBrand && <CategoryGrid brand={activeBrand} onSelectCategory={(c) => { setActiveCategory(c); setCurrentView('products'); }} onBack={handleBack} />}
        {currentView === 'products' && activeCategory && activeBrand && <ProductList category={activeCategory} brand={activeBrand} storeCatalogs={storeData.catalogues || []} onSelectProduct={(p) => { setSelectedProduct(p); setCurrentView('detail'); }} onBack={handleBack} onViewCatalog={(p) => setCurrentFlipbookPages(p)} />}
        {currentView === 'detail' && selectedProduct && <ProductDetail product={selectedProduct} onBack={handleBack} />}
      </div>
      {showScreensaver && <Screensaver products={screensaverProducts} ads={screensaverAds} onWake={() => setShowScreensaver(false)} />}
      {currentFlipbookPages && <Flipbook pages={currentFlipbookPages} onClose={() => setCurrentFlipbookPages(null)} />}
      <CreatorPopup isOpen={showCreatorPopup} onClose={() => setShowCreatorPopup(false)} />
      {showSetupGuide && <SetupGuide onClose={() => setShowSetupGuide(false)} />}
    </div>
  );
};
