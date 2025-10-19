// backend/db.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// --- existing submissions table (keep if you already have it) ---
db.prepare(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    company TEXT,
    payload_json TEXT,
    submitted_at TEXT
  )
`).run();

// --- NEW: invoices table to store OCR results ---
db.prepare(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_email TEXT,
    company TEXT,
    invoice_total REAL NOT NULL,
    receipts_total REAL NOT NULL,
    delta REAL NOT NULL,
    pass INTEGER NOT NULL,             -- 1 = true, 0 = false
    details_json TEXT NOT NULL,        -- full response payload
    created_at TEXT NOT NULL
  )
`).run();

// ------- existing exports for submissions (keep) -------
export function insertSubmission({ email, company, payload, submittedAt }) {
  const stmt = db.prepare(`
    INSERT INTO submissions (email, company, payload_json, submitted_at)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(email || null, company || null, JSON.stringify(payload || {}), submittedAt || new Date().toISOString());
  return info.lastInsertRowid;
}
export function listSubmissions({ limit = 50, offset = 0 } = {}) {
  const stmt = db.prepare(`
    SELECT id, email, company, submitted_at AS submittedAt
    FROM submissions
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}
export function getSubmission(id) {
  const row = db.prepare(`
    SELECT id, email, company, payload_json AS payloadJson, submitted_at AS submittedAt
    FROM submissions WHERE id = ?
  `).get(id);
  if (!row) return null;
  return { ...row, payload: JSON.parse(row.payloadJson || '{}') };
}

// ------- NEW: invoices helpers -------
export function insertInvoice({
  vendorEmail,
  company,
  invoiceTotal,
  receiptsTotal,
  delta,
  passBool,
  details
}) {
  const stmt = db.prepare(`
    INSERT INTO invoices (vendor_email, company, invoice_total, receipts_total, delta, pass, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    vendorEmail || null,
    company || null,
    Number(invoiceTotal),
    Number(receiptsTotal),
    Number(delta),
    passBool ? 1 : 0,
    JSON.stringify(details || {}),
    new Date().toISOString()
  );
  return info.lastInsertRowid;
}

export function listInvoices({ limit = 50, offset = 0 } = {}) {
  const stmt = db.prepare(`
    SELECT id, vendor_email AS vendorEmail, company, invoice_total AS invoiceTotal,
           receipts_total AS receiptsTotal, delta, pass, created_at AS createdAt
    FROM invoices
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset);
}

export function getInvoice(id) {
  const row = db.prepare(`
    SELECT id, vendor_email AS vendorEmail, company, invoice_total AS invoiceTotal,
           receipts_total AS receiptsTotal, delta, pass, details_json AS detailsJson,
           created_at AS createdAt
    FROM invoices WHERE id = ?
  `).get(id);
  if (!row) return null;
  return { ...row, details: JSON.parse(row.detailsJson || '{}') };
}
