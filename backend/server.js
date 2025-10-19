// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Route handlers & DB helpers
import formWebhook from "./routes/formWebhook.js";
import { receiptsUpload, checkInvoice } from "./routes/invoiceCheck.js";
import { listSubmissions, getSubmission, listInvoices, getInvoice } from "./db.js";

// 1) Load env
dotenv.config();

// 2) Create app BEFORE registering any routes
const app = express();
app.use(express.json({ limit: "10mb" }));

// 3) Routes (order here doesn't matter, but must come after app is created)

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Forms → webhook
app.post("/api/webhook/form-submission", formWebhook);

// Submissions list/get
app.get("/api/submissions", (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  return res.json({ ok: true, data: listSubmissions({ limit, offset }) });
});
app.get("/api/submissions/:id", (req, res) => {
  const row = getSubmission(Number(req.params.id));
  if (!row) return res.status(404).json({ ok: false, error: "Not found" });
  return res.json({ ok: true, data: row });
});

// Invoice OCR check (file upload)
app.post("/api/invoice/check", receiptsUpload, checkInvoice);

// Invoices list/get
app.get("/api/invoices", (req, res) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  return res.json({ ok: true, data: listInvoices({ limit, offset }) });
});
app.get("/api/invoices/:id", (req, res) => {
  const row = getInvoice(Number(req.params.id));
  if (!row) return res.status(404).json({ ok: false, error: "Not found" });
  return res.json({ ok: true, data: row });
});

// 4) Start server LAST
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`✅ Backend listening on port ${port}`));
