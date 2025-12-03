
// ... existing imports
import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play
} from 'lucide-react';
import { fetchKioskFleet, KioskRegistry } from '../services/kioskService';
import { StoreData, Brand, Category, Product, AdConfig, AdItem } from '../types';
import { resetStoreData } from '../services/geminiService';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// --- PDF.js WORKER SETUP ---
const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
} else {
    console.warn("PDF.js GlobalWorkerOptions not found");
}

// --- UTILS ---
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

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
        <div className="flex-1">
           <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all shadow hover:bg-slate-800 transform hover:-translate-y-0.5">
              <Upload size={12} />
              Select File
              <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />
           </label>
           <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{helperText}</p>
        </div>
      </div>
    </div>
  );
};

// ... ProductEditor ...
// (Skipping full ProductEditor re-write for brevity, assume it persists or copy logic from previous if needed, but since I am returning full file content I need to include it)
// TO SAVE TOKENS AND COMPLEXITY I will re-include ProductEditor, AdManager, FleetManager etc.

const ProductEditor = ({ product, onSave, onCancel }: any) => {
  // ... Simplified Re-implementation to fit within response limits if possible, or assume existing ...
  // Actually, I must provide full content.
  const [formData, setFormData] = useState<Product>(product || {
    id: generateId('p'), name: '', sku: '', description: '', terms: '', imageUrl: '', galleryUrls: [], videoUrl: '', specs: {}, features: [], dimensions: { width: '', height: '', depth: '', weight: '' }
  });
  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'media' | 'terms'>('general');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  // ... helpers ...
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
         <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">{product ? 'Edit Product' : 'New Product'}</h3></div>
         <div className="flex gap-2">
             <button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 text-xs uppercase">Cancel</button>
             <button onClick={() => onSave(formData)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all text-xs uppercase"><Save size={14} /> Save</button>
         </div>
      </div>
      <div className="flex border-b border-slate-200 bg-white shrink-0 px-4 shadow-sm z-0">
         {['general', 'specs', 'media', 'terms'].map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{tab}</button>
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

const AdManager = ({ ads, onUpdate }: { ads: AdConfig, onUpdate: (ads: AdConfig) => void }) => {
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
            <div className="mb-8"><h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Ads & Marketing</h2><p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage Promotional Content</p></div>
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

const FleetManager = () => {
  const [fleet, setFleet] = useState<KioskRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const loadFleet = async () => { setLoading(true); const data = await fetchKioskFleet(); setFleet(data); setLoading(false); };
  useEffect(() => { loadFleet(); }, []);
  const getSignalIcon = (strength: number) => { if (strength > 75) return <Wifi size={16} className="text-green-500" />; if (strength > 40) return <Wifi size={16} className="text-yellow-500" />; if (strength > 0) return <Wifi size={16} className="text-red-500" />; return <WifiOff size={16} className="text-slate-300" />; };
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
       <div className="flex justify-between items-center mb-8"><div><h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Fleet Command</h2><p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Active devices</p></div><button onClick={loadFleet} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 shadow hover:shadow-lg transition-all"><RotateCcw size={20} className={loading ? "animate-spin" : ""} /></button></div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fleet.map((kiosk) => (
            <div key={kiosk.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-blue-400 transition-all hover:shadow-xl transform hover:-translate-y-1 h-full">
               <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner shrink-0"><Monitor size={24} /></div><div><h3 className="font-black text-lg text-slate-900 leading-none mb-1">{kiosk.name}</h3><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kiosk.ipAddress}</span></div></div>
                   <div className={`w-3 h-3 rounded-full ${kiosk.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`}></div>
               </div>
               <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between"><div><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</div><div className="font-mono font-bold text-slate-700">{kiosk.id}</div></div><div className="w-px h-6 bg-slate-200"></div><div className="text-right"><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signal</div><div className="flex items-center justify-end gap-1 font-bold text-slate-700">{kiosk.wifiStrength}% {getSignalIcon(kiosk.wifiStrength)}</div></div></div>
               <div className="mt-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Last Seen: {new Date(kiosk.last_seen).toLocaleTimeString()}</div>
            </div>
          ))}
       </div>
    </div>
  );
}

// --- MAIN LAYOUT ---
const AdminDashboard = ({ onExit, storeData, onUpdateData }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void }) => {
  const [session, setSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'fleet' | 'settings' | 'catalog' | 'ads'>('inventory');
  const [viewLevel, setViewLevel] = useState<'brands' | 'categories' | 'products'>('brands');
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: 'brand'|'category'|'product', data?: any } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const activeBrand = storeData?.brands.find(b => b.id === activeBrandId);
  const activeCategory = activeBrand?.categories.find(c => c.id === activeCategoryId);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!e.target.files?.[0] || !storeData) return;
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
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const pdfDataUrl = reader.result as string;
            onUpdateData({ ...storeData, catalog: { pdfUrl: pdfDataUrl, pages: pageImages } });
            setIsProcessingPdf(false);
        };
    } catch (err) { console.error("PDF Process Error", err); alert("Failed to process PDF."); setIsProcessingPdf(false); }
  };

  // ... (Process Import Logic - omitted details for space, assuming typical implementation or previous version) ...
  // Actually, I must implement it fully to be safe.
  const processImport = async (files: File[]) => { setIsImporting(true); try { let jsonFile: File | null = null; const assets: Record<string, File> = {}; for (const file of files) { if (file.name.endsWith('.json') && file.name.includes('data')) { jsonFile = file; } else { assets[file.name] = file; if (file.webkitRelativePath) { assets[file.webkitRelativePath] = file; assets[file.name] = file; } } } if (!jsonFile) { alert("No data.json file found."); setIsImporting(false); return; } const text = await jsonFile.text(); const data: StoreData = JSON.parse(text); const fileToDataUrl = (file: File): Promise<string> => { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target?.result as string); reader.readAsDataURL(file); }); }; for (const brand of data.brands) { if (brand.logoUrl && !brand.logoUrl.startsWith('data:')) { const filename = brand.logoUrl.split('/').pop()!; const matchingFile = assets[brand.logoUrl] || assets[filename]; if (matchingFile) brand.logoUrl = await fileToDataUrl(matchingFile); } for (const cat of brand.categories) { for (const prod of cat.products) { if (prod.imageUrl && !prod.imageUrl.startsWith('data:')) { const filename = prod.imageUrl.split('/').pop()!; const matchingFile = assets[prod.imageUrl] || assets[filename]; if (matchingFile) prod.imageUrl = await fileToDataUrl(matchingFile); } if (prod.galleryUrls) { const newGallery = []; for (const url of prod.galleryUrls) { if (!url.startsWith('data:')) { const filename = url.split('/').pop()!; const matchingFile = assets[url] || assets[filename]; if (matchingFile) newGallery.push(await fileToDataUrl(matchingFile)); else newGallery.push(url); } else newGallery.push(url); } prod.galleryUrls = newGallery; } if (prod.videoUrl && !prod.videoUrl.startsWith('data:')) { const filename = prod.videoUrl.split('/').pop()!; const matchingFile = assets[prod.videoUrl] || assets[filename]; if (matchingFile) prod.videoUrl = await fileToDataUrl(matchingFile); } } } } onUpdateData(data); alert("System Populated Successfully!"); } catch (e) { console.error(e); alert("Import failed."); } finally { setIsImporting(false); } };
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; const zipFile = e.target.files[0]; setIsImporting(true); try { const zip = await JSZip.loadAsync(zipFile); const files: File[] = []; for (const [path, zipEntry] of Object.entries(zip.files)) { if ((zipEntry as any).dir) continue; const blob = await (zipEntry as any).async('blob'); files.push(new File([blob], path)); } await processImport(files); } catch (err) { alert("Failed to unzip file."); console.error(err); setIsImporting(false); } };
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files) return; const files = Array.from(e.target.files) as File[]; await processImport(files); };

  const handleSaveBrand = (brand: Brand) => { if(!storeData) return; let newBrands = [...storeData.brands]; const idx = newBrands.findIndex(b => b.id === brand.id); if (idx >= 0) newBrands[idx] = brand; else newBrands.push(brand); onUpdateData({ ...storeData, brands: newBrands }); setEditingItem(null); };
  const handleSaveCategory = (category: Category) => { if (!activeBrand || !storeData) return; const newBrands = [...storeData.brands]; const bIdx = newBrands.findIndex(b => b.id === activeBrand.id); const newCats = [...newBrands[bIdx].categories]; const cIdx = newCats.findIndex(c => c.id === category.id); if (cIdx >= 0) newCats[cIdx] = category; else newCats.push(category); newBrands[bIdx] = { ...newBrands[bIdx], categories: newCats }; onUpdateData({ ...storeData, brands: newBrands }); setEditingItem(null); };
  const handleSaveProduct = (product: Product) => { if (!activeBrand || !activeCategory || !storeData) return; const newBrands = [...storeData.brands]; const bIdx = newBrands.findIndex(b => b.id === activeBrand.id); const newCats = [...newBrands[bIdx].categories]; const cIdx = newCats.findIndex(c => c.id === activeCategory.id); const newProds = [...newCats[cIdx].products]; const pIdx = newProds.findIndex(p => p.id === product.id); if (pIdx >= 0) newProds[pIdx] = product; else newProds.push(product); newCats[cIdx] = { ...newCats[cIdx], products: newProds }; newBrands[bIdx] = { ...newBrands[bIdx], categories: newCats }; onUpdateData({ ...storeData, brands: newBrands }); setEditingItem(null); };
  const deleteItem = (type: 'brand'|'category'|'product', id: string) => { if(!storeData || !confirm("Delete item?")) return; const newBrands = [...storeData.brands]; if(type === 'brand') { onUpdateData({ ...storeData, brands: newBrands.filter(b => b.id !== id) }); } else if (type === 'category' && activeBrand) { const bIdx = newBrands.findIndex(b => b.id === activeBrand.id); newBrands[bIdx].categories = newBrands[bIdx].categories.filter(c => c.id !== id); onUpdateData({ ...storeData, brands: newBrands }); } else if (type === 'product' && activeBrand && activeCategory) { const bIdx = newBrands.findIndex(b => b.id === activeBrand.id); const cIdx = newBrands[bIdx].categories.findIndex(c => c.id === activeCategory.id); newBrands[bIdx].categories[cIdx].products = newBrands[bIdx].categories[cIdx].products.filter(p => p.id !== id); onUpdateData({ ...storeData, brands: newBrands }); } };

  if (!session) return <div className="h-full relative bg-slate-900"><button onClick={onExit} className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 z-10 font-bold uppercase tracking-widest text-xs"><ArrowLeft size={16} /> Exit to Kiosk</button><Auth setSession={setSession} /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans text-slate-900">
      <header className="bg-slate-900 text-white shrink-0 px-6 h-16 flex items-center justify-between shadow-2xl z-30 relative border-b border-slate-700">
         <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-blue-400/30"><Grid size={18} className="text-white" /></div><h1 className="text-lg font-black tracking-tighter leading-none text-white drop-shadow-md">Admin<span className="text-blue-400">Hub</span></h1></div>
            <nav className="flex bg-slate-800 p-1 rounded-lg shadow-inner border border-slate-700 overflow-x-auto">
               {[{ id: 'inventory', label: 'Inventory', icon: Box }, { id: 'catalog', label: 'Catalog & Branding', icon: LayoutTemplate }, { id: 'ads', label: 'Ads & Marketing', icon: Megaphone }, { id: 'fleet', label: 'Fleet', icon: Signal }, { id: 'settings', label: 'System', icon: Monitor }].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-lg transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}><tab.icon size={12} />{tab.label}</button>
               ))}
            </nav>
         </div>
         <div className="flex items-center gap-2"><button onClick={() => setSession(false)} className="bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-all shadow-md border border-slate-700" title="Logout"><LogOut size={16} /></button><div className="w-px h-6 bg-slate-700 mx-1"></div><button onClick={onExit} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 hover:scale-105 border-b-2 border-blue-800 active:border-b-0 active:translate-y-0.5">Exit Hub</button></div>
      </header>
      <main className="flex-1 overflow-hidden relative bg-slate-200">
         <div className="absolute inset-0 bg-slate-200 pointer-events-none z-0 opacity-50" style={{backgroundImage: 'radial-gradient(circle at 50% 50%, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
         {activeTab === 'inventory' && storeData && (
             editingItem?.type === 'product' ? (
                <div className="p-4 h-full relative z-10 flex flex-col justify-center"><div className="max-w-5xl mx-auto w-full h-full"><ProductEditor product={editingItem.data} onSave={handleSaveProduct} onCancel={() => setEditingItem(null)} /></div></div>
            ) : (
            <div className="h-full flex flex-col p-6 overflow-y-auto relative z-10">
               <div className="max-w-7xl mx-auto w-full animate-fade-in">
                  {editingItem?.type === 'brand' && ( <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"><div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-300 transform scale-100"><h3 className="text-xl font-black mb-4 text-slate-900">Manage Brand</h3><div className="space-y-4"><div><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Brand Name</label><input className="w-full p-3 border border-slate-300 rounded-xl font-bold bg-white text-black shadow-inner" placeholder="Brand Name" defaultValue={editingItem.data?.name} onChange={(e) => editingItem.data.name = e.target.value} /></div><FileUpload label="Brand Logo" currentUrl={editingItem.data?.logoUrl} onUpload={(d) => { editingItem.data.logoUrl = d; setEditingItem({...editingItem}); }} /></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setEditingItem(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors text-xs uppercase">Cancel</button><button onClick={() => handleSaveBrand(editingItem.data || { id: generateId('b'), name: '', categories: [] })} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all text-xs uppercase">Save</button></div></div></div> )}
                  {editingItem?.type === 'category' && ( <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"><div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-300"><h3 className="text-xl font-black mb-4 text-slate-900">Manage Category</h3><div><label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Category Name</label><input className="w-full p-3 border border-slate-300 rounded-xl mb-4 font-bold bg-white text-black shadow-inner" placeholder="Category Name" defaultValue={editingItem.data?.name} onChange={(e) => editingItem.data.name = e.target.value} /></div><div className="flex justify-end gap-2"><button onClick={() => setEditingItem(null)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors text-xs uppercase">Cancel</button><button onClick={() => handleSaveCategory(editingItem.data || { id: generateId('c'), name: '', products: [] })} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all text-xs uppercase">Save</button></div></div></div> )}
                  <div className="flex items-center gap-1 mb-6 text-xs font-bold text-slate-500 bg-white inline-flex px-4 py-2 rounded-full shadow-sm border border-slate-200 z-10 relative"><button onClick={() => { setViewLevel('brands'); setActiveBrandId(null); }} className={`hover:text-blue-600 transition-colors ${viewLevel === 'brands' ? 'text-slate-900 font-black' : ''}`}>BRANDS</button>{activeBrand && <><ChevronRight size={12} /><button onClick={() => { setViewLevel('categories'); setActiveCategoryId(null); }} className={`hover:text-blue-600 transition-colors ${viewLevel === 'categories' ? 'text-slate-900 font-black' : ''}`}>{activeBrand.name.toUpperCase()}</button></>}{activeCategory && <><ChevronRight size={12} /><span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded text-[10px]">{activeCategory.name.toUpperCase()}</span></>}</div>
                  {viewLevel === 'brands' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <button onClick={() => setEditingItem({ type: 'brand', data: { id: generateId('b'), name: '', categories: [] } })} className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all gap-2 group bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md"><div className="w-10 h-10 rounded-xl bg-white group-hover:bg-blue-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors shadow-sm border border-slate-100"><Plus size={20} /></div><span className="font-black text-[10px] uppercase tracking-widest">Add Brand</span></button>
                        {storeData.brands.map(brand => ( <div key={brand.id} className="bg-white rounded-2xl shadow-lg border border-white overflow-hidden group relative hover:shadow-xl transition-all transform hover:-translate-y-1 hover:border-blue-200"><div className="aspect-square p-4 flex items-center justify-center cursor-pointer bg-gradient-to-b from-white to-slate-50" onClick={() => { setActiveBrandId(brand.id); setViewLevel('categories'); }}>{brand.logoUrl ? <img src={brand.logoUrl} className="max-w-full max-h-full object-contain filter drop-shadow-sm" /> : <span className="text-4xl font-black text-slate-100">{brand.name[0]}</span>}</div><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"><button onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'brand', data: brand }); }} className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-700 transition-colors"><Edit2 size={10} /></button><button onClick={(e) => { e.stopPropagation(); deleteItem('brand', brand.id); }} className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"><Trash2 size={10} /></button></div><div className="p-2 border-t border-slate-100 text-center font-black text-slate-800 uppercase tracking-wide text-xs bg-white relative z-10 truncate">{brand.name}</div></div> ))}
                    </div>
                  )}
                  {viewLevel === 'categories' && activeBrand && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <button onClick={() => setEditingItem({ type: 'category', data: { id: generateId('c'), name: '', products: [] } })} className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-all gap-2 group bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md"><div className="w-10 h-10 rounded-xl bg-white group-hover:bg-blue-100 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors shadow-sm border border-slate-100"><Plus size={20} /></div><span className="font-black text-[10px] uppercase tracking-widest">Add Category</span></button>
                        {activeBrand.categories.map(cat => ( <div key={cat.id} className="bg-white rounded-2xl shadow-lg border border-white overflow-hidden group relative hover:shadow-xl transition-all transform hover:-translate-y-1 hover:border-blue-200"><div className="aspect-square p-4 flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-white to-slate-50" onClick={() => { setActiveCategoryId(cat.id); setViewLevel('products'); }}><Box className="text-slate-200 mb-2 drop-shadow-sm" size={32} /><span className="font-black text-sm text-slate-800 tracking-tight text-center">{cat.name}</span><span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded mt-1">{cat.products.length} Items</span></div><div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"><button onClick={(e) => { e.stopPropagation(); setEditingItem({ type: 'category', data: cat }); }} className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-700 transition-colors"><Edit2 size={10} /></button><button onClick={(e) => { e.stopPropagation(); deleteItem('category', cat.id); }} className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"><Trash2 size={10} /></button></div></div> ))}
                    </div>
                  )}
                  {viewLevel === 'products' && activeCategory && (
                     <div className="space-y-4 max-w-5xl mx-auto">
                        <button onClick={() => setEditingItem({ type: 'product' })} className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black group bg-white/50 backdrop-blur-sm"><div className="p-1.5 bg-white rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm"><Plus size={16} /></div><span className="text-xs uppercase tracking-widest">ADD NEW PRODUCT</span></button>
                        {activeCategory.products.map(prod => ( <div key={prod.id} className="bg-white p-4 rounded-2xl shadow-sm border border-white flex items-center gap-4 group hover:border-blue-300 transition-all hover:shadow-lg transform hover:-translate-y-0.5"><div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0 shadow-inner p-1"><img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain" /></div><div className="flex-1"><h4 className="font-black text-lg text-slate-900 tracking-tight leading-none">{prod.name}</h4><div className="flex gap-2 text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wide">{prod.sku && <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-700 font-mono">SKU: {prod.sku}</span>}<span className="flex items-center gap-1"><BarChart3 size={10}/> {Object.keys(prod.specs).length} Specs</span></div></div><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"><button onClick={() => setEditingItem({ type: 'product', data: prod })} className="px-3 py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1">Edit</button><button onClick={() => deleteItem('product', prod.id)} className="px-3 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1">Delete</button></div></div> ))}
                     </div>
                  )}
               </div>
            </div>
            )
         )}
         {activeTab === 'ads' && storeData && ( <div className="h-full overflow-y-auto p-6 md:p-8 relative z-10"><AdManager ads={storeData.ads || { homeBottomLeft: [], homeBottomRight: [], homeSideVertical: [], screensaver: [] }} onUpdate={(newAds) => onUpdateData({ ...storeData, ads: newAds })} /></div> )}
         {activeTab === 'catalog' && storeData && (
             <div className="h-full overflow-y-auto p-6 md:p-8 relative z-10">
                 <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Catalog & Branding</h2>
                     
                     <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
                        <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><Globe size={20} className="text-blue-500" /> Global Identity</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <p className="text-xs text-slate-500 font-bold mb-4">Set the main company logo displayed on the kiosk top bar.</p>
                               <FileUpload label="Company Logo (Top Bar)" currentUrl={storeData.companyLogoUrl} onUpload={(data) => onUpdateData({ ...storeData, companyLogoUrl: data })} />
                            </div>
                         </div>
                     </div>

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

                     <div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow">
                        <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2"><BookOpen size={20} className="text-blue-500" /> Digital Catalog</h3>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div><h4 className="font-bold text-blue-900 text-sm">Upload Catalog PDF</h4><p className="text-xs text-blue-600 mt-1">System will automatically convert PDF pages to images for the Flipbook Viewer.</p></div>
                                {isProcessingPdf && (<div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm"><div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div><span className="text-[10px] font-black uppercase text-blue-500">Processing...</span></div>)}
                            </div>
                            <label className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 transition-all cursor-pointer group ${isProcessingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload size={32} className="text-blue-300 group-hover:text-blue-500 mb-2 transition-colors" /><span className="font-black text-blue-400 group-hover:text-blue-600 uppercase tracking-widest text-xs">Select PDF File</span><input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                            </label>
                        </div>
                        {storeData.catalog?.pages && storeData.catalog.pages.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2"><h4 className="font-black text-xs uppercase text-slate-400">Preview ({storeData.catalog.pages.length} Pages)</h4><button onClick={() => onUpdateData({ ...storeData, catalog: { pdfUrl: '', pages: [] } })} className="text-red-500 text-[10px] font-bold uppercase hover:underline">Remove Catalog</button></div>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">{storeData.catalog.pages.map((page, idx) => ( <div key={idx} className="aspect-[2/3] bg-slate-100 rounded border border-slate-200 overflow-hidden relative group"><img src={page} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">{idx + 1}</div></div> ))}</div>
                            </div>
                        )}
                     </div>
                 </div>
             </div>
         )}
         {activeTab === 'fleet' && ( <div className="h-full overflow-y-auto p-6 md:p-8 relative z-10"><FleetManager /></div> )}
         {activeTab === 'settings' && ( <div className="h-full overflow-y-auto p-6 md:p-8 relative z-10"><div className="max-w-7xl mx-auto animate-fade-in"><h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight drop-shadow-sm">System</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow"><h4 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2"><FolderInput className="text-blue-600" size={20} /> Data Import</h4><p className="text-xs text-slate-500 mb-4 font-medium">Populate system. Supports <span className="font-mono bg-slate-100 px-1 rounded">.zip</span> or folder with <span className="font-mono bg-slate-100 px-1 rounded">data.json</span>.</p><div className="space-y-3"><label className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 hover:border-blue-200 transition-all group cursor-pointer shadow-sm"><div className="text-left"><div className="font-black text-blue-900 group-hover:text-blue-700 uppercase tracking-wide text-xs flex items-center gap-2"><FileArchive size={16} /> Upload Zip</div></div><Upload size={16} className="text-blue-400 group-hover:text-blue-600" /><input type="file" className="hidden" accept=".zip" onChange={handleZipUpload} disabled={isImporting} /></label><label className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group cursor-pointer shadow-sm"><div className="text-left"><div className="font-black text-slate-700 group-hover:text-slate-900 uppercase tracking-wide text-xs flex items-center gap-2"><FolderInput size={16} /> Upload Folder</div></div><Upload size={16} className="text-slate-400 group-hover:text-slate-600" /><input type="file" className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} onChange={handleFolderUpload} disabled={isImporting} /></label>{isImporting && (<div className="text-center p-2"><span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span><p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest">Processing...</p></div>)}</div></div><div className="bg-white p-6 rounded-2xl shadow-xl border border-white depth-shadow"><h4 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2"><Save className="text-green-600" size={20} /> Backup & Reset</h4><div className="space-y-3"><button onClick={() => { const blob = new Blob([JSON.stringify(storeData, null, 2)], {type : 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `kiosk-backup-${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-100 hover:border-green-200 transition-all group shadow-sm"><div className="text-left"><div className="font-black text-green-800 group-hover:text-green-900 uppercase tracking-wide text-xs">Download Config</div></div><ArrowLeft size={16} className="rotate-[-90deg] text-green-400 group-hover:text-green-600" /></button><button onClick={async () => { if(confirm("DANGER: Wipe all data?")) { const d = await resetStoreData(); onUpdateData(d); } }} className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 hover:border-red-200 transition-all group shadow-sm"><div className="text-left"><div className="font-black text-red-700 uppercase tracking-wide text-xs">Factory Reset</div></div><RotateCcw size={16} className="text-red-400 group-hover:text-red-600" /></button></div></div></div></div></div> )}
      </main>
    </div>
  );
};

export default AdminDashboard;
