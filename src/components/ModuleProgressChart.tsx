import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Course, Module, Chapter, Enrollment, StudentProgress } from '../types';
import { BarChart3, TrendingUp, CheckCircle, Users, BookOpen, Filter } from 'lucide-react';

interface ModuleProgressChartProps {
  courses: Course[];
  modules: Module[];
  chapters: Chapter[];
  enrollments: Enrollment[];
  progress: StudentProgress[];
}

export default function ModuleProgressChart({
  courses,
  modules,
  chapters,
  enrollments,
  progress,
}: ModuleProgressChartProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'completion' | 'students'>('completion');

  // Compute metrics per module
  const chartData = useMemo(() => {
    // Filter modules based on selected course
    const filteredModules = modules.filter(m => {
      if (selectedCourseId !== 'all' && m.courseId !== selectedCourseId) return false;
      // Ensure module belongs to one of the trainer's courses
      return courses.some(c => c.id === m.courseId);
    });

    return filteredModules.map((module, index) => {
      const parentCourse = courses.find(c => c.id === module.courseId);
      const moduleChapters = chapters.filter(ch => ch.moduleId === module.id);
      const courseEnrollments = enrollments.filter(e => e.courseId === module.courseId && e.status === 'active');
      const totalStudents = courseEnrollments.length;

      let totalPctSum = 0;
      let completedStudentsCount = 0;
      let startedStudentsCount = 0;

      if (totalStudents > 0 && moduleChapters.length > 0) {
        courseEnrollments.forEach(en => {
          const studentProg = progress.find(
            p => p.studentEmail.toLowerCase() === en.studentEmail.toLowerCase() && p.courseId === module.courseId
          );
          const doneChCount = moduleChapters.filter(ch =>
            studentProg?.completedChapterIds.includes(ch.id)
          ).length;

          const pct = (doneChCount / moduleChapters.length) * 100;
          totalPctSum += pct;

          if (doneChCount > 0) startedStudentsCount++;
          if (doneChCount >= moduleChapters.length) completedStudentsCount++;
        });
      }

      const avgProgress = totalStudents > 0 ? Math.round(totalPctSum / totalStudents) : 0;

      return {
        id: module.id,
        index: index + 1,
        shortName: `M${index + 1}: ${module.title.length > 14 ? module.title.substring(0, 12) + '...' : module.title}`,
        fullName: module.title,
        courseTitle: parentCourse?.title || 'Formation',
        chaptersCount: moduleChapters.length,
        totalStudents,
        startedStudents: startedStudentsCount,
        completedStudents: completedStudentsCount,
        avgProgress,
      };
    });
  }, [courses, modules, chapters, enrollments, progress, selectedCourseId]);

  // General summary statistics
  const overallStats = useMemo(() => {
    if (chartData.length === 0) {
      return { avgPct: 0, totalModules: 0, topModule: null, totalCompletions: 0 };
    }

    const sumPct = chartData.reduce((acc, curr) => acc + curr.avgProgress, 0);
    const avgPct = Math.round(sumPct / chartData.length);
    const totalCompletions = chartData.reduce((acc, curr) => acc + curr.completedStudents, 0);

    const sortedByAvg = [...chartData].sort((a, b) => b.avgProgress - a.avgProgress);
    const topModule = sortedByAvg[0]?.avgProgress > 0 ? sortedByAvg[0] : null;

    return {
      avgPct,
      totalModules: chartData.length,
      topModule,
      totalCompletions
    };
  }, [chartData]);

  // Color gradient palette for bars based on completion rate
  const getBarColor = (pct: number) => {
    if (pct >= 80) return '#10b981'; // Emerald
    if (pct >= 50) return '#6366f1'; // Indigo
    if (pct >= 25) return '#3b82f6'; // Blue
    return '#f59e0b'; // Amber
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-white text-xs space-y-2 max-w-xs">
          <div className="border-b border-slate-800 pb-2">
            <p className="font-bold text-indigo-300 truncate">{data.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate">{data.courseTitle}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-400 block text-[9px] uppercase">Complétion Moyenne</span>
              <span className="font-black text-indigo-400 text-sm">{data.avgProgress}%</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-slate-400 block text-[9px] uppercase">Chapitres</span>
              <span className="font-bold text-slate-200">{data.chaptersCount} chapitres</span>
            </div>
          </div>
          <div className="space-y-1 text-[10px] text-slate-300 pt-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Élèves inscrits:</span>
              <span className="font-semibold text-white">{data.totalStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Élèves ayant démarré:</span>
              <span className="font-semibold text-amber-400">{data.startedStudents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Module terminé par:</span>
              <span className="font-semibold text-emerald-400">{data.completedStudents} élèves</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#1a1e24] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Progression Globale des Élèves par Module
            </h3>
            <p className="text-[11px] text-slate-400">
              Analyse visuelle Recharts du taux de complétion et de la réussite par module
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="all" className="bg-slate-900 text-slate-200">Toutes les formations</option>
              {courses.map(course => (
                <option key={course.id} value={course.id} className="bg-slate-900 text-slate-200">
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-900 border border-slate-700/60 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setChartMetric('completion')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'completion'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              % Complétion
            </button>
            <button
              onClick={() => setChartMetric('students')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'students'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nb. Élèves
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-indigo-400" /> Taux Moyen
          </p>
          <p className="text-xl font-black text-indigo-400 mt-1">{overallStats.avgPct}%</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3 text-blue-400" /> Modules Analysez
          </p>
          <p className="text-xl font-black text-slate-200 mt-1">{overallStats.totalModules}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Modules Validés
          </p>
          <p className="text-xl font-black text-emerald-400 mt-1">{overallStats.totalCompletions}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center truncate">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1 truncate">
            <Users className="w-3 h-3 text-amber-400" /> Meilleur Module
          </p>
          <p className="text-xs font-bold text-amber-300 mt-1.5 truncate">
            {overallStats.topModule ? overallStats.topModule.fullName : 'N/A'}
          </p>
        </div>
      </div>

      {/* Recharts Data Visualization Chart */}
      {chartData.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          Aucun module disponible pour la sélection actuelle.
        </div>
      ) : (
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="shortName"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                domain={chartMetric === 'completion' ? [0, 100] : [0, 'auto']}
                unit={chartMetric === 'completion' ? '%' : ''}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />

              {chartMetric === 'completion' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="avgProgress"
                    name="Taux de complétion (%)"
                    stroke="#818cf8"
                    fillOpacity={1}
                    fill="url(#areaColor)"
                  />
                  <Bar
                    dataKey="avgProgress"
                    name="% Avancement moyen"
                    radius={[6, 6, 0, 0]}
                    barSize={24}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.avgProgress)} />
                    ))}
                  </Bar>
                </>
              ) : (
                <>
                  <Bar
                    dataKey="startedStudents"
                    name="Élèves ayant démarré"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="completedStudents"
                    name="Élèves ayant terminé le module"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
