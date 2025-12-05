

import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase, checkCloudConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const convertPdfToImages = async (pdfDataUrl: string): Promise<string[]> => {
    try {
        // Dynamic import to prevent build timeouts
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
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <h1 className="text-4xl font-black mb-2 text-center text-slate-900 mt-4 tracking-tight drop-shadow-sm">Admin Hub</h1>
        <p className="text-center text-slate-500 mb-8 font-bold uppercase tracking-widest text-xs">System Control Center</p>
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-30 group-hover:opacity-100 transition duration-200 blur"></div>
            <input
                className="relative w-full p-4 border border-slate-300 rounded-xl focus:outline-none bg-white text-black font-bold tracking-widest placeholder-slate-400 shadow-inner input-depth"
                type="password"
                placeholder="ACCESS KEY"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
            />
          </div>
          <button type="submit" className="w-full p-4 font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-wide shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

const FileUpload = ({ 
  currentUrl, 
  onUpload, 
  label, 
  accept = "image/*", 
  icon = <ImageIcon />,
  helperText = "JPG/PNG up to 10MB",
  isProcessing = false,
  allowMultiple = false
}: { 
  currentUrl?: string, 
  onUpload: (data: string | string[], fileType?: 'image' | 'video' | 'pdf') => void, 
  label: string, 
  accept?: string,
  icon?: React.ReactNode,
  helperText?: string,
  isProcessing?: boolean,
  allowMultiple?: boolean
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [useStorage, setUseStorage] = useState(true); 

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      setLocalProcessing(true);
      setUploadProgress(10); 

      let fileType: 'image' | 'video' | 'pdf' = 'image';
      if (files[0].type.startsWith('video')) fileType = 'video';
      if (files[0].type === 'application/pdf') fileType = 'pdf';

      const uploadSingle = async (file: File): Promise<string> => {
           let url = null;
           if (useStorage) {
               console.log("Attempting Cloud Storage Upload...");
               try {
                  url = await uploadFileToStorage(file);
                  console.log("Cloud Upload Success:", url);
                  return url;
               } catch (storageErr: any) {
                  console.warn("Cloud Upload Failed:", storageErr.message);
                  // SAFETY CHECK: If file is too large for local storage fallback
                  if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                     throw new Error(`Upload Failed: ${storageErr.message}. File is too large for local fallback (Limit 2MB).`);
                  }
               }
           }
           
           console.log("Falling back to Base64 (Small File).");
           return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
           });
      };

      try {
          if (allowMultiple) {
              const results = [];
              for (let i = 0; i < files.length; i++) {
                  setUploadProgress(Math.round(((i + 0.5) / files.length) * 100));
                  const res = await uploadSingle(files[i]);
                  results.push(res);
              }
              setUploadProgress(100);
              onUpload(results, fileType);
          } else {
              const result = await uploadSingle(files[0]);
              setUploadProgress(100);
              onUpload(result, fileType);
          }
      } catch (err: any) {
          console.error("Upload failed", err);
          alert(`${err.message || 'Unknown upload error'}`);
      } finally {
          setTimeout(() => {
              setLocalProcessing(false);
              setUploadProgress(0);
          }, 500);
      }
    }
  };

  const isBusy = isProcessing || localProcessing;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
      </div>
      
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        
        {isBusy && (
            <div 
                className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
            ></div>
        )}

        <div className="w-16 h-16 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative shrink-0 text-slate-300 shadow-inner">
           {isBusy ? (
             <div className="flex flex-col items-center">
                 <Loader2 className="animate-spin text-blue-500 mb-1" size={20} />
                 <span className="text-[8px] font-bold text-blue-600">{uploadProgress}%</span>
             </div>
           ) : currentUrl && !allowMultiple ? (
             accept.includes('video') && (currentUrl.startsWith('data:video') || currentUrl.endsWith('.mp4') || currentUrl.startsWith('http')) ? 
             <Video size={20} className="text-blue-500" /> : 
             accept.includes('pdf') ?
             <FileText size={20} className="text-red-500" /> :
             <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
           ) : (
             icon
           )}
        </div>
        <div className="flex-1 min-w-0">
           <label className={`cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all shadow hover:bg-slate-800 transform hover:-translate-y-0.5 whitespace-nowrap ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={12} />
              {isBusy ? (uploadProgress < 100 ? 'Uploading...' : 'Processing...') : (allowMultiple ? 'Select Files' : 'Select File')}
              <input 
                  type="file" 
                  className="hidden" 
                  accept={accept} 
                  onChange={handleFileChange} 
                  disabled={isBusy} 
                  multiple={allowMultiple}
              />
           </label>
           <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase truncate">{helperText}</p>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, val, onChange, placeholder, isArea = false, half = false }: any) => (
    <div className={`mb-4 ${half ? 'w-full' : ''}`}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
      {isArea ? <textarea value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed shadow-inner font-medium resize-none text-sm" placeholder={placeholder} /> : <input value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm shadow-inner" placeholder={placeholder} />}
    </div>
);

const CatalogueManager = ({ catalogues, onSave, brandId }: { catalogues: Catalogue[], onSave: (c: Catalogue[]) => void, brandId?: string }) => {
    const [localList, setLocalList] = useState(catalogues || []);

    // Sync if props change (e.g. switching brands)
    useEffect(() => {
        setLocalList(catalogues || []);
    }, [catalogues]);

    const addCatalogue = () => {
        setLocalList([...localList, {
            id: generateId('cat'),
            title: 'New Catalogue',
            brandId: brandId, // Link to brand if provided
            pages: [],
            year: new Date().getFullYear(),
            startDate: '',
            endDate: ''
        }]);
    };

    const updateCatalogue = (id: string, updates: Partial<Catalogue>) => {
        setLocalList(localList.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCatalogue = (id: string) => {
        if(confirm("Delete this catalogue?")) {
            setLocalList(localList.filter(c => c.id !== id));
        }
    };

    const handleUpload = async (id: string, data: string | string[], type?: string) => {
        const cat = localList.find(c => c.id === id);
        if(!cat) return;
        
        let newPages = [...cat.pages];
        
        if (type === 'pdf' && typeof data === 'string') {
            const converted = await convertPdfToImages(data);
            newPages = [...newPages, ...converted];
        } else if (Array.isArray(data)) {
            newPages = [...newPages, ...data];
        } else if (typeof data === 'string') {
            newPages.push(data);
        }

        updateCatalogue(id, { pages: newPages });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold uppercase text-slate-500 text-xs tracking-wider">{brandId ? 'Brand Catalogues' : 'Global Pamphlets'}</h3>
                 <button onClick={addCatalogue} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-700 flex items-center gap-2">
                     <Plus size={14} /> Add New
                 </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localList.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <div className="h-40 bg-slate-100 relative group flex items-center justify-center">
                            {cat.pages[0] ? (
                                <img src={cat.pages[0]} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                                <div className="text-slate-300 flex flex-col items-center">
                                    <BookOpen size={32} className="mb-2" />
                                    <span className="text-[10px] font-bold uppercase">No Cover</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => updateCatalogue(cat.id, { pages: [] })} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold uppercase hover:bg-red-600">Clear Pages</button>
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <input 
                                value={cat.title} 
                                onChange={(e) => updateCatalogue(cat.id, { title: e.target.value })}
                                className="w-full font-black text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm"
                                placeholder="Catalogue Title"
                            />
                            
                            {/* Conditional Inputs based on Type */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Always show Year for Brand Catalogues */}
                                <div>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Year</label>
                                    <input 
                                        type="number" 
                                        value={cat.year || new Date().getFullYear()} 
                                        onChange={(e) => updateCatalogue(cat.id, { year: parseInt(e.target.value) })} 
                                        className="w-full text-xs border border-slate-200 rounded p-1" 
                                    />
                                </div>
                                
                                {/* Show Dates mainly for Global Pamphlets or if needed */}
                                <div>
                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Start Date</label>
                                    <input type="date" value={cat.startDate || ''} onChange={(e) => updateCatalogue(cat.id, { startDate: e.target.value })} className="w-full text-xs border border-slate-200 rounded p-1" />
                                </div>
                            </div>
                             
                            {/* Only show End Date for expiration logic */}
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase">End Date (Expiration)</label>
                                <input type="date" value={cat.endDate || ''} onChange={(e) => updateCatalogue(cat.id, { endDate: e.target.value })} className="w-full text-xs border border-slate-200 rounded p-1" />
                            </div>
                            
                            <FileUpload 
                                label="Upload Pages (PDF/Images)" 
                                accept="image/*,application/pdf" 
                                currentUrl={""} 
                                onUpload={(d, t) => handleUpload(cat.id, d, t)} 
                                helperText="PDF Auto-Converts to Images"
                                allowMultiple={true}
                            />

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-bold">{cat.pages.length} Pages</span>
                                <button onClick={() => deleteCatalogue(cat.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-end pt-6">
                <button onClick={() => onSave(localList)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs hover:bg-green-700 shadow-lg flex items-center gap-2">
                    <Save size={16} /> Save Changes
                </button>
            </div>
        </div>
    );
};

const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
    const [draft, setDraft] = useState<Product>({ ...product });
    const [newFeature, setNewFeature] = useState('');
    const [newBoxItem, setNewBoxItem] = useState('');
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

    const addFeature = () => {
        if (newFeature.trim()) {
            setDraft({ ...draft, features: [...draft.features, newFeature.trim()] });
            setNewFeature('');
        }
    };

    const addBoxItem = () => {
        if(newBoxItem.trim()) {
            setDraft({ ...draft, boxContents: [...(draft.boxContents || []), newBoxItem.trim()] });
            setNewBoxItem('');
        }
    };

    const addSpec = () => {
        if (newSpecKey.trim() && newSpecValue.trim()) {
            setDraft({ 
                ...draft, 
                specs: { ...draft.specs, [newSpecKey.trim()]: newSpecValue.trim() } 
            });
            setNewSpecKey('');
            setNewSpecValue('');
        }
    };

    const removeFeature = (index: number) => {
        setDraft({ ...draft, features: draft.features.filter((_, i) => i !== index) });
    };

    const removeBoxItem = (index: number) => {
        setDraft({ ...draft, boxContents: (draft.boxContents || []).filter((_, i) => i !== index) });
    };

    const removeSpec = (key: string) => {
        const newSpecs = { ...draft.specs };
        delete newSpecs[key];
        setDraft({ ...draft, specs: newSpecs });
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
                        <InputField label="Product Name" val={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Super Widget X" />
                        <InputField label="SKU (Stock Keeping Unit)" val={draft.sku || ''} onChange={(e: any) => setDraft({ ...draft, sku: e.target.value })} placeholder="e.g. SWX-2024-001" />
                        <InputField label="Description" isArea val={draft.description} onChange={(e: any) => setDraft({ ...draft, description: e.target.value })} placeholder="Product summary..." />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Width" val={draft.dimensions.width} onChange={(e: any) => setDraft({ ...draft, dimensions: { ...draft.dimensions, width: e.target.value } })} placeholder="e.g. 10cm" half />
                            <InputField label="Height" val={draft.dimensions.height} onChange={(e: any) => setDraft({ ...draft, dimensions: { ...draft.dimensions, height: e.target.value } })} placeholder="e.g. 20cm" half />
                            <InputField label="Depth" val={draft.dimensions.depth} onChange={(e: any) => setDraft({ ...draft, dimensions: { ...draft.dimensions, depth: e.target.value } })} placeholder="e.g. 5cm" half />
                            <InputField label="Weight" val={draft.dimensions.weight} onChange={(e: any) => setDraft({ ...draft, dimensions: { ...draft.dimensions, weight: e.target.value } })} placeholder="e.g. 0.5kg" half />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <FileUpload label="Main Image" currentUrl={draft.imageUrl} onUpload={(url) => setDraft({ ...draft, imageUrl: url as string })} />
                        <FileUpload label="Product Video (Optional)" currentUrl={draft.videoUrl} accept="video/*" icon={<Video />} onUpload={(url) => setDraft({ ...draft, videoUrl: url as string })} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Key Features</label>
                                 <div className="flex gap-2 mb-2">
                                     <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-sm" placeholder="Add feature..." onKeyDown={(e) => e.key === 'Enter' && addFeature()} />
                                     <button onClick={addFeature} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={16} /></button>
                                 </div>
                                 <ul className="space-y-1">
                                     {draft.features.map((f, i) => (
                                         <li key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs font-bold text-slate-700">
                                             {f}
                                             <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                                         </li>
                                     ))}
                                 </ul>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                 <label className="block text-[10px] font-black text-orange-600 uppercase tracking-wider mb-2">What's in the Box</label>
                                 <div className="flex gap-2 mb-2">
                                     <input type="text" value={newBoxItem} onChange={(e) => setNewBoxItem(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-sm" placeholder="Add item..." onKeyDown={(e) => e.key === 'Enter' && addBoxItem()} />
                                     <button onClick={addBoxItem} className="p-2 bg-orange-500 text-white rounded-lg"><Plus size={16} /></button>
                                 </div>
                                 <ul className="space-y-1">
                                     {(draft.boxContents || []).map((item, i) => (
                                         <li key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-xs font-bold text-slate-700">
                                             {item}
                                             <button onClick={() => removeBoxItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                                         </li>
                                     ))}
                                 </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 border-t border-slate-100 pt-8">
                     <h4 className="font-bold text-slate-900 uppercase text-sm mb-4">Manuals & Terms</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Warranty & Terms" isArea val={draft.terms} onChange={(e: any) => setDraft({ ...draft, terms: e.target.value })} placeholder="Warranty details..." />
                        <div>
                             <FileUpload 
                                label="Product Manual (PDF)" 
                                accept="application/pdf"
                                icon={<FileText />}
                                currentUrl={draft.manualUrl} 
                                onUpload={async (url, type) => {
                                    if(type === 'pdf' && typeof url === 'string') {
                                        // Auto convert
                                        const pages = await convertPdfToImages(url);
                                        setDraft({ ...draft, manualUrl: url, manualImages: pages });
                                    }
                                }} 
                                helperText="PDF Auto-Converts to Flipbook"
                            />
                            {draft.manualImages && draft.manualImages.length > 0 && (
                                <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                                    <Check size={12} /> {draft.manualImages.length} Pages Generated
                                </div>
                            )}
                        </div>
                     </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-8">
                     <h4 className="font-bold text-slate-900 uppercase text-sm mb-4">Technical Specifications</h4>
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                         {/* Input Row */}
                         <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Spec Name</label>
                                <input 
                                    value={newSpecKey}
                                    onChange={(e) => setNewSpecKey(e.target.value)}
                                    placeholder="e.g. Battery Life"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold"
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Value</label>
                                <input 
                                    value={newSpecValue}
                                    onChange={(e) => setNewSpecValue(e.target.value)}
                                    placeholder="e.g. 24 Hours"
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold"
                                    onKeyDown={(e) => e.key === 'Enter' && addSpec()}
                                />
                            </div>
                            <button onClick={addSpec} className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto flex justify-center"><Plus size={18} /></button>
                         </div>

                         {/* List */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {Object.entries(draft.specs).map(([key, value]) => (
                                 <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                     <div>
                                         <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                                         <span className="block text-sm font-black text-slate-900">{value}</span>
                                     </div>
                                     <button onClick={() => removeSpec(key)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                                 </div>
                             ))}
                             {Object.keys(draft.specs).length === 0 && (
                                 <div className="col-span-full text-center text-slate-400 text-xs py-4 italic">No specs added yet.</div>
                             )}
                         </div>
                     </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-4 shrink-0">
                <button onClick={onCancel} className="px-6 py-3 font-bold text-slate-500 uppercase text-xs hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                <button onClick={() => onSave(draft)} className="px-6 py-3 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg hover:bg-blue-700 shadow-lg transition-all transform hover:-translate-y-1">Save Changes</button>
            </div>
        </div>
    );
};

const DataManagerModal = ({ storeData, onImport, onClose }: { storeData: StoreData, onImport: (d: StoreData) => void, onClose: () => void }) => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (confirm("This will overwrite current store data. Continue?")) {
                    onImport(json);
                }
            } catch (err) {
                alert("Invalid JSON file");
            }
        };
        reader.readAsText(file);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(storeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `store_data_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 uppercase">Data Manager</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <button onClick={handleDownload} className="w-full bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-center gap-3 text-blue-700 font-bold hover:bg-blue-100 transition-colors">
                        <Download size={20} /> Export Backup (JSON)
                    </button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500 font-bold">Or</span>
                        </div>
                    </div>

                    <label className="w-full bg-slate-50 border-2 border-dashed border-slate-300 p-8 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors">
                        <Upload size={32} />
                        <span className="font-bold text-xs uppercase">Import JSON Backup</span>
                        <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
        </div>
    );
};

const BrandImportModal = ({ brand, onImport, onClose }: { brand: Brand, onImport: (d: any) => void, onClose: () => void }) => (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg p-8 text-center shadow-2xl">
            <h3 className="font-black text-slate-900 uppercase mb-4">Bulk Import for {brand.name}</h3>
            <p className="text-slate-500 text-sm mb-6">Use Bulk Importer in System Data to import full folder structures.</p>
            <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs">Close</button>
        </div>
    </div>
);

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
                    <InputField label="Name" val={draft.name} onChange={(e:any) => setDraft({...draft, name: e.target.value})} />
                    <InputField label="Zone" val={draft.assignedZone || ''} onChange={(e:any) => setDraft({...draft, assignedZone: e.target.value})} />
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold uppercase text-xs">Cancel</button>
                    <button onClick={() => onSave(draft)} className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg">Save</button>
                </div>
            </div>
        </div>
    );
};

const CameraViewerModal = ({ kiosk, onClose, onRequestSnapshot }: { kiosk: KioskRegistry, onClose: () => void, onRequestSnapshot: (k: KioskRegistry) => void }) => (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
        <div className="bg-black border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <h3 className="font-bold text-white uppercase tracking-wider">{kiosk.name} (Live)</h3>
                <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative group">
                {kiosk.snapshotUrl ? <img src={kiosk.snapshotUrl} className="w-full h-full object-contain" /> : <WifiOff size={48} className="text-slate-700" />}
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                <button onClick={() => onRequestSnapshot(kiosk)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2"><RefreshCw size={14}/> Request Snapshot</button>
            </div>
        </div>
    </div>
);

// --- MAIN DASHBOARD COMPONENT ---
export const AdminDashboard = ({ onExit, storeData, onUpdateData, onRefresh }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [session, setSession] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  
  // NAVIGATION STATE - HEADER TABS ONLY (NO SIDEBAR)
  const [activeTab, setActiveTab] = useState<'inventory' | 'marketing' | 'screensaver' | 'fleet' | 'history' | 'settings'>('inventory');
  const [activeSubTab, setActiveSubTab] = useState<string>('brands'); 

  // Selection State
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modals
  const [showDataMgr, setShowDataMgr] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBrandImport, setShowBrandImport] = useState(false);
  
  // Fleet Modals
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [viewingCamera, setViewingCamera] = useState<KioskRegistry | null>(null);

  // History State
  const [historyFolder, setHistoryFolder] = useState<'brands' | 'products' | 'catalogues' | null>(null);

  useEffect(() => {
      // Check for real cloud connection status on mount
      checkCloudConnection().then(setIsCloudConnected);
      const interval = setInterval(() => {
          checkCloudConnection().then(setIsCloudConnected);
      }, 60000);
      return () => clearInterval(interval);
  }, []);

  // Reset Subtabs on main tab change
  useEffect(() => {
     if(activeTab === 'marketing') setActiveSubTab('hero');
     if(activeTab === 'screensaver') setActiveSubTab('config');
     if(activeTab === 'inventory') setActiveSubTab('brands');
  }, [activeTab]);

  if (!session) return <Auth setSession={setSession} />;
  if (!storeData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading Data...</div>;

  // --- CRUD HELPERS ---
  const addBrand = () => {
      const name = prompt("Enter Brand Name:");
      if (!name) return;
      const newBrand: Brand = { id: generateId('b'), name, categories: [], logoUrl: '' };
      onUpdateData({ ...storeData, brands: [...storeData.brands, newBrand] });
  };
  
  const updateBrand = (updated: Brand) => {
      const newBrands = storeData.brands.map(b => b.id === updated.id ? updated : b);
      onUpdateData({ ...storeData, brands: newBrands });
      if (selectedBrand?.id === updated.id) setSelectedBrand(updated);
  };

  const softDeleteBrand = (id: string) => {
      if(!confirm("Move this brand to Archive?")) return;
      const brand = storeData.brands.find(b => b.id === id);
      if(!brand) return;
      const newBrands = storeData.brands.filter(b => b.id !== id);
      const newArchive: ArchiveData = {
          ...storeData.archive,
          brands: [...(storeData.archive?.brands || []), brand],
          products: storeData.archive?.products || [],
          catalogues: storeData.archive?.catalogues || [],
          deletedAt: { ...storeData.archive?.deletedAt, [brand.id]: new Date().toISOString() }
      };
      onUpdateData({ ...storeData, brands: newBrands, archive: newArchive });
      setSelectedBrand(null);
  };

  const softDeleteProduct = (productId: string, categoryId: string, brandId: string) => {
      if(!confirm("Move product to Archive?")) return;
      const brand = storeData.brands.find(b => b.id === brandId);
      if(!brand) return;
      const cat = brand.categories.find(c => c.id === categoryId);
      if(!cat) return;
      const product = cat.products.find(p => p.id === productId);
      if(!product) return;

      const newProds = cat.products.filter(p => p.id !== productId);
      const newCat = { ...cat, products: newProds };
      const newCats = brand.categories.map(c => c.id === newCat.id ? newCat : c);
      const newBrands = storeData.brands.map(b => b.id === brandId ? { ...b, categories: newCats } : b);

      const newArchive: ArchiveData = {
          ...storeData.archive,
          brands: storeData.archive?.brands || [],
          products: [...(storeData.archive?.products || []), { product, originalBrand: brand.name, originalCategory: cat.name }],
          catalogues: storeData.archive?.catalogues || [],
          deletedAt: { ...storeData.archive?.deletedAt, [product.id]: new Date().toISOString() }
      };
      onUpdateData({ ...storeData, brands: newBrands, archive: newArchive });
      setSelectedCategory(newCat);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
        
        {/* === HEADER TABS (LEVEL 1) === */}
        <header className="bg-slate-900 text-white shrink-0 shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Settings className="text-blue-500" size={24} />
                     <div>
                         <h1 className="text-lg font-black uppercase tracking-widest leading-none">Admin Hub</h1>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">System Control</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg">
                         {isCloudConnected ? <Cloud size={14} className="text-blue-400" /> : <HardDrive size={14} className="text-orange-400" />}
                         <span className="text-[10px] font-bold uppercase text-slate-400">{isCloudConnected ? 'Cloud Online' : 'Local Only'}</span>
                     </div>
                     <button onClick={onRefresh} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white" title="Sync">
                         <RefreshCw size={16} />
                     </button>
                     <button onClick={onExit} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded-lg transition-colors" title="Exit">
                         <LogOut size={16} />
                     </button>
                 </div>
            </div>

            {/* Scrollable Horizontal Tabs - NO SIDEBAR */}
            <div className="flex overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('inventory')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'inventory' ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Inventory</button>
                <button onClick={() => setActiveTab('marketing')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'marketing' ? 'border-purple-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Marketing</button>
                <button onClick={() => setActiveTab('screensaver')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'screensaver' ? 'border-green-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Screensaver</button>
                <button onClick={() => setActiveTab('fleet')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'fleet' ? 'border-orange-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Fleet</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'history' ? 'border-slate-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>History</button>
                <button onClick={() => setActiveTab('settings')} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === 'settings' ? 'border-slate-300 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>System</button>
            </div>
        </header>

        {/* === SUB-HEADER TABS (LEVEL 2) - CONTEXT AWARE === */}
        {activeTab === 'marketing' && (
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm z-10">
                <button onClick={() => setActiveSubTab('hero')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'hero' ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}>Hero Banner</button>
                <button onClick={() => setActiveSubTab('ads')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'ads' ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'}`}>Ad Zones</button>
                <button onClick={() => setActiveSubTab('catalogues')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'catalogues' ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'} flex items-center gap-2`}>
                   <BookOpen size={14} /> Pamphlets & Catalogues
                </button>
            </div>
        )}

        {activeTab === 'screensaver' && (
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm z-10">
                <button onClick={() => setActiveSubTab('config')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'config' ? 'text-green-600 bg-green-50' : 'text-slate-500 hover:bg-slate-50'}`}>Configuration</button>
            </div>
        )}

        {/* === MAIN CONTENT AREA === */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            
            {/* INVENTORY */}
            {activeTab === 'inventory' && (
                !selectedBrand ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                       <button onClick={addBrand} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all group min-h-[200px]">
                           <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mb-4 transition-colors"><Plus size={24} /></div>
                           <span className="font-bold uppercase text-xs tracking-wider">Add Brand</span>
                       </button>
                       {storeData.brands.map(brand => (
                           <div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group relative">
                               <div className="h-32 bg-slate-50 flex items-center justify-center p-4 relative">
                                   {brand.logoUrl ? <img src={brand.logoUrl} className="max-h-full max-w-full object-contain" alt={brand.name} /> : <span className="text-4xl font-black text-slate-200">{brand.name.charAt(0)}</span>}
                                   <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={(e) => { e.stopPropagation(); softDeleteBrand(brand.id); }} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"><Trash2 size={14} /></button>
                                   </div>
                               </div>
                               <div className="p-4">
                                   <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-1">{brand.name}</h3>
                                   <p className="text-xs text-slate-500 font-bold mb-4">{brand.categories.length} Categories</p>
                                   <div className="flex gap-2">
                                       <button onClick={() => setSelectedBrand(brand)} className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-bold text-xs uppercase hover:bg-blue-600 transition-colors">Manage</button>
                                       <button onClick={() => { setSelectedBrand(brand); setShowBrandImport(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200" title="Bulk Import"><FolderInput size={16}/></button>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : !selectedCategory ? (
                   <div className="animate-fade-in">
                       <div className="flex items-center gap-4 mb-6">
                           <button onClick={() => setSelectedBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900"><ArrowLeft size={20} /></button>
                           <div className="flex-1">
                               <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{selectedBrand.name}</h2>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Manage Categories</p>
                           </div>
                           <FileUpload label="Brand Logo" currentUrl={selectedBrand.logoUrl} onUpload={(url) => updateBrand({...selectedBrand, logoUrl: url as string})} />
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                           <button onClick={() => {
                               const name = prompt("Category Name:");
                               if(name) {
                                   const newCat: Category = { id: generateId('c'), name, icon: 'Box', products: [] };
                                   updateBrand({ ...selectedBrand, categories: [...selectedBrand.categories, newCat] });
                               }
                           }} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all min-h-[150px]">
                               <Plus size={24} className="mb-2" />
                               <span className="font-bold text-xs uppercase">New Category</span>
                           </button>
                           {selectedBrand.categories.map(cat => (
                               <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group relative">
                                   <div className="mb-4 text-slate-400 group-hover:text-blue-500 transition-colors"><Box size={24} /></div>
                                   <h3 className="font-black text-slate-900 uppercase text-sm mb-1">{cat.name}</h3>
                                   <p className="text-xs text-slate-500 font-bold">{cat.products.length} Products</p>
                                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm("Delete category?")) {
                                                updateBrand({ ...selectedBrand, categories: selectedBrand.categories.filter(c => c.id !== cat.id) });
                                            }
                                        }} className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded"><Trash2 size={14} /></div>
                                   </div>
                               </button>
                           ))}
                       </div>

                       {/* BRAND CATALOGUES SECTION */}
                       <div className="mt-8 border-t border-slate-200 pt-8">
                           <h3 className="font-bold text-slate-900 uppercase text-sm mb-4">Brand Catalogues</h3>
                           <CatalogueManager 
                               catalogues={storeData.catalogues?.filter(c => c.brandId === selectedBrand.id) || []}
                               brandId={selectedBrand.id}
                               onSave={(updatedBrandCats) => {
                                   // 1. Filter out old versions of THIS brand's catalogues
                                   const otherCatalogues = storeData.catalogues?.filter(c => c.brandId !== selectedBrand.id) || [];
                                   // 2. Merge updated brand catalogues with the rest
                                   const newGlobalList = [...otherCatalogues, ...updatedBrandCats];
                                   onUpdateData({ ...storeData, catalogues: newGlobalList });
                               }}
                           />
                       </div>
                   </div>
               ) : (
                   <div className="animate-fade-in h-full flex flex-col">
                       <div className="flex items-center gap-4 mb-6 shrink-0">
                           <button onClick={() => setSelectedCategory(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900"><ArrowLeft size={20} /></button>
                           <div className="flex-1">
                               <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{selectedCategory.name}</h2>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{selectedBrand.name}</p>
                           </div>
                           <button onClick={() => setEditingProduct({
                               id: generateId('p'),
                               name: '',
                               description: '',
                               specs: {},
                               features: [],
                               boxContents: [],
                               dimensions: { width: '', height: '', depth: '', weight: '' },
                               imageUrl: '',
                               galleryUrls: [],
                               videoUrl: '',
                               manualUrl: '',
                               manualImages: []
                           } as Product)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold uppercase text-xs shadow-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={16} /> Add Product</button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20">
                           {selectedCategory.products.map(product => (
                               <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                                   <div className="aspect-square bg-slate-50 relative">
                                       {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-contain p-4" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Box size={32} /></div>}
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                           <button onClick={() => setEditingProduct(product)} className="p-2 bg-white text-blue-600 rounded-lg font-bold text-xs uppercase shadow-lg hover:bg-blue-50">Edit</button>
                                           <button onClick={() => softDeleteProduct(product.id, selectedCategory.id, selectedBrand.id)} className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50"><Trash2 size={16} /></button>
                                       </div>
                                   </div>
                                   <div className="p-4">
                                       <h4 className="font-bold text-slate-900 text-sm truncate uppercase">{product.name}</h4>
                                       <p className="text-xs text-slate-500 font-mono">{product.sku || 'No SKU'}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )
            )}

            {/* MARKETING TAB (Hero, Ads, Pamphlets) */}
            {activeTab === 'marketing' && (
                <div className="max-w-5xl mx-auto">
                    {activeSubTab === 'catalogues' && (
                        <CatalogueManager 
                            catalogues={storeData.catalogues || []}
                            onSave={(c) => onUpdateData({ ...storeData, catalogues: c })}
                        />
                    )}
                    
                    {activeSubTab === 'hero' && (
                       <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                           <h3 className="text-lg font-black text-slate-900 uppercase mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">Hero Section</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-4">
                                   <InputField label="Hero Title" val={storeData.hero.title} onChange={(e:any) => onUpdateData({...storeData, hero: {...storeData.hero, title: e.target.value}})} />
                                   <InputField label="Hero Subtitle" val={storeData.hero.subtitle} onChange={(e:any) => onUpdateData({...storeData, hero: {...storeData.hero, subtitle: e.target.value}})} />
                                   <InputField label="Website URL" val={storeData.hero.websiteUrl} onChange={(e:any) => onUpdateData({...storeData, hero: {...storeData.hero, websiteUrl: e.target.value}})} />
                               </div>
                               <div className="space-y-4">
                                   <FileUpload label="Background Image" currentUrl={storeData.hero.backgroundImageUrl} onUpload={(url) => onUpdateData({...storeData, hero: {...storeData.hero, backgroundImageUrl: url as string}})} />
                                   <FileUpload label="Logo Image" currentUrl={storeData.hero.logoUrl} onUpload={(url) => onUpdateData({...storeData, hero: {...storeData.hero, logoUrl: url as string}})} />
                               </div>
                           </div>
                           <div className="mt-4 flex justify-end">
                               <button onClick={() => onUpdateData(storeData)} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs shadow-lg">Save Hero</button>
                           </div>
                       </div>
                    )}

                    {activeSubTab === 'ads' && (
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <h4 className="font-bold uppercase text-xs mb-4">Bottom Left</h4>
                              <FileUpload label="Upload Image/Video" accept="image/*,video/*" allowMultiple onUpload={(urls, type) => {
                                  const newAds = Array.isArray(urls) ? urls.map(u => ({ id: generateId('ad'), type, url: u })) : [{ id: generateId('ad'), type, url: urls }];
                                  const updated = [...(storeData.ads?.homeBottomLeft || []), ...newAds] as AdItem[];
                                  onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeBottomLeft: updated } });
                              }} currentUrl="" />
                              <div className="space-y-2 mt-4">
                                  {storeData.ads?.homeBottomLeft.map(ad => (
                                      <div key={ad.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                          <span className="text-[10px] font-bold uppercase text-slate-500">{ad.type}</span>
                                          <button onClick={() => onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeBottomLeft: storeData.ads!.homeBottomLeft.filter(a => a.id !== ad.id) } })} className="text-red-400"><Trash2 size={12} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <h4 className="font-bold uppercase text-xs mb-4">Bottom Right</h4>
                              <FileUpload label="Upload Image/Video" accept="image/*,video/*" allowMultiple onUpload={(urls, type) => {
                                  const newAds = Array.isArray(urls) ? urls.map(u => ({ id: generateId('ad'), type, url: u })) : [{ id: generateId('ad'), type, url: urls }];
                                  const updated = [...(storeData.ads?.homeBottomRight || []), ...newAds] as AdItem[];
                                  onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeBottomRight: updated } });
                              }} currentUrl="" />
                              <div className="space-y-2 mt-4">
                                  {storeData.ads?.homeBottomRight.map(ad => (
                                      <div key={ad.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                          <span className="text-[10px] font-bold uppercase text-slate-500">{ad.type}</span>
                                          <button onClick={() => onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeBottomRight: storeData.ads!.homeBottomRight.filter(a => a.id !== ad.id) } })} className="text-red-400"><Trash2 size={12} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                              <h4 className="font-bold uppercase text-xs mb-4">Side Vertical</h4>
                              <FileUpload label="Upload Image/Video" accept="image/*,video/*" allowMultiple onUpload={(urls, type) => {
                                  const newAds = Array.isArray(urls) ? urls.map(u => ({ id: generateId('ad'), type, url: u })) : [{ id: generateId('ad'), type, url: urls }];
                                  const updated = [...(storeData.ads?.homeSideVertical || []), ...newAds] as AdItem[];
                                  onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeSideVertical: updated } });
                              }} currentUrl="" />
                              <div className="space-y-2 mt-4">
                                  {storeData.ads?.homeSideVertical.map(ad => (
                                      <div key={ad.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                          <span className="text-[10px] font-bold uppercase text-slate-500">{ad.type}</span>
                                          <button onClick={() => onUpdateData({ ...storeData, ads: { ...storeData.ads!, homeSideVertical: storeData.ads!.homeSideVertical.filter(a => a.id !== ad.id) } })} className="text-red-400"><Trash2 size={12} /></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                       </div>
                    )}
                </div>
            )}

            {/* SCREENSAVER TAB */}
            {activeTab === 'screensaver' && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold text-slate-900 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Screensaver Configuration</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                             <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Idle Timeout (Seconds)</label>
                                 <input type="number" value={storeData.screensaverSettings?.idleTimeout || 60} onChange={(e) => onUpdateData({ ...storeData, screensaverSettings: { ...storeData.screensaverSettings!, idleTimeout: parseInt(e.target.value) } })} className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold" />
                             </div>
                             <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Image Slide Duration (Seconds)</label>
                                 <input type="number" value={storeData.screensaverSettings?.imageDuration || 8} onChange={(e) => onUpdateData({ ...storeData, screensaverSettings: { ...storeData.screensaverSettings!, imageDuration: parseInt(e.target.value) } })} className="w-full p-3 border border-slate-300 rounded-xl text-sm font-bold" />
                             </div>
                         </div>
                         <div className="space-y-2">
                             {[
                                 { key: 'showProductImages', label: 'Show Product Images' },
                                 { key: 'showProductVideos', label: 'Show Product Videos' },
                                 { key: 'showPamphlets', label: 'Show Pamphlets' },
                                 { key: 'showCustomAds', label: 'Show Custom Ads' },
                                 { key: 'muteVideos', label: 'Mute Videos' }
                             ].map((opt) => (
                                 <div key={opt.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                     <span className="text-xs font-bold uppercase text-slate-700">{opt.label}</span>
                                     <button 
                                        onClick={() => onUpdateData({ ...storeData, screensaverSettings: { ...storeData.screensaverSettings!, [opt.key]: !(storeData.screensaverSettings as any)[opt.key] } })}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${ (storeData.screensaverSettings as any)[opt.key] ? 'bg-green-500' : 'bg-slate-300' }`}
                                     >
                                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${ (storeData.screensaverSettings as any)[opt.key] ? 'translate-x-6' : '' }`}></div>
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                     <div className="mt-8 pt-8 border-t border-slate-100">
                          <h4 className="font-bold text-slate-900 uppercase text-xs mb-4">Custom Screensaver Media</h4>
                          <FileUpload label="Upload Slides/Videos" allowMultiple accept="image/*,video/*" currentUrl="" onUpload={(urls, type) => {
                              const newAds = Array.isArray(urls) ? urls.map(u => ({ id: generateId('ss'), type, url: u })) : [{ id: generateId('ss'), type, url: urls }];
                              const updated = [...(storeData.ads?.screensaver || []), ...newAds] as AdItem[];
                              onUpdateData({ ...storeData, ads: { ...storeData.ads!, screensaver: updated } });
                          }} />
                          <div className="grid grid-cols-4 gap-2 mt-4">
                              {storeData.ads?.screensaver.map(ad => (
                                  <div key={ad.id} className="relative aspect-video bg-black rounded overflow-hidden group">
                                      {ad.type === 'video' ? <video src={ad.url} className="w-full h-full object-cover opacity-50" /> : <img src={ad.url} className="w-full h-full object-cover opacity-50" />}
                                      <button onClick={() => onUpdateData({ ...storeData, ads: { ...storeData.ads!, screensaver: storeData.ads!.screensaver.filter(a => a.id !== ad.id) } })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                  </div>
                              ))}
                          </div>
                     </div>
                     <div className="mt-4 flex justify-end">
                        <button onClick={() => onUpdateData(storeData)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold uppercase text-xs shadow-lg">Save Config</button>
                     </div>
                </div>
            )}

            {/* FLEET TAB */}
            {activeTab === 'fleet' && (
                <div className="animate-fade-in max-w-6xl mx-auto">
                   <h2 className="text-2xl font-black text-slate-900 uppercase mb-6">Device Fleet</h2>
                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                               <tr>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Name</th>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Type</th>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Last Seen</th>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Zone</th>
                                   <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                               </tr>
                           </thead>
                           <tbody>
                               {storeData.fleet?.map(kiosk => {
                                   const isOnline = (new Date().getTime() - new Date(kiosk.last_seen).getTime()) < 120000; // 2 mins
                                   return (
                                       <tr key={kiosk.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                           <td className="p-4">
                                               <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit text-[10px] font-bold uppercase ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                   <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                   {isOnline ? 'Online' : 'Offline'}
                                               </div>
                                           </td>
                                           <td className="p-4 font-bold text-slate-700 text-sm">{kiosk.name} <span className="block text-[10px] font-mono text-slate-400 font-normal">{kiosk.id}</span></td>
                                           <td className="p-4">
                                               {kiosk.deviceType === 'mobile' ? (
                                                   <div className="flex items-center gap-2 text-purple-600 font-bold uppercase text-xs" title="Personal Mobile">
                                                       <Smartphone size={16} /> <span>Mobile</span>
                                                   </div>
                                               ) : (
                                                   <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-xs" title="Kiosk Display">
                                                       <Tablet size={16} /> <span>Kiosk</span>
                                                   </div>
                                               )}
                                           </td>
                                           <td className="p-4 text-xs font-mono text-slate-500">{new Date(kiosk.last_seen).toLocaleTimeString()}</td>
                                           <td className="p-4 text-xs font-bold text-slate-600">{kiosk.assignedZone || '-'}</td>
                                           <td className="p-4 flex gap-2">
                                               <button onClick={() => setEditingKiosk(kiosk)} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                               <button onClick={() => setViewingCamera(kiosk)} className="p-2 bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-600 rounded-lg transition-colors" disabled={kiosk.deviceType === 'mobile'} title={kiosk.deviceType === 'mobile' ? 'No Camera' : 'View Camera'}><Camera size={14} /></button>
                                               <button onClick={() => {
                                                    const fleet = storeData.fleet?.map(k => k.id === kiosk.id ? { ...k, restartRequested: true } : k);
                                                    onUpdateData({ ...storeData, fleet });
                                                    alert("Restart command queued.");
                                               }} className="p-2 bg-slate-100 hover:bg-orange-100 text-slate-500 hover:text-orange-600 rounded-lg transition-colors"><Power size={14} /></button>
                                               <button onClick={() => {
                                                   if(confirm("Remove this device from fleet?")) {
                                                       const fleet = storeData.fleet?.filter(k => k.id !== kiosk.id);
                                                       onUpdateData({ ...storeData, fleet });
                                                   }
                                               }} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
                </div>
            )}
            
            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                 <div className="animate-fade-in max-w-6xl mx-auto">
                    {!historyFolder ? (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <button onClick={() => setHistoryFolder('brands')} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left flex items-start gap-4">
                               <div className="bg-red-50 p-3 rounded-xl text-red-600"><Trash2 size={24} /></div>
                               <div>
                                   <h3 className="font-black text-slate-900 uppercase">Deleted Brands</h3>
                                   <p className="text-xs text-slate-500 font-bold mt-1">{storeData.archive?.brands?.length || 0} Items</p>
                               </div>
                           </button>
                           <button onClick={() => setHistoryFolder('products')} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left flex items-start gap-4">
                               <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Package size={24} /></div>
                               <div>
                                   <h3 className="font-black text-slate-900 uppercase">Deleted Products</h3>
                                   <p className="text-xs text-slate-500 font-bold mt-1">{storeData.archive?.products?.length || 0} Items</p>
                               </div>
                           </button>
                           <button onClick={() => setHistoryFolder('catalogues')} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left flex items-start gap-4">
                               <div className="bg-slate-100 p-3 rounded-xl text-slate-600"><Clock size={24} /></div>
                               <div>
                                   <h3 className="font-black text-slate-900 uppercase">Expired Catalogues</h3>
                                   <p className="text-xs text-slate-500 font-bold mt-1">{storeData.archive?.catalogues?.length || 0} Items</p>
                               </div>
                           </button>
                       </div>
                    ) : (
                       <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
                           <button onClick={() => setHistoryFolder(null)} className="mb-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase"><ArrowLeft size={16} /> Back to Archive Root</button>
                           <h3 className="text-xl font-black text-slate-900 uppercase mb-6 border-b border-slate-100 pb-4">{historyFolder} Archive</h3>
                           <div className="space-y-2">
                               {historyFolder === 'brands' && storeData.archive?.brands?.map((b) => (
                                   <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                       <div className="font-bold text-slate-900 text-sm">{b.name}</div>
                                       <div className="text-[10px] text-slate-400 font-mono">Deleted: {storeData.archive?.deletedAt?.[b.id] || 'Unknown'}</div>
                                   </div>
                               ))}
                               {(!storeData.archive || (storeData.archive as any)[historyFolder]?.length === 0) && (
                                   <div className="text-center py-12 text-slate-400 italic text-sm">Folder is empty.</div>
                               )}
                           </div>
                       </div>
                    )}
                 </div>
            )}
            
            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-4">
                     <button onClick={() => setShowDataMgr(true)} className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-colors text-left">
                         <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Database size={24} /></div>
                         <div>
                             <h3 className="font-black text-slate-900 uppercase">Data Manager</h3>
                             <p className="text-xs text-slate-500 font-bold">Import/Export JSON Backups</p>
                         </div>
                     </button>
                     <button onClick={() => setShowGuide(true)} className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-colors text-left">
                         <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BookOpen size={24} /></div>
                         <div>
                             <h3 className="font-black text-slate-900 uppercase">Setup Guide</h3>
                             <p className="text-xs text-slate-500 font-bold">Installation Instructions & SQL</p>
                         </div>
                     </button>
                </div>
            )}

        </main>

        {/* MODALS */}
        {editingProduct && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-5xl h-full max-h-[90vh]">
                    <ProductEditor 
                        product={editingProduct} 
                        onSave={(updatedProduct: Product) => {
                            if (!selectedCategory || !selectedBrand) return;
                            const isNew = !selectedCategory.products.find(p => p.id === updatedProduct.id);
                            let newProducts = isNew ? [...selectedCategory.products, updatedProduct] : selectedCategory.products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
                            const newCategory = { ...selectedCategory, products: newProducts };
                            const newCategories = selectedBrand.categories.map(c => c.id === newCategory.id ? newCategory : c);
                            updateBrand({ ...selectedBrand, categories: newCategories });
                            setSelectedCategory(newCategory); 
                            setEditingProduct(null);
                        }}
                        onCancel={() => setEditingProduct(null)}
                    />
                </div>
            </div>
        )}

        {showDataMgr && <DataManagerModal storeData={storeData} onImport={(d) => { onUpdateData(d); setShowDataMgr(false); }} onClose={() => setShowDataMgr(false)} />}
        {showGuide && <SetupGuide onClose={() => setShowGuide(false)} />}
        {showBrandImport && selectedBrand && <BrandImportModal brand={selectedBrand} onImport={(d) => { if(d.brands) onUpdateData({ ...storeData, brands: d.brands }); setShowBrandImport(false); }} onClose={() => setShowBrandImport(false)} />}
        {editingKiosk && <KioskEditorModal kiosk={editingKiosk} onSave={(k) => { 
            const fleet = storeData.fleet?.map(item => item.id === k.id ? k : item);
            onUpdateData({ ...storeData, fleet });
            setEditingKiosk(null);
        }} onClose={() => setEditingKiosk(null)} />}
        {viewingCamera && <CameraViewerModal kiosk={viewingCamera} onClose={() => setViewingCamera(null)} onRequestSnapshot={(k) => {
            const fleet = storeData.fleet?.map(item => item.id === k.id ? { ...item, requestSnapshot: true } : item);
            onUpdateData({ ...storeData, fleet });
        }} />}

    </div>
  );
};