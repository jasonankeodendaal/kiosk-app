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
        <Loader2 className="animate-spin mb-4" size={48} />
        <div className="text-xl font-bold tracking-widest uppercase">System Boot</div>
      </div>
    );
  }

  // --- ROUTE: ADMIN HUB ---
  // Access via /admin
  if (currentRoute === '/admin') {
    return (
      <AdminDashboard 
        onExit={() => handleNavigate('/')} 
        storeData={storeData}
        onUpdateData={handleUpdateData}
      />
    );
  }

  // --- ROUTE: KIOSK FRONT PAGE ---
  // Access via /
  return (
    <KioskApp 
      storeData={storeData}
      onGoToAdmin={() => handleNavigate('/admin')}
    />
  );
}