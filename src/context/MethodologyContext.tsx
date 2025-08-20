import React, { createContext, useContext, useEffect, useState } from 'react';

export interface MethodologySection {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  version: number;
}

interface MethodologyContextValue {
  sections: MethodologySection[];
  updateSection: (id: string, mut: (prev: MethodologySection)=> MethodologySection) => void;
  addSection: (title?: string) => string;
  resetDefaults: () => void;
}

const DEFAULT_SECTIONS: Omit<MethodologySection, 'updatedAt' | 'version'>[] = [
  { id: 'objectifs', title: 'Objectifs', content: 'Décrire les objectifs stratégiques de l’audit (ex: cartographier capacités, prioriser investissement, aligner parties prenantes).'},
  { id: 'perimetre', title: 'Périmètre & Parties Prenantes', content: 'Lister domaines, départements inclus, parties prenantes, sponsors, contributeurs.'},
  { id: 'etapes', title: 'Étapes', content: '1. Préparation\n2. Collecte réponses\n3. Consolidation & scoring\n4. Analyse & synthèse\n5. Restitution exécutive\n6. Plan d’action\n7. Suivi & ré-audit.'},
  { id: 'roles', title: 'Rôles (RACI simplifié)', content: 'Assesseur, Contributeurs (départements), Sponsor, Validation (direction), PMO / Suivi.'},
  { id: 'artefacts', title: 'Artefacts', content: 'Scorecard, Heatmaps, Synthèse exécutive, Plan priorisé, Journal des décisions.'},
  { id: 'journal', title: 'Journal / Notes', content: 'Espace libre pour consignation des points saillants, hypothèses, risques.'},
];

const STORAGE_KEY = 'methodology-doc-v1';

const MethodologyContext = createContext<MethodologyContextValue | undefined>(undefined);

export const MethodologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<MethodologySection[]>([]);

  useEffect(()=> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { const parsed: MethodologySection[] = JSON.parse(raw); setSections(parsed); return; } catch {}
    }
    const init = DEFAULT_SECTIONS.map(s => ({ ...s, updatedAt: new Date().toISOString(), version: 1 }));
    setSections(init);
  }, []);

  useEffect(()=> {
    if (sections.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const updateSection: MethodologyContextValue['updateSection'] = (id, mut) => {
    setSections(prev => prev.map(s => s.id===id ? (()=> { const next = mut(s); return { ...next, updatedAt: new Date().toISOString(), version: (s.version||1)+1 }; })() : s));
  };
  const addSection: MethodologyContextValue['addSection'] = (title='Nouvelle section') => {
    const id = 'sec_'+Math.random().toString(36).slice(2,8);
    setSections(prev => [...prev, { id, title, content: 'Contenu...', updatedAt: new Date().toISOString(), version: 1 }]);
    return id;
  };
  const resetDefaults = () => {
    if(!confirm('Réinitialiser la méthodologie aux valeurs par défaut ?')) return;
    const init = DEFAULT_SECTIONS.map(s => ({ ...s, updatedAt: new Date().toISOString(), version: 1 }));
    setSections(init);
  };

  return (
    <MethodologyContext.Provider value={{ sections, updateSection, addSection, resetDefaults }}>
      {children}
    </MethodologyContext.Provider>
  );
};

export const useMethodology = () => {
  const ctx = useContext(MethodologyContext);
  if(!ctx) throw new Error('useMethodology must be used within MethodologyProvider');
  return ctx;
};
