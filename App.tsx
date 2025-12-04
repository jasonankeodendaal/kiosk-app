
import React, { useState, useEffect } from 'react';
import KioskApp from './components/KioskApp';
import AdminDashboard from './components/AdminDashboard';
import { generateStoreData, saveStoreData } from './services/geminiService';
import { initSupabase, supabase } from './services/kioskService';
import { StoreData } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Simple Router Logic
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // 2. Data Synchronization & Realtime
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await generateStoreData();
        // Only update if we actually got data back to prevent wiping state on error
        if (data) {
           setStoreData(data);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };

    // Initial Load
    initSupabase();
    fetchData();

    // Polling Fallback (Every 60s)
    // Ensures kiosks update even if Websocket fails or in purely local mode
    const interval = setInterval(() => {
        console.log("Auto-fetching latest data...");
        fetchData();
    }, 60000);

    // Setup Realtime Subscription
    if (supabase) {
        const channel = supabase
          .channel('public:store_config')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'store_config', filter: 'id=eq.1' },
            (payload: any) => {
              console.log("Remote update received!", payload);
              if (payload.new && payload.new.data) {
                 setIsSyncing(true);
                 setStoreData(payload.new.data);
                 // Update local cache
                 localStorage.setItem('kiosk_pro_store_data', JSON.stringify(payload.new.data));
                 setTimeout(() => setIsSyncing(false), 1000);
              }
            }
          )
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }
    
    return () => clearInterval(interval);
  }, []);

  const handleUpdateData = async (newData: StoreData) => {
    // Immediate Local Update for UI snappiness
    setStoreData(newData);
    setIsSyncing(true);
    
    try {
        // Push to Supabase
        await saveStoreData(newData);
    } catch (e) {
        console.error("Sync failed", e);
        alert("Saved locally but failed to sync to cloud. Check connection.");
    } finally {
        setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
        <div className="text-xl font-bold tracking-widest uppercase">System Boot</div>
        <div className="text-xs text-slate-500 mt-2">Initializing Modules...</div>
      </div>
    );
  }

  // Normalize route to remove trailing slash for comparison
  const normalizedRoute = currentRoute.endsWith('/') && currentRoute.length > 1 
    ? currentRoute.slice(0, -1) 
    : currentRoute;

  // --- ROUTE: ADMIN HUB ---
  if (normalizedRoute === '/admin') {
    return (
      <AdminDashboard 
        onExit={() => handleNavigate('/')} 
        storeData={storeData}
        onUpdateData={handleUpdateData}
      />
    );
  }

  // --- ROUTE: KIOSK FRONT PAGE ---
  return (
    <>
      {isSyncing && (
         <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Syncing...</span>
         </div>
      )}
      <KioskApp 
        storeData={storeData}
        onGoToAdmin={() => handleNavigate('/admin')}
      />
    </>
  );
}
