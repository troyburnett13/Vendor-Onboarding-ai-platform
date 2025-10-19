// backend/routes/invoiceCheck.js


import multer from 'multer';
import path from 'path';
import { insertInvoice } from '../db.pg.js';
const upload = multer({
  dest: path.join(process.cwd(), 'uploads'),
  limits: { fileSize: 8 * 1024 * 1024 } // 8 MB per file
});

export const receiptsUpload = upload.array('receipts', 10);

// For now, just echo back the invoice_total and count of files.
// We'll add OCR next after the server starts cleanly.
export async function checkInvoice(req, res) {
  try {
    const invTotal = Number(req.body.invoice_total || 0);
    const count = (req.files || []).length;
    return res.json({ ok: true, invoice_total: invTotal, files_received: count });
  } catch (err) {
    console.error('checkInvoice error:', err);
    // Optional metadata from the form/client
const vendorEmail = (req.body.vendor_email || req.body.email || '').toString() || null;
const company = (req.body.company || '').toString() || null;

// Persist the result
const invoiceId = insertInvoice({
  vendorEmail,
  company,
  invoiceTotal: invTotal,
  receiptsTotal,
  delta,
  passBool: pass,
  details: {
    vendorEmail,
    company,
    results,           // detailed per-file OCR
    invoice_total: invTotal,
    receipts_total: receiptsSum,
    delta,
    pass
  }
});

    return res.json({
  ok: true,
  id: invoiceId,
  invoice_total: +invTotal.toFixed(2),
  receipts_total: +receiptsSum.toFixed(2),
  delta,
  pass,
  receipts: results
});
  }
}
