import { Layout } from '@/components/Layout';
import { SEO } from '@/components/SEO';
import { useMethodology } from '@/context/MethodologyContext';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { marked as markedFn } from 'marked';
import DOMPurify from 'dompurify';
import { useEffect, useRef } from 'react';

// Simple markdown rendering wrapper (types for marked are minimal custom)
const renderMarkdown = (src: string) => {
  // Preserve mermaid code fences; post-processing replaces them
  return markedFn(src) as string;
};

const Methodologie = () => {
  const { sections, updateSection, addSection, resetDefaults } = useMethodology();
  const [active, setActive] = useState<string | null>(sections[0]?.id || null);
  const current = sections.find(s=> s.id===active);
  const [showPreview, setShowPreview] = useState(true);
  const rendered = useMemo(()=> {
    if(!current) return '';
    const raw = renderMarkdown(current.content || '');
    return DOMPurify.sanitize(raw, { ADD_TAGS: ['span'], ADD_ATTR: ['class'] });
  }, [current?.content, current?.id, current?.version]);

  const previewRef = useRef<HTMLDivElement | null>(null);

  // Deferred mermaid rendering: load mermaid only if needed & in preview mode
  useEffect(()=> {
    if(!showPreview) return;
    if(!previewRef.current) return;
    const hasMermaid = previewRef.current.querySelector('code.language-mermaid');
    if(!hasMermaid) return;
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
        const blocks = previewRef.current?.querySelectorAll('code.language-mermaid');
        if(!blocks) return;
        let i = 0;
        for (const el of Array.from(blocks)) {
          if(cancelled) return;
            const code = el.textContent || '';
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-diagram my-4';
            // Replace parent <pre>
            const pre = el.closest('pre');
            if(pre && pre.parentNode){
              pre.parentNode.replaceChild(wrapper, pre);
            } else {
              el.parentElement?.replaceWith(wrapper);
            }
            try {
              const { svg } = await mermaid.render('mmd_'+(++i)+'_'+Date.now(), code);
              wrapper.innerHTML = svg;
            } catch(err){
              wrapper.innerHTML = `<div class='text-xs text-destructive font-mono whitespace-pre-wrap'>Erreur Mermaid: ${(err as Error).message}</div>`;
            }
        }
      } catch(err){
        console.warn('Mermaid non chargé', err);
      }
    })();
    return () => { cancelled = true; };
  }, [rendered, showPreview]);

  // showPreview moved above

  return (
    <Layout>
      <SEO title="Méthodologie" description="Mode opératoire d'audit" canonical={window.location.origin+"/methodologie"} />
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 flex-shrink-0 border rounded p-3 bg-muted/30 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Sections</h2>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={()=> { const id = addSection(); setActive(id); }}>+</Button>
          </div>
          <ul className="space-y-1">
            {sections.map(s => (
              <li key={s.id}>
                <button onClick={()=> setActive(s.id)} className={`w-full text-left px-2 py-1 rounded text-[11px] border ${active===s.id? 'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-accent'}`}>{s.title}</button>
              </li>
            ))}
          </ul>
          <div className="pt-2 flex flex-col gap-2">
            <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={resetDefaults}>Réinitialiser</Button>
            {current && <div className="text-[10px] text-muted-foreground leading-tight">Maj: {new Date(current.updatedAt).toLocaleString()} · v{current.version}</div>}
          </div>
        </aside>
        <main className="flex-1 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-semibold">Méthodologie d’audit</h1>
            {current && <span className="text-[11px] text-muted-foreground">Section: {current.title}</span>}
          </div>
          {!current && <p className="text-sm text-muted-foreground">Sélectionnez ou créez une section.</p>}
          {current && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="w-full border rounded px-3 h-9 text-sm font-medium"
                  value={current.title}
                  onChange={e=> updateSection(current.id, prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de section"
                />
                <Button size="sm" variant={showPreview? 'secondary':'outline'} className="h-9" onClick={()=> setShowPreview(v=> !v)}>
                  {showPreview? 'Édition seule':'Prévisualiser'}
                </Button>
              </div>
              <div className={`grid gap-4 ${showPreview? 'lg:grid-cols-2':''}`}>
                <div className="flex flex-col">
                  <label className="text-[11px] font-medium mb-1 text-muted-foreground">Markdown</label>
                  <textarea
                    className="w-full border rounded p-3 text-sm font-mono leading-snug min-h-[340px] bg-background resize-y"
                    value={current.content}
                    spellCheck={false}
                    onChange={e=> updateSection(current.id, prev => ({ ...prev, content: e.target.value }))}
                    placeholder={"Ex: ## Objectif\nDécrire ..."}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">{current.content.length} caractères</div>
                </div>
                {showPreview && (
                  <div className="flex flex-col">
                    <label className="text-[11px] font-medium mb-1 text-muted-foreground">Aperçu</label>
        <div ref={previewRef} className="prose prose-sm max-w-none dark:prose-invert border rounded p-4 bg-background overflow-auto min-h-[340px]" dangerouslySetInnerHTML={{ __html: rendered }} />
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-8 border-t pt-4 text-[11px] text-muted-foreground space-y-2">
            <p>Astuce: utilisez la section “Journal” pour consigner décisions, hypothèses et risques rencontrés au fil de l’audit.</p>
      <p>Utilisez un bloc de code Markdown ```mermaid pour insérer un diagramme (flowchart, sequence, gantt...). Rendu différé pour performance.</p>
      <p>Prochaines étapes possibles : versionning diff, signatures hash.</p>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Methodologie;
