// backend/db.pg.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: ssl for some hosts
  ssl: { rejectUnauthorized: false }
});

// --- submissions ---
export async function insertSubmission({ email, company, payload, submittedAt }) {
  const { rows } = await pool.query(
    `insert into submissions (email, company, payload_json, submitted_at)
     values ($1,$2,$3,$4) returning id`,
    [email || null, company || null, payload || {}, submittedAt || new Date()]
  );
  return rows[0].id;
}

export async function listSubmissions({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `select id, email, company, submitted_at as "submittedAt"
     from submissions order by id desc limit $1 offset $2`, [limit, offset]
  );
  return rows;
}

export async function getSubmission(id) {
  const { rows } = await pool.query(
    `select id, email, company, payload_json as "payload", submitted_at as "submittedAt"
     from submissions where id=$1`, [id]
  );
  return rows[0] || null;
}

// --- invoices ---
export async function insertInvoice({ vendorEmail, company, invoiceTotal, receiptsTotal, delta, passBool, details }) {
  const { rows } = await pool.query(
    `insert into invoices (vendor_email, company, invoice_total, receipts_total, delta, pass, details_json)
     values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [vendorEmail || null, company || null, invoiceTotal, receiptsTotal, delta, !!passBool, details || {}]
  );
  return rows[0].id;
}

export async function listInvoices({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `select id, vendor_email as "vendorEmail", company,
            invoice_total as "invoiceTotal", receipts_total as "receiptsTotal",
            delta, pass, created_at as "createdAt"
     from invoices order by id desc limit $1 offset $2`,
    [limit, offset]
  );
  return rows;
}

export async function getInvoice(id) {
  const { rows } = await pool.query(
    `select id, vendor_email as "vendorEmail", company,
            invoice_total as "invoiceTotal", receipts_total as "receiptsTotal",
            delta, pass, details_json as "details", created_at as "createdAt"
     from invoices where id=$1`,
    [id]
  );
  return rows[0] || null;
}
