
import React, { useMemo } from 'react';
import { Brand, Category, Catalogue } from '../types';
import { Smartphone, Laptop, Watch, Headphones, Monitor, Tablet, Box, ChevronLeft, ArrowRight, BookOpen } from 'lucide-react';

interface CategoryGridProps {
  brand: Brand;
  storeCatalogs: Catalogue[]; // Received from KioskApp
  onSelectCategory: (category: Category) => void;
  onBack: () => void;
  onViewCatalog: (pages: string[]) => void;
}

const IconMap: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Laptop': <Laptop className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Watch': <Watch className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Headphones': <Headphones className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Monitor': <Monitor className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Tablet': <Tablet className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ brand, storeCatalogs, onSelectCategory, onBack, onViewCatalog }) => {
  
  // Filter catalogs for this brand
  const brandCatalogs = useMemo(() => {
      return storeCatalogs
          .filter(c => c.brandId === brand.id)
          .sort((a, b) => { 
              if (a.year && b.year && a.year !== b.year) return b.year - a.year; // Descending
              if (a.month && b.month) return b.month - a.month;
              return 0;
          });
  }, [storeCatalogs, brand.id]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header with High Z-Index for Back Button */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-8 shadow-sm flex items-center justify-between shrink-0 relative z-30">
        <div>
          <button 
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="flex items-center text-slate-500 hover:text-slate-900 font-bold mb-2 transition-colors text-xs md:text-sm uppercase tracking-wide px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft size={20} className="mr-1" /> Back to Brands
          </button>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">{brand.name}</h1>
        </div>
        <div className="hidden md:block">
           <div className="bg-slate-100 text-slate-900 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
             {brand.name.charAt(0)}
           </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-12 relative z-10">
        
        {/* Categories Grid - 2 cols on mobile for better fit */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-12">
          {brand.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-500 transition-all duration-300 p-3 md:p-8 flex flex-col items-center justify-center text-center gap-2 md:gap-6 h-36 md:h-72 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="text-slate-700 bg-slate-50 p-3 md:p-6 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 shrink-0">
                {IconMap[category.name] || <Box className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />}
              </div>
              
              <div className="w-full">
                <h3 className="text-xs md:text-2xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate w-full leading-tight px-1">{category.name}</h3>
                <p className="text-slate-500 mt-1 md:mt-2 text-[10px] md:text-sm font-medium hidden md:block">{category.products.length} Models</p>
              </div>

              {/* View Arrow */}
              <div className="hidden md:block absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                 <span className="flex items-center text-blue-600 text-sm font-bold uppercase tracking-wider">
                    View <ArrowRight size={16} className="ml-1" />
                 </span>
              </div>
            </button>
          ))}
        </div>

        {/* Brand Catalogues Strip (At Bottom of Brand Page) */}
        {brandCatalogs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-500" /> {brand.name} Catalogues
                </h3>
                <div className="flex gap-4 overflow-x-auto w-full items-center no-scrollbar snap-x snap-mandatory py-4 px-1">
                    {brandCatalogs.map((catalog, idx) => (
                        <button 
                            key={catalog.id} 
                            onClick={() => onViewCatalog(catalog.pages)} 
                            className="h-40 md:h-52 aspect-[2/3] bg-white shadow-md hover:shadow-xl rounded-lg border border-slate-200 shrink-0 transition-transform transform active:scale-95 overflow-hidden relative snap-center group"
                        >
                            <img 
                              src={catalog.pages[0]} 
                              className="w-full h-full object-cover" 
                              alt={`${catalog.title} Cover`} 
                            />
                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                                <span className="text-white text-xs md:text-sm font-bold leading-tight line-clamp-3 mb-1">{catalog.title}</span>
                                {catalog.year && <span className="text-yellow-400 text-[10px] font-black">{catalog.year}</span>}
                            </div>
                            
                            {/* Page Count Badge */}
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                                {catalog.pages.length} Pages
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
