

import React, { useState, useEffect, useCallback } from 'react';
import { KioskApp } from './components/KioskApp';
import { AdminDashboard } from './components/AdminDashboard';
import AboutPage from './components/AboutPage';
import { generateStoreData, saveStoreData } from './services/geminiService';
import { initSupabase, supabase } from './services/kioskService';
import { StoreData } from './types';
import { Loader2, Cloud } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // 1. Simple Router Logic
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Defined outside useEffect to be reusable
  const fetchData = useCallback(async () => {
      try {
        const data = await generateStoreData();
        // Only update if we actually got data back to prevent wiping state on error
        if (data) {
           setStoreData(data);
           setLastSyncTime(new Date().toLocaleTimeString());
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
  }, []);

  // 2. Data Synchronization & Realtime
  useEffect(() => {
    // Initial Load
    initSupabase();
    fetchData();

    // Polling Fallback (Updated to 5 Minutes per request)
    const interval = setInterval(() => {
        console.log("Auto-fetching latest data (5min cycle)...");
        fetchData();
    }, 300000); // 5 minutes

    // Setup Realtime Subscription
    if (supabase) {
        const channel = supabase
          .channel('public:store_data')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'store_config', filter: 'id=eq.1' },
            (payload: any) => {
              console.log("Store Config Update received!", payload);
              // We only auto-refresh if WE didn't trigger the save (basic loop protection handled by UI state in Admin)
              // But generally, we want fresh data if someone else edits it.
              // NOTE: In Admin Dashboard, we will handle "incoming changes vs local edits" conflict visually.
              if (payload.new && payload.new.data) {
                 fetchData();
              }
            }
          )
          .on(
             'postgres_changes',
             { event: '*', schema: 'public', table: 'kiosks' },
             (payload: any) => {
                 console.log("Fleet Update received!", payload);
                 // When fleet changes (new kiosk or heartbeat), refresh data silently
                 fetchData();
             }
          )
          .subscribe((status: string) => {
             console.log("Supabase Subscription Status:", status);
          });

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateData = async (newData: StoreData) => {
    // UI Feedback
    setIsSyncing(true);
    setStoreData(newData); // Optimistic update
    
    try {
        // Strict Cloud Save
        await saveStoreData(newData);
        setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e: any) {
        console.error("Sync failed", e);
        alert(`SYNC ERROR: ${e.message || "Failed to connect to server."}`);
    } finally {
        setTimeout(() => setIsSyncing(false), 1000);
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
        storeData={storeData}
        onUpdateData={handleUpdateData}
        onRefresh={() => {
            setIsSyncing(true);
            fetchData().then(() => {
                setIsSyncing(false);
            });
        }}
      />
    );
  }

  // --- ROUTE: ABOUT PAGE ---
  if (normalizedRoute === '/about') {
    return (
        <AboutPage 
            storeData={storeData!} 
            onBack={() => {
                window.history.pushState({}, '', '/');
                setCurrentRoute('/');
            }}
        />
    );
  }

  // --- ROUTE: KIOSK FRONT PAGE ---
  return (
    <>
      {isSyncing && (
         <div className="fixed bottom-4 right-4 z-[200] bg-slate-900/90 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3 backdrop-blur-md border border-white/10 animate-fade-in transition-all">
            <Loader2 className="animate-spin text-blue-400" size={16} />
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System</span>
                <span className="text-xs font-bold">Syncing Data...</span>
            </div>
         </div>
      )}
      <KioskApp 
        storeData={storeData}
        lastSyncTime={lastSyncTime}
      />
    </>
  );
}