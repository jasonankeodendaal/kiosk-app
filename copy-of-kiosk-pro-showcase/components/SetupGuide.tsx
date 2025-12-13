
import React, { useState } from 'react';
import { X, Server, Copy, Check, ArrowRight, ExternalLink, ShieldCheck, Database, Key, Settings, Layers, Smartphone, Globe, Cpu, Cloud, ToggleRight, CloudLightning, Book, AlertTriangle, PlayCircle, FolderOpen, Lock, MousePointer, Terminal, Package, HardDrive, Box } from 'lucide-react';

interface SetupGuideProps {
  onClose: () => void;
}

const SetupGuide: React.FC<SetupGuideProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'split' | 'vercel' | 'supabase'>('supabase');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const CodeBlock = ({ code, id, label }: { code: string, id: string, label?: string }) => (
    <div className="my-4 relative group">
      {label && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Terminal size={12}/> {label}</div>}
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
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-12">Zero-to-Hero Guide v2.4</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Sidebar (Desktop) */}
        <div className="w-72 bg-white border-r border-slate-200 p-4 flex-col shrink-0 overflow-y-auto hidden md:flex">
           <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4 text-opacity-50 mt-4 px-2">Setup Phases</h3>
           
            <button 
             onClick={() => setActiveTab('supabase')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'supabase' ? 'border-green-600 bg-green-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Database size={18} className={activeTab === 'supabase' ? 'text-green-600' : 'text-slate-400'} />
                 <div>
                    <span className={`font-bold text-sm block ${activeTab === 'supabase' ? 'text-green-900' : 'text-slate-600'}`}>1. Supabase Cloud</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">The Backend</span>
                 </div>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('local')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'local' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Server size={18} className={activeTab === 'local' ? 'text-blue-600' : 'text-slate-400'} />
                 <div>
                    <span className={`font-bold text-sm block ${activeTab === 'local' ? 'text-blue-900' : 'text-slate-600'}`}>2. Local Hub (PC)</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Offline Server</span>
                 </div>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('split')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'split' ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Layers size={18} className={activeTab === 'split' ? 'text-purple-600' : 'text-slate-400'} />
                 <div>
                    <span className={`font-bold text-sm block ${activeTab === 'split' ? 'text-purple-900' : 'text-slate-600'}`}>3. Code Build</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">The Frontend</span>
                 </div>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('vercel')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'vercel' ? 'border-black bg-slate-100 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Globe size={18} className={activeTab === 'vercel' ? 'text-black' : 'text-slate-400'} />
                 <div>
                    <span className={`font-bold text-sm block ${activeTab === 'vercel' ? 'text-slate-900' : 'text-slate-600'}`}>4. Vercel Deploy</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Go Live</span>
                 </div>
              </div>
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-12 scroll-smooth">
           <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-full pb-12">
              
              {/* Tab Header Mobile */}
              <div className="md:hidden flex border-b border-slate-200 overflow-x-auto bg-white shrink-0">
                 <button onClick={() => setActiveTab('supabase')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap border-b-4 transition-all ${activeTab === 'supabase' ? 'text-green-600 border-green-600 bg-green-50' : 'text-slate-500 border-transparent'}`}>1. Cloud</button>
                 <button onClick={() => setActiveTab('local')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap border-b-4 transition-all ${activeTab === 'local' ? 'text-blue-600 border-blue-600 bg-blue-50' : 'text-slate-500 border-transparent'}`}>2. PC Hub</button>
                 <button onClick={() => setActiveTab('split')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap border-b-4 transition-all ${activeTab === 'split' ? 'text-purple-600 border-purple-600 bg-purple-50' : 'text-slate-500 border-transparent'}`}>3. Build</button>
                 <button onClick={() => setActiveTab('vercel')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap border-b-4 transition-all ${activeTab === 'vercel' ? 'text-black border-black bg-slate-100' : 'text-slate-500 border-transparent'}`}>4. Live</button>
              </div>

              {/* === TAB 1: SUPABASE === */}
              {activeTab === 'supabase' && (
                <div className="p-8 animate-fade-in">
                    <div className="mb-8 border-b border-slate-100 pb-8">
                       <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 1: The Backend</div>
                       <h2 className="text-4xl font-black text-slate-900 mb-2">Supabase Cloud Setup</h2>
                       <p className="text-slate-600 text-lg">
                           The <strong>Backend</strong> of your Kiosk. It handles the Database (Products, Fleet) and Storage (Images, Videos).
                       </p>
                    </div>

                    <div className="space-y-12">
                        
                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">1</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Create Account & Project</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    Supabase is free for small projects. We need to create a "container" for your kiosk data.
                                </p>
                                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <li>Go to <a href="https://supabase.com" target="_blank" className="text-blue-600 hover:underline font-bold">supabase.com</a> and click <strong>"Start your project"</strong>.</li>
                                    <li>Sign in with GitHub (easiest) or Email.</li>
                                    <li>Click <strong>"New Project"</strong>.</li>
                                    <li><strong>Name:</strong> <code className="bg-white px-1 border rounded">Kiosk Pro</code></li>
                                    <li><strong>Database Password:</strong> Generate a strong one and <strong>SAVE IT</strong> somewhere safe.</li>
                                    <li><strong>Region:</strong> Choose the one physically closest to you.</li>
                                    <li>Click <strong>"Create new project"</strong> and wait ~2 minutes for it to build.</li>
                                </ol>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">2</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Get API Keys (Detailed)</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    This is the most critical step. Your kiosk needs these two keys to log in.
                                </p>
                                
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center gap-2">
                                        <MousePointer size={14} className="text-blue-600" />
                                        <span className="text-xs font-black uppercase text-slate-600">Follow these exact clicks:</span>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded text-slate-600"><Settings size={18} /></div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">1. Click Project Settings</div>
                                                <div className="text-xs text-slate-500">Look at the <strong>Bottom Left</strong> of the screen. It is a Gear Icon.</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded text-slate-600"><Key size={18} /></div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">2. Click API</div>
                                                <div className="text-xs text-slate-500">In the list that appears, click "API" under the configuration section.</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                                            <strong>Save These!</strong> You will see <code>Project URL</code> and <code>anon / public</code> key. Keep this tab open.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">3</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Run Database Script</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    We need to build the tables. Copy this code, go to the <strong>SQL Editor</strong> (Icon on left sidebar), paste it, and click <strong>Run</strong>.
                                </p>
                                
                                <div className="p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 rounded-r-lg mb-4 text-xs font-medium">
                                    <span className="font-bold uppercase">Note:</span> This script sets up open permissions for ease of use. It includes the new Fleet columns and Setup PIN configuration.
                                </div>

                                <CodeBlock 
                                    id="sql-script"
                                    label="SQL Editor"
                                    code={`-- 1. Create Storage Bucket for Media
insert into storage.buckets (id, name, public)
values ('kiosk-media', 'kiosk-media', true)
on conflict (id) do nothing;

-- 2. Allow Public Access to Storage (Images/Videos)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'kiosk-media' );

create policy "Public Insert"
  on storage.objects for insert
  with check ( bucket_id = 'kiosk-media' );

-- 3. Create Main Config Table (Stores JSON data)
create table if not exists public.store_config (
  id serial primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Insert Default Config if empty (Includes Default PIN)
insert into public.store_config (id, data)
values (1, '{
  "hero": {
    "title": "Welcome",
    "subtitle": "Digital Experience"
  },
  "brands": [],
  "fleet": [],
  "systemSettings": {
      "setupPin": "0000" 
  }
}'::jsonb)
on conflict (id) do nothing;

-- 5. Create Fleet Telemetry Table (Updated Schema)
create table if not exists public.kiosks (
  id text primary key,
  name text,
  device_type text, 
  status text,
  last_seen timestamp with time zone,
  wifi_strength int,
  ip_address text,
  version text,
  location_description text,
  assigned_zone text,
  restart_requested boolean default false,
  notes text
);

-- 6. Enable Row Level Security (RLS)
alter table public.store_config enable row level security;
alter table public.kiosks enable row level security;

-- 7. Create OPEN Policies (Allows Kiosk to Read/Write without Login)
-- Note: In production, you would restrict this, but for Kiosk setups this is standard.

-- Config Policies
create policy "Enable read access for all users"
on public.store_config for select
using (true);

create policy "Enable update access for all users"
on public.store_config for update
using (true)
with check (true);

create policy "Enable insert access for all users"
on public.store_config for insert
with check (true);

-- Fleet Policies
create policy "Enable read access for fleet"
on public.kiosks for select
using (true);

create policy "Enable insert/update for fleet"
on public.kiosks for all
using (true)
with check (true);`}
                                />
                            </div>
                        </div>

                    </div>
                </div>
              )}

              {/* === TAB 2: LOCAL HUB === */}
              {activeTab === 'local' && (
                  <div className="p-8 animate-fade-in">
                      <div className="mb-8 border-b border-slate-100 pb-8">
                         <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 2: Local Server</div>
                         <h2 className="text-4xl font-black text-slate-900 mb-2">PC Hub Setup</h2>
                         <p className="text-slate-600 text-lg">
                             Running the kiosk locally on a PC is great for <strong>testing</strong> or for a master control station.
                         </p>
                      </div>

                      <div className="space-y-8">
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <h4 className="font-bold text-slate-900 mb-2">Prerequisites</h4>
                              <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                  <li>Node.js installed (v18 or higher)</li>
                                  <li>Git installed (optional, but recommended)</li>
                              </ul>
                          </div>

                          <div>
                              <h3 className="font-bold text-slate-900 mb-2">1. Connect Code</h3>
                              <p className="text-sm text-slate-600 mb-2">Open your terminal/command prompt in the project folder and run:</p>
                              <CodeBlock id="npm-install" code="npm install" />
                          </div>

                          <div>
                              <h3 className="font-bold text-slate-900 mb-2">2. Configure Environment</h3>
                              <p className="text-sm text-slate-600 mb-2">
                                  Create a file named <code>.env</code> in the root folder. Paste your Supabase keys from Step 1:
                              </p>
                              <CodeBlock 
                                id="env-file"
                                label=".env" 
                                code={`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`} 
                              />
                          </div>

                          <div>
                              <h3 className="font-bold text-slate-900 mb-2">3. Start Server</h3>
                              <CodeBlock id="npm-run-dev" code="npm run dev" />
                              <p className="text-sm text-slate-600 mt-2">Open your browser to the localhost link shown (usually http://localhost:5173).</p>
                          </div>
                      </div>
                  </div>
              )}

              {/* === TAB 3: SPLIT / REPLIT === */}
              {activeTab === 'split' && (
                  <div className="p-8 animate-fade-in">
                      <div className="mb-8 border-b border-slate-100 pb-8">
                         <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 3: Cloud IDE</div>
                         <h2 className="text-4xl font-black text-slate-900 mb-2">Web-Based Editing</h2>
                         <p className="text-slate-600 text-lg">
                             If you don't have a powerful PC, you can edit and run this entire system in the browser using Replit or CodeSandbox.
                         </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <a href="https://repl.it" target="_blank" className="block group">
                              <div className="bg-slate-900 text-white p-6 rounded-2xl h-full transition-transform hover:-translate-y-1">
                                  <div className="mb-4 bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center">
                                      <Terminal size={24} />
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">Option A: Replit</h3>
                                  <p className="text-sm text-slate-400 mb-4">Best for beginners. It gives you a full VS Code environment in the browser.</p>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 group-hover:text-white transition-colors">
                                      Start Replit <ArrowRight size={14} />
                                  </div>
                              </div>
                          </a>

                          <a href="https://codesandbox.io" target="_blank" className="block group">
                              <div className="bg-black text-white p-6 rounded-2xl h-full transition-transform hover:-translate-y-1 border border-slate-800">
                                  <div className="mb-4 bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center">
                                      <Box size={24} />
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">Option B: CodeSandbox</h3>
                                  <p className="text-sm text-gray-400 mb-4">Instant preview. Great for quick edits and sharing with the team.</p>
                                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400 group-hover:text-white transition-colors">
                                      Start Sandbox <ArrowRight size={14} />
                                  </div>
                              </div>
                          </a>
                      </div>

                      <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                          <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2"><Key size={16}/> Secrets Management</h4>
                          <p className="text-sm text-purple-800 mb-4">
                              When using online IDEs, <strong>do not</strong> paste keys in code. Look for a "Secrets" or "Environment Variables" lock icon on the sidebar.
                          </p>
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1">
                                  <span>Key</span>
                                  <span>Value</span>
                              </div>
                              <div className="border-t border-slate-100 pt-1 flex justify-between text-xs font-bold text-slate-800">
                                  <span>VITE_SUPABASE_URL</span>
                                  <span className="text-slate-400">...</span>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* === TAB 4: VERCEL === */}
              {activeTab === 'vercel' && (
                  <div className="p-8 animate-fade-in">
                      <div className="mb-8 border-b border-slate-100 pb-8">
                         <div className="inline-block px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 4: Deployment</div>
                         <h2 className="text-4xl font-black text-slate-900 mb-2">Go Live with Vercel</h2>
                         <p className="text-slate-600 text-lg">
                             Turn your code into a real URL (e.g., <code>my-kiosk.vercel.app</code>) that you can load on any tablet.
                         </p>
                      </div>

                      <div className="space-y-8">
                          <div className="flex gap-6 items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold shrink-0">1</div>
                              <div>
                                  <h4 className="font-bold text-slate-900 mb-1">Push to GitHub</h4>
                                  <p className="text-sm text-slate-600">Ensure your code is saved in a GitHub repository.</p>
                              </div>
                          </div>

                          <div className="flex gap-6 items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold shrink-0">2</div>
                              <div>
                                  <h4 className="font-bold text-slate-900 mb-1">Import to Vercel</h4>
                                  <p className="text-sm text-slate-600 mb-3">Go to <a href="https://vercel.com" className="text-blue-600 hover:underline">vercel.com</a>, sign up, and click "Add New Project". Select your GitHub repo.</p>
                              </div>
                          </div>

                          <div className="flex gap-6 items-start">
                              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold shrink-0">3</div>
                              <div>
                                  <h4 className="font-bold text-slate-900 mb-2">Add Environment Variables</h4>
                                  <p className="text-sm text-slate-600 mb-3">
                                      Before clicking Deploy, open the <strong>"Environment Variables"</strong> section. Add the keys from Supabase:
                                  </p>
                                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-xs font-mono">
                                      <div className="flex justify-between mb-1">
                                          <span className="font-bold text-slate-700">VITE_SUPABASE_URL</span>
                                          <span className="text-slate-400">https://xyz...</span>
                                      </div>
                                      <div className="flex justify-between">
                                          <span className="font-bold text-slate-700">VITE_SUPABASE_ANON_KEY</span>
                                          <span className="text-slate-400">eyJ...</span>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div className="flex gap-6 items-start">
                              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold shrink-0"><Check size={16}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-900 mb-1">Deploy & Install</h4>
                                  <p className="text-sm text-slate-600">
                                      Click Deploy. Once finished, visit the URL on your Tablet. Use Chrome -> "Add to Home Screen" to install it as a fullscreen App.
                                  </p>
                              </div>
                          </div>
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
