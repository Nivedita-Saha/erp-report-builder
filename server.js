/**
 * Parameterised Report Builder — BIRT Analogue
 * Node.js + Express backend with SQL-like query engine
 * Author: Nivedita Saha | Portfolio: nivsaha.com
 */

const express = require('express');
const path = require('path');
const { queryEngine } = require('./src/queryEngine');
const { renderHTMLReport, renderPDFReport } = require('./src/reportRenderer');
const { REPORT_DEFINITIONS } = require('./src/reportDefinitions');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── API: List available reports ─────────────────────────────────────────────
app.get('/api/reports', (req, res) => {
  const list = Object.entries(REPORT_DEFINITIONS).map(([id, def]) => ({
    id,
    title: def.title,
    description: def.description,
    parameters: def.parameters,
    dataset: def.dataset
  }));
  res.json({ reports: list });
});

// ─── API: Run a report with parameters ───────────────────────────────────────
app.post('/api/reports/:reportId/run', async (req, res) => {
  const { reportId } = req.params;
  const { parameters = {}, format = 'json' } = req.body;

  const definition = REPORT_DEFINITIONS[reportId];
  if (!definition) {
    return res.status(404).json({ error: `Report '${reportId}' not found` });
  }

  try {
    // Validate required parameters
    const missing = definition.parameters
      .filter(p => p.required && !parameters[p.name])
      .map(p => p.name);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required parameters: ${missing.join(', ')}` });
    }

    // Execute SQL-like query with parameters
    const result = await queryEngine.execute(definition.query, parameters);

    if (format === 'html') {
      const html = renderHTMLReport(definition, result, parameters);
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    if (format === 'pdf') {
      const pdf = await renderPDFReport(definition, result, parameters);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}-report.pdf"`);
      return res.send(pdf);
    }

    // Default: JSON
    res.json({
      report: reportId,
      title: definition.title,
      generatedAt: new Date().toISOString(),
      parameters,
      rowCount: result.rows.length,
      columns: result.columns,
      rows: result.rows,
      summary: result.summary
    });

  } catch (err) {
    console.error(`Report error [${reportId}]:`, err);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Preview SQL query for a report ─────────────────────────────────────
app.post('/api/reports/:reportId/preview-query', (req, res) => {
  const { reportId } = req.params;
  const { parameters = {} } = req.body;
  const definition = REPORT_DEFINITIONS[reportId];
  if (!definition) return res.status(404).json({ error: 'Report not found' });

  const interpolated = queryEngine.interpolate(definition.query, parameters);
  res.json({ sql: interpolated });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🗂  Report Builder running at http://localhost:${PORT}\n`);
});
