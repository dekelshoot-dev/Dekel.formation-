// Service for Administrator Revenue Analytics & Fictitious Data
// Period: January 2024 to September 2026
// Total platform revenue: 19 500 000 FCFA distributed across 3 courses

export interface CourseRevenueSummary {
  courseId: string;
  courseTitle: string;
  trainerName: string;
  price: number; // in FCFA
  studentsCount: number;
  totalRevenue: number; // price * studentsCount
  percentageOfTotal: number;
  category: string;
}

export interface MonthlyRevenueData {
  monthKey: string; // e.g., '2024-01'
  label: string; // e.g., 'Janvier 2024'
  year: number;
  month: number; // 1-12
  revenue: number;
  studentsCount: number;
  courseA: number; // Monter des vidéos avec l'ordinateur (35 000 FCFA)
  courseB: number; // Monter des vidéos avec le téléphone (5 000 FCFA)
  courseC: number; // Cash Nation (25 000 FCFA)
}

export interface StudentTransaction {
  id: string;
  studentName: string;
  studentEmail: string;
  avatarUrl: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  paymentMethod: 'Orange Money' | 'MTN MoMo' | 'Wave' | 'Carte Bancaire';
  transactionDate: string; // ISO string
  status: 'Payé' | 'Validé';
  country: string;
}

// 1. Defined courses for revenue calculation
export const REVENUE_COURSES: CourseRevenueSummary[] = [
  {
    courseId: 'c-1',
    courseTitle: "Monter des vidéos avec l'ordinateur",
    trainerName: 'Jean Dupont',
    price: 35000,
    studentsCount: 250,
    totalRevenue: 8750000, // 250 * 35 000 = 8 750 000 FCFA
    percentageOfTotal: 44.87,
    category: 'Montage Vidéo sur PC & Mac'
  },
  {
    courseId: 'c-2',
    courseTitle: 'Monter des vidéos avec le téléphone',
    trainerName: 'Marie Laurent',
    price: 5000,
    studentsCount: 1150,
    totalRevenue: 5750000, // 1 150 * 5 000 = 5 750 000 FCFA
    percentageOfTotal: 29.49,
    category: 'Montage Vidéo sur Smartphone'
  },
  {
    courseId: 'c-3',
    courseTitle: 'Cash Nation',
    trainerName: 'Ibrahim Touré',
    price: 25000,
    studentsCount: 200,
    totalRevenue: 5000000, // 200 * 25 000 = 5 000 000 FCFA
    percentageOfTotal: 25.64,
    category: 'Business & Monétisation'
  }
];

// Total Revenue = 8 750 000 + 5 750 000 + 5 000 000 = 19 500 000 FCFA
export const TOTAL_PLATFORM_REVENUE = 19500000;
export const TOTAL_STUDENTS_COUNT = 1600; // 250 + 1150 + 200

// 2. Monthly Revenue Data from Jan 2024 to Sep 2026 (33 months)
// Math breakdown:
// 2024: 6 550 000 FCFA (535 students)
// 2025: 9 200 000 FCFA (755 students)
// 2026: 3 750 000 FCFA (310 students)
// Total = 19 500 000 FCFA
export const MONTHLY_REVENUE_DATA: MonthlyRevenueData[] = [
  // --- 2024 ---
  { monthKey: '2024-01', label: 'Janv 2024', year: 2024, month: 1, revenue: 380000, studentsCount: 32, courseA: 175000, courseB: 130000, courseC: 75000 },
  { monthKey: '2024-02', label: 'Févr 2024', year: 2024, month: 2, revenue: 420000, studentsCount: 35, courseA: 210000, courseB: 110000, courseC: 100000 },
  { monthKey: '2024-03', label: 'Mars 2024', year: 2024, month: 3, revenue: 490000, studentsCount: 42, courseA: 245000, courseB: 145000, courseC: 100000 },
  { monthKey: '2024-04', label: 'Avr 2024', year: 2024, month: 4, revenue: 510000, studentsCount: 41, courseA: 245000, courseB: 140000, courseC: 125000 },
  { monthKey: '2024-05', label: 'Mai 2024', year: 2024, month: 5, revenue: 540000, studentsCount: 44, courseA: 280000, courseB: 160000, courseC: 100000 },
  { monthKey: '2024-06', label: 'Juin 2024', year: 2024, month: 6, revenue: 560000, studentsCount: 46, courseA: 280000, courseB: 180000, courseC: 100000 },
  { monthKey: '2024-07', label: 'Juil 2024', year: 2024, month: 7, revenue: 520000, studentsCount: 43, courseA: 245000, courseB: 150000, courseC: 125000 },
  { monthKey: '2024-08', label: 'Août 2024', year: 2024, month: 8, revenue: 480000, studentsCount: 39, courseA: 210000, courseB: 145000, courseC: 125000 },
  { monthKey: '2024-09', label: 'Sept 2024', year: 2024, month: 9, revenue: 590000, studentsCount: 48, courseA: 315000, courseB: 175000, courseC: 100000 },
  { monthKey: '2024-10', label: 'Oct 2024', year: 2024, month: 10, revenue: 630000, studentsCount: 52, courseA: 315000, courseB: 190000, courseC: 125000 },
  { monthKey: '2024-11', label: 'Nov 2024', year: 2024, month: 11, revenue: 680000, studentsCount: 55, courseA: 350000, courseB: 205000, courseC: 125000 },
  { monthKey: '2024-12', label: 'Déc 2024', year: 2024, month: 12, revenue: 750000, studentsCount: 58, courseA: 385000, courseB: 215000, courseC: 150000 },

  // --- 2025 ---
  { monthKey: '2025-01', label: 'Janv 2025', year: 2025, month: 1, revenue: 640000, studentsCount: 52, courseA: 280000, courseB: 210000, courseC: 150000 },
  { monthKey: '2025-02', label: 'Févr 2025', year: 2025, month: 2, revenue: 690000, studentsCount: 56, courseA: 315000, courseB: 225000, courseC: 150000 },
  { monthKey: '2025-03', label: 'Mars 2025', year: 2025, month: 3, revenue: 780000, studentsCount: 65, courseA: 385000, courseB: 245000, courseC: 150000 },
  { monthKey: '2025-04', label: 'Avr 2025', year: 2025, month: 4, revenue: 710000, studentsCount: 59, courseA: 315000, courseB: 220000, courseC: 175000 },
  { monthKey: '2025-05', label: 'Mai 2025', year: 2025, month: 5, revenue: 750000, studentsCount: 62, courseA: 350000, courseB: 225000, courseC: 175000 },
  { monthKey: '2025-06', label: 'Juin 2025', year: 2025, month: 6, revenue: 790000, studentsCount: 64, courseA: 385000, courseB: 230000, courseC: 175000 },
  { monthKey: '2025-07', label: 'Juil 2025', year: 2025, month: 7, revenue: 720000, studentsCount: 59, courseA: 350000, courseB: 220000, courseC: 150000 },
  { monthKey: '2025-08', label: 'Août 2025', year: 2025, month: 8, revenue: 690000, studentsCount: 57, courseA: 315000, courseB: 225000, courseC: 150000 },
  { monthKey: '2025-09', label: 'Sept 2025', year: 2025, month: 9, revenue: 810000, studentsCount: 67, courseA: 385000, courseB: 250000, courseC: 175000 },
  { monthKey: '2025-10', label: 'Oct 2025', year: 2025, month: 10, revenue: 830000, studentsCount: 68, courseA: 385000, courseB: 245000, courseC: 200000 },
  { monthKey: '2025-11', label: 'Nov 2025', year: 2025, month: 11, revenue: 860000, studentsCount: 71, courseA: 420000, courseB: 240000, courseC: 200000 },
  { monthKey: '2025-12', label: 'Déc 2025', year: 2025, month: 12, revenue: 930000, studentsCount: 75, courseA: 455000, courseB: 275000, courseC: 200000 },

  // --- 2026 (Jan to Sep) ---
  { monthKey: '2026-01', label: 'Janv 2026', year: 2026, month: 1, revenue: 410000, studentsCount: 33, courseA: 175000, courseB: 135000, courseC: 100000 },
  { monthKey: '2026-02', label: 'Févr 2026', year: 2026, month: 2, revenue: 430000, studentsCount: 36, courseA: 210000, courseB: 120000, courseC: 100000 },
  { monthKey: '2026-03', label: 'Mars 2026', year: 2026, month: 3, revenue: 450000, studentsCount: 38, courseA: 210000, courseB: 140000, courseC: 100000 },
  { monthKey: '2026-04', label: 'Avr 2026', year: 2026, month: 4, revenue: 390000, studentsCount: 32, courseA: 175000, courseB: 115000, courseC: 100000 },
  { monthKey: '2026-05', label: 'Mai 2026', year: 2026, month: 5, revenue: 420000, studentsCount: 35, courseA: 210000, courseB: 135000, courseC: 75000 },
  { monthKey: '2026-06', label: 'Juin 2026', year: 2026, month: 6, revenue: 440000, studentsCount: 37, courseA: 210000, courseB: 130000, courseC: 100000 },
  { monthKey: '2026-07', label: 'Juil 2026', year: 2026, month: 7, revenue: 380000, studentsCount: 31, courseA: 175000, courseB: 130000, courseC: 75000 },
  { monthKey: '2026-08', label: 'Août 2026', year: 2026, month: 8, revenue: 400000, studentsCount: 33, courseA: 175000, courseB: 125000, courseC: 100000 },
  { monthKey: '2026-09', label: 'Sept 2026', year: 2026, month: 9, revenue: 430000, studentsCount: 35, courseA: 210000, courseB: 120000, courseC: 100000 }
];

// 3. Fictitious Students & Transactions Generator
const FIRST_NAMES = [
  'Mamadou', 'Aïcha', 'Koffi', 'Fatou', 'Jean-Luc', 'Aminata', 'Ibrahim', 'Mariam',
  'Seydou', 'Grace', 'Emmanuel', 'Chantal', 'Abdoulaye', 'Bintou', 'Christian', 'Salimata',
  'Ousmane', 'Ndeye', 'David', 'Assitan', 'Paul', 'Rokhaya', 'Patrick', 'Nathalie',
  'Amadou', 'Sokhna', 'Fabrice', 'Djeneba', 'Michel', 'Esther', 'Samuel', 'Clarisse',
  'Bakary', 'Adama', 'Yannick', 'Awa', 'Hervé', 'Kadiatou', 'Serge', 'Sita'
];

const LAST_NAMES = [
  'Traoré', 'Diallo', 'Mensah', 'Ndiaye', 'Kouamé', 'Touré', 'Koné', 'Sow',
  'Ouédraogo', 'Faye', 'Kamga', 'Diop', 'Cissé', 'Keita', 'Gueye', 'Bamba',
  'Fofana', 'Kaboré', 'Barry', 'Sarr', 'Ewane', 'Sidibé', 'Tchinda', 'Diarra',
  'Sylla', 'Fall', 'Mendy', 'Ba', 'Coulibaly', 'Sanogo', 'Toure', 'N\'Dri'
];

const PAYMENT_METHODS: ('Orange Money' | 'MTN MoMo' | 'Wave' | 'Carte Bancaire')[] = [
  'Orange Money', 'Orange Money', 'Orange Money', // 40-45%
  'MTN MoMo', 'MTN MoMo', // 25-30%
  'Wave', 'Wave', // 20%
  'Carte Bancaire' // 10%
];

const COUNTRIES = [
  'Sénégal', 'Côte d\'Ivoire', 'Cameroun', 'Mali', 'Burkina Faso', 'Guinée', 'Bénin', 'Togo', 'Gabon', 'Congo'
];

// Generate consistent fictitious transactions
let cachedTransactions: StudentTransaction[] | null = null;

export function getFictitiousTransactions(): StudentTransaction[] {
  if (cachedTransactions) {
    return cachedTransactions;
  }

  const transactions: StudentTransaction[] = [];
  let txIndex = 1;

  // We generate realistic transactions across the 33 months
  MONTHLY_REVENUE_DATA.forEach((monthData) => {
    // Number of Course A students (price 35 000)
    const countA = Math.round(monthData.courseA / 35000);
    // Number of Course B students (price 5 000)
    const countB = Math.round(monthData.courseB / 5000);
    // Number of Course C students (price 25 000)
    const countC = Math.round(monthData.courseC / 25000);

    const addTx = (courseId: string, courseTitle: string, price: number, daySeed: number) => {
      const fName = FIRST_NAMES[(txIndex * 7 + daySeed) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(txIndex * 11 + daySeed) % LAST_NAMES.length];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase().replace(/[^a-z]/g, '')}.${lName.toLowerCase().replace(/[^a-z]/g, '')}${txIndex % 99 + 1}@gmail.com`;
      const pMethod = PAYMENT_METHODS[(txIndex * 3 + daySeed) % PAYMENT_METHODS.length];
      const country = COUNTRIES[(txIndex * 5 + daySeed) % COUNTRIES.length];
      
      const day = ((txIndex * 3 + daySeed) % 27) + 1;
      const hour = 8 + (txIndex % 13);
      const minute = (txIndex * 7) % 60;
      const dateStr = `${monthData.year}-${String(monthData.month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;

      transactions.push({
        id: `TX-${monthData.year}-${String(txIndex).padStart(5, '0')}`,
        studentName: name,
        studentEmail: email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,4f46e5,059669,d97706,e11d48`,
        courseId,
        courseTitle,
        amount: price,
        paymentMethod: pMethod,
        transactionDate: dateStr,
        status: 'Payé',
        country
      });

      txIndex++;
    };

    for (let i = 0; i < countA; i++) {
      addTx('c-1', "Monter des vidéos avec l'ordinateur", 35000, i);
    }
    for (let i = 0; i < countB; i++) {
      addTx('c-2', 'Monter des vidéos avec le téléphone', 5000, i);
    }
    for (let i = 0; i < countC; i++) {
      addTx('c-3', 'Cash Nation', 25000, i);
    }
  });

  // Sort descending by date (most recent first)
  transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  cachedTransactions = transactions;
  return transactions;
}

// 4. Helper formatting currency in FCFA
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

// 5. CSV Exporter for Administrator
export function exportRevenueLedgerCSV(transactions: StudentTransaction[]): void {
  const headers = [
    'ID Transaction',
    'Date & Heure',
    'Nom Étudiant',
    'Email Étudiant',
    'Pays',
    'Formation Achetée',
    'Montant (FCFA)',
    'Mode de Paiement',
    'Statut'
  ];

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${new Date(t.transactionDate).toLocaleString('fr-FR')}"`,
    `"${t.studentName.replace(/"/g, '""')}"`,
    `"${t.studentEmail}"`,
    `"${t.country}"`,
    `"${t.courseTitle.replace(/"/g, '""')}"`,
    t.amount,
    `"${t.paymentMethod}"`,
    `"${t.status}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `rapport_revenus_plateforme_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
