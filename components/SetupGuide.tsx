
import React, { useState } from 'react';
import { X, Server, Copy, Check, ArrowRight, ExternalLink, ShieldCheck, Database, Key, Settings, Layers, Smartphone, Globe, Cpu, Cloud, ToggleRight } from 'lucide-react';

interface SetupGuideProps {
  onClose: () => void;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'split' | 'vercel' | 'supabase'>('local');
  const [vercelMode, setVercelMode] = useState<'hybrid' | 'supabase'>('hybrid');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const CodeBlock = ({ code, id, label }: { code: string, id: string, label?: string }) => (
    <div className="my-4 relative group">
      {label && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>}
      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto relative shadow-lg border border-slate-700">
        <code className="font-mono text-sm text-blue-300 whitespace-pre block leading-relaxed">{code}</code>
        <button 
          onClick={() => copyToClipboard(code, id)}
          className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors border border-white/5"
          title="Copy to Clipboard"
        >
          {copiedStep === id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 shadow-xl shrink-0 flex items-center justify-between border-b border-slate-800">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
               <ShieldCheck size={24} className="text-white" />
             </div>
             <h1 className="text-2xl font-black tracking-tight">System Setup Manual</h1>
           </div>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-12">Zero-to-Hero Configuration Guide</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
           <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4 text-opacity-50 mt-4 px-2">Core Infrastructure</h3>
           
           <button 
             onClick={() => setActiveTab('local')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'local' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Server size={18} className={activeTab === 'local' ? 'text-blue-600' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'local' ? 'text-blue-900' : 'text-slate-600'}`}>1. The PC Hub (Backend)</span>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('split')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'split' ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Layers size={18} className={activeTab === 'split' ? 'text-purple-600' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'split' ? 'text-purple-900' : 'text-slate-600'}`}>2. Split & PWA Build</span>
              </div>
           </button>

           <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4 text-opacity-50 mt-6 px-2">Alternatives</h3>

           <button 
             onClick={() => setActiveTab('vercel')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'vercel' ? 'border-black bg-slate-100 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Globe size={18} className={activeTab === 'vercel' ? 'text-black' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'vercel' ? 'text-slate-900' : 'text-slate-600'}`}>Vercel Hosting</span>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('supabase')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'supabase' ? 'border-green-600 bg-green-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Database size={18} className={activeTab === 'supabase' ? 'text-green-600' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'supabase' ? 'text-green-900' : 'text-slate-600'}`}>Supabase Cloud</span>
              </div>
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-12 scroll-smooth">
           <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-full pb-12">
              
              {/* Tab Header Mobile */}
              <div className="md:hidden flex border-b border-slate-200 overflow-x-auto">
                 <button onClick={() => setActiveTab('local')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'local' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>1. Local Hub</button>
                 <button onClick={() => setActiveTab('split')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'split' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500'}`}>2. Split App</button>
                 <button onClick={() => setActiveTab('vercel')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'vercel' ? 'text-black border-b-2 border-black' : 'text-slate-500'}`}>Vercel</button>
              </div>

              {/* === TAB 1: LOCAL SERVER === */}
              {activeTab === 'local' && (
                <div className="p-8 animate-fade-in">
                   <div className="mb-10 pb-8 border-b border-slate-100">
                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 1: The Engine</div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Setting up the PC Hub</h2>
                      <p className="text-slate-600 leading-relaxed text-lg mb-4">
                        We will turn your personal computer into a professional server. It will host the database, serve the website, and manage the fleet.
                      </p>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                        <strong>Why do we need this?</strong><br/>
                        Regular websites live in the "Cloud". But you want to run this 100% free and control the data yourself. To do that, your PC needs to act like the Cloud.
                      </div>
                   </div>

                   <div className="space-y-16">
                      <section className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                        <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">A</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">The Engine: Node.js</h3>
                               <p className="text-slate-600 mb-4 text-sm font-medium">
                                 <strong>What is it?</strong> JavaScript usually only lives in the browser. Node.js lets JavaScript live on your hard drive so it can read files (like your product database).
                               </p>
                               <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 text-sm mb-4">
                                  <strong>Action:</strong> Create a folder named <code>server</code> in your project root. Inside it, create <code>index.js</code>.
                               </div>
                               <CodeBlock 
                                 id="server-code"
                                 label="server/index.js"
                                 code={`const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
// Increased limit for large video uploads
app.use(express.json({limit: '500mb'}));

// 1. Host the Kiosk App (Frontend)
app.use(express.static(path.join(__dirname, '../dist')));

const DB_FILE = path.join(__dirname, 'db.json');

// 2. Provide Data to Kiosks (Backend API)
app.get('/api/config', (req, res) => {
  if (!fs.existsSync(DB_FILE)) return res.json({});
  const data = fs.readFileSync(DB_FILE);
  res.json(JSON.parse(data));
});

// 3. Save Data from Admin Hub
app.post('/api/update', (req, res) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// 4. Handle "Split" Routing (Important!)
// If URL has /admin, serve index.html (React router handles the rest)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(3000, () => console.log('HUB SERVER ONLINE: Port 3000'));`}
                               />
                           </div>
                        </div>
                      </section>
                      {/* ... rest of the component remains same ... */}
                   </div>
                </div>
              )}
              {/* ... Other tabs ... */}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;
