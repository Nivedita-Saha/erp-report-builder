/**
 * In-memory datasets simulating a manufacturing ERP (EFACS-style)
 * Represents: Sales Orders, Parts/BOM, Employees, Inventory, Suppliers
 */

const DATASETS = {

  // ── Sales Orders ────────────────────────────────────────────────────────────
  orders: [
    { order_id: 'SO-1001', customer: 'Rolls-Royce', part_code: 'HE-400', qty: 12, unit_price: 850.00, total: 10200.00, status: 'Delivered',  department: 'Mechanical', created_date: '2024-09-15', delivery_date: '2024-10-01', sales_rep: 'J. Patel' },
    { order_id: 'SO-1002', customer: 'BAE Systems',  part_code: 'RP-210', qty: 5,  unit_price: 2400.00, total: 12000.00, status: 'In Progress', department: 'Hydraulic',  created_date: '2024-10-03', delivery_date: '2024-11-15', sales_rep: 'A. Khan' },
    { order_id: 'SO-1003', customer: 'National Grid', part_code: 'HE-400', qty: 8, unit_price: 850.00, total: 6800.00, status: 'Pending',     department: 'Mechanical', created_date: '2024-10-20', delivery_date: '2024-12-01', sales_rep: 'J. Patel' },
    { order_id: 'SO-1004', customer: 'Shell UK',      part_code: 'CV-780', qty: 3, unit_price: 5200.00, total: 15600.00, status: 'Delivered',  department: 'Hydraulic',  created_date: '2024-08-01', delivery_date: '2024-09-10', sales_rep: 'M. Singh' },
    { order_id: 'SO-1005', customer: 'Airbus',         part_code: 'RP-210', qty: 10, unit_price: 2400.00, total: 24000.00, status: 'In Progress', department: 'Hydraulic', created_date: '2024-11-05', delivery_date: '2025-01-20', sales_rep: 'A. Khan' },
    { order_id: 'SO-1006', customer: 'Rolls-Royce',   part_code: 'CV-780', qty: 1, unit_price: 5200.00, total: 5200.00, status: 'Pending',     department: 'Hydraulic',  created_date: '2024-11-18', delivery_date: '2025-02-01', sales_rep: 'J. Patel' },
    { order_id: 'SO-1007', customer: 'BAE Systems',   part_code: 'MT-120', qty: 20, unit_price: 320.00, total: 6400.00, status: 'Delivered',   department: 'Electrical', created_date: '2024-07-10', delivery_date: '2024-08-05', sales_rep: 'M. Singh' },
    { order_id: 'SO-1008', customer: 'Network Rail',  part_code: 'MT-120', qty: 15, unit_price: 320.00, total: 4800.00, status: 'In Progress', department: 'Electrical', created_date: '2024-11-22', delivery_date: '2025-01-10', sales_rep: 'A. Khan' },
    { order_id: 'SO-1009', customer: 'Shell UK',      part_code: 'HE-400', qty: 6, unit_price: 850.00, total: 5100.00, status: 'Pending',      department: 'Mechanical', created_date: '2024-12-01', delivery_date: '2025-02-15', sales_rep: 'J. Patel' },
    { order_id: 'SO-1010', customer: 'National Grid', part_code: 'CV-780', qty: 2, unit_price: 5200.00, total: 10400.00, status: 'Delivered',  department: 'Hydraulic',  created_date: '2024-09-28', delivery_date: '2024-10-30', sales_rep: 'M. Singh' },
  ],

  // ── Parts / Bill of Materials ────────────────────────────────────────────────
  parts: [
    { part_code: 'HE-400', description: 'Hydraulic Extension Arm 400mm',    category: 'Mechanical', unit_cost: 620.00, lead_time_days: 14, supplier_id: 'SUP-01' },
    { part_code: 'RP-210', description: 'Remote Positioning Unit 210N',      category: 'Hydraulic',  unit_cost: 1750.00, lead_time_days: 21, supplier_id: 'SUP-02' },
    { part_code: 'CV-780', description: 'Confined Space Vehicle Chassis 78', category: 'Hydraulic',  unit_cost: 3800.00, lead_time_days: 35, supplier_id: 'SUP-01' },
    { part_code: 'MT-120', description: 'Micro Torque Motor Assembly 120Nm', category: 'Electrical', unit_cost: 240.00, lead_time_days: 7,  supplier_id: 'SUP-03' },
    { part_code: 'SN-055', description: 'Sensor Module 55° Wide-Angle',      category: 'Electrical', unit_cost: 95.00, lead_time_days: 5,  supplier_id: 'SUP-03' },
  ],

  // ── Inventory ────────────────────────────────────────────────────────────────
  inventory: [
    { part_code: 'HE-400', stock_qty: 24, reorder_point: 10, warehouse: 'WH-A', last_updated: '2024-12-01' },
    { part_code: 'RP-210', stock_qty: 6,  reorder_point: 8,  warehouse: 'WH-A', last_updated: '2024-11-28' },
    { part_code: 'CV-780', stock_qty: 3,  reorder_point: 5,  warehouse: 'WH-B', last_updated: '2024-12-02' },
    { part_code: 'MT-120', stock_qty: 45, reorder_point: 20, warehouse: 'WH-B', last_updated: '2024-12-01' },
    { part_code: 'SN-055', stock_qty: 60, reorder_point: 25, warehouse: 'WH-A', last_updated: '2024-11-30' },
  ],

  // ── Employees ────────────────────────────────────────────────────────────────
  employees: [
    { emp_id: 'E001', name: 'James Patel',    department: 'Sales',       role: 'Senior Sales Rep',    salary: 42000, start_date: '2019-03-01', active: true },
    { emp_id: 'E002', name: 'Aisha Khan',     department: 'Sales',       role: 'Sales Rep',            salary: 35000, start_date: '2021-06-15', active: true },
    { emp_id: 'E003', name: 'Mike Singh',     department: 'Sales',       role: 'Sales Rep',            salary: 36500, start_date: '2020-09-01', active: true },
    { emp_id: 'E004', name: 'Sara Brennan',   department: 'Engineering', role: 'Lead Engineer',        salary: 58000, start_date: '2017-01-10', active: true },
    { emp_id: 'E005', name: 'Tom Whitfield',  department: 'Engineering', role: 'Design Engineer',      salary: 46000, start_date: '2022-04-01', active: true },
    { emp_id: 'E006', name: 'Priya Mehta',    department: 'IT',          role: 'ERP Developer',        salary: 48000, start_date: '2023-01-16', active: true },
    { emp_id: 'E007', name: 'Carl Osei',      department: 'Production',  role: 'Production Manager',   salary: 52000, start_date: '2018-05-20', active: true },
    { emp_id: 'E008', name: 'Hannah Lowe',    department: 'Finance',     role: 'Finance Analyst',      salary: 44000, start_date: '2021-11-01', active: true },
  ],

  // ── Suppliers ────────────────────────────────────────────────────────────────
  suppliers: [
    { supplier_id: 'SUP-01', name: 'PrecisionForge Ltd',   country: 'UK',      rating: 4.8, on_time_pct: 96, active: true },
    { supplier_id: 'SUP-02', name: 'HydroTech Solutions',  country: 'Germany', rating: 4.5, on_time_pct: 91, active: true },
    { supplier_id: 'SUP-03', name: 'ElectroParts Global',  country: 'UK',      rating: 4.2, on_time_pct: 88, active: true },
  ],
};

module.exports = { DATASETS };
