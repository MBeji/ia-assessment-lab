// Prefetch chart components chunks in background to improve navigation speed to /resultats.
// Called from Questionnaire after initial render.
let _done = false;
export function prefetchCharts() {
  if (_done) return; _done = true;
  // Fire and forget dynamic imports; bundler will create separate chunks already.
  // We chain .catch to avoid unhandled rejections if user offline.
  import('@/components/charts/ScoreGauge').catch(()=>{});
  import('@/components/charts/RadarByCategory').catch(()=>{});
  import('@/components/charts/BarByDepartment').catch(()=>{});
  import('@/components/charts/HeatmapQuestions').catch(()=>{});
}

export function schedulePrefetchCharts(delayMs: number = 800) {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(()=> prefetchCharts());
  } else {
    setTimeout(()=> prefetchCharts(), delayMs);
  }
}
