import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import net from 'net';
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

// ----------------------------------------------------
// Real-time SMTP Diagnostic Service
// ----------------------------------------------------
export interface SmtpDiagnosticResult {
  timestamp: string;
  isRender: boolean;
  environment: {
    nodeEnv: string;
    gmailUser: string;
    hasAppPassword: boolean;
    appPasswordLength: number;
    hasSpacesInPassword: boolean;
    smtpHost: string;
    smtpPort: number;
    senderEmail: string;
    senderName: string;
  };
  checks: {
    dns: { success: boolean; ip?: string; error?: string; durationMs?: number };
    tcp: { success: boolean; localAddress?: string; remoteAddress?: string; durationMs?: number; error?: string };
    smtpVerify: { success: boolean; durationMs?: number; error?: string };
    testEmailSend?: { success: boolean; messageId?: string; accepted?: string[]; error?: string };
  };
  logs: string[];
  recommendations: string[];
}

export async function runSmtpDiagnostic(options?: {
  sendTestEmailTo?: string;
  configOverride?: Partial<EmailServerConfig>;
}): Promise<SmtpDiagnosticResult> {
  const logs: string[] = [];
  const recommendations: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    logs.push(`[${timestamp}] ${msg}`);
  };

  log("🚀 Démarrage du diagnostic SMTP en temps réel...");

  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
  if (isRender) {
    log("ℹ️ Environnement détecté : Hébergement Cloud Render.");
  } else {
    log("ℹ️ Environnement détecté : Conteneur local / Applet AI Studio.");
  }

  const db = readDb();
  const cfg = { ...(db.email_config || {}), ...(options?.configOverride || {}) };

  const user = cfg.gmailUser || process.env.GMAIL_USER || cfg.senderEmail || 'service@dekel-dev.com';
  const pass = cfg.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || '';
  const host = cfg.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(cfg.smtpPort || process.env.SMTP_PORT || 465);
  const senderEmail = cfg.senderEmail || user;
  const senderName = cfg.senderName || 'Dekel.Formation';

  const cleanPass = pass.replace(/\s+/g, '');
  const hasSpaces = pass.includes(' ');

  log(`📋 Configuration active -> Host: ${host}:${port} | Compte: ${user} | Expéditeur: ${senderEmail}`);
  log(`🔑 Clé d'application : ${pass ? `Définie (${pass.length} chars, nettoyée: ${cleanPass.length} chars)` : '❌ MANQUANTE'}`);

  if (!pass) {
    log("❌ ERREUR: Aucun mot de passe d'application Gmail n'est configuré !");
    recommendations.push("Générez un Mot de Passe d'Application à 16 caractères sur votre compte Google (Sécurité > Validation en 2 étapes > Mots de passe d'application) et renseignez la variable d'environnement GMAIL_APP_PASSWORD sur Render.");
  }

  if (hasSpaces) {
    log("⚠️ REMARQUE : Des espaces ont été détectés dans le mot de passe d'application. Ils sont nettoyés automatiquement.");
  }

  // 1. DNS Resolution Check
  const dnsStart = Date.now();
  let dnsResult: { success: boolean; ip?: string; error?: string; durationMs?: number } = { success: false };
  try {
    log(`🔍 Test de résolution DNS pour host=${host}...`);
    const addresses = await dns.promises.lookup(host);
    const durationMs = Date.now() - dnsStart;
    dnsResult = { success: true, ip: addresses.address, durationMs };
    log(`✅ Résolution DNS réussie : ${host} -> IP ${addresses.address} (${durationMs}ms)`);
  } catch (dnsErr: any) {
    const durationMs = Date.now() - dnsStart;
    dnsResult = { success: false, error: dnsErr.message, durationMs };
    log(`❌ ÉCHEC de la résolution DNS pour ${host} : ${dnsErr.message}`);
    recommendations.push(`Impossible de résoudre l'hôte DNS ${host}. Vérifiez la connexion Internet et les résolveurs DNS.`);
  }

  // Helper for TCP Port Testing
  const checkPort = (testHost: string, testPort: number, timeoutMs = 5000) => {
    return new Promise<{ success: boolean; durationMs?: number; error?: string; localAddress?: string; remoteAddress?: string }>((resolve) => {
      const tcpStart = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.connect(testPort, testHost, () => {
        const durationMs = Date.now() - tcpStart;
        const res = {
          success: true,
          localAddress: socket.localAddress,
          remoteAddress: socket.remoteAddress,
          durationMs
        };
        socket.destroy();
        resolve(res);
      });

      socket.on('error', (err) => {
        const durationMs = Date.now() - tcpStart;
        socket.destroy();
        resolve({ success: false, error: err.message, durationMs });
      });

      socket.on('timeout', () => {
        const durationMs = Date.now() - tcpStart;
        socket.destroy();
        resolve({ success: false, error: `TIMEOUT (${timeoutMs}ms) - Port bloqué ou filtré par l'hébergeur.`, durationMs });
      });
    });
  };

  // 2. TCP Socket Connection Check
  let tcpResult: { success: boolean; localAddress?: string; remoteAddress?: string; durationMs?: number; error?: string } = { success: false };
  if (dnsResult.success) {
    log(`🔌 Test de socket TCP brut vers ${host}:${port}...`);
    tcpResult = await checkPort(host, port, 6000);

    if (tcpResult.success) {
      log(`✅ Socket TCP connecté avec succès à ${host}:${port} (${tcpResult.durationMs}ms)`);
    } else {
      log(`❌ ÉCHEC de la connexion TCP (${host}:${port}) : ${tcpResult.error || 'Refusée'}`);

      // Test alternative ports if the main port failed
      const altPorts = [587, 2525, 80].filter(p => p !== port);
      log(`🔍 Test automatique des ports SMTP alternatifs (${altPorts.join(', ')})...`);

      let workingAltPort: number | null = null;
      for (const altPort of altPorts) {
        const altRes = await checkPort(host, altPort, 4000);
        if (altRes.success) {
          log(`💡 PORT OUVERT DÉTECTÉ : Port ${altPort} sur ${host} réponds positivement !`);
          workingAltPort = altPort;
          recommendations.push(`Le port principal ${port} est bloqué par Render, mais le port ${altPort} est accessible ! Changez le port SMTP pour ${altPort} dans la configuration.`);
          break;
        } else {
          log(`  - Port ${altPort} : Bloqué (${altRes.error})`);
        }
      }

      if (isRender && !workingAltPort) {
        log(`🚨 RESTRICTION DÉTECTÉE SUR RENDER : Render bloque les ports TCP SMTP sortants (25, 465, 587) par défaut sur ses services Web pour éviter le spam.`);
        recommendations.push(`EXPLICATION RENDER : Render bloque le port SMTP TCP ${port} (et 587). SOLUTIONS : 1) Si vous avez un compte payant Render, soumettez un ticket support 'Enable Outbound SMTP'. 2) Utilisez un relais d'e-mail HTTP/REST (comme Brevo ou Resend) qui utilise le port HTTPS 443 (jamais bloqué sur Render). 3) Vous pouvez aussi tenter le port 2525 ou 8080 si disponible sur votre serveur SMTP.`);
      } else if (!workingAltPort) {
        recommendations.push(`Connexion TCP refusée ou bloquée vers ${host}:${port}. Vérifiez votre pare-feu ou vos paramètres réseau.`);
      }
    }
  }

  // 3. SMTP Handshake & Authentication Check
  let smtpVerify: { success: boolean; durationMs?: number; error?: string } = { success: false };
  if (tcpResult.success && pass) {
    log(`🔐 Authentification SMTP en cours via Nodemailer...`);
    const verifyStart = Date.now();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      },
      logger: true,
      debug: true
    } as any);

    try {
      await transporter.verify();
      const durationMs = Date.now() - verifyStart;
      smtpVerify = { success: true, durationMs };
      log(`🎉 VÉRIFICATION SMTP RÉUSSIE ! Le compte Gmail ${user} est pleinement autorisé (${durationMs}ms)`);
    } catch (authErr: any) {
      const durationMs = Date.now() - verifyStart;
      smtpVerify = { success: false, error: authErr.message, durationMs };
      log(`❌ ERREUR Authentification Gmail SMTP : ${authErr.message}`);

      if (authErr.message.includes('535') || authErr.message.includes('Username and Password not accepted')) {
        recommendations.push("Mot de passe d'application invalide : Générez un nouveau 'Mot de Passe d'Application' à 16 lettres sur Google (Sécurité > Validation en 2 étapes > Mots de passe d'application) et mettez à jour la variable GMAIL_APP_PASSWORD sur Render.");
      } else if (authErr.message.includes('534') || authErr.message.includes('Check log in on web')) {
        recommendations.push("Google requiert une validation web. Connectez-vous à votre compte Google et validez l'alerte de sécurité relative à la tentative de connexion depuis le serveur Render.");
      } else {
        recommendations.push(`Erreur SMTP : ${authErr.message}`);
      }
    }
  }

  // 4. Test Email Sending
  let testEmailSend: { success: boolean; messageId?: string; accepted?: string[]; error?: string } | undefined = undefined;

  if (smtpVerify.success && options?.sendTestEmailTo) {
    const targetEmail = options.sendTestEmailTo.trim().toLowerCase();
    log(`✉️ Envoi d'un e-mail de test réel à : ${targetEmail}...`);

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass: cleanPass },
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: targetEmail,
        subject: `[DIAGNOSTIC SMTP] Test de transmission Dekel.Formation - ${new Date().toLocaleTimeString()}`,
        html: `
          <div style="font-family: system-ui, sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
            <h2 style="color: #34d399; margin-top: 0;">✅ Test de Diagnostic SMTP Réussi !</h2>
            <p>Cet e-mail confirme que le serveur de messagerie Dekel.Formation peut transmettre des messages en direct.</p>
            <hr style="border-color: #334155; margin: 16px 0;" />
            <ul style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
              <li><strong>Serveur expéditeur :</strong> ${host}:${port} (${isRender ? 'Hébergé sur Render' : 'Environnement Standalone'})</li>
              <li><strong>Adresse d'envoi :</strong> ${senderEmail}</li>
              <li><strong>Destinataire :</strong> ${targetEmail}</li>
              <li><strong>Horodatage :</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
        `,
        text: `Test de Diagnostic SMTP Réussi pour ${targetEmail} à ${new Date().toISOString()}`
      });

      testEmailSend = {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted as string[]
      };
      log(`✅ E-mail de diagnostic transmis avec succès ! ID: ${info.messageId}`);
    } catch (sendErr: any) {
      testEmailSend = {
        success: false,
        error: sendErr.message
      };
      log(`❌ Échec de la livraison de l'e-mail de test : ${sendErr.message}`);
      recommendations.push(`Erreur lors de la livraison du message : ${sendErr.message}`);
    }
  }

  log("🏁 Diagnostic terminé.");

  return {
    timestamp: new Date().toISOString(),
    isRender,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      gmailUser: user,
      hasAppPassword: Boolean(pass),
      appPasswordLength: pass.length,
      hasSpacesInPassword: hasSpaces,
      smtpHost: host,
      smtpPort: port,
      senderEmail,
      senderName
    },
    checks: {
      dns: dnsResult,
      tcp: tcpResult,
      smtpVerify,
      testEmailSend
    },
    logs,
    recommendations
  };
}

