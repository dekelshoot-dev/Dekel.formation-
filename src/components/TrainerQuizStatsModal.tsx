import React, { useEffect, useState } from 'react';
import { 
  X, Users, Award, TrendingUp, CheckCircle2, XCircle, Clock, 
  BarChart2, Search, Download, FileText
} from 'lucide-react';
import { CourseQuiz, CourseQuizAttempt } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface TrainerQuizStatsModalProps {
  quiz: CourseQuiz;
  onClose: () => void;
}

export const TrainerQuizStatsModal: React.FC<TrainerQuizStatsModalProps> = ({
  quiz,
  onClose,
}) => {
  const [attempts, setAttempts] = useState<CourseQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'quiz_submissions'),
          where('quizId', '==', quiz.id)
        );
        const snapshot = await getDocs(q);
        const list: CourseQuizAttempt[] = [];
        snapshot.forEach(d => list.push(d.data() as CourseQuizAttempt));
        list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setAttempts(list);
      } catch (err) {
        // Local fallback
        const saved = localStorage.getItem(`sio_all_attempts_${quiz.id}`);
        if (saved) setAttempts(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [quiz.id]);

  // Global calculations
  const totalSubmissions = attempts.length;
  const uniqueStudents = Array.from(new Set(attempts.map(a => a.studentEmail))).length;
  
  const averagePercentage = totalSubmissions > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissions) 
    : 0;

  const passedSubmissions = attempts.filter(a => a.passed).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;

  // Filtered list
  const filteredAttempts = attempts.filter(a => 
    (a.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.studentEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-slate-900 p-5 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Statistiques & Résultats du Quiz</h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{quiz.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          
          {/* Global Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Étudiants évalués</span>
              <span className="text-2xl font-black text-white">{uniqueStudents}</span>
              <span className="text-[10px] text-slate-400 block">{totalSubmissions} tentatives</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Moyenne Générale</span>
              <span className="text-2xl font-black text-indigo-400">{averagePercentage}%</span>
              <span className="text-[10px] text-slate-400 block">Sur 100%</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Taux de Réussite</span>
              <span className="text-2xl font-black text-emerald-400">{passRate}%</span>
              <span className="text-[10px] text-slate-400 block">Seuil : {quiz.passingScore}%</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Questions</span>
              <span className="text-2xl font-black text-amber-400">
                {quiz.questions.filter(q => q.type !== 'section_header').length}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {quiz.questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts max
              </span>
            </div>

          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un étudiant par nom ou email..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <span className="text-xs text-slate-400 font-bold">
              {filteredAttempts.length} soumissions
            </span>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Chargement des résultats...</div>
          ) : filteredAttempts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-2">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Aucune soumission enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Étudiant</th>
                      <th className="py-3 px-4">Score / Points</th>
                      <th className="py-3 px-4">Pourcentage</th>
                      <th className="py-3 px-4">Résultat</th>
                      <th className="py-3 px-4">Tentative #</th>
                      <th className="py-3 px-4">Date de soumission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 text-xs">
                    {filteredAttempts.map(att => (
                      <tr key={att.id} className="hover:bg-slate-700/30 transition-all">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{att.studentName || 'Étudiant'}</div>
                          <div className="text-[10px] text-slate-400">{att.studentEmail}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {att.score} / {att.totalPoints} pts
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-black font-mono ${att.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {att.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            att.passed 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {att.passed ? 'Réussi' : 'Échoué'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-300">
                          #{att.attemptNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(att.submittedAt).toLocaleDateString('fr-FR')} {new Date(att.submittedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default TrainerQuizStatsModal;
