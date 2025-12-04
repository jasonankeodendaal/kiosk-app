
import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, Cloud, Database
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue } from '../types';
import { resetStoreData } from '../services/geminiService';
import { checkSupabaseConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import Peer from 'peerjs';

// --- PDF.js WORKER SETUP ---
const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

// --- UTILS ---
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Helper: Convert Base64 to Blob for Zip Export
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

// Helper: Read File to Base64
const readFileAsBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// --- COMPONENT: AUTH ---
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

// --- COMPONENT: FILE UPLOAD ---
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
                            <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-blue-600">Add</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => { if(e.target.files?.[0]) { const reader = new FileReader(); reader.onloadend = () => { if(typeof reader.result === 'string') { setFormData({...formData, galleryUrls: [...(formData.galleryUrls || []), reader.result]}); } }; reader.readAsDataURL(e.target.files[0]); } }} />
                         </label>
                      </div>
                  </div>
               </div>
            )}
            {activeTab === 'terms' && (
               <div className="animate-fade-in bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-2 text-sm">Terms & Conditions</h4>
                  <p className="text-xs text-slate-500 mb-4 font-medium">Enter legal terms specific to this product.</p>
                  <InputField label="Terms Text" val={formData.terms || ''} onChange={(e: any) => setFormData({...formData, terms: e.target.value})} placeholder="Enter terms here..." isArea />
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const AdManager = ({ ads, onUpdate, onSaveGlobal }: { ads: AdConfig, onUpdate: (ads: AdConfig) => void, onSaveGlobal: () => void }) => {
    const addAd = (zone: keyof AdConfig, url: string, type: 'image' | 'video') => { const newItem: AdItem = { id: generateId('ad'), type, url }; const newZone = [...ads[zone], newItem]; onUpdate({ ...ads, [zone]: newZone }); };
    const removeAd = (zone: keyof AdConfig, id: string) => { const newZone = ads[zone].filter(x => x.id !== id); onUpdate({ ...ads, [zone]: newZone }); };
    const ZoneEditor = ({ zone, title, desc, sizeInfo }: { zone: keyof AdConfig, title: string, desc: string, sizeInfo: string }) => (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
            <h4 className="font-black text-lg text-slate-900 mb-1 flex items-center gap-2">{title}</h4>
            <p className="text-xs text-slate-500 font-medium mb-4">{desc}</p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 flex items-center gap-2">
                 <div className="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-400"><Monitor size={16} /></div>
                 <div><div className="text-[9px] font-black uppercase text-slate-400">Target Size</div><div className="text-xs font-bold text-slate-700 font-mono">{sizeInfo}</div></div>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   {ads[zone].map((item, idx) => (
                      <div key={item.id} className="relative group bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-200 shadow-sm">
                         {item.type === 'video' ? <video src={item.url} className="w-full h-full object-cover opacity-80" /> : <img src={item.url} alt="Ad" className="w-full h-full object-cover" />}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <div className="px-2 py-1 bg-black/50 text-white text-[9px] font-bold uppercase rounded">{item.type}</div>
                             <button onClick={() => removeAd(zone, item.id)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><Trash2 size={12} /></button>
                         </div>
                         <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-[8px] font-bold rounded">#{idx+1}</div>
                      </div>
                   ))}
                </div>
                <FileUpload label="Add Content (Image/Video)" accept="image/*,video/*" icon={<Megaphone />} helperText="Supports JPG, PNG, MP4" onUpload={(data, type) => addAd(zone, data, type || 'image')} />
            </div>
        </div>
    );
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
               <div><h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Ads & Marketing</h2><p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage Promotional Content</p></div>
               <button onClick={onSaveGlobal} className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-wide">
                  <Save size={14} /> Save Changes
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-300 pb-2"><LayoutTemplate size={20} className="text-blue-600" /> Home Page Layout</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ZoneEditor zone="homeBottomLeft" title="Bottom Left" desc="Horizontal ad box below brand grid." sizeInfo="Approx. 800px x 400px (2:1)" />
                        <ZoneEditor zone="homeBottomRight" title="Bottom Center" desc="Horizontal ad box adjacent to left." sizeInfo="Approx. 800px x 400px (2:1)" />
                        <ZoneEditor zone="homeSideVertical" title="Right Vertical" desc="Tall sidebar ad for high visibility." sizeInfo="Approx. 1080px x 1920px (9:16)" />
                    </div>
                </div>
                <div className="md:col-span-2 mt-8">
                    <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-300 pb-2"><Play size={20} className="text-purple-600" /> Screensaver Boost</h3>
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm mb-6"><p className="text-sm text-purple-900 font-medium">Content uploaded here will be injected into the screensaver loop. These items are prioritized and will appear more frequently than standard products.</p></div>
                    <ZoneEditor zone="screensaver" title="Special Advertisement Content" desc="Multi-upload support. Videos will auto-play." sizeInfo="Fullscreen 1920px x 1080px" />
                </div>
            </div>
        </div>
    );
};

const AdminCatalogManager = ({ storeData, onUpdateData, onSaveGlobal }: { storeData: StoreData, onUpdateData: (d: StoreData) => void, onSaveGlobal: () => void }) => {
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
    const [editingCatalog, setEditingCatalog] = useState<Catalogue | null>(null);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);

    const brands = storeData.brands || [];
    const catalogues = storeData.catalogues || [];
    
    // Filter catalogs based on selected brand or show global/unassigned
    const filteredCatalogs = selectedBrandId 
        ? catalogues.filter(c => c.brandId === selectedBrandId) 
        : catalogues.filter(c => !c.brandId);
    
    // Handle PDF upload for the currently editing catalog
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files?.[0] || !editingCatalog) return;
        const file = e.target.files[0];
        setIsProcessingPdf(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjs.getDocument(arrayBuffer).promise;
            const totalPages = pdfDoc.numPages;
            const pageImages: string[] = [];
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (context) {
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
                }
            }
            setEditingCatalog(prev => prev ? { ...prev, pdfUrl: URL.createObjectURL(file), pages: pageImages } : null);
            setIsProcessingPdf(false);
        } catch (err) { console.error("PDF Process Error", err); alert("Failed to process PDF."); setIsProcessingPdf(false); }
    };

    // Handle multi-image upload for the currently editing catalog
    const handleCatalogImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !editingCatalog) return;
        setIsProcessingPdf(true);
        const files: File[] = Array.from(e.target.files) as File[];
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        try {
            const pageImages: string[] = [];
            for (const file of files) {
                const reader = new FileReader();
                const result = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                pageImages.push(result);
            }
            setEditingCatalog(prev => prev ? { ...prev, pdfUrl: '', pages: pageImages } : null);
            setIsProcessingPdf(false);
        } catch (err) { console.error("Image Process Error", err); alert("Failed to process images."); setIsProcessingPdf(false); }
    };

    const handleSaveCatalog = () => {
        if (!editingCatalog) return;
        const newCatalogues = [...(storeData.catalogues || [])];
        const index = newCatalogues.findIndex(c => c.id === editingCatalog.id);
        if (index > -1) {
            newCatalogues[index] = editingCatalog; // Update existing
        } else {
            newCatalogues.push(editingCatalog); // Add new
        }
        onUpdateData({ ...storeData, catalogues: newCatalogues });
        setEditingCatalog(null); // Close modal
    };

    const handleDeleteCatalog = (id: string) => {
        if (confirm("Are you sure you want to delete this catalog?")) {
            onUpdateData({ ...storeData, catalogues: (storeData.catalogues || []).filter(c => c.id !== id) });
        }
    };
    
    // Sort catalogs by year then month for display
    const sortedCatalogs = [...filteredCatalogs].sort((a, b) => {
        if (a.year && b.year && a.year !== b.year) return a.year - b.year;
        if (a.month && b.month) return a.month - b.month;
        return 0;
    });

    return (
        <div className="max-w-5xl mx-auto animate-fade-in space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Catalogues & Branding</h2>
                <button onClick={onSaveGlobal} className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-wide">
                    <Save size={14} /> Save Changes
                </button>
            </div>
            
            {/* Global Identity (Company Logo) */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
                <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Globe size={20} className="text-blue-500" /> Global Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <p className="text-xs text-slate-500 font-bold mb-4">Set the main company logo displayed on the kiosk top bar.</p>
                       <FileUpload label="Company Logo (Top Bar)" currentUrl={storeData.companyLogoUrl} onUpload={(data) => onUpdateData({ ...storeData, companyLogoUrl: data })} />
                    </div>
                </div>
            </div>

            {/* Kiosk Hero Section */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
                <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Monitor size={20} className="text-blue-500" /> Kiosk Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Title</label><input className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner" defaultValue={storeData.hero?.title || 'Our Partners'} onChange={(e) => { const newHero = { ...(storeData.hero || { title: '', subtitle: '' }), title: e.target.value }; onUpdateData({ ...storeData, hero: newHero }); }} /></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Hero Subtitle</label><input className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner" defaultValue={storeData.hero?.subtitle || 'Select a brand to explore.'} onChange={(e) => { const newHero = { ...(storeData.hero || { title: '', subtitle: '' }), subtitle: e.target.value }; onUpdateData({ ...storeData, hero: newHero }); }} /></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Website URL</label><input className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner" placeholder="https://example.com" defaultValue={storeData.hero?.websiteUrl || ''} onChange={(e) => { const newHero = { ...(storeData.hero || { title: '', subtitle: '' }), websiteUrl: e.target.value }; onUpdateData({ ...storeData, hero: newHero }); }} /></div>
                    </div>
                    <div className="space-y-4">
                        <FileUpload label="Hero Background Image" currentUrl={storeData.hero?.backgroundImageUrl} onUpload={(data) => { const newHero = { ...(storeData.hero || { title: '', subtitle: '' }), backgroundImageUrl: data }; onUpdateData({ ...storeData, hero: newHero }); }} />
                        <FileUpload label="Hero Logo (Brand Overlay)" currentUrl={storeData.hero?.logoUrl} onUpload={(data) => { const newHero = { ...(storeData.hero || { title: '', subtitle: '' }), logoUrl: data }; onUpdateData({ ...storeData, hero: newHero }); }} />
                    </div>
                </div>
            </div>

            {/* Digital Catalogs - NEW SECTION */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
                <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><BookOpen size={20} className="text-blue-500" /> Digital Catalogs</h3>
                
                {/* Brand Selector for Catalogs */}
                <div className="mb-6">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Filter by Brand (for management)</label>
                    <select
                        className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner"
                        value={selectedBrandId || ''}
                        onChange={(e) => setSelectedBrandId(e.target.value || null)}
                    >
                        <option value="">All Global / Unassigned</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                    </select>
                </div>

                {/* List Existing Catalogs */}
                <div className="space-y-4 mb-6">
                    {sortedCatalogs.map(catalog => (
                        <div key={catalog.id} className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="w-16 h-16 shrink-0 bg-white rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center p-1">
                                {catalog.pages?.[0] ? <img src={catalog.pages[0]} alt="Cover" className="w-full h-full object-contain" /> : <BookOpen size={24} className="text-slate-300" />}
                            </div>
                            <div className="flex-1 ml-4">
                                <h4 className="font-bold text-slate-900 text-sm">{catalog.title}</h4>
                                <p className="text-xs text-slate-500">
                                    {catalog.brandId ? `Brand: ${brands.find(b => b.id === catalog.brandId)?.name || 'Unknown'}` : 'Global'}
                                    {catalog.year && ` | Year: ${catalog.year}`}
                                    {catalog.month && ` | Month: ${new Date(0, catalog.month - 1).toLocaleString('en', { month: 'short' })}`}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => setEditingCatalog({...catalog})} className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteCatalog(catalog.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add New Catalog Button */}
                <button 
                    onClick={() => setEditingCatalog({ id: generateId('cat'), title: '', pages: [], brandId: selectedBrandId || undefined })} 
                    className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                    <Plus size={20} className="text-slate-300 group-hover:text-blue-500" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-blue-600">Add New Catalog</span>
                </button>
            </div>

            {/* Edit Catalog Modal */}
            {editingCatalog && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">{editingCatalog.title ? 'Edit Catalog' : 'New Catalog'}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Configure Digital Catalog</p>
                            </div>
                            <button onClick={() => setEditingCatalog(null)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-blue-600 block mb-1">Catalog Title</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                    value={editingCatalog.title} 
                                    onChange={e => setEditingCatalog({...editingCatalog, title: e.target.value})} 
                                    placeholder="e.g. Summer Collection 2024"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Assign to Brand (Optional)</label>
                                <select
                                    className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner"
                                    value={editingCatalog.brandId || ''}
                                    onChange={(e) => setEditingCatalog({...editingCatalog, brandId: e.target.value || undefined})}
                                >
                                    <option value="">Global / Unassigned</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Year (Optional)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                        value={editingCatalog.year || ''} 
                                        onChange={e => setEditingCatalog({...editingCatalog, year: e.target.value ? parseInt(e.target.value) : undefined})} 
                                        placeholder="e.g. 2024"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Month (Optional)</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                        value={editingCatalog.month || ''} 
                                        onChange={e => setEditingCatalog({...editingCatalog, month: e.target.value ? parseInt(e.target.value) : undefined})}
                                    >
                                        <option value="">None</option>
                                        {[...Array(12).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div><h4 className="font-bold text-blue-900 text-sm">Upload Catalog PDF</h4><p className="text-xs text-blue-600 mt-1">Automatically convert PDF to images.</p></div>
                                    </div>
                                    <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 transition-all cursor-pointer group ${isProcessingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload size={32} className="text-blue-300 group-hover:text-blue-500 mb-2 transition-colors" /><span className="font-black text-blue-400 group-hover:text-blue-600 uppercase tracking-widest text-xs">Select PDF File</span><input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                                    </label>
                                </div>
                                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div><h4 className="font-bold text-purple-900 text-sm">Upload Multi-Images</h4><p className="text-xs text-purple-600 mt-1">Select multiple JPG/PNG files for the catalog.</p></div>
                                    </div>
                                    <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-xl bg-white hover:bg-purple-50 transition-all cursor-pointer group ${isProcessingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <ImageIcon size={32} className="text-purple-300 group-hover:text-purple-500 mb-2 transition-colors" /><span className="font-black text-purple-400 group-hover:text-purple-600 uppercase tracking-widest text-xs">Select Images</span><input type="file" className="hidden" accept="image/*" multiple onChange={handleCatalogImagesUpload} />
                                    </label>
                                </div>
                            </div>

                            {editingCatalog.pages && editingCatalog.pages.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2"><h4 className="font-black text-xs uppercase text-slate-400">Preview ({editingCatalog.pages.length} Pages)</h4><button onClick={() => setEditingCatalog(prev => prev ? { ...prev, pdfUrl: '', pages: [] } : null)} className="text-red-500 text-[10px] font-bold uppercase hover:underline">Remove Pages</button></div>
                                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">{editingCatalog.pages.map((page, idx) => ( <div key={idx} className="aspect-[2/3] bg-slate-100 rounded border border-slate-200 overflow-hidden relative group"><img src={page} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">{idx + 1}</div></div> ))}</div>
                                </div>
                            )}
                            {isProcessingPdf && (<div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm mt-4"><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div><span className="text-[10px] font-black uppercase text-blue-500">Processing...</span></div>)}
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setEditingCatalog(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs uppercase">Cancel</button>
                            <button onClick={handleSaveCatalog} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all text-xs uppercase flex items-center gap-2"><Save size={16} /> Save Catalog</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const FleetManager = ({ fleet, onUpdateFleet, onSaveGlobal }: { fleet: KioskRegistry[], onUpdateFleet: (f: KioskRegistry[]) => void, onSaveGlobal: () => void }) => {
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [viewingCamera, setViewingCamera] = useState<KioskRegistry | null>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);

  // Clean up Peer on close
  useEffect(() => {
    if (!viewingCamera && peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
    }
  }, [viewingCamera]);

  const handleSave = (kiosk: KioskRegistry) => {
      const idx = fleet.findIndex(k => k.id === kiosk.id);
      if (idx >= 0) {
          const newFleet = [...fleet];
          newFleet[idx] = kiosk;
          onUpdateFleet(newFleet);
      } else {
          onUpdateFleet([...fleet, kiosk]);
      }
      setEditingKiosk(null);
  };

  const handleDelete = (id: string) => {
      if(confirm('Deregister this device from the fleet?')) {
          onUpdateFleet(fleet.filter(k => k.id !== id));
      }
  };

  const handleOpenEdit = (kiosk: KioskRegistry) => {
      setEditingKiosk({ ...kiosk });
  };

  const handleAddNew = () => {
      setEditingKiosk({
          id: generateId('LOC'),
          name: 'New Kiosk',
          status: 'offline',
          last_seen: new Date().toISOString(),
          wifiStrength: 0,
          ipAddress: '0.0.0.0',
          version: '1.0.0',
          locationDescription: '',
          assignedZone: '',
          notes: ''
      });
  };

  const openCamera = (kiosk: KioskRegistry) => {
      setViewingCamera(kiosk);
      setLoadingCamera(true);

      const adminPeerId = 'admin-' + Math.random().toString(36).substr(2, 9);
      const peer = new Peer(adminPeerId, { debug: 1 });
      
      peer.on('open', (id) => {
          const targetPeerId = `kiosk-pro-${kiosk.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;
          console.log(`Admin ${id} attempting to call ${targetPeerId}`);
          
          setTimeout(() => {
             navigator.mediaDevices.getUserMedia({ video: false, audio: true })
               .then((localStream) => {
                   localStream.getTracks().forEach(track => track.enabled = false);
                   const call = peer.call(targetPeerId, localStream);
                   
                   call.on('stream', (remoteStream) => {
                       console.log("Stream received!");
                       setLoadingCamera(false);
                       if (videoRef.current) videoRef.current.srcObject = remoteStream;
                   });
                   
                   call.on('error', (err) => {
                       console.error("Call error", err);
                       alert("Connection Error. Ensure Kiosk is Online and Awake.");
                       setLoadingCamera(false);
                   });

                   // If stream doesn't arrive in 10s
                   setTimeout(() => {
                       if(loadingCamera) {
                           setLoadingCamera(false);
                           // alert("Connection timed out. Peer unreachable.");
                       }
                   }, 10000);
               })
               .catch(e => {
                   alert("Please allow permission to initiate connection.");
                   setLoadingCamera(false);
               });
          }, 1500);
      });
      
      peer.on('error', (err) => {
          if (err.type === 'peer-unavailable') {
              alert(`Kiosk (${kiosk.id}) is not connected to the peer network. Ensure it is awake.`);
              setLoadingCamera(false);
              setViewingCamera(null);
          } else {
              console.error("PeerJS Error", err);
          }
      });
      peerRef.current = peer;
  };

  const getSignalIcon = (strength: number) => { if (strength > 75) return <Wifi size={16} className="text-green-500" />; if (strength > 40) return <Wifi size={16} className="text-yellow-500" />; if (strength > 0) return <Wifi size={16} className="text-red-500" />; return <WifiOff size={16} className="text-slate-300" />; };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in relative pb-20">
       <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div><h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Fleet Command</h2><p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Active devices</p></div>
           <div className="flex gap-2">
               <button onClick={handleAddNew} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 hover:bg-slate-800 transition-all w-full md:w-auto justify-center"><Plus size={16} /> Add Device</button>
               <button onClick={onSaveGlobal} className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-wide">
                  <Save size={14} /> Save Changes
               </button>
           </div>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {fleet.map((kiosk) => (
            <div key={kiosk.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-blue-400 transition-all hover:shadow-xl transform hover:-translate-y-1 h-full relative">
               <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-4 overflow-hidden">
                       <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner shrink-0 relative">
                           <Tablet size={24} />
                           {kiosk.status === 'online' && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                       </div>
                       <div className="min-w-0">
                           <h3 className="font-black text-lg text-slate-900 leading-none mb-1 truncate">{kiosk.name}</h3>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{kiosk.locationDescription || 'No Location Set'}</span>
                           <span className="text-[9px] font-mono text-slate-300 truncate block">{kiosk.ipAddress}</span>
                       </div>
                   </div>
                   <div className="flex gap-1 shrink-0">
                       <button onClick={() => handleOpenEdit(kiosk)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                       <button onClick={() => handleDelete(kiosk.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                   </div>
               </div>
                <div className="space-y-3 mb-4">
                   <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
                       <span>ZONE: {kiosk.assignedZone || 'N/A'}</span>
                       <span className="flex items-center gap-1">{kiosk.wifiStrength}% {getSignalIcon(kiosk.wifiStrength)}</span>
                   </div>
                   {kiosk.notes && <p className="text-xs text-slate-500 italic bg-yellow-50 p-2 rounded border border-yellow-100 line-clamp-2">"{kiosk.notes}"</p>}
               </div>
               
               <button 
                  onClick={() => openCamera(kiosk)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md"
               >
                   <Eye size={14} /> View Camera Feed
               </button>
            </div>
          ))}
       </div>

       {/* EDIT MODAL */}
       {editingKiosk && (
           <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-300 max-h-[90vh] overflow-y-auto animate-fade-in">
                   <div className="flex justify-between items-center mb-6">
                       <div>
                           <h3 className="text-2xl font-black text-slate-900">Device Configuration</h3>
                           <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Edit Fleet Details</p>
                       </div>
                       <button onClick={() => setEditingKiosk(null)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Device ID</label>
                               <input className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500 text-sm" value={editingKiosk.id} disabled />
                           </div>
                           <div>
                               <label className="text-[10px] font-black uppercase text-blue-600 block mb-1">Shop Name</label>
                               <input 
                                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                    value={editingKiosk.name} 
                                    onChange={e => setEditingKiosk({...editingKiosk, name: e.target.value})} 
                                    placeholder="e.g. Fashion Outlet"
                                />
                           </div>
                       </div>
                       
                       <div>
                            <label className="text-[10px] font-black uppercase text-blue-600 block mb-1">Specific Location (Floor/Area)</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    className="w-full p-3 pl-10 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                    value={editingKiosk.locationDescription || ''} 
                                    onChange={e => setEditingKiosk({...editingKiosk, locationDescription: e.target.value})} 
                                    placeholder="e.g. Main Entrance, Floor 2, North Wing" 
                                />
                            </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Zone / Area</label>
                                 <input 
                                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                    value={editingKiosk.assignedZone || ''} 
                                    onChange={e => setEditingKiosk({...editingKiosk, assignedZone: e.target.value})} 
                                    placeholder="e.g. Zone A" 
                                />
                            </div>
                            <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Status Override</label>
                                 <select 
                                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none" 
                                    value={editingKiosk.status} 
                                    onChange={e => setEditingKiosk({...editingKiosk, status: e.target.value as any})}
                                >
                                     <option value="online">Online</option>
                                     <option value="offline">Offline</option>
                                 </select>
                            </div>
                       </div>
                       
                       <div>
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Notes</label>
                            <textarea 
                                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 text-sm focus:ring-2 ring-blue-500 outline-none h-24 resize-none" 
                                value={editingKiosk.notes || ''} 
                                onChange={e => setEditingKiosk({...editingKiosk, notes: e.target.value})} 
                                placeholder="Internal notes..." 
                            />
                       </div>
                   </div>
                   <div className="mt-8 flex justify-end gap-3">
                       <button onClick={() => setEditingKiosk(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-xs uppercase">Cancel</button>
                       <button onClick={() => handleSave(editingKiosk)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all text-xs uppercase flex items-center gap-2"><Save size={16} /> Save Changes</button>
                   </div>
               </div>
           </div>
       )}

       {/* CAMERA MODAL */}
       {viewingCamera && (
           <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
               <div className="w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                   <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start">
                       <div>
                           <div className="flex items-center gap-2">
                               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
                               <h3 className="text-white font-bold text-sm tracking-wider uppercase">Live Feed: {viewingCamera.name}</h3>
                           </div>
                           <p className="text-slate-400 text-[10px] font-mono mt-1">{viewingCamera.ipAddress} • {viewingCamera.locationDescription}</p>
                       </div>
                       <button onClick={() => setViewingCamera(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white transition-colors"><X size={20} /></button>
                   </div>

                   <div className="aspect-video bg-black flex items-center justify-center relative">
                       {loadingCamera ? (
                           <div className="text-center">
                               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                               <p className="text-blue-500 font-bold uppercase tracking-widest text-xs animate-pulse">Establishing P2P Connection...</p>
                               <p className="text-slate-500 text-[10px] mt-2 font-mono">Dialing: kiosk-pro-{viewingCamera.id.replace(/[^a-zA-Z0-9-_]/g, '')}</p>
                           </div>
                       ) : (
                           <div className="w-full h-full relative group">
                               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="text-center bg-black/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                                       <Video size={48} className="text-green-500 mx-auto mb-4" />
                                       <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Live P2P Stream Active</p>
                                   </div>
                               </div>
                               <div className="absolute bottom-4 left-4 font-mono text-green-500 text-xs opacity-80">REC [LIVE] <br/>PROTOCOL: PEERJS/WEBRTC</div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}

// Wrapper for simple editing
const SimpleEditor = ({ type, initialData, onSave, onCancel }: any) => {
    const [name, setName] = useState(initialData?.name || '');
    const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
    
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                <h3 className="text-xl font-black text-slate-900 mb-6 capitalize">{initialData ? `Edit ${type}` : `New ${type}`}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Name</label>
                        <input className="w-full p-3 border border-slate-300 rounded-xl font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." />
                    </div>
                    {type === 'brand' && (
                         <FileUpload label="Brand Logo" currentUrl={logoUrl} onUpload={(d) => setLogoUrl(d)} />
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={() => onSave({ ...(initialData || { id: generateId(type === 'brand' ? 'b' : 'c'), products: [], categories: [] }), name, logoUrl })} className="px-6 py-2 bg-blue-600 text-white font-bold text-xs uppercase rounded-lg shadow-lg hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN LAYOUT ---
export const AdminDashboard = ({ onExit, storeData, onUpdateData }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void }) => {
  const [session, setSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'fleet' | 'settings' | 'catalog' | 'ads'>('inventory');
  const [viewLevel, setViewLevel] = useState<'brands' | 'categories' | 'products'>('brands');
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: 'brand'|'category'|'product', data?: any } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const activeBrand = storeData?.brands.find(b => b.id === activeBrandId);
  const activeCategory = activeBrand?.categories.find(c => c.id === activeCategoryId);

  // Check Supabase on Mount
  useEffect(() => {
     checkSupabaseConnection().then(setSupabaseConnected);
  }, []);

  // Global Save Handler
  const handleGlobalSave = async () => {
      if(!storeData) return;
      setIsSaving(true);
      onUpdateData({...storeData});
      setTimeout(() => setIsSaving(false), 1000);
  };

  const processFilesToStoreData = async (fileMap: Map<string, Blob>, rootJson?: StoreData) => {
      const paths: string[] = Array.from(fileMap.keys());
      if (paths.length === 0) return storeData || { ...resetStoreData() } as any;

      const firstPathParts = paths[0].split('/');
      let rootDirToStrip = "";
      if (firstPathParts.length > 1) {
          const potentialRoot = firstPathParts[0];
          const allShareRoot = paths.every(p => p.startsWith(potentialRoot + '/'));
          if (allShareRoot) rootDirToStrip = potentialRoot;
      }

      let newData: StoreData = rootJson || { 
          ...storeData, 
          brands: [], 
          catalogues: [], 
          hero: storeData?.hero || { title: 'Welcome', subtitle: '' }
      } as StoreData;

      const brandsMap = new Map<string, Brand>();
      if (newData.brands) newData.brands.forEach(b => brandsMap.set(b.name, b));

      const getOrCreateBrand = (name: string) => {
          let b = brandsMap.get(name);
          if (!b) { b = { id: generateId('b'), name, categories: [] }; brandsMap.set(name, b); }
          return b;
      }

      for (const [rawPath, blob] of fileMap.entries()) {
          let cleanPath = rawPath.replace(/\\/g, '/');
          if (rootDirToStrip && cleanPath.startsWith(rootDirToStrip + '/')) cleanPath = cleanPath.substring(rootDirToStrip.length + 1);
          const parts = cleanPath.split('/').filter(p => p && p !== '.' && p !== '__MACOSX');
          if (parts.length === 0) continue;

          if (parts[0].toLowerCase() === 'catalogues') {
               if (parts.length >= 3 && parts[1] && parts[2].match(/\.(jpg|jpeg|png|webp)$/i)) {
                   const catalogTitle = parts[1];
                   let currentCatalog = newData.catalogues?.find(c => c.title === catalogTitle);
                   if (!currentCatalog) {
                       currentCatalog = { id: generateId('cat'), title: catalogTitle, pages: [] };
                       if (!newData.catalogues) newData.catalogues = [];
                       newData.catalogues.push(currentCatalog);
                   }
                   const base64 = await readFileAsBase64(blob);
                   currentCatalog.pages.push(base64);
               }
               if (parts.length === 3 && parts[2].toLowerCase() === 'info.json') {
                   const catalogTitle = parts[1];
                   let currentCatalog = newData.catalogues?.find(c => c.title === catalogTitle);
                   if (!currentCatalog) {
                       currentCatalog = { id: generateId('cat'), title: catalogTitle, pages: [] };
                       if (!newData.catalogues) newData.catalogues = [];
                       newData.catalogues.push(currentCatalog);
                   }
                   const text = await blob.text();
                   const info = JSON.parse(text);
                   Object.assign(currentCatalog, info);
                   if (!currentCatalog.id) currentCatalog.id = generateId('cat');
               }
               continue;
          }

          if (parts.length === 2 && parts[1].toLowerCase().includes('logo')) {
              const brand = getOrCreateBrand(parts[0]);
              brand.logoUrl = await readFileAsBase64(blob);
              continue;
          }

          if (parts.length >= 4) {
              const brand = getOrCreateBrand(parts[0]);
              let category = brand.categories.find(c => c.name === parts[1]);
              if (!category) { category = { id: generateId('c'), name: parts[1], products: [], icon: 'Box' }; brand.categories.push(category); }
              let product = category.products.find(p => p.name === parts[2]);
              if (!product) { product = { id: generateId('p'), name: parts[2], description: 'Imported', specs: {}, features: [], dimensions: { width: '', height: '', depth: '', weight: '' }, imageUrl: '', galleryUrls: [] }; category.products.push(product); }
              const fileName = parts[3].toLowerCase();
              if (fileName.endsWith('.txt') || fileName.endsWith('.json')) continue;
              const base64 = await readFileAsBase64(blob);
              if (fileName.includes('main') || fileName.includes('cover') || (!product.imageUrl && fileName.match(/\.(jpg|jpeg|png|webp)$/))) product.imageUrl = base64;
              else if (fileName.match(/\.(mp4|webm)$/)) product.videoUrl = base64;
              else if (fileName.match(/\.(jpg|jpeg|png|webp)$/) && base64 !== product.imageUrl && !product.galleryUrls?.includes(base64)) product.galleryUrls = [...(product.galleryUrls || []), base64];
          }
          
          if (parts.length === 3) {
              if (!parts[2].match(/\.(jpg|jpeg|png|webp|mp4|webm)$/i)) continue;
              const brand = getOrCreateBrand(parts[0]);
              let category = brand.categories.find(c => c.name === parts[1]);
              if (!category) { category = { id: generateId('c'), name: parts[1], products: [], icon: 'Box' }; brand.categories.push(category); }
              const prodName = parts[2].replace(/\.[^/.]+$/, "");
              let product = category.products.find(p => p.name === prodName);
              if (!product) { product = { id: generateId('p'), name: prodName, description: '', specs: {}, features: [], dimensions: { width: '', height: '', depth: '', weight: '' }, imageUrl: '', galleryUrls: [] }; category.products.push(product); }
              const base64 = await readFileAsBase64(blob);
              if (parts[2].match(/\.(mp4|webm)$/i)) product.videoUrl = base64; else product.imageUrl = base64;
          }
      }
      newData.brands = Array.from(brandsMap.values());
      if (newData.catalogues) newData.catalogues.forEach(c => c.pages?.sort((a, b) => (parseInt(a.match(/_(\d+)\./)?.[1] || '0') - parseInt(b.match(/_(\d+)\./)?.[1] || '0'))));
      return newData;
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      setIsImporting(true);
      try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(e.target.files[0]);
          const fileMap = new Map<string, Blob>();
          let rootJson: StoreData | undefined;
          let jsonFile = contents.file("store_config.json") || contents.file(Object.keys(contents.files).find(p => p.endsWith("store_config.json")) || "");
          if (jsonFile) { const text = await jsonFile.async("text"); if (text) rootJson = JSON.parse(text); }
          const promises: Promise<void>[] = [];
          contents.forEach((path, entry) => { if(!entry.dir && !path.endsWith('.json') && !path.includes('__MACOSX')) promises.push(entry.async('blob').then(b => { fileMap.set(path, b); })); });
          await Promise.all(promises);
          const newData = await processFilesToStoreData(fileMap, rootJson);
          onUpdateData(newData);
          alert("Import Successful!");
      } catch (e) { console.error(e); alert("Import Failed"); } finally { setIsImporting(false); }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      setIsImporting(true);
      try {
          const fileMap = new Map<string, Blob>();
          for (let i = 0; i < e.target.files.length; i++) { if (e.target.files[i].webkitRelativePath) fileMap.set(e.target.files[i].webkitRelativePath, e.target.files[i]); }
          const newData = await processFilesToStoreData(fileMap);
          onUpdateData(newData);
          alert("Folder Import Successful!");
      } catch (e) { console.error(e); alert("Folder Import Failed"); } finally { setIsImporting(false); }
  };

  const handleDownloadBackup = async () => {
    if (!storeData) return;
    setIsSaving(true);
    try {
        const zip = new JSZip();
        zip.file("store_config.json", JSON.stringify(storeData, null, 2));
        storeData.brands.forEach(brand => {
            const bFolder = zip.folder(brand.name.replace(/[^a-z0-9]/gi, '_'));
            if (brand.logoUrl?.startsWith('data:')) bFolder?.file("logo.png", dataURItoBlob(brand.logoUrl)!);
            brand.categories.forEach(cat => {
                const cFolder = bFolder?.folder(cat.name.replace(/[^a-z0-9]/gi, '_'));
                cat.products.forEach(prod => {
                    const pFolder = cFolder?.folder(prod.name.replace(/[^a-z0-9]/gi, '_'));
                    pFolder?.file("info.txt", `Name: ${prod.name}\nSKU: ${prod.sku}`);
                    if (prod.imageUrl?.startsWith('data:')) pFolder?.file("main_image.png", dataURItoBlob(prod.imageUrl)!);
                    prod.galleryUrls?.forEach((url, i) => { if(url.startsWith('data:')) pFolder?.file(`gallery_${i+1}.png`, dataURItoBlob(url)!); });
                });
            });
        });
        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(content); a.download = `backup.zip`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { alert("Backup failed"); } finally { setIsSaving(false); }
  };

  const handleSaveBrand = (brand: Brand) => { if(!storeData) return; let newBrands = [...storeData.brands]; const idx = newBrands.findIndex(b => b.id === brand.id); if (idx >= 0) newBrands[idx] = brand; else newBrands.push(brand); onUpdateData({ ...storeData, brands: newBrands }); setEditingItem(null); };
  const handleSaveCategory = (category: Category) => { if (!activeBrand || !storeData) return; const newBrands = [...storeData.brands]; const bIdx = newBrands.findIndex(b => b.id === activeBrand.id); const newCats = [...newBrands[bIdx].categories]; const cIdx = newCats.findIndex(c => c.id === category.id); if (cIdx >= 0) newCats[cIdx] = category; else newCats.push(category); newBrands[bIdx] = { ...newBrands[bIdx], categories: newCats }; onUpdateData({ ...storeData, brands: newBrands }); setEditingItem(null); };
  const handleSaveProduct = (product: Product) => {
    if (!activeBrand || !activeCategory || !storeData) return;
    const newBrands = [...storeData.brands];
    const bIdx = newBrands.findIndex(b => b.id === activeBrand.id);
    if (bIdx === -1) return;
    const newCats = [...newBrands[bIdx].categories];
    const cIdx = newCats.findIndex(c => c.id === activeCategory.id);
    if (cIdx === -1) return;
    const newProds = [...newCats[cIdx].products];
    const pIdx = newProds.findIndex(p => p.id === product.id);
    if (pIdx >= 0) newProds[pIdx] = product; else newProds.push(product);
    newCats[cIdx] = { ...newCats[cIdx], products: newProds };
    newBrands[bIdx] = { ...newBrands[bIdx], categories: newCats };
    onUpdateData({ ...storeData, brands: newBrands });
    setEditingItem(null);
  };

  const deleteItem = (type: 'brand'|'category'|'product', id: string) => {
    if(!storeData || !confirm("Delete item?")) return;
    const newBrands = [...storeData.brands];
    if(type === 'brand') {
       onUpdateData({ ...storeData, brands: newBrands.filter(b => b.id !== id) });
    } else if (type === 'category' && activeBrand) {
       const bIdx = newBrands.findIndex(b => b.id === activeBrand.id);
       if (bIdx > -1) {
           newBrands[bIdx].categories = newBrands[bIdx].categories.filter(c => c.id !== id);
           onUpdateData({ ...storeData, brands: newBrands });
       }
    } else if (type === 'product' && activeBrand && activeCategory) {
       const bIdx = newBrands.findIndex(b => b.id === activeBrand.id);
       if (bIdx > -1) {
           const cIdx = newBrands[bIdx].categories.findIndex(c => c.id === activeCategory.id);
           if (cIdx > -1) {
               newBrands[bIdx].categories[cIdx].products = newBrands[bIdx].categories[cIdx].products.filter(p => p.id !== id);
               onUpdateData({ ...storeData, brands: newBrands });
           }
       }
    }
  };

  if (!session) return <Auth setSession={setSession} />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
        <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 z-20 shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-black tracking-tighter">Admin Hub</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kiosk Control Center</p>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {[
                    { id: 'inventory', label: 'Inventory', icon: <Box size={18} /> },
                    { id: 'fleet', label: 'Fleet Command', icon: <Tablet size={18} /> },
                    { id: 'catalog', label: 'Catalogs', icon: <BookOpen size={18} /> },
                    { id: 'ads', label: 'Ads & Marketing', icon: <Megaphone size={18} /> },
                    { id: 'settings', label: 'Setup Guide', icon: <HelpCircle size={18} /> }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id as any); if(item.id === 'inventory') setViewLevel('brands'); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wide ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 space-y-3">
                 <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-slate-500">
                    <Database size={12} className={supabaseConnected ? "text-green-500" : "text-slate-600"} />
                    {supabaseConnected ? "Cloud Database Active" : "Local Storage Mode"}
                 </div>
                 
                 <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors group">
                    {isImporting ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <FolderInput size={16} className="group-hover:text-blue-400" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">Import Folder</span>
                    <input type="file" className="hidden" webkitdirectory="" directory="" multiple onChange={handleFolderUpload} />
                 </label>
                 
                 <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors group">
                    <FileArchive size={16} className="group-hover:text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Import ZIP</span>
                    <input type="file" className="hidden" accept=".zip" onChange={handleZipUpload} />
                 </label>
                 
                 <button onClick={handleDownloadBackup} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors group">
                    <Download size={16} className="group-hover:text-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Backup Data</span>
                 </button>

                 <button onClick={onExit} className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Exit Admin</span>
                 </button>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4">
                     {activeTab === 'inventory' && viewLevel !== 'brands' && (
                         <button onClick={() => {
                             if(viewLevel === 'products') { setViewLevel('categories'); setActiveCategory(null); }
                             else { setViewLevel('brands'); setActiveBrandId(null); }
                         }} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider">
                             <ArrowLeft size={16} /> Back
                         </button>
                     )}
                     <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                        {activeTab === 'inventory' ? (
                            viewLevel === 'brands' ? 'Brand Management' : 
                            viewLevel === 'categories' ? `Categories / ${activeBrand?.name}` : 
                            `Products / ${activeCategory?.name}`
                        ) : activeTab === 'fleet' ? 'Fleet Management' : 
                          activeTab === 'catalog' ? 'Catalog Manager' :
                          activeTab === 'ads' ? 'Ad Manager' : 'System Setup'}
                     </h2>
                </div>
                <div className="flex items-center gap-4">
                     {isSaving && <span className="text-blue-600 font-bold text-xs animate-pulse flex items-center gap-2"><Save size={14} /> Saving...</span>}
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
                 {activeTab === 'inventory' && (
                     <>
                        {viewLevel === 'brands' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {storeData?.brands.map(brand => (
                                    <div key={brand.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group relative">
                                        <div className="aspect-square flex items-center justify-center bg-slate-50 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                                            {brand.logoUrl ? <img src={brand.logoUrl} className="w-2/3 h-2/3 object-contain" /> : <span className="text-2xl font-black text-slate-300">{brand.name[0]}</span>}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-center mb-2">{brand.name}</h3>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => { setActiveBrandId(brand.id); setViewLevel('categories'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><ChevronRight size={16} /></button>
                                            <button onClick={() => setEditingItem({type: 'brand', data: brand})} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Edit2 size={16} /></button>
                                            <button onClick={() => deleteItem('brand', brand.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setEditingItem({type: 'brand', data: null})} className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all gap-2">
                                    <Plus size={32} />
                                    <span className="font-black text-xs uppercase tracking-widest">Add Brand</span>
                                </button>
                            </div>
                        )}

                        {viewLevel === 'categories' && activeBrand && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {activeBrand.categories.map(cat => (
                                    <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all group">
                                        <div className="h-24 flex items-center justify-center bg-slate-50 rounded-xl mb-4 text-slate-300">
                                            <Box size={32} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-center mb-1">{cat.name}</h3>
                                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase mb-4">{cat.products.length} Products</p>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => { setActiveCategoryId(cat.id); setViewLevel('products'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><ChevronRight size={16} /></button>
                                            <button onClick={() => setEditingItem({type: 'category', data: cat})} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><Edit2 size={16} /></button>
                                            <button onClick={() => deleteItem('category', cat.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setEditingItem({type: 'category', data: null})} className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all gap-2">
                                    <Plus size={32} />
                                    <span className="font-black text-xs uppercase tracking-widest">Add Category</span>
                                </button>
                            </div>
                        )}

                        {viewLevel === 'products' && activeCategory && (
                            <div className="space-y-4">
                                {activeCategory.products.map(prod => (
                                    <div key={prod.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                                {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><Box size={20} className="text-slate-300" /></div>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                                                <p className="text-xs text-slate-500 font-mono">{prod.sku || 'No SKU'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingItem({type: 'product', data: prod})} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-lg hover:bg-slate-200">Edit</button>
                                            <button onClick={() => deleteItem('product', prod.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => setEditingItem({type: 'product', data: null})} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold uppercase text-xs hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                    <Plus size={16} /> Add Product to {activeCategory.name}
                                </button>
                            </div>
                        )}
                     </>
                 )}

                 {activeTab === 'fleet' && storeData && <FleetManager fleet={storeData.fleet || []} onUpdateFleet={(f) => { onUpdateData({...storeData, fleet: f}); handleGlobalSave(); }} onSaveGlobal={handleGlobalSave} />}
                 {activeTab === 'catalog' && storeData && <AdminCatalogManager storeData={storeData} onUpdateData={onUpdateData} onSaveGlobal={handleGlobalSave} />}
                 {activeTab === 'ads' && storeData && <AdManager ads={storeData.ads || { homeBottomLeft: [], homeBottomRight: [], homeSideVertical: [], screensaver: [] }} onUpdate={(ads) => onUpdateData({...storeData, ads})} onSaveGlobal={handleGlobalSave} />}
                 {activeTab === 'settings' && <SetupGuide onClose={() => setActiveTab('inventory')} />}

            </div>
        </main>
        
        {/* Modals for Brand/Category Editing */}
        {editingItem && editingItem.type === 'product' && (
             <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="w-full max-w-4xl h-[90vh]">
                    <ProductEditor 
                        product={editingItem.data} 
                        onSave={(p: Product) => { handleSaveProduct(p); handleGlobalSave(); }} 
                        onCancel={() => setEditingItem(null)} 
                    />
                 </div>
             </div>
        )}

        {(editingItem && (editingItem.type === 'brand' || editingItem.type === 'category')) && (
            <SimpleEditor 
               type={editingItem.type}
               initialData={editingItem.data}
               onSave={(newData: any) => {
                   if(editingItem.type === 'brand') handleSaveBrand(newData);
                   else handleSaveCategory(newData);
                   handleGlobalSave();
               }}
               onCancel={() => setEditingItem(null)}
            />
        )}
    </div>
  );
};
