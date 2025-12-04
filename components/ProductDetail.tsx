

import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ChevronLeft, Info, Maximize2, Share2, PlayCircle, FileText, Check, Box as BoxIcon, ChevronRight as RightArrow, ChevronLeft as LeftArrow, X, Image as ImageIcon, MonitorPlay, MonitorStop, Tag, Layers, Ruler, FileText as FileIcon } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, screensaverEnabled, onToggleScreensaver }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'dimensions' | 'terms'>('features');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); 
  const [showEnlargedMedia, setShowEnlargedMedia] = useState(false);
  const [enlargedMediaIndex, setEnlargedMediaIndex] = useState(0);

  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    if (product.imageUrl) {
      media.push({ type: 'image', url: product.imageUrl });
    }
    product.galleryUrls?.forEach(url => {
      media.push({ type: 'image', url });
    });
    if (product.videoUrl) {
      media.push({ type: 'video', url: product.videoUrl });
    }
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

  const handleEnlargedPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const handleEnlargedNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handleEnlargeMedia = (index: number) => {
    setEnlargedMediaIndex(index);
    setShowEnlargedMedia(true);
  };

  const openManual = () => {
      if(product.manualUrl) {
          // Open PDF in new tab/window
          const pdfWindow = window.open("");
          if (pdfWindow) {
              pdfWindow.document.write(`<iframe width='100%' height='100%' src='${product.manualUrl}'></iframe>`);
              pdfWindow.document.title = `${product.name} - Manual`;
          }
      }
  };

  const currentMedia = allMedia[currentMediaIndex];
  const enlargedMedia = allMedia[enlargedMediaIndex];

  return (
    <div className="flex flex-col h-full bg-white relative animate-fade-in overflow-hidden">
      
      {/* ======================= */}
      {/* DESKTOP LAYOUT (Tablet+) */}
      {/* ======================= */}
      <div className="hidden lg:flex flex-1 flex-row h-full overflow-hidden">
        
        {/* LEFT COLUMN: Media Showcase */}
        <div className="w-[45%] bg-slate-900 flex flex-col overflow-hidden relative shrink-0">
          
          {/* Top Controls */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
             <button 
              onClick={onBack}
              className="flex items-center text-white/80 hover:text-white font-bold transition-colors uppercase text-[10px] tracking-widest bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
            >
              <ChevronLeft size={14} className="mr-1" /> Back
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

                  {/* Navigation Arrows on Stage */}
                  {allMedia.length > 1 && (
                     <>
                        <button onClick={handlePrevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm z-20 transition-all border border-white/10"><LeftArrow size={24} /></button>
                        <button onClick={handleNextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm z-20 transition-all border border-white/10"><RightArrow size={24} /></button>
                     </>
                  )}
                </div>
             ) : (
                 <div className="flex flex-col items-center justify-center text-slate-600">
                     <ImageIcon size={64} />
                     <span className="font-bold uppercase tracking-widest mt-2 text-xs">No Media</span>
                 </div>
             )}
          </div>
          
          {/* Thumbnails Strip */}
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
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
             <div className="p-8 lg:p-12">
                 {/* Title Header */}
                 <div className="mb-8 border-b border-slate-100 pb-8">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {product.sku && (
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">
                                    SKU: {product.sku}
                                </span>
                            )}
                        </div>
                        {product.manualUrl && (
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

                 {/* Information Tabs */}
                 <div className="flex flex-col gap-8">
                     {/* Features */}
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

                     {/* Specs Grid */}
                     <div className="grid grid-cols-2 gap-4">
                        {Object.entries(product.specs).map(([key, value], idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{key}</span>
                                <span className="block text-sm font-bold text-slate-900">{value}</span>
                            </div>
                        ))}
                     </div>

                     {/* Terms Section (Desktop) */}
                     {product.terms && (
                         <div className="bg-white rounded-2xl p-6 border border-slate-200 mt-4">
                             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={16} /> Warranty & Terms</h3>
                             <p className="text-xs text-slate-500 font-mono leading-relaxed whitespace-pre-wrap">{product.terms}</p>
                         </div>
                     )}
                 </div>
             </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80 backdrop-blur shrink-0 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Consult Staff for Availability</span>
              <button 
                onClick={onBack}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors"
              >
                  Close View
              </button>
          </div>
        </div>
      </div>

      {/* ======================= */}
      {/* MOBILE LAYOUT (App-like) */}
      {/* ======================= */}
      <div className="lg:hidden flex flex-col h-full bg-slate-100 relative overflow-hidden">
        
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-30 pointer-events-none">
           <button 
             onClick={onBack} 
             className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 hover:bg-white active:scale-95 transition-all"
           >
             <ChevronLeft size={24} />
           </button>

           <button 
             onClick={onToggleScreensaver} 
             className={`pointer-events-auto w-10 h-10 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all ${screensaverEnabled ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white/80'}`}
           >
             {screensaverEnabled ? <MonitorPlay size={20} /> : <MonitorStop size={20} />}
           </button>
        </div>

        {/* Top: Image Carousel */}
        <div className="w-full h-[45vh] bg-white relative shrink-0 group">
           {currentMedia ? (
             currentMedia.type === 'image' ? (
                <img 
                  src={currentMedia.url} 
                  className="w-full h-full object-contain p-6" 
                  alt={product.name}
                  onClick={() => handleEnlargeMedia(currentMediaIndex)}
                />
             ) : (
                <video src={currentMedia.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
             )
           ) : (
             <div className="w-full h-full flex items-center justify-center text-slate-300">
               <ImageIcon size={48} />
             </div>
           )}

           {/* Carousel Indicators */}
           {allMedia.length > 1 && (
             <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 z-20">
               {allMedia.map((_, i) => (
                 <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentMediaIndex ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'}`} />
               ))}
             </div>
           )}

           {/* Carousel Arrows */}
           {allMedia.length > 1 && (
             <>
               <button 
                 onClick={handlePrevMedia} 
                 className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-slate-800 p-2 rounded-full transition-all z-20 border border-white/10 shadow-lg active:scale-95"
                 aria-label="Previous Image"
               >
                 <LeftArrow size={24} />
               </button>
               <button 
                 onClick={handleNextMedia} 
                 className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-slate-800 p-2 rounded-full transition-all z-20 border border-white/10 shadow-lg active:scale-95"
                 aria-label="Next Image"
               >
                 <RightArrow size={24} />
               </button>
             </>
           )}
        </div>

        {/* Bottom: Sliding Content Sheet */}
        <div className="flex-1 bg-white rounded-t-[2rem] -mt-6 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-20">
                {/* Drag Handle Visual */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>

                {/* Header Info */}
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-2">
                        {product.sku && (
                           <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                              SKU: {product.sku}
                           </span>
                        )}
                        {product.manualUrl && (
                            <button onClick={openManual} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                                <FileIcon size={12} /> Manual
                            </button>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight mb-2">
                       {product.name}
                    </h1>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                       {product.description}
                    </p>
                </div>

                {/* Specs List */}
                <div className="space-y-6">
                    {product.features.length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Check size={14} className="text-green-500" /> Key Features
                            </h3>
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

                    {Object.keys(product.specs).length > 0 && (
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Layers size={14} className="text-blue-500" /> Specifications
                            </h3>
                            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                                {Object.entries(product.specs).map(([k, v], i) => (
                                    <div key={k} className="flex justify-between items-center p-3 border-b border-slate-200 last:border-0 text-xs">
                                        <span className="font-bold text-slate-400 uppercase">{k}</span>
                                        <span className="font-bold text-slate-900">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                           <Ruler size={14} className="text-orange-500" /> Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Height</span>
                                <span className="block text-sm font-black text-slate-900">{product.dimensions.height || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Width</span>
                                <span className="block text-sm font-black text-slate-900">{product.dimensions.width || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Depth</span>
                                <span className="block text-sm font-black text-slate-900">{product.dimensions.depth || '-'}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Weight</span>
                                <span className="block text-sm font-black text-slate-900">{product.dimensions.weight || '-'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Terms & Conditions (Mobile) */}
                    {product.terms && (
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Info size={14} className="text-slate-500" /> Warranty & Terms
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 font-mono leading-relaxed">{product.terms}</p>
                            </div>
                        </div>
                    )}

                    {/* Tiny Video Preview at Bottom */}
                    {product.videoUrl && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <PlayCircle size={14} className="text-purple-600" /> Product Video
                            </h3>
                            <button 
                                onClick={() => {
                                    // Find video in media list to open modal
                                    const vidIdx = allMedia.findIndex(m => m.type === 'video');
                                    if(vidIdx !== -1) handleEnlargeMedia(vidIdx);
                                }}
                                className="relative w-32 aspect-video rounded-lg overflow-hidden shadow-md border border-slate-200 group bg-black"
                            >
                                <video src={product.videoUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                                    <PlayCircle size={24} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Enlarged Media Modal */}
      {showEnlargedMedia && enlargedMedia && (
        <div className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowEnlargedMedia(false)}>
          <button 
            onClick={() => setShowEnlargedMedia(false)} 
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50 backdrop-blur-md"
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {enlargedMedia.type === 'image' ? (
                <img 
                  src={enlargedMedia.url} 
                  alt={`Enlarged view`} 
                  className="max-w-full max-h-full object-contain" 
                />
            ) : (
                <video 
                  src={enlargedMedia.url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-full object-contain" 
                />
            )}

            {allMedia.length > 1 && (
              <>
                <button 
                  onClick={handleEnlargedPrev} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-4 rounded-full transition-colors z-20 backdrop-blur-md border border-white/10"
                >
                  <LeftArrow size={32} />
                </button>
                <button 
                  onClick={handleEnlargedNext} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 text-white p-4 rounded-full transition-colors z-20 backdrop-blur-md border border-white/10"
                >
                  <RightArrow size={32} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;