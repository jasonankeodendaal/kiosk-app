import React from 'react';
import { Category, Product } from '../types';
import { ChevronLeft, ArrowRight } from 'lucide-react';

interface ProductListProps {
  category: Category;
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ category, onSelectProduct, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{category.name}</h2>
            <p className="text-sm text-slate-500">Browse available models</p>
          </div>
        </div>
        <div className="text-slate-400 text-sm font-medium hidden sm:block">
          Showing {category.products.length} results
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/50">
        {/* UPDATED GRID: 3 cols on mobile, 5 on desktop (md+) */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pb-12">
          {category.products.map((product) => (
            <button
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className="group bg-white rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col text-left h-full"
            >
              {/* Image Container - Reduced padding for tighter fit */}
              <div className="aspect-square bg-white border-b border-slate-50 p-2 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1 right-1 z-10">
                   {product.specs['battery'] && (
                     <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                       Eco
                     </span>
                   )}
                </div>
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              
              {/* Content - Compact */}
              <div className="p-2 flex flex-col flex-1">
                <div className="flex-1">
                  <h3 className="text-xs md:text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  {/* Very compact description */}
                  <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed mb-1 hidden sm:block">
                    {product.description}
                  </p>
                  
                  {/* Quick Specs - Very compact */}
                  <div className="flex flex-wrap gap-1 mb-1">
                    {product.specs['processor'] && (
                      <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1 py-0.5 rounded truncate max-w-full">
                        {product.specs['processor']}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                    View
                  </div>
                  <div className="bg-slate-100 text-slate-400 p-1 rounded-full group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
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