import React from 'react';
import { X } from 'lucide-react';

interface PdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, title, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col animate-fade-in">
       <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold uppercase tracking-wider truncate">{title}</h2>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
             <X size={24} />
          </button>
       </div>
       <div className="flex-1 w-full h-full bg-slate-100 relative">
          <iframe src={url} className="w-full h-full" title={title} />
       </div>
    </div>
  );
};

export default PdfViewer;