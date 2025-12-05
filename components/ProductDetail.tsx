
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import Flipbook from './Flipbook';
import { ChevronLeft, Info, Maximize2, Share2, PlayCircle, FileText, Check, Box as BoxIcon, ChevronRight as RightArrow, ChevronLeft as LeftArrow, X, Image as ImageIcon, MonitorPlay, MonitorStop, Tag, Layers, Ruler, FileText as FileIcon, Package, LayoutGrid } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, screensaverEnabled, onToggleScreensaver }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
  const [showEnlargedMedia, setShowEnlargedMedia] = useState(false);
  const [enlargedMediaIndex, setEnlargedMediaIndex] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Helper to ensure dimensions is always an array
  const dimensionSets = useMemo(() => {
      if (Array.isArray(product.dimensions)) return product.dimensions;
      // Legacy support
      if (typeof product.dimensions === 'object') return [{ label: "Device", ...product.dimensions }];
      return [];
  }, [product.dimensions]);

  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    if (product.imageUrl) {
      media.push({ type: 'image', url: product.imageUrl });
    }
    product.galleryUrls?.forEach(url => {
      media.push({ type: 'image', url });
    });
    // Handle legacy single video
    if (product.videoUrl) {
      media.push({ type: 'video', url: product.videoUrl });
    }
    // Handle new multiple videos (avoid duplicates if migrated)
    product.videoUrls?.forEach(url => {
        if (url !== product.videoUrl) {
             media.push({ type: 'video', url });
        }
    });
    return media;
  }, [product]);

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };
  
  // Navigation for Enlarged View
  const handleNextEnlarged = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handlePrevEnlarged = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const handleEnlargeMedia = (index: number) => {
    setEnlargedMediaIndex(index);
    setShowEnlargedMedia(true);
  };

  const openManual = () => {
      if (product.manualImages && product.manualImages.length > 0) {
          setShowManual(true);
      } else if(product.manualUrl) {
          window.open(product.manualUrl, '_blank');
      }
  };

  const currentMedia = allMedia[currentMediaIndex];
  const enlargedMedia = allMedia[enlargedMediaIndex];

  return (
    <div className="flex flex-col h-full bg-white relative animate-fade-in overflow-hidden">
      
      {/* DESKTOP LAYOUT (Tablet+) */}
      <div className="hidden lg:flex flex-1 flex-row h-full overflow-hidden">
        
        {/* LEFT COLUMN: Media Showcase */}
        <div className="w-[45%] bg-slate-900 flex flex-col overflow-hidden relative shrink-0">
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
             <button 
              onClick={onBack}
              className="flex items-center text-white/80 hover:text-white font-bold transition-colors uppercase text-[10px] tracking-widest bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
            >
              <LeftArrow size={14} className="mr-1" /> Back
            </button>
          </div>
          
          <div className="absolute top-6 right-6 z-20">
             <button 
                onClick={onToggleScreensaver}
                className={`flex items-center justify-center w-8 h-8 rounded-full border shadow-sm backdrop-blur-md transition-colors ${screensaverEnabled ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-black/20 text-slate-400 border-white/10'}`}
                title="Toggle Screensaver"
            >
                {screensaverEnabled ? <MonitorPlay size={14} /> : <MonitorStop size={14} />}
            </button>
          </div>

          {/* Main Media Stage */}
          <div className="flex-1 flex items-center justify-center p-8 relative bg-gradient-to-b from-slate-800 to-slate-900">
             {allMedia.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  {currentMedia.type === 'image' ? (
                     <img 
                       src={currentMedia.url} 
                       alt={product.name} 
                       className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl cursor-pointer"
                       onClick={() => handleEnlargeMedia(currentMediaIndex)}
                     />
                  ) : (
                     <div className="relative w-full h-full flex items-center justify-center">
                       <video 
                         src={currentMedia.url} 
                         controls={false} 
                         autoPlay 
                         loop 
                         muted={false} 
                         className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl"
                       />
                       <PlayCircle 
                         size={64} 
                         className="absolute text-white/80 transition-transform group-hover:scale-110 cursor-pointer z-20 drop-shadow-lg" 
                         onClick={() => handleEnlargeMedia(currentMediaIndex)} 
                       />
                     </div>
                  )}

                  {allMedia.length > 1 && (
                     <>
                        <button onClick={handlePrevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm z-20 transition-all border border-white/10"><LeftArrow size={24} /></button>
                        <button onClick={handleNextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm z-20 transition-all border border-white/10"><RightArrow size={24} /></button>
                     </>
                  )}

                  {/* View All Grid Button */}
                  {allMedia.length > 0 && (
                      <button 
                          onClick={() => setShowGalleryModal(true)}
                          className="absolute bottom-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                          <LayoutGrid size={14} /> View Gallery ({allMedia.length})
                      </button>
                  )}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center text-slate-600">
                     <ImageIcon size={64} />
                     <span className="font-bold uppercase tracking-widest mt-2 text-xs">No Media</span>
                 </div>
             )}
          </div>
          
          {/* Thumbnails */}
          {allMedia.length > 1 && (
              <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
                {allMedia.map((media, idx) => (
                   <button 
                      key={idx} 
                      onClick={() => setCurrentMediaIndex(idx)} 
                      className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden shadow-sm transition-all relative ${idx === currentMediaIndex ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-50 hover:opacity-80'}`}
                   >
                      {media.type === 'image' ? (
                         <img src={media.url} className="w-full h-full object-cover" alt="" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center bg-slate-800">
                             <PlayCircle size={20} className="text-white" />
                         </div>
                      )}
                   </button>
                ))}
                </div>
              </div>
          )}
        </div>

        {/* RIGHT COLUMN: Info & Specs */}
        <div className="w-[55%] flex flex-col h-full bg-white relative overflow-hidden">
          <div className="flex-1 overflow-y-auto">
             <div className="p-8 lg:p-12">
                 <div className="mb-8 border-b border-slate-100 pb-8">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {product.sku && (
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">
                                    SKU: {product.sku}
                                </span>
                            )}
                        </div>
                        {(product.manualUrl || (product.manualImages && product.manualImages.length > 0)) && (
                            <button onClick={openManual} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors">
                                <FileIcon size={14} className="text-blue-500" /> User Manual
                            </button>
                        )}
                     </div>
                     <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tight leading-none">
                        {product.name}
                     </h1>
                     <div className="prose prose-lg text-slate-600 leading-relaxed font-medium">
                        <p>{product.description || "No specific description available."}</p>
                     </div>
                 </div>

                 <div className="flex flex-col gap-8">
                     <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={16} /> Key Features</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {product.features.length > 0 ? product.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <span className="text-slate-700 font-bold text-sm">{feature}</span>
                                </div>
                            )) : <div className="text-slate-400 italic text-sm">No features listed.</div>}
                        </div>
                     </div>

                     {product.boxContents && product.boxContents.length > 0 && (
                         <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100">
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={16} className="text-orange-500" /> What's in the Box</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {product.boxContents.map((item, idx) => (
                                     <div key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                         <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                         {item}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}

                     <div className="grid grid-cols-2 gap-4">
                        {Object.entries(product.specs).map(([key, value], idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{key}</span>
                                <span className="block text-sm font-bold text-slate-900">{value}</span>
                            </div>
                        ))}
                     </div>

                     {/* Multiple Dimensions Grid */}
                     {dimensionSets.length > 0 && (
                        <div>
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Ruler size={16} /> Dimensions</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dimensionSets.map((dims, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">{dims.label || `Set ${i+1}`}</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div><span className="text-slate-400 text-[10px] uppercase font-bold mr-1">H:</span><span className="font-bold">{dims.height}</span></div>
                                            <div><span className="text-slate-400 text-[10px] uppercase font-bold mr-1">W:</span><span className="font-bold">{dims.width}</span></div>
                                            <div><span className="text-slate-400 text-[10px] uppercase font-bold mr-1">D:</span><span className="font-bold">{dims.depth}</span></div>
                                            <div><span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Wt:</span><span className="font-bold">{dims.weight}</span></div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                     )}

                     {product.terms && (
                         <div className="bg-white rounded-2xl p-6 border border-slate-200 mt-4">
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={16} /> Warranty & Terms</h3>
                             <p className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">{product.terms}</p>
                         </div>
                     )}
                 </div>
             </div>
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur shrink-0 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Consult Staff for Availability</span>
              <button onClick={onBack} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors">Close View</button>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT (App-like) */}
      <div className="lg:hidden flex flex-col h-full bg-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30 pointer-events-none">
           <button onClick={onBack} className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 hover:bg-white active:scale-95 transition-all">
             <LeftArrow size={24} />
           </button>
           <button onClick={onToggleScreensaver} className={`pointer-events-auto w-10 h-10 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all ${screensaverEnabled ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white/80'}`}>
             {screensaverEnabled ? <MonitorPlay size={20} /> : <MonitorStop size={20} />}
           </button>
        </div>

        <div className="w-full h-[45vh] bg-white relative shrink-0 group">
           {currentMedia ? (
             currentMedia.type === 'image' ? (
                <img src={currentMedia.url} className="w-full h-full object-contain p-6" alt={product.name} onClick={() => handleEnlargeMedia(currentMediaIndex)} />
             ) : (
                <video src={currentMedia.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
             )
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48} /></div>
           )}

           {/* Mobile View Gallery Button */}
           {allMedia.length > 0 && (
               <button 
                  onClick={() => setShowGalleryModal(true)}
                  className="absolute bottom-4 right-4 z-30 bg-black/50 text-white px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] font-bold uppercase flex items-center gap-1.5 shadow-sm border border-white/10"
               >
                   <LayoutGrid size={12} /> Gallery
               </button>
           )}

           {/* Mobile Arrows */}
           {allMedia.length > 1 && (
             <>
                 <button onClick={handlePrevMedia} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 text-slate-900 p-2 rounded-full shadow-lg z-30 active:scale-95 transition-transform border border-slate-100">
                     <LeftArrow size={20} />
                 </button>
                 <button onClick={handleNextMedia} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 text-slate-900 p-2 rounded-full shadow-lg z-30 active:scale-95 transition-transform border border-slate-100">
                     <RightArrow size={20} />
                 </button>
                 
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                   {allMedia.map((_, i) => (
                     <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentMediaIndex ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'}`} />
                   ))}
                 </div>
             </>
           )}
        </div>

        <div className="flex-1 bg-white rounded-t-[2rem] -mt-6 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-20 touch-pan-y">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                        {product.sku && <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">SKU: {product.sku}</span>}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-2">{product.name}</h1>
                </div>
                <div className="mb-8">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{product.description}</p>
                </div>

                <div className="space-y-6">
                    {product.features.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Check size={14} className="text-green-500" /> Key Features</h3>
                            <ul className="space-y-2">
                               {product.features.map((f, i) => (
                                   <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                       <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                                       <span className="leading-relaxed">{f}</span>
                                   </li>
                               ))}
                            </ul>
                        </div>
                    )}
                    
                    {dimensionSets.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2"><Ruler size={14} className="text-orange-500" /> Dimensions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {dimensionSets.map((dims, i) => (
                                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">{dims.label || `Set ${i+1}`}</div>
                                        <div className="grid grid-cols-4 gap-2 text-center">
                                            <div><span className="block text-[8px] text-slate-400 font-bold">H</span><span className="block text-xs font-black">{dims.height || '-'}</span></div>
                                            <div><span className="block text-[8px] text-slate-400 font-bold">W</span><span className="block text-xs font-black">{dims.width || '-'}</span></div>
                                            <div><span className="block text-[8px] text-slate-400 font-bold">D</span><span className="block text-xs font-black">{dims.depth || '-'}</span></div>
                                            <div><span className="block text-[8px] text-slate-400 font-bold">Wt</span><span className="block text-xs font-black">{dims.weight || '-'}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {showEnlargedMedia && enlargedMedia && (
        <div className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEnlargedMedia(false)}>
          <button onClick={() => setShowEnlargedMedia(false)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50 backdrop-blur-md"><X size={32} /></button>
          
          {/* Navigation Arrows for Enlarged View */}
          {allMedia.length > 1 && (
            <>
               <button onClick={handlePrevEnlarged} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hover:bg-white/10 rounded-full transition-all z-50">
                   <LeftArrow size={48} />
               </button>
               <button onClick={handleNextEnlarged} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-4 hover:bg-white/10 rounded-full transition-all z-50">
                   <RightArrow size={48} />
               </button>
            </>
          )}

          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {enlargedMedia.type === 'image' ? <img src={enlargedMedia.url} className="max-w-full max-h-full object-contain" /> : <video src={enlargedMedia.url} controls autoPlay className="max-w-full max-h-full object-contain" />}
            
            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md text-xs font-bold uppercase tracking-widest border border-white/10">
               {enlargedMediaIndex + 1} / {allMedia.length}
            </div>
          </div>
        </div>
      )}

      {/* GALLERY GRID MODAL - FOR VIEWING ALL MEDIA AT ONCE */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[105] bg-slate-900/95 backdrop-blur-md p-4 md:p-12 animate-fade-in flex flex-col">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                   <LayoutGrid className="text-blue-500" /> Media Gallery
                </h2>
                <button 
                  onClick={() => setShowGalleryModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                >
                   <X size={24} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {allMedia.map((media, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                          setCurrentMediaIndex(idx);
                          setEnlargedMediaIndex(idx); // Also set enlarged so if they click, it opens correct one
                          setShowGalleryModal(false);
                          setShowEnlargedMedia(true); // Open enlarged view immediately from grid
                      }}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentMediaIndex === idx ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-700 hover:border-slate-500'}`}
                    >
                      {media.type === 'image' ? (
                          <img 
                            src={media.url} 
                            alt={`Gallery ${idx}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                      ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                              <video src={media.url} className="w-full h-full object-cover opacity-60" muted />
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <PlayCircle size={32} className="text-white drop-shadow-lg" />
                              </div>
                          </div>
                      )}
                      
                      {/* Number Badge */}
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md">
                          {idx + 1}
                      </div>
                    </button>
                  ))}
               </div>
            </div>
        </div>
      )}

      {showManual && (
          <Flipbook pages={product.manualImages || []} onClose={() => setShowManual(false)} catalogueTitle={`${product.name} - User Manual`}/>
      )}
    </div>
  );
};

export default ProductDetail;
