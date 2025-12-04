
import React, { useState, useEffect } from 'react';
import { KioskApp } from './components/KioskApp';
import { AdminDashboard } from './components/AdminDashboard';
import { loadStoreData, saveStoreData } from './services/geminiService';
import { initSupabase, supabase } from './services/kioskService';
import { StoreData } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    initSupabase();
    
    const fetchData = async () => {
      try {
        const data = await loadStoreData();
        if (data) setStoreData(data);
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Auto-refresh fallback
    const interval = setInterval(fetchData, 60000);

    // Realtime Supabase updates
    if (supabase) {
        const channel = supabase.channel('public:store_config')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'store_config', filter: 'id=eq.1' }, 
          (payload: any) => {
              if (payload.new && payload.new.data) {
                 setIsSyncing(true);
                 setStoreData(payload.new.data);
                 localStorage.setItem('kiosk_pro_store_data', JSON.stringify(payload.new.data));
                 setTimeout(() => setIsSyncing(false), 1000);
              }
          }).subscribe();
        return () => { supabase.removeChannel(channel); clearInterval(interval); };
    }
    return () => clearInterval(interval);
  }, []);

  const handleUpdateData = async (newData: StoreData) => {
    setIsSyncing(true);
    try {
        // STRICT SYNC: We wait for cloud confirmation.
        await saveStoreData(newData);
        // Only update UI state if save succeeded.
        setStoreData(newData);
    } catch (e: any) {
        console.error("Sync failed", e);
        alert(`SYNC ERROR: ${e.message}\nChanges were NOT saved.`);
    } finally {
        setIsSyncing(false);
    }
  };

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  if (loading) return <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mb-4" size={48} /><div className="text-xl font-bold uppercase tracking-widest">Booting System...</div></div>;

  const normalizedRoute = currentRoute.endsWith('/') && currentRoute.length > 1 ? currentRoute.slice(0, -1) : currentRoute;

  if (normalizedRoute === '/admin') {
    return <AdminDashboard onExit={() => handleNavigate('/')} storeData={storeData} onUpdateData={handleUpdateData} />;
  }

  return (
    <>
      {isSyncing && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce"><Loader2 className="animate-spin" size={16} /><span className="text-xs font-bold uppercase tracking-widest">Syncing Cloud...</span></div>}
      <KioskApp storeData={storeData} onGoToAdmin={() => handleNavigate('/admin')} />
    </>
  );
}
