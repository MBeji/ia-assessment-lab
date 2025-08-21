import React, { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';

// Données statiques (peuvent être externalisées ultérieurement)
const DATA = [
  {"department":"Ressources Humaines","use_case":"Tri et présélection des CV","description":"Analyse automatique des CV et classement selon la fiche de poste via NLP.","roi_potential":"High","complexity":"Medium","examples":["Matching compétences-fiche de poste","Classement automatique des CV"],"impact":["Gain de temps recrutement 50%","Réduction erreurs sélection"]},
  {"department":"Ressources Humaines","use_case":"Parsing web (LinkedIn, CVthèques)","description":"Recherche automatisée de profils correspondant aux fiches de poste.","roi_potential":"High","complexity":"High","examples":["Extraction LinkedIn","Scraping CV avec filtres intelligents"],"impact":["Pipeline candidats élargi","Temps sourcing -40%"]},
  {"department":"Ressources Humaines","use_case":"Entretiens par IA","description":"Conducteur d'entretien automatisé et analyse vocale/émotionnelle.","roi_potential":"Medium","complexity":"High","examples":["Chatbot entretien structuré","Scoring des réponses candidat"],"impact":["Standardisation évaluation","Gain de temps RH 30%"]},
  {"department":"Ressources Humaines","use_case":"Chatbot salarié","description":"Réponses automatiques aux questions RH fréquentes (congés, paie, avantages).","roi_potential":"Medium","complexity":"Low","examples":["Chatbot RH sur Teams/Slack","FAQ automatisée"],"impact":["Charge RH -40%","Disponibilité 24/7"]},
  {"department":"Ressources Humaines","use_case":"Formation personnalisée","description":"Recommandations de parcours de formation via IA.","roi_potential":"Medium","complexity":"Medium","examples":["Adaptive learning","MOOC personnalisés"],"impact":["Meilleure montée en compétences","Satisfaction employés"]},
  {"department":"Ventes","use_case":"Chatbot commercial client","description":"Qualification automatique des prospects et réponses aux clients.","roi_potential":"High","complexity":"Medium","examples":["Assistant site web","Qualification leads via chatbot"],"impact":["Plus de leads traités","Cycle vente réduit"]},
  {"department":"Ventes","use_case":"Scoring prédictif des leads","description":"Priorisation automatique des prospects avec algorithmes prédictifs.","roi_potential":"High","complexity":"Medium","examples":["CRM avec scoring IA","Alertes sur leads chauds"],"impact":["Taux conversion +15%","Gain efficacité commerciale"]},
  {"department":"Ventes","use_case":"Génération de propositions commerciales","description":"Création automatique d’offres ou devis selon le client.","roi_potential":"High","complexity":"Medium","examples":["Auto-remplissage d’offres","Bundles IA recommandés"],"impact":["Gain temps 40%","Réactivité accrue"]},
  {"department":"Marketing","use_case":"Segmentation intelligente","description":"Regroupement clients automatisé selon comportements et données.","roi_potential":"High","complexity":"Medium","examples":["Clustering clients ML","Ciblage personnalisé"],"impact":["Conversion +15%","ROI marketing amélioré"]},
  {"department":"Marketing","use_case":"Personnalisation campagnes","description":"Création automatique de messages marketing adaptés à chaque cible.","roi_potential":"High","complexity":"Medium","examples":["Emails dynamiques IA","Publicités personnalisées"],"impact":["Taux clic +20%","Engagement client"]},
  {"department":"Marketing","use_case":"Analyse des sentiments","description":"Surveillance réseaux sociaux pour identifier avis et tendances.","roi_potential":"Medium","complexity":"Low","examples":["Monitoring Twitter/LinkedIn","Tableau bord image"],"impact":["Réaction rapide aux crises","Amélioration marque"]},
  {"department":"Marketing","use_case":"Génération de contenu","description":"Création automatique de posts, blogs, publicités via IA générative.","roi_potential":"High","complexity":"Low","examples":["Posts LinkedIn auto","Bannières IA"],"impact":["Gain temps 60%","Créativité augmentée"]},
  {"department":"Achats","use_case":"Rédaction RFP","description":"Génération automatique d’appels d’offres optimisés.","roi_potential":"High","complexity":"Medium","examples":["Documents standards IA","Appels d’offres structurés"],"impact":["Gain temps 50%","Meilleur cadrage fournisseurs"]},
  {"department":"Achats","use_case":"Analyse réponses RFP","description":"Évaluation IA des propositions fournisseurs.","roi_potential":"High","complexity":"Medium","examples":["Scoring réponses","Comparaison objective offres"],"impact":["Sélection plus fiable","Gain temps analyse"]},
  {"department":"Achats","use_case":"Réponse IA aux appels d'offres","description":"Préparation automatique des propositions commerciales.","roi_potential":"High","complexity":"Medium","examples":["Auto-remplissage réponses","Qualité homogène"],"impact":["Temps réponse -60%","Standardisation documents"]},
  {"department":"Finance","use_case":"Automatisation comptable","description":"Lecture factures, saisie et rapprochement automatisés.","roi_potential":"High","complexity":"Low","examples":["OCR factures","RPA compta"],"impact":["Gain temps 60%","Moins erreurs saisie"]},
  {"department":"Finance","use_case":"Prévisions financières IA","description":"Projection de cash-flow et budgets via ML.","roi_potential":"High","complexity":"Medium","examples":["Forecast automatisé","Planification budgétaire IA"],"impact":["Visibilité accrue","Meilleure allocation ressources"]},
  {"department":"Finance","use_case":"Détection de fraude","description":"Identification transactions suspectes avec IA.","roi_potential":"High","complexity":"High","examples":["Alertes temps réel","Analyse pattern suspect"],"impact":["Pertes réduites","Conformité accrue"]},
  {"department":"Opérations","use_case":"Maintenance prédictive","description":"Prévision des pannes machines via capteurs IoT + IA.","roi_potential":"High","complexity":"High","examples":["Surveillance production","Alertes panne anticipées"],"impact":["Moins arrêts imprévus","Coûts maintenance réduits"]},
  {"department":"Opérations","use_case":"Optimisation logistique","description":"Planification des itinéraires et gestion stock via IA.","roi_potential":"High","complexity":"Medium","examples":["Réduction coûts transport","Stocks optimisés"],"impact":["Coûts -15%","Délais livraison améliorés"]},
  {"department":"Direction","use_case":"Analyse stratégique IA","description":"Tableaux de bord et prévisions automatisés.","roi_potential":"High","complexity":"Medium","examples":["Synthèse KPIs","Simulation scénarios"],"impact":["Décisions plus rapides","Vision long terme"]}
];

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

  const departments = useMemo(()=> Array.from(new Set(DATA.map(d => d.department))).sort(), []);

  const filtered = useMemo(()=> {
    const q = search.trim().toLowerCase();
    let rows = DATA.filter(r => {
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
