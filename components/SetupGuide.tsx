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
app.use(express.json({limit: '50mb'}));

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

                      <section className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                        <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">B</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">The Supervisor: PM2</h3>
                               <p className="text-slate-600 mb-4 text-sm font-medium">
                                 <strong>What is it?</strong> If your PC restarts or the app crashes, the site goes down. PM2 is a "Process Manager". It's a robot that watches your app 24/7 and restarts it instantly if anything goes wrong.
                               </p>
                               <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 text-sm mb-4">
                                  <strong>Action:</strong> Create a file named <code>ecosystem.config.js</code> in your project root.
                               </div>
                               
                               <CodeBlock 
                                 id="pm2-config"
                                 label="ecosystem.config.js"
                                 code={`module.exports = {
  apps : [{
    name   : "kiosk-hub",
    script : "./server/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}`}
                               />
                               <p className="text-xs font-bold uppercase text-slate-500 mt-4 mb-2">Terminal Commands to Start:</p>
                               <CodeBlock 
                                 id="pm2-commands"
                                 code={`# 1. Install Tools
npm install express cors pm2 -g

# 2. Build your frontend (Create the /dist folder)
npm run build

# 3. Start the Supervisor
pm2 start ecosystem.config.js

# 4. Save list so it starts on reboot
pm2 save
pm2 startup`}
                               />
                           </div>
                        </div>
                      </section>

                      <section className="relative">
                         <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">C</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">The Tunnel: Cloudflare</h3>
                               <p className="text-slate-600 mb-4 text-sm font-medium">
                                 <strong>What is it?</strong> Your PC is hidden behind your home router. Tablets outside can't see it. Cloudflare Tunnel creates a secure "wormhole" from the internet directly to `localhost:3000` on your PC.
                               </p>
                               
                               <CodeBlock 
                                 id="cf-command"
                                 code={`cloudflared tunnel --url http://localhost:3000`}
                               />
                               <div className="mt-4 bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                                  <h4 className="font-bold text-yellow-900 text-sm uppercase tracking-wide mb-2">Your Magic Link</h4>
                                  <p className="text-yellow-800 text-sm leading-relaxed mb-2">
                                     Cloudflare will print a URL like:
                                  </p>
                                  <code className="bg-white px-2 py-1 rounded border border-yellow-300 text-yellow-900 font-mono text-xs">https://random-words.trycloudflare.com</code>
                                  <p className="text-yellow-800 text-sm leading-relaxed mt-2">
                                     <strong>This is your HUB URL.</strong> Write this down. We will use it in the next step.
                                  </p>
                               </div>
                           </div>
                        </div>
                      </section>
                   </div>
                </div>
              )}

              {/* === TAB 2: SPLIT & BUILD === */}
              {activeTab === 'split' && (
                  <div className="p-8 animate-fade-in">
                     <div className="mb-10 pb-8 border-b border-slate-100">
                        <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 2: The Apps</div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Splitting & Building PWAs</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                           You asked to separate the "Admin Hub" from the "Kiosk". We have already done this in the code logic. Now we just need to install them as separate apps on your devices.
                        </p>
                     </div>

                     <div className="space-y-16">
                        {/* SPLIT STRATEGY */}
                        <section className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                          <div className="flex items-start gap-6">
                             <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">1</div>
                             <div className="flex-1 pt-1">
                                 <h3 className="text-xl font-black text-slate-900 mb-2">How the "Split" Works</h3>
                                 <p className="text-slate-600 mb-4 text-sm">
                                   We don't need two different websites. We use <strong>URL Routing</strong> to serve two different interfaces from the same server.
                                 </p>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                         <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold uppercase text-xs">
                                            <Smartphone size={16} /> Device: Tablet
                                         </div>
                                         <div className="text-sm font-mono bg-white p-2 rounded border border-slate-200 text-slate-600 mb-2">
                                            https://your-url.com/
                                         </div>
                                         <p className="text-xs text-slate-500">
                                            Loads the <strong>Shopping Kiosk</strong> interface. No admin buttons. Safe for customers.
                                         </p>
                                     </div>
                                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                         <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold uppercase text-xs">
                                            <Cpu size={16} /> Device: PC
                                         </div>
                                         <div className="text-sm font-mono bg-white p-2 rounded border border-slate-200 text-slate-600 mb-2">
                                            https://your-url.com/admin
                                         </div>
                                         <p className="text-xs text-slate-500">
                                            Loads the <strong>Admin Hub</strong>. Requires password. Used to manage products.
                                         </p>
                                     </div>
                                 </div>
                             </div>
                          </div>
                        </section>

                        {/* PWA BUILDER */}
                        <section className="relative">
                          <div className="flex items-start gap-6">
                             <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">2</div>
                             <div className="flex-1 pt-1">
                                 <h3 className="text-xl font-black text-slate-900 mb-2">Packaging with PWABuilder</h3>
                                 <p className="text-slate-600 mb-4 text-sm">
                                   Now we turn those URLs into real installable apps (APKs for Android, etc).
                                 </p>
                                 
                                 <ol className="space-y-4">
                                     <li className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                         <span className="font-bold text-slate-400">01</span>
                                         <div className="text-sm text-slate-700">
                                             Go to <a href="https://www.pwabuilder.com" target="_blank" className="text-blue-600 underline font-bold">PWABuilder.com</a>.
                                         </div>
                                     </li>
                                     <li className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                         <span className="font-bold text-slate-400">02</span>
                                         <div className="text-sm text-slate-700">
                                             <strong>For Kiosk App:</strong> Enter your Cloudflare URL (e.g., <code>https://my-hub.trycloudflare.com/</code>) and click Start.
                                         </div>
                                     </li>
                                     <li className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                         <span className="font-bold text-slate-400">03</span>
                                         <div className="text-sm text-slate-700">
                                             <strong>For Admin App:</strong> You can create a second app by using the URL <code>https://my-hub.trycloudflare.com/admin</code>.
                                         </div>
                                     </li>
                                     <li className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                         <span className="font-bold text-slate-400">04</span>
                                         <div className="text-sm text-slate-700">
                                             Click <strong>"Package for Stores"</strong>. Download the Android package.
                                         </div>
                                     </li>
                                     <li className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                         <span className="font-bold text-slate-400">05</span>
                                         <div className="text-sm text-slate-700">
                                             Transfer the APK file to your tablet and install it. It will now run full screen without a browser bar!
                                         </div>
                                     </li>
                                 </ol>
                             </div>
                          </div>
                        </section>
                     </div>
                  </div>
              )}

              {/* === TAB 3: VERCEL === */}
              {activeTab === 'vercel' && (
                  <div className="p-8 animate-fade-in">
                     <div className="mb-10 pb-8 border-b border-slate-100">
                        <div className="inline-block px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest mb-4">Deployment Center</div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Hosting on Vercel</h2>
                        <p className="text-slate-600 leading-relaxed text-lg mb-6">
                           Choose your backend strategy. How will your Vercel site get its data?
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                               onClick={() => setVercelMode('hybrid')}
                               className={`p-4 rounded-xl border-2 text-left transition-all ${vercelMode === 'hybrid' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                                <div className="flex items-center gap-2 font-black text-slate-900 mb-1">
                                   <Server size={18} /> Strategy A: Hybrid
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                   <strong>Frontend:</strong> Vercel (Cloud)<br/>
                                   <strong>Backend:</strong> PC Hub (Local via Tunnel)<br/>
                                   <span className="text-blue-600 font-bold">Best for:</span> Free, private, total control.
                                </p>
                            </button>

                            <button 
                               onClick={() => setVercelMode('supabase')}
                               className={`p-4 rounded-xl border-2 text-left transition-all ${vercelMode === 'supabase' ? 'border-green-600 bg-green-50 ring-1 ring-green-600' : 'border-slate-200 hover:border-green-400'}`}
                            >
                                <div className="flex items-center gap-2 font-black text-slate-900 mb-1">
                                   <Cloud size={18} className="text-green-600" /> Strategy B: Cloud Native
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                   <strong>Frontend:</strong> Vercel (Cloud)<br/>
                                   <strong>Backend:</strong> Supabase (Cloud)<br/>
                                   <span className="text-green-600 font-bold">Best for:</span> Reliability, 24/7 uptime.
                                </p>
                            </button>
                        </div>
                     </div>

                     {/* VERCEL STRATEGY A: HYBRID */}
                     {vercelMode === 'hybrid' && (
                        <div className="space-y-12 animate-fade-in">
                           <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm text-blue-900 mb-6">
                              <strong>Overview:</strong> We will deploy the frontend to Vercel, but configure it to talk to your home PC through a secure Cloudflare Tunnel.
                           </div>

                           {/* GUIDE 1: PC HUB SETUP */}
                           <section className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                              <div className="absolute -top-3 left-6 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                 Guide 1: Prepare PC Backend
                              </div>
                              
                              <div className="mt-4">
                                  <h3 className="text-xl font-black text-slate-900 mb-2">Expose Local Server</h3>
                                  <p className="text-sm text-slate-600 mb-6">
                                     Your PC acts as the API. Vercel needs a public URL to reach it.
                                  </p>

                                  <ol className="space-y-6">
                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">1</div>
                                              <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-slate-900 text-sm">Start Local Server</h4>
                                              <p className="text-xs text-slate-500 mb-2">Ensure your Node.js server is running on port 3000.</p>
                                              <code className="block bg-slate-900 text-slate-300 p-2 rounded text-xs font-mono">node server/index.js</code>
                                          </div>
                                      </li>
                                      
                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">2</div>
                                              <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-slate-900 text-sm">Create the Tunnel</h4>
                                              <p className="text-xs text-slate-500 mb-2">Use Cloudflare to expose port 3000.</p>
                                              <CodeBlock 
                                                 id="vercel-tunnel"
                                                 code="cloudflared tunnel --url http://localhost:3000" 
                                              />
                                          </div>
                                      </li>

                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">3</div>
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-900 text-sm">Copy the Magic URL</h4>
                                              <p className="text-xs text-slate-500 mb-2">Look for the URL ending in <code>.trycloudflare.com</code>.</p>
                                              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 font-mono break-all">
                                                 https://heavy-elements-jump.trycloudflare.com
                                              </div>
                                          </div>
                                      </li>
                                  </ol>
                              </div>
                           </section>

                           {/* GUIDE 2: VERCEL DEPLOY */}
                           <section className="relative bg-black rounded-2xl p-6 border border-slate-800 text-white shadow-xl">
                              <div className="absolute -top-3 left-6 bg-white text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm border border-slate-200">
                                 Guide 2: Deploy Frontend
                              </div>
                              
                              <div className="mt-4">
                                  <h3 className="text-xl font-black text-white mb-2">Push to Vercel</h3>
                                  <p className="text-sm text-slate-400 mb-6">
                                     Connect the frontend in the cloud to the backend tunnel.
                                  </p>

                                  <ol className="space-y-6">
                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700">1</div>
                                              <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-white text-sm">Import Project</h4>
                                              <p className="text-xs text-slate-400 mb-2">Push code to GitHub, then "Add New Project" in Vercel.</p>
                                          </div>
                                      </li>

                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md border border-blue-400">2</div>
                                              <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-white text-sm">Configure Environment</h4>
                                              <p className="text-xs text-slate-400 mb-2">Before deploying, add this Variable:</p>
                                              <div className="grid grid-cols-1 gap-2">
                                                 <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Key</span>
                                                    <code className="text-sm font-mono text-blue-400">VITE_API_URL</code>
                                                 </div>
                                                 <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Value</span>
                                                    <code className="text-sm font-mono text-green-400">https://[YOUR_TUNNEL_URL].trycloudflare.com</code>
                                                 </div>
                                              </div>
                                          </div>
                                      </li>

                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm border border-slate-700">3</div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-white text-sm">Deploy</h4>
                                              <p className="text-xs text-slate-400 mb-2">Click <strong>Deploy</strong>. Vercel will build the site.</p>
                                          </div>
                                      </li>
                                  </ol>
                              </div>
                           </section>
                        </div>
                     )}

                     {/* VERCEL STRATEGY B: SUPABASE */}
                     {vercelMode === 'supabase' && (
                        <div className="space-y-12 animate-fade-in">
                           <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-green-900 mb-6 flex items-start gap-3">
                              <Database className="mt-1 shrink-0" size={18} />
                              <div>
                                <strong>Prerequisite:</strong> This guide assumes you have already set up your Supabase project as described in the "Supabase Cloud" tab.
                              </div>
                           </div>

                           <section className="relative bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                              <div className="absolute -top-3 left-6 bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                 Guide: Cloud Native Deployment
                              </div>
                              
                              <div className="mt-4">
                                  <h3 className="text-xl font-black text-slate-900 mb-2">Deploy with Environment Variables</h3>
                                  <p className="text-sm text-slate-600 mb-6">
                                     Since you are using Supabase, you don't need a tunnel. You just need to tell Vercel your Supabase keys.
                                  </p>

                                  <ol className="space-y-6">
                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">1</div>
                                              <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-slate-900 text-sm">Push to Git</h4>
                                              <p className="text-xs text-slate-500 mb-2">Ensure your latest code (with the KioskPro files) is pushed to a GitHub repository.</p>
                                          </div>
                                      </li>
                                      
                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">2</div>
                                              <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                                          </div>
                                          <div className="pb-4">
                                              <h4 className="font-bold text-slate-900 text-sm">Import in Vercel</h4>
                                              <p className="text-xs text-slate-500 mb-2">Go to Vercel Dashboard -> Add New Project -> Select your Repo.</p>
                                          </div>
                                      </li>

                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shadow-md">3</div>
                                              <div className="w-0.5 h-full bg-slate-100 my-2"></div>
                                          </div>
                                          <div className="pb-4 w-full">
                                              <h4 className="font-bold text-slate-900 text-sm">Add Environment Variables</h4>
                                              <p className="text-xs text-slate-500 mb-4">
                                                In the "Environment Variables" section, add these two keys. <br/>
                                                <span className="opacity-50 italic">Find these values in your Supabase Dashboard -> Settings -> API.</span>
                                              </p>
                                              
                                              <div className="space-y-3">
                                                  <div className="flex flex-col md:flex-row gap-2">
                                                      <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                                                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Name</span>
                                                          <code className="text-xs font-mono font-bold text-slate-700">VITE_SUPABASE_URL</code>
                                                      </div>
                                                      <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                                                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Value</span>
                                                          <code className="text-xs font-mono text-slate-500">https://xyz...supabase.co</code>
                                                      </div>
                                                  </div>
                                                  <div className="flex flex-col md:flex-row gap-2">
                                                      <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                                                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Name</span>
                                                          <code className="text-xs font-mono font-bold text-slate-700">VITE_SUPABASE_ANON_KEY</code>
                                                      </div>
                                                      <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200">
                                                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Value</span>
                                                          <code className="text-xs font-mono text-slate-500">eyJhbG... (Your Public Key)</code>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </li>

                                      <li className="flex gap-4">
                                          <div className="flex flex-col items-center">
                                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md">4</div>
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-900 text-sm">Deploy</h4>
                                              <p className="text-xs text-slate-500 mb-2">Click <strong>Deploy</strong>.</p>
                                              <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-xs text-green-800">
                                                 <strong>Note:</strong> You do NOT need to edit <code>kioskService.ts</code> manually. The system will automatically detect these Vercel variables!
                                              </div>
                                          </div>
                                      </li>
                                  </ol>
                              </div>
                           </section>
                        </div>
                     )}

                  </div>
              )}

              {/* === TAB 4: SUPABASE === */}
              {activeTab === 'supabase' && (
                <div className="p-8 animate-fade-in">
                   <div className="mb-10 pb-8 border-b border-slate-100">
                      <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest mb-4">Best for Multi-Device</div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Option 3: Supabase Cloud</h2>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        Connect your kiosk to a secure, hosted database. Perfect if you don't want to keep a PC running 24/7.
                      </p>
                   </div>

                   <div className="space-y-16">
                      
                      {/* STEP 1 */}
                      <section className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                        <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">1</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">Create Project</h3>
                               <p className="text-slate-600 mb-4 text-sm font-medium">If you are new to this, follow these exact steps:</p>
                               <ul className="space-y-3 mb-6">
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <ArrowRight size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Go to <strong>supabase.com</strong> and click "Start your project". Sign in with GitHub.</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <ArrowRight size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Click <strong>New Project</strong>. Name it "Kiosk Pro".</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <ArrowRight size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Generate a database password and <strong>copy it somewhere safe</strong>. Click "Create New Project".</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <ArrowRight size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Wait about 1-2 minutes for the "Setting up..." process to finish.</span>
                                  </li>
                               </ul>
                           </div>
                        </div>
                      </section>

                      {/* STEP 2 */}
                      <section className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                        <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">2</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">Setup Database (The Magic Script)</h3>
                               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                  <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                     <Database size={16} className="text-green-600" /> Action Required
                                  </div>
                                  <p className="text-sm text-slate-600">
                                     In the Supabase dashboard sidebar, look for the <strong>SQL Editor</strong> icon (it looks like a terminal). Click "New Query". Paste the code below and click the green <strong>Run</strong> button.
                                  </p>
                               </div>
                               
                               <CodeBlock 
                                 id="sql-schema"
                                 label="Copy & Paste into Supabase SQL Editor"
                                 code={`-- 1. Create Kiosks Table (Tracks your devices)
create table public.kiosks (
  id text primary key,
  name text,
  status text,
  last_seen timestamptz,
  wifi_strength int,
  ip_address text,
  version text
);

-- 2. Create Store Data Table (Stores products JSON)
create table public.store_config (
  id int primary key default 1,
  data jsonb
);

-- 3. Security Settings (Row Level Security)
-- We enable this but allow public access for simplicity in this demo.
alter table public.kiosks enable row level security;
alter table public.store_config enable row level security;

-- 4. Access Policies
create policy "Public Access Kiosks" on public.kiosks for all using (true);
create policy "Public Access Config" on public.store_config for all using (true);

-- 5. Insert Default Empty Data
insert into public.store_config (id, data) values (1, '{}'::jsonb);`}
                               />
                               <div className="flex items-center gap-2 text-[10px] text-green-700 font-bold bg-green-50 px-3 py-2 rounded-lg inline-flex mt-2">
                                  <Check size={12} /> Confirm you see "Success, no rows returned" at the bottom of the SQL Editor.
                               </div>
                           </div>
                        </div>
                      </section>

                      {/* STEP 3 */}
                      <section className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 -z-10"></div>
                        <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">3</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">Get API Credentials</h3>
                               <p className="text-slate-600 mb-4 text-sm">You need two strings to connect your app.</p>
                               <ul className="space-y-3 mb-6">
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <Settings size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Go to <strong>Project Settings</strong> (Cog icon at bottom of sidebar).</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <Key size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Click on <strong>API</strong> in the list.</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <Copy size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Find <strong>Project URL</strong> and copy it.</span>
                                  </li>
                                  <li className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                     <Copy size={16} className="text-green-600 mt-0.5 shrink-0" />
                                     <span>Find <strong>Project API keys</strong> -> <code>anon</code> public key. Copy it.</span>
                                  </li>
                               </ul>
                           </div>
                        </div>
                      </section>

                      {/* STEP 4 */}
                      <section className="relative">
                         <div className="flex items-start gap-6">
                           <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">4</div>
                           <div className="flex-1 pt-1">
                               <h3 className="text-xl font-black text-slate-900 mb-2">Connect Your App</h3>
                               <p className="text-slate-600 mb-4 text-sm">
                                  There are two ways to connect:
                               </p>

                               <div className="space-y-4">
                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">Method A: Vercel Hosting (Recommended)</h4>
                                      <p className="text-sm text-slate-600 mb-2">
                                          If hosting on Vercel, just add Environment Variables. <br/>
                                          <strong>Go to the "Vercel Hosting" tab -> Select Strategy B.</strong>
                                      </p>
                                  </div>

                                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">Method B: Manual / Local</h4>
                                      <p className="text-sm text-slate-600 mb-2">
                                         Open <code>services/kioskService.ts</code> and paste your keys manually:
                                      </p>
                                      <CodeBlock 
                                       id="env-vars"
                                       label="services/kioskService.ts"
                                       code={`// REPLACE THE PLACEHOLDERS WITH YOUR COPIED KEYS:

const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR...'; // Your 'anon' key`}
                                     />
                                  </div>
                               </div>
                           </div>
                        </div>
                      </section>
                   </div>
                </div>
              )}

           </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;