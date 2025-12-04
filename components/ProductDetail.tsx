
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ChevronLeft, Share2, PlayCircle, FileText, Check, ChevronRight as RightArrow, ChevronLeft as LeftArrow, X, Image as ImageIcon } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'dimensions' | 'terms'>('features');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showEnlargedMedia, setShowEnlargedMedia] = useState(false);

  // Combine media: Main Image -> Gallery Images -> Video (at end)
  const allMedia = useMemo(() => {
    const media: { type: 'image' | 'video', url: string }[] = [];
    if (product.imageUrl) media.push({ type: 'image', url: product.imageUrl });
    product.galleryUrls?.forEach(url => media.push({ type: 'image', url }));
    if (product.videoUrl) media.push({ type: 'video', url: product.videoUrl });
    return media;
  }, [product]);

  const currentMedia = allMedia[currentMediaIndex];

  const nextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const prevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  return (
    <div className="flex flex-col h-full bg-white relative animate-fade-in overflow-hidden">
      
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Left: Media Column */}
        <div className="w-full md:w-[45%] bg-slate-50/50 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 relative shrink-0 h-[40vh] md:h-full">
          
          {/* Back Button - Increased Z-Index and Size for Reliability */}
          <div className="absolute top-4 left-4 z-40 pointer-events-auto">
             <button 
              onClick={(e) => { e.stopPropagation(); onBack(); }}
              className="flex items-center text-slate-700 hover:text-white hover:bg-slate-900 font-bold transition-all uppercase text-xs tracking-widest bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-md active:scale-95"
            >
              <ChevronLeft size={16} className="mr-1" /> Back
            </button>
          </div>

          {/* Main Carousel View */}
          <div className="flex-1 flex items-center justify-center p-4 relative group overflow-hidden">
             {allMedia.length > 0 ? (
                <div className="relative w-full h-full max-h-[85%] flex items-center justify-center">
                  
                  {currentMedia.type === 'image' ? (
                     <img 
                       src={currentMedia.url} 
                       alt={product.name} 
                       className="max-w-full max-h-full object-contain drop-shadow-xl cursor-zoom-in"
                       onClick={() => setShowEnlargedMedia(true)}
                     />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-black/5 rounded-xl">
                       <video 
                         src={currentMedia.url} 
                         controls 
                         autoPlay 
                         muted
                         className="max-w-full max-h-full object-contain"
                       />
                     </div>
                  )}

                  {/* Arrows */}
                  {allMedia.length > 1 && (
                     <>
                        <button onClick={prevMedia} className="absolute left-2 bg-white/80 p-2 rounded-full shadow hover:bg-white z-30"><LeftArrow size={20} /></button>
                        <button onClick={nextMedia} className="absolute right-2 bg-white/80 p-2 rounded-full shadow hover:bg-white z-30"><RightArrow size={20} /></button>
                     </>
                  )}
                </div>
             ) : (
                 <ImageIcon size={64} className="text-slate-200" />
             )}
          </div>
          
          {/* Thumbnails Strip */}
          <div className="p-4 bg-white border-t border-slate-100 overflow-x-auto shrink-0 z-10">
             <div className="flex justify-center gap-2">
                {allMedia.map((media, idx) => (
                   <button 
                      key={idx} 
                      onClick={() => setCurrentMediaIndex(idx)} 
                      className={`w-12 h-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${idx === currentMediaIndex ? 'border-blue-500 opacity-100' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                   >
                      {media.type === 'image' ? (
                         <img src={media.url} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-slate-900 flex items-center justify-center"><PlayCircle size={16} className="text-white" /></div>
                      )}
                   </button>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Info Column */}
        <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
          <div className="p-6 md:p-10 border-b border-slate-100 shrink-0">
             <div className="flex items-center justify-between mb-2">
                <span className="text-blue-600 font-bold uppercase tracking-wider text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{product.sku || 'N/A'}</span>
                <Share2 size={18} className="text-slate-300" />
             </div>
             <h1 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">{product.name}</h1>
             <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium line-clamp-4">{product.description}</p>
          </div>

          <div className="flex border-b border-slate-100 px-6 md:px-10 bg-slate-50/50 shrink-0 gap-6 overflow-x-auto">
            {['features', 'specs', 'dimensions', 'terms'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
            {activeTab === 'features' && (
              <div className="grid grid-cols-1 gap-3 animate-fade-in">
                {product.features.map((feature, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 flex items-start gap-4">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><Check size={10} className="text-blue-600" /></div>
                    <span className="text-slate-700 font-bold text-xs md:text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'specs' && (
               <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs md:text-sm animate-fade-in">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specs).map(([key, value], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="p-3 font-bold text-slate-400 uppercase tracking-wider border-r border-slate-100 w-1/3">{key}</td>
                          <td className="p-3 font-bold text-slate-900">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            )}
            {activeTab === 'dimensions' && (
               <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  {Object.entries(product.dimensions).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                      <span className="text-xs font-black uppercase text-slate-400 mb-2 block">{key}</span>
                      <span className="text-xl md:text-2xl font-black text-slate-900">{val}</span>
                    </div>
                  ))}
               </div>
            )}
            {activeTab === 'terms' && (
               <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 animate-fade-in">
                  <div className="flex items-center gap-2 text-yellow-700 mb-4"><FileText size={18} /><h3 className="font-bold text-xs uppercase tracking-wider">Terms & Conditions</h3></div>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono">{product.terms || "Standard warranty applies."}</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showEnlargedMedia && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowEnlargedMedia(false)}>
           <img src={allMedia[currentMediaIndex].url} className="max-w-full max-h-full object-contain" />
           <button onClick={() => setShowEnlargedMedia(false)} className="absolute top-4 right-4 bg-white/10 p-2 rounded-full text-white"><X size={24} /></button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
