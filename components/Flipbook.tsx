import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen, Calendar } from 'lucide-react';

interface FlipbookProps {
  pages: string[];
  onClose: () => void;
  catalogueTitle?: string;
  startDate?: string;
  endDate?: string;
}

const Flipbook: React.FC<FlipbookProps> = ({ pages, onClose, catalogueTitle, startDate, endDate }) => {
  // Current index refers to the page displayed on the RIGHT side.
  // 0 means cover (single page on right).
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalPages = pages.length;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Allow going one step beyond the last page to show "End of Catalog"
    if (currentIndex + 2 <= totalPages + 1) { 
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
  const leftPageIdx = currentIndex - 1;
  const rightPageIdx = currentIndex;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-12 animate-fade-in" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flipbook-title"
    >
      {/* Header for Title and Close Button */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-start justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-50">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
                <BookOpen size={20} className="text-white" />
            </div>
            <div>
                <h2 id="flipbook-title" className="text-lg md:text-2xl font-black tracking-tight leading-none">
                    {catalogueTitle || "Showcase Pamphlet"}
                </h2>
                {(startDate || endDate) && (
                    <div className="flex items-center gap-1.5 text-blue-300 mt-1">
                        <Calendar size={12} />
                        <span className="text-xs font-mono font-bold uppercase tracking-wide">
                            {startDate && formatDate(startDate)} {startDate && endDate && `-`} {endDate && formatDate(endDate)}
                        </span>
                    </div>
                )}
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm border border-white/10"
          aria-label="Close pamphlet viewer"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-6xl aspect-[3/2] flex items-center justify-center mt-12" onClick={(e) => e.stopPropagation()}>
        
        {/* Previous Button */}
        <button 
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 bg-white text-slate-900 p-3 md:p-4 rounded-full shadow-2xl disabled:opacity-0 transition-opacity hover:bg-blue-50 z-20 border border-slate-200"
            aria-label="Previous page"
        >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
        </button>

        {/* The Book */}
        <div className="flex w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden relative transform transition-transform duration-500">
            {/* Spine Shadow */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/20 to-transparent z-10 pointer-events-none"></div>

            {/* Left Page */}
            <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center border-r border-slate-200 bg-slate-50">
                {leftPageIdx >= 0 && pages[leftPageIdx] ? (
                    <img 
                        src={pages[leftPageIdx]} 
                        alt={`Page ${leftPageIdx + 1}`} 
                        className="w-full h-full object-contain"
                    />
                ) : (
                   <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                       <BookOpen size={48} className="mb-2 opacity-50" />
                       <span className="font-bold uppercase tracking-widest text-sm">Inside Cover</span>
                   </div>
                )}
                {/* Page Number */}
                {leftPageIdx >= 0 && (
                    <div className="absolute bottom-4 left-6 text-slate-400 font-mono text-xs md:text-sm bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm">{leftPageIdx + 1}</div>
                )}
            </div>

            {/* Right Page */}
            <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center bg-slate-50">
                {rightPageIdx < totalPages ? (
                    <img 
                        src={pages[rightPageIdx]} 
                        alt={`Page ${rightPageIdx + 1}`} 
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                       <BookOpen size={48} className="mb-2 opacity-50" />
                       <span className="font-bold uppercase tracking-widest text-sm">End of Catalog</span>
                   </div>
                )}
                 {/* Page Number */}
                 {rightPageIdx < totalPages && (
                    <div className="absolute bottom-4 right-6 text-slate-400 font-mono text-xs md:text-sm bg-white/80 px-2 py-0.5 rounded backdrop-blur-sm">{rightPageIdx + 1}</div>
                )}
            </div>
        </div>

        {/* Next Button */}
        <button 
            disabled={currentIndex >= totalPages}
            onClick={handleNext}
            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 bg-white text-slate-900 p-3 md:p-4 rounded-full shadow-2xl disabled:opacity-0 transition-opacity hover:bg-blue-50 z-20 border border-slate-200"
            aria-label="Next page"
        >
            <ChevronRight size={24} className="md:w-8 md:h-8" />
        </button>

      </div>
      
      {/* Overall Page Indicator */}
      <div className="absolute bottom-6 md:bottom-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/90 text-xs md:text-sm font-bold uppercase tracking-widest shadow-lg">
          Pages {leftPageIdx >= 0 ? leftPageIdx + 1 : 0} - {rightPageIdx < totalPages ? rightPageIdx + 1 : totalPages} <span className="text-white/40 mx-2">|</span> {totalPages} Total
      </div>
    </div>
  );
};

export default Flipbook;