import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

// Chargement depuis public/usecases.json pour refléter exactement la source
const [data, setData] = useState<any[]>([]);
useEffect(()=>{
  fetch('/usecases.json').then(r=> r.ok? r.json(): []).then((j:any)=> {
    if (Array.isArray(j) && j.length) setData(j); else setData([]);
  }).catch(()=> setData([]));
}, []);

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

const ReferenceUseCases: React.FC = () => {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });

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
  }, [search, dept, sort]);

  const toggleSort = (key: string) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

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
        </div>
      </div>
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
                <td className="align-top px-3 py-2"><ul className="list-disc list-inside space-y-0.5 text-muted-foreground">{r.examples.map((e:string,j:number)=> <li key={j}>{e}</li>)}</ul></td>
                <td className="align-top px-3 py-2"><ul className="list-disc list-inside space-y-0.5 text-muted-foreground">{r.impact.map((e:string,j:number)=> <li key={j}>{e}</li>)}</ul></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default ReferenceUseCases;
