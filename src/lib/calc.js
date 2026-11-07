// Pure calculation functions. No UI code.
export const num = (v) => {
  if (v === '' || v == null) return NaN;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};
export const round = (x, d = 2) => { const f = 10 ** d; return Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f; };
export const fmt = (x, d = 2) => (x == null || Number.isNaN(x) ? '—' : round(x, d).toFixed(d));

const counts = (kind, includeFailed) => kind === 'pass' || (kind === 'fail' && includeFailed);

function resolveGrade(r, scheme, pointsMode) {
  if (pointsMode) {
    const p = num(r.grade);
    if (Number.isNaN(p) || p < 0 || p > scheme.max) return { err: `Grade point must be 0–${scheme.max}.` };
    return { points: p, kind: 'pass' };
  }
  const g = scheme.grades.find((x) => x.label === r.grade);
  return g ? { points: g.points, kind: g.kind } : { err: 'Choose a grade.' };
}

// SGPA = Σ(credits × points) / Σ(included credits)
export function sgpa(rows, scheme, { includeFailed = scheme.includeFailed, pointsMode = false } = {}) {
  let credits = 0; let total = 0; const lines = []; const errors = [];
  rows.forEach((r, i) => {
    if (!String(r.credits).trim() && !r.grade && !String(r.name).trim()) return; // empty row
    const name = String(r.name).trim() || `Subject ${i + 1}`;
    const c = num(r.credits);
    if (!(c > 0)) { errors.push({ id: r.id, msg: `${name}: credits must be above 0.` }); return; }
    const g = resolveGrade(r, scheme, pointsMode);
    if (g.err) { errors.push({ id: r.id, msg: `${name}: ${g.err}` }); return; }
    const ok = counts(g.kind, includeFailed);
    lines.push({ name, credits: c, points: g.points, grade: r.grade, counted: ok });
    if (ok) { credits += c; total += c * g.points; }
  });
  return { value: credits > 0 ? total / credits : null, credits, total, lines, errors };
}

// CGPA = Σ(SGPA × credits) / Σ(credits). Never a plain average of SGPAs.
export function cgpaFromSemesters(sems, max = 10) {
  let credits = 0; let total = 0; const lines = []; const errors = [];
  sems.forEach((s, i) => {
    if (!String(s.sgpa).trim() && !String(s.credits).trim()) return;
    const label = String(s.label).trim() || `Semester ${i + 1}`;
    const g = num(s.sgpa); const c = num(s.credits);
    if (Number.isNaN(g) || g < 0 || g > max) { errors.push({ id: s.id, msg: `${label}: SGPA must be 0–${max}.` }); return; }
    if (!(c > 0)) { errors.push({ id: s.id, msg: `${label}: credits must be above 0.` }); return; }
    credits += c; total += g * c; lines.push({ name: label, sgpa: g, credits: c });
  });
  return { value: credits > 0 ? total / credits : null, credits, total, lines, errors };
}

// Grade-point average needed over future credits to reach a target CGPA.
export function targetRequired({ current, done, target, future, max = 10 }) {
  const [c, d, t, f] = [current, done, target, future].map(num);
  if ([c, d, t, f].every(Number.isNaN)) return { state: 'empty' };
  if ([c, d, t, f].some(Number.isNaN)) return { state: 'incomplete' };
  if (c < 0 || c > max) return { state: 'error', msg: `Current CGPA must be 0–${max}.` };
  if (t < 0 || t > max) return { state: 'error', msg: `Target CGPA must be 0–${max}.` };
  if (d < 0) return { state: 'error', msg: 'Credits completed can’t be negative.' };
  if (!(f > 0)) return { state: 'error', msg: 'Future credits must be above 0.' };
  const required = (t * (d + f) - c * d) / f;
  const best = (c * d + max * f) / (d + f);
  const worst = (c * d) / (d + f);
  const state = required > max + 1e-9 ? 'impossible' : required <= 0 ? 'already' : 'ok';
  return { state, required, best, worst };
}

export function toPercentage(cgpa, rule, max = 10) {
  const c = num(cgpa);
  if (Number.isNaN(c)) return { state: 'empty' };
  if (c < 0 || c > max) return { state: 'error', msg: `CGPA must be 0–${max}.` };
  const value = c * rule.multiplier + rule.offset;
  return { state: 'ok', value, warn: value < 0 || value > 100 ? 'This formula gives a value outside 0–100%.' : null };
}
