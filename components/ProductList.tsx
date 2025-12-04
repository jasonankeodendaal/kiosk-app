
import React from 'react';
import { Category, Product, Brand, Catalogue } from '../types';
import { ChevronLeft, ArrowRight, MonitorPlay, MonitorStop } from 'lucide-react';

interface ProductListProps {
  category: Category;
  brand: Brand;
  storeCatalogs: Catalogue[];
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
  onViewCatalog: (pages: string[]) => void;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ category, onSelectProduct, onBack, screensaverEnabled, onToggleScreensaver }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-6 shadow-sm sticky top-0 z-40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700 shadow-sm"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={onToggleScreensaver}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shadow-sm border ${screensaverEnabled ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                title="Toggle Screensaver"
            >
                {screensaverEnabled ? <MonitorPlay size={20} /> : <MonitorStop size={20} />}
            </button>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{category.name}</h2>
            <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wide">Available Models</p>
          </div>
        </div>
        <div className="bg-slate-100 px-3 py-1 rounded-full text-slate-500 text-xs font-bold hidden sm:block">
          {category.products.length} Results
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        {/* Responsive Grid: 2 cols mobile, 3 tablet, 5 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 pb-12">
          {category.products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-400 flex flex-col text-left h-full"
            >
              {/* Image Container */}
              <div className="aspect-square bg-white border-b border-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                   {product.specs['battery'] && (
                     <span className="bg-green-100 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Eco</span>
                   )}
                </div>
                {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">No Image</div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-3 md:p-4 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-xs md:text-sm font-black text-slate-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight uppercase">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(product.specs).slice(0, 2).map(([key, val]) => (
                      <span key={key} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded truncate max-w-full uppercase">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Details</span>
                  <div className="bg-slate-50 text-slate-400 p-1.5 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
