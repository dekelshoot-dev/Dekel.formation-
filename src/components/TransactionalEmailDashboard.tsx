import React, { useState, useEffect } from 'react';
import { 
  TransactionalEmailLog, 
  EmailCategory, 
  EmailStatus, 
  EmailTemplateDefinition, 
  EmailServerConfig,
  NotificationTriggerConfig 
} from '../types/email';
import { EMAIL_TEMPLATE_DEFINITIONS, CATEGORY_LABELS } from '../services/emailTemplates';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  RotateCcw, 
  Trash2, 
  Settings, 
  Smartphone, 
  Monitor, 
  Check, 
  AlertTriangle,
  X,
  Zap,
  ShieldCheck,
  BellRing,
  Sliders,
  Users,
  Timer,
  Edit3,
  Server,
  Lock,
  Globe,
  Terminal,
  Activity,
  Cpu,
  Copy,
  CheckCircle2,
  AlertCircle,
  Play,
  Database,
  FileText
} from 'lucide-react';
import { showToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

export default function TransactionalEmailDashboard() {
  const [activeTab, setActiveTab] = useState<'logs' | 'center' | 'smtp' | 'diagnostic'>('logs');

  const [logs, setLogs] = useState<TransactionalEmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateDefinition[]>([]);
  const [serverConfig, setServerConfig] = useState<EmailServerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Diagnostic State
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagTestRecipient, setDiagTestRecipient] = useState('service@dekel-dev.com');

  // Filters for logs
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Preview
  const [previewEmail, setPreviewEmail] = useState<TransactionalEmailLog | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTemplateType, setTestTemplateType] = useState<string>('auth_welcome');
  const [testRecipientEmail, setTestRecipientEmail] = useState('eleve.test@dekel-formation.com');
  const [testRecipientName, setTestRecipientName] = useState('Amadou Diallo');
  const [testCustomMessage, setTestCustomMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // SMTP Form State
  const [smtpForm, setSmtpForm] = useState<{
    senderName: string;
    senderEmail: string;
    gmailUser: string;
    gmailAppPassword: string;
    smtpHost: string;
    smtpPort: number;
    autoRetryLimit: number;
  }>({
    senderName: 'Dekel.Formation',
    senderEmail: 'service@dekel-dev.com',
    gmailUser: 'service@dekel-dev.com',
    gmailAppPassword: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    autoRetryLimit: 3
  });

  const [testingSmtp, setTestingSmtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Notification Rules State (17 Categories)
  const [triggerRules, setTriggerRules] = useState<Record<string, NotificationTriggerConfig>>({});

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Fetch email logs
  const fetchLogs = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch('/api/emails/logs');
      if (!res.ok) return;
      const data = await res.json();
      if (data && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      // Ignore transient network errors during background polling
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Fetch metadata and config
  const fetchMetadata = async () => {
    try {
      const [tplRes, cfgRes] = await Promise.all([
        fetch('/api/emails/templates'),
        fetch('/api/emails/config')
      ]);
      
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        const loadedTpls: EmailTemplateDefinition[] = tplData.templates || EMAIL_TEMPLATE_DEFINITIONS;
        setTemplates(loadedTpls);
      }

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        const cfg: EmailServerConfig = cfgData.config || {};
        setServerConfig(cfg);

        setSmtpForm({
          senderName: cfg.senderName || 'Dekel.Formation',
          senderEmail: cfg.senderEmail || 'service@dekel-dev.com',
          gmailUser: cfg.gmailUser || 'service@dekel-dev.com',
          gmailAppPassword: cfg.gmailAppPassword || '',
          smtpHost: cfg.smtpHost || 'smtp.gmail.com',
          smtpPort: cfg.smtpPort || 465,
          autoRetryLimit: cfg.autoRetryLimit || 3
        });

        // Initialize default trigger rules if missing
        const initialRules: Record<string, NotificationTriggerConfig> = cfg.triggerRules || {};
        EMAIL_TEMPLATE_DEFINITIONS.forEach(t => {
          if (!initialRules[t.type]) {
            initialRules[t.type] = {
              type: t.type,
              category: t.category,
              name: t.name,
              enabled: true,
              subject: t.defaultSubject,
              recipients: t.defaultRecipients || ['student'],
              delayMinutes: 0
            };
          }
        });
        setTriggerRules(initialRules);
      }

    } catch (err) {
      // Soft handling for metadata fetch
    }
  };

  useEffect(() => {
    fetchLogs(true);
    fetchMetadata();

    const interval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetryEmail = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      showToast('Nouvelle tentative en cours...', 'info');
      const res = await fetch(`/api/emails/retry/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('E-mail renvoyé avec succès !', 'success');
        fetchLogs();
        if (previewEmail && previewEmail.id === id) {
          setPreviewEmail(data.email);
        }
      } else {
        showToast(`Échec du renvoi : ${data.message}`, 'error');
      }
    } catch (err: any) {
      showToast('Erreur serveur lors de la tentative de renvoi.', 'error');
    }
  };

  const handleDeleteEmail = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const logItem = logs.find(l => l.id === id);
    setConfirmModal({
      isOpen: true,
      title: "Supprimer l'e-mail de l'historique",
      message: "Voulez-vous vraiment supprimer cet e-mail de l'historique ?",
      itemName: logItem ? `${logItem.subject} (à ${logItem.to})` : `E-mail ID: ${id}`,
      confirmText: "Supprimer l'e-mail",
      onConfirm: async () => {
        try {
          await fetch(`/api/emails/logs/${id}`, { method: 'DELETE' });
          showToast('E-mail supprimé de l\'historique', 'info');
          setLogs(prev => prev.filter(l => l.id !== id));
          if (previewEmail?.id === id) setPreviewEmail(null);
        } catch (err) {
          showToast('Erreur lors de la suppression', 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleClearAllLogs = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Vider l'historique des e-mails",
      message: "⚠️ Attention : Voulez-vous effacer TOUT l'historique des e-mails transactionnels ? Cette action est définitive.",
      confirmText: "Vider tout l'historique",
      onConfirm: async () => {
        try {
          await fetch('/api/emails/logs', { method: 'DELETE' });
          showToast('Historique des e-mails vidé avec succès', 'success');
          setLogs([]);
        } catch (err) {
          showToast('Erreur lors du nettoyage de l\'historique', 'error');
        } finally {
          closeConfirmModal();
        }
      }
    });
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipientEmail) {
      showToast('Veuillez saisir une adresse e-mail destinataire.', 'warning');
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch('/api/emails/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: testTemplateType,
          recipientEmail: testRecipientEmail,
          recipientName: testRecipientName,
          customMessage: testCustomMessage
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`E-mail de test envoyé à ${testRecipientEmail} !`, 'success');
        setShowTestModal(false);
        fetchLogs();
      } else {
        showToast(`Erreur : ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Erreur serveur lors de l\'envoi du test', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/emails/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...smtpForm,
          enableSmtp: true,
          triggerRules
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Configuration SMTP et règles de notification enregistrées !', 'success');
        setServerConfig(data.config);
      }
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement de la configuration', 'error');
    }
  };

  const handleTestSmtpConnection = async () => {
    setTestingSmtp(true);
    try {
      const res = await fetch('/api/emails/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser: smtpForm.gmailUser,
          gmailAppPassword: smtpForm.gmailAppPassword,
          smtpHost: smtpForm.smtpHost,
          smtpPort: smtpForm.smtpPort
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message, 'success');
      } else {
        showToast(`Test SMTP échoué : ${data.message}`, 'error');
      }
    } catch (err: any) {
      showToast('Erreur de connexion au serveur SMTP', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleRunDiagnostic = async (sendEmail: boolean = false) => {
    setRunningDiagnostic(true);
    try {
      const res = await fetch('/api/emails/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sendTestEmailTo: sendEmail ? diagTestRecipient : undefined,
          configOverride: {
            gmailUser: smtpForm.gmailUser,
            gmailAppPassword: smtpForm.gmailAppPassword,
            smtpHost: smtpForm.smtpHost,
            smtpPort: smtpForm.smtpPort,
            senderEmail: smtpForm.senderEmail,
            senderName: smtpForm.senderName
          }
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDiagnosticResult(data.diagnostic);
        showToast('Diagnostic SMTP exécuté avec succès !', 'success');
      } else {
        showToast(`Échec du diagnostic : ${data.message}`, 'error');
      }
    } catch (err: any) {
      showToast('Erreur lors de l\'exécution du script de diagnostic.', 'error');
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const handleCopyLogs = () => {
    if (!diagnosticResult?.logs) return;
    const logText = diagnosticResult.logs.join('\n');
    navigator.clipboard.writeText(logText);
    showToast('Logs de diagnostic copiés dans le presse-papier !', 'info');
  };

  const handleToggleRule = (type: string) => {
    setTriggerRules(prev => {
      const current = prev[type] || {
        type: type as any,
        category: 'authentication',
        name: type,
        enabled: true,
        subject: '',
        recipients: ['student'],
        delayMinutes: 0
      };
      return {
        ...prev,
        [type]: {
          ...current,
          enabled: !current.enabled
        }
      };
    });
  };

  const handleRuleSubjectChange = (type: string, subject: string) => {
    setTriggerRules(prev => ({
      ...prev,
      [type]: {
        ...(prev[type] || { type: type as any, category: 'authentication', name: type, enabled: true, recipients: ['student'], delayMinutes: 0 }),
        subject
      }
    }));
  };

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTo = log.to.toLowerCase().includes(q);
      const matchName = log.recipientName?.toLowerCase().includes(q);
      const matchSubject = log.subject.toLowerCase().includes(q);
      const matchType = log.type.toLowerCase().includes(q);
      return matchTo || matchName || matchSubject || matchType;
    }
    return true;
  });

  // Calculate statistics
  const totalEmails = logs.length;
  const sentEmails = logs.filter(l => l.status === 'sent').length;
  const pendingEmails = logs.filter(l => l.status === 'pending').length;
  const failedEmails = logs.filter(l => l.status === 'failed').length;
  const successRate = totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                E-mails Automatiques & SMTP Gmail
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  service@dekel-dev.com
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Centre de notifications complet pour les 17 catégories d'événements Dekel.Formation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTestModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Tester un E-mail</span>
          </button>

          <button
            onClick={() => fetchLogs(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Journal d'Envoi & Historique</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950/50 text-emerald-200">
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('center')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'center'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Centre de Notifications (17 Catégories)</span>
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'smtp'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Configuration SMTP Gmail</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('diagnostic');
            if (!diagnosticResult && !runningDiagnostic) {
              handleRunDiagnostic(false);
            }
          }}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'diagnostic'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Diagnostic SMTP & Logs (Render)</span>
        </button>
      </div>

      {/* TAB 1: LOGS & HISTORY */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Total Envoyés & Traités</p>
                <h3 className="text-2xl font-bold text-white mt-1">{totalEmails}</h3>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Taux de succès : {successRate}%
                </p>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Mail className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Envoyés avec Succès</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{sentEmails}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Livrés aux destinataires</p>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">En File d'Attente</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{pendingEmails}</h3>
                <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" /> Traitement asynchrone
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Échecs & Erreurs</p>
                <h3 className="text-2xl font-bold text-rose-400 mt-1">{failedEmails}</h3>
                <p className="text-[11px] text-rose-300/80 mt-1">Réessai automatique</p>
              </div>
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par e-mail, destinataire, sujet..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
              >
                <option value="all">Tous les statuts</option>
                <option value="sent">Envoyés (sent)</option>
                <option value="pending">En attente (pending)</option>
                <option value="failed">Échecs (failed)</option>
              </select>

              {logs.length > 0 && (
                <button
                  onClick={handleClearAllLogs}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Mail className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-medium">Aucun e-mail trouvé dans le journal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Destinataire</th>
                      <th className="py-3 px-4">Catégorie & Type</th>
                      <th className="py-3 px-4">Objet</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredLogs.map(log => (
                      <tr
                        key={log.id}
                        onClick={() => setPreviewEmail(log)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(log.queuedAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{log.recipientName || 'Membre'}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">{log.to}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 mb-1">
                            {log.category}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400">{log.type}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[240px] truncate">
                          <div className="font-semibold text-slate-200 truncate">{log.subject}</div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {log.status === 'sent' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Envoyé
                            </span>
                          )}
                          {log.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> En attente
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" /> Échec
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setPreviewEmail(log)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                              title="Voir l'aperçu"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            </button>
                            <button
                              onClick={(e) => handleRetryEmail(log.id, e)}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg"
                              title="Renvoyer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteEmail(log.id, e)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NOTIFICATION CENTER (17 CATEGORIES) */}
      {activeTab === 'center' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-emerald-400" />
                <span>Centre de Gestion des Notifications Automatiques</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Activez, désactivez ou personnalisez les sujets et déclencheurs d'e-mails pour chacune des 17 catégories Dekel.Formation.
              </p>
            </div>

            <button
              onClick={handleSaveSmtpConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer les Règles</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => {
              const rule = triggerRules[tpl.type] || {
                type: tpl.type,
                category: tpl.category,
                name: tpl.name,
                enabled: true,
                subject: tpl.defaultSubject,
                recipients: tpl.defaultRecipients || ['student'],
                delayMinutes: 0
              };

              return (
                <div
                  key={tpl.type}
                  className={`bg-slate-900/80 border p-4 rounded-2xl transition-all space-y-3 ${
                    rule.enabled ? 'border-slate-800' : 'border-rose-900/30 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                        {tpl.categoryLabel || CATEGORY_LABELS[tpl.category] || tpl.category}
                      </span>
                      <h4 className="font-bold text-sm text-white">{tpl.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tpl.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRule(tpl.type)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                        rule.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {rule.enabled ? '✅ Actif' : '❌ Désactivé'}
                    </button>
                  </div>

                  {rule.enabled && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Objet de l'e-mail :
                        </label>
                        <input
                          type="text"
                          value={rule.subject}
                          onChange={e => handleRuleSubjectChange(tpl.type, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Destinataires : {rule.recipients.join(', ')}</span>
                        </span>

                        <button
                          onClick={() => {
                            setTestTemplateType(tpl.type);
                            setShowTestModal(true);
                          }}
                          className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Send className="w-3 h-3" />
                          <span>Tester ce déclencheur</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SMTP GMAIL CONFIGURATION */}
      {activeTab === 'smtp' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Paramètres SMTP Gmail Expéditeur</h3>
              <p className="text-xs text-slate-400">
                L'adresse expéditeur par défaut est <strong className="text-emerald-400">service@dekel-dev.com</strong>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSmtpConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nom d'affichage expéditeur :
              </label>
              <input
                type="text"
                value={smtpForm.senderName}
                onChange={e => setSmtpForm(prev => ({ ...prev, senderName: e.target.value }))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adresse e-mail expéditeur (Gmail / Domaine) :
              </label>
              <input
                type="email"
                value={smtpForm.senderEmail}
                onChange={e => setSmtpForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono text-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Utilisateur Gmail (Identifiant) :
                </label>
                <input
                  type="email"
                  value={smtpForm.gmailUser}
                  onChange={e => setSmtpForm(prev => ({ ...prev, gmailUser: e.target.value }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mot de Passe d'Application Gmail (16 caractères) :
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpForm.gmailAppPassword}
                    onChange={e => setSmtpForm(prev => ({ ...prev, gmailAppPassword: e.target.value }))}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px]"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Serveur SMTP (Host) :
                </label>
                <input
                  type="text"
                  value={smtpForm.smtpHost}
                  onChange={e => setSmtpForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Port SMTP :
                </label>
                <select
                  value={smtpForm.smtpPort}
                  onChange={e => setSmtpForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 465 }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={465}>465 (SSL / Recommandé)</option>
                  <option value={587}>587 (TLS / STARTTLS)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Comment générer un mot de passe d'application Gmail ?</span>
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                <li>Rendez-vous sur votre compte Google (Mon compte Google &gt; Sécurité).</li>
                <li>Activez la **Validation en deux étapes** si ce n'est pas déjà fait.</li>
                <li>Recherchez **"Mots de passe d'application"**.</li>
                <li>Générez un mot de passe pour l'application **Dekel.Formation** et collez la clé de 16 caractères ci-dessus.</li>
              </ol>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleTestSmtpConnection}
                  disabled={testingSmtp}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {testingSmtp ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Test de connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tester la Connexion SMTP</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('diagnostic');
                    if (!diagnosticResult && !runningDiagnostic) {
                      handleRunDiagnostic(false);
                    }
                  }}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ouvrir le Diagnostic & Logs Détaillés</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer la Configuration SMTP</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: DIAGNOSTIC & JOURNAUX SMTP EN TEMPS RÉEL */}
      {activeTab === 'diagnostic' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <span>Diagnostic & Journaux SMTP (Hébergement Render & Cloud)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cette interface analyse en direct les logs de livraison en base de données et permet de tester chaque étape de la chaîne d'envoi SMTP (connexion réseau, authentification et transmission).
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRunDiagnostic(false)}
                  disabled={runningDiagnostic}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {runningDiagnostic ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Zap className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Vérification Handshake</span>
                </button>

                <button
                  onClick={() => handleRunDiagnostic(true)}
                  disabled={runningDiagnostic}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {runningDiagnostic ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Lancer le Test de Connexion Complet</span>
                </button>
              </div>
            </div>

            {/* Test Email Recipient Field */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 whitespace-nowrap flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Adresse e-mail destinataire pour le test d'envoi réel :</span>
              </label>
              <input
                type="email"
                value={diagTestRecipient}
                onChange={e => setDiagTestRecipient(e.target.value)}
                placeholder="service@dekel-dev.com"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* SECTION: TEST DE CONNEXION ÉTAPE PAR ÉTAPE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Résultat Étape par Étape du Test de Connexion SMTP</span>
              </h4>

              <button
                onClick={() => handleRunDiagnostic(true)}
                disabled={runningDiagnostic}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
              >
                <span>Relancer le test</span>
                <RefreshCw className={`w-3 h-3 ${runningDiagnostic ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ÉTAPE 1: CONNEXION AU SERVEUR */}
              <div className={`p-4 rounded-xl border transition-all ${
                !diagnosticResult
                  ? 'bg-slate-950 border-slate-800 opacity-70'
                  : diagnosticResult.checks.tcp.success
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">1. Connexion au Serveur</span>
                  {runningDiagnostic ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : !diagnosticResult ? (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">En attente</span>
                  ) : diagnosticResult.checks.tcp.success ? (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Succès
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" /> Échec
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-white font-mono font-semibold">
                    {diagnosticResult ? `${diagnosticResult.environment.smtpHost}:${diagnosticResult.environment.smtpPort}` : 'smtp.gmail.com:465'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {diagnosticResult
                      ? (diagnosticResult.checks.tcp.success
                          ? `Socket TCP établi (${diagnosticResult.checks.tcp.durationMs}ms)`
                          : (diagnosticResult.checks.tcp.error || 'Port filtré ou indisponible'))
                      : 'Test DNS et Socket TCP vers le port SMTP'}
                  </p>
                </div>
              </div>

              {/* ÉTAPE 2: AUTHENTIFICATION */}
              <div className={`p-4 rounded-xl border transition-all ${
                !diagnosticResult
                  ? 'bg-slate-950 border-slate-800 opacity-70'
                  : diagnosticResult.checks.smtpVerify.success
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">2. Authentification</span>
                  {runningDiagnostic ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : !diagnosticResult ? (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">En attente</span>
                  ) : diagnosticResult.checks.smtpVerify.success ? (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validé
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" /> Refusé
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-white font-mono font-semibold truncate" title={diagnosticResult?.environment?.gmailUser}>
                    {diagnosticResult?.environment?.gmailUser || 'service@dekel-dev.com'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {diagnosticResult
                      ? (diagnosticResult.checks.smtpVerify.success
                          ? 'Handshake Nodemailer & Mot de passe App valides'
                          : (diagnosticResult.checks.smtpVerify.error || 'Erreur d\'identifiants Google'))
                      : 'Validation du mot de passe d\'application Gmail'}
                  </p>
                </div>
              </div>

              {/* ÉTAPE 3: ENVOI DE MAIL TEST */}
              <div className={`p-4 rounded-xl border transition-all ${
                !diagnosticResult?.checks?.testEmailSend
                  ? 'bg-slate-950 border-slate-800 opacity-70'
                  : diagnosticResult.checks.testEmailSend.success
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">3. Envoi de Mail Test</span>
                  {runningDiagnostic ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : !diagnosticResult?.checks?.testEmailSend ? (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">Non testé</span>
                  ) : diagnosticResult.checks.testEmailSend.success ? (
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Livré
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" /> Échec
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-white font-mono font-semibold truncate" title={diagTestRecipient}>
                    {diagTestRecipient}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {diagnosticResult?.checks?.testEmailSend
                      ? (diagnosticResult.checks.testEmailSend.success
                          ? `ID: ${diagnosticResult.checks.testEmailSend.messageId || 'Transmis'}`
                          : (diagnosticResult.checks.testEmailSend.error || 'Erreur lors de l\'envoi'))
                      : 'Livraison effective d\'un message de diagnostic'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: JOURNAUX SMTP EN BASE DE DONNÉES */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Journaux SMTP & Historique des Émissions (Base de Données)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Consultez les résultats récents des tentatives d'envoi d'e-mails transactionnels enregistrés dans la base.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1 bg-slate-800 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-mono font-bold">
                  {logs.length} journal(x) en base
                </span>
                <button
                  onClick={() => fetchLogs(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
                  title="Rafraîchir les journaux"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-3">
                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Aucun journal SMTP disponible en base de données pour l'instant.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Exécutez un test de connexion complet ci-dessus ou tentez une réinitialisation de mot de passe depuis la page de connexion pour générer un journal.
                </p>
                <button
                  onClick={() => handleRunDiagnostic(true)}
                  disabled={runningDiagnostic}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Déclencher un Test de Connexion Complet</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3">Horodatage</th>
                      <th className="py-3 px-3">Destinataire</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3">Détails SMTP / Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {logs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                          {new Date(log.sentAt || log.queuedAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-white font-semibold">
                          {log.to}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {log.status === 'sent' && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                              LIVRÉ
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-bold">
                              ÉCHEC
                            </span>
                          )}
                          {log.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                              EN ATTENTE
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-400" title={log.error || log.smtpDeliveryDetails?.messageId || log.metadata?.smtpNote}>
                          {log.error ? (
                            <span className="text-rose-400 font-semibold">{log.error}</span>
                          ) : log.smtpDeliveryDetails?.messageId ? (
                            <span className="text-emerald-400">ID: {log.smtpDeliveryDetails.messageId}</span>
                          ) : log.metadata?.smtpNote ? (
                            <span className="text-amber-400">{log.metadata.smtpNote}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Diagnostic Status Overview Cards */}
          {diagnosticResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Check 1: Environment */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">1. Environnement</span>
                  {diagnosticResult.isRender ? (
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-bold">
                      Render Cloud
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-full font-bold">
                      Local / AI Studio
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-white font-semibold flex items-center justify-between">
                    <span>Clé Gmail App :</span>
                    <span className={diagnosticResult.environment.hasAppPassword ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {diagnosticResult.environment.hasAppPassword ? `OK (${diagnosticResult.environment.appPasswordLength} ch)` : "Manquante"}
                    </span>
                  </p>
                  <p className="text-slate-400 text-[11px] font-mono truncate" title={diagnosticResult.environment.gmailUser}>
                    {diagnosticResult.environment.gmailUser}
                  </p>
                </div>
              </div>

              {/* Check 2: DNS */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">2. Résolution DNS</span>
                  {diagnosticResult.checks.dns.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-white font-semibold flex items-center justify-between">
                    <span>Hôte :</span>
                    <span className="font-mono text-slate-300">{diagnosticResult.environment.smtpHost}</span>
                  </p>
                  <p className="text-slate-400 text-[11px] font-mono">
                    IP: {diagnosticResult.checks.dns.ip || "Échec"} {diagnosticResult.checks.dns.durationMs ? `(${diagnosticResult.checks.dns.durationMs}ms)` : ""}
                  </p>
                </div>
              </div>

              {/* Check 3: TCP Connection */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">3. Socket TCP Brut</span>
                  {diagnosticResult.checks.tcp.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-white font-semibold flex items-center justify-between">
                    <span>Port :</span>
                    <span className="font-mono text-slate-300">{diagnosticResult.environment.smtpPort}</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {diagnosticResult.checks.tcp.success 
                      ? `Connecté (${diagnosticResult.checks.tcp.durationMs}ms)` 
                      : (diagnosticResult.checks.tcp.error || "Port bloqué")}
                  </p>
                </div>
              </div>

              {/* Check 4: SMTP Handshake */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">4. Authentification Gmail</span>
                  {diagnosticResult.checks.smtpVerify.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-white font-semibold flex items-center justify-between">
                    <span>Statut :</span>
                    <span className={diagnosticResult.checks.smtpVerify.success ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {diagnosticResult.checks.smtpVerify.success ? "Autorisé" : "Rejeté"}
                    </span>
                  </p>
                  <p className="text-slate-400 text-[11px] truncate" title={diagnosticResult.checks.smtpVerify.error}>
                    {diagnosticResult.checks.smtpVerify.success ? "Connexion SMTP valide" : (diagnosticResult.checks.smtpVerify.error || "Erreur Auth")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actionable Recommendations */}
          {diagnosticResult?.recommendations && diagnosticResult.recommendations.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Recommandations de résolution pour Render :</span>
              </h4>
              <ul className="space-y-2 text-xs text-amber-200/90 pl-5 list-disc">
                {diagnosticResult.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Console Terminal Output */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Journal Console Diagnostic Serveur ({diagnosticResult?.logs?.length || 0} lignes)
                </h4>
              </div>

              {diagnosticResult?.logs && (
                <button
                  onClick={handleCopyLogs}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copier les logs</span>
                </button>
              )}
            </div>

            <div className="bg-black/90 border border-slate-800/80 rounded-xl p-4 font-mono text-xs max-h-[380px] overflow-y-auto space-y-1 leading-relaxed">
              {runningDiagnostic ? (
                <div className="flex items-center gap-3 text-emerald-400 p-4">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>Exécution du script de diagnostic serveur en cours...</span>
                </div>
              ) : diagnosticResult?.logs && diagnosticResult.logs.length > 0 ? (
                diagnosticResult.logs.map((logLine: string, index: number) => {
                  let colorClass = "text-slate-300";
                  if (logLine.includes("✅") || logLine.includes("🎉")) colorClass = "text-emerald-400 font-semibold";
                  if (logLine.includes("❌") || logLine.includes("ERR")) colorClass = "text-rose-400 font-semibold";
                  if (logLine.includes("⚠️") || logLine.includes("WARN")) colorClass = "text-amber-300";
                  if (logLine.includes("🚀") || logLine.includes("📋")) colorClass = "text-cyan-300";

                  return (
                    <div key={index} className={`${colorClass} whitespace-pre-wrap break-all`}>
                      {logLine}
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 italic p-2">
                  Cliquez sur "Lancer le Test de Connexion Complet" ci-dessus pour exécuter l'analyse détaillée en direct.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HTML PREVIEW MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{previewEmail.subject}</h3>
                  <p className="text-xs text-slate-400">
                    Pour : <strong className="text-emerald-400">{previewEmail.to}</strong> ({previewEmail.recipientName}) &bull; Type : <span className="font-mono text-slate-300">{previewEmail.type}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      previewDevice === 'desktop' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop (600px)</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      previewDevice === 'mobile' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile (375px)</span>
                  </button>
                </div>

                <button
                  onClick={() => setPreviewEmail(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex justify-center">
              <div
                className={`transition-all bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 ${
                  previewDevice === 'desktop' ? 'w-[620px]' : 'w-[375px]'
                }`}
                style={{ minHeight: '480px' }}
              >
                <iframe
                  title="HTML Email Preview"
                  srcDoc={previewEmail.htmlBody}
                  className="w-full h-full min-h-[500px] border-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteEmail(previewEmail.id)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>

              <button
                onClick={() => setPreviewEmail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST EMAIL MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Tester un Modèle d'E-mail</span>
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sélectionner le modèle ({templates.length} disponibles) :
                </label>
                <select
                  value={testTemplateType}
                  onChange={e => setTestTemplateType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {templates.map(tpl => (
                    <option key={tpl.type} value={tpl.type}>
                      [{tpl.categoryLabel || tpl.category}] {tpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nom du destinataire :
                  </label>
                  <input
                    type="text"
                    value={testRecipientName}
                    onChange={e => setTestRecipientName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Adresse e-mail destinataire :
                  </label>
                  <input
                    type="email"
                    value={testRecipientEmail}
                    onChange={e => setTestRecipientEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Message personnalisé (optionnel) :
                </label>
                <textarea
                  value={testCustomMessage}
                  onChange={e => setTestCustomMessage(e.target.value)}
                  placeholder="Notes explicatives supplémentaires pour l'essai..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {sendingTest ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer le test</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        itemName={confirmModal.itemName}
        confirmText={confirmModal.confirmText}
      />

    </div>
  );
}
