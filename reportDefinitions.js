/**
 * Report Definitions — analogous to BIRT report designs (.rptdesign files)
 * Each report has: metadata, parameters, a query definition, and column formatting
 */

const REPORT_DEFINITIONS = {

  // ── Report 1: Sales Order Summary ──────────────────────────────────────────
  'sales-order-summary': {
    title: 'Sales Order Summary Report',
    description: 'Summarised sales orders filtered by status, date range, and department',
    dataset: 'orders',
    parameters: [
      { name: 'status',     label: 'Order Status',  type: 'select', options: ['', 'Delivered', 'In Progress', 'Pending'], required: false, default: '' },
      { name: 'department', label: 'Department',    type: 'select', options: ['', 'Mechanical', 'Hydraulic', 'Electrical'], required: false, default: '' },
      { name: 'date_from',  label: 'Date From',     type: 'date',   required: false, default: '' },
      { name: 'date_to',    label: 'Date To',       type: 'date',   required: false, default: '' },
    ],
    query: {
      from: 'orders',
      select: {
        order_id:      'order_id',
        customer:      'customer',
        part_code:     'part_code',
        qty:           'qty',
        unit_price:    'unit_price',
        total:         'total',
        status:        'status',
        department:    'department',
        created_date:  'created_date',
        delivery_date: 'delivery_date',
        sales_rep:     'sales_rep',
      },
      where: [
        { field: 'status',       op: '=',       param: 'status' },
        { field: 'department',   op: '=',       param: 'department' },
        { field: 'created_date', op: '>=',      param: 'date_from' },
        { field: 'created_date', op: '<=',      param: 'date_to' },
      ],
      orderBy: { field: 'created_date', dir: 'DESC' },
    },
    columns: {
      order_id:      { label: 'Order ID',      type: 'text',     width: '8%' },
      customer:      { label: 'Customer',      type: 'text',     width: '14%' },
      part_code:     { label: 'Part Code',     type: 'text',     width: '8%' },
      qty:           { label: 'Qty',           type: 'number',   width: '5%' },
      unit_price:    { label: 'Unit Price',    type: 'currency', width: '10%' },
      total:         { label: 'Total (£)',     type: 'currency', width: '10%' },
      status:        { label: 'Status',        type: 'badge',    width: '10%' },
      department:    { label: 'Department',    type: 'text',     width: '10%' },
      created_date:  { label: 'Created',       type: 'date',     width: '10%' },
      delivery_date: { label: 'Delivery Date', type: 'date',     width: '10%' },
      sales_rep:     { label: 'Sales Rep',     type: 'text',     width: '10%' },
    },
  },

  // ── Report 2: Revenue by Customer (Aggregated) ─────────────────────────────
  'revenue-by-customer': {
    title: 'Revenue by Customer Report',
    description: 'Aggregated order revenue grouped by customer, filterable by status',
    dataset: 'orders',
    parameters: [
      { name: 'status', label: 'Order Status', type: 'select', options: ['', 'Delivered', 'In Progress', 'Pending'], required: false, default: '' },
      { name: 'min_revenue', label: 'Min Revenue (£)', type: 'number', required: false, default: '' },
    ],
    query: {
      from: 'orders',
      select: {
        customer:     'customer',
        order_count:  'COUNT(order_id)',
        total_qty:    'SUM(qty)',
        total_revenue:'SUM(total)',
        avg_order:    'AVG(total)',
      },
      where: [
        { field: 'status', op: '=', param: 'status' },
      ],
      groupBy: ['customer'],
      orderBy: { field: 'total_revenue', dir: 'DESC' },
    },
    columns: {
      customer:      { label: 'Customer',         type: 'text',     width: '25%' },
      order_count:   { label: 'Orders',           type: 'number',   width: '12%' },
      total_qty:     { label: 'Total Qty',        type: 'number',   width: '12%' },
      total_revenue: { label: 'Total Revenue (£)',type: 'currency', width: '25%' },
      avg_order:     { label: 'Avg Order Value',  type: 'currency', width: '20%' },
    },
  },

  // ── Report 3: Inventory Status (Low Stock Alert) ───────────────────────────
  'inventory-status': {
    title: 'Inventory Status & Low Stock Report',
    description: 'Current stock levels with reorder alerts, filterable by warehouse',
    dataset: 'inventory',
    parameters: [
      { name: 'warehouse',   label: 'Warehouse',       type: 'select', options: ['', 'WH-A', 'WH-B'], required: false, default: '' },
      { name: 'low_stock',   label: 'Low Stock Only',  type: 'select', options: ['', 'yes'],           required: false, default: '' },
    ],
    query: {
      from: 'inventory',
      select: {
        part_code:     'part_code',
        stock_qty:     'stock_qty',
        reorder_point: 'reorder_point',
        warehouse:     'warehouse',
        last_updated:  'last_updated',
      },
      where: [
        { field: 'warehouse', op: '=', param: 'warehouse' },
      ],
      orderBy: { field: 'stock_qty', dir: 'ASC' },
    },
    columns: {
      part_code:     { label: 'Part Code',     type: 'text',   width: '15%' },
      stock_qty:     { label: 'Stock Qty',     type: 'number', width: '15%' },
      reorder_point: { label: 'Reorder Point', type: 'number', width: '15%' },
      warehouse:     { label: 'Warehouse',     type: 'text',   width: '15%' },
      last_updated:  { label: 'Last Updated',  type: 'date',   width: '20%' },
    },
    postProcess: (rows, params) => {
      if (params.low_stock === 'yes') {
        return rows.filter(r => r.stock_qty <= r.reorder_point);
      }
      return rows;
    }
  },

  // ── Report 4: Employee Headcount by Department ─────────────────────────────
  'headcount-by-department': {
    title: 'Employee Headcount & Salary Report',
    description: 'Headcount and salary summary grouped by department',
    dataset: 'employees',
    parameters: [
      { name: 'department', label: 'Department', type: 'select', options: ['', 'Sales', 'Engineering', 'IT', 'Finance', 'Production'], required: false, default: '' },
    ],
    query: {
      from: 'employees',
      select: {
        department:   'department',
        headcount:    'COUNT(emp_id)',
        total_salary: 'SUM(salary)',
        avg_salary:   'AVG(salary)',
        min_salary:   'MIN(salary)',
        max_salary:   'MAX(salary)',
      },
      where: [
        { field: 'department', op: '=', param: 'department' },
      ],
      groupBy: ['department'],
      orderBy: { field: 'headcount', dir: 'DESC' },
    },
    columns: {
      department:   { label: 'Department',    type: 'text',     width: '20%' },
      headcount:    { label: 'Headcount',     type: 'number',   width: '12%' },
      total_salary: { label: 'Total Salary',  type: 'currency', width: '20%' },
      avg_salary:   { label: 'Avg Salary',    type: 'currency', width: '20%' },
      min_salary:   { label: 'Min Salary',    type: 'currency', width: '15%' },
      max_salary:   { label: 'Max Salary',    type: 'currency', width: '15%' },
    },
  },
};

module.exports = { REPORT_DEFINITIONS };
