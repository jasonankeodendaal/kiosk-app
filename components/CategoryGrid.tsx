

import React, { useMemo, useState } from 'react';
import { Brand, Category, Catalogue, Pricelist } from '../types';
import { Smartphone, Laptop, Watch, Headphones, Monitor, Tablet, Box, ChevronLeft, ArrowRight, BookOpen, MonitorPlay, MonitorStop, Calendar, DollarSign, X, FileText } from 'lucide-react';
import { StoreData } from '../types'; // Import StoreData to access pricelists if passed down, or assume passed as prop

interface CategoryGridProps {
  brand: Brand;
  storeCatalogs?: Catalogue[]; 
  // We need to access pricelists from the main store data. 
  // Assuming they are passed or available. Let's add a prop for it or filter from a larger context.
  // For simplicity, let's assume we might need to pass all store data or specifically pricelists.
  // I'll add an optional pricelists prop.
  pricelists?: Pricelist[];
  onSelectCategory: (category: Category) => void;
  onViewCatalog?: (catalogue: Catalogue) => void; 
  onBack: () => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const IconMap: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Laptop': <Laptop className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Watch': <Watch className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Headphones': <Headphones className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Monitor': <Monitor className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
  'Tablet': <Tablet className="w-5 h-5 md:w-12 md:h-12" strokeWidth={1.5} />,
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ brand, storeCatalogs, pricelists, onSelectCategory, onViewCatalog, onBack, screensaverEnabled, onToggleScreensaver }) => {
  const [showPricelists, setShowPricelists] = useState(false);

  // Filter catalogs for this brand ONLY
  const brandCatalogs = storeCatalogs?.filter(c => c.brandId === brand.id).sort((a, b) => {
      if (a.year && b.year && a.year !== b.year) return b.year - a.year; // Recent first
      return 0;
  }) || [];

  // Filter pricelists for this brand
  const brandPricelists = pricelists?.filter(p => p.brandId === brand.id) || [];

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
        
        {/* Pricelist Button (Visible if brand has pricelists) */}
        {brandPricelists.length > 0 && (
            <div className="mb-6 flex justify-end">
                <button 
                    onClick={() => setShowPricelists(true)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition-all"
                >
                    <DollarSign size={16} /> View Pricelists ({brandPricelists.length})
                </button>
            </div>
        )}

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

      {/* Pricelist Modal */}
      {showPricelists && (
          <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPricelists(false)}>
              <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <div className="bg-green-100 text-green-600 p-2 rounded-lg"><DollarSign size={24} /></div>
                          <div>
                              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{brand.name} Pricelists</h2>
                              <p className="text-xs text-slate-500 font-bold uppercase">Official Pricing Documents</p>
                          </div>
                      </div>
                      <button onClick={() => setShowPricelists(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {brandPricelists.map((pl) => (
                              <a 
                                  key={pl.id}
                                  href={pl.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-green-400 transition-all group flex flex-col"
                              >
                                  <div className="flex items-start justify-between mb-4">
                                      <div className="bg-red-50 text-red-500 p-3 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                                          <FileText size={24} />
                                      </div>
                                      <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                          {pl.month} {pl.year}
                                      </div>
                                  </div>
                                  <h3 className="font-bold text-slate-900 text-sm uppercase mb-1">{pl.title}</h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-auto">Click to View PDF</p>
                              </a>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CategoryGrid;