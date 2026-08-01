import { onRequest } from "firebase-functions/v2/https";
import * as initializeAdmin from "firebase-admin/app";
import express, { Request, Response } from "express";

initializeAdmin.initializeApp();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "Dekel.Formation Cloud Functions API" });
});

// Example transactional email queue endpoint or webhook handlers
app.post(["/api/emails/send", "/api/emails/queue"], (req: Request, res: Response) => {
  const { to, type } = req.body;
  if (!to || !type) {
    res.status(400).json({ status: "error", message: "Paramètres manquants (to, type)" });
    return;
  }
  res.json({ status: "success", message: `E-mail ${type} mis en file d'attente pour ${to}` });
});

// Export Cloud Function as 'api' (matches rewrite in firebase.json)
export const api = onRequest(
  {
    region: "us-east4",
    cors: true
  },
  app
);
