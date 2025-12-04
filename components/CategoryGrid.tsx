
import React from 'react';
import { Brand, Category, Catalogue } from '../types';
import { Smartphone, Laptop, Watch, Headphones, Monitor, Tablet, Box, ChevronLeft, ArrowRight, BookOpen, MonitorPlay, MonitorStop } from 'lucide-react';

interface CategoryGridProps {
  brand: Brand;
  storeCatalogs?: Catalogue[]; 
  onSelectCategory: (category: Category) => void;
  onViewCatalog?: (pages: string[]) => void; 
  onBack: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const IconMap: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Laptop': <Laptop className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Watch': <Watch className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Headphones': <Headphones className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Monitor': <Monitor className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Tablet': <Tablet className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />,
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ brand, storeCatalogs, onSelectCategory, onViewCatalog, onBack, screensaverEnabled, onToggleScreensaver }) => {
  
  // Filter catalogs for this brand
  const brandCatalogs = storeCatalogs?.filter(c => c.brandId === brand.id).sort((a, b) => {
      if (a.year && b.year && a.year !== b.year) return b.year - a.year; // Recent first
      return 0;
  }) || [];

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6 shadow-sm flex items-center justify-between shrink-0 relative z-50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
                onClick={onBack}
                className="flex items-center text-slate-500 hover:text-slate-800 font-bold transition-colors text-xs uppercase tracking-wide bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
            >
                <ChevronLeft size={16} className="mr-1" /> Back to Brands
            </button>
            <button 
                onClick={onToggleScreensaver}
                className={`p-1.5 rounded-lg border transition-colors ${screensaverEnabled ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                title="Toggle Screensaver"
            >
                {screensaverEnabled ? <MonitorPlay size={16} /> : <MonitorStop size={16} />}
            </button>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mt-2">{brand.name}</h1>
        </div>
        <div className="hidden md:block">
           <div className="bg-white border border-slate-200 rounded-xl w-20 h-20 flex items-center justify-center p-2 shadow-sm">
             {brand.logoUrl ? (
                 <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
             ) : (
                 <span className="text-2xl font-black text-slate-300">{brand.name.charAt(0)}</span>
             )}
           </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
        
        {/* Categories Grid - Minimum 2 Columns on Mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {brand.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-500 transition-all duration-300 p-4 md:p-8 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden aspect-[4/5] md:aspect-square"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              
              <div className="text-slate-400 bg-slate-50 p-4 md:p-6 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 shrink-0 border border-slate-100 group-hover:border-blue-100">
                {IconMap[category.name] || <Box className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />}
              </div>
              
              <div className="w-full">
                <h3 className="text-sm md:text-xl font-black text-slate-900 group-hover:text-blue-900 transition-colors truncate w-full uppercase tracking-tight">{category.name}</h3>
                <p className="text-slate-400 mt-1 text-[10px] md:text-xs font-bold uppercase tracking-widest">{category.products.length} Models</p>
              </div>

              <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 hidden md:block">
                 <span className="flex items-center text-blue-600 text-xs font-black uppercase tracking-wider">
                    Explore <ArrowRight size={14} className="ml-1" />
                 </span>
              </div>
            </button>
          ))}
        </div>

        {/* Brand Catalogs Section (Specific Pamphlets) - Pushed to Bottom */}
        {brandCatalogs.length > 0 && onViewCatalog && (
            <div className="mt-auto border-t-2 border-slate-200 pt-8 bg-slate-100/50 p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><BookOpen size={20} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{brand.name} Pamphlets</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Promotional Materials & Lookbooks</p>
                    </div>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                    {brandCatalogs.map((catalog, idx) => (
                        <button 
                            key={catalog.id} 
                            onClick={() => onViewCatalog(catalog.pages)} 
                            className="w-48 md:w-56 aspect-[2/3] bg-white shadow-lg hover:shadow-2xl rounded-xl border border-slate-200 shrink-0 transition-transform transform hover:-translate-y-2 overflow-hidden relative group perspective-1000"
                        >
                            {catalog.pages[0] ? (
                                <img 
                                  src={catalog.pages[0]} 
                                  className="w-full h-full object-cover" 
                                  alt={catalog.title} 
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <BookOpen size={40} />
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <span className="text-white text-sm font-bold leading-tight">{catalog.title}</span>
                                {catalog.year && <span className="text-blue-300 text-xs font-mono mt-1">{catalog.year}</span>}
                                <span className="mt-2 text-[10px] uppercase font-black tracking-widest text-white/80 border border-white/30 rounded px-2 py-1 bg-black/50 w-fit">Tap to View</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default CategoryGrid;
