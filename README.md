# 🗂 ERP Report Builder — BIRT Analogue

A parameterised report generation system built in Node.js + vanilla JavaScript, demonstrating core BIRT reporting principles: **SQL-like datasets**, **named parameter binding**, **aggregation**, **CTEs**, and **formatted HTML/PDF output**.

> **Portfolio project** — demonstrates familiarity with ERP report tooling (EFACS/BIRT), complex SQL (multi-table joins, CTEs, GROUP BY, aggregations), and JavaScript scripting in reporting contexts.

---

## 🚀 Quick Start

```bash
npm install
npm start
# Open http://localhost:3000
```

---

## 🏗 Architecture

```
erp-report-builder/
├── server.js                  # Express API server (report endpoints)
├── src/
│   ├── queryEngine.js         # SQL-like query engine (SELECT, WHERE, GROUP BY, ORDER BY, CTEs)
│   ├── reportDefinitions.js   # Report designs (analogous to BIRT .rptdesign files)
│   ├── reportRenderer.js      # HTML & PDF report renderer
│   └── datasets.js            # In-memory ERP datasets (orders, parts, inventory, employees)
└── public/
    └── index.html             # Interactive report builder UI
```

---

## 📊 Available Reports

| Report ID | Title | Dataset | Grouping |
|---|---|---|---|
| `sales-order-summary` | Sales Order Summary | `orders` | None (filtered rows) |
| `revenue-by-customer` | Revenue by Customer | `orders` | `GROUP BY customer` |
| `inventory-status` | Inventory Status & Low Stock | `inventory` | None (filtered rows) |
| `headcount-by-department` | Employee Headcount & Salary | `employees` | `GROUP BY department` |

---

## ⚙ SQL-like Query Engine

The query engine (`src/queryEngine.js`) parses a structured query definition object and executes it against in-memory datasets — mirroring BIRT's SQL dataset execution model.

### Supported clauses

| Feature | Example |
|---|---|
| `SELECT` with aliasing | `{ total_revenue: 'SUM(total)' }` |
| `FROM` | Any named dataset |
| `WHERE` with named params | `{ field: 'status', op: '=', param: 'status' }` |
| `INNER JOIN` | Join on matching key fields |
| `GROUP BY` + aggregates | `SUM`, `COUNT`, `AVG`, `MIN`, `MAX` |
| `ORDER BY` | Any field, ASC/DESC |
| `LIMIT` | Numeric or param-resolved |
| CTE (`WITH`) | Derived sub-datasets |

### Named Parameter Binding (BIRT-style)

Parameters use `:paramName` syntax — identical to BIRT's named parameter approach:

```javascript
// Report definition
where: [
  { field: 'status',     op: '=',  param: 'status' },     // :status
  { field: 'department', op: '=',  param: 'department' }, // :department
  { field: 'created_date', op: '>=', param: 'date_from' } // :date_from
]

// At runtime, bound to user-supplied values:
parameters: { status: 'Delivered', department: 'Hydraulic', date_from: '2024-10-01' }
```

Unset parameters are **automatically skipped** (no-op filter) — matching BIRT's optional parameter behaviour.

---

## 🔌 API Endpoints

### `GET /api/reports`
Returns all available report definitions with parameter schemas.

### `POST /api/reports/:reportId/run`
Executes a report with supplied parameters.

**Request body:**
```json
{
  "parameters": {
    "status": "Delivered",
    "department": "Hydraulic"
  },
  "format": "json"   // "json" | "html" | "pdf"
}
```

**JSON response:**
```json
{
  "report": "sales-order-summary",
  "title": "Sales Order Summary Report",
  "generatedAt": "2024-12-05T14:22:00.000Z",
  "rowCount": 3,
  "columns": ["order_id", "customer", "part_code", ...],
  "rows": [ { "order_id": "SO-1001", "customer": "Rolls-Royce", ... } ],
  "summary": {
    "total": { "sum": 22000, "avg": 7333.33, "min": 5200, "max": 10200 }
  }
}
```

**HTML format:** Returns a fully formatted, print-ready HTML report.  
**PDF format:** Returns a binary PDF (requires `html-pdf-node` optional dependency).

### `POST /api/reports/:reportId/preview-query`
Returns the interpolated SQL string for a given parameter set — analogous to BIRT's "View Query" feature.

---

## 📋 Report Definition Schema

Each report definition mirrors a BIRT `.rptdesign` file:

```javascript
{
  title: 'Sales Order Summary Report',
  description: '...',
  dataset: 'orders',
  parameters: [
    { name: 'status', label: 'Order Status', type: 'select',
      options: ['', 'Delivered', 'In Progress', 'Pending'],
      required: false, default: '' }
  ],
  query: {
    from: 'orders',
    select: {
      order_id: 'order_id',
      total: 'total',
      // Aggregates
      total_revenue: 'SUM(total)',
      order_count:   'COUNT(order_id)',
    },
    where: [
      { field: 'status', op: '=', param: 'status' },
    ],
    groupBy: ['customer'],
    orderBy: { field: 'total', dir: 'DESC' },
    limit: 100
  },
  // Column display definitions (label, type, width)
  columns: {
    order_id: { label: 'Order ID', type: 'text', width: '10%' },
    total:    { label: 'Total (£)', type: 'currency', width: '15%' },
  }
}
```

---

## 🏭 ERP Dataset Schema

The in-memory datasets (`src/datasets.js`) simulate a manufacturing ERP (EFACS-style):

| Dataset | Key Fields |
|---|---|
| `orders` | order_id, customer, part_code, qty, unit_price, total, status, department, created_date |
| `parts` | part_code, description, category, unit_cost, lead_time_days, supplier_id |
| `inventory` | part_code, stock_qty, reorder_point, warehouse, last_updated |
| `employees` | emp_id, name, department, role, salary, start_date |
| `suppliers` | supplier_id, name, country, rating, on_time_pct |

---

## 🔧 Extending with a Real Database

To connect a live SQL Server database (as used in EFACS/BIRT environments), replace the in-memory dataset resolution in `queryEngine.js`:

```javascript
const sql = require('mssql');

async _resolveDataset(name) {
  const pool = await sql.connect(config);
  const result = await pool.request().query(`SELECT * FROM ${name}`);
  return result.recordset;
}
```

The query engine's WHERE, GROUP BY, and parameter-binding logic remains unchanged.

---

## 📄 PDF Output

Install the optional PDF dependency:

```bash
npm install html-pdf-node
```

Then call the API with `"format": "pdf"` — returns a binary A3 landscape PDF, print-optimised.

---

## 💼 Relevance to EFACS/BIRT Development

This project demonstrates:
- **Named parameter binding** — identical pattern to BIRT's `?{paramName}` syntax
- **SQL dataset query design** — complex filtering, aggregation, multi-table joins
- **Report definitions as data** — separating report design from execution logic
- **JavaScript in reporting context** — post-processing, computed columns, dynamic filtering
- **HTML report formatting** — production-quality output suitable for operational/management use
- **REST API design** for report delivery (JSON, HTML, PDF)

---

## 👩‍💻 Author

**Nivedita Saha**  
MSc Artificial Intelligence & Data Science (Distinction), Keele University  
[nivsaha.com](https://nivsaha.com) · [GitHub](https://github.com/Nivedita-Saha)
