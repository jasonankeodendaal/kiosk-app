
import React, { useState } from 'react';
import { X, Server, Copy, Check, ArrowRight, ExternalLink, ShieldCheck, Database, Key, Settings, Layers, Smartphone, Globe, Cpu, Cloud, ToggleRight, CloudLightning, Book, AlertTriangle, PlayCircle, FolderOpen, Lock, MousePointer } from 'lucide-react';

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
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-12">Beginner's Zero-to-Hero Guide</p>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-slate-200 p-4 flex flex-col shrink-0 overflow-y-auto hidden md:flex">
           <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-4 text-opacity-50 mt-4 px-2">Setup Phases</h3>
           
           <button 
             onClick={() => setActiveTab('local')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'local' ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Server size={18} className={activeTab === 'local' ? 'text-blue-600' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'local' ? 'text-blue-900' : 'text-slate-600'}`}>1. Local Hub (PC)</span>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('split')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'split' ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Layers size={18} className={activeTab === 'split' ? 'text-purple-600' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'split' ? 'text-purple-900' : 'text-slate-600'}`}>2. Code Structure</span>
              </div>
           </button>

           <button 
             onClick={() => setActiveTab('vercel')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'vercel' ? 'border-black bg-slate-100 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Globe size={18} className={activeTab === 'vercel' ? 'text-black' : 'text-slate-400'} />
                 <span className={`font-bold text-sm ${activeTab === 'vercel' ? 'text-slate-900' : 'text-slate-600'}`}>3. Vercel Hosting</span>
              </div>
           </button>

           <div className="my-4 border-t border-slate-100"></div>

           <button 
             onClick={() => setActiveTab('supabase')}
             className={`p-3 rounded-xl border text-left mb-3 transition-all group relative overflow-hidden ${activeTab === 'supabase' ? 'border-green-600 bg-green-50 shadow-md' : 'border-transparent hover:bg-slate-50'}`}
           >
              <div className="flex items-center gap-3 relative z-10">
                 <Database size={18} className={activeTab === 'supabase' ? 'text-green-600' : 'text-slate-400'} />
                 <div>
                    <span className={`font-bold text-sm block ${activeTab === 'supabase' ? 'text-green-900' : 'text-slate-600'}`}>4. Supabase Setup</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Here</span>
                 </div>
              </div>
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-12 scroll-smooth">
           <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-full pb-12">
              
              {/* Tab Header Mobile */}
              <div className="md:hidden flex border-b border-slate-200 overflow-x-auto">
                 <button onClick={() => setActiveTab('supabase')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'supabase' ? 'text-green-600 border-b-2 border-green-600' : 'text-slate-500'}`}>1. Supabase (Start)</button>
                 <button onClick={() => setActiveTab('local')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'local' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>2. Local</button>
                 <button onClick={() => setActiveTab('vercel')} className={`flex-1 p-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap ${activeTab === 'vercel' ? 'text-black border-b-2 border-black' : 'text-slate-500'}`}>3. Vercel</button>
              </div>

              {/* === TAB 4: SUPABASE (Complete Rewrite) === */}
              {activeTab === 'supabase' && (
                <div className="p-8 animate-fade-in">
                    <div className="mb-8 border-b border-slate-100 pb-8">
                       <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest mb-4">Start Here</div>
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
                                                <div className="text-xs text-slate-500">In the list that appears, find <strong>API</strong> (usually the 2nd or 3rd item).</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded text-slate-600"><Copy size={18} /></div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">3. Copy the "Project URL"</div>
                                                <div className="text-xs text-slate-500 mb-1">It looks like: <code>https://xyz...supabase.co</code></div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="bg-slate-100 p-2 rounded text-slate-600"><Lock size={18} /></div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">4. Copy the "anon" / "public" Key</div>
                                                <div className="text-xs text-slate-500 mb-1">It is a long string of random letters.</div>
                                                <div className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded inline-block">
                                                    WARNING: Do NOT use the service_role key. Only use ANON.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-slate-600 mt-4">
                                    <strong>Keep this tab open</strong>. You will paste these keys into Vercel in Step 5.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg animate-pulse">3</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Run the "Magic" Setup Script</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    Instead of creating tables manually, we will run a standard SQL script. This builds the <strong>Database Tables</strong>, enables <strong>Realtime</strong>, creates the <strong>Storage Bucket</strong>, and fixes <strong>Permissions</strong> automatically.
                                </p>
                                
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                                    <div className="flex items-center gap-2 text-blue-800 font-bold uppercase text-xs mb-2">
                                        <PlayCircle size={16} /> Instructions
                                    </div>
                                    <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-900">
                                        <li>In Supabase Sidebar, click <strong>SQL Editor</strong> (Icon looks like a command prompt <code>&gt;_</code>).</li>
                                        <li>Click <strong>"New Query"</strong>.</li>
                                        <li><strong>Copy</strong> the code block below.</li>
                                        <li><strong>Paste</strong> it into the SQL Editor.</li>
                                        <li>Click the <strong>RUN</strong> button (Bottom right).</li>
                                        <li>Look for "Success" in the results area.</li>
                                    </ol>
                                </div>

                                <CodeBlock 
                                id="supabase-sql"
                                label="SQL SETUP SCRIPT (COPY ALL)"
                                code={`-- 0. REFRESH SCHEMA CACHE (Fixes "Cloud not find column" errors)
NOTIFY pgrst, 'reload schema';

-- 1. KIOSKS TABLE SETUP
create table if not exists public.kiosks (
  id text primary key,
  name text,
  device_type text,
  status text,
  last_seen timestamp with time zone,
  wifi_strength int,
  ip_address text,
  version text
);

-- Force add columns (Fixes Schema Drift)
alter table public.kiosks add column if not exists assigned_zone text default 'Unassigned';
alter table public.kiosks add column if not exists location_description text default 'Newly Registered';
alter table public.kiosks add column if not exists request_snapshot boolean default false;
alter table public.kiosks add column if not exists restart_requested boolean default false;
alter table public.kiosks add column if not exists snapshot_url text;

-- 2. STORE CONFIG TABLE
create table if not exists public.store_config (
  id bigint primary key,
  data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Data (Only if empty)
insert into public.store_config (id, data) 
select 1, '{}'::jsonb
where not exists (select 1 from public.store_config where id = 1);

-- 3. STORAGE SETUP (Create 'kiosk-media' bucket)
insert into storage.buckets (id, name, public)
values ('kiosk-media', 'kiosk-media', true)
on conflict (id) do nothing;

-- 4. PERMISSIONS & POLICIES (Fixes "Registration Failed" & "Saving Error")
-- We drop existing policies to prevent conflicts, then re-create them.

-- A. Storage Policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Kiosk Public Read" on storage.objects;
drop policy if exists "Kiosk Public Insert" on storage.objects;
drop policy if exists "Kiosk Public Update" on storage.objects;

create policy "Kiosk Public Read" on storage.objects for select using ( bucket_id = 'kiosk-media' );
create policy "Kiosk Public Insert" on storage.objects for insert with check ( bucket_id = 'kiosk-media' );
create policy "Kiosk Public Update" on storage.objects for update using ( bucket_id = 'kiosk-media' );

-- B. Table Policies (CRITICAL FOR REGISTRATION)
alter table public.kiosks enable row level security;
alter table public.store_config enable row level security;

drop policy if exists "Enable access to all users" on public.kiosks;
create policy "Enable access to all users" on public.kiosks for all using (true) with check (true);

drop policy if exists "Enable access to all users" on public.store_config;
create policy "Enable access to all users" on public.store_config for all using (true) with check (true);

-- Grant permissions to anon role (just in case)
grant all on table public.kiosks to anon;
grant all on table public.store_config to anon;
grant all on sequence public.store_config_id_seq to anon;

-- 5. ENABLE REALTIME (Safe Mode)
-- This allows the Kiosk to "listen" for new commands like Snapshot/Restart
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'store_config') then
    alter publication supabase_realtime add table public.store_config;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'kiosks') then
    alter publication supabase_realtime add table public.kiosks;
  end if;
end $$;`}
                                />
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">4</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Verify Storage Bucket (Manual Check)</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    Sometimes the script runs, but the bucket isn't explicitly set to "Public". Let's double check.
                                </p>
                                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-800">
                                        <FolderOpen size={16} /> 1. Go to <strong>Storage</strong> in the Supabase sidebar.
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-800">
                                        <Check size={16} /> 2. You should see a bucket named <code>kiosk-media</code>.
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-800">
                                        <Lock size={16} /> 3. Next to "Public" label, ensure it says <strong>Public</strong> (Not Private).
                                    </div>
                                    <div className="text-xs text-slate-500 italic pl-6 pt-2">
                                        If it doesn't exist: Click "New Bucket", name it <code>kiosk-media</code>, and toggle "Public Bucket" to ON.
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Step 5 */}
                         <div className="flex gap-6">
                            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-lg">5</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Connect to Vercel (Next Step)</h3>
                                <p className="text-slate-600 mb-4 text-sm">
                                    Now that Supabase is ready, go to the <strong>Vercel Tab</strong> (Step 3 on the left) to link them together.
                                </p>
                                <button onClick={() => setActiveTab('vercel')} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold uppercase text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors">
                                    Go to Vercel Guide <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
              )}

              {/* === TAB 1: LOCAL SERVER === */}
              {activeTab === 'local' && (
                <div className="p-8 animate-fade-in">
                   <div className="mb-10 pb-8 border-b border-slate-100">
                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 1: The Engine</div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Setting up the PC Hub</h2>
                      <p className="text-slate-600 leading-relaxed text-lg mb-4">
                        We will turn your personal computer into a professional server. It will host the database, serve the website to your tablets, and manage the fleet.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <strong>Why do we need this?</strong><br/>
                        Normally, websites live on the internet ("Cloud"). But if your internet goes down, your Kiosk stops working. This "Local Hub" ensures your shop runs 100% offline using your PC as the brain.
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
                               <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-slate-400 text-sm mb-4">
                                  <strong>Action:</strong> Create a folder named <code>server</code> in your project root. Inside it, create <code>index.js</code>. Copy the code below exactly.
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
// Increased limit for large video uploads (Base64 fallback)
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
                   </div>
                </div>
              )}

              {/* === TAB 2: SPLIT APP === */}
              {activeTab === 'split' && (
                <div className="p-8 animate-fade-in">
                    <div className="mb-10 pb-8 border-b border-slate-100">
                      <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest mb-4">Step 2: Build & Structure</div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">The Split Architecture</h2>
                      <p className="text-slate-600 leading-relaxed text-lg mb-4">
                         "Split App" means we separate the <strong>Frontend</strong> (What you see on screen) from the <strong>Backend</strong> (Where data is saved). This is standard for professional apps.
                      </p>
                    </div>

                    <div className="space-y-8">
                        <div>
                             <h3 className="font-bold text-slate-900 text-lg mb-2">1. Project Folder Structure</h3>
                             <p className="text-sm text-slate-600 mb-4">Make sure your files are organized exactly like this, or the server won't find the website files.</p>
                             <CodeBlock 
                                id="folder-structure"
                                code={`/my-kiosk-project
  /dist           <-- Built frontend code (Auto-generated by build command)
  /src            <-- React source code (Where you edit the app)
  /server         <-- The Node.js backend (Created in Step 1)
     index.js
     db.json      <-- Your local database (Auto-created when you save)
  package.json
  vite.config.ts`}
                             />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">2. Building the Frontend</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Browsers can't read React code directly. We must "compile" it into standard HTML.
                            </p>
                            <CodeBlock 
                                id="build-cmd"
                                label="Terminal Command"
                                code={`npm run build`}
                            />
                            <p className="text-xs text-slate-500 mt-2">This command uses Vite to create the <code>dist</code> folder. Run this every time you change the visual code.</p>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">3. Running the Combo</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Now we start the server, which serves the <code>dist</code> folder to your tablets.
                            </p>
                            <CodeBlock 
                                id="run-server"
                                label="Terminal Command"
                                code={`node server/index.js`}
                            />
                            <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm mt-4 border border-green-200">
                                <strong>Success!</strong> You can now access your kiosk at <code>http://localhost:3000</code>.
                                <br/><br/>
                                <strong>Connecting Tablets:</strong>
                                <br/>
                                1. Find your PC's IP Address (Open CMD/Terminal, type <code>ipconfig</code> or <code>ifconfig</code>).
                                <br/>
                                2. On the tablet, open Chrome and go to <code>http://YOUR_PC_IP:3000</code>.
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* === TAB 3: VERCEL === */}
              {activeTab === 'vercel' && (
                <div className="p-8 animate-fade-in">
                    <div className="mb-10 pb-8 border-b border-slate-100">
                      <div className="inline-block px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-widest mb-4">Step 3: Cloud Hosting</div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Deploying to Vercel</h2>
                      <p className="text-slate-600 leading-relaxed text-lg mb-4">
                         Vercel puts your kiosk on the public internet. This allows you to manage the kiosk from home, while the kiosk sits in the shop.
                      </p>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">1. Install Vercel Tool</h3>
                            <p className="text-sm text-slate-600 mb-2">This tool lets you upload your code from the terminal.</p>
                            <CodeBlock 
                                id="vercel-install"
                                label="Terminal Command"
                                code={`npm i -g vercel`}
                            />
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2">2. Login & Deploy</h3>
                            <p className="text-sm text-slate-600 mb-2">Run these commands in your project root folder:</p>
                            <CodeBlock 
                                id="vercel-deploy"
                                label="Terminal Command"
                                code={`vercel login
vercel --prod`}
                            />
                            <p className="text-xs text-slate-500 mt-2">Follow the prompts. Accept defaults (Y) for most questions.</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-sm">
                            <h3 className="font-bold text-yellow-900 text-sm uppercase mb-2">Important: Connecting Supabase</h3>
                            <p className="text-sm text-yellow-800 mb-2">
                                For the website to talk to your database, you must give Vercel the "keys".
                            </p>
                            <ol className="list-decimal pl-5 text-sm text-yellow-800 space-y-2">
                                <li>Go to your Vercel Dashboard in your browser.</li>
                                <li>Select your Project &rarr; Settings &rarr; <strong>Environment Variables</strong>.</li>
                                <li>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> (Get this from Supabase Settings).</li>
                                <li>Add <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (Get this from Supabase Settings).</li>
                                <li><strong>Redeploy</strong> your app for changes to take effect.</li>
                            </ol>
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
