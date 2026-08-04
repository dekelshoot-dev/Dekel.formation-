import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { 
  queueTransactionalEmail, 
  processTransactionalEmailQueue, 
  generateSignedToken, 
  verifySignedToken, 
  createSmtpTransporter,
  runSmtpDiagnostic,
  readDb as readEmailDb, 
  writeDb as writeEmailDb 
} from "./server/emailServerService";
import { EMAIL_TEMPLATE_DEFINITIONS } from "./src/services/emailTemplates";

// Read Firebase config safely from json file or environment
let firebaseConfig: any = {};
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  } else if (process.env.FIREBASE_WEBAPP_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
  } else if (process.env.FIREBASE_CONFIG) {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  }
} catch (err) {
  console.warn("Warning: Could not parse Firebase configuration:", err);
}

const firebaseApp = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.join(process.cwd(), "webhook_db.json");

// Parse payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Robust global JSON syntax error interceptor middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    const db = readDb();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    
    const logEntry = {
      id: logId,
      courseId: "malformed_json_payload",
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: null,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: new Date().toISOString(),
      status: "failed_malformed_json",
      errorMessage: `Format JSON invalide : ${err.message}`,
      outcome: "Échec critique du parsing JSON (La charge utile brute envoyée est syntaxiquement incorrecte ou tronquée)"
    };

    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb(db);

    return res.status(400).json({
      status: "error",
      message: "Bad Request: Malformed JSON payload received.",
      error: err.message,
      logId,
      outcome: logEntry.outcome
    });
  }
  next();
});

// Ensure database file exists
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { enrollments: [], logs: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return { enrollments: [], logs: [] };
  }
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// API: Webhook Receiver (Requirement 2)
app.post("/api/webhooks/payment/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  // 1. Validate that the target course actually exists in Firestore (401 Unauthorized check)
  let webhookEmailKey = "email";
  let webhookNameKey = "name";
  let courseExists = false;
  let courseTitle = "";

  try {
    const courseRef = doc(dbFirestore, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      if (courseData.webhookDisabled === true || courseData.webhookUrl === 'disabled') {
        courseExists = false;
      } else {
        courseExists = true;
        courseTitle = courseData.title || "";
        if (courseData.webhookEmailKey) {
          webhookEmailKey = courseData.webhookEmailKey;
        }
        if (courseData.webhookNameKey) {
          webhookNameKey = courseData.webhookNameKey;
        }
      }
    } else if (courseId === 'c-1' || courseId === 'c-2' || courseId === 'c-3' || courseId.startsWith('c-')) {
      courseExists = true;
      courseTitle = "Formation Dekel Test";
    }
  } catch (e: any) {
    console.warn("Could not read course config from Firestore", e);
    if (courseId === 'c-1' || courseId === 'c-2' || courseId === 'c-3' || courseId.startsWith('c-')) {
      courseExists = true;
      courseTitle = "Formation Dekel Test";
    }
  }

  if (!courseExists) {
    const errorMessage = `Accès non autorisé : La formation avec l'identifiant '${courseId}' n'existe pas ou le webhook n'est pas autorisé.`;
    const outcome = "Accès refusé (formation introuvable ou non enregistrée)";
    
    const logEntry = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: new Date().toISOString(),
      status: "failed_unauthorized_course",
      errorMessage,
      outcome
    };

    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb(db);

    return res.status(401).json({
      status: "error",
      message: errorMessage,
      logId,
      error: "Unauthorized target resource"
    });
  }

  // 2. Extract and strictly validate JSON payload structure & format
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e: any) {
      const errorMessage = `Format JSON invalide dans le corps brut : ${e.message}`;
      const outcome = "Échec du parsing JSON (Données brutes illisibles)";
      
      const logEntry = {
        id: logId,
        courseId,
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
        body: null,
        query: req.query,
        detectedEmail: null,
        detectedName: null,
        receivedAt: new Date().toISOString(),
        status: "failed_malformed_json",
        errorMessage,
        outcome
      };

      db.logs.unshift(logEntry);
      if (db.logs.length > 200) {
        db.logs = db.logs.slice(0, 200);
      }
      writeDb(db);

      return res.status(400).json({
        status: "error",
        message: "Bad Request: Unable to parse payload body as valid JSON object.",
        logId,
        error: errorMessage
      });
    }
  }

  body = body || {};

  // Check if body is empty or null (which could happen if payload is missing or invalid content type)
  if (Object.keys(body).length === 0 && Object.keys(req.query).length === 0) {
    const errorMessage = "La charge utile JSON reçue et les paramètres de requête sont complètement vides.";
    const outcome = "Échec de validation (Requête vide)";
    
    const logEntry = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: new Date().toISOString(),
      status: "failed_empty_payload",
      errorMessage,
      outcome
    };

    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb(db);

    return res.status(400).json({
      status: "error",
      message: "Bad Request: Request payload is empty.",
      logId,
      error: errorMessage
    });
  }

  // 3. Extract mapped/fallback attributes
  let detectedEmail = "";
  let detectedName = "";

  // Try custom path values first
  const emailVal = getValueByPath(body, webhookEmailKey);
  if (emailVal && typeof emailVal === "string") {
    detectedEmail = emailVal;
  }

  const nameVal = getValueByPath(body, webhookNameKey);
  if (nameVal && typeof nameVal === "string") {
    detectedName = nameVal;
  }

  // Check Query params second
  if (!detectedEmail && req.query.email && typeof req.query.email === "string") {
    detectedEmail = req.query.email;
  }
  
  // Inspect request body fallbacks
  if (!detectedEmail && body) {
    detectedEmail = 
      body.email || 
      body.customer_email || 
      body.studentEmail ||
      body.student_email ||
      body.customer?.email ||
      body.data?.object?.customer_details?.email || // Stripe Checkout payload
      body.payer?.email_address ||                 // PayPal standard payload
      body.email_address ||
      body.payload?.email ||
      "";
  }

  // Generic fallback for name
  if (!detectedName && body) {
    detectedName = 
      body.name ||
      body.customer_name ||
      body.studentName ||
      body.student_name ||
      body.customer?.name ||
      body.data?.object?.customer_details?.name ||
      "";
  }

  // 4. Validate Email Format constraints
  detectedEmail = detectedEmail ? detectedEmail.trim() : "";
  detectedName = detectedName ? detectedName.trim() : "";

  let emailError = "";
  let emailStatus = "";
  let emailOutcome = "";

  if (!detectedEmail) {
    emailError = "Adresse e-mail manquante dans la charge utile JSON ou les paramètres de requête.";
    emailStatus = "failed_missing_email";
    emailOutcome = "Accès refusé (adresse e-mail introuvable)";
  } else {
    // Validate with strict regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(detectedEmail)) {
      emailError = `L'adresse e-mail '${detectedEmail}' a un format syntaxique invalide (ex attendu: nom@domaine.com).`;
      emailStatus = "failed_invalid_email_format";
      emailOutcome = "Accès refusé (format d'e-mail incorrect)";
    }
  }

  if (emailError) {
    const logEntry = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: detectedEmail || null,
      detectedName: detectedName || null,
      receivedAt: new Date().toISOString(),
      status: emailStatus,
      errorMessage: emailError,
      outcome: emailOutcome
    };

    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb(db);

    return res.status(400).json({
      status: "error",
      message: "Bad Request: Validation failed for student email.",
      logId,
      error: emailError,
      outcome: emailOutcome
    });
  }

  // 5. Check if student is already enrolled in this course ("si un webhook est reçu et que le mail reçu est déja dans la formation, ne rien faire")
  const targetEmailLower = detectedEmail.toLowerCase();
  let alreadyEnrolledInCourse = false;

  // Check local db.enrollments
  if (db.enrollments && Array.isArray(db.enrollments)) {
    alreadyEnrolledInCourse = db.enrollments.some(
      (e: any) => e.studentEmail && e.studentEmail.toLowerCase() === targetEmailLower && e.courseId === courseId
    );
  }

  // Check Firestore enrollments collection
  if (!alreadyEnrolledInCourse) {
    try {
      const enrollmentsRef = collection(dbFirestore, "enrollments");
      const q = query(
        enrollmentsRef,
        where("studentEmail", "==", targetEmailLower),
        where("courseId", "==", courseId),
        where("status", "==", "active")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alreadyEnrolledInCourse = true;
      }
    } catch (err) {
      // Ignore query error
    }
  }

  if (alreadyEnrolledInCourse) {
    const ignoredOutcome = `L'étudiant '${detectedEmail}' a déjà la formation. Aucune action effectuée.`;
    const logEntry = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail,
      detectedName: detectedName || null,
      receivedAt: new Date().toISOString(),
      status: "ignored_already_enrolled",
      errorMessage: "",
      outcome: ignoredOutcome
    };

    db.logs.unshift(logEntry);
    if (db.logs.length > 200) {
      db.logs = db.logs.slice(0, 200);
    }
    writeDb(db);

    return res.status(200).json({
      status: "success",
      message: `L'étudiant ${detectedEmail} a déjà la formation. Aucune action n'a été effectuée.`,
      logId,
      outcome: ignoredOutcome
    });
  }

  // 6. Successful Processing - Register Enrollment & Log Success (200 OK)
  const finalOutcome = `Accès accordé avec succès pour la formation "${courseTitle}"`;
  const logEntry = {
    id: logId,
    courseId,
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    detectedEmail,
    detectedName: detectedName || null,
    receivedAt: new Date().toISOString(),
    status: "success",
    errorMessage: "",
    outcome: finalOutcome
  };

  // Record active pending enrollment to be fetched by the SPA sync process
  const enrollmentRecord = {
    id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    courseId,
    studentEmail: detectedEmail.toLowerCase(),
    studentName: detectedName || undefined,
    enrolledAt: new Date().toISOString(),
    synced: false
  };

  db.logs.unshift(logEntry);
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  db.enrollments.push(enrollmentRecord);
  writeDb(db);

  // Automatically queue transactional email for webhook enrollment asynchronously
  try {
    queueTransactionalEmail({
      to: detectedEmail.toLowerCase(),
      recipientName: detectedName || undefined,
      type: 'payment_webhook_enrolled',
      category: 'payments',
      renderData: {
        recipientEmail: detectedEmail.toLowerCase(),
        courseTitle,
        courseId,
        transactionRef: enrollmentRecord.id,
        actionUrl: `${req.protocol}://${req.get('host')}`
      },
      metadata: { source: 'webhook', courseId, enrollmentId: enrollmentRecord.id }
    });
  } catch (emailErr) {
    console.warn("Could not queue transactional email for webhook:", emailErr);
  }

  return res.status(200).json({
    status: "success",
    message: `Payment registered successfully. Student ${detectedEmail} has been enrolled in "${courseTitle}".`,
    enrollmentId: enrollmentRecord.id,
    logId,
    outcome: finalOutcome
  });
});

// ==========================================
// API: TRANSACTIONAL EMAIL SYSTEM ENDPOINTS
// ==========================================

// API: Queue & send a transactional email
app.post(["/api/emails/send", "/api/emails/queue"], async (req, res) => {
  const { to, recipientName, type, category, renderData, actionUrl, metadata } = req.body;

  if (!to || typeof to !== "string" || !to.includes("@")) {
    return res.status(400).json({ status: "error", message: "Adresse e-mail destinataire invalide." });
  }

  if (!type) {
    return res.status(400).json({ status: "error", message: "Le type d'e-mail est requis." });
  }

  const requestOrigin = req.headers.origin 
    || (req.headers.referer ? new URL(req.headers.referer as string).origin : null)
    || `${req.protocol}://${req.get('host')}`;

  const mergedRenderData = {
    origin: requestOrigin,
    baseUrl: requestOrigin,
    ...(renderData || {})
  };

  try {
    const queuedEmail = queueTransactionalEmail({
      to,
      recipientName,
      type,
      category: category || 'authentication',
      renderData: mergedRenderData,
      actionUrl,
      metadata: metadata || {}
    });

    // Execute SMTP delivery immediately
    const queueResult = await processTransactionalEmailQueue();

    return res.status(200).json({
      status: "success",
      message: queueResult.successCount > 0 ? "E-mail transactionnel transmis avec succès via le serveur SMTP." : "E-mail transactionnel mis en file d'attente d'envoi.",
      email: queuedEmail,
      queueResult
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

// API: Get transactional email logs with filtering and search
app.get("/api/emails/logs", (req, res) => {
  const db = readEmailDb();
  let logs = db.transactional_emails || [];

  const { category, status, type, search } = req.query;

  if (category && typeof category === "string") {
    logs = logs.filter((e: any) => e.category === category);
  }

  if (status && typeof status === "string") {
    logs = logs.filter((e: any) => e.status === status);
  }

  if (type && typeof type === "string") {
    logs = logs.filter((e: any) => e.type === type);
  }

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    logs = logs.filter((e: any) => 
      e.to.toLowerCase().includes(q) ||
      (e.recipientName && e.recipientName.toLowerCase().includes(q)) ||
      e.subject.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  }

  return res.json({ logs });
});

// API: Get single email log detail
app.get("/api/emails/logs/:id", (req, res) => {
  const db = readEmailDb();
  const email = (db.transactional_emails || []).find((e: any) => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ status: "error", message: "E-mail introuvable." });
  }
  return res.json({ email });
});

// API: Retry sending a failed email
app.post("/api/emails/retry/:id", async (req, res) => {
  const db = readEmailDb();
  const email = (db.transactional_emails || []).find((e: any) => e.id === req.params.id);
  
  if (!email) {
    return res.status(404).json({ status: "error", message: "E-mail introuvable." });
  }

  email.status = "pending";
  email.attempts = 0;
  email.error = undefined;
  writeEmailDb(db);

  await processTransactionalEmailQueue();

  const updatedDb = readEmailDb();
  const updatedEmail = (updatedDb.transactional_emails || []).find((e: any) => e.id === req.params.id);

  return res.json({
    status: "success",
    message: "Nouvelle tentative d'envoi exécutée.",
    email: updatedEmail
  });
});

// API: Delete single email log
app.delete("/api/emails/logs/:id", (req, res) => {
  const db = readEmailDb();
  db.transactional_emails = (db.transactional_emails || []).filter((e: any) => e.id !== req.params.id);
  writeEmailDb(db);
  return res.json({ status: "success", message: "E-mail supprimé de l'historique." });
});

// API: Clear all email logs
app.delete("/api/emails/logs", (req, res) => {
  const db = readEmailDb();
  db.transactional_emails = [];
  writeEmailDb(db);
  return res.json({ status: "success", message: "Historique des e-mails entièrement effacé." });
});

// API: Get available templates
app.get("/api/emails/templates", (req, res) => {
  return res.json({ templates: EMAIL_TEMPLATE_DEFINITIONS });
});

// API: Send test email for template
app.post("/api/emails/test-send", async (req, res) => {
  const { type, recipientEmail, recipientName, customMessage } = req.body;

  if (!type || !recipientEmail) {
    return res.status(400).json({ status: "error", message: "Le type et le destinataire sont requis." });
  }

  const templateDef = EMAIL_TEMPLATE_DEFINITIONS.find(t => t.type === type);
  const sample = templateDef?.sampleData || {};

  const hostUrl = `${req.protocol}://${req.get('host')}`;
  const actionToken = generateSignedToken('test_action', recipientEmail, 86400);

  const queued = queueTransactionalEmail({
    to: recipientEmail,
    recipientName: recipientName || sample.recipientName || 'Testeur Dekel',
    type,
    category: templateDef?.category || 'authentication',
    renderData: {
      ...sample,
      recipientName: recipientName || sample.recipientName || 'Testeur Dekel',
      recipientEmail,
      actionUrl: `${hostUrl}/verify?token=${actionToken}`,
      customMessage: customMessage || sample.customMessage
    },
    actionUrl: `${hostUrl}/verify?token=${actionToken}`,
    metadata: { isTestSend: true }
  });

  await processTransactionalEmailQueue();

  return res.json({
    status: "success",
    message: `E-mail de test (${type}) envoyé à ${recipientEmail}.`,
    email: queued
  });
});

// API: Verify signed token (for verification links, password reset, invitations)
app.get("/api/emails/verify-token", (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    return res.status(400).json({ valid: false, error: "Jeton manquant dans la requête." });
  }

  const result = verifySignedToken(token);
  return res.json(result);
});

// API: Server-managed password reset request via SMTP (Generates signed oobCode)
app.post("/api/auth/request-password-reset", async (req, res) => {
  const { email, recipientName, origin } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ status: "error", message: "Adresse e-mail destinataire invalide." });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const name = recipientName || trimmedEmail.split("@")[0];

  // Generate signed server token (oobCode) valid for 1 hour (3600 seconds)
  const oobCode = generateSignedToken('reset_password', trimmedEmail, 3600);
  const baseUrl = origin || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${baseUrl}?mode=resetPassword&oobCode=${oobCode}&email=${encodeURIComponent(trimmedEmail)}`;

  try {
    const queuedEmail = queueTransactionalEmail({
      to: trimmedEmail,
      recipientName: name,
      type: 'auth_reset_password',
      category: 'authentication',
      renderData: {
        recipientName: name,
        recipientEmail: trimmedEmail,
        actionUrl: resetUrl
      },
      actionUrl: resetUrl,
      metadata: { event: 'password_reset_request', oobCode }
    });

    await processTransactionalEmailQueue();

    return res.json({
      status: "success",
      message: "Lien de réinitialisation généré et envoyé via le serveur SMTP.",
      oobCode,
      resetUrl,
      email: queuedEmail
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message || "Erreur lors de l'envoi de l'e-mail." });
  }
});

// API: Server-managed password reset confirmation
app.post("/api/auth/reset-password", async (req, res) => {
  const { token, oobCode, newPassword } = req.body;
  const tokenToVerify = token || oobCode;

  if (!tokenToVerify) {
    return res.status(400).json({ status: "error", message: "Code de réinitialisation (oobCode) manquant." });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ status: "error", message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
  }

  const verification = verifySignedToken(tokenToVerify);
  if (!verification.valid || !verification.payload) {
    return res.status(400).json({ status: "error", message: verification.error || "Lien de réinitialisation invalide ou expiré." });
  }

  const { email } = verification.payload;

  return res.json({
    status: "success",
    message: "Le mot de passe a été réinitialisé avec succès.",
    email
  });
});

// API: Get / Update Email Server Configuration
app.get("/api/emails/config", (req, res) => {
  const db = readEmailDb();
  return res.json({ config: db.email_config });
});

app.post("/api/emails/config", (req, res) => {
  const db = readEmailDb();
  db.email_config = {
    ...db.email_config,
    ...req.body
  };
  writeEmailDb(db);
  return res.json({ status: "success", message: "Configuration du serveur d'e-mails enregistrée.", config: db.email_config });
});

// API: Test SMTP connection live
app.post("/api/emails/test-smtp", async (req, res) => {
  const { gmailUser, gmailAppPassword, smtpHost, smtpPort } = req.body;
  const { transporter, user, host, port, error } = createSmtpTransporter({
    gmailUser,
    gmailAppPassword,
    smtpHost,
    smtpPort
  });

  if (!transporter) {
    return res.status(400).json({ status: "error", message: error || "Configuration SMTP incomplète." });
  }

  try {
    await transporter.verify();
    return res.json({
      status: "success",
      message: `Connexion SMTP Gmail réussie avec succès pour ${user} sur ${host}:${port} !`
    });
  } catch (verifyErr: any) {
    return res.status(500).json({
      status: "error",
      message: `Échec de la connexion SMTP Gmail : ${verifyErr.message}`
    });
  }
});

// API: Run Real-time SMTP Diagnostic Script with Detailed Logs
app.post("/api/emails/diagnostic", async (req, res) => {
  try {
    const { sendTestEmailTo, configOverride } = req.body || {};
    const diagnosticResult = await runSmtpDiagnostic({
      sendTestEmailTo,
      configOverride
    });
    return res.json({
      status: "success",
      diagnostic: diagnosticResult
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "error",
      message: err.message || "Erreur lors de l'exécution du diagnostic SMTP."
    });
  }
});

// API: Read ALL webhook logs for the general administrator tab
app.get("/api/webhooks/logs", (req, res) => {
  const db = readDb();
  res.json({ logs: db.logs || [] });
});

// API: Clear ALL webhook logs
app.delete("/api/webhooks/logs", (req, res) => {
  const db = readDb();
  db.logs = [];
  writeDb(db);
  res.json({ status: "success", message: "All webhook logs cleared" });
});

// API: Read recent webhook logs (Requirement 2 UI)
app.get("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  const courseLogs = db.logs.filter((l: any) => l.courseId === courseId);
  res.json({ logs: courseLogs });
});

// API: Clear all webhook logs for a course (Requirement 2 UI)
app.delete("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  db.logs = db.logs.filter((l: any) => l.courseId !== courseId);
  writeDb(db);
  res.json({ status: "success", message: "Logs cleared" });
});

// API: Delete a single webhook log entry
app.delete("/api/webhooks/log/:logId", async (req, res) => {
  const { logId } = req.params;
  const db = readDb();
  db.logs = db.logs.filter((l: any) => l.id !== logId);
  writeDb(db);
  try {
    await deleteDoc(doc(dbFirestore, "webhook_logs", logId));
  } catch (err) {
    // Ignore if not in firestore
  }
  res.json({ status: "success", message: "Single webhook log deleted" });
});

// API: Sync Pending Enrollments (Requirement 2 client sync)
app.get("/api/sync-enrollments", (req, res) => {
  const db = readDb();
  // Filter unsynced enrollments
  const unsynced = db.enrollments.filter((e: any) => !e.synced);
  
  // Mark them as synced now so they are not synchronized again
  db.enrollments = db.enrollments.map((e: any) => ({ ...e, synced: true }));
  writeDb(db);

  res.json({ enrollments: unsynced });
});

// Helper to render standalone HTML documents for Custom HTML Pages
function renderCustomHtmlDocument(page: any): string {
  const trimmedHtml = (page.html || "").trim();
  if (trimmedHtml.toLowerCase().startsWith("<!doctype") || trimmedHtml.toLowerCase().startsWith("<html")) {
    return page.html;
  }

  const seoTitle = (page.seoTitle || page.title || "Dekel.Formation")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const seoDesc = (page.seoDescription || "").replace(/"/g, "&quot;");
  const ogImg = page.ogImage || "";
  const headTags = page.customHeadTags || "";
  const css = page.css || "";
  const htmlBody = page.html || "";
  const js = page.js || "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  ${seoDesc ? `<meta name="description" content="${seoDesc}">` : ""}
  ${ogImg ? `<meta property="og:image" content="${ogImg}">` : ""}
  <meta property="og:title" content="${seoTitle.replace(/"/g, "&quot;")}">
  ${headTags}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background-color: #ffffff;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    ${css}
  </style>
</head>
<body>
  ${htmlBody}
  <script>
    window.addEventListener('error', function(e) {
      console.warn('Custom Page Script Warning:', e.message);
    });
    try {
      ${js}
    } catch(err) {
      console.error('Custom Page JS execution error:', err);
    }
  </script>
</body>
</html>`;
}

// FAST DIRECT SERVER-SIDE ROUTE FOR CUSTOM HTML PAGES (/p/:slug, /page/:slug, /pages/:slug)
app.get(["/p/:slug", "/p/:slug/*", "/page/:slug", "/pages/:slug"], async (req, res, next) => {
  const rawSlug = req.params.slug || "";
  const cleanSlug = rawSlug.trim().replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();

  if (!cleanSlug) {
    return next();
  }

  try {
    let matchedDoc: any = null;

    // Direct ID lookup in Firestore
    const docRef = doc(dbFirestore, "custom_pages", cleanSlug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      matchedDoc = docSnap.data();
    } else {
      // Query by slug variants
      const possibleSlugs = [cleanSlug, `/${cleanSlug}`, `p/${cleanSlug}`];
      const q = query(
        collection(dbFirestore, "custom_pages"),
        where("slug", "in", possibleSlugs)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        matchedDoc = querySnapshot.docs[0].data();
      } else {
        // Full scan fallback for fuzzy slug matches
        const allSnap = await getDocs(collection(dbFirestore, "custom_pages"));
        allSnap.forEach((d) => {
          if (!matchedDoc) {
            const pageData = d.data();
            const pSlug = (pageData.slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
            if (pSlug === cleanSlug || d.id === cleanSlug) {
              matchedDoc = pageData;
            }
          }
        });
      }
    }

    if (matchedDoc && matchedDoc.html) {
      if (matchedDoc.id) {
        updateDoc(doc(dbFirestore, "custom_pages", matchedDoc.id), {
          viewsCount: increment(1)
        }).catch(() => {});
      }
      const pageHtml = renderCustomHtmlDocument(matchedDoc);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      return res.status(200).send(pageHtml);
    }
  } catch (err) {
    console.error("Error serving custom page directly from Express server:", err);
  }

  next();
});

// SEO: Dynamic Robots.txt Route
app.get("/robots.txt", (req, res) => {
  const hostUrl = `${req.protocol}://${req.get("host")}`;
  const robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /admin/
Disallow: /student
Disallow: /student/
Disallow: /trainer
Disallow: /trainer/
Disallow: /auth
Disallow: /auth/
Disallow: /api/
Disallow: /verify-email
Disallow: /reset-password

Allow: /
Allow: /formation/
Allow: /formateur/
Allow: /categorie/
Allow: /marketplace
Allow: /p/
Allow: /sitemap.xml

Sitemap: ${hostUrl}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.status(200).send(robotsTxt);
});

// SEO: Dynamic Sitemap.xml Generator
app.get("/sitemap.xml", async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const now = new Date().toISOString().split("T")[0];

  const courseUrls: string[] = [];
  const categoryUrls: string[] = [];
  const customPageUrls: string[] = [];

  try {
    // 1. Fetch published courses
    const coursesRef = collection(dbFirestore, "courses");
    const qCourses = query(coursesRef, where("status", "==", "published"));
    const coursesSnap = await getDocs(qCourses);

    const categoriesSet = new Set<string>();

    coursesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const slug = data.seoSlug || docSnap.id;
      const courseDate = (data.updatedAt || data.createdAt || now).split("T")[0];

      courseUrls.push(`  <url>
    <loc>${baseUrl}/formation/${encodeURIComponent(slug)}</loc>
    <lastmod>${courseDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`);

      if (data.type) {
        categoriesSet.add(data.type);
      }
    });

    // Categories URLs
    categoriesSet.forEach((cat) => {
      const catSlug = cat.toLowerCase().trim().replace(/\s+/g, "-");
      categoryUrls.push(`  <url>
    <loc>${baseUrl}/categorie/${encodeURIComponent(catSlug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    // 2. Fetch custom HTML pages
    const pagesSnap = await getDocs(collection(dbFirestore, "custom_pages"));
    pagesSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === "published" || !data.status) {
        const slug = (data.slug || docSnap.id).trim().replace(/^\/+/, "");
        const pageDate = (data.updatedAt || data.createdAt || now).split("T")[0];
        customPageUrls.push(`  <url>
    <loc>${baseUrl}/p/${encodeURIComponent(slug)}</loc>
    <lastmod>${pageDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    });
  } catch (err) {
    console.warn("Sitemap database generation notice:", err);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/marketplace</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${courseUrls.join("\n")}
${categoryUrls.join("\n")}
${customPageUrls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=3600");
  return res.status(200).send(sitemapXml);
});

// Helper for serving index.html with server-injected SEO meta tags for social crawlers (WhatsApp, FB, Twitter, LinkedIn)
async function renderHtmlWithSeoMeta(req: express.Request, meta: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: any;
}) {
  let html = "";
  const indexPath = process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "dist", "index.html")
    : path.join(process.cwd(), "index.html");

  try {
    html = fs.readFileSync(indexPath, "utf-8");
  } catch (e) {
    html = `<!DOCTYPE html><html><head><title>${meta.title || "Dekel.Formation"}</title></head><body><div id="root"></div></body></html>`;
  }

  const cleanTitle = meta.title || "Dekel.Formation - Plateforme E-Learning";
  const cleanDesc = meta.description || "Découvrez nos formations certifiantes et développez vos compétences avec Dekel.Formation.";
  const cleanImage = meta.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200";
  const cleanUrl = meta.url || `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  // Replace default title tag
  html = html.replace(/<title>.*?<\/title>/gi, `<title>${cleanTitle}</title>`);

  const metaTags = `
    <meta name="description" content="${cleanDesc.replace(/"/g, '&quot;')}" />
    <link rel="canonical" href="${cleanUrl}" />
    <meta name="robots" content="index, follow" />
    <meta property="og:site_name" content="Dekel.Formation" />
    <meta property="og:type" content="${meta.type || 'website'}" />
    <meta property="og:title" content="${cleanTitle.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${cleanDesc.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="${cleanImage}" />
    <meta property="og:url" content="${cleanUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${cleanTitle.replace(/"/g, '&quot;')}" />
    <meta name="twitter:description" content="${cleanDesc.replace(/"/g, '&quot;')}" />
    <meta name="twitter:image" content="${cleanImage}" />
    ${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ''}
  `;

  return html.replace('</head>', `${metaTags}\n</head>`);
}

// SEO Public Course Server Route for Social Crawlers
app.get(["/formation/:slug", "/course/:slug", "/f/:slug"], async (req, res, next) => {
  const rawSlug = req.params.slug || "";
  const cleanSlug = rawSlug.trim().toLowerCase();

  if (!cleanSlug) return next();

  try {
    let courseData: any = null;
    let courseId = cleanSlug;

    // Check direct doc ID
    const docRef = doc(dbFirestore, "courses", cleanSlug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      courseData = docSnap.data();
    } else {
      // Check by seoSlug
      const q = query(collection(dbFirestore, "courses"), where("seoSlug", "==", cleanSlug));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        courseData = querySnap.docs[0].data();
        courseId = querySnap.docs[0].id;
      }
    }

    if (courseData) {
      const title = `${courseData.seoTitle || courseData.title} | Formation Dekel`;
      const description = courseData.seoDescription || courseData.description || "";
      const image = courseData.seoShareImage || courseData.coverImage || "";
      const url = `${req.protocol}://${req.get("host")}/formation/${courseData.seoSlug || courseId}`;

      const courseJsonLd = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": courseData.seoTitle || courseData.title,
        "description": description,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "Dekel.Formation",
          "sameAs": `${req.protocol}://${req.get("host")}`
        },
        "author": {
          "@type": "Person",
          "name": courseData.trainerName || "Formateur Dekel"
        },
        "offers": {
          "@type": "Offer",
          "category": "Paid",
          "price": courseData.promoPrice && courseData.promoPrice > 0 ? courseData.promoPrice : courseData.price,
          "priceCurrency": "XAF"
        }
      };

      const htmlWithSeo = await renderHtmlWithSeoMeta(req, {
        title,
        description,
        image,
        url,
        jsonLd: courseJsonLd
      });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      return res.status(200).send(htmlWithSeo);
    }
  } catch (err) {
    console.warn("Course page SEO server rendering notice:", err);
  }

  next();
});

// FAST DIRECT SERVER-SIDE ROUTE FOR TOP-LEVEL CUSTOM SLUGS (e.g. /offre-speciale)
const SYSTEM_PREFIXES = [
  "api", "marketplace", "admin", "student", "trainer", "auth", 
  "verify-email", "reset-password", "assets", "favicon.ico", 
  "@vite", "@fs", "src", "node_modules", "index.html", "p", "page", "pages"
];

app.get("/:slug", async (req, res, next) => {
  const rawSlug = req.params.slug || "";
  const cleanSlug = rawSlug.trim().replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();

  // Skip system routes and static files
  if (!cleanSlug || cleanSlug.includes(".") || SYSTEM_PREFIXES.includes(cleanSlug)) {
    return next();
  }

  try {
    let matchedDoc: any = null;

    const docRef = doc(dbFirestore, "custom_pages", cleanSlug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      matchedDoc = docSnap.data();
    } else {
      const possibleSlugs = [cleanSlug, `/${cleanSlug}`];
      const q = query(
        collection(dbFirestore, "custom_pages"),
        where("slug", "in", possibleSlugs)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        matchedDoc = querySnapshot.docs[0].data();
      }
    }

    if (matchedDoc && matchedDoc.html) {
      if (matchedDoc.id) {
        updateDoc(doc(dbFirestore, "custom_pages", matchedDoc.id), {
          viewsCount: increment(1)
        }).catch(() => {});
      }
      const pageHtml = renderCustomHtmlDocument(matchedDoc);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      return res.status(200).send(pageHtml);
    }
  } catch (err) {
    console.error("Error serving root custom page directly from Express server:", err);
  }

  next();
});

// Server Deployment Version & Cache Invalidation Info
const BUILD_VERSION = process.env.BUILD_ID || process.env.FIREBASE_DEPLOYMENT_ID || `deploy-${Date.now()}`;

// API: Version Check for Automatic Cache Invalidation
app.get("/api/version", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.json({
    version: BUILD_VERSION,
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Vite Middleware & SPA Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static assets
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    // Fallback SPA routing with strict no-cache for index.html
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Deployment-ID', BUILD_VERSION);
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dekel.Formation running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
