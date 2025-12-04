import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ChevronLeft, Info, Maximize2, Share2, PlayCircle, FileText, Check, Box as BoxIcon, ChevronRight as RightArrow, ChevronLeft as LeftArrow, X, Image as ImageIcon } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'dimensions' | 'terms'>('features');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // For the main media carousel
  const [showEnlargedMedia, setShowEnlargedMedia] = useState(false);
  const [enlargedMediaIndex, setEnlargedMediaIndex] = useState(0);

  // Combine all media into a single array for the carousel
  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    if (product.imageUrl) {
      media.push({ type: 'image', url: product.imageUrl });
    }
    product.galleryUrls?.forEach(url => {
      media.push({ type: 'image', url });
    });
    // Add video last for a consistent image-first browsing experience, but still part of carousel
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

  const handleEnlargeMedia = (index: number) => {
    setEnlargedMediaIndex(index);
    setShowEnlargedMedia(true);
  };

  const handleEnlargedNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handleEnlargedPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnlargedMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const currentMedia = allMedia[currentMediaIndex];
  const enlargedMedia = allMedia[enlargedMediaIndex];

  return (
    <div className="flex flex-col h-full bg-white relative animate-fade-in overflow-hidden">
      
      {/* Main Layout: Always Flex Row (Side by Side) */}
      <div className="flex-1 flex flex-row h-full overflow-hidden">
        
        {/* Left Column: Media - Adjusted Width for Mobile (35%) vs Desktop (40-50%) */}
        <div className="w-[35%] lg:w-2/5 bg-slate-50/50 flex flex-col border-r border-slate-200 overflow-y-auto relative shrink-0">
          
          <div className="absolute top-2 left-2 z-20">
             <button 
              onClick={onBack}
              className="flex items-center text-slate-600 hover:text-slate-900 font-bold transition-colors uppercase text-[9px] lg:text-[10px] tracking-widest bg-white/90 backdrop-blur-md px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border border-slate-200 shadow-sm"
            >
              <ChevronLeft size={12} className="mr-0.5" /> Back
            </button>
          </div>

          {/* Media Carousel */}
          <div className="flex-1 flex items-center justify-center p-2 lg:p-12 relative">
             {allMedia.length > 0 ? (
                <div className="relative w-full max-w-[140px] md:max-w-xs aspect-square group">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-[60px] opacity-10 scale-75 group-hover:opacity-20 transition-opacity duration-700"></div>
                  
                  {currentMedia.type === 'image' ? (
                     <img 
                       src={currentMedia.url} 
                       alt={product.name} 
                       className="w-full h-full object-contain relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                       onClick={() => handleEnlargeMedia(currentMediaIndex)}
                     />
                  ) : (
                     <div className="relative w-full h-full flex items-center justify-center">
                       <video 
                         src={currentMedia.url} 
                         controls={false} // No controls for thumbnail preview
                         autoPlay 
                         loop 
                         muted 
                         className="w-full h-full object-contain relative z-10 drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                       />
                       <PlayCircle 
                         size={64} 
                         className="absolute text-white/80 transition-transform group-hover:scale-110 cursor-pointer" 
                         onClick={() => handleEnlargeMedia(currentMediaIndex)} // Click to play enlarged
                       />
                     </div>
                  )}

                  {/* Navigation Arrows */}
                  {allMedia.length > 1 && (
                     <>
                        <button 
                           onClick={handlePrevMedia} 
                           className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md text-slate-700 hover:bg-white transition-colors z-20"
                        >
                           <LeftArrow size={16} />
                        </button>
                        <button 
                           onClick={handleNextMedia} 
                           className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm p-2 rounded-full shadow-md text-slate-700 hover:bg-white transition-colors z-20"
                        >
                           <RightArrow size={16} />
                        </button>
                     </>
                  )}
                </div>
             ) : (
                 <div className="w-full max-w-[140px] md:max-w-xs aspect-square flex items-center justify-center bg-slate-100 rounded-lg text-slate-300">
                     <ImageIcon size={48} />
                 </div>
             )}
          </div>
          
          {/* Media Thumbnails for direct selection */}
          <div className="p-2 lg:p-8 bg-white border-t border-slate-100">
            {allMedia.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
                {allMedia.map((media, idx) => (
                   <button 
                      key={idx} 
                      onClick={() => setCurrentMediaIndex(idx)} 
                      className={`w-12 h-12 lg:w-20 lg:h-20 shrink-0 bg-white rounded-lg overflow-hidden shadow-sm p-1 transition-all ${idx === currentMediaIndex ? 'border-2 border-blue-500' : 'border border-slate-200 opacity-70 hover:opacity-100'}`}
                   >
                      {media.type === 'image' ? (
                         <img src={media.url} className="w-full h-full object-contain" alt={`Media ${idx}`} />
                      ) : (
                         <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                            <video src={media.url} className="w-full h-full object-cover opacity-60" muted />
                            <PlayCircle className="absolute text-white w-4 h-4 lg:w-6 lg:h-6" />
                         </div>
                      )}
                   </button>
                ))}
                </div>
            ) : (
                <div className="text-center text-slate-400 text-xs py-2">No additional media available.</div>
            )}
          </div>
        </div>

        {/* Right Column: Info & Specs - Adjusted Width (65% Mobile) */}
        <div className="w-[65%] lg:w-3/5 flex flex-col h-full bg-white relative overflow-hidden">
          {/* Header Info */}
          <div className="p-4 lg:p-8 border-b border-slate-100 shrink-0">
             <div className="flex items-center justify-between mb-1">
                <span className="text-blue-600 font-bold uppercase tracking-wider text-[9px] lg:text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {product.sku || 'N/A'}
                </span>
                <button className="text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
                  <Share2 size={16} />
                </button>
             </div>
             <h1 className="text-xl lg:text-3xl font-black text-slate-900 mb-2 tracking-tight leading-tight line-clamp-2">{product.name}</h1>
             <p className="text-xs lg:text-sm text-slate-500 leading-snug font-medium line-clamp-3">{product.description}</p>
          </div>

          {/* Compact Tabs */}
          <div className="flex border-b border-slate-100 px-4 lg:px-8 bg-slate-50/50 shrink-0 overflow-x-auto scrollbar-hide">
            {['features', 'specs', 'dimensions', 'terms'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 lg:py-3 px-3 lg:px-4 font-black text-[9px] lg:text-xs uppercase tracking-widest transition-all border-b-2 relative top-[1px] whitespace-nowrap ${
                  activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white">
            {activeTab === 'features' && (
              <div className="grid grid-cols-1 gap-2 lg:gap-3 animate-fade-in">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="bg-slate-50 p-2 lg:p-3 rounded-lg border border-slate-100 flex items-start gap-2 lg:gap-3">
                    <div className="mt-0.5 w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                       <Check size={8} className="text-blue-600 lg:hidden" />
                       <Check size={10} className="text-blue-600 hidden lg:block" />
                    </div>
                    <span className="text-slate-700 font-bold text-[10px] lg:text-xs leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[10px] lg:text-xs animate-fade-in">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specs).map(([key, value], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-2 lg:p-3 font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 w-1/3 break-words">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </td>
                        <td className="p-2 lg:p-3 font-bold text-slate-900">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'dimensions' && (
              <div className="animate-fade-in h-full flex flex-col">
                <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-6">
                  {Object.entries(product.dimensions).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 p-2 lg:p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase text-slate-400 mb-1">{key}</span>
                      <span className="text-sm lg:text-lg font-black text-slate-900 leading-none">{val}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 lg:p-8 min-h-[100px]">
                   <BoxIcon size={32} strokeWidth={1} className="mb-2 text-slate-300 lg:hidden" />
                   <BoxIcon size={48} strokeWidth={1} className="mb-2 text-slate-300 hidden lg:block" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-center">Scale Visualization</span>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
               <div className="animate-fade-in h-full">
                  <div className="bg-yellow-50/50 p-4 lg:p-6 rounded-xl border border-yellow-100 h-full overflow-y-auto">
                     <div className="flex items-center gap-2 text-yellow-700 mb-3 sticky top-0 bg-yellow-50/95 pb-2">
                        <FileText size={16} />
                        <h3 className="font-bold text-[10px] lg:text-xs uppercase tracking-wider">Terms & Conditions</h3>
                     </div>
                     <p className="text-slate-600 text-[10px] lg:text-xs leading-relaxed whitespace-pre-wrap font-mono text-justify">
                        {product.terms || "Standard warranty applies. Product specifications subject to change without notice. Usage implies acceptance of general store policy."}
                     </p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Media Modal */}
      {showEnlargedMedia && enlargedMedia && (
        <div className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowEnlargedMedia(false)}>
          <button 
            onClick={() => setShowEnlargedMedia(false)} 
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50"
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {enlargedMedia.type === 'image' ? (
                <img 
                  src={enlargedMedia.url} 
                  alt={`Enlarged ${product.name}`} 
                  className="max-w-full max-h-full object-contain animate-fade-in" 
                />
            ) : (
                <video 
                  src={enlargedMedia.url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-full object-contain animate-fade-in" 
                />
            )}

            {allMedia.length > 1 && (
              <>
                <button 
                  onClick={handleEnlargedPrev} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg transition-colors z-20"
                >
                  <LeftArrow size={24} />
                </button>
                <button 
                  onClick={handleEnlargedNext} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full shadow-lg transition-colors z-20"
                >
                  <RightArrow size={24} />
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