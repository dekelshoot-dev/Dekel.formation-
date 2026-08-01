"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const initializeAdmin = __importStar(require("firebase-admin/app"));
const express_1 = __importDefault(require("express"));
initializeAdmin.initializeApp();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Dekel.Formation Cloud Functions API" });
});
// Example transactional email queue endpoint or webhook handlers
app.post(["/api/emails/send", "/api/emails/queue"], (req, res) => {
    const { to, type } = req.body;
    if (!to || !type) {
        res.status(400).json({ status: "error", message: "Paramètres manquants (to, type)" });
        return;
    }
    res.json({ status: "success", message: `E-mail ${type} mis en file d'attente pour ${to}` });
});
// Export Cloud Function as 'api' (matches rewrite in firebase.json)
exports.api = (0, https_1.onRequest)({
    region: "us-east4",
    cors: true
}, app);
//# sourceMappingURL=index.js.map