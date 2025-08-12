export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJSON(data: unknown, filename = 'export.json') {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function toCSV(rows: any[]): string {
  if (!rows.length) return '';
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return `"${s}` + `"`;
  };
  const lines = [headers.join(',')];
  rows.forEach(r => {
    lines.push(headers.map(h => esc(r[h])).join(','));
  });
  return lines.join('\n');
}

export function exportCSV(rows: any[], filename = 'export.csv') {
  const csv = toCSV(rows);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}
