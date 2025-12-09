



import React, { useMemo, useState } from 'react';
import { Brand, Category, Catalogue, Pricelist } from '../types';
import { Smartphone, Laptop, Watch, Headphones, Monitor, Tablet, Box, ChevronLeft, ArrowRight, BookOpen, MonitorPlay, MonitorStop, Calendar, DollarSign, X, FileText } from 'lucide-react';
import { StoreData } from '../types'; 

interface CategoryGridProps {
  brand: Brand;
  storeCatalogs?: Catalogue[]; 
  pricelists?: Pricelist[];
  onSelectCategory: (category: Category) => void;
  onViewCatalog?: (catalogue: Catalogue) => void; 
  onBack: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
  showScreensaverButton?: boolean;
}

const IconMap: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Laptop': <Laptop className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Watch': <Watch className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Headphones': <Headphones className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Monitor': <Monitor className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Tablet': <Tablet className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ brand, storeCatalogs, onSelectCategory, onViewCatalog, onBack, screensaverEnabled, onToggleScreensaver, showScreensaverButton = true }) => {
  // Filter catalogs for this brand ONLY
  const brandCatalogs = storeCatalogs?.filter(c => c.brandId === brand.id).sort((a, b) => {
      if (a.year && b.year && a.year !== b.year) return b.year - a.year; // Recent first
      return 0;
  }) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Sort categories alphabetically
  const sortedCategories = useMemo(() => {
    return [...brand.categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [brand.categories]);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in relative">
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
            {showScreensaverButton && (
                <button 
                    onClick={onToggleScreensaver}
                    className={`p-1.5 rounded-lg border transition-colors ${screensaverEnabled ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                    title="Toggle Screensaver"
                >
                    {screensaverEnabled ? <MonitorPlay size={16} /> : <MonitorStop size={16} />}
                </button>
            )}
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
        
        {/* Categories Grid - Smaller on Mobile (4 columns) */}
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-6 mb-12">
          {sortedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-500 transition-all duration-300 p-2 md:p-6 flex flex-col items-center justify-center text-center gap-1 md:gap-4 relative overflow-hidden aspect-square"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              
              <div className="text-slate-400 bg-slate-50 p-2 md:p-5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 shrink-0 border border-slate-100 group-hover:border-blue-100">
                {IconMap[category.name] || <Box className="w-4 h-4 md:w-10 md:h-10" strokeWidth={1.5} />}
              </div>
              
              <div className="w-full">
                <h3 className="text-[8px] md:text-lg font-black text-slate-900 group-hover:text-blue-900 transition-colors truncate w-full uppercase tracking-tight leading-tight">
                    {category.name}
                </h3>
                <p className="text-slate-400 mt-0.5 text-[7px] md:text-xs font-bold uppercase tracking-widest hidden sm:block">{category.products.length} Models</p>
              </div>
            </button>
          ))}
        </div>

        {/* Brand Catalogs Section - STICKY TO BOTTOM OF CONTENT IF FEW CATEGORIES */}
        {brandCatalogs.length > 0 && onViewCatalog && (
            <div className="mt-auto border-t-2 border-slate-200 pt-8 bg-slate-100/50 p-4 md:p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm"><BookOpen size={20} /></div>
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{brand.name} Catalogues</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Brand Specific Brochures</p>
                    </div>
                </div>
                
                <div className="flex gap-4 md:gap-8 overflow-x-auto pb-4 no-scrollbar items-start">
                    {brandCatalogs.map((catalog, idx) => (
                        <div key={catalog.id} className="flex flex-col gap-2 group w-20 md:w-48 shrink-0">
                            {/* Thumbnail Container */}
                            <button 
                                onClick={() => onViewCatalog(catalog)} 
                                className="w-full aspect-[2/3] bg-white shadow-md group-hover:shadow-xl rounded-lg border border-slate-200 transition-transform transform group-hover:-translate-y-1 overflow-hidden relative"
                            >
                                {catalog.thumbnailUrl || (catalog.pages && catalog.pages[0]) ? (
                                    <img 
                                      src={catalog.thumbnailUrl || catalog.pages[0]} 
                                      className="w-full h-full object-cover" 
                                      alt={catalog.title} 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-black/60 text-white text-[6px] md:text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                   OPEN
                                </div>
                                {catalog.pdfUrl && <div className="absolute top-1 right-1 bg-red-500 text-white text-[6px] font-bold px-1 py-0.5 rounded">PDF</div>}
                            </button>
                            
                            {/* Info Section */}
                            <div className="flex flex-col">
                                <h4 className="text-[8px] md:text-xs font-black text-slate-800 uppercase leading-tight line-clamp-2 group-hover:text-blue-700 transition-colors">
                                    {catalog.title}
                                </h4>
                                {(catalog.startDate || catalog.year) && (
                                    <div className="flex items-center gap-1 text-[7px] md:text-[9px] text-slate-500 font-bold mt-1">
                                        <Calendar size={8} className="md:w-3 md:h-3" />
                                        <span>
                                            {catalog.year ? catalog.year : ''} 
                                            {catalog.year && catalog.startDate ? ' • ' : ''}
                                            {catalog.startDate ? formatDate(catalog.startDate) : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CategoryGrid;