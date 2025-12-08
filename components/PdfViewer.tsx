
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, Maximize } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Fix for ESM import in some environments where the module is wrapped in 'default'
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

// Worker configuration matching the version in importmap
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface PdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, title, onClose }) => {
  const [pdf, setPdf] = useState<any>(null); // pdfjsLib.PDFDocumentProxy
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(0); // 0 indicates "Auto Fit" mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // To measure available space
  const renderTaskRef = useRef<any>(null); // pdfjsLib.RenderTask
  const loadingTaskRef = useRef<any>(null); // pdfjsLib.LoadingTask

  // Load PDF Document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        setPageNum(1);
        setScale(0); // Reset to auto-fit on new document
        
        // Cancel previous loading task if active
        if (loadingTaskRef.current) {
            loadingTaskRef.current.destroy().catch(() => {});
        }

        // Using safe pdfjs reference with optimization options
        const loadingTask = pdfjs.getDocument({
            url,
            // Configuring cMapUrl significantly speeds up rendering by using CDN for font maps
            // instead of failing/timing out on local resolution
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
        });
        
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        
        // Only update state if this is still the active request
        if (loadingTaskRef.current === loadingTask) {
            setPdf(doc);
            setLoading(false);
        }
      } catch (err: any) {
        if (err?.message !== 'Loading aborted') {
            console.error("PDF Load Error:", err);
            setError("Unable to load document. The file might be corrupted or restricted.");
            setLoading(false);
        }
      }
    };
    loadPdf();

    // Cleanup on unmount
    return () => {
        if (loadingTaskRef.current) {
            loadingTaskRef.current.destroy().catch(() => {});
        }
    };
  }, [url]);

  // Render Page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current || !containerRef.current) return;
      
      try {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(pageNum);
        
        // --- AUTO-FIT LOGIC ---
        let renderScale = scale;
        
        // If scale is 0, we calculate the "shrink to fit" scale
        if (renderScale <= 0) {
            const viewportUnscaled = page.getViewport({ scale: 1.0 });
            // Get container dimensions with padding deduction (accounting for safe area)
            const containerWidth = containerRef.current.clientWidth - 40; 
            const containerHeight = containerRef.current.clientHeight - 40;
            
            // Calculate scale to fit width and height
            const scaleX = containerWidth / viewportUnscaled.width;
            const scaleY = containerHeight / viewportUnscaled.height;
            
            // Choose the smaller scale to ensure full page fits
            renderScale = Math.min(scaleX, scaleY);
            
            // Update state so the controls reflect the new scale
            // This will trigger a re-render, effectively processing the 'else' block below next time
            setScale(renderScale);
            return; 
        }

        // --- RENDER LOGIC ---
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            
            const task = page.render(renderContext);
            renderTaskRef.current = task;
            await task.promise;
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
            console.error("Page Render Error", err);
        }
      }
    };
    
    renderPage();
  }, [pdf, pageNum, scale]);

  const changePage = (delta: number) => {
      if (!pdf) return;
      const newPage = pageNum + delta;
      if (newPage >= 1 && newPage <= pdf.numPages) {
          setPageNum(newPage);
          // Optional: Reset to fit on page turn? 
          // setScale(0); 
          // Keeping previous scale is usually better UX for reading.
      }
  };

  // Zoom Helpers
  const handleZoomIn = () => setScale(prev => Math.min(5.0, prev * 1.25));
  const handleZoomOut = () => setScale(prev => Math.max(0.25, prev / 1.25));
  const handleFit = () => setScale(0);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on left click and if not clicking controls (though controls overlay is separate usually)
    if (e.button !== 0 || !containerRef.current) return;
    
    setIsDragging(true);
    setStartPos({ x: e.pageX, y: e.pageY });
    setScrollPos({ 
        left: containerRef.current.scrollLeft, 
        top: containerRef.current.scrollTop 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - startPos.x;
    const y = e.pageY - startPos.y;
    containerRef.current.scrollLeft = scrollPos.left - x;
    containerRef.current.scrollTop = scrollPos.top - y;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col animate-fade-in" onClick={onClose}>
        {/* Header */}
       <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-md z-20" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-red-500 p-2 rounded-lg shrink-0">
                  <span className="font-black text-[10px] uppercase">PDF</span>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wider truncate max-w-md">{title}</h2>
              
              {pdf && (
                  <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg p-1 ml-4 border border-slate-700">
                      <button onClick={handleFit} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Fit Screen"><Maximize size={16}/></button>
                      <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
                      <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={16}/></button>
                      <span className="text-xs font-mono w-12 text-center font-bold text-blue-400">{scale > 0 ? Math.round(scale * 100) : 'FIT'}%</span>
                      <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={16}/></button>
                  </div>
              )}
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/5">
             <X size={24} />
          </button>
       </div>

       {/* Content Container */}
       <div 
         ref={containerRef}
         className={`flex-1 w-full h-full bg-slate-100/5 relative overflow-auto flex p-4 md:p-8 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} 
         onClick={e => e.stopPropagation()}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
       >
          {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                  <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                  <span className="font-bold uppercase tracking-widest text-sm animate-pulse">Loading Document...</span>
              </div>
          )}

          {error && (
              <div className="absolute inset-0 flex items-center justify-center text-white z-10 pointer-events-none">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 text-center max-w-md shadow-2xl pointer-events-auto">
                      <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                      <p className="font-bold text-lg mb-2 text-white">Error Loading Document</p>
                      <p className="text-sm text-slate-400 mb-6">{error}</p>
                      <button onClick={onClose} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold uppercase text-xs">Close</button>
                  </div>
              </div>
          )}

          {/* Canvas Wrapper - m-auto handles centering in the flex container when content is small, and scroll behavior when large */}
          <div className={`relative transition-opacity duration-300 m-auto ${loading ? 'opacity-0' : 'opacity-100'}`}>
               <canvas ref={canvasRef} className="bg-white rounded shadow-2xl block" />
          </div>
       </div>
       
       {/* Footer Controls (Mobile Zoom included) */}
       {pdf && (
           <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-4 md:gap-8 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20" onClick={e => e.stopPropagation()}>
               <button 
                  disabled={pageNum <= 1}
                  onClick={() => changePage(-1)}
                  className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                  title="Previous Page"
               >
                  <ChevronLeft size={24} />
               </button>
               
               <div className="flex flex-col items-center">
                   <span className="text-white font-black text-xl tracking-tight leading-none">
                       {pageNum} <span className="text-slate-500 text-sm font-bold">/ {pdf.numPages}</span>
                   </span>
               </div>

               <button 
                  disabled={pageNum >= pdf.numPages}
                  onClick={() => changePage(1)}
                  className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white disabled:opacity-30 disabled:hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                  title="Next Page"
               >
                  <ChevronRight size={24} />
               </button>

               {/* Mobile Only Zoom Controls */}
               <div className="flex md:hidden items-center gap-2 bg-slate-800 rounded-lg p-1 ml-4 border border-slate-700">
                    <button onClick={handleZoomOut} className="p-2 text-slate-300 active:bg-slate-700 rounded"><ZoomOut size={20}/></button>
                    <button onClick={handleFit} className="p-2 text-blue-400 border-x border-slate-700 active:bg-slate-700 rounded"><Maximize size={20}/></button>
                    <button onClick={handleZoomIn} className="p-2 text-slate-300 active:bg-slate-700 rounded"><ZoomIn size={20}/></button>
               </div>
           </div>
       )}
    </div>
  );
};

export default PdfViewer;
