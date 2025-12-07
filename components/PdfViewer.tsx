
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
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
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null); // pdfjsLib.RenderTask

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);
        // Using safe pdfjs reference
        const loadingTask = pdfjs.getDocument(url);
        const doc = await loadingTask.promise;
        setPdf(doc);
        setLoading(false);
      } catch (err: any) {
        console.error("PDF Load Error:", err);
        setError("Unable to load document. The file might be corrupted or restricted.");
        setLoading(false);
      }
    };
    loadPdf();
  }, [url]);

  // Render Page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;
      
      try {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
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
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col animate-fade-in" onClick={onClose}>
        {/* Header */}
       <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-red-500 p-2 rounded-lg shrink-0">
                  <span className="font-black text-[10px] uppercase">PDF</span>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wider truncate max-w-md">{title}</h2>
              
              {pdf && (
                  <div className="hidden md:flex items-center gap-2 bg-slate-800 rounded-lg p-1 ml-4 border border-slate-700">
                      <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut size={16}/></button>
                      <span className="text-xs font-mono w-12 text-center font-bold text-blue-400">{Math.round(scale * 100)}%</span>
                      <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn size={16}/></button>
                  </div>
              )}
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors border border-white/5">
             <X size={24} />
          </button>
       </div>

       {/* Content */}
       <div className="flex-1 w-full h-full bg-slate-100/5 relative overflow-auto flex justify-center p-4 md:p-8" onClick={e => e.stopPropagation()}>
          {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                  <span className="font-bold uppercase tracking-widest text-sm animate-pulse">Loading Document...</span>
              </div>
          )}

          {error && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-red-500/50 text-center max-w-md shadow-2xl">
                      <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                      <p className="font-bold text-lg mb-2 text-white">Error Loading Document</p>
                      <p className="text-sm text-slate-400 mb-6">{error}</p>
                      <button onClick={onClose} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold uppercase text-xs">Close</button>
                  </div>
              </div>
          )}

          <div className={`relative transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
               {/* Canvas */}
               <canvas ref={canvasRef} className="bg-white rounded shadow-2xl max-w-none" />
          </div>
       </div>
       
       {/* Footer Controls */}
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
           </div>
       )}
    </div>
  );
};

export default PdfViewer;
