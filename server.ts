import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "webhook_db.json");

// Parse payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// API: Webhook Receiver (Requirement 2)
app.post("/api/webhooks/payment/:courseId", (req, res) => {
  const { courseId } = req.params;
  
  // Log the raw incoming request to help trainers debug
  const db = readDb();
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  
  // Generic Email Detection from common payment platform formats
  let detectedEmail = "";
  
  // Check Query params first
  if (req.query.email && typeof req.query.email === "string") {
    detectedEmail = req.query.email;
  }
  
  // Inspect request body
  const body = req.body || {};
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

  const logEntry = {
    id: logId,
    courseId,
    headers: req.headers,
    body: req.body,
    query: req.query,
    detectedEmail: detectedEmail || null,
    receivedAt: new Date().toISOString(),
    status: detectedEmail ? "success" : "failed_missing_email"
  };

  db.logs.unshift(logEntry);
  if (db.logs.length > 50) {
    db.logs = db.logs.slice(0, 50); // Keep last 50 logs
  }

  if (!detectedEmail) {
    writeDb(db);
    return res.status(400).json({
      status: "error",
      message: "Webhook processed but no email address was found in the payload or query parameters. Please send '?email=...' or pass 'email' inside the JSON body.",
      logId
    });
  }

  // Record active pending enrollment to be fetched by the SPA
  const enrollmentRecord = {
    id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    courseId,
    studentEmail: detectedEmail.trim().toLowerCase(),
    enrolledAt: new Date().toISOString(),
    synced: false
  };

  db.enrollments.push(enrollmentRecord);
  writeDb(db);

  return res.json({
    status: "success",
    message: `Payment registered successfully. User ${detectedEmail} has been granted access to course ${courseId}.`,
    enrollmentId: enrollmentRecord.id,
    logId
  });
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dekel.Formation running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
