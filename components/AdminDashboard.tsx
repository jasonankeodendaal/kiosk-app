import React, { useState, useEffect, useMemo } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, ChevronLeft, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, FolderArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, Book, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck, Ruler, SaveAll, Pencil, Moon, Sun, MonitorSmartphone, LayoutGrid, Music, Share2, Rewind, Tv, UserCog, Key, Move, FileInput, Lock, Unlock, Calendar, Filter, Zap, Activity, Network
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData, DimensionSet, Manual, TVBrand, TVConfig, TVModel, AdminUser, AdminPermissions, Pricelist, PricelistBrand, ArchivedItem } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase, checkCloudConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Custom R Icon for Pricelists
const RIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 5v14" />
    <path d="M7 5h5.5a4.5 4.5 0 0 1 0 9H7" />
    <path d="M11.5 14L17 19" />
  </svg>
);

const CpuIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
);

const SystemDocumentation = () => {
    const [activeSection, setActiveSection] = useState('architecture');

    const sections = [
        { id: 'architecture', label: 'Core Architecture', icon: <CpuIcon /> },
        { id: 'inventory', label: 'Inventory Logic', icon: <Box size={16}/> },
        { id: 'screensaver', label: 'Screensaver Automation', icon: <Zap size={16}/> },
        { id: 'fleet', label: 'Fleet & Telemetry', icon: <Activity size={16}/> },
        { id: 'tv', label: 'TV Mode Logic', icon: <Tv size={16}/> },
    ];

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
                <div className="mb-6 px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">System Manual</h3>
                    <p className="text-[10px] text-slate-500 font-medium">v2.4 Technical Reference</p>
                </div>
                <div className="space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                                activeSection === section.id 
                                ? 'bg-blue-600 text-white shadow-md font-bold' 
                                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 font-medium'
                            }`}
                        >
                            <span className={activeSection === section.id ? 'opacity-100' : 'opacity-70'}>
                                {section.icon}
                            </span>
                            <span className="text-xs uppercase tracking-wide">{section.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
                {activeSection === 'architecture' && (
                    <div className="space-y-8 max-w-3xl">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 flex items-center gap-3">
                                <Network className="text-blue-600" size={32} /> Hybrid Cloud Architecture
                            </h2>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Kiosk Pro utilizes a <strong>"Local-First, Cloud-Sync"</strong> architecture designed for retail environments where internet stability cannot be guaranteed.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><HardDrive size={18} /> Local Storage</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Every device maintains a complete copy of the database (Products, Settings, Fleet) in its browser's IndexedDB/LocalStorage. This ensures the kiosk works <strong>instantly</strong> and <strong>offline</strong> without loading spinners.
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Cloud size={18} /> Cloud Sync</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    The system connects to Supabase (PostgreSQL). It performs a "Heartbeat" every 60 seconds to push local telemetry and pull global configuration changes. Changes made in the Admin Hub broadcast immediately via WebSockets.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- ZIP IMPORT/EXPORT UTILS ---

const getExtension = (blob: Blob, url: string): string => {
    if (blob.type === 'image/jpeg') return 'jpg';
    if (blob.type === 'image/png') return 'png';
    if (blob.type === 'image/webp') return 'webp';
    if (blob.type === 'application/pdf') return 'pdf';
    if (blob.type === 'video/mp4') return 'mp4';
    if (blob.type === 'video/webm') return 'webm';
    
    const match = url.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    return match ? match[1] : 'dat';
};

const fetchAssetAndAddToZip = async (zipFolder: JSZip | null, url: string, filenameBase: string) => {
    if (!zipFolder || !url) return;
    try {
        let blob: Blob;
        if (url.startsWith('data:')) {
            const res = await fetch(url);
            blob = await res.blob();
        } else {
            const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            blob = await response.blob();
        }
        const ext = getExtension(blob, url);
        zipFolder.file(`${filenameBase}.${ext}`, blob);
    } catch (e) {
        console.warn(`Failed to pack asset: ${url}`, e);
        zipFolder.file(`${filenameBase}_FAILED.txt`, `Could not download: ${url}`);
    }
};

const downloadZip = async (storeData: StoreData) => {
    const zip = new JSZip();
    console.log("Starting Backup Process...");

    for (const brand of storeData.brands) {
        const brandFolder = zip.folder(brand.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Brand');
        
        if (brandFolder) {
            brandFolder.file("brand.json", JSON.stringify(brand, null, 2));
            if (brand.logoUrl) {
                await fetchAssetAndAddToZip(brandFolder, brand.logoUrl, "brand_logo");
            }
        }
        
        for (const category of brand.categories) {
            const catFolder = brandFolder?.folder(category.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Category');
            
            for (const product of category.products) {
                const prodFolder = catFolder?.folder(product.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Product');
                
                if (prodFolder) {
                    const metadata = {
                        name: product.name,
                        sku: product.sku,
                        description: product.description,
                        specs: product.specs,
                        features: product.features,
                        dimensions: product.dimensions,
                        terms: product.terms,
                        boxContents: product.boxContents,
                        originalImageUrl: product.imageUrl, 
                        originalVideoUrl: product.videoUrl
                    };
                    prodFolder.file("details.json", JSON.stringify(metadata, null, 2));

                    if (product.imageUrl) {
                        await fetchAssetAndAddToZip(prodFolder, product.imageUrl, "cover");
                    }
                    if (product.galleryUrls) {
                        for (let i = 0; i < product.galleryUrls.length; i++) {
                            await fetchAssetAndAddToZip(prodFolder, product.galleryUrls[i], `gallery_${i}`);
                        }
                    }
                    const videos = [...(product.videoUrls || [])];
                    if (product.videoUrl && !videos.includes(product.videoUrl)) videos.push(product.videoUrl);
                    
                    for (let i = 0; i < videos.length; i++) {
                        await fetchAssetAndAddToZip(prodFolder, videos[i], `video_${i}`);
                    }
                    if (product.manuals) {
                         for (let i = 0; i < product.manuals.length; i++) {
                             const m = product.manuals[i];
                             if (m.pdfUrl) {
                                 const safeTitle = m.title.replace(/[^a-z0-9]/gi, '_');
                                 await fetchAssetAndAddToZip(prodFolder, m.pdfUrl, safeTitle || `manual_${i}`);
                             }
                         }
                    }
                }
            }
        }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiosk-full-backup-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const importZip = async (file: File): Promise<Brand[]> => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const newBrands: Record<string, Brand> = {};

    const getBase64 = async (zipObj: any): Promise<string> => {
        const blob = await zipObj.async("blob");
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };
    const getDir = (path: string) => path.substring(0, path.lastIndexOf('/'));
    const jsonFiles = Object.keys(loadedZip.files).filter(path => path.endsWith('.json') && !path.startsWith('__MACOSX'));

    for (const path of jsonFiles) {
        const fileObj = loadedZip.files[path];
        if (fileObj.dir) continue;

        const content = await fileObj.async("text");
        const json = JSON.parse(content);
        
        if (path.toLowerCase().endsWith('brand.json')) {
            const brandName = json.name || "Unknown Brand";
            if (!newBrands[brandName]) {
                newBrands[brandName] = {
                    id: json.id || generateId('brand'),
                    name: brandName,
                    logoUrl: json.logoUrl || '',
                    categories: []
                };
            }
        }
        
        if (path.toLowerCase().endsWith('details.json')) {
            const parts = path.split('/');
            if (parts.length >= 3) {
                const productFolder = parts[parts.length - 2];
                const categoryFolder = parts[parts.length - 3];
                const brandFolder = parts[parts.length - 4];

                if (brandFolder && categoryFolder) {
                    const brandName = brandFolder;
                    if (!newBrands[brandName]) {
                        newBrands[brandName] = {
                            id: generateId('brand'),
                            name: brandName,
                            categories: []
                        };
                    }
                    let category = newBrands[brandName].categories.find(c => c.name === categoryFolder);
                    if (!category) {
                        category = {
                            id: generateId('cat'),
                            name: categoryFolder,
                            icon: 'Box',
                            products: []
                        };
                        newBrands[brandName].categories.push(category);
                    }
                    const newProduct: Product = {
                        id: generateId('prod'),
                        name: json.name || productFolder,
                        sku: json.sku,
                        description: json.description || '',
                        specs: json.specs || {},
                        features: json.features || [],
                        dimensions: json.dimensions || [],
                        boxContents: json.boxContents || [],
                        terms: json.terms || '',
                        imageUrl: '',
                        galleryUrls: [],
                        videoUrls: [],
                        manuals: [],
                        dateAdded: new Date().toISOString()
                    };
                    category.products.push(newProduct);
                }
            }
        }
    }

    const assetFiles = Object.keys(loadedZip.files).filter(path => !path.endsWith('.json') && !path.endsWith('/') && !path.startsWith('__MACOSX') && !path.includes('.DS_Store'));

    for (const path of assetFiles) {
        const fileObj = loadedZip.files[path];
        const lowerName = path.toLowerCase();
        
        const brandMatch = Object.values(newBrands).find(b => path.includes(`${b.name}/brand_logo`) || path.includes(`${b.name}/logo`));
        if (brandMatch) {
            brandMatch.logoUrl = await getBase64(fileObj);
            continue;
        }

        for (const brand of Object.values(newBrands)) {
            for (const category of brand.categories) {
                for (const product of category.products) {
                    const pathSignature = `${brand.name}/${category.name}`;
                    if (path.includes(pathSignature) && path.includes(product.name)) {
                        const b64 = await getBase64(fileObj);
                        if (lowerName.includes('cover') || lowerName.includes('main')) {
                            product.imageUrl = b64;
                        } else if (lowerName.match(/\.(jpg|jpeg|png|webp)$/)) {
                            if (!product.imageUrl) product.imageUrl = b64;
                            else product.galleryUrls?.push(b64);
                        } else if (lowerName.match(/\.(mp4|webm|mov)$/)) {
                            product.videoUrls?.push(b64);
                        } else if (lowerName.endsWith('.pdf')) {
                            product.manuals?.push({
                                id: generateId('man'),
                                title: path.split('/').pop()?.replace('.pdf', '') || 'Manual',
                                images: [],
                                pdfUrl: b64
                            });
                        }
                    }
                }
            }
        }
    }
    return Object.values(newBrands);
};

// --- HELPER COMPONENTS ---

const Auth = ({ admins, onLogin }: { admins: AdminUser[], onLogin: (u: AdminUser) => void }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = admins.find(a => a.pin === pin);
    if (user) {
      onLogin(user);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
                <ShieldCheck size={40} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest">System Access</h1>
            <p className="text-slate-400 text-xs font-bold uppercase mt-2">Restricted Area</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Access PIN</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center font-mono text-2xl font-bold tracking-[1em] text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="••••"
              autoFocus
              maxLength={6}
            />
          </div>
          
          {error && <div className="text-red-400 text-xs font-bold text-center uppercase animate-pulse">Access Denied: Invalid Credentials</div>}
          
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg">
             Authenticate
          </button>
        </form>
        <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
};

const FileUpload = ({ label, currentUrl, onUpload }: { label: string, currentUrl?: string, onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const url = await uploadFileToStorage(e.target.files[0]);
        onUpload(url);
      } catch (err) {
        alert("Upload Failed. Check Supabase connection.");
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase">{label}</span>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1 relative group">
             {currentUrl.match(/\.(mp4|webm)$/) ? (
                 <video src={currentUrl} className="w-full h-full object-cover rounded" />
             ) : (
                 <img src={currentUrl} alt="Preview" className="w-full h-full object-contain rounded" />
             )}
             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                 <button onClick={() => onUpload('')} className="text-white p-1 hover:text-red-400"><Trash2 size={16} /></button>
             </div>
          </div>
        ) : (
          <div className="w-16 h-16 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
             <ImageIcon size={20} />
          </div>
        )}
        
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-[10px] cursor-pointer transition-colors ${uploading ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
           {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
           {uploading ? 'Uploading...' : 'Upload Media'}
           <input type="file" className="hidden" onChange={handleFile} disabled={uploading} accept="image/*,video/*,application/pdf" />
        </label>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type="text" }: any) => (
  <div className="flex flex-col gap-1">
     <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
     <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium text-slate-900 transition-colors" />
  </div>
);

const CatalogueManager = ({ catalogues, brandId, onSave }: { catalogues: Catalogue[], brandId: string, onSave: (c: Catalogue[]) => void }) => {
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {catalogues.map(cat => (
                     <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 relative group">
                         <div className="aspect-[3/4] bg-white mb-2 rounded border border-slate-100 flex items-center justify-center overflow-hidden">
                             {cat.thumbnailUrl || (cat.pages && cat.pages[0]) ? <img src={cat.thumbnailUrl || cat.pages[0]} className="w-full h-full object-cover" /> : <Book size={24} className="text-slate-300"/>}
                         </div>
                         <div className="font-bold text-xs truncate">{cat.title}</div>
                         <div className="text-[10px] text-slate-500">{cat.year}</div>
                         <button 
                            onClick={() => onSave(catalogues.filter(c => c.id !== cat.id))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Trash2 size={12} />
                         </button>
                     </div>
                 ))}
                 <button onClick={() => {
                     const title = prompt("Catalogue Title:");
                     if(title) {
                         const newCat: Catalogue = {
                             id: generateId('cat'),
                             brandId,
                             title,
                             type: 'catalogue',
                             pages: [],
                             year: new Date().getFullYear()
                         };
                         onSave([...catalogues, newCat]);
                     }
                 }} className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors aspect-[3/4]">
                     <Plus size={24} />
                     <span className="text-[10px] font-bold uppercase mt-2">Add New</span>
                 </button>
             </div>
        </div>
    );
};

const AdminManager = ({ admins, onUpdate, currentUser }: { admins: AdminUser[], onUpdate: (a: AdminUser[]) => void, currentUser: AdminUser }) => {
    return (
        <div className="space-y-4">
            {admins.map(admin => (
                <div key={admin.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <div className="font-bold text-sm text-slate-900">{admin.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">{admin.isSuperAdmin ? 'SUPER ADMIN' : 'STAFF'}</div>
                    </div>
                    {currentUser.isSuperAdmin && admin.id !== currentUser.id && (
                        <button onClick={() => onUpdate(admins.filter(a => a.id !== admin.id))} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                    )}
                </div>
            ))}
            {currentUser.isSuperAdmin && (
                <button onClick={() => {
                    const name = prompt("New Admin Name:");
                    if(name) {
                        const pin = prompt("Set PIN (4 digits):");
                        if(pin) {
                            onUpdate([...admins, {
                                id: generateId('adm'),
                                name,
                                pin,
                                isSuperAdmin: false,
                                permissions: { inventory: true, marketing: false, tv: false, screensaver: false, fleet: false, history: false, settings: false, pricelists: false }
                            }]);
                        }
                    }
                }} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold uppercase text-xs hover:border-blue-500 hover:text-blue-500">
                    Add New Admin
                </button>
            )}
        </div>
    );
};

const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Product>({...product});
    
    return (
        <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-xl font-black uppercase text-slate-900 flex items-center gap-2"><Edit2 size={20}/> Edit Product</h2>
                <button onClick={onCancel}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                    <InputField label="Product Name" value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} />
                    <InputField label="SKU / Model Code" value={formData.sku || ''} onChange={(v: string) => setFormData({...formData, sku: v})} />
                </div>
                
                <div>
                     <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Description</label>
                     <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-32 outline-none focus:border-blue-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <FileUpload label="Main Image" currentUrl={formData.imageUrl} onUpload={url => setFormData({...formData, imageUrl: url})} />
                    <FileUpload label="Video URL (Optional)" currentUrl={formData.videoUrl} onUpload={url => setFormData({...formData, videoUrl: url})} />
                </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                <button onClick={onCancel} className="px-6 py-3 rounded-xl font-bold uppercase text-xs text-slate-500 hover:bg-slate-200">Cancel</button>
                <button onClick={() => onSave(formData)} className="px-6 py-3 rounded-xl font-bold uppercase text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-lg">Save Changes</button>
            </div>
        </div>
    );
};

const MoveProductModal = ({ product, allBrands, onClose, onMove }: any) => {
    const [targetBrandId, setTargetBrandId] = useState(allBrands[0]?.id);
    const [targetCategoryId, setTargetCategoryId] = useState('');
    
    const targetBrand = allBrands.find((b: Brand) => b.id === targetBrandId);

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                 <h3 className="text-lg font-black uppercase mb-4">Move Product</h3>
                 <p className="text-sm text-slate-600 mb-6">Select destination for <strong>{product.name}</strong>:</p>
                 
                 <div className="space-y-4 mb-8">
                     <div>
                         <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Target Brand</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={targetBrandId} onChange={e => setTargetBrandId(e.target.value)}>
                             {allBrands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Target Category</label>
                         <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={targetCategoryId} onChange={e => setTargetCategoryId(e.target.value)}>
                             <option value="">Select Category...</option>
                             {targetBrand?.categories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                     </div>
                 </div>

                 <div className="flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold uppercase text-xs">Cancel</button>
                     <button 
                        disabled={!targetCategoryId}
                        onClick={() => onMove(product, targetBrandId, targetCategoryId)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold uppercase text-xs disabled:opacity-50"
                     >
                         Move Product
                     </button>
                 </div>
            </div>
        </div>
    );
};

const KioskEditorModal = ({ kiosk, onSave, onClose }: any) => {
    const [data, setData] = useState({...kiosk});
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl">
                 <h3 className="text-xl font-black uppercase mb-6">Edit Kiosk Details</h3>
                 <div className="space-y-4">
                     <InputField label="Device Name" value={data.name} onChange={(v: string) => setData({...data, name: v})} />
                     <InputField label="Assigned Zone" value={data.assigned_zone} onChange={(v: string) => setData({...data, assigned_zone: v})} placeholder="e.g. Entrance, aisle 4" />
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Notes</label>
                         <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})} />
                     </div>
                 </div>
                 <div className="flex justify-end gap-4 mt-8">
                     <button onClick={onClose} className="text-slate-500 font-bold uppercase text-xs">Cancel</button>
                     <button onClick={() => onSave(data)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs">Save Updates</button>
                 </div>
             </div>
        </div>
    );
};

const TVModelEditor = ({ model, onSave, onClose }: any) => {
    const [data, setData] = useState<TVModel>({...model});
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <h3 className="text-xl font-black uppercase mb-6">Edit TV Model</h3>
                 <div className="space-y-6">
                     <InputField label="Model Name" value={data.name} onChange={(v: string) => setData({...data, name: v})} />
                     <FileUpload label="Cover Image" currentUrl={data.imageUrl} onUpload={url => setData({...data, imageUrl: url})} />
                     
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Playlist Videos</label>
                         <div className="space-y-2">
                             {(data.videoUrls || []).map((url, i) => (
                                 <div key={i} className="flex gap-2 items-center">
                                     <input readOnly value={url} className="flex-1 p-2 bg-slate-50 border rounded text-xs text-slate-500" />
                                     <button onClick={() => setData({...data, videoUrls: data.videoUrls.filter((_, idx) => idx !== i)})} className="text-red-500 p-2"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                             <FileUpload label="Add Video" onUpload={url => setData({...data, videoUrls: [...(data.videoUrls || []), url]})} />
                         </div>
                     </div>
                 </div>
                 <div className="flex justify-end gap-4 mt-8">
                     <button onClick={onClose} className="text-slate-500 font-bold uppercase text-xs">Cancel</button>
                     <button onClick={() => onSave(data)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs">Save Model</button>
                 </div>
            </div>
        </div>
    );
};

export const AdminDashboard = ({ storeData, onUpdateData, onRefresh }: { storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movingProduct, setMovingProduct] = useState<Product | null>(null);
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedTVBrand, setSelectedTVBrand] = useState<TVBrand | null>(null);
  const [editingTVModel, setEditingTVModel] = useState<TVModel | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [localData, setLocalData] = useState<StoreData | null>(storeData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [importProcessing, setImportProcessing] = useState(false);
  const [exportProcessing, setExportProcessing] = useState(false);

  useEffect(() => { checkCloudConnection().then(setIsCloudConnected); }, []);
  useEffect(() => { if (!hasUnsavedChanges && storeData) setLocalData(storeData); }, [storeData]);

  const handleLocalUpdate = (newData: StoreData) => {
      setLocalData(newData);
      setHasUnsavedChanges(true);
  };
  const handleGlobalSave = () => { if (localData) { onUpdateData(localData); setHasUnsavedChanges(false); } };

  const addToArchive = (type: 'product' | 'pricelist' | 'tv_model' | 'other', name: string, data: any): ArchiveData => {
      const currentArchive = localData?.archive || { brands: [], products: [], catalogues: [], deletedItems: [], deletedAt: {} };
      const newItem: ArchivedItem = {
          id: generateId('arch'),
          type,
          name,
          data,
          deletedAt: new Date().toISOString()
      };
      
      return {
          ...currentArchive,
          deletedItems: [...(currentArchive.deletedItems || []), newItem],
          deletedAt: { ...currentArchive.deletedAt, [newItem.id]: newItem.deletedAt }
      };
  };

  const checkSkuDuplicate = (sku: string, currentId: string) => {
    if (!localData) return false;
    for (const b of localData.brands) {
        for (const c of b.categories) {
            for (const p of c.products) {
                if (p.id !== currentId && p.sku && p.sku.toLowerCase() === sku.toLowerCase()) {
                    return true;
                }
            }
        }
    }
    return false;
  };

  const handleMoveProduct = (product: Product, targetBrandId: string, targetCategoryId: string) => {
    if (!localData || !selectedBrand || !selectedCategory) return;
    
    const sourceBrand = localData.brands.find(b => b.id === selectedBrand.id);
    if(!sourceBrand) return;
    const sourceCat = sourceBrand.categories.find(c => c.id === selectedCategory.id);
    if(!sourceCat) return;

    const updatedSourceCat = { ...sourceCat, products: sourceCat.products.filter(p => p.id !== product.id) };
    
    let newBrands = localData.brands.map(b => {
        if (b.id === sourceBrand.id) {
             return { ...b, categories: b.categories.map(c => c.id === updatedSourceCat.id ? updatedSourceCat : c) };
        }
        return b;
    });

    newBrands = newBrands.map(b => {
        if (b.id === targetBrandId) {
             const targetCat = b.categories.find(c => c.id === targetCategoryId);
             if (targetCat) {
                 const updatedTargetCat = { ...targetCat, products: [...targetCat.products, product] };
                 return { ...b, categories: b.categories.map(c => c.id === targetCategoryId ? updatedTargetCat : c) };
             }
        }
        return b;
    });

    handleLocalUpdate({ ...localData, brands: newBrands });
    setMovingProduct(null);
    setSelectedCategory(null);
  };

  const updateFleetMember = async (updatedKiosk: KioskRegistry) => {
    if (localData) {
        handleLocalUpdate({ 
            ...localData, 
            fleet: localData.fleet?.map(k => k.id === updatedKiosk.id ? updatedKiosk : k) || [] 
        });
    }

    if (supabase) {
        const { error } = await supabase.from('kiosks').update({
            name: updatedKiosk.name,
            assigned_zone: updatedKiosk.assigned_zone,
            notes: updatedKiosk.notes
        }).eq('id', updatedKiosk.id);
        
        if (error) console.error("Fleet update failed", error);
    }
  };

  if (!localData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading...</div>;
  if (!currentUser) return <Auth admins={localData.admins || []} onLogin={setCurrentUser} />;

  const brands = Array.isArray(localData.brands) ? [...localData.brands].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const tvBrands = Array.isArray(localData.tv?.brands) ? [...localData.tv!.brands].sort((a, b) => a.name.localeCompare(b.name)) : [];

  const availableTabs = [
      { id: 'inventory', label: 'Inventory', icon: Box },
      { id: 'marketing', label: 'Marketing', icon: Megaphone },
      { id: 'pricelists', label: 'Pricelists', icon: RIcon },
      { id: 'tv', label: 'TV', icon: Tv },
      { id: 'screensaver', label: 'Screensaver', icon: Monitor },
      { id: 'fleet', label: 'Fleet', icon: Tablet },
      { id: 'history', label: 'History', icon: History },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'guide', label: 'System Guide', icon: BookOpen } 
  ].filter(tab => tab.id === 'guide' || currentUser?.permissions[tab.id as keyof AdminPermissions]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
        <header className="bg-slate-900 text-white shrink-0 shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Settings className="text-blue-500" size={24} />
                     <div><h1 className="text-lg font-black uppercase tracking-widest leading-none">Admin Hub</h1></div>
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="text-xs font-bold text-slate-400 uppercase hidden md:block">Hello, {currentUser.name}</div>
                     <button onClick={handleGlobalSave} disabled={!hasUnsavedChanges} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                         <SaveAll size={16} />{hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                     </button>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isCloudConnected ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'}`}>{isCloudConnected ? <Cloud size={14} /> : <HardDrive size={14} />}<span className="text-[10px] font-bold uppercase">{isCloudConnected ? 'Cloud Online' : 'Local Mode'}</span></div>
                     <button onClick={onRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"><RefreshCw size={16} /></button>
                     <button onClick={() => setCurrentUser(null)} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded-lg flex items-center gap-2"><LogOut size={16} /><span className="text-[10px] font-bold uppercase hidden md:inline">Logout</span></button>
                 </div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar">
                {availableTabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === tab.id ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>))}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2 md:p-8 relative pb-40 md:pb-8">
            {activeTab === 'guide' && <SystemDocumentation />}
            {activeTab === 'inventory' && ( !selectedBrand ? ( <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-fade-in"><button onClick={() => { const name = prompt("Brand Name:"); if(name) handleLocalUpdate({ ...localData, brands: [...brands, { id: generateId('b'), name, categories: [] }] }) }} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 md:p-8 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all group min-h-[120px] md:min-h-[200px]"><Plus size={24} className="mb-2" /><span className="font-bold uppercase text-[10px] md:text-xs tracking-wider text-center">Add Brand</span></button>{brands.map(brand => (<div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group relative flex flex-col h-full"><div className="flex-1 bg-slate-50 flex items-center justify-center p-2 relative aspect-square">{brand.logoUrl ? <img src={brand.logoUrl} className="max-h-full max-w-full object-contain" /> : <span className="text-4xl font-black text-slate-200">{brand.name.charAt(0)}</span>}<button onClick={(e) => { e.stopPropagation(); if(confirm("Move to archive?")) { const now = new Date().toISOString(); handleLocalUpdate({...localData, brands: brands.filter(b=>b.id!==brand.id), archive: {...localData.archive!, brands: [...(localData.archive?.brands||[]), brand], deletedAt: {...localData.archive?.deletedAt, [brand.id]: now} }}); } }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button></div><div className="p-2 md:p-4"><h3 className="font-black text-slate-900 text-xs md:text-lg uppercase tracking-tight mb-1 truncate">{brand.name}</h3><p className="text-[10px] md:text-xs text-slate-500 font-bold mb-2 md:mb-4">{brand.categories.length} Categories</p><button onClick={() => setSelectedBrand(brand)} className="w-full bg-slate-900 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs uppercase hover:bg-blue-600 transition-colors">Manage</button></div></div>))}</div> ) : !selectedCategory ? ( <div className="animate-fade-in"><div className="flex items-center gap-4 mb-6"><button onClick={() => setSelectedBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 flex-1">{selectedBrand.name}</h2><FileUpload label="Brand Logo" currentUrl={selectedBrand.logoUrl} onUpload={(url: any) => { const updated = {...selectedBrand, logoUrl: url}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }} /></div><div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2"><button onClick={() => { const name = prompt("Category Name:"); if(name) { const updated = {...selectedBrand, categories: [...selectedBrand.categories, { id: generateId('c'), name, icon: 'Box', products: [] }]}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); } }} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400 hover:border-blue-500 hover:text-blue-500 aspect-square"><Plus size={24} /><span className="font-bold text-[10px] uppercase mt-2 text-center">New Category</span></button>{selectedBrand.categories.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white p-2 md:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md text-left group relative aspect-square flex flex-col justify-center"><Box size={20} className="mb-2 md:mb-4 text-slate-400 mx-auto md:mx-0" /><h3 className="font-black text-slate-900 uppercase text-[10px] md:text-sm text-center md:text-left truncate w-full">{cat.name}</h3><p className="text-[9px] md:text-xs text-slate-500 font-bold text-center md:text-left">{cat.products.length} Products</p><div onClick={(e)=>{e.stopPropagation(); const newName = prompt("Rename Category:", cat.name); if(newName && newName.trim() !== "") { const updated = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === cat.id ? {...c, name: newName.trim()} : c)}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }}} className="absolute top-1 right-8 md:top-2 md:right-8 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-50 text-blue-500 rounded transition-all"><Edit2 size={12}/></div><div onClick={(e)=>{e.stopPropagation(); if(confirm("Delete?")){ const updated={...selectedBrand, categories: selectedBrand.categories.filter(c=>c.id!==cat.id)}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }}} className="absolute top-1 right-1 md:top-2 md:right-2 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded"><Trash2 size={12}/></div></button>))}</div><div className="mt-8 border-t border-slate-200 pt-8"><h3 className="font-bold text-slate-900 uppercase text-sm mb-4">Brand Catalogues</h3><CatalogueManager catalogues={localData.catalogues?.filter(c => c.brandId === selectedBrand.id) || []} brandId={selectedBrand.id} onSave={(c) => { const brandCatalogues = (localData.catalogues || []).filter(c => c.brandId); handleLocalUpdate({ ...localData, catalogues: [...brandCatalogues, ...c] }); }} /></div></div> ) : ( <div className="animate-fade-in h-full flex flex-col"><div className="flex items-center gap-4 mb-6 shrink-0"><button onClick={() => setSelectedCategory(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-lg md:text-2xl font-black uppercase text-slate-900 flex-1 truncate">{selectedCategory.name}</h2><button onClick={() => setEditingProduct({ id: generateId('p'), name: '', description: '', specs: {}, features: [], dimensions: [], imageUrl: '' } as any)} className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg font-bold uppercase text-[10px] md:text-xs flex items-center gap-2 shrink-0"><Plus size={14} /> Add</button></div><div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto pb-20">{selectedCategory.products.map(product => (<div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all"><div className="aspect-square bg-slate-50 relative flex items-center justify-center p-2 md:p-4">{product.imageUrl ? <img src={product.imageUrl} className="max-w-full max-h-full object-contain" /> : <Box size={24} className="text-slate-300" />}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><div className="flex gap-2"><button onClick={() => setEditingProduct(product)} className="p-1.5 md:p-2 bg-white text-blue-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-blue-50">Edit</button><button onClick={() => setMovingProduct(product)} className="p-1.5 md:p-2 bg-white text-orange-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-orange-50" title="Move Category">Move</button></div><button onClick={() => { if(confirm(`Delete product "${product.name}"?`)) { const updatedCat = {...selectedCategory, products: selectedCategory.products.filter(p => p.id !== product.id)}; const updatedBrand = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === updatedCat.id ? updatedCat : c)}; const newArchive = addToArchive('product', product.name, product); handleLocalUpdate({...localData, brands: brands.map(b => b.id === updatedBrand.id ? updatedBrand : b), archive: newArchive}); } }} className="p-1.5 md:p-2 bg-white text-red-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-red-50 w-[80%]">Delete</button></div></div><div className="p-2 md:p-4"><h4 className="font-bold text-slate-900 text-[10px] md:text-sm truncate uppercase">{product.name}</h4><p className="text-[9px] md:text-xs text-slate-500 font-mono truncate">{product.sku || 'No SKU'}</p></div></div>))}</div></div> ) )}
            
            {activeTab === 'settings' && (
               <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                       <h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2">
                           <Key size={20} className="text-blue-500"/> Device Security
                       </h3>
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                           <div className="space-y-1">
                               <label className="text-xs font-bold text-blue-800 uppercase block">Device Setup PIN</label>
                               <p className="text-[10px] text-blue-600 max-w-sm">
                                   Required to activate new devices or restore Kiosk ID. Keep this secure.
                               </p>
                           </div>
                           <input 
                               type="text" 
                               value={localData.setupPin || '0000'} 
                               onChange={(e) => handleLocalUpdate({ ...localData, setupPin: e.target.value })}
                               className="w-32 p-2 rounded-lg border border-blue-200 font-mono font-bold text-center text-lg outline-none focus:border-blue-500"
                               placeholder="0000"
                           />
                       </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500 pointer-events-none"><Database size={120} /></div>
                       <h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2"><Database size={20} className="text-blue-500"/> System Data & Backup</h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                           <div className="space-y-4">
                               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs">
                                   <strong>Export Full Backup:</strong> Download your entire inventory structure including Brands, Categories, and Products. This downloads a ZIP file organized by folders containing metadata JSONs.
                                   <div className="mt-2 text-blue-600 font-bold">Use this to edit offline or migrate data.</div>
                               </div>
                               <button 
                                   onClick={async () => {
                                       setExportProcessing(true);
                                       try {
                                           await downloadZip(localData);
                                       } catch (e) {
                                           console.error(e);
                                           alert("Export Failed: " + (e as Error).message);
                                       } finally {
                                           setExportProcessing(false);
                                       }
                                   }}
                                   disabled={exportProcessing}
                                   className={`w-full py-4 ${exportProcessing ? 'bg-blue-800 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-bold uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25`}
                               >
                                   {exportProcessing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                                   {exportProcessing ? 'Packaging Assets...' : 'Download Full Backup (.zip)'}
                               </button>
                           </div>

                           <div className="space-y-4">
                               <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                                   <strong>Import Structure:</strong> Upload a ZIP file to auto-populate the system.
                                   <ul className="list-disc pl-4 mt-2 space-y-1 text-[10px] text-slate-500 font-bold">
                                       <li>Folder Structure: <code>Brand/Category/Product/</code></li>
                                       <li>Place images (.jpg/.png) & manuals (.pdf) inside product folders.</li>
                                       <li><strong>Smart Import:</strong> Uses `details.json` to accurately map data.</li>
                                   </ul>
                               </div>
                               <label className={`w-full py-4 ${importProcessing ? 'bg-slate-300 cursor-wait' : 'bg-slate-800 hover:bg-slate-900 cursor-pointer'} text-white rounded-xl font-bold uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}>
                                   {importProcessing ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />} 
                                   {importProcessing ? 'Processing Backup...' : 'Import Data from ZIP'}
                                   <input 
                                     type="file" 
                                     accept=".zip" 
                                     className="hidden" 
                                     disabled={importProcessing}
                                     onChange={async (e) => {
                                         if(e.target.files && e.target.files[0]) {
                                             if(confirm("This will merge imported data into your current inventory. Continue?")) {
                                                 setImportProcessing(true);
                                                 try {
                                                     const newBrands = await importZip(e.target.files[0]);
                                                     let mergedBrands = [...localData.brands];
                                                     
                                                     newBrands.forEach(nb => {
                                                         const existingBrandIndex = mergedBrands.findIndex(b => b.name === nb.name);
                                                         if (existingBrandIndex > -1) {
                                                             if (nb.logoUrl) {
                                                                 mergedBrands[existingBrandIndex].logoUrl = nb.logoUrl;
                                                             }

                                                             nb.categories.forEach(nc => {
                                                                 const existingCatIndex = mergedBrands[existingBrandIndex].categories.findIndex(c => c.name === nc.name);
                                                                 if (existingCatIndex > -1) {
                                                                     const existingProducts = mergedBrands[existingBrandIndex].categories[existingCatIndex].products;
                                                                     const uniqueNewProducts = nc.products.filter(np => !existingProducts.find(ep => ep.name === np.name));
                                                                     mergedBrands[existingBrandIndex].categories[existingCatIndex].products = [...existingProducts, ...uniqueNewProducts];
                                                                 } else {
                                                                     mergedBrands[existingBrandIndex].categories.push(nc);
                                                                 }
                                                             });
                                                         } else {
                                                             mergedBrands.push(nb);
                                                         }
                                                     });
                                                     
                                                     handleLocalUpdate({ ...localData, brands: mergedBrands });
                                                     alert("Import Successful! Items added.");
                                                 } catch(err) {
                                                     console.error(err);
                                                     alert("Failed to read ZIP file. Ensure it contains details.json files.");
                                                 } finally {
                                                     setImportProcessing(false);
                                                 }
                                             }
                                         }
                                     }}
                                   />
                               </label>
                           </div>
                       </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2"><UserCog size={20} className="text-blue-500"/> Admin Access Control</h3><AdminManager admins={localData.admins || []} onUpdate={(admins) => handleLocalUpdate({ ...localData, admins })} currentUser={currentUser} /></div>

                   <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-6"><CloudLightning size={24} className="text-yellow-400" /><h3 className="font-black uppercase text-sm tracking-wider">System Operations</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <button onClick={() => setShowGuide(true)} className="p-4 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-3 transition-colors border border-slate-600"><BookOpen size={24} className="text-blue-400"/><div className="text-left"><div className="font-bold text-sm">Setup Guide</div><div className="text-[10px] text-slate-400 font-mono uppercase">Docs & Scripts</div></div></button>
                             <button onClick={async () => { if(confirm("WARNING: This will wipe ALL local data and reset to defaults. Continue?")) { const d = await resetStoreData(); setLocalData(d); window.location.reload(); } }} className="p-4 bg-red-900/30 hover:bg-red-900/50 rounded-xl flex items-center gap-3 transition-colors border border-red-900/50 text-red-300"><AlertCircle size={24} /><div className="text-left"><div className="font-bold text-sm">Factory Reset</div><div className="text-[10px] text-red-400 font-mono uppercase">Clear Local Data</div></div></button>
                        </div>
                   </div>
               </div>
            )}
        </main>

        {editingProduct && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-fade-in">
                <ProductEditor product={editingProduct} onSave={(p) => { 
                    if (!selectedBrand || !selectedCategory) return;
                    if (p.sku && checkSkuDuplicate(p.sku, p.id)) { alert(`SKU "${p.sku}" is already used by another product.`); return; }
                    const isNew = !selectedCategory.products.find(x => x.id === p.id);
                    const newProducts = isNew ? [...selectedCategory.products, p] : selectedCategory.products.map(x => x.id === p.id ? p : x);
                    const updatedCat = { ...selectedCategory, products: newProducts };
                    const updatedBrand = { ...selectedBrand, categories: selectedBrand.categories.map(c => c.id === updatedCat.id ? updatedCat : c) };
                    handleLocalUpdate({ ...localData, brands: brands.map(b => b.id === updatedBrand.id ? updatedBrand : b) });
                    setEditingProduct(null);
                }} onCancel={() => setEditingProduct(null)} />
            </div>
        )}

        {movingProduct && (
            <MoveProductModal product={movingProduct} allBrands={brands} currentBrandId={selectedBrand?.id || ''} currentCategoryId={selectedCategory?.id || ''} onClose={() => setMovingProduct(null)} onMove={(product, targetBrand, targetCategory) => handleMoveProduct(product, targetBrand, targetCategory)} />
        )}

        {editingKiosk && (
            <KioskEditorModal kiosk={editingKiosk} onSave={(k) => { updateFleetMember(k); setEditingKiosk(null); }} onClose={() => setEditingKiosk(null)} />
        )}
        
        {editingTVModel && (
            <TVModelEditor model={editingTVModel} onSave={(m) => { if (!selectedTVBrand) return; const isNew = !selectedTVBrand.models.find(x => x.id === m.id); const newModels = isNew ? [...selectedTVBrand.models, m] : selectedTVBrand.models.map(x => x.id === m.id ? m : x); const updatedTVBrand = { ...selectedTVBrand, models: newModels }; handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === updatedTVBrand.id ? updatedTVBrand : b) } as TVConfig }); setEditingTVModel(null); }} onClose={() => setEditingTVModel(null)} />
        )}
        
        {showGuide && <SetupGuide onClose={() => setShowGuide(false)} />}
        
    </div>
  );
};

export default AdminDashboard;