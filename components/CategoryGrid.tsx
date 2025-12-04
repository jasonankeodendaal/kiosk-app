
import React from 'react';
import { Brand, Category } from '../types';
import { Smartphone, Laptop, Watch, Headphones, Monitor, Tablet, Box, ChevronLeft, ArrowRight } from 'lucide-react';

interface CategoryGridProps {
  brand: Brand;
  onSelectCategory: (category: Category) => void;
  onBack: () => void;
}

const IconMap: Record<string, React.ReactNode> = {
  'Smartphone': <Smartphone className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Laptop': <Laptop className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Watch': <Watch className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Headphones': <Headphones className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Monitor': <Monitor className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
  'Tablet': <Tablet className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />,
};

const CategoryGrid: React.FC<CategoryGridProps> = ({ brand, onSelectCategory, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 md:p-8 shadow-sm flex items-center justify-between shrink-0">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-500 hover:text-slate-800 font-semibold mb-2 transition-colors text-xs md:text-sm uppercase tracking-wide"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Brands
          </button>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">{brand.name}</h1>
        </div>
        <div className="hidden md:block">
           <div className="bg-slate-100 text-slate-900 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold">
             {brand.name.charAt(0)}
           </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-12">
        {/* UPDATED GRID: grid-cols-3 even on mobile, reduced gap on mobile */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {brand.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-blue-500 transition-all duration-300 p-3 md:p-8 flex flex-col items-center justify-center text-center gap-2 md:gap-6 h-32 md:h-72 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="text-slate-700 bg-slate-50 p-3 md:p-6 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300 shrink-0">
                {IconMap[category.name] || <Box className="w-8 h-8 md:w-14 md:h-14" strokeWidth={1.5} />}
              </div>
              
              <div className="w-full">
                <h3 className="text-[10px] md:text-2xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors truncate w-full leading-tight">{category.name}</h3>
                <p className="text-slate-500 mt-1 md:mt-2 text-[9px] md:text-sm font-medium hidden md:block">{category.products.length} Models</p>
              </div>

              {/* View Arrow - Hidden on Mobile to save space */}
              <div className="hidden md:block absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                 <span className="flex items-center text-blue-600 text-sm font-bold uppercase tracking-wider">
                    View <ArrowRight size={16} className="ml-1" />
                 </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
