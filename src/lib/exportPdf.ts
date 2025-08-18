// Lazy PDF export using dynamic imports to avoid bundle bloat.
// Strategy: render a specific DOM container to canvas (html2canvas) then to PDF (jsPDF).
// Fallback: window.print if libraries fail.
export async function exportElementAsPDF(selector: string, filename = 'export.pdf') {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    console.warn('[pdf] Élément introuvable', selector);
    return;
  }
  try {
    const [html2canvasMod, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    const html2canvas = html2canvasMod.default;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: getComputedStyle(document.body).backgroundColor });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Fit height keeping ratio
    const ratio = canvas.height / canvas.width;
    const renderWidth = pageWidth - 40; // margin
    const renderHeight = renderWidth * ratio;
    if (renderHeight <= pageHeight - 40) {
      pdf.addImage(imgData, 'PNG', 20, 20, renderWidth, renderHeight, undefined, 'FAST');
    } else {
      // paginate
      let remainingCanvasHeight = canvas.height;
      let sliceY = 0;
      const pageCanvasHeight = ((pageHeight - 40) / renderWidth) * canvas.width; // height in canvas pixels that fits one page
      while (remainingCanvasHeight > 0) {
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(pageCanvasHeight, canvas.height - sliceY);
        const ctx = slice.getContext('2d');
        if (ctx) ctx.drawImage(canvas, 0, sliceY, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        const sliceData = slice.toDataURL('image/png');
        const sliceRenderHeight = (slice.height / canvas.width) * renderWidth;
        pdf.addImage(sliceData, 'PNG', 20, 20, renderWidth, sliceRenderHeight, undefined, 'FAST');
        sliceY += slice.height;
        remainingCanvasHeight -= slice.height;
        if (sliceY < canvas.height) pdf.addPage();
      }
    }
    pdf.save(filename);
  } catch (e) {
    console.warn('[pdf] Échec génération PDF, fallback impression', e);
    window.print();
  }
}
