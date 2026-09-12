import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Users, Calendar, Download, Search, Filter, 
  ArrowUpRight, CreditCard, Wallet, BookOpen, CheckCircle2, ChevronLeft, 
  ChevronRight, Calculator, HelpCircle, Sparkles, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import { 
  REVENUE_COURSES, MONTHLY_REVENUE_DATA, TOTAL_PLATFORM_REVENUE, 
  TOTAL_STUDENTS_COUNT, getFictitiousTransactions, formatFCFA, 
  exportRevenueLedgerCSV, StudentTransaction 
} from '../services/adminRevenueService';
import { showToast } from './Toast';

export default function AdminRevenueDashboard() {
  const allTransactions = useMemo(() => getFictitiousTransactions(), []);

  // Filter States
  const [selectedYear, setSelectedYear] = useState<'all' | 2024 | 2025 | 2026>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simStudentsCount, setSimStudentsCount] = useState<number>(20);
  const [simCoursePrice, setSimCoursePrice] = useState<number>(5000);

  // Filtered Monthly Data based on Year
  const filteredMonthlyData = useMemo(() => {
    if (selectedYear === 'all') return MONTHLY_REVENUE_DATA;
    return MONTHLY_REVENUE_DATA.filter(m => m.year === selectedYear);
  }, [selectedYear]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      // Filter year
      if (selectedYear !== 'all') {
        const txYear = new Date(tx.transactionDate).getFullYear();
        if (txYear !== selectedYear) return false;
      }
      // Filter course
      if (selectedCourseId !== 'all' && tx.courseId !== selectedCourseId) {
        return false;
      }
      // Filter payment method
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = tx.studentName.toLowerCase().includes(q);
        const matchEmail = tx.studentEmail.toLowerCase().includes(q);
        const matchId = tx.id.toLowerCase().includes(q);
        const matchCourse = tx.courseTitle.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId && !matchCourse) return false;
      }
      return true;
    });
  }, [allTransactions, selectedYear, selectedCourseId, selectedPaymentMethod, searchQuery]);

  // Totals for current selection
  const currentTotalRevenue = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [filteredTransactions]);

  const currentTotalStudents = filteredTransactions.length;

  const currentAverageBasket = useMemo(() => {
    return currentTotalStudents > 0 ? Math.round(currentTotalRevenue / currentTotalStudents) : 0;
  }, [currentTotalRevenue, currentTotalStudents]);

  // Pagination for transactions table
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const handleExportCSV = () => {
    exportRevenueLedgerCSV(filteredTransactions);
    showToast(`Rapport financier CSV exporté avec succès (${filteredTransactions.length} transactions) !`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Suivi Financier & Monétisation Plateforme</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Revenus Générés par la Plateforme
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consultez les revenus cumulés générés par les 3 formations disponibles sur la période de janvier 2024 à nos jours.
              Ces données et étudiants fictifs sont réservés à l'espace Administrateur et n'impactent pas l'espace enseignant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-indigo-300" />
              <span>Simulateur de calcul</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exporter en CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Educational Revenue Formula Callout (as requested by user) */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 sm:p-5 text-amber-950 dark:text-amber-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Règle de Calcul des Revenus
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Revenu Total = Nombre d'élèves inscrits × Prix unitaire de la formation
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Exemple : Si 20 élèves achètent une formation à 5 000 FCFA, cela génère <strong className="text-amber-700 dark:text-amber-300 font-bold">20 × 5 000 = 100 000 FCFA</strong>.
            </p>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 border border-amber-500/30 px-4 py-2.5 rounded-xl shrink-0 text-center">
          <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">Revenu Total Cumulé (Jan 2024 - Présent)</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatFCFA(TOTAL_PLATFORM_REVENUE)}</span>
        </div>
      </div>

      {/* 3. Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Revenus de la sélection</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {formatFCFA(currentTotalRevenue)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Sur {filteredTransactions.length} inscriptions</span>
            <span className="text-emerald-500 font-bold">• 100% encaissés</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inscriptions étudiantes</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {currentTotalStudents.toLocaleString('fr-FR')} étudiants
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Partage sur 3 formations</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Panier Moyen</span>
            <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {formatFCFA(currentAverageBasket)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Moyenne par étudiant</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Formations Monétisées</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            3 Formations
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>De 5 000 FCFA à 35 000 FCFA</span>
          </div>
        </div>
      </div>

      {/* 4. The 3 Available Courses Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Répartition par Formation (3 Formations Disponibles)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Départage des 19 500 000 FCFA selon le prix unitaire et le volume d'étudiants inscrits
            </p>
          </div>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 self-start">
            Objectif 19 500 000 FCFA atteint
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVENUE_COURSES.map((course, idx) => (
            <div 
              key={course.courseId}
              onClick={() => setSelectedCourseId(selectedCourseId === course.courseId ? 'all' : course.courseId)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedCourseId === course.courseId 
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                  {course.category}
                </span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                  {course.percentageOfTotal}% du total
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2.5 line-clamp-2 min-h-[40px]">
                {course.courseTitle}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formateur : {course.trainerName}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Prix unitaire :</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatFCFA(course.price)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Élèves inscrits :</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{course.studentsCount} élèves</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Calcul :</span>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    {course.studentsCount} × {formatFCFA(course.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-dashed border-slate-200 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white">Revenu total :</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatFCFA(course.totalRevenue)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${course.percentageOfTotal}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Monthly Evolution Chart & Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Évolution Mensuelle des Revenus (Janvier 2024 à Septembre 2026)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Progression régulière des ventes avec les pics de rentrée et de fin d'année
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => { setSelectedYear('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tous (2024-2026)
            </button>
            <button
              onClick={() => { setSelectedYear(2024); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === 2024 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2024 (6,55M)
            </button>
            <button
              onClick={() => { setSelectedYear(2025); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === 2025 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2025 (9,20M)
            </button>
            <button
              onClick={() => { setSelectedYear(2026); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === 2026 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2026 (3,75M)
            </button>
          </div>
        </div>

        {/* CSS-based Bar Chart */}
        <div className="pt-4 overflow-x-auto pb-2">
          <div className="min-w-[650px] flex items-end gap-2 h-52 border-b border-slate-200 dark:border-white/10 px-2">
            {filteredMonthlyData.map((m) => {
              const maxVal = 950000;
              const heightPercent = Math.max(10, Math.round((m.revenue / maxVal) * 100));
              return (
                <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 bg-slate-950 text-white text-[10px] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20 border border-white/10">
                    <p className="font-bold">{m.label}</p>
                    <p className="text-emerald-400 font-black">{formatFCFA(m.revenue)}</p>
                    <p className="text-slate-400">{m.studentsCount} élèves inscrits</p>
                  </div>

                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                    {(m.revenue / 1000).toFixed(0)}k
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-36 flex items-end p-0.5 overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-indigo-500 rounded-t group-hover:from-emerald-500 group-hover:to-indigo-400 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span className="text-[9px] text-slate-400 font-medium truncate max-w-[45px] text-center">
                    {m.label.split(' ')[0]} {selectedYear === 'all' ? m.year.toString().slice(2) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-xs font-bold text-orange-900 dark:text-orange-300">Orange Money</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">45% • 8 775 000 FCFA</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">720 transactions</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="text-xs font-bold text-yellow-900 dark:text-yellow-300">MTN MoMo</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">30% • 5 850 000 FCFA</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">480 transactions</p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
              <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300">Wave</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">18% • 3 510 000 FCFA</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">288 transactions</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300">Carte Bancaire</span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">7% • 1 365 000 FCFA</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">112 transactions</p>
          </div>
        </div>
      </div>

      {/* 6. Detailed Transactions Ledger (Fictitious Students) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              <span>Grand Livre des Inscriptions & Transactions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Liste détaillée des {filteredTransactions.length} paiements d'étudiants enregistrés (affiché uniquement à l'administrateur)
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, email, ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 w-44 sm:w-60"
              />
            </div>

            <select
              value={selectedPaymentMethod}
              onChange={(e) => { setSelectedPaymentMethod(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tous les moyens</option>
              <option value="Orange Money">Orange Money</option>
              <option value="MTN MoMo">MTN MoMo</option>
              <option value="Wave">Wave</option>
              <option value="Carte Bancaire">Carte Bancaire</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
              title="Exporter cette liste en CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-white/10">
                <th className="p-3">ID Transaction</th>
                <th className="p-3">Étudiant</th>
                <th className="p-3">Formation</th>
                <th className="p-3">Moyen de paiement</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Montant (FCFA)</th>
                <th className="p-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {tx.id}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={tx.avatarUrl} 
                        alt={tx.studentName} 
                        className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-white/10 shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                          {tx.studentName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-[200px]">
                          {tx.studentEmail} • {tx.country}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px]">
                      {tx.courseTitle}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      tx.paymentMethod === 'Orange Money' ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                      tx.paymentMethod === 'MTN MoMo' ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' :
                      tx.paymentMethod === 'Wave' ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800' :
                      'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                    }`}>
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(tx.transactionDate).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatFCFA(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Aucune transaction trouvée avec les filtres actuels.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Affichage de <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)}</strong> à <strong>{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</strong> sur <strong>{filteredTransactions.length}</strong> transactions
          </span>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-200">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Simulateur de Revenus</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Testez le calcul dynamique : Élèves × Prix</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nombre d'étudiants inscrits
                </label>
                <input
                  type="number"
                  min={1}
                  value={simStudentsCount}
                  onChange={(e) => setSimStudentsCount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Prix de la formation (FCFA)
                </label>
                <input
                  type="number"
                  step={500}
                  min={0}
                  value={simCoursePrice}
                  onChange={(e) => setSimCoursePrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Exemples rapides :</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setSimStudentsCount(20); setSimCoursePrice(5000); }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-medium transition-all"
                  >
                    20 élèves × 5 000 FCFA
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimStudentsCount(250); setSimCoursePrice(35000); }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-medium transition-all"
                  >
                    250 élèves × 35 000 FCFA
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSimStudentsCount(1150); setSimCoursePrice(5000); }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg font-medium transition-all"
                  >
                    1 150 élèves × 5 000 FCFA
                  </button>
                </div>
              </div>

              {/* Result card */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center space-y-1">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Résultat du calcul
                </span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatFCFA(simStudentsCount * simCoursePrice)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {simStudentsCount} élèves × {formatFCFA(simCoursePrice)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
            >
              Fermer le simulateur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
