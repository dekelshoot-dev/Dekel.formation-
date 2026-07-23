var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var firebaseConfigPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
var firebaseConfig = JSON.parse(import_fs.default.readFileSync(firebaseConfigPath, "utf-8"));
var firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
var dbFirestore = (0, import_firestore.getFirestore)(firebaseApp, firebaseConfig.firestoreDatabaseId);
var app = (0, import_express.default)();
var PORT = 3e3;
var DB_FILE = import_path.default.join(process.cwd(), "webhook_db.json");
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    const db = readDb();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const logEntry = {
      id: logId,
      courseId: "malformed_json_payload",
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: null,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_malformed_json",
      errorMessage: `Format JSON invalide : ${err.message}`,
      outcome: "\xC9chec critique du parsing JSON (La charge utile brute envoy\xE9e est syntaxiquement incorrecte ou tronqu\xE9e)"
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
function readDb() {
  if (!import_fs.default.existsSync(DB_FILE)) {
    return { enrollments: [], logs: [] };
  }
  try {
    return JSON.parse(import_fs.default.readFileSync(DB_FILE, "utf-8"));
  } catch (e) {
    return { enrollments: [], logs: [] };
  }
}
function writeDb(data) {
  import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}
function getValueByPath(obj, path2) {
  if (!obj || !path2) return void 0;
  const parts = path2.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === void 0) return void 0;
    current = current[part];
  }
  return current;
}
app.post("/api/webhooks/payment/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  let webhookEmailKey = "email";
  let webhookNameKey = "name";
  let courseExists = false;
  let courseTitle = "";
  try {
    const courseRef = (0, import_firestore.doc)(dbFirestore, "courses", courseId);
    const courseSnap = await (0, import_firestore.getDoc)(courseRef);
    if (courseSnap.exists()) {
      courseExists = true;
      const courseData = courseSnap.data();
      courseTitle = courseData.title || "";
      if (courseData.webhookEmailKey) {
        webhookEmailKey = courseData.webhookEmailKey;
      }
      if (courseData.webhookNameKey) {
        webhookNameKey = courseData.webhookNameKey;
      }
    }
  } catch (e) {
    console.warn("Could not read course config from Firestore", e);
  }
  if (!courseExists) {
    const errorMessage = `Acc\xE8s non autoris\xE9 : La formation avec l'identifiant '${courseId}' n'existe pas ou le webhook n'est pas autoris\xE9.`;
    const outcome = "Acc\xE8s refus\xE9 (formation introuvable ou non enregistr\xE9e)";
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_unauthorized_course",
      errorMessage,
      outcome
    };
    db.logs.unshift(logEntry2);
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
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      const errorMessage = `Format JSON invalide dans le corps brut : ${e.message}`;
      const outcome = "\xC9chec du parsing JSON (Donn\xE9es brutes illisibles)";
      const logEntry2 = {
        id: logId,
        courseId,
        url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        method: req.method,
        headers: req.headers,
        body: null,
        query: req.query,
        detectedEmail: null,
        detectedName: null,
        receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "failed_malformed_json",
        errorMessage,
        outcome
      };
      db.logs.unshift(logEntry2);
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
  if (Object.keys(body).length === 0 && Object.keys(req.query).length === 0) {
    const errorMessage = "La charge utile JSON re\xE7ue et les param\xE8tres de requ\xEAte sont compl\xE8tement vides.";
    const outcome = "\xC9chec de validation (Requ\xEAte vide)";
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body,
      query: req.query,
      detectedEmail: null,
      detectedName: null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "failed_empty_payload",
      errorMessage,
      outcome
    };
    db.logs.unshift(logEntry2);
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
  let detectedEmail = "";
  let detectedName = "";
  const emailVal = getValueByPath(body, webhookEmailKey);
  if (emailVal && typeof emailVal === "string") {
    detectedEmail = emailVal;
  }
  const nameVal = getValueByPath(body, webhookNameKey);
  if (nameVal && typeof nameVal === "string") {
    detectedName = nameVal;
  }
  if (!detectedEmail && req.query.email && typeof req.query.email === "string") {
    detectedEmail = req.query.email;
  }
  if (!detectedEmail && body) {
    detectedEmail = body.email || body.customer_email || body.studentEmail || body.student_email || body.customer?.email || body.data?.object?.customer_details?.email || // Stripe Checkout payload
    body.payer?.email_address || // PayPal standard payload
    body.email_address || body.payload?.email || "";
  }
  if (!detectedName && body) {
    detectedName = body.name || body.customer_name || body.studentName || body.student_name || body.customer?.name || body.data?.object?.customer_details?.name || "";
  }
  detectedEmail = detectedEmail ? detectedEmail.trim() : "";
  detectedName = detectedName ? detectedName.trim() : "";
  let emailError = "";
  let emailStatus = "";
  let emailOutcome = "";
  if (!detectedEmail) {
    emailError = "Adresse e-mail manquante dans la charge utile JSON ou les param\xE8tres de requ\xEAte.";
    emailStatus = "failed_missing_email";
    emailOutcome = "Acc\xE8s refus\xE9 (adresse e-mail introuvable)";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(detectedEmail)) {
      emailError = `L'adresse e-mail '${detectedEmail}' a un format syntaxique invalide (ex attendu: nom@domaine.com).`;
      emailStatus = "failed_invalid_email_format";
      emailOutcome = "Acc\xE8s refus\xE9 (format d'e-mail incorrect)";
    }
  }
  if (emailError) {
    const logEntry2 = {
      id: logId,
      courseId,
      url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      detectedEmail: detectedEmail || null,
      detectedName: detectedName || null,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: emailStatus,
      errorMessage: emailError,
      outcome: emailOutcome
    };
    db.logs.unshift(logEntry2);
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
  const finalOutcome = `Acc\xE8s accord\xE9 avec succ\xE8s pour la formation "${courseTitle}"`;
  const logEntry = {
    id: logId,
    courseId,
    url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    detectedEmail,
    detectedName: detectedName || null,
    receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "success",
    errorMessage: "",
    outcome: finalOutcome
  };
  const enrollmentRecord = {
    id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    courseId,
    studentEmail: detectedEmail.toLowerCase(),
    studentName: detectedName || void 0,
    enrolledAt: (/* @__PURE__ */ new Date()).toISOString(),
    synced: false
  };
  db.logs.unshift(logEntry);
  if (db.logs.length > 200) {
    db.logs = db.logs.slice(0, 200);
  }
  db.enrollments.push(enrollmentRecord);
  writeDb(db);
  return res.status(200).json({
    status: "success",
    message: `Payment registered successfully. Student ${detectedEmail} has been enrolled in "${courseTitle}".`,
    enrollmentId: enrollmentRecord.id,
    logId,
    outcome: finalOutcome
  });
});
app.get("/api/webhooks/logs", (req, res) => {
  const db = readDb();
  res.json({ logs: db.logs || [] });
});
app.delete("/api/webhooks/logs", (req, res) => {
  const db = readDb();
  db.logs = [];
  writeDb(db);
  res.json({ status: "success", message: "All webhook logs cleared" });
});
app.get("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  const courseLogs = db.logs.filter((l) => l.courseId === courseId);
  res.json({ logs: courseLogs });
});
app.delete("/api/webhooks/logs/:courseId", (req, res) => {
  const { courseId } = req.params;
  const db = readDb();
  db.logs = db.logs.filter((l) => l.courseId !== courseId);
  writeDb(db);
  res.json({ status: "success", message: "Logs cleared" });
});
app.get("/api/sync-enrollments", (req, res) => {
  const db = readDb();
  const unsynced = db.enrollments.filter((e) => !e.synced);
  db.enrollments = db.enrollments.map((e) => ({ ...e, synced: true }));
  writeDb(db);
  res.json({ enrollments: unsynced });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dekel.Formation running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
