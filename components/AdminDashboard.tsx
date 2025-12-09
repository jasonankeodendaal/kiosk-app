import React, { useState, useEffect, useMemo } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, ChevronLeft, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, FolderArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, Book, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck, Ruler, SaveAll, Pencil, Moon, Sun, MonitorSmartphone, LayoutGrid, Music, Share2, Rewind, Tv, UserCog, Key, Move, FileInput, Lock, Unlock, Calendar, Filter
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData, DimensionSet, Manual, TVBrand, TVConfig, TVModel, AdminUser, AdminPermissions, Pricelist, PricelistBrand } from '../types';
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

// --- ZIP IMPORT/EXPORT UTILS ---

// Helper: Determine extension from MIME type or URL
const getExtension = (blob: Blob, url: string): string => {
    if (blob.type === 'image/jpeg') return 'jpg';
    if (blob.type === 'image/png') return 'png';
    if (blob.type === 'image/webp') return 'webp';
    if (blob.type === 'application/pdf') return 'pdf';
    if (blob.type === 'video/mp4') return 'mp4';
    if (blob.type === 'video/webm') return 'webm';
    
    // Fallback to URL extension
    const match = url.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    return match ? match[1] : 'dat';
};

const fetchAssetAndAddToZip = async (zipFolder: JSZip | null, url: string, filenameBase: string) => {
    if (!zipFolder || !url) return;
    try {
        let blob: Blob;
        
        // Handle Base64 Data URLs
        if (url.startsWith('data:')) {
            const res = await fetch(url);
            blob = await res.blob();
        } else {
            // Handle Remote URLs
            const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            blob = await response.blob();
        }

        const ext = getExtension(blob, url);
        zipFolder.file(`${filenameBase}.${ext}`, blob);
    } catch (e) {
        console.warn(`Failed to pack asset: ${url}`, e);
        // Create a placeholder error file so user knows it failed
        zipFolder.file(`${filenameBase}_FAILED.txt`, `Could not download: ${url}`);
    }
};

const downloadZip = async (storeData: StoreData) => {
    const zip = new JSZip();
    console.log("Starting Backup Process...");

    // 1. Structure: Brand -> Category -> Product
    for (const brand of storeData.brands) {
        const brandFolder = zip.folder(brand.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Brand');
        
        if (brandFolder) {
            // Save Brand Metadata
            brandFolder.file("brand.json", JSON.stringify(brand, null, 2));
            
            // 2. Fetch & Pack Brand Logo
            if (brand.logoUrl) {
                await fetchAssetAndAddToZip(brandFolder, brand.logoUrl, "brand_logo");
            }
        }
        
        for (const category of brand.categories) {
            const catFolder = brandFolder?.folder(category.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Category');
            
            for (const product of category.products) {
                const prodFolder = catFolder?.folder(product.name.replace(/[^a-z0-9 ]/gi, '').trim() || 'Untitled Product');
                
                if (prodFolder) {
                    // 3. Create Metadata JSON
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

                    // 4. Fetch & Pack Main Image
                    if (product.imageUrl) {
                        await fetchAssetAndAddToZip(prodFolder, product.imageUrl, "cover");
                    }

                    // 5. Fetch & Pack Gallery Images
                    if (product.galleryUrls) {
                        for (let i = 0; i < product.galleryUrls.length; i++) {
                            await fetchAssetAndAddToZip(prodFolder, product.galleryUrls[i], `gallery_${i}`);
                        }
                    }

                    // 6. Fetch & Pack Videos
                    const videos = [...(product.videoUrls || [])];
                    if (product.videoUrl && !videos.includes(product.videoUrl)) videos.push(product.videoUrl);
                    
                    for (let i = 0; i < videos.length; i++) {
                        await fetchAssetAndAddToZip(prodFolder, videos[i], `video_${i}`);
                    }

                    // 7. Fetch & Pack Manuals
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

    // Generate
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
    
    // Helper to get Base64 from ZipObj
    const getBase64 = async (zipObj: any): Promise<string> => {
        const blob = await zipObj.async("blob");
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    // Iterate files
    const filePaths = Object.keys(loadedZip.files);
    
    for (const path of filePaths) {
        const fileObj = loadedZip.files[path];
        if (fileObj.dir) continue;
        if (path.includes('__MACOSX') || path.includes('.DS_Store')) continue;

        // Path: Brand/Category/Product/File.ext OR Brand/BrandFile.ext
        const parts = path.split('/');
        
        if (parts.length < 2) continue;

        const brandName = parts[0];

        // Init Brand
        if (!newBrands[brandName]) {
            newBrands[brandName] = {
                id: generateId('brand'),
                name: brandName,
                categories: []
            };
        }

        // Handle Brand Assets (Level 2: Brand/brand_logo.png)
        if (parts.length === 2) {
             const fileName = parts[1].toLowerCase();
             // Parse brand logo
             if (fileName.includes('brand_logo') || fileName.includes('logo')) {
                  const b64 = await getBase64(fileObj);
                  newBrands[brandName].logoUrl = b64;
             }
             continue;
        }

        // Require Product Depth for rest (Brand/Category/Product/File)
        if (parts.length < 4) continue;

        const categoryName = parts[1];
        const productName = parts[2];
        const fileName = parts.slice(3).join('/'); // In case of subfolders inside product (e.g. gallery)

        // Init Category
        let category = newBrands[brandName].categories.find(c => c.name === categoryName);
        if (!category) {
            category = {
                id: generateId('cat'),
                name: categoryName,
                icon: 'Box',
                products: []
            };
            newBrands[brandName].categories.push(category);
        }

        // Init Product
        let product = category.products.find(p => p.name === productName);
        if (!product) {
            product = {
                id: generateId('prod'),
                name: productName, 
                description: '',
                specs: {},
                features: [],
                dimensions: [],
                imageUrl: '',
                galleryUrls: [],
                videoUrls: [],
                manuals: [],
                dateAdded: new Date().toISOString()
            };
            category.products.push(product);
        }

        const lowerFile = fileName.toLowerCase();
        
        // Handle Details JSON
        if (fileName.endsWith('.json') && fileName.includes('details')) {
             try {
                 const text = await fileObj.async("text");
                 const meta = JSON.parse(text);
                 if (meta.name) product.name = meta.name;
                 if (meta.description) product.description = meta.description;
                 if (meta.sku) product.sku = meta.sku;
                 if (meta.specs) product.specs = meta.specs;
                 if (meta.features) product.features = meta.features;
                 if (meta.dimensions) product.dimensions = meta.dimensions;
                 if (meta.boxContents) product.boxContents = meta.boxContents;
                 if (meta.terms) product.terms = meta.terms;
             } catch(e) { console.warn("Failed to parse JSON for " + productName); }
        }
        // Handle Images
        else if (lowerFile.endsWith('.jpg') || lowerFile.endsWith('.jpeg') || lowerFile.endsWith('.png') || lowerFile.endsWith('.webp')) {
             const b64 = await getBase64(fileObj);
             if (lowerFile.includes('cover') || lowerFile.includes('main') || !product.imageUrl) {
                 product.imageUrl = b64;
             } else {
                 product.galleryUrls = [...(product.galleryUrls || []), b64];
             }
        }
        // Handle Videos
        else if (lowerFile.endsWith('.mp4') || lowerFile.endsWith('.webm') || lowerFile.endsWith('.mov')) {
            const b64 = await getBase64(fileObj);
            product.videoUrls = [...(product.videoUrls || []), b64];
        }
        // Handle Manuals
        else if (lowerFile.endsWith('.pdf')) {
             const b64 = await getBase64(fileObj);
             product.manuals?.push({
                 id: generateId('man'),
                 title: fileName.replace('.pdf', '').replace(/_/g, ' '),
                 images: [],
                 pdfUrl: b64,
                 thumbnailUrl: '' 
             });
        }
    }

    return Object.values(newBrands);
};


// Updated Auth Component with Name/PIN and Admin validation
const Auth = ({ admins, onLogin }: { admins: AdminUser[], onLogin: (user: AdminUser) => void }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !pin.trim()) {
        setError('Please enter both Name and PIN.');
        return;
    }

    const admin = admins.find(a => 
        a.name.toLowerCase().trim() === name.toLowerCase().trim() && 
        a.pin === pin.trim()
    );

    if (admin) {
        onLogin(admin);
    } else {
        setError('Invalid credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-800 p-4 animate-fade-in">
      <div className="bg-slate-100 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden border border-slate-300">
        <h1 className="text-4xl font-black mb-2 text-center text-slate-900 mt-4 tracking-tight">Admin Hub</h1>
        <p className="text-center text-slate-500 text-sm mb-6 font-bold uppercase tracking-wide">Enter Name & PIN</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">Admin Name</label>
              <input 
                 className="w-full p-4 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 outline-none focus:border-blue-500" 
                 type="text" 
                 placeholder="Name" 
                 value={name} 
                 onChange={(e) => setName(e.target.value)} 
                 autoFocus 
              />
          </div>
          <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">PIN Code</label>
              <input 
                 className="w-full p-4 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 outline-none focus:border-blue-500" 
                 type="password" 
                 placeholder="####" 
                 value={pin} 
                 onChange={(e) => setPin(e.target.value)} 
              />
          </div>
          
          {error && <div className="text-red-500 text-xs font-bold text-center bg-red-100 p-2 rounded-lg">{error}</div>}

          <button type="submit" className="w-full p-4 font-black rounded-xl bg-slate-900 text-white uppercase hover:bg-slate-800 transition-colors shadow-lg">Login</button>
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
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        {isProcessing && <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }}></div>}
        <div className="w-10 h-10 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden shrink-0 text-slate-400">
           {isProcessing ? (
               <Loader2 className="animate-spin text-blue-500" /> 
           ) : currentUrl && !allowMultiple ? (
               accept.includes('video') ? <Video className="text-blue-500" size={16} /> : 
               accept.includes('pdf') ? <FileText className="text-red-500" size={16} /> : 
               accept.includes('audio') ? (
                  <div className="flex flex-col items-center justify-center bg-green-50 w-full h-full text-green-600">
                      <Music size={16} />
                  </div>
               ) : 
               <img src={currentUrl} className="w-full h-full object-contain" />
           ) : React.cloneElement(icon, { size: 16 })}
        </div>
        <label className={`flex-1 text-center cursor-pointer bg-slate-900 text-white px-2 py-2 rounded-lg font-bold text-[9px] uppercase whitespace-nowrap overflow-hidden text-ellipsis ${isProcessing ? 'opacity-50' : ''}`}>
              <Upload size={10} className="inline mr-1" /> {isProcessing ? '...' : 'Select'}
              <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isProcessing} multiple={allowMultiple}/>
        </label>
      </div>
    </div>
  );
};

const InputField = ({ label, val, onChange, placeholder, isArea = false, half = false, type = 'text' }: any) => (
    <div className={`mb-4 ${half ? 'w-full' : ''}`}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 ml-1">{label}</label>
      {isArea ? <textarea value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" placeholder={placeholder} /> : <input type={type} value={val} onChange={onChange} className="w-full p-3 bg-white text-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" placeholder={placeholder} />}
    </div>
);

const CatalogueManager = ({ catalogues, onSave, brandId }: { catalogues: Catalogue[], onSave: (c: Catalogue[]) => void, brandId?: string }) => {
    const [localList, setLocalList] = useState(catalogues || []);
    useEffect(() => setLocalList(catalogues || []), [catalogues]);

    const handleUpdate = (newList: Catalogue[]) => {
        setLocalList(newList);
        onSave(newList); 
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold uppercase text-slate-500 text-xs tracking-wider">{brandId ? 'Brand Catalogues' : 'Global Pamphlets'}</h3>
                 <button onClick={addCatalogue} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2"><Plus size={14} /> Add New</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localList.map((cat) => (
                    <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                        <div className="h-40 bg-slate-100 relative group flex items-center justify-center overflow-hidden">
                            {cat.thumbnailUrl || (cat.pages && cat.pages[0]) ? (
                                <img src={cat.thumbnailUrl || cat.pages[0]} className="w-full h-full object-contain" /> 
                            ) : (
                                <BookOpen size={32} className="text-slate-300" />
                            )}
                            {cat.pdfUrl && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded shadow-sm">PDF</div>
                            )}
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col">
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
                            
                            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                                <FileUpload 
                                    label="Thumbnail (Image)" 
                                    accept="image/*" 
                                    currentUrl={cat.thumbnailUrl || (cat.pages?.[0])}
                                    onUpload={(url: any) => updateCatalogue(cat.id, { thumbnailUrl: url })} 
                                />
                                <FileUpload 
                                    label="Document (PDF)" 
                                    accept="application/pdf" 
                                    currentUrl={cat.pdfUrl}
                                    icon={<FileText />}
                                    onUpload={(url: any) => updateCatalogue(cat.id, { pdfUrl: url })} 
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                <button onClick={() => handleUpdate(localList.filter(c => c.id !== cat.id))} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold uppercase"><Trash2 size={12} /> Delete Catalogue</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MoveProductModal = ({ 
  product, 
  allBrands, 
  currentBrandId,
  currentCategoryId,
  onMove, 
  onClose 
}: { 
  product: Product, 
  allBrands: Brand[], 
  currentBrandId: string,
  currentCategoryId: string,
  onMove: (product: Product, targetBrandId: string, targetCategoryId: string) => void, 
  onClose: () => void 
}) => {
  const [targetBrandId, setTargetBrandId] = useState(currentBrandId);
  const [targetCategoryId, setTargetCategoryId] = useState(currentCategoryId);

  const selectedTargetBrand = allBrands.find(b => b.id === targetBrandId);
  const targetCategories = selectedTargetBrand ? selectedTargetBrand.categories : [];

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
       <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
           <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h3 className="font-black text-slate-900 uppercase text-sm">Move Product</h3>
               <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
           </div>
           <div className="p-6 space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Select Brand</label>
                  <select 
                     value={targetBrandId} 
                     onChange={(e) => {
                         setTargetBrandId(e.target.value);
                         const newBrand = allBrands.find(b => b.id === e.target.value);
                         if (newBrand && newBrand.categories.length > 0) {
                             setTargetCategoryId(newBrand.categories[0].id);
                         } else {
                             setTargetCategoryId('');
                         }
                     }}
                     className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                  >
                     {allBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
               
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Select Category</label>
                  <select 
                     value={targetCategoryId} 
                     onChange={(e) => setTargetCategoryId(e.target.value)}
                     className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                     disabled={targetCategories.length === 0}
                  >
                     {targetCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {targetCategories.length === 0 && <p className="text-xs text-red-500 mt-1">No categories in this brand.</p>}
               </div>
           </div>
           <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
               <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold uppercase text-xs">Cancel</button>
               <button 
                  onClick={() => {
                      if (targetBrandId && targetCategoryId) {
                          onMove(product, targetBrandId, targetCategoryId);
                      }
                  }}
                  disabled={!targetBrandId || !targetCategoryId} 
                  className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg disabled:opacity-50"
               >
                  Confirm Move
               </button>
           </div>
       </div>
    </div>
  );
};

const PricelistManager = ({ 
    pricelists, 
    pricelistBrands, 
    onSavePricelists,
    onSaveBrands,
    onDeletePricelist
}: { 
    pricelists: Pricelist[], 
    pricelistBrands: PricelistBrand[], 
    onSavePricelists: (p: Pricelist[]) => void,
    onSaveBrands: (b: PricelistBrand[]) => void,
    onDeletePricelist: (id: string) => void
}) => {
    // Sort Brands Alphabetically for Display
    const sortedBrands = useMemo(() => {
        return [...pricelistBrands].sort((a, b) => a.name.localeCompare(b.name));
    }, [pricelistBrands]);

    const [selectedBrand, setSelectedBrand] = useState<PricelistBrand | null>(sortedBrands.length > 0 ? sortedBrands[0] : null);
    
    useEffect(() => {
        if (selectedBrand && !sortedBrands.find(b => b.id === selectedBrand.id)) {
            setSelectedBrand(sortedBrands.length > 0 ? sortedBrands[0] : null);
        }
    }, [sortedBrands]);

    const filteredLists = selectedBrand ? pricelists.filter(p => p.brandId === selectedBrand.id) : [];

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const sortedLists = [...filteredLists].sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        // Date Descending (Closest date first)
        if (yearA !== yearB) return yearB - yearA;
        return months.indexOf(b.month) - months.indexOf(a.month);
    });

    const addBrand = () => {
        const name = prompt("Enter Brand Name for Pricelists:");
        if (!name) return;
        const newBrand: PricelistBrand = {
            id: generateId('plb'),
            name: name,
            logoUrl: ''
        };
        onSaveBrands([...pricelistBrands, newBrand]);
        setSelectedBrand(newBrand);
    };

    const updateBrand = (id: string, updates: Partial<PricelistBrand>) => {
        const updatedBrands = pricelistBrands.map(b => b.id === id ? { ...b, ...updates } : b);
        onSaveBrands(updatedBrands);
        if (selectedBrand?.id === id) {
            setSelectedBrand({ ...selectedBrand, ...updates });
        }
    };

    const deleteBrand = (id: string) => {
        if (confirm("Delete this brand? This will also hide associated pricelists.")) {
            onSaveBrands(pricelistBrands.filter(b => b.id !== id));
        }
    };

    const addPricelist = () => {
        if (!selectedBrand) return;
        const newItem: Pricelist = {
            id: generateId('pl'),
            brandId: selectedBrand.id,
            title: 'New Pricelist',
            url: '',
            month: 'January',
            year: new Date().getFullYear().toString()
        };
        onSavePricelists([...pricelists, newItem]);
    };

    const updatePricelist = (id: string, updates: Partial<Pricelist>) => {
        onSavePricelists(pricelists.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleDeletePricelist = (id: string) => {
        if(confirm("Delete this pricelist? It will be moved to Archive.")) {
            onDeletePricelist(id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-fade-in flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
             <div className="w-full md:w-1/3 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                     <div>
                        <h2 className="font-black text-slate-900 uppercase text-sm">Pricelist Brands</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Independent List</p>
                     </div>
                     <button onClick={addBrand} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1">
                        <Plus size={12} /> Add
                     </button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-2">
                     {sortedBrands.map(brand => (
                         <div 
                            key={brand.id} 
                            onClick={() => setSelectedBrand(brand)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${selectedBrand?.id === brand.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-slate-100 hover:border-blue-200'}`}
                         >
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                     {brand.logoUrl ? (
                                         <img src={brand.logoUrl} className="w-full h-full object-contain" />
                                     ) : (
                                         <span className="font-black text-slate-300 text-lg">{brand.name.charAt(0)}</span>
                                     )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <div className="font-bold text-slate-900 text-xs uppercase truncate">{brand.name}</div>
                                     <div className="text-[10px] text-slate-400 font-mono truncate">{pricelists.filter(p => p.brandId === brand.id).length} Pricelists</div>
                                 </div>
                             </div>
                             {selectedBrand?.id === brand.id && (
                                 <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2" onClick={e => e.stopPropagation()}>
                                     <input 
                                         value={brand.name} 
                                         onChange={(e) => updateBrand(brand.id, { name: e.target.value })}
                                         className="w-full text-xs font-bold p-1 border-b border-slate-200 focus:border-blue-500 outline-none bg-transparent"
                                         placeholder="Brand Name"
                                     />
                                     <FileUpload 
                                         label="Brand Logo" 
                                         currentUrl={brand.logoUrl} 
                                         onUpload={(url: any) => updateBrand(brand.id, { logoUrl: url })} 
                                     />
                                     <button 
                                         onClick={(e) => { e.stopPropagation(); deleteBrand(brand.id); }}
                                         className="w-full text-center text-[10px] text-red-500 font-bold uppercase hover:bg-red-50 py-1 rounded"
                                     >
                                         Delete Brand
                                     </button>
                                 </div>
                             )}
                         </div>
                     ))}
                     {sortedBrands.length === 0 && (
                         <div className="p-8 text-center text-slate-400 text-xs italic">
                             No brands. Click "Add" to start.
                         </div>
                     )}
                 </div>
             </div>
             <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col shadow-inner">
                 <div className="flex justify-between items-center mb-6 shrink-0">
                     <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
                         {selectedBrand ? `Pricelists for ${selectedBrand.name}` : 'Select a Brand'}
                     </h3>
                     <button 
                        onClick={addPricelist} 
                        disabled={!selectedBrand}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={14} /> Add Pricelist
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                     {sortedLists.map((item) => (
                         <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-4 gap-3 h-fit">
                             <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Title</label>
                                 <input 
                                     value={item.title} 
                                     onChange={(e) => updatePricelist(item.id, { title: e.target.value })}
                                     className="w-full font-bold text-slate-900 border-b border-slate-100 focus:border-blue-500 outline-none pb-1 text-sm" 
                                     placeholder="e.g. Retail Price List"
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-2">
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Month</label>
                                     <select 
                                         value={item.month} 
                                         onChange={(e) => updatePricelist(item.id, { month: e.target.value })}
                                         className="w-full text-xs font-bold p-1 bg-slate-50 rounded border border-slate-200"
                                     >
                                         {months.map(m => <option key={m} value={m}>{m}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Year</label>
                                     <input 
                                         type="number"
                                         value={item.year} 
                                         onChange={(e) => updatePricelist(item.id, { year: e.target.value })}
                                         className="w-full text-xs font-bold p-1 bg-slate-50 rounded border border-slate-200"
                                     />
                                 </div>
                             </div>
                             <div className="mt-2 grid grid-cols-2 gap-2">
                                <FileUpload 
                                    label="Thumbnail" 
                                    accept="image/*"
                                    currentUrl={item.thumbnailUrl}
                                    onUpload={(url: any) => updatePricelist(item.id, { thumbnailUrl: url })} 
                                />
                                <FileUpload 
                                    label="Upload PDF" 
                                    accept="application/pdf" 
                                    icon={<FileText />}
                                    currentUrl={item.url}
                                    onUpload={(url: any) => updatePricelist(item.id, { url: url })} 
                                />
                             </div>
                             <button 
                                onClick={() => handleDeletePricelist(item.id)}
                                className="mt-auto pt-3 border-t border-slate-100 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase flex items-center justify-center gap-1"
                             >
                                 <Trash2 size={12} /> Delete
                             </button>
                         </div>
                     ))}
                     {sortedLists.length === 0 && selectedBrand && (
                         <div className="col-span-full py-12 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-xl">
                             No pricelists found for this brand.
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
};

const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
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
        }] : []),
        dateAdded: product.dateAdded || new Date().toISOString()
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

    const addManual = () => {
        const newManual: Manual = {
            id: generateId('man'),
            title: "New Manual",
            images: [],
            pdfUrl: '',
            thumbnailUrl: ''
        };
        setDraft({ ...draft, manuals: [...(draft.manuals || []), newManual] });
    };

    const removeManual = (id: string) => {
        setDraft({ ...draft, manuals: (draft.manuals || []).filter(m => m.id !== id) });
    };

    const updateManual = (id: string, updates: Partial<Manual>) => {
        setDraft({ 
            ...draft, 
            manuals: (draft.manuals || []).map(m => m.id === id ? { ...m, ...updates } : m) 
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
                                <button onClick={addManual} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold uppercase flex items-center gap-1"><Plus size={10}/> Add Manual</button>
                             </div>
                             
                             <div className="space-y-4">
                                {(draft.manuals || []).map((manual, idx) => (
                                    <div key={manual.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 relative group">
                                        <button onClick={() => removeManual(manual.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                                        
                                        <input 
                                            value={manual.title} 
                                            onChange={(e) => updateManual(manual.id, { title: e.target.value })} 
                                            placeholder="Manual Title (e.g. User Guide)" 
                                            className="w-full font-bold text-slate-900 border-b border-slate-100 pb-1 focus:border-blue-500 outline-none pr-8 text-sm" 
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FileUpload 
                                                label="Thumbnail (Image)" 
                                                accept="image/*"
                                                currentUrl={manual.thumbnailUrl} 
                                                onUpload={(url: any) => updateManual(manual.id, { thumbnailUrl: url })} 
                                            />
                                            <FileUpload 
                                                label="Document (PDF)" 
                                                accept="application/pdf"
                                                icon={<FileText />}
                                                currentUrl={manual.pdfUrl} 
                                                onUpload={(url: any) => updateManual(manual.id, { pdfUrl: url })} 
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(draft.manuals || []).length === 0 && (
                                    <div className="text-center text-slate-400 text-xs italic py-4 border-2 border-dashed border-slate-200 rounded-xl">
                                        No manuals added. Click "Add Manual" above.
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Technical Specs</h5>
                             <div className="flex flex-wrap gap-2 mb-4 items-end">
                                <input value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="Spec Name" className="flex-1 min-w-[80px] p-2 border border-slate-300 rounded-lg text-sm font-bold" />
                                <input value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="Value" className="flex-1 min-w-[80px] p-2 border border-slate-300 rounded-lg text-sm font-bold" onKeyDown={(e) => e.key === 'Enter' && addSpec()} />
                                <button onClick={addSpec} className="bg-blue-600 text-white p-2.5 rounded-lg shrink-0"><Plus size={18} /></button>
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

const TVModelEditor = ({ model, onSave, onClose }: { model: TVModel, onSave: (m: TVModel) => void, onClose: () => void }) => {
    const [draft, setDraft] = useState<TVModel>({ ...model });

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="font-black text-slate-900 uppercase">Edit TV Model: {draft.name}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Model Name" val={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. OLED G3" />
                        <FileUpload 
                            label="Cover Image (Optional)" 
                            currentUrl={draft.imageUrl} 
                            onUpload={(url: any) => setDraft({ ...draft, imageUrl: url })} 
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-900 uppercase text-xs">Videos for this Model</h4>
                            <span className="text-[10px] font-bold bg-white text-slate-500 px-2 py-1 rounded border border-slate-200 uppercase">{draft.videoUrls.length} Videos</span>
                        </div>
                        
                        <FileUpload 
                            label="Upload Videos" 
                            accept="video/*" 
                            allowMultiple={true}
                            icon={<Video />}
                            currentUrl="" 
                            onUpload={(urls: any) => {
                                const newUrls = Array.isArray(urls) ? urls : [urls];
                                setDraft(prev => ({ ...prev, videoUrls: [...prev.videoUrls, ...newUrls] }));
                            }} 
                        />
                        
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {draft.videoUrls.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 group">
                                    <div className="w-16 h-10 bg-slate-900 rounded flex items-center justify-center shrink-0">
                                        <Video size={16} className="text-white opacity-50" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase">Video {idx + 1}</div>
                                        <div className="text-xs font-mono truncate text-slate-700">{url.split('/').pop()}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {idx > 0 && <button onClick={() => {
                                            const newUrls = [...draft.videoUrls];
                                            [newUrls[idx], newUrls[idx-1]] = [newUrls[idx-1], newUrls[idx]];
                                            setDraft({ ...draft, videoUrls: newUrls });
                                        }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronDown size={14} className="rotate-180"/></button>}
                                        
                                        {idx < draft.videoUrls.length - 1 && <button onClick={() => {
                                            const newUrls = [...draft.videoUrls];
                                            [newUrls[idx], newUrls[idx+1]] = [newUrls[idx+1], newUrls[idx]];
                                            setDraft({ ...draft, videoUrls: newUrls });
                                        }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><ChevronDown size={14} /></button>}
                                        
                                        <button onClick={() => {
                                            setDraft({ ...draft, videoUrls: draft.videoUrls.filter((_, i) => i !== idx) });
                                        }} className="p-1.5 bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 rounded ml-2"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                            {draft.videoUrls.length === 0 && (
                                <div className="text-center py-6 text-slate-400 text-xs italic">No videos uploaded for this model yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold uppercase text-xs">Cancel</button>
                    <button onClick={() => onSave(draft)} className="px-4 py-2 bg-blue-600 text-white font-bold uppercase text-xs rounded-lg">Save Model</button>
                </div>
            </div>
        </div>
    );
};

const AdminManager = ({ admins, onUpdate, currentUser }: { admins: AdminUser[], onUpdate: (admins: AdminUser[]) => void, currentUser: AdminUser }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newPermissions, setNewPermissions] = useState<AdminPermissions>({
        inventory: true,
        marketing: true,
        tv: false,
        screensaver: false,
        fleet: false,
        history: false,
        settings: false,
        pricelists: true
    });

    const PERMISSION_GROUPS = [
        {
            title: "Inventory & Products",
            icon: <Box size={14} />,
            color: "blue",
            items: [
                { key: 'inventory', label: 'Inventory Management', desc: 'Create brands, categories, products and upload media.' }
            ]
        },
        {
            title: "Marketing & Content",
            icon: <Megaphone size={14} />,
            color: "purple",
            items: [
                { key: 'marketing', label: 'Marketing Hub', desc: 'Edit Hero banner, Ad zones, and Pamphlets.' },
                { key: 'pricelists', label: 'Pricelists', desc: 'Manage PDF pricelists and brand documents.' },
                { key: 'screensaver', label: 'Screensaver Control', desc: 'Configure screensaver timing and display rules.' }
            ]
        },
        {
            title: "System & Devices",
            icon: <Settings size={14} />,
            color: "slate",
            items: [
                { key: 'fleet', label: 'Fleet Management', desc: 'Monitor active devices and remote restart.' },
                { key: 'tv', label: 'TV Mode Config', desc: 'Manage TV video loops and brand channels.' },
                { key: 'settings', label: 'Global Settings', desc: 'System backups, app icons, and admin users.' },
                { key: 'history', label: 'Archive History', desc: 'View logs and restore deleted items.' }
            ]
        }
    ];

    const resetForm = () => {
        setEditingId(null);
        setNewName('');
        setNewPin('');
        setNewPermissions({
            inventory: true,
            marketing: true,
            tv: false,
            screensaver: false,
            fleet: false,
            history: false,
            settings: false,
            pricelists: true
        });
    };

    const handleAddOrUpdate = () => {
        if (!newName || !newPin) return alert("Name and PIN required");
        
        let updatedList = [...admins];

        if (editingId) {
            updatedList = updatedList.map(a => a.id === editingId ? { ...a, name: newName, pin: newPin, permissions: newPermissions } : a);
        } else {
            updatedList.push({
                id: generateId('adm'),
                name: newName,
                pin: newPin,
                isSuperAdmin: false,
                permissions: newPermissions
            });
        }
        
        onUpdate(updatedList);
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (confirm("Remove this admin?")) {
             onUpdate(admins.filter(a => a.id !== id));
        }
    };

    const startEdit = (admin: AdminUser) => {
        setEditingId(admin.id);
        setNewName(admin.name);
        setNewPin(admin.pin);
        setNewPermissions(admin.permissions);
    };

    const toggleAll = (enable: boolean) => {
        const p = { ...newPermissions };
        (Object.keys(p) as Array<keyof AdminPermissions>).forEach(k => p[k] = enable);
        setNewPermissions(p);
    };

    const isEditingSuperAdmin = editingId && admins.find(a => a.id === editingId)?.isSuperAdmin;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="xl:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                         <h4 className="font-bold text-slate-900 uppercase text-xs flex items-center gap-2">
                             <UserCog size={16} className="text-blue-600"/> {editingId ? 'Edit Admin Profile' : 'Create New Admin'}
                         </h4>
                         {isEditingSuperAdmin && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-black uppercase">Super Admin (Full Access)</span>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <InputField label="Admin Name" val={newName} onChange={(e:any) => setNewName(e.target.value)} placeholder="e.g. John Doe" />
                        <InputField label="4-Digit PIN" val={newPin} onChange={(e:any) => setNewPin(e.target.value)} placeholder="####" type="text" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Access Permissions</label>
                            {!isEditingSuperAdmin && (
                                <div className="flex gap-2">
                                    <button onClick={() => toggleAll(true)} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Select All</button>
                                    <button onClick={() => toggleAll(false)} className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-2 py-1 rounded">Clear All</button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {PERMISSION_GROUPS.map(group => (
                                <div key={group.title} className={`bg-white rounded-xl border border-${group.color}-100 overflow-hidden shadow-sm`}>
                                    <div className={`bg-${group.color}-50 p-3 border-b border-${group.color}-100 flex items-center gap-2`}>
                                        <span className={`text-${group.color}-600`}>{group.icon}</span>
                                        <span className={`text-[10px] font-black uppercase text-${group.color}-800`}>{group.title}</span>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {group.items.map(item => (
                                            <label key={item.key} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isEditingSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                                                <div className="pt-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(newPermissions as any)[item.key]} 
                                                        onChange={(e) => setNewPermissions({...newPermissions, [item.key]: e.target.checked})}
                                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                        disabled={isEditingSuperAdmin}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-800">{item.label}</div>
                                                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
                            {editingId && <button onClick={resetForm} className="px-6 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-50">Cancel Edit</button>}
                            <button onClick={handleAddOrUpdate} className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2">
                                <Check size={16} /> {editingId ? 'Update Admin Permissions' : 'Create Admin User'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* List Column */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 uppercase text-xs mb-2">Active Admins ({admins.length})</h4>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {admins.map(admin => (
                            <div key={admin.id} className={`p-4 rounded-xl border transition-all ${editingId === admin.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${admin.isSuperAdmin ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <UserCog size={16} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{admin.name}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                                <Lock size={10} /> {admin.pin}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => startEdit(admin)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Permissions"><Edit2 size={14} /></button>
                                        {admin.id !== 'super-admin' && currentUser.name === 'Admin' && currentUser.pin === '1723' && (
                                            <button onClick={() => handleDelete(admin.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Admin"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {admin.isSuperAdmin ? (
                                        <span className="text-[9px] font-bold uppercase bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100">Full Access</span>
                                    ) : (
                                        Object.entries(admin.permissions).filter(([_, v]) => v).map(([k]) => (
                                            <span key={k} className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{k}</span>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard = ({ storeData, onUpdateData, onRefresh }: { storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [activeSubTab, setActiveSubTab] = useState<string>('brands'); 
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movingProduct, setMovingProduct] = useState<Product | null>(null);
  const [editingKiosk, setEditingKiosk] = useState<KioskRegistry | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedTVBrand, setSelectedTVBrand] = useState<TVBrand | null>(null);
  const [editingTVModel, setEditingTVModel] = useState<TVModel | null>(null);
  
  // History State
  const [historyTab, setHistoryTab] = useState<'brands' | 'catalogues' | 'deletedItems'>('deletedItems');
  const [historySearch, setHistorySearch] = useState('');
  
  const [localData, setLocalData] = useState<StoreData | null>(storeData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [importProcessing, setImportProcessing] = useState(false);
  const [exportProcessing, setExportProcessing] = useState(false);

  const availableTabs = [
      { id: 'inventory', label: 'Inventory', icon: Box },
      { id: 'marketing', label: 'Marketing', icon: Megaphone },
      { id: 'pricelists', label: 'Pricelists', icon: RIcon },
      { id: 'tv', label: 'TV', icon: Tv },
      { id: 'screensaver', label: 'Screensaver', icon: Monitor },
      { id: 'fleet', label: 'Fleet', icon: Tablet },
      { id: 'history', label: 'History', icon: History },
      { id: 'settings', label: 'Settings', icon: Settings },
  ].filter(tab => currentUser?.permissions[tab.id as keyof AdminPermissions]);

  useEffect(() => {
      if (currentUser && availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
          setActiveTab(availableTabs[0].id);
      }
  }, [currentUser]);

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

  // ARCHIVE HANDLERS
  const addToArchive = (type: 'product' | 'pricelist' | 'tv_model' | 'other', name: string, data: any) => {
      if (!localData) return;
      const now = new Date().toISOString();
      const newItem = {
          id: generateId('arch'),
          type,
          name,
          data,
          deletedAt: now
      };
      
      const currentArchive = localData.archive || { brands: [], products: [], catalogues: [], deletedItems: [], deletedAt: {} };
      const newArchive = {
          ...currentArchive,
          deletedItems: [newItem, ...(currentArchive.deletedItems || [])]
      };
      
      return newArchive;
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

  const handleMoveProduct = (product: Product, targetBrandId: string, targetCategoryId: string) => {
      if (!localData || !selectedBrand || !selectedCategory) return;
      
      const updatedSourceCat = {
          ...selectedCategory,
          products: selectedCategory.products.filter(p => p.id !== product.id)
      };
      
      let newBrands = localData.brands.map(b => {
          if (b.id === selectedBrand.id) {
              return {
                  ...b,
                  categories: b.categories.map(c => c.id === selectedCategory.id ? updatedSourceCat : c)
              };
          }
          return b;
      });

      newBrands = newBrands.map(b => {
          if (b.id === targetBrandId) {
              return {
                  ...b,
                  categories: b.categories.map(c => {
                      if (c.id === targetCategoryId) {
                          return { ...c, products: [...c.products, product] };
                      }
                      return c;
                  })
              };
          }
          return b;
      });

      handleLocalUpdate({ ...localData, brands: newBrands });
      setMovingProduct(null);
  };

  const formatRelativeTime = (isoString: string) => {
      if (!isoString) return 'Unknown';
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays/7)} weeks ago`;
      return date.toLocaleDateString();
  };

  if (!localData) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /> Loading...</div>;
  if (!currentUser) return <Auth admins={localData.admins || []} onLogin={setCurrentUser} />;

  const brands = Array.isArray(localData.brands) 
      ? [...localData.brands].sort((a, b) => a.name.localeCompare(b.name)) 
      : [];

  const tvBrands = Array.isArray(localData.tv?.brands)
      ? [...localData.tv!.brands].sort((a, b) => a.name.localeCompare(b.name))
      : [];

  // Filter Logic for History
  const archivedBrands = (localData.archive?.brands || []).filter(b => 
      b.name.toLowerCase().includes(historySearch.toLowerCase()) || 
      b.id.toLowerCase().includes(historySearch.toLowerCase())
  );
  
  const archivedCatalogues = (localData.archive?.catalogues || []).filter(c => 
      c.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const archivedGenericItems = (localData.archive?.deletedItems || []).filter(i =>
      i.name.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
        <header className="bg-slate-900 text-white shrink-0 shadow-xl z-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Settings className="text-blue-500" size={24} />
                     <div><h1 className="text-lg font-black uppercase tracking-widest leading-none">Admin Hub</h1></div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <div className="text-xs font-bold text-slate-400 uppercase hidden md:block">
                         Hello, {currentUser.name}
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
                 </div>

                 <div className="flex items-center gap-3">
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${isCloudConnected ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'}`}>
                         {isCloudConnected ? <Cloud size={14} /> : <HardDrive size={14} />}
                         <span className="text-[10px] font-bold uppercase">{isCloudConnected ? 'Cloud Online' : 'Local Mode'}</span>
                     </div>
                     <button onClick={onRefresh} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"><RefreshCw size={16} /></button>
                     <button onClick={() => setCurrentUser(null)} className="p-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-white rounded-lg flex items-center gap-2">
                        <LogOut size={16} />
                        <span className="text-[10px] font-bold uppercase hidden md:inline">Logout</span>
                     </button>
                 </div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar">
                {availableTabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-4 text-center text-xs font-black uppercase tracking-wider border-b-4 transition-all ${activeTab === tab.id ? 'border-blue-500 text-white bg-slate-800' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab.label}</button>
                ))}
            </div>
        </header>

        {activeTab === 'marketing' && (
            <div className="bg-white border-b border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm z-10 shrink-0">
                <button onClick={() => setActiveSubTab('hero')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'hero' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Hero Banner</button>
                <button onClick={() => setActiveSubTab('ads')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'ads' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Ad Zones</button>
                <button onClick={() => setActiveSubTab('catalogues')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${activeSubTab === 'catalogues' ? 'text-purple-600 bg-purple-50' : 'text-slate-500'}`}>Pamphlets</button>
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-2 md:p-8 relative">
            {/* Inventory Tab */}
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
                                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Move to archive?")) { const now = new Date().toISOString(); handleLocalUpdate({...localData, brands: brands.filter(b=>b.id!==brand.id), archive: {...localData.archive!, brands: [...(localData.archive?.brands||[]), brand], deletedAt: {...localData.archive?.deletedAt, [brand.id]: now} }}); } }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
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
                                   <div onClick={(e)=>{e.stopPropagation(); const newName = prompt("Rename Category:", cat.name); if(newName && newName.trim() !== "") { const updated = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === cat.id ? {...c, name: newName.trim()} : c)}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }}} className="absolute top-1 right-8 md:top-2 md:right-8 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-50 text-blue-500 rounded transition-all"><Edit2 size={12}/></div>
                                   <div onClick={(e)=>{e.stopPropagation(); if(confirm("Delete?")){ const updated={...selectedBrand, categories: selectedBrand.categories.filter(c=>c.id!==cat.id)}; handleLocalUpdate({...localData, brands: brands.map(b=>b.id===updated.id?updated:b)}); }}} className="absolute top-1 right-1 md:top-2 md:right-2 p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded"><Trash2 size={12}/></div>
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
                                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                           <div className="flex gap-2">
                                                <button onClick={() => setEditingProduct(product)} className="p-1.5 md:p-2 bg-white text-blue-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-blue-50">Edit</button>
                                                <button onClick={() => setMovingProduct(product)} className="p-1.5 md:p-2 bg-white text-orange-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-orange-50" title="Move Category">Move</button>
                                           </div>
                                           <button onClick={() => { 
                                               if(confirm(`Delete product "${product.name}"?`)) { 
                                                   const updatedCat = {...selectedCategory, products: selectedCategory.products.filter(p => p.id !== product.id)}; 
                                                   const updatedBrand = {...selectedBrand, categories: selectedBrand.categories.map(c => c.id === updatedCat.id ? updatedCat : c)}; 
                                                   
                                                   // Add to archive
                                                   const newArchive = addToArchive('product', product.name, product);
                                                   
                                                   handleLocalUpdate({...localData, brands: brands.map(b => b.id === updatedBrand.id ? updatedBrand : b), archive: newArchive}); 
                                               } 
                                           }} className="p-1.5 md:p-2 bg-white text-red-600 rounded-lg font-bold text-[10px] md:text-xs uppercase shadow-lg hover:bg-red-50 w-[80%]">Delete</button>
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

            {/* Other Tabs */}
            {activeTab === 'pricelists' && (
                <PricelistManager 
                    pricelists={localData.pricelists || []} 
                    pricelistBrands={localData.pricelistBrands || []}
                    onSavePricelists={(p) => handleLocalUpdate({ ...localData, pricelists: p })}
                    onSaveBrands={(b) => handleLocalUpdate({ ...localData, pricelistBrands: b })}
                    onDeletePricelist={(id) => {
                        const toDelete = localData.pricelists?.find(p => p.id === id);
                        if (toDelete) {
                            const newArchive = addToArchive('pricelist', toDelete.title, toDelete);
                            handleLocalUpdate({ ...localData, pricelists: localData.pricelists?.filter(p => p.id !== id), archive: newArchive });
                        }
                    }}
                />
            )}
            
            {activeTab === 'tv' && (
                !selectedTVBrand ? (
                    <div className="animate-fade-in max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase">TV Video Management</h2>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <button onClick={() => { const name = prompt("Brand Name:"); if(name) { const newBrand = { id: generateId('tvb'), name, models: [] }; handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: [...(localData.tv?.brands || []), newBrand] } as TVConfig }); }}} className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center p-4 min-h-[160px] text-indigo-400 hover:border-indigo-500 hover:text-indigo-600 transition-all group">
                                <Plus size={32} className="mb-2" /><span className="font-bold uppercase text-xs tracking-wider text-center">Add TV Brand</span>
                            </button>
                            {tvBrands.map(brand => (
                                <div key={brand.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all relative">
                                    <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 aspect-square">
                                        {brand.logoUrl ? <img src={brand.logoUrl} className="max-w-full max-h-full object-contain" /> : <Tv size={32} className="text-slate-300" />}
                                    </div>
                                    <div className="p-4 bg-white border-t border-slate-100">
                                        <h3 className="font-black text-slate-900 text-sm uppercase truncate mb-1">{brand.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold">{brand.models?.length || 0} Models</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete TV Brand?")) { handleLocalUpdate({...localData, tv: { ...localData.tv, brands: tvBrands.filter(b => b.id !== brand.id) } as TVConfig }); } }} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-20"><Trash2 size={14}/></button>
                                    <button onClick={() => setSelectedTVBrand(brand)} className="absolute inset-0 w-full h-full opacity-0 z-10" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 mb-6"><button onClick={() => setSelectedTVBrand(null)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"><ArrowLeft size={20} /></button><h2 className="text-2xl font-black uppercase text-slate-900 flex-1">{selectedTVBrand.name} <span className="text-slate-400 font-bold ml-2 text-lg">TV Config</span></h2></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-900 uppercase text-xs mb-4">Brand Identity</h4>
                                    <div className="space-y-4">
                                        <InputField label="Brand Name" val={selectedTVBrand.name} onChange={(e: any) => { const updated = { ...selectedTVBrand, name: e.target.value }; handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig }); }} />
                                        <FileUpload label="Brand Logo" currentUrl={selectedTVBrand.logoUrl} onUpload={(url: any) => { const updated = { ...selectedTVBrand, logoUrl: url }; handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig }); }} />
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-6"><h4 className="font-bold text-slate-900 uppercase text-xs">TV Models</h4><button onClick={() => setEditingTVModel({ id: generateId('tvm'), name: '', videoUrls: [] })} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase flex items-center gap-1"><Plus size={12} /> Add Model</button></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(selectedTVBrand.models || []).map((model) => (
                                            <div key={model.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group">
                                                <div className="p-4 flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200">{model.imageUrl ? <img src={model.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <Monitor size={20} className="text-slate-300" />}</div>
                                                    <div className="flex-1 min-w-0"><div className="font-bold text-slate-900 text-sm truncate">{model.name}</div><div className="text-[10px] font-bold text-slate-500 uppercase">{model.videoUrls?.length || 0} Videos</div></div>
                                                </div>
                                                <div className="flex border-t border-slate-200 divide-x divide-slate-200">
                                                    <button onClick={() => setEditingTVModel(model)} className="flex-1 py-2 text-[10px] font-bold uppercase text-blue-600 hover:bg-blue-50 transition-colors">Edit / Videos</button>
                                                    <button onClick={() => { if (confirm("Delete this model?")) { const updated = { ...selectedTVBrand, models: selectedTVBrand.models.filter(m => m.id !== model.id) }; handleLocalUpdate({ ...localData, tv: { ...localData.tv, brands: tvBrands.map(b => b.id === selectedTVBrand.id ? updated : b) } as TVConfig }); } }} className="flex-1 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            )}

            {activeTab === 'marketing' && (
                <div className="max-w-5xl mx-auto">
                    {activeSubTab === 'catalogues' && (
                        <CatalogueManager catalogues={(localData.catalogues || []).filter(c => !c.brandId)} onSave={(c) => { const brandCatalogues = (localData.catalogues || []).filter(c => c.brandId); handleLocalUpdate({ ...localData, catalogues: [...brandCatalogues, ...c] }); }} />
                    )}
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
                                    <p className="text-[10px] text-slate-400 mb-4 uppercase font-bold tracking-wide">{zone.includes('Side') ? 'Size: 1080x1920 (Portrait)' : zone.includes('screensaver') ? 'Mixed Media' : 'Size: 1920x1080 (Landscape)'}</p>
                                    <FileUpload label="Upload Media" accept="image/*,video/*" allowMultiple onUpload={(urls:any, type:any) => { const newAds = (Array.isArray(urls)?urls:[urls]).map(u=>({id:generateId('ad'), type, url:u, dateAdded: new Date().toISOString()})); handleLocalUpdate({...localData, ads: {...localData.ads, [zone]: [...(localData.ads as any)[zone], ...newAds]} as any}); }} />
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {((localData.ads as any)[zone] || []).map((ad: any, idx: number) => (
                                            <div key={ad.id} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                                {ad.type === 'video' ? <video src={ad.url} className="w-full h-full object-cover opacity-60" /> : <img src={ad.url} alt="Ad" className="w-full h-full object-cover" />}
                                                <button onClick={() => { const currentAds = (localData.ads as any)[zone]; const newAdsList = currentAds.filter((_: any, i: number) => i !== idx); handleLocalUpdate({ ...localData, ads: { ...localData.ads, [zone]: newAdsList } as any }); }} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><Trash2 size={10} /></button>
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
                <div className="animate-fade-in max-w-6xl mx-auto pb-24">
                   <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-black text-slate-900 uppercase">Device Fleet</h2>
                       <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
                           Total Devices: {localData.fleet?.length || 0}
                       </div>
                   </div>

                   {/* Device Categories Loop */}
                   {['kiosk', 'mobile', 'tv'].map((type) => {
                       // Filter devices for this category
                       // Default undefined deviceType to 'kiosk' for legacy compatibility
                       const devices = localData.fleet?.filter(k => 
                           k.deviceType === type || (type === 'kiosk' && !k.deviceType)
                       ) || [];

                       if (devices.length === 0) return null;

                       // Config for Section Header
                       const config = {
                           kiosk: { label: 'Interactive Kiosks', icon: <Tablet size={20} className="text-blue-600" />, color: 'blue' },
                           mobile: { label: 'Mobile Handhelds', icon: <Smartphone size={20} className="text-purple-600" />, color: 'purple' },
                           tv: { label: 'TV Displays', icon: <Tv size={20} className="text-indigo-600" />, color: 'indigo' }
                       }[type as 'kiosk' | 'mobile' | 'tv'];

                       return (
                           <div key={type} className="mb-10 last:mb-0">
                               <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-2">
                                   <div className={`p-2 rounded-lg bg-${config.color}-50`}>
                                       {config.icon}
                                   </div>
                                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{config.label}</h3>
                                   <span className="ml-auto text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                                       {devices.length} Devices
                                   </span>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                   {devices.map(kiosk => {
                                       const isOnline = (new Date().getTime() - new Date(kiosk.last_seen).getTime()) < 350000;
                                       return (
                                           <div key={kiosk.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
                                               {/* Card Header */}
                                               <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex justify-between items-start">
                                                   <div className="flex-1 min-w-0 pr-2">
                                                       <div className="flex items-start gap-2 mb-1">
                                                           <div className="mt-0.5 shrink-0">
                                                               {type === 'kiosk' && <Tablet size={14} className="text-blue-500"/>}
                                                               {type === 'mobile' && <Smartphone size={14} className="text-purple-500"/>}
                                                               {type === 'tv' && <Tv size={14} className="text-indigo-500"/>}
                                                           </div>
                                                           <h4 className="font-bold text-slate-900 uppercase text-sm leading-tight break-words" title={kiosk.name}>
                                                               {kiosk.name}
                                                           </h4>
                                                       </div>
                                                       <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                                            <span>ID: {kiosk.id}</span>
                                                       </div>
                                                   </div>
                                                   <div className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                       <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                       {isOnline ? 'Online' : 'Offline'}
                                                   </div>
                                               </div>
                                               
                                               {/* Card Body */}
                                               <div className="p-4 flex-1">
                                                   <div className="flex justify-between items-center text-xs mb-3">
                                                       <span className="text-slate-400 font-bold uppercase text-[10px]">Zone</span>
                                                       <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                           {kiosk.assignedZone || 'Unassigned'}
                                                       </span>
                                                   </div>
                                                   <div className="flex justify-between items-center text-xs">
                                                       <span className="text-slate-400 font-bold uppercase text-[10px]">IP / Net</span>
                                                       <span className="font-mono text-slate-500 text-[10px] flex items-center gap-1">
                                                           <Signal size={10} /> {kiosk.ipAddress || 'Unknown'}
                                                       </span>
                                                   </div>
                                               </div>

                                               {/* Card Footer (Actions) */}
                                               <div className="bg-slate-50 p-2 border-t border-slate-100 flex gap-2">
                                                   <button 
                                                       onClick={() => setEditingKiosk(kiosk)} 
                                                       className="flex-1 py-2 bg-white text-slate-600 rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all text-[10px] font-bold uppercase flex items-center justify-center gap-1.5"
                                                   >
                                                       <Edit2 size={12}/> Edit
                                                   </button>
                                                   
                                                   {supabase && (
                                                       <button 
                                                           onClick={async () => { if(confirm("Restart Device?")) await supabase.from('kiosks').update({restart_requested: true}).eq('id', kiosk.id); }} 
                                                           className="flex-1 py-2 bg-white text-orange-600 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm transition-all text-[10px] font-bold uppercase flex items-center justify-center gap-1.5" 
                                                           title="Restart Device"
                                                       >
                                                           <Power size={12}/> Restart
                                                       </button>
                                                   )}
                                                   
                                                   <button 
                                                       onClick={() => removeFleetMember(kiosk.id)} 
                                                       className="w-10 py-2 bg-white text-red-500 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 hover:shadow-sm transition-all flex items-center justify-center" 
                                                       title="Remove Device"
                                                   >
                                                       <Trash2 size={12}/>
                                                   </button>
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                       );
                   })}
                   
                   {localData.fleet?.length === 0 && (
                       <div className="p-16 text-center text-slate-400 font-bold uppercase text-xs border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center gap-4">
                           <Tablet size={48} className="opacity-20" />
                           <div>No devices registered in fleet</div>
                       </div>
                   )}
                </div>
            )}
            
            {activeTab === 'screensaver' && (
                <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={20} /></div><h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Timing & Schedule</h3></div>
                             <div className="grid grid-cols-2 gap-4 mb-6"><InputField label="Idle Wait (sec)" val={localData.screensaverSettings?.idleTimeout||60} onChange={(e:any)=>handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, idleTimeout: parseInt(e.target.value)}})} /><InputField label="Slide Duration (sec)" val={localData.screensaverSettings?.imageDuration||8} onChange={(e:any)=>handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, imageDuration: parseInt(e.target.value)}})} /></div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="flex justify-between items-center mb-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Hours (Sleep Mode)</label><button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, enableSleepMode: !localData.screensaverSettings?.enableSleepMode}})} className={`w-8 h-4 rounded-full transition-colors relative ${localData.screensaverSettings?.enableSleepMode ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`w-2 h-2 bg-white rounded-full absolute top-1 transition-all ${localData.screensaverSettings?.enableSleepMode ? 'left-5' : 'left-1'}`}></div></button></div><div className={`grid grid-cols-2 gap-4 transition-opacity ${localData.screensaverSettings?.enableSleepMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}><div><label className="block text-[10px] font-bold text-slate-400 mb-1">Start Time</label><input type="time" value={localData.screensaverSettings?.activeHoursStart || '08:00'} onChange={(e) => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, activeHoursStart: e.target.value}})} className="w-full p-2 border border-slate-300 rounded text-sm font-bold"/></div><div><label className="block text-[10px] font-bold text-slate-400 mb-1">End Time</label><input type="time" value={localData.screensaverSettings?.activeHoursEnd || '20:00'} onChange={(e) => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, activeHoursEnd: e.target.value}})} className="w-full p-2 border border-slate-300 rounded text-sm font-bold"/></div></div></div>
                         </div>
                         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Monitor size={20} /></div><h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Content & Behavior</h3></div>
                             <div className="space-y-4">{[{ key: 'showProductImages', label: 'Show Products (Images)' }, { key: 'showProductVideos', label: 'Show Products (Videos)' }, { key: 'showPamphlets', label: 'Show Pamphlet Covers' }, { key: 'showCustomAds', label: 'Show Custom Ads' }, { key: 'muteVideos', label: 'Mute Videos' }, { key: 'showInfoOverlay', label: 'Show Title Overlay' }].map(opt => (<div key={opt.key} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"><label className="text-xs font-bold text-slate-700 uppercase">{opt.label}</label><button onClick={() => handleLocalUpdate({...localData, screensaverSettings: {...localData.screensaverSettings!, [opt.key]: !(localData.screensaverSettings as any)[opt.key]}})} className={`w-10 h-5 rounded-full transition-colors relative ${(localData.screensaverSettings as any)[opt.key] ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${(localData.screensaverSettings as any)[opt.key] ? 'left-6' : 'left-1'}`}></div></button></div>))}</div>
                         </div>
                     </div>
                </div>
            )}
            
            {activeTab === 'history' && (
               <div className="max-w-6xl mx-auto space-y-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <h2 className="text-2xl font-black text-slate-900 uppercase">Archive Management</h2>
                       <div className="flex gap-2">
                            <button 
                                onClick={() => { if(confirm("Permanently clear ALL archived history?")) handleLocalUpdate({...localData, archive: { brands: [], products: [], catalogues: [], deletedItems: [], deletedAt: {} }}) }} 
                                className="text-red-500 font-bold uppercase text-xs flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Trash2 size={14}/> Wipe History
                            </button>
                       </div>
                   </div>

                   <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[500px] flex flex-col">
                       {/* Toolbar */}
                       <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                           <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-lg self-start overflow-x-auto max-w-full">
                               <button onClick={() => setHistoryTab('deletedItems')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${historyTab === 'deletedItems' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All Items</button>
                               <button onClick={() => setHistoryTab('brands')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${historyTab === 'brands' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Deleted Brands</button>
                               <button onClick={() => setHistoryTab('catalogues')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all whitespace-nowrap ${historyTab === 'catalogues' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Deleted Pamphlets</button>
                           </div>
                           <div className="relative">
                               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input 
                                  type="text" 
                                  placeholder="Search Archives..." 
                                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold w-full md:w-64 focus:border-blue-500 outline-none"
                                  value={historySearch}
                                  onChange={(e) => setHistorySearch(e.target.value)}
                               />
                           </div>
                       </div>

                       {/* List Content */}
                       <div className="flex-1 overflow-y-auto">
                           {historyTab === 'deletedItems' ? (
                               archivedGenericItems.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                       <Archive size={48} className="mb-4 opacity-20" />
                                       <span className="text-xs font-bold uppercase tracking-widest">No Deleted Items Found</span>
                                   </div>
                               ) : (
                                   <table className="w-full text-left">
                                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                           <tr>
                                               <th className="px-6 py-3">Type</th>
                                               <th className="px-6 py-3">Name</th>
                                               <th className="px-6 py-3">Deleted Date</th>
                                               <th className="px-6 py-3 text-right">Data</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100 text-sm">
                                           {archivedGenericItems.map(item => (
                                               <tr key={item.id} className="hover:bg-slate-50 group">
                                                   <td className="px-6 py-4">
                                                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                           item.type === 'product' ? 'bg-blue-50 text-blue-700' :
                                                           item.type === 'pricelist' ? 'bg-green-50 text-green-700' :
                                                           'bg-slate-100 text-slate-600'
                                                       }`}>
                                                           {item.type}
                                                       </span>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <div className="font-bold text-slate-900">{item.name}</div>
                                                       <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <div className="text-xs font-bold text-slate-600">
                                                           {formatRelativeTime(item.deletedAt)}
                                                       </div>
                                                       <div className="text-[10px] text-slate-400">
                                                           {new Date(item.deletedAt).toLocaleTimeString()}
                                                       </div>
                                                   </td>
                                                   <td className="px-6 py-4 text-right">
                                                       <button 
                                                            onClick={() => {
                                                                const json = JSON.stringify(item.data, null, 2);
                                                                const blob = new Blob([json], {type: "application/json"});
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = `${item.name}-recovered.json`;
                                                                a.click();
                                                            }}
                                                            className="text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1 transition-colors border border-slate-200"
                                                       >
                                                           <Download size={12} /> JSON
                                                       </button>
                                                   </td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               )
                           ) : historyTab === 'brands' ? (
                               archivedBrands.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                       <Archive size={48} className="mb-4 opacity-20" />
                                       <span className="text-xs font-bold uppercase tracking-widest">No Archived Brands Found</span>
                                   </div>
                               ) : (
                                   <table className="w-full text-left">
                                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                           <tr>
                                               <th className="px-6 py-3">Brand Name</th>
                                               <th className="px-6 py-3">Metadata</th>
                                               <th className="px-6 py-3">Deleted Date</th>
                                               <th className="px-6 py-3 text-right">Actions</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100 text-sm">
                                           {archivedBrands.map(b => (
                                               <tr key={b.id} className="hover:bg-slate-50 group">
                                                   <td className="px-6 py-4">
                                                       <div className="font-bold text-slate-900">{b.name}</div>
                                                       <div className="text-[10px] text-slate-400 font-mono">{b.id}</div>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                                           <Box size={12} /> {b.categories.length} Categories
                                                       </div>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <div className="text-xs font-bold text-slate-600">
                                                           {localData.archive?.deletedAt?.[b.id] ? formatRelativeTime(localData.archive.deletedAt[b.id]) : 'Unknown'}
                                                       </div>
                                                       <div className="text-[10px] text-slate-400">
                                                           {localData.archive?.deletedAt?.[b.id] ? new Date(localData.archive.deletedAt[b.id]).toLocaleTimeString() : ''}
                                                       </div>
                                                   </td>
                                                   <td className="px-6 py-4 text-right">
                                                       <button onClick={() => restoreBrand(b)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase inline-flex items-center gap-1 transition-colors">
                                                           <RotateCcw size={14} /> Restore
                                                       </button>
                                                   </td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               )
                           ) : (
                               archivedCatalogues.length === 0 ? (
                                   <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                       <Archive size={48} className="mb-4 opacity-20" />
                                       <span className="text-xs font-bold uppercase tracking-widest">No Archived Pamphlets Found</span>
                                   </div>
                               ) : (
                                   <table className="w-full text-left">
                                       <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                           <tr>
                                               <th className="px-6 py-3">Title</th>
                                               <th className="px-6 py-3">Type</th>
                                               <th className="px-6 py-3">Expiration Info</th>
                                               <th className="px-6 py-3 text-right">Actions</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100 text-sm">
                                           {archivedCatalogues.map(c => (
                                               <tr key={c.id} className="hover:bg-slate-50 group">
                                                   <td className="px-6 py-4">
                                                       <div className="font-bold text-slate-900">{c.title}</div>
                                                       <div className="text-[10px] text-slate-400 font-mono">{c.id}</div>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.brandId ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                           {c.brandId ? 'Brand Catalogue' : 'Global Pamphlet'}
                                                       </span>
                                                   </td>
                                                   <td className="px-6 py-4">
                                                       <div className="text-xs font-bold text-slate-600">
                                                           {c.endDate ? `Expired: ${new Date(c.endDate).toLocaleDateString()}` : 'Manual Delete'}
                                                       </div>
                                                       <div className="text-[10px] text-slate-400">
                                                           Deleted: {localData.archive?.deletedAt?.[c.id] ? formatRelativeTime(localData.archive.deletedAt[c.id]) : 'N/A'}
                                                       </div>
                                                   </td>
                                                   <td className="px-6 py-4 text-right">
                                                       <button onClick={() => restoreCatalogue(c)} className="text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase inline-flex items-center gap-1 transition-colors">
                                                           <RotateCcw size={14} /> Restore
                                                       </button>
                                                   </td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               )
                           )}
                       </div>
                   </div>
               </div>
            )}

            {activeTab === 'settings' && (
               <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
                   {/* ZIP BACKUP SECTION */}
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
                                       <li>Images & PDFs are automatically converted.</li>
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
                                                     // Merge Logic: Add new brands, or merge categories if brand exists
                                                     let mergedBrands = [...localData.brands];
                                                     
                                                     newBrands.forEach(nb => {
                                                         const existingBrandIndex = mergedBrands.findIndex(b => b.name === nb.name);
                                                         if (existingBrandIndex > -1) {
                                                             // Merge Brand Assets if present
                                                             if (nb.logoUrl) {
                                                                 mergedBrands[existingBrandIndex].logoUrl = nb.logoUrl;
                                                             }

                                                             // Merge Categories
                                                             nb.categories.forEach(nc => {
                                                                 const existingCatIndex = mergedBrands[existingBrandIndex].categories.findIndex(c => c.name === nc.name);
                                                                 if (existingCatIndex > -1) {
                                                                     // Merge Products
                                                                     const existingProducts = mergedBrands[existingBrandIndex].categories[existingCatIndex].products;
                                                                     // Add only new products based on name
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
                                                     alert("Import Successful!");
                                                 } catch(err) {
                                                     console.error(err);
                                                     alert("Failed to read ZIP file. Ensure structure is correct.");
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

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                       <h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2"><Smartphone size={20} className="text-blue-500"/> App Identity</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs leading-relaxed"><strong>Kiosk Icon:</strong> Upload a square image (PNG). This icon will appear on the device home screen when installed as a PWA, and in the browser tab.</div>
                               <FileUpload label="Kiosk App Icon" currentUrl={localData.appConfig?.kioskIconUrl} onUpload={(url: any) => handleLocalUpdate({...localData, appConfig: { ...localData.appConfig, kioskIconUrl: url }})} />
                           </div>
                           <div className="space-y-4">
                               <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed"><strong>Admin Icon:</strong> Upload a square image (PNG). This allows you to distinguish the Admin Hub when saved to your personal device.</div>
                               <FileUpload label="Admin App Icon" currentUrl={localData.appConfig?.adminIconUrl} onUpload={(url: any) => handleLocalUpdate({...localData, appConfig: { ...localData.appConfig, adminIconUrl: url }})} />
                           </div>
                       </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2"><UserCog size={20} className="text-blue-500"/> Admin Access Control</h3><AdminManager admins={localData.admins || []} onUpdate={(admins) => handleLocalUpdate({ ...localData, admins })} currentUser={currentUser} /></div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h3 className="font-black text-slate-900 uppercase text-sm mb-6 flex items-center gap-2"><Info size={20} className="text-blue-500"/> About Page Configuration</h3><div className="space-y-4"><InputField label="About Title" val={localData.about?.title || ''} onChange={(e: any) => handleLocalUpdate({...localData, about: {...localData.about, title: e.target.value}})} placeholder="e.g. About Our Vision" /><InputField label="About Text" isArea val={localData.about?.text || ''} onChange={(e: any) => handleLocalUpdate({...localData, about: {...localData.about, text: e.target.value}})} placeholder="Enter company description..." /><FileUpload label="Audio Guide (MP3)" accept="audio/*" icon={<Volume2 />} currentUrl={localData.about?.audioUrl} onUpload={(url: any) => handleLocalUpdate({...localData, about: {...localData.about, audioUrl: url}})} /></div></div>
                   
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