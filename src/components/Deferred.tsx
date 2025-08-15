import React, { useEffect, useRef, useState } from 'react';

/**
 * Deferred mounts children only when it becomes (partially) visible in viewport.
 * Reduces initial mobile cost.
 */
export const Deferred: React.FC<{ children: React.ReactNode; height?: number | string; rootMargin?: string }>= ({ children, height=260, rootMargin='120px' }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(()=> {
    if (visible) return; // already shown
    const el = ref.current; if(!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      });
    }, { root: null, threshold: 0.05, rootMargin });
    obs.observe(el);
    return ()=> obs.disconnect();
  }, [visible, rootMargin]);
  return <div ref={ref} style={!visible ? { minHeight: typeof height==='number'? `${height}px`: height } : undefined}>{visible ? children : <div className="flex items-center justify-center text-[10px] text-muted-foreground h-full w-full animate-pulse">Chargement différé…</div>}</div>;
};
