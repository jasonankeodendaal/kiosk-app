
import React, { useState, useEffect } from 'react';
import KioskApp from './components/KioskApp';
import AdminDashboard from './components/AdminDashboard';
import { generateStoreData, saveStoreData } from './services/geminiService';
import { StoreData } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Simple Router Logic
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // 2. Data Synchronization (Simulates Server Fetch)
  useEffect(() => {
    const initData = async () => {
      try {
        const data = await generateStoreData();
        setStoreData(data);
      } catch (e) {
        console.error("Failed to load data", e);
        // Fallback to empty data or continue so we don't hang on white screen
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleUpdateData = async (newData: StoreData) => {
    setStoreData(newData);
    await saveStoreData(newData);
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

  // --- ROUTE: ADMIN HUB ---
  // Access via /admin or /admin/
  if (currentRoute === '/admin' || currentRoute === '/admin/') {
    return (
      <AdminDashboard 
        onExit={() => handleNavigate('/')} 
        storeData={storeData}
        onUpdateData={handleUpdateData}
      />
    );
  }

  // --- ROUTE: KIOSK FRONT PAGE ---
  // Access via / or fallback for any other route
  return (
    <KioskApp 
      storeData={storeData}
      onGoToAdmin={() => handleNavigate('/admin')}
    />
  );
}
