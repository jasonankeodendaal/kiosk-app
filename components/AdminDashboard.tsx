import React, { useState, useEffect } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck, Ruler
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData, DimensionSet } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase, checkCloudConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const convertPdfToImages = async (pdfDataUrl: string): Promise<string[]> => {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;
        if (pdfjs && pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
        }
        const loadingTask = pdfjs.getDocument(pdfDataUrl);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const images: string[] = [];

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                images.push(canvas.toDataURL('image/jpeg', 0.8));
            }
        }
        return images;
    } catch (e) {
        console.error("PDF Conversion Error", e);
        return [];
    }
};

const Auth = ({ setSession }: { setSession: (s: boolean) => void }) => {
  const [password, setPassword] = useState('');
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if(password === 'admin') setSession(true); 
    else alert('Incorrect password.');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-800 p-4 animate-fade-in">
      <div className="bg-slate-100 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden border border-slate-300">
        <h1 className="text-4xl font-black mb-2 text-center text-slate-900 mt-4 tracking-tight">Admin Hub</h1>
        <form onSubmit={handleAuth} className="space-y-6">
          <input className="w-full p-4 border border-slate-300 rounded-xl bg-white font-bold" type="password" placeholder="ACCESS KEY" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          <button type="submit" className="w-full p-4 font-black rounded-xl bg-slate-900 text-white uppercase">Login</button>
        </form>
      </div>
    </div>
  );
};

const FileUpload = ({ currentUrl, onUpload, label, accept = "image/*", icon = <ImageIcon />, allowMultiple = false }: any) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      setUploadProgress(10); 
      const files = Array.from(e.target.files) as File[];
      let fileType = files[0].type.startsWith('video') ? 'video' : files[0].type === 'application/pdf' ? 'pdf' : 'image';

      const uploadSingle = async (file: File) => {
           try {
              return await uploadFileToStorage(file);
           } catch (e) {
              return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
              });
           }
      };

      try {
          if (allowMultiple) {
              const results: string[] = [];
              for(let i=0; i<files.length; i++) {
                  results.push(await uploadSingle(files[i]) as string);
                  setUploadProgress(((i+1)/files.length)*100);
              }
              onUpload(results, fileType);
          } else {
              const res = await uploadSingle(files[0]);
              setUploadProgress(100);
              onUpload(res, fileType);
          }
      } catch (err) { alert("Upload error"); } 
      finally { setTimeout(() => { setIsProcessing(false); setUploadProgress(0); }, 500); }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        {isProcessing && <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }}></div>}
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden shrink-0">
           {isProcessing ? <Loader2 className="animate-spin text-blue-500" /> : currentUrl && !allowMultiple ? (accept.includes('video') ? <Video /> : accept.includes('pdf') ? <FileText /> : <img src={currentUrl} className="w-full h-full object-cover" />) : icon}
        </div>
        <label className={`cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase ${isProcessing ? 'opacity-50' : ''}`}>
              <Upload size={12} className="inline mr-2" /> {isProcessing ? 'Uploading...' : 'Select File'}
              <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isProcessing} multiple={allowMultiple}/>
        </label>
      </div>
    </div>
  );
};

const InputField = ({ label, val, onChange, placeholder, isArea = false, half = false }: any) => (
    <div className={`mb-4 ${half ? 'w-full' : ''}`}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
      {isArea ? <textarea value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder={placeholder} /> : <input value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder={placeholder} />}
    </div>
);

const CatalogueManager = ({ catalogues, onSave, brandId }: { catalogues: Catalogue[], onSave: (c: Catalogue[]) => void, brandId?: string }) => {
    const [localList, setLocalList] = useState(catalogues || []);
    useEffect(() => setLocalList(catalogues || []), [catalogues]);

    const addCatalogue = () => {
        setLocalList([...localList, {
            id: generateId('cat'),
            title: brandId ? 'New Brand Catalogue' : 'New Pamphlet',
            brandId: brandId,
            type: brandId ? 'catalogue' : 'pamphlet', // Auto-set type
            pages: [],
            year: new Date().getFullYear(),
            startDate: '',
            endDate: ''
        }]);
    };

    const updateCatalogue = (id: string, updates: Partial<Catalogue>) => {
        setLocalList(localList.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleUpload = async (id: string, data: any, type?: string) => {
        const cat = localList.find(c => c.id === id);
        if(!cat) return;
        let newPages = [...cat.pages];
        if (type === 'pdf' && typeof data === 'string') newPages = [...newPages, ...(await convertPdfToImages(data))];
        else if (Array.isArray(data)) newPages = [...newPages, ...data];
        else if (typeof data === 'string') newPages.push(data);
        updateCatalogue(id, { pages: newPages });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold uppercase text-slate-500 text-xs tracking-wider">{brandId ? 'Brand Catalogues' : 'Global Pamphlets'}</h3>
                 <button onClick={addCatalogue} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Plus size={14} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localList.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="h-40 bg-slate-100 relative group flex items-center justify-center">
                            {cat.pages[0] ? <img src={cat.pages[0]} className="w-full h-full object-cover" /> : <BookOpen size={32} className="text-slate-300" />}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => updateCatalogue(cat.id, { pages: [] })} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold uppercase">Clear Pages</button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <input value={cat.title} onChange={(e) => updateCatalogue(cat.id, { title: e.target.value })} className="w-full font-black text-slate-900 border-b border-transparent focus:border-blue-500 outline-none text-sm" placeholder="Title" />
                            
                            {cat.type === 'catalogue' || brandId ? (
                                <div>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Catalogue Year</label>
                                    <input type="number" value={cat.year || new Date().getFullYear()} onChange={(e) => updateCatalogue(cat.id, { year: parseInt(e.target.value) })} className="w-full text-xs border border-slate-200 rounded p-1" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[8px] font-bold text-slate-400 uppercase">Start Date</label>
                                        <input type="date" value={cat.startDate || ''} onChange={(e) => updateCatalogue(cat.id, { startDate: e.target.value })} className="w-full text-xs border border-slate-200 rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-bold text-slate-400 uppercase">End Date (Auto-Expire)</label>
                                        <input type="date" value={cat.endDate || ''} onChange={(e) => updateCatalogue(cat.id, { endDate: e.target.value })} className="w-full text-xs border border-slate-200 rounded p-1" />
                                    </div>
                                </div>
                            )}
                            
                            <FileUpload label="Pages (PDF/Images)" accept="image/*,application/pdf" currentUrl="" onUpload={(d: any, t: any) => handleUpload(cat.id, d, t)} allowMultiple={true} />
                            
                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold">{cat.pages.length} Pages</span>
                                <button onClick={() => setLocalList(localList.filter(c => c.id !== cat.id))} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end pt-6"><button onClick={() => onSave(localList)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs shadow-lg">Save Changes</button></div>
        </div>
    );
};

const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
    const [draft, setDraft] = useState<Product>({ 
        ...product, 
        dimensions: Array.isArray(product.dimensions) 
            ? product.dimensions 
            : (product.dimensions ? [{label: "Device", ...(product.dimensions as any)}] : []) 
    });
    const [newFeature, setNewFeature] = useState('');
    const [newBoxItem, setNewBoxItem] = useState('');
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

    const addFeature = () => { if (newFeature.trim()) { setDraft({ ...draft, features: [...draft.features, newFeature.trim()] }); setNewFeature(''); } };
    const addBoxItem = () => { if(newBoxItem.trim()) { setDraft({ ...draft, boxContents: [...(draft.boxContents || []), newBoxItem.trim()] }); setNewBoxItem(''); } };
    const addSpec = () => { if (newSpecKey.trim() && newSpecValue.trim()) { setDraft({ ...draft, specs: { ...draft.specs, [newSpecKey.trim()]: newSpecValue.trim() } }); setNewSpecKey(''); setNewSpecValue(''); } };

    // Dimensions Logic
    const addDimensionSet = () => {
        setDraft({ 
            ...draft, 
            dimensions: [...draft.dimensions, { label: "New Set", width: "", height: "", depth: "", weight: "" }] 
        });
    };
    const updateDimension = (index: number, field: keyof DimensionSet, value: string) => {
        const newDims = [...draft.dimensions];
        newDims[index] = { ...newDims[index], [field]: value };
        setDraft({ ...draft, dimensions: newDims });
    };
    const removeDimension = (index: number) => {
        const newDims = draft.dimensions.filter((_, i) => i !== index);
        setDraft({ ...draft, dimensions: newDims });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                <h3 className="font-bold uppercase tracking-wide">Edit Product: {draft.name || 'New Product'}</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <InputField label="Product Name" val={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} />
                        <InputField label="SKU" val={draft.sku || ''} onChange={(e: any) => setDraft({ ...draft, sku: e.target.value })} />
                        <InputField label="Description" isArea val={draft.description} onChange={(e: any) => setDraft({ ...draft, description: e.target.value })} />
                        
                        {/* MULTI DIMENSIONS EDITOR */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <div className="flex justify-between items-center mb-4">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Dimensions Sets</label>
                                 <button onClick={addDimensionSet} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase flex items-center gap-1"><Plus size={10}/> Add Set</button>
                             </div>
                             {draft.dimensions.map((dim, idx) => (
                                 <div key={idx} className="mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative">
                                     <button onClick={() => removeDimension(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                                     <input value={dim.label || ''} onChange={(e) => updateDimension(idx, 'label', e.target.value)} placeholder="Label (e.g. Box 1)" className="w-full text-xs font-black uppercase mb-2 border-b border-transparent focus:border-blue-500 outline-none" />
                                     <div className="grid grid-cols-2 gap-2">
                                         <InputField label="Height" val={dim.height} onChange={(e:any) => updateDimension(idx, 'height', e.target.value)} half placeholder="10cm" />
                                         <InputField label="Width" val={dim.width} onChange={(e:any) => updateDimension(idx, 'width', e.target.value)} half placeholder="10cm" />
                                         <InputField label="Depth" val={dim.depth} onChange={(e:any) => updateDimension(idx, 'depth', e.target.value)} half placeholder="10cm" />
                                         <InputField label="Weight" val={dim.weight} onChange={(e:any) => updateDimension(idx, 'weight', e.target.value)} half placeholder="1kg" />
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FileUpload label="Main Image" currentUrl={draft.imageUrl} onUpload={(url: any) => setDraft({ ...draft, imageUrl: url as string })} />
                        <FileUpload label="Product Video" currentUrl={draft.videoUrl} accept="video/*" icon={<Video />} onUpload={(url: any) => setDraft({ ...draft, videoUrl: url as string })} />
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Key Features</label>
                             <div className="flex gap-2 mb-2">
                                 <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-sm" placeholder="Add feature..." onKeyDown={(e) => e.key === 'Enter' && addFeature()} />
                                 <button onClick={addFeature} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /></button>
                             </div>
                             <ul className="space-y-1">{draft.features.map((f, i) => (<li key={i} className="flex justify-between bg-white p-2 rounded border border-slate-100 text-xs font-bold text-slate-700">{f}<button onClick={() => setDraft({...draft, features: draft.features.filter((_, ix) => ix !== i)})} className="text-red-400"><Trash2 size={12}/></button></li>))}</ul>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                             <label className="block text-[10px] font-black text-orange-600 uppercase tracking-wider mb-2">What's in the Box</label>
                             <div className="flex gap-2 mb-2">
                                 <input type="text" value={newBoxItem} onChange={(e) => setNewBoxItem(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-sm" placeholder="Add item..." onKeyDown={(e) => e.key === 'Enter' && addBoxItem()} />
                                 <button onClick={addBoxItem} className="p-2 bg-orange-500 text-white rounded-lg"><Plus size={16} /></button>
                             </div>
                             <ul className="space-y-1">{(draft.boxContents || []).map((item, i) => (<li key={i} className="flex justify-between bg-white p-2 rounded border border-slate-100 text-xs font-bold text-slate-700">{item}<button onClick={() => setDraft({...draft, boxContents: (draft.boxContents || []).filter((_, ix) => ix !== i)})} className="text-red-400"><Trash2 size={12}/></button></li>))}</ul>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-slate-100 pt-8">
                     <h4 className="font-bold text-slate-900 uppercase text-sm mb-4">Manuals & Specs</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <FileUpload label="Manual (PDF)" accept="application/pdf" icon={<FileText />} currentUrl={draft.manualUrl} onUpload={async (url: any, type: any) => { if(type === 'pdf' && typeof url === 'string') { const pages = await convertPdfToImages(url); setDraft({ ...draft, manualUrl: url, manualImages: pages }); } }} />
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <div className="flex gap-4 mb-4 items-end">
                                <input value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="Spec Name" className="flex-1 p-2 border border-slate-300 rounded-lg text-sm font-bold" />
                                <input value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="Value" className="flex-1 p-2 border border-slate-300 rounded-lg text-sm font-bold" onKeyDown={(e) => e.key === 'Enter' && addSpec()} />
                                <button onClick={addSpec} className="bg-blue-600 text-white p-2.5 rounded-lg"><Plus size={18} /></button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {Object.entries(draft.specs).map(([key, value]) => (<div key={key} className="flex justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm"><div><span className="block text-[10px] font-bold text-slate-400 uppercase">{key}</span><span className="block text-sm font-black">{value}</span></div><button onClick={() => { const s = {...draft.specs}; delete s[key]; setDraft({...draft, specs: s}); }} className="text-red-400"><Trash2 size={16}/></button></div>))}
                             </div>
                        </div>
                     </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 shrink-0">
                <button onClick={onCancel} className="px-6 py-3 font-bold text-slate-500 uppercase text-xs">Cancel</button>
                <button onClick={() => onSave(draft)} className="px-6 py-3 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg shadow-lg">Save Changes</button>
            </div>
        </div>
    );
};

const KioskEditorModal = ({ kiosk, onSave, onClose }: { kiosk: KioskRegistry, onSave: (k: KioskRegistry) => void, onClose: () => void }) => {
    const [draft, setDraft] = useState({ ...kiosk });
    return (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-black text-slate-900 uppercase">Edit Device</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <InputField label="Device Name" val={draft.name} onChange={(e:any) => setDraft({...draft, name: e.target.value})} />
                    <InputField label="Assigned Zone" val={draft.assignedZone || ''} onChange={(e:any) => setDraft({...draft, assignedZone: e.target.value})} />
                    
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Device Type</label>
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => setDraft({...draft, deviceType: 'kiosk'})} className={`p-3 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 ${draft.deviceType === 'kiosk' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                 <Tablet size={16}/> Kiosk
                             </button>
                             <button onClick={() => setDraft({...draft, deviceType: 'mobile'})} className={`p-3 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 ${draft.deviceType === 'mobile' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                 <Smartphone size={16}/> Mobile
                             </button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold uppercase text-xs">Cancel</button>
                    <button onClick={() => onSave(draft)} className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard = ({ onExit, storeData, onUpdateData, onRefresh }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [session, setSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'marketing' | 'screensaver' | 'fleet' | 'history' | 'settings'>('inventory');
  const [activeSubTab, setActiveSubTab] = useState<string>('brands'); 
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [historyFolder, setHistoryFolder] = useState<'brands' | 'products' | 'catalogues' | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
      checkCloudConnection().then(setIsCloudConnected);
      const interval = setInterval(() => checkCloudConnection().then(setIsCloudConnected), 30000);
      return () => clearInterval(interval);
  }, []);

  // Fleet Actions
  const updateFleetMember = async (kiosk: KioskRegistry) => {
      if(supabase) {
          // Map to SQL
          const payload = {
              id: kiosk.id,
              name: kiosk.name,
              device_type: kiosk.deviceType,
              assigned_zone: kiosk.assignedZone
          };
          await supabase.from('kiosks').upsert(payload);
          onRefresh(); // Pull fresh data
      }
  };

  const removeFleetMember = async (id: string) => {
      if(confirm("Remove device from fleet? This cannot be undone.") && supabase) {
          await supabase.from('kiosks').delete().eq('id', id);
          onRefresh();
      }
  };

  const requestSnapshot = async (id: string) => {
      if(supabase) {
          const { error } = await supabase.from('kiosks').update({ request_snapshot: true }).eq('id', id);
          if(!error) alert("Snapshot requested. It will appear here shortly.");
      }
  };

  if (!session) return <Auth setSession={setSession} />;
  if (!storeData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
        <header className="bg-slate-900 text-white shrink-0 shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Settings className="text-blue-500" size={24} />
                     <div><h1 className="text-lg font-black uppercase tracking-widest leading-none">Admin Hub</h1></div>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isCloudConnected ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'}`}>
                         {isCloudConnected ? <Cloud size={14} /> : <HardDrive size={14} />}
                         <span className="text-[10px] font-bold uppercase">{isCloudConnected ? 'Cloud Online' : 'Local Mode'}</span>
                     </div>
                     <button onClick={onRefresh} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"><RefreshCw size={16} /></button>
                     <button onClick={onExit} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded-lg"><LogOut size={16} /></button>
                 </div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar">
                {['inventory', 'marketing', 'screensaver', 'fleet', 'history', 'settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === tab ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                ))}
            </div>
        </header>

        {activeTab === 'marketing' && (
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm z-10">
                <button onClick={() => setActiveSubTab('hero')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'hero' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Hero Banner</button>
                <button onClick={() => setActiveSubTab('ads')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'ads' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Ad Zones</button>
                <button onClick={() => setActiveSubTab('catalogues')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'catalogues' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Pamphlets & Catalogues</button>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {activeTab === 'inventory' && (
                !selectedBrand ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                       <button onClick={() => { const name = prompt("Brand Name:"); if(name) onUpdateData({ ...storeData, brands: [...storeData.brands, { id: generateId('b'), name, categories: [] }] }) }} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all group min-h-[200px]">
                           <Plus size={24} className="mb-2" /><span className="font-bold uppercase text-xs tracking-wider">Add Brand</span>
                       </button>
                       {storeData.brands.map(brand => (
                           <div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group relative">
                               <div className="h-32 bg-slate-50 flex items-center justify-center p-4 relative">
                                   {brand.logoUrl ? <img src={brand.logoUrl} className="max-h-full max-w-full object-contain" /> : <span className="text-4xl font-black text-slate-200">{brand.name.charAt(0)}</span>}
                                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Move to archive?")) { onUpdateData({...storeData, brands: storeData.brands.filter(b=>b.id!==brand.id), archive: {...storeData.archive, brands: [...(storeData.archive?.brands||[]), brand]}}); } }} className="absolute top-2 right-2 p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                               </div>
                               <div className="p-4">
                                   <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-1">{brand.name}</h3>
                                   <p className="text-xs text-slate-500 font-bold mb-4">{brand.categories.length} Categories</p>
                                   <button onClick={() => setSelectedBrand(brand)} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-600 transition-colors">Manage</button>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : !selectedCategory ? (
                   <div className="animate-fade-in">
                       <div className="flex items-center gap-4 mb-6"><button onClick={() => setSelectedBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-2xl font-black uppercase text-slate-900 flex-1">{selectedBrand.name}</h2><FileUpload label="Brand Logo" currentUrl={selectedBrand.logoUrl} onUpload={(url: any) => { const updated = {...selectedBrand, logoUrl: url}; onUpdateData({...storeData, brands: storeData.brands.map(b=>b.id===updated.id?updated:b)}); setSelectedBrand(updated); }} /></div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                           <button onClick={() => { const name = prompt("Category Name:"); if(name) { const updated = {...selectedBrand, categories: [...selectedBrand.categories, { id: generateId('c'), name, icon: 'Box', products: [] }]}; onUpdateData({...storeData, brands: storeData.brands.map(b=>b.id===updated.id?updated:b)}); setSelectedBrand(updated); } }} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-500 hover:text-blue-500"><Plus size={24} /><span className="font-bold text-xs uppercase mt-2">New Category</span></button>
                           {selectedBrand.categories.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md text-left group relative"><Box size={24} className="mb-4 text-slate-400" /><h3 className="font-black text-slate-900 uppercase text-sm">{cat.name}</h3><p className="text-xs text-slate-500 font-bold">{cat.products.length} Products</p><div onClick={(e)=>{e.stopPropagation(); if(confirm("Delete?")){ const updated={...selectedBrand, categories: selectedBrand.categories.filter(c=>c.id!==cat.id)}; onUpdateData({...storeData, brands: storeData.brands.map(b=>b.id===updated.id?updated:b)}); setSelectedBrand(updated); }}} className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14}/></div></button>))}
                       </div>
                       <div className="mt-8 border-t border-slate-200 pt-8"><h3 className="font-bold text-slate-900 uppercase text-sm mb-4">Brand Catalogues</h3><CatalogueManager catalogues={storeData.catalogues?.filter(c => c.brandId === selectedBrand.id) || []} brandId={selectedBrand.id} onSave={(c) => onUpdateData({ ...storeData, catalogues: [...(storeData.catalogues?.filter(x => x.brandId !== selectedBrand.id) || []), ...c] })} /></div>
                   </div>
               ) : (
                   <div className="animate-fade-in h-full flex flex-col">
                       <div className="flex items-center gap-4 mb-6 shrink-0"><button onClick={() => setSelectedCategory(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-2xl font-black uppercase text-slate-900 flex-1">{selectedCategory.name}</h2><button onClick={() => setEditingProduct({ id: generateId('p'), name: '', description: '', specs: {}, features: [], dimensions: [], imageUrl: '' } as any)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2"><Plus size={16} /> Add Product</button></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
                           {selectedCategory.products.map(product => (<div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all"><div className="aspect-square bg-slate-50 relative flex items-center justify-center p-4">{product.imageUrl ? <img src={product.imageUrl} className="max-w-full max-h-full object-contain" /> : <Box size={32} className="text-slate-300" />}<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><button onClick={() => setEditingProduct(product)} className="p-2 bg-white text-blue-600 rounded-lg font-bold text-xs uppercase shadow-lg">Edit</button></div></div><div className="p-4"><h4 className="font-bold text-slate-900 text-sm truncate uppercase">{product.name}</h4><p className="text-xs text-slate-500 font-mono">{product.sku || 'No SKU'}</p></div></div>))}
                       </div>
                   </div>
               )
            )}

            {activeTab === 'marketing' && (
                <div className="max-w-5xl mx-auto">
                    {activeSubTab === 'catalogues' && <CatalogueManager catalogues={storeData.catalogues || []} onSave={(c) => onUpdateData({ ...storeData, catalogues: c })} />}
                    {activeSubTab === 'hero' && <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><InputField label="Title" val={storeData.hero.title} onChange={(e:any) => onUpdateData({...storeData, hero: {...storeData.hero, title: e.target.value}})} /><InputField label="Subtitle" val={storeData.hero.subtitle} onChange={(e:any) => onUpdateData({...storeData, hero: {...storeData.hero, subtitle: e.target.value}})} /></div><div className="space-y-4"><FileUpload label="Background" currentUrl={storeData.hero.backgroundImageUrl} onUpload={(url:any) => onUpdateData({...storeData, hero: {...storeData.hero, backgroundImageUrl: url}})} /></div></div></div>}
                    {activeSubTab === 'ads' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{['homeBottomLeft', 'homeBottomRight', 'homeSideVertical'].map(zone => (<div key={zone} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h4 className="font-bold uppercase text-xs mb-1">{zone.replace('home', '')}</h4>
                    <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-wide">
                        {zone.includes('Side') ? 'Size: 1080x1920 (Portrait)' : 'Size: 1920x1080 (Landscape)'}
                    </p>
                    <FileUpload label="Upload Media" accept="image/*,video/*" allowMultiple onUpload={(urls:any, type:any) => { const newAds = (Array.isArray(urls)?urls:[urls]).map(u=>({id:generateId('ad'), type, url:u})); onUpdateData({...storeData, ads: {...storeData.ads, [zone]: [...(storeData.ads as any)[zone], ...newAds]} as any}); }} /></div>))}</div>}
                </div>
            )}

            {activeTab === 'screensaver' && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Screensaver Config</h3>
                     <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-4">
                             <InputField label="Idle Timeout (sec)" val={storeData.screensaverSettings?.idleTimeout||60} onChange={(e:any)=>onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, idleTimeout: parseInt(e.target.value)}})} />
                             <InputField label="Image Duration (sec)" val={storeData.screensaverSettings?.imageDuration||8} onChange={(e:any)=>onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, imageDuration: parseInt(e.target.value)}})} />
                         </div>
                         <div className="space-y-2">
                             {Object.keys(storeData.screensaverSettings || {}).filter(k => typeof (storeData.screensaverSettings as any)[k] === 'boolean').map(k => (
                                 <div key={k} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl"><span className="text-xs font-bold uppercase text-slate-700">{k.replace(/([A-Z])/g, ' $1').trim()}</span><button onClick={() => onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, [k]: !(storeData.screensaverSettings as any)[k]}})} className={`w-8 h-4 rounded-full transition-colors relative ${ (storeData.screensaverSettings as any)[k] ? 'bg-green-500' : 'bg-slate-300' }`}><div className={`w-2 h-2 bg-white rounded-full absolute top-1 transition-all ${ (storeData.screensaverSettings as any)[k] ? 'left-5' : 'left-1' }`}></div></button></div>
                             ))}
                         </div>
                     </div>
                     <div className="mt-8 pt-8 border-t border-slate-100"><h4 className="font-bold text-slate-900 uppercase text-xs mb-4">Custom Media</h4><FileUpload label="Upload" allowMultiple accept="image/*,video/*" currentUrl="" onUpload={(urls:any, type:any) => { const newAds = (Array.isArray(urls)?urls:[urls]).map(u=>({id:generateId('ss'), type, url:u})); onUpdateData({...storeData, ads: {...storeData.ads!, screensaver: [...(storeData.ads?.screensaver||[]), ...newAds]}}); }} /></div>
                </div>
            )}

            {activeTab === 'fleet' && (
                <div className="animate-fade-in max-w-6xl mx-auto">
                   <h2 className="text-2xl font-black text-slate-900 uppercase mb-6">Device Fleet</h2>
                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4 text-[10px] font-black text-slate-500 uppercase">Status</th><th className="p-4 text-[10px] font-black text-slate-500 uppercase">Name</th><th className="p-4 text-[10px] font-black text-slate-500 uppercase">Type</th><th className="p-4 text-[10px] font-black text-slate-500 uppercase">Snapshot</th><th className="p-4 text-[10px] font-black text-slate-500 uppercase">Actions</th></tr></thead>
                           <tbody>{storeData.fleet?.map(kiosk => {
                               const isOnline = (new Date().getTime() - new Date(kiosk.last_seen).getTime()) < 120000;
                               return (
                                   <tr key={kiosk.id} className="border-b border-slate-100 hover:bg-slate-50">
                                       <td className="p-4"><div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit text-[10px] font-bold uppercase ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}><div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>{isOnline ? 'Online' : 'Offline'}</div></td>
                                       <td className="p-4 font-bold text-slate-700 text-sm">{kiosk.name} <span className="block text-[10px] text-slate-400 font-mono">{kiosk.id}</span></td>
                                       <td className="p-4 font-bold text-xs uppercase text-slate-600">{kiosk.deviceType || 'Kiosk'}</td>
                                       <td className="p-4">
                                            {kiosk.snapshotUrl ? (
                                                <div className="w-16 h-12 bg-slate-200 rounded overflow-hidden relative group cursor-pointer" onClick={() => window.open(kiosk.snapshotUrl, '_blank')}>
                                                    <img src={kiosk.snapshotUrl} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100"><Eye size={12} className="text-white"/></div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold">No Snapshot</span>
                                            )}
                                       </td>
                                       <td className="p-4 flex gap-2">
                                           {kiosk.deviceType === 'kiosk' && (
                                                <button onClick={() => requestSnapshot(kiosk.id)} className="p-2 bg-slate-100 hover:bg-green-100 text-green-600 rounded-lg" title="Request Camera Snapshot"><Camera size={14} /></button>
                                           )}
                                           <button onClick={() => setEditingKiosk(kiosk)} className="p-2 bg-slate-100 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit2 size={14} /></button>
                                           <button onClick={() => removeFleetMember(kiosk.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                                       </td>
                                   </tr>
                               );
                           })}</tbody>
                       </table>
                   </div>
                </div>
            )}

            {activeTab === 'history' && (
                 <div className="animate-fade-in max-w-6xl mx-auto">
                    {!historyFolder ? (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {['brands', 'products', 'catalogues'].map(f => (
                               <button key={f} onClick={() => setHistoryFolder(f as any)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left flex items-start gap-4">
                                   <div className="bg-slate-100 p-3 rounded-xl text-slate-600"><Archive size={24} /></div>
                                   <div><h3 className="font-black text-slate-900 uppercase">{f}</h3><p className="text-xs text-slate-500 font-bold">{(storeData.archive as any)?.[f]?.length || 0} Items</p></div>
                               </button>
                           ))}
                       </div>
                    ) : (
                       <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
                           <button onClick={() => setHistoryFolder(null)} className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase"><ArrowLeft size={16} /> Back</button>
                           <h3 className="text-xl font-black text-slate-900 uppercase mb-6 border-b border-slate-100 pb-4">{historyFolder} Archive</h3>
                           {(!storeData.archive || (storeData.archive as any)[historyFolder]?.length === 0) ? <div className="text-center py-12 text-slate-400 italic text-sm">Empty</div> : (storeData.archive as any)[historyFolder].map((item: any, i: number) => (
                               <div key={i} className="p-3 bg-slate-50 mb-2 rounded border border-slate-100 text-sm font-bold text-slate-700">{item.name || item.title || item.product?.name}</div>
                           ))}
                       </div>
                    )}
                 </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-4">
                     <button onClick={() => setShowGuide(true)} className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-colors text-left">
                         <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BookOpen size={24} /></div>
                         <div><h3 className="font-black text-slate-900 uppercase">System Setup Manual</h3><p className="text-xs text-slate-500 font-bold">Installation & SQL Scripts</p></div>
                     </button>
                </div>
            )}
        </main>

        {/* MODALS */}
        {editingProduct && <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-5xl h-full max-h-[90vh]"><ProductEditor product={editingProduct} onSave={(p) => { if (!selectedCategory || !selectedBrand) return; const isNew = !selectedCategory.products.find(x => x.id === p.id); const newCats = selectedBrand.categories.map(c => c.id === selectedCategory.id ? { ...c, products: isNew ? [...c.products, p] : c.products.map(px => px.id === p.id ? p : px) } : c); const newBrands = storeData.brands.map(b => b.id === selectedBrand.id ? { ...b, categories: newCats } : b); onUpdateData({ ...storeData, brands: newBrands }); setSelectedCategory(newCats.find(c => c.id === selectedCategory.id) || null); setEditingProduct(null); }} onCancel={() => setEditingProduct(null)} /></div></div>}
        {editingKiosk && <KioskEditorModal kiosk={editingKiosk} onSave={(k) => { updateFleetMember(k); setEditingKiosk(null); }} onClose={() => setEditingKiosk(null)} />}
        {showGuide && <SetupGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};