

import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, Megaphone as MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import Peer from 'peerjs';

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

// ... (FileUpload, BulkImporter, KioskEditorModal components remain the same) ...
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
               url = await uploadFileToStorage(file);
           }
           
           if (url) {
               console.log("Cloud Upload Success:", url);
               return url;
           }

           console.warn("Cloud Upload Failed.");
           
           // SAFETY CHECK: If file is too large for local storage fallback
           if (file.size > 2 * 1024 * 1024) { // 2MB Limit
               throw new Error(`File ${file.name} is too large for local fallback (Limit 2MB). Please check Supabase Storage configuration.`);
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
          alert(`Upload failed: ${err.message || 'Unknown error'}`);
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
        // We will build a temporary structure map: Brands -> Categories -> Products -> Assets
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
             const url = await uploadFileToStorage(file);
             if (url) return url;
             
             // If cloud fails, check size before fallback
             if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                 throw new Error(`File ${file.name} is too large (>2MB) and Cloud Storage failed. Import aborted to prevent crash.`);
             }

             // Fallback to base64 for small files
             return new Promise((resolve) => {
                 const reader = new FileReader();
                 reader.onload = (e) => resolve(e.target?.result as string || '');
                 reader.readAsDataURL(file);
             });
        };

        // 1. Group files by path
        const brandsMap: Record<string, Brand> = {};
        
        try {
            // Pre-scan to group
            const fileGroups: Record<string, File[]> = {};

            for (const file of files) {
                const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
                
                let brandName = '', categoryName = '', productName = '';
                
                // Logic Separation: Single Brand vs Global Import
                if (targetBrandName) {
                    // MODE: TARGET BRAND
                    // Expected Path: RootFolder / Category / Product / file.ext
                    // Example: "Samsung_Data" / "Smartphones" / "Galaxy S24" / "image.jpg"
                    if (pathParts.length < 4) continue;
                    
                    brandName = targetBrandName;
                    categoryName = pathParts[1];
                    productName = pathParts[2];
                } else {
                    // MODE: GLOBAL IMPORT
                    // Expected Path: RootFolder / Brand / Category / Product / file.ext
                    // Example: "My_Import" / "Samsung" / "Smartphones" / "Galaxy S24" / "image.jpg"
                    if (pathParts.length < 5) {
                        // Check for Brand Assets (Root/Brand/logo.png)
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

            // 2. Process Products
            for (const [key, productFiles] of Object.entries(fileGroups)) {
                const [brandName, categoryName, productName] = key.split('|');

                onStatus(`Processing Product: ${productName} (${brandName})...`);

                // Ensure hierarchy exists
                if (!brandsMap[brandName]) {
                    brandsMap[brandName] = { id: generateId('b'), name: brandName, categories: [], logoUrl: '' };
                }
                
                let category = brandsMap[brandName].categories.find(c => c.name === categoryName);
                if (!category) {
                    category = { id: generateId('c'), name: categoryName, icon: 'Box', products: [] };
                    brandsMap[brandName].categories.push(category);
                }

                // Initialize Product
                const newProduct: Product = {
                    id: generateId('p'),
                    name: productName,
                    sku: '',
                    description: '',
                    specs: {},
                    features: [],
                    dimensions: { width: '', height: '', depth: '', weight: '' },
                    imageUrl: '',
                    galleryUrls: [],
                    videoUrl: '',
                    manualUrl: '',
                    manualImages: []
                };

                // Find info.txt first
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
                             const specName = k.trim().substring(5); // Remove 'Spec-'
                             newProduct.specs[specName] = val;
                        }
                        else if (key === 'feature') {
                             newProduct.features.push(val);
                        }
                    });
                }

                // Process Media
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
                         // Try convert pages
                         const images = await convertPdfToImages(newProduct.manualUrl);
                         newProduct.manualImages = images;
                    }
                }

                category.products.push(newProduct);
            }

            // Convert map to array
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
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Device ID (Read Only)</label>
                        <input value={data.id} disabled className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Shop / Display Name</label>
                        <input value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Assigned Zone (Manual Entry)</label>
                        <input 
                            type="text" 
                            value={data.assignedZone || ''} 
                            onChange={e => setData({...data, assignedZone: e.target.value})} 
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                            placeholder="e.g. Entrance, Aisle 4, Window" 
                        />
                    </div>
                    <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Location Details</label>
                         <textarea value={data.locationDescription || ''} onChange={e => setData({...data, locationDescription: e.target.value})} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 h-20 resize-none" placeholder="e.g. Next to the Nike display..." />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-200 text-xs uppercase">Cancel</button>
                    <button onClick={() => onSave(data)} className="px-4 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 text-xs uppercase">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// ... (Rest of components remain same until AdminDashboard) ...
const CameraViewerModal = ({ kiosk, onClose, onRequestSnapshot }: { kiosk: KioskRegistry, onClose: () => void, onRequestSnapshot: (k: KioskRegistry) => void }) => {
    
    useEffect(() => {
        onRequestSnapshot(kiosk);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <div className="absolute top-4 right-4 z-10">
                     <button onClick={onClose} className="bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur"><X size={20} /></button>
                </div>
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                    {kiosk.snapshotUrl ? (
                        <img src={kiosk.snapshotUrl} className="w-full h-full object-contain" alt="Live Feed" />
                    ) : (
                        <div className="text-center text-slate-500">
                             <WifiOff size={48} className="mx-auto mb-2 opacity-50" />
                             <p className="font-mono text-xs uppercase">Waiting for Image...</p>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-white text-xs font-mono font-bold uppercase bg-black/50 px-2 py-1 rounded">LIVE VIEW: {kiosk.name}</span>
                    </div>
                    <button 
                        onClick={() => onRequestSnapshot(kiosk)}
                        className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase hover:bg-blue-500 shadow-lg"
                    >
                        <Camera size={14} className="inline mr-1" /> Refresh Snap
                    </button>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                    <div className="text-slate-400 text-xs font-mono">
                        Signal: {kiosk.wifiStrength}% | IP: {kiosk.ipAddress}
                    </div>
                    <div className="text-slate-500 text-[10px] uppercase font-bold">
                        Last Update: {new Date(kiosk.last_seen).toLocaleTimeString()}
                    </div>
                </div>
             </div>
        </div>
    );
};

const DataManagerModal = ({ storeData, onImport, onClose }: { storeData: StoreData, onImport: (d: StoreData) => void, onClose: () => void }) => {
    const [statusMsg, setStatusMsg] = useState("");

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `kiosk_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if(json && json.brands) {
                    if(confirm("This will OVERWRITE all current system data. Are you sure?")) {
                        onImport(json);
                        onClose();
                    }
                } else {
                    alert("Invalid System File");
                }
            } catch(err) {
                alert("Failed to parse JSON file");
            }
        };
        reader.readAsText(file);
    };

    const handleBulkImport = (partialData: Partial<StoreData>) => {
         // Merge logic: Add new brands or update existing ones
         if (partialData.brands) {
             const mergedBrands = [...storeData.brands];
             partialData.brands.forEach(newB => {
                 const idx = mergedBrands.findIndex(b => b.name === newB.name);
                 if (idx !== -1) {
                     // Merge categories
                     const existingBrand = mergedBrands[idx];
                     newB.categories.forEach(newC => {
                         const cIdx = existingBrand.categories.findIndex(c => c.name === newC.name);
                         if (cIdx !== -1) {
                             // Merge products
                             const existingCat = existingBrand.categories[cIdx];
                             newC.products.forEach(newP => {
                                 const pIdx = existingCat.products.findIndex(p => p.name === newP.name);
                                 if (pIdx !== -1) {
                                     existingCat.products[pIdx] = newP; // Overwrite product
                                 } else {
                                     existingCat.products.push(newP);
                                 }
                             });
                         } else {
                             existingBrand.categories.push(newC);
                         }
                     });
                     // Update logo if provided
                     if (newB.logoUrl) existingBrand.logoUrl = newB.logoUrl;
                 } else {
                     mergedBrands.push(newB);
                 }
             });
             onImport({ ...storeData, brands: mergedBrands });
             setTimeout(() => onClose(), 1500);
         }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Database size={20}/> System Data</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-900 text-sm uppercase mb-2">Export System</h4>
                        <p className="text-xs text-blue-700 mb-4">Download a full backup of products, fleets, and settings.</p>
                        <button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-xs uppercase">
                            <Download size={16} /> Download .JSON
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <h4 className="font-bold text-slate-900 text-sm uppercase mb-2">Import Backup</h4>
                            <p className="text-[10px] text-slate-500 mb-4">Restore from a .json backup file.</p>
                            <label className="w-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase cursor-pointer transition-colors">
                                <Upload size={14} /> JSON File
                                <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                        
                        <BulkImporter onImport={handleBulkImport} onStatus={setStatusMsg} />
                    </div>

                    {statusMsg && (
                        <div className="p-3 bg-slate-900 text-white text-[10px] font-mono rounded-lg">
                            <span className="text-green-400 font-bold">&gt;</span> {statusMsg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (BrandImportModal, HeroEditor, AdsManager, CatalogueManager, InputField, ProductEditor, ScreensaverEditor remain same) ...
const BrandImportModal = ({ brand, onImport, onClose }: { brand: Brand, onImport: (d: Partial<StoreData>) => void, onClose: () => void }) => {
    const [status, setStatus] = useState("");

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                 <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2"><FolderInput size={20}/> Bulk Import: {brand.name}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                 </div>
                 <div className="p-6">
                     <BulkImporter onImport={onImport} onStatus={setStatus} targetBrandName={brand.name} />
                     {status && (
                        <div className="mt-4 p-3 bg-slate-900 text-white text-[10px] font-mono rounded-lg max-h-32 overflow-y-auto">
                            <span className="text-green-400 font-bold">&gt;</span> {status}
                        </div>
                    )}
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

const ProductEditor = ({ product, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState<Product>(product || { id: generateId('p'), name: '', sku: '', description: '', terms: '', imageUrl: '', galleryUrls: [], videoUrl: '', manualUrl: '', manualImages: [], specs: {}, features: [], dimensions: { width: '', height: '', depth: '', weight: '' } });
    const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'media' | 'terms'>('general');
    const [specKey, setSpecKey] = useState('');
    const [specVal, setSpecVal] = useState('');
    const [featureInput, setFeatureInput] = useState('');
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  
    const addSpec = () => { if(!specKey || !specVal) return; setFormData(prev => ({ ...prev, specs: { ...prev.specs, [specKey]: specVal } })); setSpecKey(''); setSpecVal(''); };
    const removeSpec = (key: string) => { const newSpecs = { ...formData.specs }; delete newSpecs[key]; setFormData(prev => ({ ...prev, specs: newSpecs })); };
    const addFeature = () => { if(!featureInput) return; setFormData(prev => ({ ...prev, features: [...prev.features, featureInput] })); setFeatureInput(''); };
  
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
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                        <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><Monitor size={16} className="text-blue-500" /> Technical Specs</h4>
                        <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200"><input placeholder="Spec (e.g. CPU)" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specKey} onChange={e => setSpecKey(e.target.value)} /><input placeholder="Value" className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={specVal} onChange={e => setSpecVal(e.target.value)} /><button onClick={addSpec} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button></div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">{Object.entries(formData.specs).map(([k, v]) => (<div key={k} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100"><span className="font-bold text-slate-500 uppercase">{k}</span><div className="flex items-center gap-3"><span className="font-bold text-slate-900">{v}</span><button onClick={() => removeSpec(k)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div></div>))}</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                        <h4 className="font-black text-slate-900 mb-4 text-sm flex items-center gap-2"><BarChart3 size={16} className="text-blue-500" /> Key Features</h4>
                        <div className="flex gap-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-200"><input placeholder="Add a feature bullet..." className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-black" value={featureInput} onChange={e => setFeatureInput(e.target.value)} /><button onClick={addFeature} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md"><Plus size={14} /></button></div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">{formData.features.map((f: string, i: number) => (<div key={i} className="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-lg border border-slate-100"><span className="text-slate-900 font-bold truncate max-w-[200px]">{f}</span><button onClick={() => setFormData({...formData, features: formData.features.filter((_, idx) => idx !== i)})} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button></div>))}</div>
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

const HeroEditor = ({ data, onUpdate }: { data: HeroConfig, onUpdate: (h: HeroConfig) => void }) => {
    const [localData, setLocalData] = useState<HeroConfig>(data);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => { setLocalData(data); }, [data]);

    const handleChange = (key: keyof HeroConfig, value: string) => {
        setLocalData({ ...localData, [key]: value });
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdate(localData);
        setHasChanges(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in pb-24">
            <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <Layout size={32} className="text-blue-600" /> Hero & Branding
                </h2>
                <button 
                    onClick={handleSave} 
                    disabled={!hasChanges}
                    className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 transition-all ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    <Save size={16} /> {hasChanges ? 'Save Changes' : 'Saved'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-900 mb-4 text-sm uppercase tracking-wide">Main Banner Content</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Title</label>
                            <input value={localData.title} onChange={e => handleChange('title', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Subtitle</label>
                            <textarea value={localData.subtitle} onChange={e => handleChange('subtitle', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 h-24 resize-none focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Website URL</label>
                            <input value={localData.websiteUrl || ''} onChange={e => handleChange('websiteUrl', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500" placeholder="https://..." />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-900 mb-4 text-sm uppercase tracking-wide">Visual Assets</h3>
                    <FileUpload 
                        label="Background Image (Landscape)" 
                        currentUrl={localData.backgroundImageUrl} 
                        onUpload={(url) => handleChange('backgroundImageUrl', url as string)} 
                    />
                    <div className="mt-4 pt-4 border-t border-slate-100">
                         <FileUpload 
                            label="Company Logo (Transparent PNG)" 
                            currentUrl={localData.logoUrl} 
                            onUpload={(url) => handleChange('logoUrl', url as string)} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdsManager = ({ ads, onUpdate }: { ads: AdConfig, onUpdate: (a: AdConfig) => void }) => {
    const [localAds, setLocalAds] = useState<AdConfig>(ads);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => { setLocalAds(ads); }, [ads]);

    const handleSave = () => {
        onUpdate(localAds);
        setHasChanges(false);
    };

    const updateZone = (zone: keyof AdConfig, items: AdItem[]) => {
        setLocalAds({ ...localAds, [zone]: items });
        setHasChanges(true);
    };

    const addAds = (zone: keyof AdConfig, urls: string[], type: 'image' | 'video') => {
        const newItems: AdItem[] = urls.map(u => ({ id: generateId('ad'), type, url: u }));
        const currentItems = localAds[zone] || [];
        updateZone(zone, [...currentItems, ...newItems]);
    };

    const removeAd = (zone: keyof AdConfig, id: string) => {
        const currentItems = localAds[zone] || [];
        updateZone(zone, currentItems.filter(i => i.id !== id));
    };

    const ZoneEditor = ({ zoneName, zoneKey, items }: { zoneName: string, zoneKey: keyof AdConfig, items: AdItem[] }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">{zoneName}</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{items?.length || 0} Items</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {items?.map(item => (
                    <div key={item.id} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        {item.type === 'video' ? <video src={item.url} className="w-full h-full object-cover" /> : <img src={item.url} className="w-full h-full object-cover" />}
                        <button onClick={() => removeAd(zoneKey, item.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-bold px-1 rounded uppercase">{item.type}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <FileUpload 
                        label="Add Media (Multiple Supported)" 
                        onUpload={(data, type) => {
                            if (data && (type === 'image' || type === 'video')) {
                                const urls = Array.isArray(data) ? data : [data];
                                addAds(zoneKey, urls, type);
                            }
                        }}
                        allowMultiple={true}
                        icon={<Plus size={16} />}
                        helperText="Image or Video"
                        accept="image/*,video/*"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in pb-24">
             <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <MegaphoneIcon size={32} className="text-purple-600" /> Home Page Ads
                 </h2>
                 <button 
                    onClick={handleSave} 
                    disabled={!hasChanges}
                    className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 transition-all ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    <Save size={16} /> {hasChanges ? 'Save Ads' : 'Saved'}
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <ZoneEditor zoneName="Bottom Left (Square/Landscape)" zoneKey="homeBottomLeft" items={localAds.homeBottomLeft} />
                <ZoneEditor zoneName="Bottom Right (Square/Landscape)" zoneKey="homeBottomRight" items={localAds.homeBottomRight} />
                <ZoneEditor zoneName="Side Vertical (Tall)" zoneKey="homeSideVertical" items={localAds.homeSideVertical} />
            </div>
        </div>
    );
};

const CatalogueManager = ({ catalogues, onUpdate, mode = 'global', brandId }: { catalogues: Catalogue[], onUpdate: (c: Catalogue[]) => void, mode?: 'global' | 'brand', brandId?: string }) => {
    const [localCatalogues, setLocalCatalogues] = useState<Catalogue[]>(catalogues);
    const [hasChanges, setHasChanges] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { setLocalCatalogues(catalogues); }, [catalogues]);

    const handleSave = () => { onUpdate(localCatalogues); setHasChanges(false); };
    const updateCatalogue = (id: string, updates: Partial<Catalogue>) => { setLocalCatalogues(localCatalogues.map(c => c.id === id ? { ...c, ...updates } : c)); setHasChanges(true); };
    
    const handleUpload = async (file: File) => {
        setIsUploading(true);
        const pdfUrl = await uploadFileToStorage(file);
        const reader = new FileReader();
        reader.onload = async () => {
            const rawPdf = reader.result as string;
            const images = await convertPdfToImages(rawPdf);
            const newCat: Catalogue = { id: generateId('cat'), title: file.name.replace('.pdf', ''), pages: images, year: new Date().getFullYear(), startDate: new Date().toISOString().split('T')[0], pdfUrl: pdfUrl || undefined, brandId };
            setLocalCatalogues([...localCatalogues, newCat]);
            setHasChanges(true);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };
    
    const removeCatalogue = (id: string) => { setLocalCatalogues(localCatalogues.filter(c => c.id !== id)); setHasChanges(true); };

    return (
        <div className="max-w-4xl mx-auto p-4 animate-fade-in pb-24">
             <div className="flex justify-between items-center mb-8">
                 <h2 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen size={32} className="text-orange-600" /> {mode === 'brand' ? 'Brand Catalogues' : 'Pamphlets'}
                </h2>
                <div className="flex gap-2">
                    <label className={`flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold uppercase text-xs cursor-pointer hover:bg-slate-800 transition-colors shadow-lg ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {isUploading ? 'Processing...' : 'Upload PDF'}
                        <input type="file" className="hidden" accept="application/pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={isUploading} />
                    </label>
                    <button onClick={handleSave} disabled={!hasChanges} className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 transition-all ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Save size={16} /> Save</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {localCatalogues.map(cat => (
                    <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col">
                        <div className="aspect-[2/3] bg-slate-100 relative">
                             {cat.pages && cat.pages[0] ? <img src={cat.pages[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><FileText size={32} /></div>}
                             <button onClick={() => removeCatalogue(cat.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={12} /></button>
                        </div>
                        <div className="p-2 md:p-4 flex-1 flex flex-col">
                            <label className="block text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Title</label>
                            <input value={cat.title} onChange={(e) => updateCatalogue(cat.id, { title: e.target.value })} className="font-bold text-slate-900 text-xs md:text-sm w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none mb-2" />
                            {mode === 'global' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 mt-auto">
                                    <div><label className="block text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Start</label><input type="date" value={cat.startDate || ''} onChange={(e) => updateCatalogue(cat.id, { startDate: e.target.value })} className="text-[9px] md:text-[10px] bg-slate-50 border border-slate-200 rounded px-1 md:px-2 py-0.5 md:py-1 text-slate-500 font-mono w-full" /></div>
                                    <div><label className="block text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">End</label><input type="date" value={cat.endDate || ''} onChange={(e) => updateCatalogue(cat.id, { endDate: e.target.value })} className="text-[9px] md:text-[10px] bg-slate-50 border border-slate-200 rounded px-1 md:px-2 py-0.5 md:py-1 text-slate-500 font-mono w-full" /></div>
                                </div>
                            ) : (
                                <div className="mt-auto"><label className="block text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Year</label><input type="number" value={cat.year || ''} onChange={(e) => updateCatalogue(cat.id, { year: parseInt(e.target.value) })} className="text-[9px] md:text-[10px] bg-slate-50 border border-slate-200 rounded px-1 md:px-2 py-0.5 md:py-1 text-slate-500 font-mono w-full" placeholder="YYYY" /></div>
                            )}
                            <div className="mt-2 text-[8px] md:text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 border-t border-slate-100 pt-2"><Book size={10} /> {cat.pages.length} Pages</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ScreensaverEditor = ({ storeData, onUpdate }: { storeData: StoreData, onUpdate: (d: StoreData) => void }) => {
    // ... same as before
    const [localSettings, setLocalSettings] = useState<ScreensaverSettings>(storeData.screensaverSettings || { idleTimeout: 60, imageDuration: 8, muteVideos: false, showProductImages: true, showProductVideos: true, showPamphlets: true, showCustomAds: true });
    const [localAds, setLocalAds] = useState<AdItem[]>(storeData.ads?.screensaver || []);
    const [hasChanges, setHasChanges] = useState(false);
  
    useEffect(() => { setLocalSettings(storeData.screensaverSettings || localSettings); setLocalAds(storeData.ads?.screensaver || []); }, [storeData]);
  
    const handleSave = () => { onUpdate({ ...storeData, screensaverSettings: localSettings, ads: { ...storeData.ads!, screensaver: localAds } }); setHasChanges(false); };
    const updateSettings = (updates: Partial<ScreensaverSettings>) => { setLocalSettings({ ...localSettings, ...updates }); setHasChanges(true); };
    const addSlide = (url: string | string[], type: 'image' | 'video') => { const urls = Array.isArray(url) ? url : [url]; const newItems: AdItem[] = urls.map(u => ({ id: generateId('ss'), type, url: u })); setLocalAds([...localAds, ...newItems]); setHasChanges(true); };
    const removeSlide = (id: string) => { setLocalAds(localAds.filter(a => a.id !== id)); setHasChanges(true); };

    return (
        <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <div><h2 className="text-3xl font-black text-slate-900">Screensaver Control</h2><p className="text-slate-500">Manage idle screen playback loop and configuration.</p></div>
                <button onClick={handleSave} disabled={!hasChanges} className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg flex items-center gap-2 transition-all ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Save size={16} /> {hasChanges ? 'Save Changes' : 'Saved'}</button>
            </div>
            {/* Configuration Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Settings size={20} className="text-blue-600" /> Playback Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={14} /> Idle Wait Time (Seconds)</label><input type="number" value={localSettings.idleTimeout} onChange={(e) => updateSettings({ idleTimeout: parseInt(e.target.value) || 30 })} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500" /><p className="text-[10px] text-slate-400 mt-1">Time before screensaver starts.</p></div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={14} /> Image Duration (Seconds)</label><input type="number" value={localSettings.imageDuration} onChange={(e) => updateSettings({ imageDuration: parseInt(e.target.value) || 5 })} className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500" /><p className="text-[10px] text-slate-400 mt-1">How long each image stays on screen.</p></div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Content Sources</label><div className="space-y-3"><button onClick={() => updateSettings({ showProductImages: !localSettings.showProductImages })} className="flex items-center justify-between w-full"><span className="text-sm font-bold text-slate-700">Product Images</span>{localSettings.showProductImages ? <ToggleRight size={24} className="text-blue-600" /> : <ToggleLeft size={24} className="text-slate-300" />}</button><button onClick={() => updateSettings({ showProductVideos: !localSettings.showProductVideos })} className="flex items-center justify-between w-full"><span className="text-sm font-bold text-slate-700">Product Videos</span>{localSettings.showProductVideos ? <ToggleRight size={24} className="text-blue-600" /> : <ToggleLeft size={24} className="text-slate-300" />}</button><button onClick={() => updateSettings({ showPamphlets: !localSettings.showPamphlets })} className="flex items-center justify-between w-full"><span className="text-sm font-bold text-slate-700">Pamphlet Covers</span>{localSettings.showPamphlets ? <ToggleRight size={24} className="text-blue-600" /> : <ToggleLeft size={24} className="text-slate-300" />}</button><button onClick={() => updateSettings({ showCustomAds: !localSettings.showCustomAds })} className="flex items-center justify-between w-full"><span className="text-sm font-bold text-slate-700">Custom Ads (Below)</span>{localSettings.showCustomAds ? <ToggleRight size={24} className="text-blue-600" /> : <ToggleLeft size={24} className="text-slate-300" />}</button></div></div>
                    </div>
                    <div className="space-y-4"><div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-full"><label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Audio Control</label><div className="flex flex-col gap-4"><button onClick={() => updateSettings({ muteVideos: !localSettings.muteVideos })} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${localSettings.muteVideos ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{localSettings.muteVideos ? <VolumeX size={20} /> : <Volume2 size={20} />}<div className="text-left"><div className="font-bold text-sm">{localSettings.muteVideos ? 'Videos Muted' : 'Sound Enabled'}</div><div className="text-[10px] opacity-70">{localSettings.muteVideos ? 'Silent Playback' : 'Play audio from videos'}</div></div></button></div></div></div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4 mt-8"><h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Megaphone size={20} className="text-purple-600" /> Custom Ads & Slides</h3><span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">{localAds.length} Items</span></div>

            {/* Custom Slide Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {localAds.map((ad, idx) => (
                    <div key={ad.id} className="relative group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden aspect-video">
                        {ad.type === 'video' ? (<div className="w-full h-full bg-black flex items-center justify-center"><video src={ad.url} className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 flex items-center justify-center"><PlayCircle className="text-white/50" size={32} /></div></div>) : (<img src={ad.url} className="w-full h-full object-cover" />)}
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase">{idx + 1}. {ad.type}</div>
                        <button onClick={() => removeSlide(ad.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"><Trash2 size={14} /></button>
                    </div>
                ))}
                <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 transition-colors p-4">
                     <div className="text-xs font-bold text-slate-400 uppercase">Add Slide</div>
                     <div className="flex gap-2"><div className="flex-1"><FileUpload label="" currentUrl="" onUpload={(data, type) => { if (data) { const items = Array.isArray(data) ? data : [data]; const safeType = type === 'video' ? 'video' : 'image'; items.forEach(u => addSlide(u, safeType)); } }} allowMultiple={true} icon={<Plus size={16} />} helperText="Image/Video" accept="image/*,video/*" /></div></div>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard = ({ onExit, storeData, onUpdateData, onRefresh }: { onExit: () => void, storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh?: () => void }) => {
  const [session, setSession] = useState(false);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [showBrandImport, setShowBrandImport] = useState(false);
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [viewingCameraKiosk, setViewingCameraKiosk] = useState<KioskRegistry | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'inventory' | 'marketing' | 'screensaver'>('dashboard');
  const [marketingView, setMarketingView] = useState<'hero' | 'ads' | 'catalogues'>('hero');

  if (!session) return <Auth setSession={setSession} />;

  const activeBrand = storeData?.brands.find(b => b.id === activeBrandId);
  const activeCategory = activeBrand?.categories.find(c => c.id === activeCategoryId);

  const handleSaveProduct = (product: Product) => {
      if (!storeData || !activeBrand || !activeCategory) return;
      const updatedBrands = storeData.brands.map(b => { if (b.id !== activeBrand.id) return b; return { ...b, categories: b.categories.map(c => { if (c.id !== activeCategory.id) return c; const exists = c.products.find(p => p.id === product.id); let newProducts; if (exists) { newProducts = c.products.map(p => p.id === product.id ? product : p); } else { newProducts = [...c.products, product]; } return { ...c, products: newProducts }; }) }; });
      const newStoreData = { ...storeData, brands: updatedBrands };
      onUpdateData(newStoreData);
      setEditingProduct(null);
      setIsCreatingProduct(false);
  };

  const handleUpdateKiosk = (updatedKiosk: KioskRegistry) => { if(!storeData?.fleet) return; const newFleet = storeData.fleet.map(k => k.id === updatedKiosk.id ? updatedKiosk : k); onUpdateData({ ...storeData, fleet: newFleet }); setEditingKiosk(null); };
  const handleRequestSnapshot = (kiosk: KioskRegistry) => { if (!storeData?.fleet) return; const newFleet = storeData.fleet.map(k => k.id === kiosk.id ? { ...k, requestSnapshot: true } : k); onUpdateData({ ...storeData, fleet: newFleet }); };
  const handleRequestReboot = (kiosk: KioskRegistry) => { if (!storeData?.fleet) return; if (confirm(`Are you sure you want to REBOOT kiosk ${kiosk.name}?`)) { const newFleet = storeData.fleet.map(k => k.id === kiosk.id ? { ...k, restartRequested: true } : k); onUpdateData({ ...storeData, fleet: newFleet }); } };

  const handleBrandImportMerge = (partialData: Partial<StoreData>) => {
      if (!activeBrand || !partialData.brands || partialData.brands.length === 0) return;
      
      const importedBrand = partialData.brands[0]; 
      
      const updatedBrands = storeData?.brands.map(existingBrand => {
          if (existingBrand.id !== activeBrand.id) return existingBrand;
          const mergedCategories = [...existingBrand.categories];
          importedBrand.categories.forEach(importedCat => {
              const catIndex = mergedCategories.findIndex(c => c.name === importedCat.name);
              if (catIndex === -1) {
                  mergedCategories.push(importedCat);
              } else {
                  const existingCat = mergedCategories[catIndex];
                  const mergedProducts = [...existingCat.products];
                  importedCat.products.forEach(importedProd => {
                      const prodIndex = mergedProducts.findIndex(p => p.name === importedProd.name);
                      if (prodIndex === -1) {
                          mergedProducts.push(importedProd);
                      } else {
                          mergedProducts[prodIndex] = importedProd;
                      }
                  });
                  mergedCategories[catIndex] = { ...existingCat, products: mergedProducts };
              }
          });
          return { ...existingBrand, categories: mergedCategories };
      });

      if (updatedBrands) {
          onUpdateData({ ...storeData!, brands: updatedBrands });
          setShowBrandImport(false);
      }
  };

  if (editingProduct || isCreatingProduct) return <ProductEditor product={editingProduct} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsCreatingProduct(false); }} />;
  if (showSetup) return <SetupGuide onClose={() => setShowSetup(false)} />;

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
       <div className="bg-slate-900 text-white shrink-0 shadow-xl z-30">
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-800">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">A</div>
                <span className="font-bold text-lg tracking-tight hidden md:inline">Admin Hub</span>
                <span className="font-bold text-lg tracking-tight md:hidden">Hub</span>
                 <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                    {supabase ? <Cloud size={12} className="text-blue-400" /> : <HardDrive size={12} className="text-orange-400" />}
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                        {supabase ? 'Supabase' : 'Local'}
                    </span>
                </div>
             </div>
             <div className="flex items-center gap-3"><button onClick={() => setShowDataManager(true)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 border border-blue-500/30"><Database size={18} /><span className="hidden md:inline text-xs font-bold uppercase">System Data</span></button><button onClick={() => onRefresh ? onRefresh() : onUpdateData({...storeData!})} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2 border border-green-500/30 shadow-lg shadow-green-900/20 animate-pulse"><RefreshCw size={18} /><span className="hidden md:inline text-xs font-bold uppercase">Sync Changes</span></button><button onClick={() => setShowSetup(true)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="Setup Guide"><HelpCircle size={18} /></button><button onClick={onExit} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"><LogOut size={18} /><span className="hidden md:inline text-xs font-bold uppercase">Exit</span></button></div>
          </div>
          <div className="flex overflow-x-auto">
             <button onClick={() => { setActiveView('dashboard'); setActiveBrandId(null); setActiveCategoryId(null); }} className={`flex-1 min-w-[100px] p-4 text-xs font-black uppercase tracking-widest text-center transition-colors border-b-4 ${activeView === 'dashboard' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Dashboard</button>
             <button onClick={() => { setActiveView('inventory'); if(!activeBrandId && storeData?.brands.length > 0) setActiveBrandId(storeData.brands[0].id); }} className={`flex-1 min-w-[100px] p-4 text-xs font-black uppercase tracking-widest text-center transition-colors border-b-4 ${activeView === 'inventory' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Inventory</button>
             <button onClick={() => { setActiveView('marketing'); }} className={`flex-1 min-w-[100px] p-4 text-xs font-black uppercase tracking-widest text-center transition-colors border-b-4 ${activeView === 'marketing' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Marketing</button>
             <button onClick={() => { setActiveView('screensaver'); setActiveBrandId(null); }} className={`flex-1 min-w-[100px] p-4 text-xs font-black uppercase tracking-widest text-center transition-colors border-b-4 ${activeView === 'screensaver' ? 'border-blue-500 bg-slate-800 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Screensaver</button>
          </div>
       </div>

       {activeView === 'inventory' && (
          <div className="bg-white border-b border-slate-200 p-2 overflow-x-auto flex items-center gap-2 shrink-0 z-20 shadow-sm">
             <div className="px-2 text-[10px] font-black uppercase text-slate-400 shrink-0">Brands:</div>
             {storeData?.brands
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(brand => (<button key={brand.id} onClick={() => { setActiveBrandId(brand.id); setActiveCategoryId(null); }} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeBrandId === brand.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Box size={14} /> {brand.name}</button>))}
             <button onClick={() => { const newBrand: Brand = { id: generateId('b'), name: 'New Brand', categories: [] }; onUpdateData({ ...storeData!, brands: [...(storeData?.brands || []), newBrand] }); }} className="px-3 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors whitespace-nowrap" title="Add Brand"><Plus size={16} /></button>
          </div>
       )}

       {activeView === 'marketing' && (
           <div className="bg-white border-b border-slate-200 p-2 overflow-x-auto flex items-center gap-2 shrink-0 z-20 shadow-sm justify-center md:justify-start">
              <button onClick={() => setMarketingView('hero')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${marketingView === 'hero' ? 'bg-blue-100 text-blue-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}><Layout size={16} /> Hero & Branding</button>
              <button onClick={() => setMarketingView('ads')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${marketingView === 'ads' ? 'bg-purple-100 text-purple-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}><MegaphoneIcon size={16} /> Home Ads</button>
              <button onClick={() => setMarketingView('catalogues')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${marketingView === 'catalogues' ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-500 hover:bg-slate-50'}`}><BookOpen size={16} /> Pamphlets</button>
           </div>
       )}

       <div className="flex-1 overflow-y-auto bg-slate-100 relative p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
             {activeView === 'screensaver' ? (<ScreensaverEditor storeData={storeData!} onUpdate={onUpdateData} />) : activeView === 'marketing' ? (<>
                    {marketingView === 'hero' && <HeroEditor data={storeData!.hero} onUpdate={(hero) => onUpdateData({...storeData!, hero})} />}
                    {marketingView === 'ads' && <AdsManager ads={storeData!.ads || { homeBottomLeft: [], homeBottomRight: [], homeSideVertical: [], screensaver: [] }} onUpdate={(ads) => onUpdateData({...storeData!, ads})} />}
                    {marketingView === 'catalogues' && <CatalogueManager catalogues={storeData!.catalogues?.filter(c => !c.brandId) || []} onUpdate={(updatedCats) => { const brandCats = storeData!.catalogues?.filter(c => c.brandId) || []; onUpdateData({...storeData!, catalogues: [...brandCats, ...updatedCats]}); }} mode="global" />}
                 </>) : activeView === 'dashboard' ? (
                <div className="animate-fade-in">
                   <h2 className="text-3xl font-black text-slate-900 mb-8">System Overview</h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><div className="text-slate-400 font-bold text-xs uppercase mb-2">Total Brands</div><div className="text-4xl font-black text-slate-900">{storeData?.brands.length}</div></div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><div className="text-slate-400 font-bold text-xs uppercase mb-2">Active Kiosks</div><div className="text-4xl font-black text-slate-900">{storeData?.fleet?.length || 0}</div></div>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><div className="text-slate-400 font-bold text-xs uppercase mb-2">Last Sync</div><div className="text-xl font-bold text-slate-900">Just now</div></div>
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-4">Fleet Status</h3>
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                       <table className="w-full text-left min-w-[500px]">
                          <thead className="bg-slate-50 border-b border-slate-100"><tr><th className="p-4 text-xs font-black uppercase text-slate-500">ID / Location</th><th className="p-4 text-xs font-black uppercase text-slate-500">Device</th><th className="p-4 text-xs font-black uppercase text-slate-500">Status</th><th className="p-4 text-xs font-black uppercase text-slate-500">Telemetry</th><th className="p-4 text-xs font-black uppercase text-slate-500 text-right">Actions</th></tr></thead>
                          <tbody>
                             {storeData?.fleet?.map(k => (<tr key={k.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                                   <td className="p-4"><div className="font-bold text-slate-900">{k.name}</div><div className="font-mono text-xs text-slate-400">{k.id}</div>{k.assignedZone && <div className="inline-block mt-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{k.assignedZone}</div>}</td>
                                   <td className="p-4">
                                       {k.deviceType === 'mobile' ? (
                                           <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs"><Smartphone size={14} /> Mobile</div>
                                       ) : (
                                           <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs"><Tablet size={14} /> Kiosk</div>
                                       )}
                                   </td>
                                   <td className="p-4"><div className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${k.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span><span className="text-xs font-bold uppercase">{k.status}</span></div><div className="text-[10px] text-slate-400 mt-1">Last: {new Date(k.last_seen).toLocaleTimeString()}</div></td>
                                   <td className="p-4"><div className="flex items-center gap-2 text-xs font-mono text-slate-600"><Wifi size={12} /> {k.wifiStrength}%</div><div className="text-[10px] text-slate-400 mt-0.5">IP: {k.ipAddress || '---'}</div></td>
                                   <td className="p-4 text-right"><div className="flex justify-end gap-2">
                                       <button onClick={() => handleRequestReboot(k)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200" title="Reboot Device"><Power size={16} /></button>
                                       <button 
                                            onClick={() => setViewingCameraKiosk(k)} 
                                            className={`p-2 rounded-lg transition-colors ${k.deviceType === 'mobile' ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`} 
                                            title={k.deviceType === 'mobile' ? 'Camera disabled on mobile' : 'Live Camera View'}
                                            disabled={k.deviceType === 'mobile'}
                                       >
                                           <Camera size={16} />
                                       </button>
                                       <button onClick={() => setEditingKiosk(k)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Edit Details"><Edit2 size={16} /></button></div></td>
                                </tr>
                             ))}
                             {(!storeData?.fleet || storeData.fleet.length === 0) && (<tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold italic">No devices registered.</td></tr>)}
                          </tbody>
                       </table>
                   </div>
                </div>
             ) : !activeBrand ? (
                // ... (Rest of Admin Dashboard logic remains unchanged)
                <div className="animate-fade-in text-center py-20"><Box size={48} className="mx-auto text-slate-300 mb-4" /><h2 className="text-2xl font-black text-slate-400 mb-2">Select a Brand</h2><p className="text-slate-500 text-sm">Use the top bar to select or create a brand to manage.</p></div>
             ) : !activeCategory ? (
                <div className="animate-fade-in">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                       <div className="flex items-center gap-4">{activeBrand.logoUrl && <img src={activeBrand.logoUrl} className="w-16 h-16 object-contain bg-white rounded-lg border border-slate-200 p-2" />}<h2 className="text-3xl font-black text-slate-900">{activeBrand.name}</h2></div>
                       <div className="flex gap-2 w-full md:w-auto">
                           <button onClick={() => setShowBrandImport(true)} className="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 flex items-center justify-center gap-2 text-xs font-bold uppercase text-slate-600 transition-colors"><FolderInput size={16} /> Bulk Import</button>
                           <button onClick={() => { const newName = prompt("Rename Brand", activeBrand.name); if(newName) { const updated = storeData!.brands.map(b => b.id === activeBrand.id ? {...b, name: newName} : b); onUpdateData({...storeData!, brands: updated}); } }} className="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold uppercase text-slate-600"><Edit2 size={16} /> Rename</button>
                           <button onClick={() => { if(confirm("Delete this brand?")) { const updated = storeData!.brands.filter(b => b.id !== activeBrand.id); onUpdateData({...storeData!, brands: updated}); setActiveBrandId(null); } }} className="flex-1 md:flex-none p-2 bg-white border border-slate-200 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center gap-2 text-xs font-bold uppercase"><Trash2 size={16} /> Delete</button>
                       </div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8"><h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-4 flex items-center gap-2"><ImageIcon size={14} className="text-blue-500" /> Brand Identity</h4><FileUpload label="Brand Logo (Transparent PNG)" currentUrl={activeBrand.logoUrl} onUpload={(url) => { const updated = storeData!.brands.map(b => b.id === activeBrand.id ? {...b, logoUrl: url as string} : b); onUpdateData({...storeData!, brands: updated}); }} /></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                       {activeBrand.categories
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(cat => (<button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"><div className="flex items-center justify-between mb-4"><span className="bg-blue-50 text-blue-600 p-3 rounded-lg"><Box size={24} /></span><span className="text-2xl font-black text-slate-200 group-hover:text-blue-100 transition-colors">{cat.products.length}</span></div><h3 className="text-xl font-bold text-slate-900 mb-1">{cat.name}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-wider">View Products</p></button>))}
                       <button onClick={() => { const name = prompt("Category Name (e.g. Smartphones)"); if(name) { const newCat: Category = { id: generateId('c'), name, icon: 'Box', products: [] }; const updated = storeData!.brands.map(b => b.id === activeBrand.id ? {...b, categories: [...b.categories, newCat]} : b); onUpdateData({...storeData!, brands: updated}); } }} className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center hover:bg-white hover:border-blue-400 transition-all group cursor-pointer"><Plus size={32} className="text-slate-300 group-hover:text-blue-500 mb-2" /><span className="font-bold text-slate-400 group-hover:text-blue-600">Add Category</span></button>
                   </div>
                   <CatalogueManager catalogues={storeData!.catalogues?.filter(c => c.brandId === activeBrand.id) || []} onUpdate={(updatedBrandCats) => { const otherCats = storeData!.catalogues?.filter(c => c.brandId !== activeBrand.id) || []; onUpdateData({...storeData!, catalogues: [...otherCats, ...updatedBrandCats]}); }} mode="brand" brandId={activeBrand.id} />
                </div>
             ) : (
                <div className="animate-fade-in">
                   <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8"><button onClick={() => setActiveCategoryId(null)} className="p-2 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1 text-slate-500 font-bold text-xs uppercase"><ArrowLeft size={16} /> Back</button><h2 className="text-3xl font-black text-slate-900">{activeCategory.name}</h2><button onClick={() => setIsCreatingProduct(true)} className="md:ml-auto w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"><Plus size={18} /> New Product</button></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {activeCategory.products
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(product => (<div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group"><div className="aspect-square bg-slate-50 relative">{product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-contain p-4" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Box size={32} /></div>}</div><div className="p-4"><h4 className="font-bold text-slate-900 truncate mb-1">{product.name}</h4><p className="text-xs text-slate-500 font-mono mb-4">{product.sku}</p><div className="flex gap-2"><button onClick={() => setEditingProduct(product)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold uppercase hover:bg-blue-50 hover:text-blue-600 transition-colors">Edit</button><button onClick={() => { if(confirm("Delete product?")) { const updatedProds = activeCategory.products.filter(p => p.id !== product.id); const updatedBrands = storeData!.brands.map(b => { if(b.id !== activeBrand!.id) return b; return { ...b, categories: b.categories.map(c => c.id === activeCategory.id ? {...c, products: updatedProds} : c) }; }); onUpdateData({...storeData!, brands: updatedBrands}); } }} className="p-2 bg-slate-100 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div></div></div>))}
                       {activeCategory.products.length === 0 && (<div className="col-span-full py-12 text-center text-slate-400 italic">No products yet. Click "New Product" to add one.</div>)}
                   </div>
                </div>
             )}
          </div>
       </div>

       {editingKiosk && (<KioskEditorModal kiosk={editingKiosk} onClose={() => setEditingKiosk(null)} onSave={handleUpdateKiosk} />)}
       {viewingCameraKiosk && (<CameraViewerModal kiosk={viewingCameraKiosk} onClose={() => setViewingCameraKiosk(null)} onRequestSnapshot={handleRequestSnapshot} />)}
       {showDataManager && (<DataManagerModal storeData={storeData!} onImport={onUpdateData} onClose={() => setShowDataManager(false)} />)}
       {showBrandImport && activeBrand && (<BrandImportModal brand={activeBrand} onImport={handleBrandImportMerge} onClose={() => setShowBrandImport(false)} />)}
    </div>
  );
};