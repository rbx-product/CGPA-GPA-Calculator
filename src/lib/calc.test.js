import { describe, it, expect } from 'vitest';
import { sgpa, cgpaFromSemesters, targetRequired, toPercentage, round, num } from './calc.js';
import { SCHEMES, parseGradeTable, buildCustomScheme, DEFAULT_CUSTOM } from './grading.js';

const ar23 = SCHEMES.find((s) => s.id === 'au-ar2023-ud');
const r21 = SCHEMES.find((s) => s.id === 'au-r2021-aff');
const ar25 = SCHEMES.find((s) => s.id === 'au-ar2025-aff');
const row = (credits, grade, name = '') => ({ id: Math.random().toString(), name, credits, grade });

describe('SGPA', () => {
  it('is credit weighted', () => {
    const r = sgpa([row('3', 'S'), row('4', 'A'), row('2', 'B')], ar23);
    expect(r.value).toBeCloseTo((30 + 32 + 12) / 9, 10);
    expect(r.credits).toBe(9);
  });
  it('counts U as 0 where the regulation says so (AR2023)', () => {
    expect(sgpa([row('3', 'S'), row('3', 'U')], ar23).value).toBe(5);
  });
  it('excludes U under R-2021', () => {
    expect(sgpa([row('3', 'O'), row('3', 'U')], r21).value).toBe(10);
  });
  it('lets the user override the U rule', () => {
    expect(sgpa([row('3', 'O'), row('3', 'U')], r21, { includeFailed: true }).value).toBe(5);
  });
  it('leaves SA/WC out of the average', () => {
    const r = sgpa([row('4', 'A'), row('4', 'SA')], ar23);
    expect(r.value).toBe(8); expect(r.credits).toBe(4);
  });
  it('uses AR2025 grade points (B=6.5, C+=6)', () => {
    expect(sgpa([row('2', 'B'), row('2', 'C+')], ar25).value).toBe(6.25);
  });
  it('accepts numeric grade points', () => {
    expect(sgpa([row('4', '8.5'), row('2', '7')], ar23, { pointsMode: true }).value).toBeCloseTo(8, 10);
  });
  it('rejects zero, negative and invalid credits, and missing grades', () => {
    const r = sgpa([row('0', 'A'), row('-2', 'A'), row('abc', 'A'), row('3', '')], ar23);
    expect(r.errors).toHaveLength(4); expect(r.value).toBeNull();
  });
  it('rejects out-of-range numeric points', () => {
    expect(sgpa([row('3', '11')], ar23, { pointsMode: true }).errors).toHaveLength(1);
  });
  it('ignores empty rows and avoids division by zero', () => {
    const r = sgpa([row('', ''), row('', '')], ar23);
    expect(r.value).toBeNull(); expect(r.errors).toHaveLength(0);
  });
});

describe('CGPA', () => {
  const sems = [{ id: 'a', sgpa: '9', credits: '20' }, { id: 'b', sgpa: '7', credits: '10' }];
  it('weights by credits, not a plain mean', () => {
    const r = cgpaFromSemesters(sems);
    expect(r.value).toBeCloseTo(25 / 3, 10);
    expect(r.value).not.toBeCloseTo(8, 3);
  });
  it('agrees with pooling every subject across semesters', () => {
    const s1 = [row('3', 'S'), row('4', 'A'), row('3', 'B+')];
    const s2 = [row('4', 'A+'), row('2', 'C'), row('4', 'B')];
    const a = sgpa(s1, ar23); const b = sgpa(s2, ar23);
    const viaSems = cgpaFromSemesters([{ sgpa: a.value, credits: a.credits }, { sgpa: b.value, credits: b.credits }]);
    expect(viaSems.value).toBeCloseTo(sgpa([...s1, ...s2], ar23).value, 10);
  });
  it('validates SGPA range, credits, and empty input', () => {
    expect(cgpaFromSemesters([{ id: 'x', sgpa: '11', credits: '20' }, { id: 'y', sgpa: '8', credits: '0' }]).errors).toHaveLength(2);
    expect(cgpaFromSemesters([{ sgpa: '', credits: '' }]).value).toBeNull();
  });
});

describe('Target CGPA', () => {
  it('computes the weighted requirement', () => {
    const r = targetRequired({ current: '8', done: '100', target: '8.5', future: '100' });
    expect(r.state).toBe('ok'); expect(r.required).toBeCloseTo(9, 10);
  });
  it('flags impossible targets', () => {
    expect(targetRequired({ current: '8', done: '100', target: '9.5', future: '20' }).state).toBe('impossible');
  });
  it('flags targets already secured', () => {
    expect(targetRequired({ current: '9', done: '100', target: '4', future: '20' }).state).toBe('already');
  });
  it('validates inputs', () => {
    expect(targetRequired({ current: '8', done: '100', target: '8.5', future: '0' }).state).toBe('error');
    expect(targetRequired({ current: '11', done: '100', target: '8.5', future: '10' }).state).toBe('error');
    expect(targetRequired({ current: '8', done: '', target: '', future: '' }).state).toBe('incomplete');
  });
});

describe('Percentage, rounding, custom schemes', () => {
  it('applies the official ×10 rule only through the selected rule', () => {
    expect(toPercentage('8.25', ar23.pct).value).toBeCloseTo(82.5, 10);
    expect(toPercentage('8', { multiplier: 9.5, offset: 0 }).value).toBe(76);
    expect(toPercentage('8', { multiplier: 10, offset: -7.5 }).value).toBe(72.5);
  });
  it('rejects CGPA out of range', () => { expect(toPercentage('11', ar23.pct).state).toBe('error'); });
  it('rounds half up consistently', () => {
    expect(round(8.125, 2)).toBe(8.13); expect(round(7.995, 2)).toBe(8); expect(num('x')).toBeNaN();
  });
  it('parses and validates custom grade tables', () => {
    expect(parseGradeTable('A=4, B=3\nF=0').grades).toHaveLength(3);
    expect(parseGradeTable('A 4').errors).toHaveLength(1);
    expect(parseGradeTable('A=4, A=3').errors).toHaveLength(1);
    expect(buildCustomScheme({ ...DEFAULT_CUSTOM, table: 'A=11', max: '10' }).errors.length).toBeGreaterThan(0);
    expect(buildCustomScheme(DEFAULT_CUSTOM).errors).toHaveLength(0);
  });
});
