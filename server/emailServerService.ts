import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { generateEmailHtml, EMAIL_TEMPLATE_DEFINITIONS, EmailRenderData } from '../src/services/emailTemplates';
import { EmailType, EmailCategory, TransactionalEmailLog, EmailServerConfig } from '../src/types/email';

const TOKEN_SECRET = process.env.EMAIL_TOKEN_SECRET || 'DEKEL_EMAIL_SECURE_SECRET_KEY_2026';
const DB_FILE = path.join(process.cwd(), 'webhook_db.json');

export function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { enrollments: [], logs: [], transactional_emails: [], email_config: null };
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!data.transactional_emails) data.transactional_emails = [];
    if (!data.email_config) {
      data.email_config = {
        providerName: 'Dekel.Formation Native Mailer',
        senderName: 'Dekel.Formation',
        senderEmail: 'no-reply@dekel-formation.com',
        enableSmtp: false,
        useTls: true,
        autoRetryLimit: 3,
        tokenSecretConfigured: true
      };
    }
    return data;
  } catch (e) {
    return { enrollments: [], logs: [], transactional_emails: [], email_config: null };
  }
}

export function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// Cryptographic Token Signing & Verification
// ----------------------------------------------------

export interface SignedTokenPayload {
  action: string;
  email: string;
  exp: number; // UNIX timestamp in seconds
  data?: Record<string, any>;
}

export function generateSignedToken(action: string, email: string, expiresInSeconds: number = 86400, extraData?: Record<string, any>): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload: SignedTokenPayload = {
    action,
    email: email.trim().toLowerCase(),
    exp,
    data: extraData
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
  hmac.update(payloadBase64);
  const signature = hmac.digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function verifySignedToken(tokenString: string): { valid: boolean; payload?: SignedTokenPayload; error?: string } {
  if (!tokenString || !tokenString.includes('.')) {
    return { valid: false, error: 'Format de jeton invalide ou corrompu' };
  }

  const [payloadBase64, signature] = tokenString.split('.');
  
  try {
    const hmac = crypto.createHmac('sha256', TOKEN_SECRET);
    hmac.update(payloadBase64);
    const expectedSignature = hmac.digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Signature de sécurité invalide ou modifiée' };
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: SignedTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, payload, error: 'Le lien de sécurité a expiré. Veuillez effectuer une nouvelle demande.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: `Échec du décodage du jeton : ${err.message}` };
  }
}

// ----------------------------------------------------
// Queue & Process Manager
// ----------------------------------------------------

export function queueTransactionalEmail(params: {
  to: string;
  recipientName?: string;
  type: EmailType;
  category: EmailCategory;
  renderData?: EmailRenderData;
  actionUrl?: string;
  metadata?: Record<string, any>;
}): TransactionalEmailLog {
  const db = readDb();
  const emailId = `tx-em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  const recipientName = params.recipientName || (params.to.split('@')[0]);
  const renderData: EmailRenderData = {
    recipientEmail: params.to,
    recipientName,
    actionUrl: params.actionUrl,
    ...params.renderData
  };

  const templateOutput = generateEmailHtml(params.type, renderData);

  const emailEntry: TransactionalEmailLog = {
    id: emailId,
    to: params.to.trim().toLowerCase(),
    recipientName,
    subject: templateOutput.subject,
    type: params.type,
    category: params.category,
    htmlBody: templateOutput.html,
    textBody: templateOutput.text,
    status: 'pending',
    queuedAt: new Date().toISOString(),
    attempts: 0,
    maxAttempts: db.email_config?.autoRetryLimit || 3,
    metadata: params.metadata || {},
    actionUrl: params.actionUrl
  };

  db.transactional_emails.unshift(emailEntry);
  if (db.transactional_emails.length > 500) {
    db.transactional_emails = db.transactional_emails.slice(0, 500);
  }
  writeDb(db);

  // Trigger non-blocking async process
  setImmediate(() => {
    processTransactionalEmailQueue();
  });

  return emailEntry;
}

export async function processTransactionalEmailQueue(): Promise<{ processedCount: number; successCount: number; failureCount: number }> {
  const db = readDb();
  const pendingEmails = db.transactional_emails.filter(
    (e: TransactionalEmailLog) => e.status === 'pending' || (e.status === 'failed' && e.attempts < e.maxAttempts)
  );

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;

  for (const email of pendingEmails) {
    processedCount++;
    email.attempts += 1;

    try {
      // Simulate/Send email execution
      // Validate recipient email syntax
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.to)) {
        throw new Error(`Adresse e-mail destinataire invalide : ${email.to}`);
      }

      // Simulate network delivery with standard server queue execution
      // 99% simulated delivery success rate
      const simulatedFailureRate = false; // standard reliability
      if (simulatedFailureRate) {
        throw new Error('Erreur temporaire de connexion au serveur SMTP distant');
      }

      email.status = 'sent';
      email.sentAt = new Date().toISOString();
      email.error = undefined;
      successCount++;
    } catch (err: any) {
      failureCount++;
      email.error = err.message || 'Erreur inconnue lors de l\'envoi de l\'e-mail';
      if (email.attempts >= email.maxAttempts) {
        email.status = 'failed';
      } else {
        email.status = 'pending'; // Retry in next queue cycle
      }
    }
  }

  writeDb(db);
  return { processedCount, successCount, failureCount };
}

// Background auto queue interval every 5 seconds
setInterval(() => {
  processTransactionalEmailQueue().catch(err => console.error('Error in email queue worker:', err));
}, 5000);
