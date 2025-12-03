import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FlipbookProps {
  pages: string[];
  onClose: () => void;
}

const Flipbook: React.FC<FlipbookProps> = ({ pages, onClose }) => {
  // Current index refers to the page displayed on the RIGHT side.
  // 0 means cover (single page on right).
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalPages = pages.length;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex + 2 < totalPages + 1) {
      setCurrentIndex(currentIndex + 2);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex - 2 >= 0) {
      setCurrentIndex(currentIndex - 2);
    }
  };

  // Logic to determine which images to show
  // Index 0: Show nothing on left, Page 0 on right
  // Index 2: Show Page 1 on left, Page 2 on right
  const leftPageIdx = currentIndex - 1;
  const rightPageIdx = currentIndex;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-fade-in" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-6xl aspect-[3/2] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        
        {/* Previous Button */}
        <button 
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 bg-white text-slate-900 p-2 md:p-4 rounded-full shadow-xl disabled:opacity-0 transition-opacity hover:bg-blue-50 z-20"
        >
            <ChevronLeft size={32} />
        </button>

        {/* The Book */}
        <div className="flex w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden relative">
            {/* Spine Shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/20 to-transparent z-10 pointer-events-none"></div>

            {/* Left Page */}
            <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center border-r border-slate-200">
                {leftPageIdx >= 0 && pages[leftPageIdx] ? (
                    <img 
                        src={pages[leftPageIdx]} 
                        alt={`Page ${leftPageIdx + 1}`} 
                        className="w-full h-full object-contain"
                    />
                ) : (
                   <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">
                       Inside Cover
                   </div>
                )}
                {/* Page Number */}
                {leftPageIdx >= 0 && (
                    <div className="absolute bottom-4 left-6 text-slate-400 font-mono text-xs">{leftPageIdx + 1}</div>
                )}
            </div>

            {/* Right Page */}
            <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center">
                {rightPageIdx < totalPages ? (
                    <img 
                        src={pages[rightPageIdx]} 
                        alt={`Page ${rightPageIdx + 1}`} 
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest">
                       End of Catalog
                   </div>
                )}
                 {/* Page Number */}
                 {rightPageIdx < totalPages && (
                    <div className="absolute bottom-4 right-6 text-slate-400 font-mono text-xs">{rightPageIdx + 1}</div>
                )}
            </div>
        </div>

        {/* Next Button */}
        <button 
            disabled={currentIndex >= totalPages}
            onClick={handleNext}
            className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 bg-white text-slate-900 p-2 md:p-4 rounded-full shadow-xl disabled:opacity-0 transition-opacity hover:bg-blue-50 z-20"
        >
            <ChevronRight size={32} />
        </button>

      </div>
      
      <div className="absolute bottom-8 text-white/50 text-sm font-bold uppercase tracking-widest">
          Showing Pages {currentIndex} - {currentIndex + 1} of {totalPages}
      </div>
    </div>
  );
};

export default Flipbook;