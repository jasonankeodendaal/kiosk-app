

import React, { useState, useEffect } from 'react';
import {
  LogOut, ArrowLeft, Save, Trash2, Plus, Edit2, Upload, Box, 
  Monitor, Grid, Image as ImageIcon, ChevronRight, Wifi, WifiOff, 
  Signal, Video, FileText, BarChart3, Search, RotateCcw, FolderInput, FileArchive, Check, BookOpen, LayoutTemplate, Globe, Megaphone, Play, Download, MapPin, Tablet, Eye, X, Info, Menu, Map as MapIcon, HelpCircle, File, PlayCircle, ToggleLeft, ToggleRight, Clock, Volume2, VolumeX, Settings, Loader2, ChevronDown, Layout, MegaphoneIcon, Book, Calendar, Camera, RefreshCw, Database, Power, CloudLightning, Folder, Smartphone, Cloud, HardDrive, Package, History, Archive, AlertCircle, FolderOpen, Layers, ShieldCheck, Ruler, SaveAll, Pencil
} from 'lucide-react';
import { KioskRegistry, StoreData, Brand, Category, Product, AdConfig, AdItem, Catalogue, HeroConfig, ScreensaverSettings, ArchiveData, DimensionSet, ProductManual } from '../types';
import { resetStoreData } from '../services/geminiService';
import { uploadFileToStorage, supabase, checkCloudConnection } from '../services/kioskService';
import SetupGuide from './SetupGuide';
import JSZip from 'jszip';

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// Updated to convert ALL pages of PDF
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

        console.log(`Converting PDF with ${numPages} pages...`);

        // Loop through ALL pages
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
        
        console.log(`Converted ${images.length} pages.`);
        return images;
    } catch (error) {
        console.error("PDF Conversion Error:", error);
        alert("Failed to convert PDF. Ensure it is a valid PDF file.");
        return [];
    }
};

const FileUpload = ({ label, onUpload, accept = "image/*", type="image", multiple=false }: { label: string, onUpload: (urls: string[]) => void, accept?: string, type?: 'image'|'video'|'pdf', multiple?: boolean }) => {
    const [uploading, setUploading] = useState(false);
  
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setUploading(true);
        const files = Array.from(e.target.files) as File[];
        const uploadedUrls: string[] = [];
  
        try {
            for (const file of files) {
                // PDF HANDLING
                if (file.type === 'application/pdf' || type === 'pdf') {
                    const reader = new FileReader();
                    const pdfDataUrl = await new Promise<string>((resolve) => {
                        reader.onload = (ev) => resolve(ev.target?.result as string);
                        reader.readAsDataURL(file);
                    });
                    
                    // Convert ALL pages to Images
                    const images = await convertPdfToImages(pdfDataUrl);
                    
                    // Upload all converted page images
                    for(const imgBase64 of images) {
                        // Convert base64 back to Blob for upload
                        const res = await fetch(imgBase64);
                        const blob = await res.blob();
                        const imageFile = new File([blob], `page_${Date.now()}.jpg`, { type: "image/jpeg" });
                        
                        const url = await uploadFileToStorage(imageFile);
                        uploadedUrls.push(url);
                    }
                } 
                // STANDARD IMAGE/VIDEO HANDLING
                else {
                    const url = await uploadFileToStorage(file);
                    uploadedUrls.push(url);
                }
            }
            onUpload(uploadedUrls);
        } catch (err: any) {
            console.error(err);
            alert("Upload Failed: " + err.message);
        } finally {
            setUploading(false);
        }
      }
    };
  
    return (
      <div className="mb-4">
        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">{label}</label>
        <div className="flex items-center gap-4">
           <label className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-200 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
               {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
               <span className="text-xs font-bold uppercase">{uploading ? 'Processing...' : multiple ? 'Upload Files' : 'Upload File'}</span>
               <input type="file" className="hidden" accept={accept} onChange={handleFile} multiple={multiple} disabled={uploading} />
           </label>
           {uploading && <span className="text-xs text-slate-400 animate-pulse">This may take a moment...</span>}
        </div>
      </div>
    );
};

// --- SUB-COMPONENTS ---
const ProductEditor = ({ product, onSave, onCancel }: { product: Product, onSave: (p: Product) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Product>({ ...product });
    // Ensure manuals is init
    if(!formData.manuals) formData.manuals = [];

    const updateSpec = (key: string, value: string) => {
       setFormData(prev => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
    };
  
    const removeSpec = (key: string) => {
      const newSpecs = { ...formData.specs };
      delete newSpecs[key];
      setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    // Dimension Helpers
    const updateDimension = (index: number, field: keyof DimensionSet, value: string) => {
        const newDims = [...formData.dimensions];
        newDims[index] = { ...newDims[index], [field]: value };
        setFormData(prev => ({ ...prev, dimensions: newDims }));
    };

    const addDimensionSet = () => {
        setFormData(prev => ({
            ...prev,
            dimensions: [...prev.dimensions, { label: "New Box", width: "", height: "", depth: "", weight: "" }]
        }));
    };

    const removeDimensionSet = (index: number) => {
        const newDims = formData.dimensions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, dimensions: newDims }));
    };

    // Manual Helpers
    const handleAddManual = (images: string[]) => {
        if(images.length === 0) return;
        const newManual: ProductManual = {
            id: generateId('man'),
            title: `Manual ${formData.manuals ? formData.manuals.length + 1 : 1}`,
            images: images
        };
        setFormData(prev => ({ ...prev, manuals: [...(prev.manuals || []), newManual] }));
    };

    const updateManualTitle = (index: number, title: string) => {
        const newManuals = [...(formData.manuals || [])];
        newManuals[index].title = title;
        setFormData(prev => ({ ...prev, manuals: newManuals }));
    };

    const removeManual = (index: number) => {
        const newManuals = (formData.manuals || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, manuals: newManuals }));
    };
  
    return (
      <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
         <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                 <Edit2 size={20} className="text-blue-600" /> Edit Product
               </h3>
               <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product Name</label>
                          <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:border-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">SKU / Code</label>
                          <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                          <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg h-32 text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                      </div>
                  </div>
                  
                  <div className="space-y-6">
                      <FileUpload label="Main Product Image" onUpload={(urls) => setFormData({...formData, imageUrl: urls[0]})} />
                      {formData.imageUrl && (
                          <div className="w-32 h-32 bg-slate-100 rounded-lg border border-slate-200 p-2 relative group">
                              <img src={formData.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                              <button onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                          </div>
                      )}

                      <FileUpload label="Gallery Images" multiple onUpload={(urls) => setFormData({...formData, galleryUrls: [...(formData.galleryUrls || []), ...urls]})} />
                      {formData.galleryUrls && formData.galleryUrls.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                              {formData.galleryUrls.map((url, i) => (
                                  <div key={i} className="w-16 h-16 shrink-0 bg-slate-100 rounded border relative group">
                                      <img src={url} className="w-full h-full object-cover" alt="" />
                                      <button onClick={() => setFormData({...formData, galleryUrls: formData.galleryUrls?.filter((_, idx) => idx !== i)})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"><X size={10} /></button>
                                  </div>
                              ))}
                          </div>
                      )}

                      <FileUpload label="Product Videos (MP4)" type="video" multiple onUpload={(urls) => setFormData({...formData, videoUrls: [...(formData.videoUrls || []), ...urls]})} />
                      {formData.videoUrls && formData.videoUrls.length > 0 && (
                          <div className="space-y-2">
                             {formData.videoUrls.map((url, i) => (
                                 <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
                                     <div className="flex items-center gap-2 truncate">
                                         <Video size={14} className="text-blue-500" />
                                         <span className="text-xs truncate max-w-[200px]">{url.split('/').pop()}</span>
                                     </div>
                                     <button onClick={() => setFormData({...formData, videoUrls: formData.videoUrls?.filter((_, idx) => idx !== i)})} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                                 </div>
                             ))}
                          </div>
                      )}
                  </div>
               </div>

               {/* MULTI MANUALS SECTION */}
               <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                      <Book size={16} /> User Manuals
                  </h4>
                  
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4">
                     <FileUpload label="Add New Manual (PDF)" type="pdf" onUpload={handleAddManual} />
                     <p className="text-[10px] text-slate-500 mt-1">Upload a PDF. All pages will be converted to images automatically.</p>
                  </div>

                  {formData.manuals && formData.manuals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.manuals.map((manual, idx) => (
                              <div key={manual.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center gap-3">
                                  <div className="w-12 h-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                      {manual.images && manual.images[0] ? (
                                          <img src={manual.images[0]} className="w-full h-full object-cover" alt="Cover" />
                                      ) : <FileText size={20} className="text-slate-300" />}
                                  </div>
                                  <div className="flex-1">
                                      <input 
                                        type="text" 
                                        value={manual.title}
                                        onChange={(e) => updateManualTitle(idx, e.target.value)}
                                        className="w-full text-sm font-bold border-b border-transparent focus:border-blue-500 outline-none bg-transparent"
                                        placeholder="Manual Title"
                                      />
                                      <div className="text-[10px] text-slate-400 mt-1">{manual.images.length} Pages</div>
                                  </div>
                                  <button onClick={() => removeManual(idx)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-4 text-slate-400 text-sm italic">No manuals uploaded.</div>
                  )}
               </div>

               <div className="border-t border-slate-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Ruler size={16} /> Dimensions & Weights</h4>
                    <button onClick={addDimensionSet} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase hover:bg-blue-100">+ Add Box/Unit</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.dimensions.map((dim, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                              <button onClick={() => removeDimensionSet(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                              
                              <div className="mb-2">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Label (e.g. Stand)</label>
                                  <input className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold" value={dim.label || ''} onChange={(e) => updateDimension(i, 'label', e.target.value)} placeholder={`Unit ${i+1}`} />
                              </div>

                              <div className="grid grid-cols-4 gap-2">
                                  <div><label className="text-[10px] font-bold uppercase text-slate-400">H</label><input className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" value={dim.height} onChange={(e) => updateDimension(i, 'height', e.target.value)} /></div>
                                  <div><label className="text-[10px] font-bold uppercase text-slate-400">W</label><input className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" value={dim.width} onChange={(e) => updateDimension(i, 'width', e.target.value)} /></div>
                                  <div><label className="text-[10px] font-bold uppercase text-slate-400">D</label><input className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" value={dim.depth} onChange={(e) => updateDimension(i, 'depth', e.target.value)} /></div>
                                  <div><label className="text-[10px] font-bold uppercase text-slate-400">Wt</label><input className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs" value={dim.weight} onChange={(e) => updateDimension(i, 'weight', e.target.value)} /></div>
                              </div>
                          </div>
                      ))}
                  </div>
               </div>

               <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><Settings size={16} /> Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     {Object.entries(formData.specs).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                           <span className="text-xs font-bold text-slate-500 uppercase w-1/3">{key}</span>
                           <input className="flex-1 bg-transparent border-none text-sm font-semibold outline-none" value={val} onChange={e => updateSpec(key, e.target.value)} />
                           <button onClick={() => removeSpec(key)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                        </div>
                     ))}
                  </div>
                  <div className="flex gap-2">
                      <input id="newSpecKey" placeholder="New Spec Name (e.g. Battery)" className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm outline-none" />
                      <button onClick={() => {
                          const input = document.getElementById('newSpecKey') as HTMLInputElement;
                          if(input.value) { updateSpec(input.value, "Value"); input.value = ""; }
                      }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-xs font-bold uppercase">Add Spec</button>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
               <button onClick={onCancel} className="px-6 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-colors uppercase text-xs">Cancel</button>
               <button onClick={() => onSave(formData)} className="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg uppercase text-xs flex items-center gap-2">
                   <Save size={16} /> Save Changes
               </button>
            </div>
         </div>
      </div>
    );
};

const CatalogueManager = ({ catalogues, onUpdate, onDelete, onAdd }: { catalogues: Catalogue[], onUpdate: (c: Catalogue) => void, onDelete: (id: string) => void, onAdd: (c: Catalogue) => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCat, setNewCat] = useState<Partial<Catalogue>>({ title: '', type: 'catalogue', pages: [] });

    const handleUpload = (urls: string[]) => {
        // urls array comes from convertPdfToImages via FileUpload
        // It contains ALL pages now.
        setNewCat(prev => ({ ...prev, pages: [...(prev.pages || []), ...urls] }));
    };

    const handleSave = () => {
        if(newCat.title && newCat.pages && newCat.pages.length > 0) {
            onAdd({
                id: generateId('cat'),
                title: newCat.title!,
                type: newCat.type as 'catalogue' | 'pamphlet' || 'catalogue',
                pages: newCat.pages!,
                startDate: newCat.startDate,
                endDate: newCat.endDate,
                year: newCat.year
            });
            setIsAdding(false);
            setNewCat({ title: '', type: 'catalogue', pages: [] });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2"><BookOpen size={20} /> Catalogues & Pamphlets</h3>
                <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-800 flex items-center gap-2"><Plus size={14} /> Add New</button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Title</label>
                            <input className="w-full p-2 rounded border border-slate-200" value={newCat.title} onChange={e => setNewCat({...newCat, title: e.target.value})} placeholder="e.g. Summer Collection" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                            <div className="flex bg-white rounded border border-slate-200 p-1">
                                <button onClick={() => setNewCat({...newCat, type: 'catalogue'})} className={`flex-1 py-1 text-xs font-bold uppercase rounded ${newCat.type === 'catalogue' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Catalogue</button>
                                <button onClick={() => setNewCat({...newCat, type: 'pamphlet'})} className={`flex-1 py-1 text-xs font-bold uppercase rounded ${newCat.type === 'pamphlet' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>Pamphlet</button>
                            </div>
                        </div>
                    </div>
                    
                    {newCat.type === 'pamphlet' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                             <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Start Date</label><input type="date" className="w-full p-2 border rounded" onChange={e => setNewCat({...newCat, startDate: e.target.value})} /></div>
                             <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">End Date (Auto-Remove)</label><input type="date" className="w-full p-2 border rounded" onChange={e => setNewCat({...newCat, endDate: e.target.value})} /></div>
                        </div>
                    )}

                    <FileUpload label="Upload PDF (Auto-Converts Pages)" type="pdf" onUpload={handleUpload} />
                    
                    {newCat.pages && newCat.pages.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2 mb-4">
                            {newCat.pages.map((page, i) => (
                                <img key={i} src={page} className="h-24 w-auto object-contain border rounded" alt="" />
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-500">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase">Save</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogues.map(cat => (
                    <div key={cat.id} className="border border-slate-200 rounded-xl p-4 flex gap-4 bg-slate-50 hover:bg-white transition-colors">
                        <div className="w-16 h-24 bg-slate-200 rounded shrink-0 overflow-hidden">
                            {cat.pages[0] ? <img src={cat.pages[0]} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Book size={16} /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded mb-1 inline-block ${cat.type === 'pamphlet' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{cat.type}</span>
                                <button onClick={() => onDelete(cat.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                            <h4 className="font-bold text-slate-900 truncate">{cat.title}</h4>
                            <p className="text-xs text-slate-500">{cat.pages.length} Pages</p>
                            {cat.endDate && <p className="text-[10px] text-red-400 mt-1 font-mono">Expires: {new Date(cat.endDate).toLocaleDateString()}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN ADMIN COMPONENT ---
export const AdminDashboard = ({ storeData, onUpdateData, onRefresh }: { storeData: StoreData | null, onUpdateData: (d: StoreData) => void, onRefresh: () => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'design' | 'fleet' | 'settings'>('overview');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Snapshot Viewer State
  const [viewingSnapshot, setViewingSnapshot] = useState<string | null>(null);

  // Sorting
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (storeData?.brands) {
        // Ensure alphabetized
        const sorted = [...storeData.brands].sort((a,b) => a.name.localeCompare(b.name));
        setBrands(sorted);
    }
  }, [storeData]);

  if (!storeData) return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  const handleSaveData = async (newData: StoreData) => {
      await onUpdateData(newData);
      setUnsavedChanges(false);
  };

  // --- HANDLERS (CRUD) ---
  const handleAddBrand = () => {
    const name = prompt("Enter Brand Name:");
    if (name) {
      const newBrand: Brand = { id: generateId('brand'), name, categories: [] };
      const updatedBrands = [...brands, newBrand].sort((a,b) => a.name.localeCompare(b.name));
      handleSaveData({ ...storeData, brands: updatedBrands });
    }
  };

  const handleUpdateBrand = (id: string, updates: Partial<Brand>) => {
      const updatedBrands = brands.map(b => b.id === id ? { ...b, ...updates } : b).sort((a,b) => a.name.localeCompare(b.name));
      handleSaveData({ ...storeData, brands: updatedBrands });
  };

  const handleDeleteBrand = (id: string) => {
    if (confirm("Delete this brand and ALL its products?")) {
        const updatedBrands = brands.filter(b => b.id !== id);
        handleSaveData({ ...storeData, brands: updatedBrands });
    }
  };

  const handleAddCategory = (brandId: string) => {
      const name = prompt("Enter Category Name (e.g. Smartphones):");
      if (name) {
          const updatedBrands = brands.map(b => {
              if (b.id === brandId) {
                  return {
                      ...b,
                      categories: [...b.categories, { id: generateId('cat'), name, icon: 'Box', products: [] }]
                  };
              }
              return b;
          });
          handleSaveData({ ...storeData, brands: updatedBrands });
      }
  };

  const handleAddProduct = (brandId: string, catId: string) => {
      setEditingBrandId(brandId);
      setEditingCategoryId(catId);
      setEditingProduct({
          id: generateId('prod'),
          name: 'New Product',
          description: '',
          specs: {},
          features: [],
          dimensions: [{ label: 'Device', width: '', height: '', depth: '', weight: '' }],
          imageUrl: '',
          manuals: [] // Init manuals array
      });
  };

  const saveProduct = (product: Product) => {
      const updatedBrands = brands.map(b => {
          if (b.id === editingBrandId) {
              return {
                  ...b,
                  categories: b.categories.map(c => {
                      if (c.id === editingCategoryId) {
                          const existingIndex = c.products.findIndex(p => p.id === product.id);
                          let newProducts;
                          if (existingIndex >= 0) {
                              newProducts = [...c.products];
                              newProducts[existingIndex] = product;
                          } else {
                              newProducts = [...c.products, product];
                          }
                          // Sort Products Alphabetically
                          newProducts.sort((a,b) => a.name.localeCompare(b.name));
                          return { ...c, products: newProducts };
                      }
                      return c;
                  })
              };
          }
          return b;
      });
      handleSaveData({ ...storeData, brands: updatedBrands });
      setEditingProduct(null);
  };

  const deleteProduct = (brandId: string, catId: string, prodId: string) => {
    if(confirm("Are you sure?")) {
        const updatedBrands = brands.map(b => {
            if (b.id === brandId) {
                return {
                    ...b,
                    categories: b.categories.map(c => {
                        if (c.id === catId) {
                            return { ...c, products: c.products.filter(p => p.id !== prodId) };
                        }
                        return c;
                    })
                };
            }
            return b;
        });
        handleSaveData({ ...storeData, brands: updatedBrands });
    }
  };

  const handleFleetCommand = async (kioskId: string, command: 'snapshot' | 'restart') => {
      if (!supabase) return alert("Cloud connection required for commands.");
      
      const update: any = {};
      if (command === 'snapshot') update.request_snapshot = true;
      if (command === 'restart') update.restart_requested = true;

      const { error } = await supabase.from('kiosks').update(update).eq('id', kioskId);
      if (error) alert("Command failed: " + error.message);
      else alert(`Command sent: ${command}`);
  };

  // Stats
  const totalProducts = brands.reduce((acc, b) => acc + b.categories.reduce((cAcc, c) => cAcc + c.products.length, 0), 0);
  const totalKiosks = storeData.fleet?.length || 0;
  const onlineKiosks = storeData.fleet?.filter(k => {
      const lastSeen = new Date(k.last_seen);
      const now = new Date();
      return (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000; // 5 mins
  }).length || 0;

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
         <div className="p-6 border-b border-slate-800">
             <div className="flex items-center gap-3 text-blue-400 mb-1">
                 <Layout size={24} />
                 <span className="font-black text-lg tracking-tight">ADMIN HUB</span>
             </div>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kiosk Pro Systems</p>
         </div>

         <nav className="flex-1 p-4 space-y-2">
             <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <BarChart3 size={18} /> Overview
             </button>
             <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Box size={18} /> Products & Brands
             </button>
             <button onClick={() => setActiveTab('design')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'design' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Monitor size={18} /> Appearance & Ads
             </button>
             <button onClick={() => setActiveTab('fleet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'fleet' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Signal size={18} /> Kiosk Fleet
             </button>
             <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                 <Settings size={18} /> System Setup
             </button>
         </nav>

         <div className="p-4 border-t border-slate-800">
             <button onClick={() => window.location.href = '/'} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold uppercase transition-colors">
                 <LogOut size={14} /> Exit to Kiosk
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
         <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeTab}</h2>
             <div className="flex items-center gap-4">
                 <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Sync Data"><RefreshCw size={18} /></button>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                     <div className={`w-2 h-2 rounded-full ${supabase ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                     {supabase ? 'Cloud Connected' : 'Local Mode'}
                 </div>
             </div>
         </header>

         <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
             
             {/* OVERVIEW TAB */}
             {activeTab === 'overview' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3 text-slate-400 mb-2 uppercase text-xs font-bold tracking-widest"><Box size={16} /> Total Products</div>
                         <div className="text-4xl font-black text-slate-900">{totalProducts}</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3 text-slate-400 mb-2 uppercase text-xs font-bold tracking-widest"><Grid size={16} /> Total Brands</div>
                         <div className="text-4xl font-black text-slate-900">{brands.length}</div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="flex items-center gap-3 text-slate-400 mb-2 uppercase text-xs font-bold tracking-widest"><Signal size={16} /> Online Kiosks</div>
                         <div className="text-4xl font-black text-slate-900">{onlineKiosks} <span className="text-lg text-slate-400 font-bold">/ {totalKiosks}</span></div>
                     </div>
                 </div>
             )}

             {/* PRODUCTS TAB */}
             {activeTab === 'products' && (
                 <div className="space-y-8">
                     <div className="flex justify-end">
                         <button onClick={handleAddBrand} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-slate-800 flex items-center gap-2"><Plus size={14} /> Add Brand</button>
                     </div>
                     
                     {brands.map(brand => (
                         <div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1">
                                         {brand.logoUrl ? <img src={brand.logoUrl} className="max-w-full max-h-full" /> : <span className="font-bold">{brand.name[0]}</span>}
                                     </div>
                                     <div>
                                         <h3 className="font-black text-lg text-slate-900">{brand.name}</h3>
                                         <button onClick={() => setEditingBrandId(brand.id)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Edit Brand Details</button>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                      <FileUpload label="Logo" onUpload={(urls) => handleUpdateBrand(brand.id, { logoUrl: urls[0] })} />
                                      <button onClick={() => handleDeleteBrand(brand.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                 </div>
                             </div>

                             <div className="p-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {brand.categories.map(cat => (
                                         <div key={cat.id} className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-colors bg-slate-50/50">
                                             <div className="flex justify-between items-center mb-3">
                                                 <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                                     <Folder size={12} /> {cat.name}
                                                 </span>
                                                 <button onClick={() => handleAddProduct(brand.id, cat.id)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full"><Plus size={14} /></button>
                                             </div>
                                             <div className="space-y-1">
                                                 {cat.products.map(prod => (
                                                     <div key={prod.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 hover:shadow-sm transition-shadow group">
                                                         <span className="text-sm font-bold text-slate-700 truncate">{prod.name}</span>
                                                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                             <button onClick={() => { setEditingBrandId(brand.id); setEditingCategoryId(cat.id); setEditingProduct(prod); }} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                                                             <button onClick={() => deleteProduct(brand.id, cat.id, prod.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                                                         </div>
                                                     </div>
                                                 ))}
                                                 {cat.products.length === 0 && <div className="text-xs text-slate-300 italic py-2 text-center">No products</div>}
                                             </div>
                                         </div>
                                     ))}
                                     <button onClick={() => handleAddCategory(brand.id)} className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 font-bold uppercase text-xs p-4 gap-2 transition-all">
                                         <Plus size={16} /> Add Category
                                     </button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             {/* DESIGN TAB */}
             {activeTab === 'design' && (
                 <div className="space-y-8 max-w-4xl mx-auto">
                     
                     {/* HERO CONFIG */}
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                         <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><LayoutTemplate size={20} /> Home Screen Hero</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                 <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hero Title</label><input className="w-full p-2 border rounded" value={storeData.hero.title} onChange={e => handleSaveData({...storeData, hero: {...storeData.hero, title: e.target.value}})} /></div>
                                 <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subtitle</label><input className="w-full p-2 border rounded" value={storeData.hero.subtitle} onChange={e => handleSaveData({...storeData, hero: {...storeData.hero, subtitle: e.target.value}})} /></div>
                                 <div><label className="block text-xs font-bold uppercase text-slate-500 mb-1">Website URL</label><input className="w-full p-2 border rounded" value={storeData.hero.websiteUrl} onChange={e => handleSaveData({...storeData, hero: {...storeData.hero, websiteUrl: e.target.value}})} /></div>
                             </div>
                             <div className="space-y-4">
                                 <FileUpload label="Background Image" onUpload={(urls) => handleSaveData({...storeData, hero: {...storeData.hero, backgroundImageUrl: urls[0]}})} />
                                 <FileUpload label="Logo Overlay" onUpload={(urls) => handleSaveData({...storeData, hero: {...storeData.hero, logoUrl: urls[0]}})} />
                             </div>
                         </div>
                     </div>

                     {/* CATALOGUE MANAGER */}
                     <CatalogueManager 
                        catalogues={storeData.catalogues || []} 
                        onAdd={(c) => handleSaveData({...storeData, catalogues: [...(storeData.catalogues || []), c]})}
                        onDelete={(id) => handleSaveData({...storeData, catalogues: (storeData.catalogues || []).filter(x => x.id !== id)})}
                        onUpdate={() => {}} // Simple delete/add model for now
                     />

                     {/* SCREENSAVER SETTINGS */}
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                         <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2"><Monitor size={20} /> Screensaver</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Idle Timeout (Seconds)</label>
                                <input type="number" className="w-full p-2 border rounded" value={storeData.screensaverSettings?.idleTimeout || 60} onChange={e => handleSaveData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, idleTimeout: parseInt(e.target.value)}})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Image Duration (Seconds)</label>
                                <input type="number" className="w-full p-2 border rounded" value={storeData.screensaverSettings?.imageDuration || 8} onChange={e => handleSaveData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, imageDuration: parseInt(e.target.value)}})} />
                            </div>
                         </div>
                         <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                             {[
                                 ['showProductImages', 'Product Images'], 
                                 ['showProductVideos', 'Product Videos'],
                                 ['showPamphlets', 'Pamphlets'],
                                 ['showCustomAds', 'Custom Ads'],
                                 ['muteVideos', 'Mute Videos']
                             ].map(([key, label]) => (
                                 <label key={key} className="flex items-center gap-2 p-3 bg-slate-50 rounded border cursor-pointer">
                                     <input type="checkbox" checked={(storeData.screensaverSettings as any)?.[key] || false} onChange={e => handleSaveData({...storeData, screensaverSettings: {...storeData.screensaverSettings!, [key]: e.target.checked}})} />
                                     <span className="text-xs font-bold uppercase text-slate-700">{label}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                 </div>
             )}

             {/* FLEET TAB */}
             {activeTab === 'fleet' && (
                 <div className="max-w-6xl mx-auto space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {(storeData.fleet || []).map(kiosk => {
                             const isOnline = (new Date().getTime() - new Date(kiosk.last_seen).getTime()) < 5 * 60 * 1000;
                             return (
                                 <div key={kiosk.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                                     <div className={`absolute top-0 left-0 w-1.5 h-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                     <div className="flex justify-between items-start mb-4">
                                         <div>
                                             <h3 className="font-black text-lg text-slate-900">{kiosk.name}</h3>
                                             <div className="text-xs font-mono text-slate-400">{kiosk.id}</div>
                                         </div>
                                         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${kiosk.deviceType === 'mobile' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{kiosk.deviceType || 'Kiosk'}</div>
                                     </div>
                                     
                                     <div className="space-y-2 text-xs text-slate-600 mb-6 font-medium">
                                         <div className="flex justify-between"><span>Status:</span> <span className={isOnline ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span></div>
                                         <div className="flex justify-between"><span>Last Seen:</span> <span>{new Date(kiosk.last_seen).toLocaleTimeString()}</span></div>
                                         <div className="flex justify-between"><span>IP Addr:</span> <span>{kiosk.ipAddress}</span></div>
                                         <div className="flex justify-between"><span>Signal:</span> <span>{kiosk.wifiStrength}%</span></div>
                                     </div>

                                     <div className="flex gap-2">
                                         {kiosk.deviceType !== 'mobile' && (
                                             <button 
                                                onClick={() => handleFleetCommand(kiosk.id, 'snapshot')} 
                                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded font-bold uppercase text-[10px] flex items-center justify-center gap-1"
                                                disabled={!isOnline}
                                             >
                                                <Camera size={12} /> Snapshot
                                             </button>
                                         )}
                                         <button 
                                            onClick={() => handleFleetCommand(kiosk.id, 'restart')} 
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded font-bold uppercase text-[10px] flex items-center justify-center gap-1"
                                            disabled={!isOnline}
                                         >
                                            <Power size={12} /> Reboot
                                         </button>
                                     </div>
                                     
                                     {/* View Snapshot Trigger */}
                                     {kiosk.snapshotUrl && (
                                         <div className="mt-4 pt-4 border-t border-slate-100">
                                            <button 
                                                onClick={() => setViewingSnapshot(kiosk.snapshotUrl!)}
                                                className="w-full text-xs text-blue-600 font-bold uppercase hover:underline flex items-center justify-center gap-1"
                                            >
                                                <Eye size={12} /> View Latest Snapshot
                                            </button>
                                            <div className="text-[9px] text-center text-slate-400 mt-1">
                                                Taken: {new Date(kiosk.last_seen).toLocaleTimeString()}
                                            </div>
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}

             {/* SETTINGS TAB */}
             {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                     <h3 className="text-xl font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Database size={24} /> System Management</h3>
                     <div className="space-y-4">
                         <button onClick={() => setShowSetup(true)} className="w-full p-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                             <Book size={20} /> Open Setup Guide
                         </button>
                         <button onClick={async () => {
                             if(confirm("Factory Reset? This wipes ALL data locally and pushes a clean slate to cloud.")) {
                                 const clean = await resetStoreData();
                                 handleSaveData(clean);
                                 alert("System Reset Complete.");
                             }
                         }} className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-bold uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2">
                             <AlertCircle size={20} /> Factory Reset Database
                         </button>
                     </div>
                </div>
             )}
         </main>
      </div>

      {editingProduct && (
        <ProductEditor 
           product={editingProduct} 
           onCancel={() => setEditingProduct(null)} 
           onSave={saveProduct} 
        />
      )}

      {showSetup && <SetupGuide onClose={() => setShowSetup(false)} />}
      
      {/* SNAPSHOT POPUP MODAL */}
      {viewingSnapshot && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingSnapshot(null)}>
              <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                  <div className="p-4 flex justify-between items-center border-b border-slate-800">
                      <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2"><Camera size={16} /> Remote Snapshot</h3>
                      <button onClick={() => setViewingSnapshot(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                  </div>
                  <div className="bg-black flex items-center justify-center min-h-[400px]">
                      <img src={viewingSnapshot} className="max-w-full max-h-[70vh] object-contain" alt="Snapshot" />
                  </div>
                  <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                      <a href={viewingSnapshot} download={`snapshot_${Date.now()}.jpg`} className="bg-blue-600 text-white px-4 py-2 rounded font-bold uppercase text-xs flex items-center gap-2 hover:bg-blue-700">
                          <Download size={14} /> Save Image
                      </a>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
