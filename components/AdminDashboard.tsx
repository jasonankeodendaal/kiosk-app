
import React, { useState, useEffect } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, ChevronLeft, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, FolderArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck, Ruler, SaveAll, Pencil, Moon, Sun, MonitorSmartphone, LayoutGrid, Music, Share2, Rewind, Tv
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData, DimensionSet, Manual, TVBrand, TVConfig } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase, checkCloudConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// PDF Conversion removed/minimized in favor of direct image upload per user request
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

// Updated FileUpload to always return Base64 for local processing if needed
const FileUpload = ({ currentUrl, onUpload, label, accept = "image/*", icon = <ImageIcon />, allowMultiple = false }: any) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsProcessing(true);
      setUploadProgress(10); 
      const files = Array.from(e.target.files) as File[];
      let fileType = files[0].type.startsWith('video') ? 'video' : files[0].type === 'application/pdf' ? 'pdf' : files[0].type.startsWith('audio') ? 'audio' : 'image';

      const readFileAsBase64 = (file: File): Promise<string> => {
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
          });
      };

      const uploadSingle = async (file: File) => {
           // Always get local base64 first (useful for PDF conversion locally)
           const localBase64 = await readFileAsBase64(file);
           
           try {
              const url = await uploadFileToStorage(file);
              return { url, base64: localBase64 };
           } catch (e) {
              return { url: localBase64, base64: localBase64 };
           }
      };

      try {
          if (allowMultiple) {
              const results: string[] = [];
              const base64s: string[] = [];
              for(let i=0; i<files.length; i++) {
                  const res = await uploadSingle(files[i]);
                  results.push(res.url);
                  base64s.push(res.base64);
                  setUploadProgress(((i+1)/files.length)*100);
              }
              // Pass back both URL list and Base64 list (last arg)
              onUpload(results, fileType, base64s);
          } else {
              const res = await uploadSingle(files[0]);
              setUploadProgress(100);
              onUpload(res.url, fileType, res.base64);
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
           {isProcessing ? <Loader2 className="animate-spin text-blue-500" /> : currentUrl && !allowMultiple ? (accept.includes('video') ? <Video /> : accept.includes('pdf') ? <FileText /> : accept.includes('audio') ? <Music /> : <img src={currentUrl} className="w-full h-full object-cover" />) : icon}
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

    // Local update wrapper
    const handleUpdate = (newList: Catalogue[]) => {
        setLocalList(newList);
        onSave(newList); // Propagate up to AdminDashboard local state
    };

    const addCatalogue = () => {
        handleUpdate([...localList, {
            id: generateId('cat'),
            title: brandId ? 'New Brand Catalogue' : 'New Pamphlet',
            brandId: brandId,
            type: brandId ? 'catalogue' : 'pamphlet', 
            pages: [],
            year: new Date().getFullYear(),
            startDate: '',
            endDate: ''
        }]);
    };

    const updateCatalogue = (id: string, updates: Partial<Catalogue>) => {
        handleUpdate(localList.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    // Updated to handle multiple image uploads strictly
    const handleUpload = async (id: string, data: any, type?: string, base64Data?: any) => {
        const cat = localList.find(c => c.id === id);
        if(!cat) return;
        let newPages = [...cat.pages];
        
        // Treat everything as images array since we removed complex PDF parsing
        // If data is array (multiple files), spread it. If string, push it.
        if (Array.isArray(data)) {
            newPages = [...newPages, ...data];
        } else if (typeof data === 'string') {
            newPages.push(data);
        }
        
        updateCatalogue(id, { pages: newPages });
    };

    // Reordering helper
    const movePage = (catId: string, pageIndex: number, direction: 'left' | 'right') => {
        const cat = localList.find(c => c.id === catId);
        if(!cat) return;
        const newPages = [...cat.pages];
        const swapIndex = direction === 'left' ? pageIndex - 1 : pageIndex + 1;
        
        if (swapIndex >= 0 && swapIndex < newPages.length) {
            [newPages[pageIndex], newPages[swapIndex]] = [newPages[swapIndex], newPages[pageIndex]];
            updateCatalogue(catId, { pages: newPages });
        }
    };

    const removePage = (catId: string, pageIndex: number) => {
        const cat = localList.find(c => c.id === catId);
        if(!cat) return;
        const newPages = cat.pages.filter((_, i) => i !== pageIndex);
        updateCatalogue(catId, { pages: newPages });
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
                        <div className="h-40 bg-slate-100 relative group flex items-center justify-center overflow-hidden">
                            {cat.pages[0] ? <img src={cat.pages[0]} className="w-full h-full object-cover" /> : <BookOpen size={32} className="text-slate-300" />}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => updateCatalogue(cat.id, { pages: [] })} className="bg-red-50 text-white px-3 py-1 rounded text-xs font-bold uppercase">Clear All Pages</button>
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
                                        <label className="text-[8px] font-bold text-slate-400 uppercase">End Date</label>
                                        <input type="date" value={cat.endDate || ''} onChange={(e) => updateCatalogue(cat.id, { endDate: e.target.value })} className="w-full text-xs border border-slate-200 rounded p-1" />
                                    </div>
                                </div>
                            )}
                            
                            <FileUpload 
                                label="Upload Pages (JPG/PNG Only)" 
                                accept="image/png, image/jpeg, image/jpg" 
                                allowMultiple={true}
                                currentUrl="" 
                                onUpload={(d: any, t: any, b64: any) => handleUpload(cat.id, d, t, b64)} 
                            />
                            
                            {/* Page Manager */}
                            {cat.pages.length > 0 && (
                                <div className="mt-2 border-t border-slate-100 pt-2">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase mb-2 block">Manage Pages ({cat.pages.length})</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                        {cat.pages.map((page, idx) => (
                                            <div key={idx} className="w-12 h-16 shrink-0 relative group">
                                                <img src={page} className="w-full h-full object-cover rounded border border-slate-200" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
                                                    {idx > 0 && <button onClick={()=>movePage(cat.id, idx, 'left')} className="text-white hover:text-blue-300"><ChevronLeft size={8}/></button>}
                                                    <button onClick={()=>removePage(cat.id, idx)} className="text-red-400 hover:text-red-600"><X size={8}/></button>
                                                    {idx < cat.pages.length - 1 && <button onClick={()=>movePage(cat.id, idx, 'right')} className="text-white hover:text-blue-300"><ChevronRight size={8}/></button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <button onClick={() => handleUpdate(localList.filter(c => c.id !== cat.id))} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold uppercase"><Trash2 size={12} /> Delete Catalogue</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
    // Migrate legacy data on init (single video -> multiple array, single manual -> multiple manuals)
    const [draft, setDraft] = useState<Product>({ 
        ...product, 
        dimensions: Array.isArray(product.dimensions) 
            ? product.dimensions 
            : (product.dimensions ? [{label: "Device", ...(product.dimensions as any)}] : []),
        videoUrls: product.videoUrls || (product.videoUrl ? [product.videoUrl] : []),
        manuals: product.manuals || (product.manualUrl || (product.manualImages && product.manualImages.length > 0) ? [{
            id: generateId('man'),
            title: "User Manual",
            images: product.manualImages || [],
            pdfUrl: product.manualUrl
        }] : [])
    });
    const [newFeature, setNewFeature] = useState('');
    const [newBoxItem, setNewBoxItem] = useState('');
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

    const addFeature = () => { if (newFeature.trim()) { setDraft({ ...draft, features: [...draft.features, newFeature.trim()] }); setNewFeature(''); } };
    const addBoxItem = () => { if(newBoxItem.trim()) { setDraft({ ...draft, boxContents: [...(draft.boxContents || []), newBoxItem.trim()] }); setNewBoxItem(''); } };
    const addSpec = () => { if (newSpecKey.trim() && newSpecValue.trim()) { setDraft({ ...draft, specs: { ...draft.specs, [newSpecKey.trim()]: newSpecValue.trim() } }); setNewSpecKey(''); setNewSpecValue(''); } };

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

    const addManual = (images: string[], pdfUrl?: string) => {
        const newManual: Manual = {
            id: generateId('man'),
            title: "New Manual",
            images,
            pdfUrl
        };
        setDraft({ ...draft, manuals: [...(draft.manuals || []), newManual] });
    };

    const removeManual = (id: string) => {
        setDraft({ ...draft, manuals: (draft.manuals || []).filter(m => m.id !== id) });
    };

    const updateManualTitle = (id: string, title: string) => {
        setDraft({ 
            ...draft, 
            manuals: (draft.manuals || []).map(m => m.id === id ? { ...m, title } : m) 
        });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
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
                        <InputField label="Warranty & Terms" isArea val={draft.terms || ''} onChange={(e: any) => setDraft({ ...draft, terms: e.target.value })} placeholder="Enter warranty info or legal terms..." />
                        
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
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Image Gallery (Multiple)</label>
                            <FileUpload 
                                label="Add Images" 
                                allowMultiple={true} 
                                currentUrl="" 
                                onUpload={(urls: any) => {
                                    const newUrls = Array.isArray(urls) ? urls : [urls];
                                    setDraft(prev => ({ ...prev, galleryUrls: [...(prev.galleryUrls || []), ...newUrls] }));
                                }} 
                            />
                            {draft.galleryUrls && draft.galleryUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {draft.galleryUrls.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                            <img src={url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                                            <button 
                                                onClick={() => setDraft(prev => ({...prev, galleryUrls: prev.galleryUrls?.filter((_, i) => i !== idx)}))}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Product Videos</label>
                            <FileUpload 
                                label="Add Videos" 
                                allowMultiple={true} 
                                accept="video/*"
                                icon={<Video />}
                                currentUrl="" 
                                onUpload={(urls: any) => {
                                    const newUrls = Array.isArray(urls) ? urls : [urls];
                                    setDraft(prev => ({ ...prev, videoUrls: [...(prev.videoUrls || []), ...newUrls] }));
                                }} 
                            />
                            {draft.videoUrls && draft.videoUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {draft.videoUrls.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-sm flex items-center justify-center">
                                            <video src={url} className="w-full h-full object-cover opacity-60" muted />
                                            <Video size={20} className="absolute text-white" />
                                            <button 
                                                onClick={() => setDraft(prev => ({...prev, videoUrls: prev.videoUrls?.filter((_, i) => i !== idx)}))}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
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
                     <h4 className="font-bold text-slate-900 uppercase text-sm mb-4">Manuals & Docs</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <div className="flex justify-between items-center mb-4">
                                <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider">Product Manuals</h5>
                             </div>
                             
                             <div className="mb-4 bg-white p-3 rounded-lg border border-slate-200">
                                <FileUpload 
                                    label="Upload Manual Pages (Images)" 
                                    accept="image/*"
                                    allowMultiple={true}
                                    icon={<FileText />} 
                                    currentUrl="" 
                                    onUpload={async (urls: any) => { 
                                        const pages = Array.isArray(urls) ? urls : [urls];
                                        addManual(pages);
                                    }} 
                                />
                             </div>

                             <div className="space-y-3">
                                {(draft.manuals || []).map((manual, idx) => (
                                    <div key={manual.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-red-50 text-red-600 p-2 rounded">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">{manual.images.length} Pages</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeManual(manual.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                        </div>
                                        <input 
                                            value={manual.title} 
                                            onChange={(e) => updateManualTitle(manual.id, e.target.value)} 
                                            placeholder="Manual Title" 
                                            className="w-full text-sm font-bold border-b border-slate-100 pb-1 focus:border-blue-500 outline-none" 
                                        />
                                    </div>
                                ))}
                                {(draft.manuals || []).length === 0 && (
                                    <div className="text-center text-slate-400 text-xs italic py-4">No manuals uploaded.</div>
                                )}
                             </div>
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
                <button onClick={() => onSave(draft)} className="px-6 py-3 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg shadow-lg">Confirm Changes</button>
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
                        <div className="grid grid-cols-3 gap-2">
                             <button onClick={() => setDraft({...draft, deviceType: 'kiosk'})} className={`p-3 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 ${draft.deviceType === 'kiosk' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                 <Tablet size={16}/> Kiosk
                             </button>
                             <button onClick={() => setDraft({...draft, deviceType: 'mobile'})} className={`p-3 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 ${draft.deviceType === 'mobile' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                 <Smartphone size={16}/> Mobile
                             </button>
                             <button onClick={() => setDraft({...draft, deviceType: 'tv'})} className={`p-3 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 ${draft.deviceType === 'tv' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                 <Tv size={16}/> TV
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

export const AdminDashboard = ({ storeData, onUpdateData, onRefresh }: { storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [session, setSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'marketing' | 'tv' | 'screensaver' | 'fleet' | 'history' | 'settings'>('inventory');
  const [activeSubTab, setActiveSubTab] = useState<string>('brands'); 
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [historyFolder, setHistoryFolder] = useState<'brands' | 'products' | 'catalogues' | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<string | null>(null);
  const [selectedTVBrand, setSelectedTVBrand] = useState<TVBrand | null>(null);
  
  // GLOBAL LOCAL STATE (BUFFER)
  const [localData, setLocalData] = useState<StoreData | null>(storeData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
      checkCloudConnection().then(setIsCloudConnected);
      const interval = setInterval(() => checkCloudConnection().then(setIsCloudConnected), 30000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (!hasUnsavedChanges && storeData) {
          setLocalData(storeData);
      }
  }, [storeData]);

  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (hasUnsavedChanges) {
              e.preventDefault();
              e.returnValue = '';
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleLocalUpdate = (newData: StoreData) => {
      setLocalData(newData);
      setHasUnsavedChanges(true);
      
      if (selectedBrand) {
          const updatedBrand = newData.brands.find(b => b.id === selectedBrand.id);
          if (updatedBrand) setSelectedBrand(updatedBrand);
      }
      if (selectedCategory && selectedBrand) {
          const updatedBrand = newData.brands.find(b => b.id === selectedBrand.id);
          const updatedCat = updatedBrand?.categories.find(c => c.id === selectedCategory.id);
          if (updatedCat) setSelectedCategory(updatedCat);
      }
      if (selectedTVBrand && newData.tv) {
          const updatedTVBrand = newData.tv.brands.find(b => b.id === selectedTVBrand.id);
          if (updatedTVBrand) setSelectedTVBrand(updatedTVBrand);
      }
  };

  const checkSkuDuplicate = (sku: string, currentId: string) => {
    if (!sku || !localData) return false;
    for (const b of localData.brands) {
        for (const c of b.categories) {
            for (const p of c.products) {
                if (p.sku && p.sku.toLowerCase() === sku.toLowerCase() && p.id !== currentId) return true;
            }
        }
    }
    return false;
  };

  const handleGlobalSave = () => {
      if (localData) {
          onUpdateData(localData);
          setHasUnsavedChanges(false);
      }
  };

  const updateFleetMember = async (kiosk: KioskRegistry) => {
      if(supabase) {
          const payload = {
              id: kiosk.id,
              name: kiosk.name,
              device_type: kiosk.deviceType,
              assigned_zone: kiosk.assignedZone
          };
          await supabase.from('kiosks').upsert(payload);
          onRefresh(); 
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

  const restoreBrand = (b: Brand) => {
     if(!localData) return;
     const newArchiveBrands = localData.archive?.brands.filter(x => x.id !== b.id) || [];
     const newBrands = [...localData.brands, b];
     handleLocalUpdate({
         ...localData,
         brands: newBrands,
         archive: { ...localData.archive!, brands: newArchiveBrands }
     });
  };
  
  const restoreCatalogue = (c: Catalogue) => {
     if(!localData) return;
     const newArchiveCats = localData.archive?.catalogues.filter(x => x.id !== c.id) || [];
     const newCats = [...(localData.catalogues || []), c];
     handleLocalUpdate({
         ...localData,
         catalogues: newCats,
         archive: { ...localData.archive!, catalogues: newArchiveCats }
     });
  };

  if (!session) return <Auth setSession={setSession} />;
  if (!localData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading...</div>;

  const brands = Array.isArray(localData.brands) 
      ? [...localData.brands].sort((a, b) => a.name.localeCompare(b.name)) 
      : [];

  // TV Brands
  const tvBrands = Array.isArray(localData.tv?.brands)
      ? [...localData.tv!.brands].sort((a, b) => a.name.localeCompare(b.name))
      : [];

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
        <header className="bg-slate-900 text-white shrink-0 shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Settings className="text-blue-500" size={24} />
                     <div><h1 className="text-lg font-black uppercase tracking-widest leading-none">Admin Hub</h1></div>
                 </div>
                 
                 <button 
                     onClick={handleGlobalSave}
                     disabled={!hasUnsavedChanges}
                     className={`flex items-center gap-2 px-6 py-2 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                         hasUnsavedChanges 
                         ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] animate-pulse' 
                         : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                     }`}
                 >
                     <SaveAll size={16} />
                     {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                 </button>

                 <div className="flex items-center gap-3">
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isCloudConnected ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'}`}>
                         {isCloudConnected ? <Cloud size={14} /> : <HardDrive size={14} />}
                         <span className="text-[10px] font-bold uppercase">{isCloudConnected ? 'Cloud Online' : 'Local Mode'}</span>
                     </div>
                     <button onClick={onRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"><RefreshCw size={16} /></button>
                     <button onClick={() => setSession(false)} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded-lg flex items-center gap-2">
                        <LogOut size={16} />
                        <span className="text-[10px] font-bold uppercase hidden md:inline">Logout</span>
                     </button>
                 </div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar">
                {['inventory', 'marketing', 'tv', 'screensaver', 'fleet', 'history', 'settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === tab ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                ))}
            </div>
        </header>

        {activeTab === 'marketing' && (
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm z-10 shrink-0">
                <button onClick={() => setActiveSubTab('hero')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'hero' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Hero Banner</button>
                <button onClick={() => setActiveSubTab('ads')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'ads' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Ad Zones</button>
                <button onClick={() => setActiveSubTab('catalogues')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'catalogues' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Pamphlets & Catalogues</button>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-2 md:p-8 relative">
            {activeTab === 'inventory' && (
                !selectedBrand ? (
                   <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-fade-in">
                       <button onClick={() => { const name = prompt("Brand Name:"); if(name) handleLocalUpdate({ ...localData, brands: [...brands, { id: generateId('b'), name, categories: [] }] }) }} className="bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 md:p-8 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all group min-h-[120px] md:min-h-[200px]">
                           <Plus size={24} className="mb-2" /><span className="font-bold uppercase text-[10px] md:text-xs tracking-wider text-center">Add Brand</span>
                       </button>
                       {brands.map(brand => (
                           <div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group relative flex flex-col h-full">
                               <div className="flex-1 bg-slate-50 flex items-center justify-center p-2 relative aspect-square">
                                   {brand.logoUrl ? <img src={brand.logoUrl} className="max-h-full max-w-full object-contain" /> : <span className="text-4xl font-black text-slate-200">{brand.name.charAt(0)}</span>}
                                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Move to archive?")) { handleLocalUpdate({...localData, brands: brands.filter(b=>b.id!==brand.id), archive: {...localData.archive!, brands: [...(localData.archive?.brands||[]), brand]}}); } }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                               </div>
                               <div className="p-2 md:p-4">
                                   <h3 className="font-black text-slate-900 text-xs md:text-lg uppercase tracking-tight mb-1 truncate">{brand.name}</h3>
                                   <p className="text-[10px] md:text-xs text-slate-500 font-bold mb-2 md:mb-4">{brand.categories.length} Categories</p>
                                   <button onClick={() => setSelectedBrand(brand)} className="w-full bg-slate-900 text-white py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs uppercase hover:bg-blue-600 transition-colors">Manage</button>
                               </div>
                           </div>
                       ))}
                   </div>
               ) : !selectedCategory ? (
                   <div className="animate-fade-in">
                       <div className="flex items-center gap-4 mb-6"><button onClick={() => setSelectedBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 flex-1">{selectedBrand.name}</h2><FileUpload label="Brand Logo" currentUrl={selectedBrand.logoUrl} onUpload={(url: any) => { const updated = {...selectedBrand, logoUrl: url}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }} /></div>
                       <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                           <button onClick={() => { const name = prompt("Category Name:"); if(name) { const updated = {...selectedBrand, categories: [...selectedBrand.categories, { id: generateId('c'), name, icon: 'Box', products: [] }]}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); } }} className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 text-slate-400 hover:border-blue-500 hover:text-blue-500 aspect-square"><Plus size={24} /><span className="font-bold text-[10px] uppercase mt-2 text-center">New Category</span></button>
                           {selectedBrand.categories.map(cat => (
                               <button key={cat.id} onClick={() => setSelectedCategory(cat)} className="bg-white p-2 md:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md text-left group relative aspect-square flex flex-col justify-center">
                                   <Box size={20} className="mb-2 md:mb-4 text-slate-400 mx-auto md:mx-0" />
                                   <h3 className="font-black text-slate-900 uppercase text-[10px] md:text-sm text-center md:text-left truncate w-full">{cat.name}</h3>
                                   <p className="text-[9px] md:text-xs text-slate-500 font-bold text-center md:text-left">{cat.products.length} Products</p>
                                   <div 
                                        onClick={(e)=>{
                                            e.stopPropagation(); 
                                            const newName = prompt("Rename Category:", cat.name);
                                            if(newName && newName.trim() !== "") {
                                                const updated = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === cat.id ? {...c, name: newName.trim()} : c)};
                                                handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)});
                                            }
                                        }} 
                                        className="absolute top-1 right-8 md:top-2 md:right-8 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-50 text-blue-500 rounded transition-all"
                                   >
                                       <Edit2 size={12}/>
                                   </div>
                                   <div 
                                        onClick={(e)=>{e.stopPropagation(); if(confirm("Delete?")){ const updated={...selectedBrand, categories: selectedBrand.categories.filter(c=>c.id!==cat.id)}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }}} 
                                        className="absolute top-1 right-1 md:top-2 md:right-2 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded"
                                   >
                                       <Trash2 size={12}/>
                                   </div>
                                </button>
                            ))}
                       </div>
                       <div className="mt-8 border-t border-slate-200 pt-8"><h3 className="font-bold text-slate-900 uppercase text-sm mb-4">Brand Catalogues</h3><CatalogueManager catalogues={localData.catalogues?.filter(c => c.brandId === selectedBrand.id) || []} brandId={selectedBrand.id} onSave={(c) => handleLocalUpdate({ ...localData, catalogues: [...(localData.catalogues?.filter(x => x.brandId !== selectedBrand.id) || []), ...c] })} /></div>
                   </div>
               ) : (
                   <div className="animate-fade-in h-full flex flex-col">
                       <div className="flex items-center gap-4 mb-6 shrink-0"><button onClick={() => setSelectedCategory(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500"><ArrowLeft size={20} /></button><h2 className="text-lg md:text-2xl font-black uppercase text-slate-900 flex-1 truncate">{selectedCategory.name}</h2><button onClick={() => setEditingProduct({ id: generateId('p'), name: '', description: '', specs: {}, features: [], dimensions: [], imageUrl: '' } as any)} className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg font-bold uppercase text-[10px] md:text-xs flex items-center gap-2 shrink-0"><Plus size={14} /> Add</button></div>
                       <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto pb-20">
                           {selectedCategory.products.map(product => (
                               <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                                   <div className="aspect-square bg-slate-50 relative flex items-center justify-center p-2 md:p-4">
                                       {product.imageUrl ? <img src={product.imageUrl} className="max-w-full max-h-full object-contain" /> : <Box size={24} className="text-slate-300" />}
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                           <button onClick={() => setEditingProduct(product)} className="p-1.5 md:p-2 bg-white text-blue-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-blue-50">Edit</button>
                                           <button onClick={() => {
                                              if(confirm(`Delete product "${product.name}"?`)) {
                                                  const updatedCat = {...selectedCategory, products: selectedCategory.products.filter(p => p.id !== product.id)};
                                                  const updatedBrand = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === updatedCat.id ? updatedCat : c)};
                                                  handleLocalUpdate({...localData, brands: brands.map(b => b.id === updatedBrand.id ? updatedBrand : b)});
                                              }
                                           }} className="p-1.5 md:p-2 bg-white text-red-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-red-50">Delete</button>
                                       </div>
                                   </div>
                                   <div className="p-2 md:p-4">
                                       <h4 className="font-bold text-slate-900 text-[10px] md:text-sm truncate uppercase">{product.name}</h4>
                                       <p className="text-[9px] md:text-xs text-slate-500 font-mono truncate">{product.sku || 'No SKU'}</p>
                                   </div>
                               </div>
                            ))}
                       </div>
                   </div>
               )
            )}

            {activeTab === 'tv' && (
                !selectedTVBrand ? (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase">TV Video Management</h2>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                            <Tv size={24} className="text-blue-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-900 uppercase text-xs mb-1">How to manage TV Content</h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Create a TV Brand below, then click "Manage Videos" to upload content. You can add a Brand Logo, change the Brand Name, and upload multiple videos to create a playlist. These will appear on the TV Home Page.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <button 
                                onClick={() => { 
                                    const name = prompt("Brand Name:"); 
                                    if(name) {
                                        const newBrand = { id: generateId('tvb'), name, videoUrls: [] };
                                        handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: [...(localData.tv?.brands || []), newBrand] } as TVConfig });
                                    }
                                }} 
                                className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center p-4 min-h-[160px] text-indigo-400 hover:border-indigo-500 hover:text-indigo-600 transition-all group"
                            >
                                <Plus size={32} className="mb-2" />
                                <span className="font-bold uppercase text-xs tracking-wider text-center">Add TV Brand</span>
                            </button>
                            {tvBrands.map(brand => (
                                <div key={brand.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all relative">
                                    <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 aspect-square">
                                        {brand.logoUrl ? <img src={brand.logoUrl} className="max-w-full max-h-full object-contain" /> : <Tv size={32} className="text-slate-300" />}
                                    </div>
                                    <div className="p-4 bg-white border-t border-slate-100">
                                        <h3 className="font-black text-slate-900 text-sm uppercase truncate mb-1">{brand.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold">{brand.videoUrls?.length || 0} Videos</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); if(confirm("Delete TV Brand?")) { handleLocalUpdate({...localData, tv: { ...localData.tv, brands: tvBrands.filter(b => b.id !== brand.id) } as TVConfig }); } }} 
                                        className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => setSelectedTVBrand(brand)} 
                                        className="absolute inset-0 w-full h-full opacity-0 z-10"
                                    />
                                    <div className="absolute bottom-16 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                        <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Manage Videos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <button onClick={() => setSelectedTVBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><ArrowLeft size={20} /></button>
                            <h2 className="text-2xl font-black uppercase text-slate-900 flex-1">{selectedTVBrand.name} <span className="text-slate-400 font-bold ml-2 text-lg">TV Config</span></h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-900 uppercase text-xs mb-4">Brand Identity</h4>
                                    <div className="space-y-4">
                                        <InputField 
                                            label="Brand Name" 
                                            val={selectedTVBrand.name} 
                                            onChange={(e: any) => {
                                                const updated = { ...selectedTVBrand, name: e.target.value };
                                                handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                            }} 
                                        />
                                        <FileUpload 
                                            label="Brand Logo" 
                                            currentUrl={selectedTVBrand.logoUrl} 
                                            onUpload={(url: any) => { 
                                                const updated = { ...selectedTVBrand, logoUrl: url };
                                                handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-900 uppercase text-xs">Video Playlist</h4>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase">{selectedTVBrand.videoUrls?.length || 0} Videos</span>
                                    </div>
                                    
                                    <FileUpload 
                                        label="Add Videos to Playlist" 
                                        accept="video/*" 
                                        allowMultiple={true}
                                        icon={<Video />}
                                        currentUrl="" 
                                        onUpload={(urls: any) => {
                                            const newUrls = Array.isArray(urls) ? urls : [urls];
                                            const updated = { ...selectedTVBrand, videoUrls: [...(selectedTVBrand.videoUrls || []), ...newUrls] };
                                            handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                        }} 
                                    />
                                    
                                    <div className="grid grid-cols-1 gap-3 mt-4">
                                        {(selectedTVBrand.videoUrls || []).map((url, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                                                <div className="w-16 h-10 bg-slate-900 rounded flex items-center justify-center shrink-0">
                                                    <Video size={16} className="text-white opacity-50" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Video {idx + 1}</div>
                                                    <div className="text-xs font-mono truncate text-slate-700">{url.split('/').pop()}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {idx > 0 && <button onClick={() => {
                                                        const newUrls = [...selectedTVBrand.videoUrls];
                                                        [newUrls[idx], newUrls[idx-1]] = [newUrls[idx-1], newUrls[idx]];
                                                        const updated = { ...selectedTVBrand, videoUrls: newUrls };
                                                        handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                                    }} className="p-1 hover:bg-slate-200 rounded"><ChevronDown size={14} className="rotate-180"/></button>}
                                                    
                                                    {idx < selectedTVBrand.videoUrls.length - 1 && <button onClick={() => {
                                                        const newUrls = [...selectedTVBrand.videoUrls];
                                                        [newUrls[idx], newUrls[idx+1]] = [newUrls[idx+1], newUrls[idx]];
                                                        const updated = { ...selectedTVBrand, videoUrls: newUrls };
                                                        handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                                    }} className="p-1 hover:bg-slate-200 rounded"><ChevronDown size={14} /></button>}
                                                    
                                                    <button onClick={() => {
                                                        const updated = { ...selectedTVBrand, videoUrls: selectedTVBrand.videoUrls.filter((_, i) => i !== idx) };
                                                        handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig });
                                                    }} className="p-1.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded ml-2"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedTVBrand.videoUrls || selectedTVBrand.videoUrls.length === 0) && (
                                            <div className="text-center py-8 text-slate-400 text-xs italic">No videos in playlist. Upload some above.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            {activeTab === 'marketing' && (
                <div className="max-w-5xl mx-auto">
                    {activeSubTab === 'catalogues' && <CatalogueManager catalogues={localData.catalogues || []} onSave={(c) => handleLocalUpdate({ ...localData, catalogues: c })} />}
                    
                    {activeSubTab === 'hero' && (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InputField label="Title" val={localData.hero.title} onChange={(e:any) => handleLocalUpdate({...localData, hero: {...localData.hero, title: e.target.value}})} />
                                    <InputField label="Subtitle" val={localData.hero.subtitle} onChange={(e:any) => handleLocalUpdate({...localData, hero: {...localData.hero, subtitle: e.target.value}})} />
                                    <InputField label="Website URL" val={localData.hero.websiteUrl || ''} onChange={(e:any) => handleLocalUpdate({...localData, hero: {...localData.hero, websiteUrl: e.target.value}})} placeholder="https://example.com" />
                                </div>
                                <div className="space-y-4">
                                    <FileUpload label="Background Image" currentUrl={localData.hero.backgroundImageUrl} onUpload={(url:any) => handleLocalUpdate({...localData, hero: {...localData.hero, backgroundImageUrl: url}})} />
                                    <FileUpload label="Brand Logo" currentUrl={localData.hero.logoUrl} onUpload={(url:any) => handleLocalUpdate({...localData, hero: {...localData.hero, logoUrl: url}})} />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeSubTab === 'ads' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {['homeBottomLeft', 'homeBottomRight', 'homeSideVertical', 'screensaver'].map(zone => (
                                <div key={zone} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold uppercase text-xs mb-1">{zone.replace('home', '')}</h4>
                                    <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-wide">
                                        {zone.includes('Side') ? 'Size: 1080x1920 (Portrait)' : zone.includes('screensaver') ? 'Mixed Media' : 'Size: 1920x1080 (Landscape)'}
                                    </p>
                                    <FileUpload 
                                        label="Upload Media" 
                                        accept="image/*,video/*" 
                                        allowMultiple 
                                        onUpload={(urls:any, type:any) => { 
                                            const newAds = (Array.isArray(urls)?urls:[urls]).map(u=>({id:generateId('ad'), type, url:u})); 
                                            handleLocalUpdate({...localData, ads: {...localData.ads, [zone]: [...(localData.ads as any)[zone], ...newAds]} as any}); 
                                        }} 
                                    />
                                    
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {((localData.ads as any)[zone] || []).map((ad: any, idx: number) => (
                                            <div key={ad.id} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                {ad.type === 'video' ? (
                                                    <video src={ad.url} className="w-full h-full object-cover opacity-60" />
                                                ) : (
                                                    <img src={ad.url} alt="Ad" className="w-full h-full object-cover" />
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        const currentAds = (localData.ads as any)[zone];
                                                        const newAdsList = currentAds.filter((_: any, i: number) => i !== idx);
                                                        handleLocalUpdate({ ...localData, ads: { ...localData.ads, [zone]: newAdsList } as any });
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    title="Remove Ad"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                                {ad.type === 'video' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Video size={12} className="text-white drop-shadow-md"/></div>}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'fleet' && (
                <div className="animate-fade-in max-w-6xl mx-auto">
                   <h2 className="text-2xl font-black text-slate-900 uppercase mb-6">Device Fleet</h2>
                   <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-6">
                       {localData.fleet?.map(kiosk => {
                           const isOnline = (new Date().getTime() - new Date(kiosk.last_seen).getTime()) < 350000;
                           return (
                               <div key={kiosk.id} className="bg-white rounded-lg md:rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                                   <div className="p-1 md:p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start bg-slate-50/50 gap-0 md:gap-0">
                                       <div>
                                           <div className="flex items-center gap-0.5 md:gap-2 mb-0 md:mb-1">
                                               {kiosk.deviceType === 'mobile' ? <Smartphone size={10} className="text-purple-500 md:w-4 md:h-4"/> : kiosk.deviceType === 'tv' ? <Tv size={10} className="text-indigo-500 md:w-4 md:h-4" /> : <Tablet size={10} className="text-blue-500 md:w-4 md:h-4"/>}
                                               <span className="font-black text-slate-900 text-[8px] md:text-sm uppercase truncate max-w-[60px] md:max-w-none">{kiosk.name}</span>
                                           </div>
                                           <span className="text-[6px] md:text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-0.5 py-0 rounded hidden md:inline-block">{kiosk.id}</span>
                                       </div>
                                       <div className={`flex items-center gap-0.5 md:gap-1 px-1 py-0.5 rounded-full text-[6px] md:text-[10px] font-bold uppercase border ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                            {isOnline ? 'On' : 'Off'}
                                       </div>
                                   </div>

                                   <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                                       {kiosk.snapshotUrl ? (
                                           <>
                                             <img src={kiosk.snapshotUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Snapshot" />
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button onClick={() => setViewingSnapshot(kiosk.snapshotUrl)} className="bg-white text-slate-900 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold uppercase flex items-center gap-1 md:gap-2 hover:bg-blue-50">
                                                     <Eye size={10} className="md:w-3 md:h-3" /> <span className="hidden md:inline">View Full</span>
                                                 </button>
                                             </div>
                                           </>
                                       ) : (
                                           <div className="flex flex-col items-center text-slate-600">
                                               <Camera size={14} className="mb-0 md:mb-1 opacity-50 md:w-5 md:h-5" />
                                               <span className="text-[6px] md:text-[10px] font-bold uppercase tracking-wide">No Snap</span>
                                           </div>
                                       )}
                                   </div>

                                   <div className="p-1 md:p-4 flex gap-1 md:gap-2 mt-auto">
                                       <button onClick={() => requestSnapshot(kiosk.id)} title="Request Camera Snapshot" className="flex-1 py-1 md:py-2 bg-blue-50 text-blue-600 rounded md:rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-bold uppercase border border-blue-100"><Camera size={10} className="md:w-3 md:h-3"/> <span className="hidden md:inline">Snap</span></button>
                                       <button onClick={() => setEditingKiosk(kiosk)} className="p-1 md:p-2 bg-slate-100 text-slate-600 rounded md:rounded-lg hover:bg-slate-200 border border-slate-200 flex items-center justify-center"><Edit2 size={10} className="md:w-3 md:h-3"/></button>
                                       {supabase && <button onClick={async () => { if(confirm("Restart Device?")) await supabase.from('kiosks').update({restart_requested: true}).eq('id', kiosk.id); }} className="p-1 md:p-2 bg-orange-50 text-orange-600 rounded md:rounded-lg hover:bg-orange-100 border border-orange-100 flex items-center justify-center" title="Remote Restart"><Power size={10} className="md:w-3 md:h-3"/></button>}
                                       <button onClick={() => removeFleetMember(kiosk.id)} className="p-1 md:p-2 bg-red-50 text-red-600 rounded md:rounded-lg hover:bg-red-100 border border-red-100 flex items-center justify-center"><Trash2 size={10} className="md:w-3 md:h-3"/></button>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
                   {localData.fleet?.length === 0 && <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs border-2 border-dashed border-slate-200 rounded-2xl">No devices registered in fleet</div>}
                </div>
            )}

            {/* SCREEN SAVER SETTINGS */}
            {activeTab === 'screensaver' && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Timing & Scheduling */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div>
                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Timing & Schedule</h3>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4 mb-6">
                                <InputField label="Idle Wait (sec)" val={localData.screensaverSettings?.idleTimeout||60} onChange={(e:any)=>handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, idleTimeout: parseInt(e.target.value)}})} />
                                <InputField label="Slide Duration (sec)" val={localData.screensaverSettings?.imageDuration||8} onChange={(e:any)=>handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, imageDuration: parseInt(e.target.value)}})} />
                             </div>

                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Hours (Sleep Mode)</label>
                                    <button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, enableSleepMode: !localData.screensaverSettings?.enableSleepMode}})} className={`w-8 h-4 rounded-full transition-colors relative ${localData.screensaverSettings?.enableSleepMode ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`w-2 h-2 bg-white rounded-full absolute top-1 transition-all ${localData.screensaverSettings?.enableSleepMode ? 'left-5' : 'left-1'}`}></div></button>
                                </div>
                                <div className={`grid grid-cols-2 gap-4 transition-opacity ${localData.screensaverSettings?.enableSleepMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <div><label className="block text-[10px] font-bold text-slate-400 mb-1">Start Time</label><input type="time" value={localData.screensaverSettings?.activeHoursStart || '08:00'} onChange={(e) => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, activeHoursStart: e.target.value}})} className="w-full p-2 border border-slate-300 rounded text-sm font-bold"/></div>
                                    <div><label className="block text-[10px] font-bold text-slate-400 mb-1">End Time</label><input type="time" value={localData.screensaverSettings?.activeHoursEnd || '20:00'} onChange={(e) => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, activeHoursEnd: e.target.value}})} className="w-full p-2 border border-slate-300 rounded text-sm font-bold"/></div>
                                </div>
                             </div>
                         </div>

                         {/* Content Controls */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Layout size={20} /></div>
                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Content & Display</h3>
                             </div>

                             <div className="mb-6">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Display Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, displayStyle: 'contain'}})} className={`p-3 rounded-lg border text-xs font-bold uppercase ${localData.screensaverSettings?.displayStyle === 'contain' || !localData.screensaverSettings?.displayStyle ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Fit to Screen</button>
                                    <button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, displayStyle: 'cover'}})} className={`p-3 rounded-lg border text-xs font-bold uppercase ${localData.screensaverSettings?.displayStyle === 'cover' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Fill Screen</button>
                                </div>
                             </div>

                             <div className="space-y-2">
                                 {[
                                     {k: 'showInfoOverlay', label: 'Show Text Overlay'},
                                     {k: 'muteVideos', label: 'Mute All Videos'},
                                     {k: 'showProductImages', label: 'Include Products'},
                                     {k: 'showProductVideos', label: 'Include Product Videos'},
                                     {k: 'showPamphlets', label: 'Include Pamphlets'},
                                     {k: 'showCustomAds', label: 'Include Custom Media'}
                                 ].map((item) => (
                                     <div key={item.k} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                         <span className="text-xs font-bold uppercase text-slate-700">{item.label}</span>
                                         <button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, [item.k]: !(localData.screensaverSettings as any)[item.k]}})} className={`w-8 h-4 rounded-full transition-colors relative ${ (localData.screensaverSettings as any)[item.k] ? 'bg-green-500' : 'bg-slate-300' }`}><div className={`w-2 h-2 bg-white rounded-full absolute top-1 transition-all ${ (localData.screensaverSettings as any)[item.k] ? 'left-5' : 'left-1' }`}></div></button>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>
                     
                     {/* Screensaver Ads Direct Management */}
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-8">
                         <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><MegaphoneIcon size={20} /></div>
                             <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Screensaver Ads</h3>
                         </div>
                         <FileUpload 
                             label="Upload Custom Screensaver Media" 
                             accept="image/*,video/*" 
                             allowMultiple 
                             onUpload={(urls:any, type:any) => { 
                                 const newAds = (Array.isArray(urls)?urls:[urls]).map(u=>({id:generateId('ad'), type, url:u})); 
                                 handleLocalUpdate({...localData, ads: {...localData.ads, screensaver: [...(localData.ads.screensaver || []), ...newAds]}}); 
                             }} 
                         />
                         <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-4">
                             {(localData.ads?.screensaver || []).map((ad: any, idx: number) => (
                                 <div key={ad.id} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                     {ad.type === 'video' ? (
                                         <video src={ad.url} className="w-full h-full object-cover opacity-60" />
                                     ) : (
                                         <img src={ad.url} alt="Ad" className="w-full h-full object-cover" />
                                     )}
                                     <button 
                                         onClick={() => {
                                             const newAdsList = localData.ads.screensaver.filter((_: any, i: number) => i !== idx);
                                             handleLocalUpdate({ ...localData, ads: { ...localData.ads, screensaver: newAdsList } });
                                         }}
                                         className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                     >
                                         <Trash2 size={10} />
                                     </button>
                                 </div>
                             ))}
                             {(localData.ads?.screensaver || []).length === 0 && (
                                <div className="col-span-4 text-center text-slate-400 text-xs italic py-4">No custom ads loaded. Use the upload button above.</div>
                             )}
                         </div>
                     </div>
                </div>
            )}
            
            {/* HISTORY & ARCHIVE TAB */}
            {activeTab === 'history' && (
                <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in min-h-[50vh]">
                    <h2 className="text-2xl font-black uppercase mb-6 text-slate-900">Archive & History</h2>
                    <div className="space-y-8">
                         {/* Archived Brands */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200">
                             <h3 className="text-sm font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><FolderArchive size={16} /> Archived Brands</h3>
                             {(localData.archive?.brands || []).length === 0 ? (
                                 <div className="text-center py-8 text-slate-400 text-xs italic">No archived brands</div>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {localData.archive!.brands.map(b => (
                                         <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                             <div className="flex items-center gap-3">
                                                 {b.logoUrl ? <img src={b.logoUrl} className="w-8 h-8 object-contain" /> : <div className="w-8 h-8 bg-slate-200 rounded-full"></div>}
                                                 <span className="font-bold text-sm">{b.name}</span>
                                             </div>
                                             <button onClick={() => restoreBrand(b)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase hover:bg-green-200">Restore</button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         {/* Archived Catalogues */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200">
                             <h3 className="text-sm font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><FileArchive size={16} /> Archived Catalogues</h3>
                             {(localData.archive?.catalogues || []).length === 0 ? (
                                 <div className="text-center py-8 text-slate-400 text-xs italic">No archived catalogues</div>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {localData.archive!.catalogues.map(c => (
                                         <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                             <div>
                                                 <span className="font-bold text-sm block">{c.title}</span>
                                                 <span className="text-[10px] text-slate-400 block uppercase">{c.endDate ? `Expired: ${c.endDate}` : 'Manual Archive'}</span>
                                             </div>
                                             <button onClick={() => restoreCatalogue(c)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase hover:bg-green-200">Restore</button>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            )}
            
            {/* SYSTEM SETTINGS TAB */}
            {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in pb-20 min-h-[50vh]">
                     <h2 className="text-2xl font-black uppercase mb-6 text-slate-900">System Configuration</h2>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                         {/* About Page Config */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200">
                             <h3 className="text-sm font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><Info size={16} /> About Page</h3>
                             <div className="space-y-4">
                                 <InputField label="Page Title" val={localData.about?.title || ''} onChange={(e:any) => handleLocalUpdate({...localData, about: {...localData.about, title: e.target.value}})} />
                                 <InputField label="Intro Text" isArea val={localData.about?.text || ''} onChange={(e:any) => handleLocalUpdate({...localData, about: {...localData.about, text: e.target.value}})} />
                                 <FileUpload label="Audio Guide (MP3)" accept="audio/*" icon={<Volume2 />} currentUrl={localData.about?.audioUrl} onUpload={(url:any) => handleLocalUpdate({...localData, about: {...localData.about, audioUrl: url}})} />
                             </div>
                         </div>
                         
                         {/* System Actions */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit">
                             <h3 className="text-sm font-black uppercase text-slate-500 mb-4 flex items-center gap-2"><Settings size={16} /> Maintenance</h3>
                             <div className="space-y-3">
                                 <button onClick={() => setShowGuide(true)} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-3 border border-slate-200 transition-colors text-left">
                                     <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><BookOpen size={20} /></div>
                                     <div>
                                         <span className="block text-sm font-bold text-slate-900">Setup Guide</span>
                                         <span className="block text-xs text-slate-500">View installation instructions</span>
                                     </div>
                                 </button>
                                 
                                 <button onClick={async () => { if(confirm("This will WIPE ALL DATA and restore factory defaults. Are you sure?")) { await resetStoreData(); window.location.reload(); }}} className="w-full p-4 bg-red-50 hover:bg-red-100 rounded-xl flex items-center gap-3 border border-red-200 transition-colors text-left group">
                                     <div className="bg-white p-2 rounded-lg text-red-500 group-hover:text-red-600"><AlertCircle size={20} /></div>
                                     <div>
                                         <span className="block text-sm font-bold text-red-700">Factory Reset</span>
                                         <span className="block text-xs text-red-400">Clear all data and start over</span>
                                     </div>
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>
            )}
        </main>
        
        {/* ADMIN FOOTER - FIXED VISIBILITY */}
        <footer className="bg-white border-t border-slate-200 p-3 px-6 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest shrink-0 z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
            <div>JSTYP Admin Console v1.3</div>
            <div className="flex gap-4">
                <a href="#" onClick={(e) => {e.preventDefault(); setShowGuide(true);}} className="hover:text-blue-500 transition-colors">Help</a>
                <span>&copy; {new Date().getFullYear()}</span>
            </div>
        </footer>

        {editingProduct && <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm p-4 md:p-12">
            <ProductEditor 
                product={editingProduct} 
                onSave={(p) => { 
                    if(selectedCategory) { 
                        if (checkSkuDuplicate(p.sku || '', p.id)) {
                             alert(`Cannot save: SKU "${p.sku}" already exists in the inventory.`);
                             return;
                        }
                        const isNew = !selectedCategory.products.some(x => x.id === p.id);
                        const updated = {
                            ...selectedBrand!, 
                            categories: selectedBrand!.categories.map(c => 
                                c.id === selectedCategory.id ? {
                                    ...c, 
                                    products: isNew ? [...c.products, p] : c.products.map(px => px.id === p.id ? p : px)
                                } : c
                            )
                        }; 
                        handleLocalUpdate({...localData, brands: brands.map(b => b.id === updated.id ? updated : b)}); 
                        setEditingProduct(null); 
                    } 
                }} 
                onCancel={() => setEditingProduct(null)} 
            />
        </div>}

        {editingKiosk && <KioskEditorModal kiosk={editingKiosk} onSave={(k) => { updateFleetMember(k); setEditingKiosk(null); }} onClose={() => setEditingKiosk(null)} />}

        {showGuide && <SetupGuide onClose={() => setShowGuide(false)} />}
        
        {viewingSnapshot && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingSnapshot(null)}>
                <button onClick={() => setViewingSnapshot(null)} className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors p-2 bg-white/10 rounded-full backdrop-blur-md">
                    <X size={24} />
                </button>
                <div className="relative max-w-5xl max-h-[90vh] rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800" onClick={e => e.stopPropagation()}>
                    <img src={viewingSnapshot} alt="Device Snapshot" className="w-full h-full object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex justify-center pointer-events-none">
                         <a href={viewingSnapshot} download="snapshot.jpg" target="_blank" rel="noreferrer" className="pointer-events-auto bg-white text-black px-6 py-2 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-slate-200 transition-colors">
                            <Download size={14} /> Download Original
                         </a>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
