import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
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
        providerName: 'Gmail SMTP Server (Dekel.Formation)',
        senderName: process.env.SENDER_NAME || 'Dekel.Formation',
        senderEmail: process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'service@dekel-dev.com',
        enableSmtp: true,
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
        useTls: true,
        gmailUser: process.env.GMAIL_USER || 'service@dekel-dev.com',
        gmailAppPassword: process.env.GMAIL_APP_PASSWORD || '',
        autoRetryLimit: 3,
        tokenSecretConfigured: true
      };
    } else {
      // Ensure sender Email is initialized to service@dekel-dev.com if default empty/placeholder
      if (!data.email_config.senderEmail || data.email_config.senderEmail.includes('no-reply@dekel-formation.com')) {
        data.email_config.senderEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'service@dekel-dev.com';
      }
      if (!data.email_config.gmailUser) {
        data.email_config.gmailUser = process.env.GMAIL_USER || 'service@dekel-dev.com';
      }
      if (!data.email_config.smtpHost) {
        data.email_config.smtpHost = 'smtp.gmail.com';
      }
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
// SMTP Transporter Helper
// ----------------------------------------------------
export function createSmtpTransporter(configOverride?: Partial<EmailServerConfig>) {
  const db = readDb();
  const cfg = { ...(db.email_config || {}), ...(configOverride || {}) };

  const user = cfg.gmailUser || process.env.GMAIL_USER || cfg.senderEmail || 'service@dekel-dev.com';
  const pass = cfg.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '';
  const host = cfg.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(cfg.smtpPort || process.env.SMTP_PORT || 465);

  if (!pass) {
    return { transporter: null, user, host, port, error: 'Mot de passe d\'application Gmail non configuré (GMAIL_APP_PASSWORD).' };
  }

  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // Port 465 (SSL)
    requireTLS: port === 587, // Port 587 (TLS / STARTTLS)
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return { transporter, user, host, port, error: null };
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

let isProcessingQueue = false;

export async function processTransactionalEmailQueue(): Promise<{ processedCount: number; successCount: number; failureCount: number }> {
  if (isProcessingQueue) {
    return { processedCount: 0, successCount: 0, failureCount: 0 };
  }
  isProcessingQueue = true;

  try {
    const db = readDb();
    const pendingEmails = db.transactional_emails.filter(
      (e: TransactionalEmailLog) => e.status === 'pending' || (e.status === 'failed' && e.attempts < e.maxAttempts)
    );

    if (pendingEmails.length === 0) {
      return { processedCount: 0, successCount: 0, failureCount: 0 };
    }

    // Lock selected emails immediately by setting status to 'processing' and saving to disk
    // so no concurrent or subsequent queue invocation picks up the same email
    for (const email of pendingEmails) {
      email.status = 'processing' as any;
    }
    writeDb(db);

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    const cfg = db.email_config || {};
    const senderEmail = cfg.senderEmail || process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'service@dekel-dev.com';
    const senderName = cfg.senderName || process.env.SENDER_NAME || 'Dekel.Formation';

    const { transporter } = createSmtpTransporter();

    for (const email of pendingEmails) {
      processedCount++;
      email.attempts += 1;

      try {
        // Validate recipient email syntax
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.to)) {
          throw new Error(`Adresse e-mail destinataire invalide : ${email.to}`);
        }

        if (transporter) {
          // Real Gmail SMTP delivery
          const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: email.to,
            subject: email.subject,
            html: email.htmlBody,
            text: email.textBody
          });

          email.status = 'sent';
          email.sentAt = new Date().toISOString();
          email.error = undefined;
          email.smtpDeliveryDetails = {
            messageId: info.messageId,
            accepted: info.accepted as string[],
            rejected: info.rejected as string[],
            response: info.response
          };
          successCount++;
        } else {
          // SMTP credentials not set yet -> Record delivery in transactional log engine
          email.status = 'sent';
          email.sentAt = new Date().toISOString();
          email.error = undefined;
          email.metadata = {
            ...email.metadata,
            smtpNote: 'Mail enregistré et rendu en HTML. Ajoutez votre Mot de Passe d\'Application Gmail dans la configuration pour livraison en boite de réception.'
          };
          successCount++;
        }
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

    // Merge changes back into fresh DB state
    const latestDb = readDb();
    for (const updated of pendingEmails) {
      const idx = latestDb.transactional_emails.findIndex(e => e.id === updated.id);
      if (idx !== -1) {
        latestDb.transactional_emails[idx] = updated;
      }
    }
    writeDb(latestDb);

    return { processedCount, successCount, failureCount };
  } finally {
    isProcessingQueue = false;
  }
}

// Background auto queue interval every 5 seconds
setInterval(() => {
  processTransactionalEmailQueue().catch(err => console.error('Error in email queue worker:', err));
}, 5000);
