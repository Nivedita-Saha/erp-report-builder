/**
 * SQL-like Query Engine
 * Supports: SELECT, FROM, WHERE (with AND/OR), GROUP BY, ORDER BY, LIMIT
 * Parameter binding: :paramName syntax (BIRT-style named parameters)
 * Aggregates: SUM, COUNT, AVG, MIN, MAX
 * CTEs: WITH clause (simplified)
 */

const { DATASETS } = require('./datasets');

class QueryEngine {
  /**
   * Execute a parameterised query against in-memory datasets
   * @param {object} queryDef - Query definition object
   * @param {object} params   - Named parameter values
   * @returns {{ columns, rows, summary }}
   */
  async execute(queryDef, params) {
    const { from, select, where, joins, groupBy, orderBy, limit, cte } = queryDef;

    // Resolve base dataset
    let data = this._resolveDataset(from, cte, params);

    // Apply JOINs
    if (joins && joins.length > 0) {
      data = this._applyJoins(data, joins, params);
    }

    // Apply WHERE filters
    if (where && where.length > 0) {
      data = this._applyWhere(data, where, params);
    }

    // Apply GROUP BY + aggregations
    let rows, columns, summary;
    if (groupBy && groupBy.length > 0) {
      ({ rows, columns } = this._applyGroupBy(data, select, groupBy));
    } else {
      ({ rows, columns } = this._applySelect(data, select));
    }

    // Apply ORDER BY
    if (orderBy) {
      rows = this._applyOrderBy(rows, orderBy);
    }

    // Apply LIMIT
    if (limit) {
      const resolvedLimit = this._resolveValue(limit, params);
      rows = rows.slice(0, parseInt(resolvedLimit));
    }

    // Compute summary stats
    summary = this._computeSummary(rows, select);

    return { columns, rows, summary };
  }

  /**
   * Interpolate query definition into readable SQL string (for display)
   */
  interpolate(queryDef, params) {
    const { from, select, where, groupBy, orderBy, limit, joins, cte } = queryDef;
    let lines = [];

    if (cte) {
      Object.entries(cte).forEach(([name, subQuery]) => {
        lines.push(`WITH ${name} AS (`);
        lines.push(`  SELECT ${Object.entries(subQuery.select).map(([alias, expr]) => `${expr} AS ${alias}`).join(', ')}`);
        lines.push(`  FROM ${subQuery.from}`);
        lines.push(`)`);
      });
    }

    const selectCols = Object.entries(select)
      .map(([alias, expr]) => expr === alias ? expr : `${expr} AS ${alias}`)
      .join(',\n    ');
    lines.push(`SELECT\n    ${selectCols}`);
    lines.push(`FROM ${from}`);

    if (joins) {
      joins.forEach(j => {
        lines.push(`${j.type || 'INNER'} JOIN ${j.table} ON ${j.on}`);
      });
    }

    if (where && where.length > 0) {
      const conditions = where.map(w => {
        const val = params[w.param] !== undefined ? `'${params[w.param]}'` : `:${w.param || '?'}`;
        return `  ${w.field} ${w.op || '='} ${val}`;
      });
      lines.push(`WHERE\n${conditions.join('\n  AND ')}`);
    }

    if (groupBy) lines.push(`GROUP BY ${groupBy.join(', ')}`);
    if (orderBy) lines.push(`ORDER BY ${orderBy.field} ${orderBy.dir || 'ASC'}`);
    if (limit) lines.push(`LIMIT ${this._resolveValue(limit, params)}`);

    return lines.join('\n');
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _resolveDataset(name, cte, params) {
    if (cte && cte[name]) {
      // CTE: build derived dataset
      return this._applySelect(
        DATASETS[cte[name].from] || [],
        cte[name].select
      ).rows;
    }
    const ds = DATASETS[name];
    if (!ds) throw new Error(`Dataset '${name}' not found`);
    return [...ds]; // clone
  }

  _applyJoins(baseData, joins, params) {
    let result = baseData;
    for (const join of joins) {
      const rightData = DATASETS[join.table] || [];
      const [leftKey, rightKey] = join.on.split('=').map(s => s.trim().split('.').pop());
      const rightMap = {};
      rightData.forEach(row => {
        rightMap[row[rightKey]] = row;
      });
      result = result.map(row => {
        const match = rightMap[row[leftKey]];
        return match ? { ...row, ...Object.fromEntries(Object.entries(match).map(([k, v]) => [`${join.alias || join.table}.${k}`, v])) } : row;
      }).filter(row => join.type !== 'INNER' || rightMap[row[leftKey]]);
    }
    return result;
  }

  _applyWhere(data, conditions, params) {
    return data.filter(row => {
      return conditions.every(cond => {
        const fieldVal = this._getField(row, cond.field);
        const paramVal = cond.param ? this._resolveValue(`:${cond.param}`, params) : cond.value;
        if (paramVal === undefined || paramVal === null || paramVal === '') return true; // skip unset params
        return this._compare(fieldVal, cond.op || '=', paramVal);
      });
    });
  }

  _compare(fieldVal, op, paramVal) {
    const fv = typeof fieldVal === 'string' ? fieldVal.toLowerCase() : fieldVal;
    const pv = typeof paramVal === 'string' ? paramVal.toLowerCase() : paramVal;
    switch (op) {
      case '=':   return fv == pv;
      case '!=':  return fv != pv;
      case '>':   return fv > pv;
      case '>=':  return fv >= pv;
      case '<':   return fv < pv;
      case '<=':  return fv <= pv;
      case 'LIKE': return String(fv).includes(String(pv).replace(/%/g, ''));
      case 'IN':  return (Array.isArray(pv) ? pv : pv.split(',')).map(v => v.trim().toLowerCase()).includes(String(fv));
      case 'BETWEEN': {
        const [lo, hi] = Array.isArray(pv) ? pv : pv.split(',');
        return fv >= lo && fv <= hi;
      }
      default: return true;
    }
  }

  _applySelect(data, select) {
    const columns = Object.keys(select);
    const rows = data.map(row => {
      const out = {};
      columns.forEach(alias => {
        const expr = select[alias];
        out[alias] = this._evalExpr(expr, row);
      });
      return out;
    });
    return { columns, rows };
  }

  _applyGroupBy(data, select, groupByFields) {
    const groups = {};
    data.forEach(row => {
      const key = groupByFields.map(f => this._getField(row, f)).join('|');
      if (!groups[key]) groups[key] = { _rows: [], _key: key };
      groupByFields.forEach(f => { groups[key][f] = this._getField(row, f); });
      groups[key]._rows.push(row);
    });

    const columns = Object.keys(select);
    const rows = Object.values(groups).map(group => {
      const out = {};
      columns.forEach(alias => {
        const expr = select[alias];
        out[alias] = this._evalAggExpr(expr, group._rows, group);
      });
      return out;
    });
    return { columns, rows };
  }

  _evalAggExpr(expr, rows, group) {
    if (typeof expr !== 'string') return expr;
    const aggMatch = expr.match(/^(SUM|COUNT|AVG|MIN|MAX)\((.+)\)$/i);
    if (aggMatch) {
      const [, fn, field] = aggMatch;
      const vals = rows.map(r => parseFloat(this._getField(r, field.trim())) || 0);
      switch (fn.toUpperCase()) {
        case 'SUM':   return vals.reduce((a, b) => a + b, 0);
        case 'COUNT': return vals.length;
        case 'AVG':   return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        case 'MIN':   return Math.min(...vals);
        case 'MAX':   return Math.max(...vals);
      }
    }
    // Non-aggregate: return group value
    return group[expr] !== undefined ? group[expr] : this._getField(rows[0], expr);
  }

  _evalExpr(expr, row) {
    if (typeof expr !== 'string') return expr;
    // Arithmetic: field1 * field2 etc.
    if (/[+\-*/]/.test(expr) && !expr.match(/^[A-Z]+\(/)) {
      try {
        const resolved = expr.replace(/[\w.]+/g, m => {
          const v = this._getField(row, m);
          return v !== undefined ? v : m;
        });
        return Function(`"use strict"; return (${resolved})`)();
      } catch { return null; }
    }
    return this._getField(row, expr);
  }

  _getField(row, expr) {
    if (row[expr] !== undefined) return row[expr];
    // Handle table.field notation
    const dotted = Object.keys(row).find(k => k.endsWith('.' + expr));
    return dotted ? row[dotted] : undefined;
  }

  _applyOrderBy(rows, orderBy) {
    const { field, dir = 'ASC' } = orderBy;
    return [...rows].sort((a, b) => {
      const av = a[field], bv = b[field];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'DESC' ? -cmp : cmp;
    });
  }

  _resolveValue(expr, params) {
    if (typeof expr === 'string' && expr.startsWith(':')) {
      return params[expr.slice(1)];
    }
    return expr;
  }

  _computeSummary(rows, select) {
    const summary = {};
    Object.keys(select).forEach(col => {
      const vals = rows.map(r => r[col]).filter(v => typeof v === 'number');
      if (vals.length > 0) {
        summary[col] = {
          sum: vals.reduce((a, b) => a + b, 0),
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          min: Math.min(...vals),
          max: Math.max(...vals)
        };
      }
    });
    return summary;
  }
}

module.exports = { queryEngine: new QueryEngine() };
