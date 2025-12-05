import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, Megaphone as MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const convertPdfToImages = async (pdfDataUrl: string): Promise<string[]> => {
    try {
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

const BulkImporter = ({ onImport, onStatus, targetBrandName }: { onImport: (data: Partial<StoreData>) => void, onStatus: (msg: string) => void, targetBrandName?: string }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        setIsProcessing(true);
        onStatus("Analyzing folder structure...");
        
        const files: any[] = Array.from(e.target.files);
        const structure: Record<string, any> = {};

        const readFileAsText = (file: File): Promise<string> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string || '');
                reader.readAsText(file);
            });
        };

        const uploadAsset = async (file: File): Promise<string> => {
             // Try cloud storage first
             try {
                const url = await uploadFileToStorage(file);
                return url;
             } catch (e: any) {
                 console.warn("Import Cloud Upload Failed:", e.message);
                 if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                     throw new Error(`File ${file.name} is too large (>2MB) and Cloud Storage failed (${e.message}). Import aborted.`);
                 }
                 // Fallback to base64 for small files
                 return new Promise((resolve) => {
                     const reader = new FileReader();
                     reader.onload = (e) => resolve(e.target?.result as string || '');
                     reader.readAsDataURL(file);
                 });
             }
        };

        const brandsMap: Record<string, Brand> = {};
        
        try {
            const fileGroups: Record<string, File[]> = {};

            for (const file of files) {
                const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
                let brandName = '', categoryName = '', productName = '';
                
                if (targetBrandName) {
                    if (pathParts.length < 4) continue;
                    brandName = targetBrandName;
                    categoryName = pathParts[1];
                    productName = pathParts[2];
                } else {
                    if (pathParts.length < 5) {
                        if (pathParts.length === 3) {
                             const bName = pathParts[1];
                             if (!brandsMap[bName]) {
                                 brandsMap[bName] = { id: generateId('b'), name: bName, categories: [], logoUrl: '' };
                             }
                             if (file.name.toLowerCase().includes('logo') || file.name.toLowerCase().includes('icon')) {
                                 onStatus(`Uploading logo for ${bName}...`);
                                 brandsMap[bName].logoUrl = await uploadAsset(file);
                             }
                        }
                        continue;
                    }
                    brandName = pathParts[1];
                    categoryName = pathParts[2];
                    productName = pathParts[3];
                }
                
                const key = `${brandName}|${categoryName}|${productName}`;
                if (!fileGroups[key]) fileGroups[key] = [];
                fileGroups[key].push(file);
            }

            for (const [key, productFiles] of Object.entries(fileGroups)) {
                const [brandName, categoryName, productName] = key.split('|');
                onStatus(`Processing Product: ${productName} (${brandName})...`);

                if (!brandsMap[brandName]) {
                    brandsMap[brandName] = { id: generateId('b'), name: brandName, categories: [], logoUrl: '' };
                }
                
                let category = brandsMap[brandName].categories.find(c => c.name === categoryName);
                if (!category) {
                    category = { id: generateId('c'), name: categoryName, icon: 'Box', products: [] };
                    brandsMap[brandName].categories.push(category);
                }

                const newProduct: Product = {
                    id: generateId('p'),
                    name: productName,
                    sku: '',
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
                };

                const infoFile = productFiles.find(f => f.name.toLowerCase() === 'info.txt');
                if (infoFile) {
                    const text = await readFileAsText(infoFile);
                    const lines = text.split('\n');
                    lines.forEach(line => {
                        const [k, ...vParts] = line.split(':');
                        if (!k || !vParts) return;
                        const key = k.trim().toLowerCase();
                        const val = vParts.join(':').trim();

                        if (key === 'sku') newProduct.sku = val;
                        else if (key === 'description') newProduct.description = val;
                        else if (key === 'terms') newProduct.terms = val;
                        else if (key === 'weight') newProduct.dimensions.weight = val;
                        else if (key === 'dimensions') {
                             const dims = val.toLowerCase().split('x');
                             if(dims.length === 3) {
                                 newProduct.dimensions = { ...newProduct.dimensions, width: dims[0].trim(), height: dims[1].trim(), depth: dims[2].trim() };
                             }
                        }
                        else if (key.startsWith('spec-')) {
                             const specName = k.trim().substring(5);
                             newProduct.specs[specName] = val;
                        }
                        else if (key === 'feature') {
                             newProduct.features.push(val);
                        }
                        else if (key === 'box') {
                             if(!newProduct.boxContents) newProduct.boxContents = [];
                             newProduct.boxContents.push(val);
                        }
                    });
                }

                for (const file of productFiles) {
                    const name = file.name.toLowerCase();
                    if (name === 'info.txt') continue;

                    if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
                        const url = await uploadAsset(file);
                        if (name.includes('main') || name.includes('cover') || name.includes('primary') || !newProduct.imageUrl) {
                            newProduct.imageUrl = url;
                        } else {
                            newProduct.galleryUrls?.push(url);
                        }
                    } else if (name.endsWith('.mp4') || name.endsWith('.webm')) {
                         newProduct.videoUrl = await uploadAsset(file);
                    } else if (name.endsWith('.pdf')) {
                         newProduct.manualUrl = await uploadAsset(file);
                         const images = await convertPdfToImages(newProduct.manualUrl);
                         newProduct.manualImages = images;
                    }
                }
                category.products.push(newProduct);
            }
            const newBrands = Object.values(brandsMap);
            onImport({ brands: newBrands });
            onStatus(`Completed! Imported ${newBrands.length} brands.`);
        } catch (err: any) {
            console.error(err);
            onStatus(`Error: ${err.message}`);
            alert(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
             <div className="flex flex-col items-center gap-2">
                 {isProcessing ? <Loader2 className="animate-spin text-blue-600" size={32} /> : <FolderInput className="text-slate-400" size={32} />}
                 <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">
                     {targetBrandName ? `Import to ${targetBrandName}` : 'Smart Folder Import'}
                 </h4>
                 <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    {targetBrandName 
                        ? `Select folder containing Categories > Products.` 
                        : `Select root folder containing Brands > Categories > Products.`}
                 </p>
                 <label className={`mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] cursor-pointer transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                     {isProcessing ? 'Importing...' : 'Select Folder'}
                     <input 
                        type="file" 
                        className="hidden" 
                        // @ts-ignore
                        webkitdirectory="" 
                        // @ts-ignore
                        directory="" 
                        multiple 
                        onChange={handleFolderSelect} 
                     />
                 </label>
             </div>
        </div>
    );
};

const KioskEditorModal = ({ kiosk, onSave, onClose }: { kiosk: KioskRegistry, onSave: (k: KioskRegistry) => void, onClose: () => void }) => {
    const [data, setData] = useState(kiosk);
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">Edit Kiosk Details</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Device ID (Read Only)</label><input value={data.id} disabled className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm" /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shop / Display Name</label><input value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900" /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Assigned Zone (Manual Entry)</label><input type="text" value={data.assignedZone || ''} onChange={e => setData({...data, assignedZone: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900" placeholder="e.g. Entrance, Aisle 4, Window" /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Location Details</label><textarea value={data.locationDescription || ''} onChange={e => setData({...data, locationDescription: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 h-20 resize-none" placeholder="e.g. Next to the Nike display..." /></div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-200 text-xs uppercase">Cancel</button>
                    <button onClick={() => onSave(data)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 text-xs uppercase">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const CameraViewerModal = ({ kiosk, onClose, onRequestSnapshot }: { kiosk: KioskRegistry, onClose: () => void, onRequestSnapshot: (k: KioskRegistry) => void }) => {
    useEffect(() => { onRequestSnapshot(kiosk); }, []);
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <div className="absolute top-4 right-4 z-10"><button onClick={onClose} className="bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur"><X size={20} /></button></div>
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                    {kiosk.snapshotUrl ? (<img src={kiosk.snapshotUrl} className="w-full h-full object-contain" alt="Live Feed" />) : (<div className="text-center text-slate-500"><WifiOff size={48} className="mx-auto mb-2 opacity-50" /><p className="font-mono text-xs uppercase">Waiting for Image...</p></div>)}
                    <div className="absolute top-4 left-4 flex items-center gap-2"><span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span><span className="text-white text-xs font-mono font-bold uppercase bg-black/50 px-2 py-1 rounded">LIVE VIEW: {kiosk.name}</span></div>
                    <button onClick={() => onRequestSnapshot(kiosk)} className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase hover:bg-blue-500 shadow-lg"><Camera size={14} className="inline mr-1" /> Refresh Snap</button>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center"><div className="text-slate-400 text-xs font-mono">Signal: {kiosk.wifiStrength}% | IP: {kiosk.ipAddress}</div><div className="text-slate-500 text-[10px] uppercase font-bold">Last Update: {new Date(kiosk.last_seen).toLocaleTimeString()}</div></div>
             </div>
        </div>
    );
};

const DataManagerModal = ({ storeData, onImport, onClose }: { storeData: StoreData, onImport: (d: StoreData) => void, onClose: () => void }) => {
    const [statusMsg, setStatusMsg] = useState("");
    const handleExport = () => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeData, null, 2)); const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr); downloadAnchorNode.setAttribute("download", `kiosk_backup_${new Date().toISOString().split('T')[0]}.json`); document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove(); };
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = (event) => { try { const json = JSON.parse(event.target?.result as string); if(json && json.brands) { if(confirm("This will OVERWRITE all current system data. Are you sure?")) { onImport(json); onClose(); } } else { alert("Invalid System File"); } } catch(err) { alert("Failed to parse JSON file"); } }; reader.readAsText(file); };
    const handleBulkImport = (partialData: Partial<StoreData>) => { if (partialData.brands) { const mergedBrands = [...storeData.brands]; partialData.brands.forEach(newB => { const idx = mergedBrands.findIndex(b => b.name === newB.name); if (idx !== -1) { const existingBrand = mergedBrands[idx]; newB.categories.forEach(newC => { const cIdx = existingBrand.categories.findIndex(c => c.name === newC.name); if (cIdx !== -1) { const existingCat = existingBrand.categories[cIdx]; newC.products.forEach(newP => { const pIdx = existingCat.products.findIndex(p => p.name === newP.name); if (pIdx !== -1) { existingCat.products[pIdx] = newP; } else { existingCat.products.push(newP); } }); } else { existingBrand.categories.push(newC); } }); if (newB.logoUrl) existingBrand.logoUrl = newB.logoUrl; } else { mergedBrands.push(newB); } }); onImport({ ...storeData, brands: mergedBrands }); setTimeout(() => onClose(), 1500); } };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg flex items-center gap-2"><Database size={20}/> System Data</h3><button onClick={onClose}><X size={20} /></button></div>
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl"><h4 className="font-bold text-blue-900 text-sm uppercase mb-2">Export System</h4><p className="text-xs text-blue-700 mb-4">Download a full backup of products, fleets, and settings.</p><button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-xs uppercase"><Download size={16} /> Download .JSON</button></div>
                    <div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 border border-slate-200 p-4 rounded-xl"><h4 className="font-bold text-slate-900 text-sm uppercase mb-2">Import Backup</h4><p className="text-[10px] text-slate-500 mb-4">Restore from a .json backup file.</p><label className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase cursor-pointer transition-colors"><Upload size={14} /> JSON File<input type="file" accept=".json" className="hidden" onChange={handleFileUpload} /></label></div><BulkImporter onImport={handleBulkImport} onStatus={setStatusMsg} /></div>
                    {statusMsg && (<div className="p-3 bg-slate-900 text-white text-[10px] font-mono rounded-lg"><span className="text-green-400 font-bold">&gt;</span> {statusMsg}</div>)}
                </div>
            </div>
        </div>
    );
};

const BrandImportModal = ({ brand, onImport, onClose }: { brand: Brand, onImport: (d: Partial<StoreData>) => void, onClose: () => void }) => {
    const [status, setStatus] = useState("");
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                 <div className="bg-slate-900 p-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg flex items-center gap-2"><FolderInput size={20}/> Bulk Import: {brand.name}</h3><button onClick={onClose}><X size={20} /></button></div>
                 <div className="p-6"><BulkImporter onImport={onImport} onStatus={setStatus} targetBrandName={brand.name} />{status && (<div className="mt-4 p-3 bg-slate-900 text-white text-[10px] font-mono rounded-lg max-h-32 overflow-y-auto"><span className="text-green-400 font-bold">&gt;</span> {status}</div>)}</div>
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

const ProductEditor = ({ product, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState<Product>(product || { id: generateId('p'), name: '', sku: '', description: '', terms: '', imageUrl: '', galleryUrls: [], videoUrl: '', manualUrl: '', manualImages: [], specs: {}, features: [], boxContents: [], dimensions: { width: '', height: '', depth: '', weight: '' } });
    const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'media' | 'terms'>('general');
    const [specKey, setSpecKey] = useState('');
    const [specVal, setSpecVal] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [boxInput, setBoxInput] = useState('');
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  
    const addSpec = () => { if(!specKey || !specVal) return; setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specKey]: specVal } })); setSpecKey(''); setSpecVal(''); };
    const removeSpec = (key: string) => { const newSpecs = { ...formData.specs }; delete newSpecs[key]; setFormData(prev => ({ ...prev, specs: newSpecs })); };
    const addFeature = () => { if(!featureInput) return; setFormData(prev => ({ ...prev, features: [...prev.features, featureInput] })); setFeatureInput(''); };
    const addBoxItem = () => { if(!boxInput) return; setFormData(prev => ({ ...prev, boxContents: [...(prev.boxContents || []), boxInput] })); setBoxInput(''); };
  
    const handleManualUpload = async (data: string | string[]) => { if (Array.isArray(data)) return; setFormData(prev => ({...prev, manualUrl: data})); setIsProcessingPdf(true); const images = await convertPdfToImages(data); setFormData(prev => ({...prev, manualImages: images})); setIsProcessingPdf(false); };
    const handleGalleryUpload = (data: string | string[]) => { if (Array.isArray(data)) { setFormData(prev => ({...prev, galleryUrls: [...(prev.galleryUrls || []), ...data]})); } else { setFormData(prev => ({...prev, galleryUrls: [...(prev.galleryUrls || []), data]})); } };

    return (
        <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col h-[calc(100vh-140px)] depth-shadow">
          <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 shadow-sm relative z-10">
             <div><h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{product ? 'Edit Product' : 'New Product'}</h3></div>
             <div className="flex gap-2"><button onClick={onCancel} className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 text-xs uppercase">Cancel</button><button onClick={() => onSave(formData)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all text-xs uppercase"><Save size={14} /> Save</button></div>
          </div>
          <div className="flex border-b border-slate-200 bg-white shrink-0 px-4 shadow-sm z-0 overflow-x-auto">
             {['general', 'specs', 'media', 'terms'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-3 font-black text-[10px] uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{tab}</button>))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
             <div className="max-w-4xl mx-auto">
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">Basic Info</h4>
                        <div className="grid grid-cols-2 gap-4"><div className="col-span-2"><InputField label="Product Name" val={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Nexus Prime" /></div><InputField label="SKU / Code" val={formData.sku || ''} onChange={(e: any) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. NEX-X1-BLK" /><InputField label="Weight" val={formData.dimensions.weight || ''} onChange={(e: any) => setFormData({...formData, dimensions: {...formData.dimensions, weight: e.target.value}})} placeholder="200g" /></div>
                        <InputField label="Description" val={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} placeholder="Marketing copy..." isArea />
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                        <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Box size={16} className="text-blue-500" /> Dimensions</h4>
                        <div className="grid grid-cols-1 gap-4">{['width', 'height', 'depth'].map((dim) => (<div key={dim} className="flex items-center gap-4"><label className="w-16 text-[10px] font-black text-slate-400 uppercase text-right">{dim}</label><input className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-black shadow-inner focus:outline-none focus:border-blue-500" placeholder="0mm" value={(formData.dimensions as any)[dim]} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions, [dim]: e.target.value}})} /></div>))}</div>
                     </div>
                  </div>
                )}
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                     {/* Technical Specs */}
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                        <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Monitor size={16} className="text-blue-500" /> Technical Specs</h4>
                        {/* Layout Fix: Flex-col on mobile to prevent squashing */}
                        <div className="flex flex-col md:flex-row gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                           <input placeholder="Spec (e.g. CPU)" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specKey} onChange={e => setSpecKey(e.target.value)} />
                           <input placeholder="Value" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specVal} onChange={e => setSpecVal(e.target.value)} />
                           <button onClick={addSpec} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md w-full md:w-auto flex items-center justify-center"><Plus size={14} /></button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">{Object.entries(formData.specs).map(([k, v]) => (<div key={k} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100"><span className="font-bold text-slate-500 uppercase">{k}</span><div className="flex items-center gap-3"><span className="font-bold text-slate-900">{v}</span><button onClick={() => removeSpec(k)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div></div>))}</div>
                     </div>
                     
                     {/* Features & Box Contents */}
                     <div className="space-y-6">
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                            <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Key Features</h4>
                            <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200"><input placeholder="Add a feature bullet..." className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={featureInput} onChange={e => setFeatureInput(e.target.value)} /><button onClick={addFeature} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button></div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">{formData.features.map((f: string, i: number) => (<div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100"><span className="text-slate-900 font-bold truncate max-w-[200px]">{f}</span><button onClick={() => setFormData({...formData, features: formData.features.filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div>))}</div>
                         </div>

                         {/* What's in the Box - NEW SECTION */}
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                            <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Package size={16} className="text-orange-500" /> What's in the Box</h4>
                            <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200"><input placeholder="Item (e.g. Power Cable)" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={boxInput} onChange={e => setBoxInput(e.target.value)} /><button onClick={addBoxItem} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button></div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">{formData.boxContents?.map((item: string, i: number) => (<div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100"><span className="text-slate-900 font-bold truncate max-w-[200px]">{item}</span><button onClick={() => setFormData({...formData, boxContents: formData.boxContents?.filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div>))}</div>
                         </div>
                     </div>
                  </div>
                )}
                {activeTab === 'media' && (
                   <div className="space-y-6 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Main Image</h4><FileUpload label="Primary Display Image" currentUrl={formData.imageUrl} onUpload={(data) => setFormData({...formData, imageUrl: data as string})} /></div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Multimedia</h4><FileUpload label="Product Video (MP4/WebM)" accept="video/*" icon={<Video />} helperText="MP4/WAV/WebM up to 50MB (Storage)" currentUrl={formData.videoUrl} onUpload={(data) => setFormData({...formData, videoUrl: data as string})} /><div className="mt-4 border-t border-slate-100 pt-4"><FileUpload label="Product Manual (PDF)" accept="application/pdf" icon={<FileText size={20} className="text-slate-400" />} helperText="PDF Auto-Converts to Flipbook" currentUrl={formData.manualUrl} onUpload={handleManualUpload} isProcessing={isProcessingPdf} />{formData.manualImages && formData.manualImages.length > 0 && (<div className="mt-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block"><Check size={10} className="inline mr-1" />{formData.manualImages.length} Pages Extracted</div>)}</div></div>
                      </div>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Gallery Images</h4><div className="grid grid-cols-4 md:grid-cols-6 gap-4">{formData.galleryUrls?.map((url: string, idx: number) => (<div key={idx} className="aspect-square bg-slate-100 rounded-xl relative overflow-hidden group shadow-inner border border-slate-200"><img src={url} className="w-full h-full object-cover" alt="" /><button onClick={() => setFormData({...formData, galleryUrls: formData.galleryUrls?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"><Trash2 size={12} /></button></div>))}<div className="aspect-square"><FileUpload label="" currentUrl="" allowMultiple={true} onUpload={handleGalleryUpload} icon={<div className="flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 transition-colors"><Plus size={24} /><span className="text-[9px] font-black uppercase mt-1">Add Bulk</span></div>} /></div></div></div>
                   </div>
                )}
                {activeTab === 'terms' && (<div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in h-full"><h4 className="font-black text-slate-900 mb-4 border-b border-slate-100 pb-2 text-sm">Warranty & Legal</h4><textarea className="w-full h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono leading-relaxed resize-none shadow-inner" value={formData.terms} onChange={e => setFormData({...formData, terms: e.target.value})} placeholder="Enter terms and conditions..." /></div>)}
             </div>
          </div>
        </div>
    );
};

export const AdminDashboard = ({ onExit, storeData, onUpdateData, onRefresh }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [session, setSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'ads' | 'fleet' | 'settings'>('brands');
  
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

  if (!session) return <Auth setSession={setSession} />;
  if (!storeData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading Data...</div>;

  // CRUD Helpers
  const updateBrand = (updated: Brand) => {
      const newBrands = storeData.brands.map(b => b.id === updated.id ? updated : b);
      onUpdateData({ ...storeData, brands: newBrands });
      if (selectedBrand?.id === updated.id) setSelectedBrand(updated);
  };

  const deleteBrand = (id: string) => {
      if(!confirm("Delete this brand and all its products?")) return;
      const newBrands = storeData.brands.filter(b => b.id !== id);
      onUpdateData({ ...storeData, brands: newBrands });
      setSelectedBrand(null);
  };

  const addBrand = () => {
      const name = prompt("Enter Brand Name:");
      if (!name) return;
      const newBrand: Brand = { id: generateId('b'), name, categories: [], logoUrl: '' };
      onUpdateData({ ...storeData, brands: [...storeData.brands, newBrand] });
  };
  
  // ... more CRUD for categories/products ...

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                   <Settings size={20} className="text-blue-500"/> Admin Hub
                </h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">Store Configuration</p>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button onClick={() => { setActiveTab('brands'); setSelectedBrand(null); }} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'brands' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <Box size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Inventory</span>
                </button>
                <button onClick={() => setActiveTab('ads')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'ads' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <MegaphoneIcon size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Ad Manager</span>
                </button>
                <button onClick={() => setActiveTab('fleet')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <Monitor size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Fleet</span>
                </button>
                 <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                    <Layout size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Settings</span>
                </button>
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
                 <button onClick={() => setShowDataMgr(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs font-bold uppercase"><Database size={14} /> Data</button>
                 <button onClick={() => setShowGuide(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs font-bold uppercase"><HelpCircle size={14} /> Guide</button>
                 <button onClick={onExit} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 p-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs font-bold uppercase mt-4"><LogOut size={14} /> Exit Kiosk</button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm font-bold text-slate-500">
                       <span className="uppercase">{activeTab}</span>
                       {selectedBrand && <><ChevronRight size={14} className="mx-2"/> <span className="text-slate-900 uppercase">{selectedBrand.name}</span></>}
                       {selectedCategory && <><ChevronRight size={14} className="mx-2"/> <span className="text-slate-900 uppercase">{selectedCategory.name}</span></>}
                    </div>
                </div>
                <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Reload Data"><RefreshCw size={18} /></button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
               {activeTab === 'brands' && (
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
                                           <button onClick={(e) => { e.stopPropagation(); deleteBrand(brand.id); }} className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50"><Trash2 size={14} /></button>
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
                               <div className="flex gap-2">
                                   <FileUpload label="Brand Logo" currentUrl={selectedBrand.logoUrl} onUpload={(url) => updateBrand({...selectedBrand, logoUrl: url as string})} />
                               </div>
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
                                               <button onClick={() => {
                                                   if(confirm("Delete product?")) {
                                                       const newProds = selectedCategory.products.filter(p => p.id !== product.id);
                                                       const newCat = { ...selectedCategory, products: newProds };
                                                       const newCats = selectedBrand.categories.map(c => c.id === newCat.id ? newCat : c);
                                                       updateBrand({ ...selectedBrand, categories: newCats });
                                                       setSelectedCategory(newCat);
                                                   }
                                               }} className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50"><Trash2 size={16} /></button>
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

               {activeTab === 'settings' && (
                   <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                       <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                           <h3 className="text-lg font-black text-slate-900 uppercase mb-6 pb-4 border-b border-slate-100 flex items-center gap-2"><Layout size={20} className="text-blue-500" /> Hero Section</h3>
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
                       </div>

                       <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-black text-slate-900 uppercase mb-6 pb-4 border-b border-slate-100 flex items-center gap-2"><Monitor size={20} className="text-purple-500" /> Screensaver</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Idle Timeout (Seconds)</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" value={storeData.screensaverSettings?.idleTimeout || 60} onChange={e => onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings, idleTimeout: parseInt(e.target.value)}})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Image Duration (Seconds)</label>
                                    <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" value={storeData.screensaverSettings?.imageDuration || 8} onChange={e => onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings, imageDuration: parseInt(e.target.value)}})} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                     {['showProductImages', 'showProductVideos', 'showPamphlets', 'showCustomAds', 'muteVideos'].map((key) => (
                                         <label key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                                             <span className="text-xs font-bold uppercase text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                             <div className={`w-10 h-5 rounded-full relative transition-colors ${(storeData.screensaverSettings as any)?.[key] ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                                 <input type="checkbox" className="hidden" checked={(storeData.screensaverSettings as any)?.[key]} onChange={e => onUpdateData({...storeData, screensaverSettings: {...storeData.screensaverSettings, [key]: e.target.checked}})} />
                                                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${(storeData.screensaverSettings as any)?.[key] ? 'left-6' : 'left-1'}`}></div>
                                             </div>
                                         </label>
                                     ))}
                                </div>
                            </div>
                       </div>
                   </div>
               )}

               {activeTab === 'ads' && (
                   <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
                       {['homeBottomLeft', 'homeBottomRight', 'homeSideVertical', 'screensaver'].map((zone) => (
                           <div key={zone} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                               <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                                   <h3 className="font-black text-slate-900 uppercase text-sm">{zone.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                   <span className="text-[10px] font-bold text-slate-400 uppercase">{(storeData.ads as any)?.[zone]?.length || 0} Slots</span>
                               </div>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                   {(storeData.ads as any)?.[zone]?.map((ad: AdItem, idx: number) => (
                                       <div key={ad.id} className="aspect-video bg-slate-100 rounded-lg relative overflow-hidden group border border-slate-200">
                                           {ad.type === 'video' ? <video src={ad.url} className="w-full h-full object-cover" muted /> : <img src={ad.url} className="w-full h-full object-cover" alt="" />}
                                           <button onClick={() => {
                                               const newAds = { ...storeData.ads };
                                               (newAds as any)[zone] = (newAds as any)[zone].filter((_: any, i: number) => i !== idx);
                                               onUpdateData({ ...storeData, ads: newAds });
                                           }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                       </div>
                                   ))}
                                   <div className="aspect-video">
                                       <FileUpload label="" currentUrl="" allowMultiple={true} accept="image/*,video/*" icon={<div className="flex flex-col items-center text-slate-400"><Plus size={20}/><span className="text-[9px] font-bold uppercase mt-1">Add</span></div>} onUpload={(url, type) => {
                                           const newAd: AdItem = { id: generateId('ad'), type: type === 'video' ? 'video' : 'image', url: url as string };
                                           // Handle multiple? FileUpload can return array if allowMultiple=true. 
                                           // However, our FileUpload generic signature is complex.
                                           // Let's assume single for now or handle array if needed.
                                           const newAds = { ...storeData.ads };
                                           if(Array.isArray(url)) {
                                               const items = url.map(u => ({ id: generateId('ad'), type: type === 'video' ? 'video' : 'image', url: u } as AdItem));
                                               (newAds as any)[zone] = [...((newAds as any)[zone] || []), ...items];
                                           } else {
                                               (newAds as any)[zone] = [...((newAds as any)[zone] || []), newAd];
                                           }
                                           onUpdateData({ ...storeData, ads: newAds });
                                       }} />
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               )}
               
               {activeTab === 'fleet' && (
                   <div className="animate-fade-in">
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
                                               <td className="p-4 text-xs font-bold uppercase text-slate-500">{kiosk.deviceType || 'kiosk'}</td>
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
                                   {(!storeData.fleet || storeData.fleet.length === 0) && (
                                       <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm italic">No devices registered yet. Open the app on a tablet to register.</td></tr>
                                   )}
                               </tbody>
                           </table>
                       </div>
                   </div>
               )}
            </main>
        </div>

        {/* Editing Modal Overlays */}
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
                            setSelectedCategory(newCategory); // Update view
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