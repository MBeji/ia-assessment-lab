import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

// Chargement depuis public/usecases.json pour refléter exactement la source

interface SortState { key: string | null; dir: 'asc' | 'desc'; }

const badgeClasses = (v: string) => {
  switch(v){
    case 'High': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    case 'Medium': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
    case 'Low': return 'bg-slate-200 text-slate-700 ring-1 ring-slate-300';
    default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  }
};
const complexityClasses = (v: string) => {
  switch(v){
    case 'High': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
    case 'Medium': return 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200';
    case 'Low': return 'bg-sky-100 text-sky-700 ring-1 ring-sky-200';
    default: return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
  }
};

const normalizeLevel = (v: any): 'High' | 'Medium' | 'Low' | string => {
  if (!v) return '';
  const s = String(v).toLowerCase();
  if (s.startsWith('h')) return 'High';
  if (s.startsWith('m')) return 'Medium';
  if (s.startsWith('l')) return 'Low';
  return String(v);
};

const normalizeItems = (arr: any[]): any[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(Boolean)
    .map((r: any) => ({
      department: r.department ?? '',
      use_case: r.use_case ?? r.title ?? r.name ?? '',
      description: r.description ?? r.details ?? '',
      roi_potential: normalizeLevel(r.roi_potential ?? r.roi ?? r.value_added_level),
      complexity: normalizeLevel(r.complexity),
      examples: Array.isArray(r.examples) ? r.examples : [],
      impact: Array.isArray(r.impact) ? r.impact : [],
    }))
    .filter((r) => r.department && r.use_case);
};

const ReferenceUseCases: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<'table'|'matrix'>('table');

  useEffect(() => {
    let alive = true;
    const tryPaths = async () => {
      const paths = ['/ai_usecases.json', '/usecases.json'];
      for (const p of paths) {
        try {
          const resp = await fetch(p);
          if (!resp.ok) continue;
          const json = await resp.json();
          const items = normalizeItems(json);
          if (items.length) {
            if (alive) setData(items);
            return;
          }
        } catch (_) {
          // continue
        }
      }
      if (alive) setData([]);
    };
    tryPaths();
    return () => {
      alive = false;
    };
  }, []);

  const departments = useMemo(()=> Array.from(new Set((data||[]).map((d:any) => d.department))).sort(), [data]);

  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    let rows = (data||[]).filter((r:any) => {
      const hay = [r.department, r.use_case, r.description, ...(r.examples||[]), ...(r.impact||[])].join(' ').toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchDep = !dept || r.department === dept;
      return matchQ && matchDep;
    });
    if (sort.key) {
      rows = [...rows].sort((a:any,b:any)=>{
        const av = (a[sort.key!]||'').toString().toLowerCase();
        const bv = (b[sort.key!]||'').toString().toLowerCase();
        if(av < bv) return sort.dir==='asc' ? -1 : 1;
        if(av > bv) return sort.dir==='asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, search, dept, sort]);

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const onImportClick = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      const items = normalizeItems(json);
      setData(items);
      // reset filters to show everything
      setSearch('');
      setDept('');
      setSort({ key: null, dir: 'asc' });
    } catch (err) {
      console.error('Invalid JSON file', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'usecases.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if(!data.length) return;
    const headers = ['department','use_case','description','roi_potential','complexity','examples','impact'];
    const rows = data.map(r => headers.map(h => {
      const val = h==='examples'? (r.examples||[]).join(' | '): h==='impact'? (r.impact||[]).join(' | '): (r as any)[h] || '';
      const s = String(val).replace(/"/g,'""');
      return '"'+s+'"';
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='usecases.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // Matrix data organization
  const matrixBuckets = useMemo(()=>{
    const bucket = (roi:string, cx:string) => `${roi||''}__${cx||''}`;
    const map: Record<string, any[]> = {};
    filtered.forEach(r => {
      const k = bucket(r.roi_potential, r.complexity);
      (map[k] = map[k]||[]).push(r);
    });
    return map;
  }, [filtered]);

  const roiLevels: string[] = ['High','Medium','Low'];
  const cxLevels: string[] = ['Low','Medium','High']; // complexity axis from low to high horizontally

  return (
    <Layout>
      <SEO title="SynapFlow – Cas d'Usage IA" description="Référentiel filtrable de cas d'usage IA" canonical={window.location.origin + '/reference/usecases'} />
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cas d'Usage IA</h1>
          <p className="text-sm text-muted-foreground">Filtrez, recherchez et triez les opportunités par département.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-end w-full md:w-auto">
          <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Recherche mots-clés..." className="h-10 rounded-md border px-3 text-sm w-full md:w-64 bg-background" />
          <select value={dept} onChange={e=> setDept(e.target.value)} className="h-10 rounded-md border px-3 text-sm bg-background">
            <option value="">Tous départements</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(search || dept) && <button onClick={()=> { setSearch(''); setDept(''); setSort({ key:null, dir:'asc'}); }} className="h-10 px-3 rounded-md border text-sm bg-muted hover:bg-muted/80">Réinitialiser</button>}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={onImportClick} className="h-10 px-3 rounded-md border text-sm bg-primary text-primary-foreground hover:opacity-90">Importer JSON</button>
            <button onClick={exportJSON} className="h-10 px-3 rounded-md border text-sm bg-background hover:bg-accent">Exporter JSON</button>
            <button onClick={exportCSV} className="h-10 px-3 rounded-md border text-sm bg-background hover:bg-accent">Exporter CSV</button>
            <button onClick={()=> setView(v=> v==='table'?'matrix':'table')} className="h-10 px-3 rounded-md border text-sm bg-background hover:bg-accent">Vue {view==='table'? 'Matrice':'Table'}</button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={onFileChange} />
          </div>
        </div>
      </div>
      {view==='table' && (
        <div className="overflow-auto rounded-lg border bg-background shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide sticky top-0 z-10">
              <tr>
                {[
                  ['department','Département'],
                  ['use_case','Cas d’usage'],
                  ['description','Description'],
                  ['roi_potential','ROI potentiel'],
                  ['complexity','Complexité'],
                  ['examples','Exemples'],
                  ['impact','Impact']
                ].map(([key,label]) => (
                  <th key={key} onClick={()=> toggleSort(key as string)} className="px-3 py-2 text-left font-semibold cursor-pointer select-none">
                    <span>{label}</span>{' '}
                    {sort.key===key && <span className="text-primary">{sort.dir==='asc' ? '▲':'▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length===0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground">Aucun cas d’usage ne correspond aux filtres.</td></tr>
              )}
              {filtered.map((r,i) => (
                <tr key={i} className={i%2===0? 'bg-background':'bg-muted/30'}>
                  <td className="align-top px-3 py-2 font-medium">{r.department}</td>
                  <td className="align-top px-3 py-2">{r.use_case}</td>
                  <td className="align-top px-3 py-2 text-muted-foreground max-w-[340px]">{r.description}</td>
                  <td className="align-top px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClasses(r.roi_potential)}`}>{r.roi_potential}</span></td>
                  <td className="align-top px-3 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${complexityClasses(r.complexity)}`}>{r.complexity}</span></td>
                  <td className="align-top px-3 py-2"><ul className="list-disc list-inside space-y-0.5 text-muted-foreground">{(r.examples||[]).map((e:string,j:number)=> <li key={j}>{e}</li>)}</ul></td>
                  <td className="align-top px-3 py-2"><ul className="list-disc list-inside space-y-0.5 text-muted-foreground">{(r.impact||[]).map((e:string,j:number)=> <li key={j}>{e}</li>)}</ul></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view==='matrix' && (
        <div className="rounded-lg border bg-background shadow-sm p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Matrice ROI vs Complexité</h2>
            <span className="text-[11px] text-muted-foreground">Cases: {filtered.length}</span>
          </div>
          <div className="grid" style={{gridTemplateColumns: `160px repeat(${cxLevels.length}, 1fr)`}}>
            <div></div>
            {cxLevels.map(cx => <div key={cx} className="text-center text-[11px] font-medium pb-1">Complexité {cx}</div>)}
            {roiLevels.map(roi => (
              <React.Fragment key={roi}>
                <div className="flex items-center text-[11px] font-medium pr-2 justify-end">ROI {roi}</div>
                {cxLevels.map(cx => {
                  const cellKey = `${roi}__${cx}`;
                  const items = matrixBuckets[cellKey] || [];
                  return (
                    <div key={cellKey} className="min-h-[120px] border-l border-t p-1 flex flex-col gap-1 bg-muted/30">
                      <div className="text-[10px] text-muted-foreground">{items.length || 0}</div>
                      <div className="flex flex-col gap-1 overflow-auto">
                        {items.slice(0,6).map((it:any,idx:number)=>(
                          <div key={idx} className="rounded bg-background border px-1 py-0.5 text-[10px] leading-tight hover:bg-accent" title={it.description}>{it.use_case}</div>
                        ))}
                        {items.length>6 && <div className="text-[10px] text-center text-muted-foreground">+{items.length-6} autres</div>}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-4 text-[10px] text-muted-foreground flex flex-wrap gap-4">
            <span>Légende: chaque cellule regroupe les cas selon rendement (ligne) et complexité (colonne).</span>
            <span>Astuce: revenir à la table pour exporter le détail.</span>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReferenceUseCases;
