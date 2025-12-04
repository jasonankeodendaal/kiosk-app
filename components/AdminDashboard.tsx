
import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue } from '../types';
import { resetStoreData } from '../services/geminiService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import Peer from 'peerjs';

const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const dataURItoBlob = (dataURI: string) => {
  if (!dataURI || !dataURI.includes(',')) return null;
  try {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  } catch (e) {
    return null;
  }
};

const readFileAsBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const parseTextData = async (blob: Blob): Promise<Record<string, any>> => {
    try {
        const text = await blob.text();
        const lines = text.split('\n');
        const data: Record<string, any> = {};
        
        lines.forEach(line => {
             const parts = line.split(':');
             if (parts.length >= 2) {
                 const key = parts[0].trim().toLowerCase();
                 const val = parts.slice(1).join(':').trim();
                 
                 if (key === 'specs' || key === 'dimensions' || key === 'features') {
                    try {
                        if (val.startsWith('{') || val.startsWith('[')) {
                            data[key] = JSON.parse(val);
                        } else {
                            data[key] = val;
                        }
                    } catch {
                        data[key] = val;
                    }
                 } else {
                     data[key] = val;
                 }
             }
        });
        return data;
    } catch (e) {
        console.error("Failed to parse text file", e);
        return {};
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
  helperText = "JPG/PNG up to 2MB"
}: { 
  currentUrl?: string, 
  onUpload: (data: string, fileType?: 'image' | 'video') => void, 
  label: string,
  accept?: string,
  icon?: React.ReactNode,
  helperText?: string
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const type = file.type.startsWith('video') ? 'video' : 'image';
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpload(reader.result, type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden relative shrink-0 text-slate-300 shadow-inner">
           {currentUrl ? (
             accept.includes('video') && (currentUrl.startsWith('data:video') || currentUrl.endsWith('.mp4')) ? 
             <Video size={20} className="text-blue-500" /> : 
             <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
           ) : (
             icon
           )}
        </div>
        <div className="flex-1 min-w-0">
           <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all shadow hover:bg-slate-800 transform hover:-translate-y-0.5 whitespace-nowrap">
              <Upload size={12} />
              Select File
              <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />
           </label>
           <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase truncate">{helperText}</p>
        </div>
      </div>
    </div>
  );
};

const ProductEditor = ({ product, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState<Product>(product || {
    id: generateId('p'), name: '', sku: '', description: '', terms: '', imageUrl: '', galleryUrls: [], videoUrl: '', specs: {}, features: [], dimensions: { width: '', height: '', depth: '', weight: '' }
  });
  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'media' | 'terms'>('general');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  const addSpec = () => { if(!specKey || !specVal) return; setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specKey]: specVal } })); setSpecKey(''); setSpecVal(''); };
  const removeSpec = (key: string) => { const newSpecs = { ...formData.specs }; delete newSpecs[key]; setFormData(prev => ({ ...prev, specs: newSpecs })); };
  const addFeature = () => { if(!featureInput) return; setFormData(prev => ({ ...prev, features: [...prev.features, featureInput] })); setFeatureInput(''); };

  const InputField = ({ label, val, onChange, placeholder, isArea = false, half = false }: any) => (
    <div className={`mb-4 ${half ? 'w-full' : ''}`}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
      {isArea ? (
        <textarea value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed shadow-inner font-medium resize-none text-sm" placeholder={placeholder} />
      ) : (
        <input value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm shadow-inner" placeholder={placeholder} />
      )}
    </div>
  );

  return (
    <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[calc(100vh-140px)] depth-shadow">
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 shadow-sm relative z-10">
         <div><h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{product ? 'Edit Product' : 'New Product'}</h3></div>
         <div className="flex gap-2">
             <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 text-xs uppercase">Cancel</button>
             <button onClick={() => onSave(formData)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all text-xs uppercase"><Save size={14} /> Save</button>
         </div>
      </div>
      <div className="flex border-b border-slate-200 bg-white shrink-0 px-4 shadow-sm z-0 overflow-x-auto">
         {['general', 'specs', 'media', 'terms'].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{tab}</button>
         ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
         <div className="max-w-4xl mx-auto">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">Basic Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><InputField label="Product Name" val={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Nexus Prime" /></div>
                        <InputField label="SKU / Code" val={formData.sku || ''} onChange={(e: any) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. NEX-X1-BLK" />
                        <InputField label="Weight" val={formData.dimensions.weight || ''} onChange={(e: any) => setFormData({...formData, dimensions: {...formData.dimensions, weight: e.target.value}})} placeholder="200g" />
                    </div>
                    <InputField label="Description" val={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} placeholder="Marketing copy..." isArea />
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Box size={16} className="text-blue-500" /> Dimensions</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {['width', 'height', 'depth'].map((dim) => (
                          <div key={dim} className="flex items-center gap-4">
                             <label className="w-16 text-[10px] font-black text-slate-400 uppercase text-right">{dim}</label>
                             <input className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-black shadow-inner focus:outline-none focus:border-blue-500" placeholder="0mm" value={(formData.dimensions as any)[dim]} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions, [dim]: e.target.value}})} />
                          </div>
                        ))}
                    </div>
                 </div>
              </div>
            )}
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Monitor size={16} className="text-blue-500" /> Technical Specs</h4>
                    <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                       <input placeholder="Spec (e.g. CPU)" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specKey} onChange={e => setSpecKey(e.target.value)} />
                       <input placeholder="Value" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specVal} onChange={e => setSpecVal(e.target.value)} />
                       <button onClick={addSpec} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {Object.entries(formData.specs).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                           <span className="font-bold text-slate-500 uppercase">{k}</span>
                           <div className="flex items-center gap-3"><span className="font-bold text-slate-900">{v}</span><button onClick={() => removeSpec(k)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div>
                        </div>
                      ))}
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Key Features</h4>
                    <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                       <input placeholder="Add a feature bullet..." className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={featureInput} onChange={e => setFeatureInput(e.target.value)} />
                       <button onClick={addFeature} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {formData.features.map((f: string, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                           <span className="text-slate-900 font-bold truncate max-w-[200px]">{f}</span>
                           <button onClick={() => setFormData({...formData, features: formData.features.filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            )}
            {activeTab === 'media' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Main Image</h4>
                        <FileUpload label="Primary Display Image" currentUrl={formData.imageUrl} onUpload={(data) => setFormData({...formData, imageUrl: data})} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Video Content</h4>
                        <FileUpload label="Product Video (MP4/WebM)" accept="video/*" icon={<Video />} helperText="MP4/WAV/WebM up to 10MB." currentUrl={formData.videoUrl} onUpload={(data) => setFormData({...formData, videoUrl: data})} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Gallery Images</h4>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                         {formData.galleryUrls?.map((url: string, idx: number) => (
                           <div key={idx} className="aspect-square bg-slate-100 rounded-xl relative overflow-hidden group shadow-inner border border-slate-200">
                              <img src={url} className="w-full h-full object-cover" alt="" />
                              <button onClick={() => setFormData({...formData, galleryUrls: formData.galleryUrls?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"><Trash2 size={12} /></button>
                           </div>
                         ))}
                         <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group bg-slate-50/50">
                            <Plus size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors mb-1" />
                            <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-blue-500">Add</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    const reader = new FileReader();
                                    reader.onload = () => setFormData({...formData, galleryUrls: [...(formData.galleryUrls || []), reader.result as string]});
                                    reader.readAsDataURL(e.target.files[0]);
                                }
                            }} />
                         </label>
                      </div>
                  </div>
               </div>
            )}
            {activeTab === 'terms' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in h-full">
                    <h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Warranty & Legal</h4>
                    <textarea 
                        className="w-full h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono leading-relaxed resize-none shadow-inner"
                        value={formData.terms} 
                        onChange={e => setFormData({...formData, terms: e.target.value})}
                        placeholder="Enter terms and conditions..."
                    />
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export const AdminDashboard = ({ onExit, storeData, onUpdateData }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void }) => {
  const [session, setSession] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  if (!session) return <Auth setSession={setSession} />;

  const activeBrand = storeData?.brands.find(b => b.id === activeBrandId);
  const activeCategory = activeBrand?.categories.find(c => c.id === activeCategoryId);

  const handleSaveProduct = (product: Product) => {
      if (!storeData || !activeBrand || !activeCategory) return;
      
      const updatedBrands = storeData.brands.map(b => {
          if (b.id !== activeBrand.id) return b;
          return {
              ...b,
              categories: b.categories.map(c => {
                  if (c.id !== activeCategory.id) return c;
                  const exists = c.products.find(p => p.id === product.id);
                  let newProducts = c.products;
                  if (exists) {
                      newProducts = c.products.map(p => p.id === product.id ? product : p);
                  } else {
                      newProducts = [...c.products, product];
                  }
                  return { ...c, products: newProducts };
              })
          };
      });
      
      onUpdateData({ ...storeData, brands: updatedBrands });
      setEditingProduct(null);
      setIsCreatingProduct(false);
  };

  if (editingProduct || isCreatingProduct) {
      return <ProductEditor 
                product={editingProduct} 
                onSave={handleSaveProduct} 
                onCancel={() => { setEditingProduct(null); setIsCreatingProduct(false); }} 
             />;
  }
  
  if (showSetup) {
      return <SetupGuide onClose={() => setShowSetup(false)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
       {/* Sidebar */}
       <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 z-20 shadow-xl">
          <div className="p-6 border-b border-slate-800">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
                <span className="font-bold text-lg tracking-tight">Admin Hub</span>
             </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
             <button onClick={() => { setActiveBrandId(null); setActiveCategoryId(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!activeBrandId ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
                <LayoutTemplate size={18} /> <span className="font-bold text-sm">Dashboard</span>
             </button>
             <div className="pt-4 pb-2 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Inventory</div>
             {storeData?.brands.map(brand => (
                 <button key={brand.id} onClick={() => { setActiveBrandId(brand.id); setActiveCategoryId(null); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeBrandId === brand.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <Box size={18} /> <span className="font-bold text-sm truncate">{brand.name}</span>
                 </button>
             ))}
             <button onClick={() => {
                 const newBrand: Brand = { id: generateId('b'), name: 'New Brand', categories: [] };
                 onUpdateData({ ...storeData!, brands: [...(storeData?.brands || []), newBrand] });
             }} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-slate-800 border-2 border-dashed border-slate-800 hover:border-slate-700 transition-all">
                <Plus size={18} /> <span className="font-bold text-sm">Add Brand</span>
             </button>
          </nav>
          <div className="p-4 border-t border-slate-800 bg-slate-900">
             <button onClick={() => setShowSetup(true)} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all mb-2">
                 <HelpCircle size={18} /> <span className="font-bold text-sm">Setup Guide</span>
             </button>
             <button onClick={onExit} className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                 <LogOut size={18} /> <span className="font-bold text-sm">Exit Hub</span>
             </button>
          </div>
       </div>

       {/* Main View */}
       <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 relative">
          {/* Top Bar */}
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
             <div className="flex items-center gap-4 text-slate-500">
                <span className="font-bold text-xs uppercase tracking-wider">Path:</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                   <span>Home</span>
                   {activeBrand && <><ChevronRight size={14} className="text-slate-400" /> <span>{activeBrand.name}</span></>}
                   {activeCategory && <><ChevronRight size={14} className="text-slate-400" /> <span>{activeCategory.name}</span></>}
                </div>
             </div>
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <Wifi size={14} /> <span className="text-xs font-bold uppercase">Online</span>
                 </div>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
             {!activeBrand ? (
                // Dashboard Home
                <div className="max-w-5xl mx-auto animate-fade-in">
                   <h2 className="text-3xl font-black text-slate-900 mb-8">System Overview</h2>
                   <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="text-slate-400 font-bold text-xs uppercase mb-2">Total Brands</div>
                         <div className="text-4xl font-black text-slate-900">{storeData?.brands.length}</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="text-slate-400 font-bold text-xs uppercase mb-2">Active Kiosks</div>
                         <div className="text-4xl font-black text-slate-900">{storeData?.fleet?.length || 0}</div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="text-slate-400 font-bold text-xs uppercase mb-2">Last Sync</div>
                         <div className="text-xl font-bold text-slate-900">Just now</div>
                      </div>
                   </div>
                   
                   <h3 className="text-xl font-black text-slate-900 mb-4">Fleet Status</h3>
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-100">
                             <tr>
                                <th className="p-4 text-xs font-black uppercase text-slate-500">ID</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-500">Name</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-500">Status</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-500">Last Seen</th>
                             </tr>
                          </thead>
                          <tbody>
                             {storeData?.fleet?.map(k => (
                                <tr key={k.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                   <td className="p-4 font-mono text-sm font-bold text-slate-600">{k.id}</td>
                                   <td className="p-4 font-bold text-slate-900">{k.name}</td>
                                   <td className="p-4"><span className={`inline-block w-2 h-2 rounded-full mr-2 ${k.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span> <span className="text-xs font-bold uppercase">{k.status}</span></td>
                                   <td className="p-4 text-xs font-mono text-slate-500">{new Date(k.last_seen).toLocaleTimeString()}</td>
                                </tr>
                             ))}
                             {(!storeData?.fleet || storeData.fleet.length === 0) && (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400 font-bold italic">No devices registered.</td></tr>
                             )}
                          </tbody>
                       </table>
                   </div>
                </div>
             ) : !activeCategory ? (
                // Brand View
                <div className="animate-fade-in">
                   <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                          {activeBrand.logoUrl && <img src={activeBrand.logoUrl} className="w-16 h-16 object-contain bg-white rounded-lg border border-slate-200 p-2" />}
                          <h2 className="text-3xl font-black text-slate-900">{activeBrand.name}</h2>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => {
                               const newName = prompt("Rename Brand", activeBrand.name);
                               if(newName) {
                                   const updated = storeData!.brands.map(b => b.id === activeBrand.id ? {...b, name: newName} : b);
                                   onUpdateData({...storeData!, brands: updated});
                               }
                           }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"><Edit2 size={16} /></button>
                           <button onClick={() => {
                               if(confirm("Delete this brand?")) {
                                   const updated = storeData!.brands.filter(b => b.id !== activeBrand.id);
                                   onUpdateData({...storeData!, brands: updated});
                                   setActiveBrandId(null);
                               }
                           }} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {activeBrand.categories.map(cat => (
                           <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
                               <div className="flex items-center justify-between mb-4">
                                   <span className="bg-blue-50 text-blue-600 p-3 rounded-lg"><Box size={24} /></span>
                                   <span className="text-2xl font-black text-slate-200 group-hover:text-blue-100 transition-colors">{cat.products.length}</span>
                               </div>
                               <h3 className="text-xl font-bold text-slate-900 mb-1">{cat.name}</h3>
                               <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">View Products</p>
                           </button>
                       ))}
                       <button onClick={() => {
                           const name = prompt("Category Name (e.g. Smartphones)");
                           if(name) {
                               const newCat: Category = { id: generateId('c'), name, icon: 'Box', products: [] };
                               const updated = storeData!.brands.map(b => b.id === activeBrand.id ? {...b, categories: [...b.categories, newCat]} : b);
                               onUpdateData({...storeData!, brands: updated});
                           }
                       }} className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center hover:bg-white hover:border-blue-400 transition-all group cursor-pointer">
                           <Plus size={32} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                           <span className="font-bold text-slate-400 group-hover:text-blue-600">Add Category</span>
                       </button>
                   </div>
                </div>
             ) : (
                // Products View
                <div className="animate-fade-in">
                   <div className="flex items-center gap-4 mb-8">
                       <button onClick={() => setActiveCategoryId(null)} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ArrowLeft size={24} /></button>
                       <h2 className="text-3xl font-black text-slate-900">{activeCategory.name}</h2>
                       <button onClick={() => setIsCreatingProduct(true)} className="ml-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-700 shadow-lg flex items-center gap-2">
                           <Plus size={18} /> New Product
                       </button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {activeCategory.products.map(product => (
                           <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                               <div className="aspect-square bg-slate-50 relative">
                                   {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-contain p-4" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Box size={32} /></div>}
                               </div>
                               <div className="p-4">
                                   <h4 className="font-bold text-slate-900 truncate mb-1">{product.name}</h4>
                                   <p className="text-xs text-slate-500 font-mono mb-4">{product.sku}</p>
                                   <div className="flex gap-2">
                                       <button onClick={() => setEditingProduct(product)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold uppercase hover:bg-blue-50 hover:text-blue-600 transition-colors">Edit</button>
                                       <button onClick={() => {
                                           if(confirm("Delete product?")) {
                                               const updatedProds = activeCategory.products.filter(p => p.id !== product.id);
                                               const updatedBrands = storeData!.brands.map(b => {
                                                   if(b.id !== activeBrand!.id) return b;
                                                   return {
                                                       ...b,
                                                       categories: b.categories.map(c => c.id === activeCategory.id ? {...c, products: updatedProds} : c)
                                                   };
                                               });
                                               onUpdateData({...storeData!, brands: updatedBrands});
                                           }
                                       }} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
