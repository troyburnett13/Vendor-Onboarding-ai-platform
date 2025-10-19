// backend/routes/formWebhook.js
import { insertSubmission } from '../db.js';

export default async function (req, res) {
  try {
    const expected = process.env.FORMS_WEBHOOK_SECRET || null;
    if (expected) {
      const got = req.get('X-Webhook-Secret');
      if (got !== expected) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const payload = req.body || {};
    const email = payload.email || payload.fields?.email || '';
    const company = payload.company || payload.fields?.company || '';
    const submittedAt = payload.submittedAt || new Date().toISOString();

    const id = insertSubmission({ email, company, payload, submittedAt });
    console.log(`Saved submission #${id} from: ${email || '(no email)'} at ${submittedAt}`);

    return res.status(200).json({ ok: true, id });
  } catch (err) {
    console.error('formWebhook error:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
