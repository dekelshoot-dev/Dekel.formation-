import React, { useState, useEffect } from 'react';
import { 
  TransactionalEmailLog, 
  EmailCategory, 
  EmailStatus, 
  EmailTemplateDefinition, 
  EmailServerConfig 
} from '../types/email';
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
  Play,
  ShieldCheck,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { showToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

export default function TransactionalEmailDashboard() {
  const [logs, setLogs] = useState<TransactionalEmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplateDefinition[]>([]);
  const [serverConfig, setServerConfig] = useState<EmailServerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [previewEmail, setPreviewEmail] = useState<TransactionalEmailLog | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  const [showTestModal, setShowTestModal] = useState(false);
  const [testTemplateType, setTestTemplateType] = useState<string>('auth_welcome');
  const [testRecipientEmail, setTestRecipientEmail] = useState('eleve.test@dekel-formation.com');
  const [testRecipientName, setTestRecipientName] = useState('Moussa Diop');
  const [testCustomMessage, setTestCustomMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<EmailServerConfig>>({});

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
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/emails/logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates and config
  const fetchMetadata = async () => {
    try {
      const [tplRes, cfgRes] = await Promise.all([
        fetch('/api/emails/templates'),
        fetch('/api/emails/config')
      ]);
      const tplData = await tplRes.json();
      const cfgData = await cfgRes.json();
      setTemplates(tplData.templates || []);
      setServerConfig(cfgData.config || null);
      if (cfgData.config) setConfigForm(cfgData.config);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchMetadata();

    // Auto-refresh logs every 4 seconds to show background queue updates
    const interval = setInterval(fetchLogs, 4000);
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
        showToast(`E-mail de test mis en file d'attente pour ${testRecipientEmail} !`, 'success');
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/emails/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Configuration du serveur d\'e-mails enregistrée !', 'success');
        setServerConfig(data.config);
        setShowConfigModal(false);
      }
    } catch (err) {
      showToast('Erreur lors de la sauvegarde de la configuration', 'error');
    }
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
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Serveur d'E-mails Transactionnels
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  File Asynchrone Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gestion automatisée des notifications, confirmations d'accès, mots de passe et reçus de paiement.
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
            <span>Tester un Modèle</span>
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Configuration</span>
          </button>

          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
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

        {/* Sent */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Envoyés avec Succès</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{sentEmails}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Délivrés aux utilisateurs</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Queue */}
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

        {/* Failed */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Échecs & Erreurs</p>
            <h3 className="text-2xl font-bold text-rose-400 mt-1">{failedEmails}</h3>
            <p className="text-[11px] text-rose-300/80 mt-1">
              {failedEmails > 0 ? 'Réessai automatique disponible' : 'Aucune erreur enregistrée'}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Catégories :
          </span>
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'authentication', label: 'Authentification' },
            { id: 'courses', label: 'Formations' },
            { id: 'payments', label: 'Paiements' },
            { id: 'pedagogy', label: 'Pédagogie' },
            { id: 'administration', label: 'Administration' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par e-mail, destinataire, sujet ou type..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
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

            {/* Clear All Logs */}
            {logs.length > 0 && (
              <button
                onClick={handleClearAllLogs}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all"
                title="Vider tout l'historique"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vider</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            Journal des E-mails Transactionnels
            <span className="text-xs font-normal text-slate-400">({filteredLogs.length} enregistrements)</span>
          </h3>
          <span className="text-[11px] text-slate-500 italic">Mise à jour automatique en temps réel</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Mail className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">Aucun e-mail transactionnel trouvé.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Aucun résultat ne correspond à vos filtres actuels. Essayez de réinitialiser la recherche.'
                : 'Les e-mails seront enregistrés ici automatiquement lors des inscriptions, réinitialisations de mot de passe et paiements.'}
            </p>
            <button
              onClick={() => setShowTestModal(true)}
              className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer un e-mail de test</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date / Heure</th>
                  <th className="py-3 px-4">Destinataire</th>
                  <th className="py-3 px-4">Catégorie & Type</th>
                  <th className="py-3 px-4">Objet de l'e-mail</th>
                  <th className="py-3 px-4 text-center">Tentatives</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.map(log => {
                  const isSent = log.status === 'sent';
                  const isPending = log.status === 'pending';
                  const isFailed = log.status === 'failed';

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setPreviewEmail(log)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        <div className="font-mono text-[11px] text-slate-300">
                          {new Date(log.queuedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(log.queuedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="py-3 px-4 max-w-[180px] truncate">
                        <div className="font-bold text-white truncate">{log.recipientName || 'Membre'}</div>
                        <div className="text-[11px] text-emerald-400 font-mono truncate">{log.to}</div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/80 mb-1 capitalize">
                          {log.category}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400">{log.type}</div>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4 max-w-[240px] truncate">
                        <div className="font-semibold text-slate-200 truncate">{log.subject}</div>
                        {log.error && (
                          <div className="text-[10px] text-rose-400 truncate mt-0.5">
                            ⚠️ {log.error}
                          </div>
                        )}
                      </td>

                      {/* Attempts */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.attempts} / {log.maxAttempts}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isSent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Envoyé
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            En attente
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Échec
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewEmail(log)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Aperçu HTML"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          </button>

                          {(isFailed || isPending) && (
                            <button
                              onClick={(e) => handleRetryEmail(log.id, e)}
                              className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors border border-amber-500/30"
                              title="Re-tester l'envoi"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDeleteEmail(log.id, e)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HTML PREVIEW MODAL */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
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

              {/* Device View Switcher */}
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
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Email Metadata Details bar */}
            <div className="bg-slate-950/60 p-3 px-5 border-b border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Statut :</span>
                <span className="font-bold capitalize text-emerald-400">{previewEmail.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date de création :</span>
                <span>{new Date(previewEmail.queuedAt).toLocaleString('fr-FR')}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date d'envoi :</span>
                <span>{previewEmail.sentAt ? new Date(previewEmail.sentAt).toLocaleString('fr-FR') : 'En attente'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Tentatives :</span>
                <span>{previewEmail.attempts} sur {previewEmail.maxAttempts}</span>
              </div>
            </div>

            {/* Error banner if failed */}
            {previewEmail.error && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 px-5 text-xs text-rose-300 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span><strong>Erreur d'envoi :</strong> {previewEmail.error}</span>
                </span>
                <button
                  onClick={() => handleRetryEmail(previewEmail.id)}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg text-[11px] shrink-0"
                >
                  Réessayer maintenant
                </button>
              </div>
            )}

            {/* Render HTML Body in iframe sandbox */}
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

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteEmail(previewEmail.id)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer de l'historique</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRetryEmail(previewEmail.id)}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renvoyer l'e-mail</span>
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
        </div>
      )}

      {/* TEST EMAIL MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Tester un Modèle d'E-mail Transactionnel</span>
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
                  Sélectionner un modèle d'e-mail ({templates.length} disponibles) :
                </label>
                <select
                  value={testTemplateType}
                  onChange={e => setTestTemplateType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {templates.map(tpl => (
                    <option key={tpl.type} value={tpl.type}>
                      [{tpl.category.toUpperCase()}] {tpl.name}
                    </option>
                  ))}
                </select>
                {templates.find(t => t.type === testTemplateType) && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    💡 {templates.find(t => t.type === testTemplateType)?.description}
                  </p>
                )}
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
                    Adresse e-mail :
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
                  Message personnalisé complémentaire (optionnel) :
                </label>
                <textarea
                  value={testCustomMessage}
                  onChange={e => setTestCustomMessage(e.target.value)}
                  placeholder="Notes explicatives supplémentaires pour le test..."
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

      {/* CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Configuration du Serveur d'E-mails</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nom de l'expéditeur :
                </label>
                <input
                  type="text"
                  value={configForm.senderName || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, senderName: e.target.value }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Adresse e-mail de l'expéditeur :
                </label>
                <input
                  type="email"
                  value={configForm.senderEmail || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Limite de tentatives automatiques de réessai (Retry limit) :
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={configForm.autoRetryLimit || 3}
                  onChange={e => setConfigForm(prev => ({ ...prev, autoRetryLimit: parseInt(e.target.value) || 3 }))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sécurité & Signature Cryptographique :</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Toutes les réinitialisations de mot de passe, vérifications d'e-mail et invitations sont signées avec une clé HMAC SHA-256 avec durée d'expiration strictement contrôlée.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg"
                >
                  <span>Enregistrer la configuration</span>
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
