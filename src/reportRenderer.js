/**
 * Report Renderer
 * Generates formatted HTML reports and PDF output (via html-pdf-node)
 */

const { REPORT_DEFINITIONS } = require('./reportDefinitions');

// ── Format helpers ─────────────────────────────────────────────────────────────

function formatCell(value, type) {
  if (value === null || value === undefined) return '—';
  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : value;
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('en-GB') : value;
    case 'date':
      return value || '—';
    case 'badge':
      return `<span class="badge badge-${value.toLowerCase().replace(/\s+/g, '-')}">${value}</span>`;
    default:
      return String(value);
  }
}

function formatSummaryValue(col, stat, val) {
  const colDef = col;
  if (colDef.type === 'currency') {
    return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  }
  return Number(val).toLocaleString('en-GB', { maximumFractionDigits: 1 });
}

// ── HTML Report ────────────────────────────────────────────────────────────────

function renderHTMLReport(definition, result, parameters) {
  const { title, columns, description } = definition;
  const { rows, summary } = result;

  const paramDisplay = Object.entries(parameters)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `<span class="param-tag"><strong>${k}:</strong> ${v}</span>`)
    .join(' ');

  const headerRow = Object.entries(columns)
    .map(([, col]) => `<th style="width:${col.width}">${col.label}</th>`)
    .join('');

  const dataRows = rows.map((row, i) => {
    const cells = Object.entries(columns)
      .map(([key, col]) => `<td>${formatCell(row[key], col.type)}</td>`)
      .join('');
    return `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">${cells}</tr>`;
  }).join('');

  // Summary footer
  const summaryRows = Object.entries(summary).map(([field, stats]) => {
    const colDef = columns[field];
    if (!colDef) return '';
    return `
      <tr class="summary-row">
        <td colspan="${Object.keys(columns).indexOf(field)}" class="summary-label">
          ${colDef.label} Summary:
        </td>
        ${Object.entries(stats).map(([stat, val]) =>
          `<td class="summary-val"><span class="stat-label">${stat.toUpperCase()}</span><br>${formatSummaryValue(colDef, stat, val)}</td>`
        ).join('')}
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 12px;
    color: #1a1a2e;
    background: #f5f5f0;
    padding: 32px;
  }

  .report-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #ddd;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  /* ── Header ── */
  .report-header {
    background: #1a1a2e;
    color: #fff;
    padding: 28px 32px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .report-header-left .company { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #f0a500; font-weight: 600; margin-bottom: 6px; }
  .report-header-left h1 { font-size: 20px; font-weight: 700; line-height: 1.2; }
  .report-header-left .desc { font-size: 11px; color: #aaa; margin-top: 6px; }
  .report-header-right { text-align: right; font-size: 10px; color: #888; font-family: 'IBM Plex Mono', monospace; }
  .report-header-right .gen-at { color: #f0a500; }

  /* ── Parameters bar ── */
  .params-bar {
    background: #f8f4e8;
    border-bottom: 2px solid #f0a500;
    padding: 10px 32px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .params-bar .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 600; }
  .param-tag { background: #fff; border: 1px solid #ddd; padding: 3px 10px; border-radius: 3px; font-size: 11px; font-family: 'IBM Plex Mono', monospace; }

  /* ── Stats strip ── */
  .stats-strip {
    display: flex;
    border-bottom: 1px solid #eee;
    background: #fafafa;
  }
  .stat-box {
    flex: 1;
    padding: 14px 20px;
    border-right: 1px solid #eee;
    text-align: center;
  }
  .stat-box:last-child { border-right: none; }
  .stat-box .stat-n { font-size: 22px; font-weight: 700; color: #1a1a2e; font-family: 'IBM Plex Mono', monospace; }
  .stat-box .stat-l { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-top: 2px; }

  /* ── Table ── */
  .table-wrap { overflow-x: auto; padding: 0 0 0 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
  }

  thead tr {
    background: #1a1a2e;
    color: #fff;
  }
  thead th {
    padding: 11px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    white-space: nowrap;
  }

  tbody tr.even { background: #fff; }
  tbody tr.odd  { background: #f9f9f7; }
  tbody tr:hover { background: #fffbee; }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid #eee;
    vertical-align: middle;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 9px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'IBM Plex Mono', monospace;
  }
  .badge-delivered     { background: #d4edda; color: #155724; }
  .badge-in-progress   { background: #fff3cd; color: #856404; }
  .badge-pending       { background: #f8d7da; color: #721c24; }

  /* Summary rows */
  .summary-row { background: #e8f4fd !important; }
  .summary-row td { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; padding: 8px 12px; }
  .summary-label { font-weight: 700; color: #1a1a2e; }
  .summary-val { text-align: right; }
  .stat-label { font-size: 8px; color: #888; text-transform: uppercase; }

  /* Empty state */
  .empty-state {
    padding: 48px;
    text-align: center;
    color: #aaa;
  }

  /* Footer */
  .report-footer {
    padding: 16px 32px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #aaa;
    font-family: 'IBM Plex Mono', monospace;
    background: #fafafa;
  }

  @media print {
    body { background: #fff; padding: 0; }
    .report-wrapper { box-shadow: none; border: none; }
  }
</style>
</head>
<body>
<div class="report-wrapper">

  <!-- Header -->
  <div class="report-header">
    <div class="report-header-left">
      <div class="company">Didsbury Engineering · ERP Report System</div>
      <h1>${title}</h1>
      <div class="desc">${description}</div>
    </div>
    <div class="report-header-right">
      <div class="gen-at">GENERATED</div>
      <div>${new Date().toLocaleString('en-GB')}</div>
      <div style="margin-top:8px;">ROWS RETURNED</div>
      <div style="font-size:18px;font-weight:700;color:#fff;">${rows.length}</div>
    </div>
  </div>

  <!-- Parameters -->
  ${paramDisplay ? `
  <div class="params-bar">
    <span class="label">Filters applied:</span>
    ${paramDisplay}
  </div>` : `
  <div class="params-bar">
    <span class="label">No filters applied — showing all records</span>
  </div>`}

  <!-- Stats strip -->
  <div class="stats-strip">
    <div class="stat-box">
      <div class="stat-n">${rows.length}</div>
      <div class="stat-l">Total Rows</div>
    </div>
    ${Object.entries(summary).slice(0, 3).map(([field, stats]) => {
      const colDef = columns[field];
      if (!colDef) return '';
      const label = colDef.type === 'currency' ? `Total ${colDef.label}` : `Sum ${colDef.label}`;
      const val = colDef.type === 'currency'
        ? `£${Number(stats.sum).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
        : Number(stats.sum).toLocaleString('en-GB');
      return `<div class="stat-box"><div class="stat-n" style="font-size:16px;">${val}</div><div class="stat-l">${label}</div></div>`;
    }).join('')}
  </div>

  <!-- Data Table -->
  <div class="table-wrap">
    ${rows.length === 0 ? `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:12px;">📋</div>
        <div>No records match the selected filters.</div>
      </div>
    ` : `
    <table>
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody>
        ${dataRows}
      </tbody>
    </table>`}
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <div>Report Builder v1.0 · BIRT Analogue · Node.js</div>
    <div>© ${new Date().getFullYear()} Didsbury Engineering ERP System</div>
    <div>Confidential — Internal Use Only</div>
  </div>

</div>
</body>
</html>`;
}

// ── PDF Report ─────────────────────────────────────────────────────────────────

async function renderPDFReport(definition, result, parameters) {
  try {
    const htmlPdf = require('html-pdf-node');
    const html = renderHTMLReport(definition, result, parameters);
    const file = { content: html };
    const options = {
      format: 'A3',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    };
    return await htmlPdf.generatePdf(file, options);
  } catch (err) {
    throw new Error(`PDF generation failed: ${err.message}. Install html-pdf-node: npm install html-pdf-node`);
  }
}

module.exports = { renderHTMLReport, renderPDFReport };
