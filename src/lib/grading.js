// Grading schemes. Every preset records where each rule comes from.
// status: 'verified' | 'partial' | 'custom'. Anything not listed here is unverified: use General.
const g = (label, points, kind = 'pass') => ({ label, points, kind }); // kind: pass | fail | skip

export const STATUS = {
  verified: 'Verified from regulation text',
  partial: 'Grade table verified · re-check clause numbers',
  custom: 'Custom rules — not official',
};

export const SCHEMES = [
  {
    id: 'au-ar2023-ud',
    name: 'Anna University · University Departments · AR2023 (Rev. 1)',
    status: 'partial', max: 10, precision: 2, includeFailed: true,
    grades: [g('S', 10), g('A+', 9), g('A', 8), g('B+', 7), g('B', 6), g('C', 5), g('U', 0, 'fail'), g('SA', 0, 'skip'), g('WC', 0, 'skip')],
    pct: { multiplier: 10, offset: 0, official: true, clause: '21.10' },
    scope: 'B.E./B.Tech. students of Anna University departments, admitted from 2023.',
    source: { title: 'CAC — UG Regulations 2023 (Rev. 1, 2024), University Departments: Table 11, cl. 21.2, 21.10', url: 'https://cac.annauniv.edu/content/UD-Viewmore.html' },
    notes: [
      'GPA averages all courses registered in the semester, so U counts as 0 points (cl. 21.2).',
      'The text does not say whether SA/WC credits enter the average. They are left out by default.',
      'Clause numbers came from the official PDF cited on your earlier site and were not re-opened in this build.',
    ],
  },
  {
    id: 'au-ar2025-aff',
    name: 'Anna University · Affiliated (non-autonomous) · AR2025',
    status: 'verified', max: 10, precision: 2, includeFailed: true,
    grades: [g('S', 10), g('A+', 9), g('A', 8), g('B+', 7), g('B', 6.5), g('C+', 6), g('C', 5), g('U', 0, 'fail'), g('SA', 0, 'skip'), g('WC', 0, 'skip')],
    pct: { multiplier: 10, offset: 0, official: true, clause: '21.10' },
    scope: 'B.E./B.Tech. students admitted from 2025–26 at non-autonomous affiliated institutions.',
    source: { title: 'Academic Regulations 2025 (Affiliated): Table 13, cl. 21.2, 21.4, 21.10', url: 'https://cmscollege.edu.in/cet/wp-content/uploads/2026/08/CMSCET-UG-REGULATIONS-2025.pdf' },
    notes: [
      'Note B = 6.5 and a C+ = 6 grade exist here, unlike AR2023.',
      'CGPA is computed to two decimals (cl. 21.4). Additional, value-added and extra elective courses are excluded.',
      'Text read from a college-hosted copy of the University document. Confirm against cac.annauniv.edu.',
    ],
  },
  {
    id: 'au-r2021-aff',
    name: 'Anna University · Affiliated (non-autonomous) · R-2021',
    status: 'verified', max: 10, precision: 2, includeFailed: false,
    grades: [g('O', 10), g('A+', 9), g('A', 8), g('B+', 7), g('B', 6), g('C', 5), g('U', 0, 'fail'), g('SA', 0, 'skip'), g('WD', 0, 'skip')],
    pct: { multiplier: 10, offset: 0, official: true, clause: '15.5.3' },
    scope: 'B.E./B.Tech. students admitted from 2021–22 at non-autonomous affiliated colleges. The text also names University Colleges of Engineering, so confirm your cohort.',
    source: { title: 'Affiliated Institutions Regulations 2021: cl. 15.1, 15.5, 15.5.3', url: 'https://cac.annauniv.edu/' },
    notes: [
      'U grades are excluded from GPA and CGPA; only courses cleared count (cl. 15.5).',
      'Mandatory, value-added and additional courses are excluded from CGPA.',
      'No rounding rule appears in this text. Two decimals are shown for display.',
    ],
  },
];

export const GENERAL_ID = 'general';
export const DEFAULT_CUSTOM = {
  table: 'O=10, A+=9, A=8, B+=7, B=6, C=5, F=0',
  max: '10', precision: '2', multiplier: '10', offset: '0', includeFailed: true,
};

// "O=10, A+=9" (commas or new lines) -> grade list. Zero-point grades count as failing grades.
export function parseGradeTable(text) {
  const grades = []; const errors = [];
  String(text).split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).forEach((part) => {
    const m = part.match(/^(.+?)\s*=\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) { errors.push(`Can’t read “${part}”. Use the form A=8.`); return; }
    const points = Number(m[2]); const label = m[1].trim();
    if (grades.some((x) => x.label === label)) { errors.push(`Grade “${label}” is listed twice.`); return; }
    grades.push(g(label, points, points === 0 ? 'fail' : 'pass'));
  });
  if (!grades.length && !errors.length) errors.push('Add at least one grade.');
  return { grades, errors };
}

export function buildCustomScheme(c) {
  const max = Number(c.max); const precision = Number(c.precision);
  const { grades, errors } = parseGradeTable(c.table);
  if (!(max > 0)) errors.push('Maximum grade point must be above 0.');
  if (!(Number.isInteger(precision) && precision >= 0 && precision <= 4)) errors.push('Rounding must be 0–4 decimals.');
  grades.forEach((x) => { if (x.points > max) errors.push(`${x.label}=${x.points} is above the maximum (${max}).`); });
  const mult = Number(c.multiplier); const off = Number(c.offset);
  if (!Number.isFinite(mult) || !Number.isFinite(off)) errors.push('Percentage multiplier and offset must be numbers.');
  return {
    id: GENERAL_ID, name: 'General · custom grading', status: 'custom',
    max: max > 0 ? max : 10, precision: Number.isInteger(precision) && precision >= 0 && precision <= 4 ? precision : 2,
    includeFailed: !!c.includeFailed, grades,
    pct: { multiplier: Number.isFinite(mult) ? mult : 10, offset: Number.isFinite(off) ? off : 0, official: false },
    scope: 'Rules you define yourself. They match your institution only if you enter its published rules.',
    notes: ['Everything here is user-defined and unofficial.'], errors,
  };
}
