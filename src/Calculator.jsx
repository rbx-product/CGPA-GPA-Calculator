import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Copy, Printer, RotateCcw } from 'lucide-react';
import { SCHEMES, STATUS, GENERAL_ID, DEFAULT_CUSTOM, buildCustomScheme } from './lib/grading.js';
import { sgpa, cgpaFromSemesters, targetRequired, toPercentage, fmt } from './lib/calc.js';
import { load, save, clear } from './lib/storage.js';

const uid = () => Math.random().toString(36).slice(2, 9);
const newRow = () => ({ id: uid(), name: '', credits: '', grade: '' });
const newSem = () => ({ id: uid(), label: '', sgpa: '', credits: '' });
const rows = (n, f) => Array.from({ length: n }, f);

function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
const Errors = ({ list }) => list.length > 0 && <ul className="errs" role="alert">{list.map((e, i) => <li key={e.id || i}>{e.msg || e}</li>)}</ul>;

export default function Calculator() {
  const saved = useMemo(load, []);
  const [schemeId, setSchemeId] = useState(saved?.schemeId || SCHEMES[0].id);
  const [custom, setCustom] = useState(saved?.custom || DEFAULT_CUSTOM);
  const [override, setOverride] = useState(null);
  const [tab, setTab] = useState('sgpa');
  const [pointsMode, setPointsMode] = useState(false);
  const [subs, setSubs] = useState(saved?.subs || rows(3, newRow));
  const [sems, setSems] = useState(saved?.sems || rows(2, newSem));
  const [keep, setKeep] = useState(!!saved);
  const [tg, setTg] = useState({ current: '', done: '', target: '', future: '' });
  const [pc, setPc] = useState('');
  const [status, setStatus] = useState('');

  const scheme = useMemo(() => (schemeId === GENERAL_ID ? buildCustomScheme(custom) : SCHEMES.find((s) => s.id === schemeId)), [schemeId, custom]);
  const includeFailed = override ?? scheme.includeFailed;
  const customBad = scheme.errors?.length > 0;

  useEffect(() => { if (keep) save({ schemeId, custom, subs, sems }); else clear(); }, [keep, schemeId, custom, subs, sems]);

  const sg = useMemo(() => sgpa(subs, scheme, { includeFailed, pointsMode }), [subs, scheme, includeFailed, pointsMode]);
  const cg = useMemo(() => cgpaFromSemesters(sems, scheme.max), [sems, scheme.max]);
  const result = tab === 'sgpa' ? sg : cg;
  const label = tab === 'sgpa' ? 'SGPA' : 'CGPA';
  const tr = targetRequired({ ...tg, max: scheme.max });
  const pr = toPercentage(pc, scheme.pct, scheme.max);
  const bestGrade = tr.state === 'ok' ? [...scheme.grades].filter((g) => g.kind === 'pass').sort((a, b) => a.points - b.points).find((g) => g.points >= tr.required - 1e-9) : null;

  const upd = (set, id, k, v) => set((l) => l.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const del = (set, id) => set((l) => l.filter((r) => r.id !== id));
  const summary = () => result.value == null ? '' :
    `RBX · ${scheme.name}${scheme.status === 'custom' ? ' (custom, unofficial)' : ''}\n${label}: ${fmt(result.value, scheme.precision)} (${result.credits} credits)\n` +
    result.lines.map((l) => (tab === 'sgpa' ? `${l.name}: ${l.credits} cr × ${l.points}${l.counted ? '' : ' (not counted)'}` : `${l.name}: SGPA ${l.sgpa} × ${l.credits} cr`)).join('\n');
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary()); setStatus('Results copied to clipboard.'); }
    catch { setStatus('Copy isn’t available in this browser. Select the breakdown and copy it manually.'); }
  };
  const reset = () => {
    setSubs(rows(3, newRow)); setSems(rows(2, newSem)); setTg({ current: '', done: '', target: '', future: '' }); setPc(''); setOverride(null); setStatus('Calculator reset.');
  };
  const setCustomField = (k) => (e) => setCustom((c) => ({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <>
      <section id="calculator" className="section" aria-labelledby="calc-h">
        <div className="wrap">
          <h2 id="calc-h">SGPA &amp; CGPA</h2>
          <div className="panel">
            <Field label="Grading scheme">
              <select value={schemeId} onChange={(e) => { setSchemeId(e.target.value); setOverride(null); setSubs((l) => l.map((r) => ({ ...r, grade: '' }))); }}>
                {SCHEMES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                <option value={GENERAL_ID}>General · custom grading</option>
              </select>
            </Field>
            <p className={`badge ${scheme.status}`}>{STATUS[scheme.status]}</p>
            <details className="rules">
              <summary>Rules and sources for this scheme</summary>
              <p>{scheme.scope}</p>
              <ul>{scheme.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              {scheme.source && <p><a href={scheme.source.url} target="_blank" rel="noreferrer">{scheme.source.title}</a></p>}
              <p>RBX is independent and not affiliated with or endorsed by Anna University. Other regulations (for example R-2017, R-2019) are unverified here: use the General scheme with your own rules.</p>
            </details>
            {schemeId === GENERAL_ID ? (
              <div className="grid2 custom">
                <Field label="Grades and points" hint="One per entry: A=8, B=7. A 0-point grade counts as failing."><textarea rows="3" value={custom.table} onChange={setCustomField('table')} /></Field>
                <div className="stack">
                  <Field label="Maximum grade point"><input inputMode="decimal" value={custom.max} onChange={setCustomField('max')} /></Field>
                  <Field label="Rounding (decimals)"><input inputMode="numeric" value={custom.precision} onChange={setCustomField('precision')} /></Field>
                  <Field label="Percentage = CGPA ×"><input inputMode="decimal" value={custom.multiplier} onChange={setCustomField('multiplier')} /></Field>
                  <Field label="… plus offset"><input inputMode="decimal" value={custom.offset} onChange={setCustomField('offset')} /></Field>
                </div>
                <Errors list={scheme.errors} />
              </div>
            ) : null}
            <label className="check">
              <input type="checkbox" checked={includeFailed} onChange={(e) => setOverride(e.target.checked)} disabled={tab !== 'sgpa'} />
              Count failing grades (0 points) in the average
              {schemeId !== GENERAL_ID && override !== null && override !== scheme.includeFailed && <em> — differs from the regulation</em>}
            </label>

            <div role="tablist" aria-label="Calculator mode" className="tabs">
              {[['sgpa', 'SGPA'], ['cgpa', 'CGPA · semesters']].map(([k, t]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>
              ))}
            </div>

            {tab === 'sgpa' ? (
              <div role="tabpanel">
                <label className="check"><input type="checkbox" checked={pointsMode} onChange={(e) => { setPointsMode(e.target.checked); setSubs((l) => l.map((r) => ({ ...r, grade: '' }))); }} /> Enter numeric grade points instead of letters</label>
                {subs.map((r, i) => (
                  <div className={`row ${sg.errors.some((e) => e.id === r.id) ? 'bad' : ''}`} key={r.id}>
                    <input aria-label={`Subject ${i + 1} name`} placeholder={`Subject ${i + 1} (optional)`} value={r.name} onChange={(e) => upd(setSubs, r.id, 'name', e.target.value)} />
                    <input aria-label={`Subject ${i + 1} credits`} placeholder="Credits" inputMode="decimal" value={r.credits} onChange={(e) => upd(setSubs, r.id, 'credits', e.target.value)} />
                    {pointsMode
                      ? <input aria-label={`Subject ${i + 1} grade point`} placeholder={`0–${scheme.max}`} inputMode="decimal" value={r.grade} onChange={(e) => upd(setSubs, r.id, 'grade', e.target.value)} />
                      : <select aria-label={`Subject ${i + 1} grade`} value={r.grade} onChange={(e) => upd(setSubs, r.id, 'grade', e.target.value)}>
                          <option value="">Grade</option>
                          {scheme.grades.map((g) => <option key={g.label} value={g.label}>{g.label} ({g.points}{g.kind === 'skip' ? ', excluded' : ''})</option>)}
                        </select>}
                    <button className="icon" aria-label={`Delete subject ${i + 1}`} onClick={() => del(setSubs, r.id)}><Trash2 size={18} /></button>
                  </div>
                ))}
                <button className="btn quiet" onClick={() => setSubs((l) => [...l, newRow()])}><Plus size={18} /> Add subject</button>
              </div>
            ) : (
              <div role="tabpanel">
                {sems.map((r, i) => (
                  <div className={`row sem ${cg.errors.some((e) => e.id === r.id) ? 'bad' : ''}`} key={r.id}>
                    <input aria-label={`Semester ${i + 1} label`} placeholder={`Semester ${i + 1}`} value={r.label} onChange={(e) => upd(setSems, r.id, 'label', e.target.value)} />
                    <input aria-label={`Semester ${i + 1} SGPA`} placeholder="SGPA" inputMode="decimal" value={r.sgpa} onChange={(e) => upd(setSems, r.id, 'sgpa', e.target.value)} />
                    <input aria-label={`Semester ${i + 1} credits`} placeholder="Credits" inputMode="decimal" value={r.credits} onChange={(e) => upd(setSems, r.id, 'credits', e.target.value)} />
                    <button className="icon" aria-label={`Delete semester ${i + 1}`} onClick={() => del(setSems, r.id)}><Trash2 size={18} /></button>
                  </div>
                ))}
                <button className="btn quiet" onClick={() => setSems((l) => [...l, newSem()])}><Plus size={18} /> Add semester</button>
                <p className="note">Weighted by each semester’s credits, never a plain average of SGPAs.</p>
              </div>
            )}

            <div className="result" aria-live="polite">
              <Errors list={result.errors} />
              {result.value == null ? <p className="empty">Add at least one row with valid credits{tab === 'sgpa' ? ' and a grade' : ' and an SGPA'} to see your {label}.</p> : (
                <>
                  <p className="big"><span>{label}</span><strong>{fmt(result.value, scheme.precision)}</strong></p>
                  <p className="meta">{result.credits} credits included · {scheme.name}{scheme.status === 'custom' ? ' · custom rules' : ''}</p>
                  <table>
                    <thead><tr><th>{tab === 'sgpa' ? 'Subject' : 'Semester'}</th><th>Credits</th><th>{tab === 'sgpa' ? 'Points' : 'SGPA'}</th><th>Weighted</th></tr></thead>
                    <tbody>{result.lines.map((l, i) => (
                      <tr key={i} className={l.counted === false ? 'skip' : ''}><td>{l.name}{l.counted === false && ' (not counted)'}</td><td>{l.credits}</td><td>{tab === 'sgpa' ? l.points : l.sgpa}</td><td>{l.counted === false ? '—' : fmt(l.credits * (tab === 'sgpa' ? l.points : l.sgpa), 2)}</td></tr>
                    ))}</tbody>
                  </table>
                </>
              )}
            </div>
            <div className="actions">
              <button className="btn" onClick={copy} disabled={result.value == null}><Copy size={18} /> Copy results</button>
              <button className="btn quiet" onClick={() => window.print()} disabled={result.value == null}><Printer size={18} /> Print</button>
              <button className="btn quiet" onClick={reset}><RotateCcw size={18} /> Reset</button>
            </div>
            <label className="check"><input type="checkbox" checked={keep} onChange={(e) => { setKeep(e.target.checked); setStatus(e.target.checked ? 'Saved on this device.' : 'Saved data deleted.'); }} /> Save on this device</label>
            <small>Stored only in this browser. Untick to delete it.</small>
            <p className="sr" role="status">{status}</p>
            {status && <p className="note" aria-hidden="true">{status}</p>}
          </div>
        </div>
      </section>

      <section id="target" className="section alt" aria-labelledby="t-h" data-reveal>
        <div className="wrap">
          <h2 id="t-h">Target CGPA</h2>
          <div className="panel">
            <div className="grid4">
              {[['current', 'Current CGPA'], ['done', 'Credits completed'], ['target', 'Target CGPA'], ['future', 'Remaining credits']].map(([k, t]) => (
                <Field key={k} label={t}><input inputMode="decimal" value={tg[k]} onChange={(e) => setTg({ ...tg, [k]: e.target.value })} /></Field>
              ))}
            </div>
            <div className="result" aria-live="polite">
              {tr.state === 'empty' || tr.state === 'incomplete' ? <p className="empty">Fill in all four values to see the average you need.</p> : null}
              {tr.state === 'error' && <Errors list={[tr.msg]} />}
              {tr.state === 'ok' && <p className="big"><span>Needed average</span><strong>{fmt(tr.required)}</strong></p>}
              {tr.state === 'ok' && <p className="meta">Across {tg.future} credits{bestGrade ? `. Closest grade at or above this: ${bestGrade.label} (${bestGrade.points}).` : '.'}</p>}
              {tr.state === 'impossible' && <p className="warn">Not reachable: you would need {fmt(tr.required)}, above the maximum of {scheme.max}. Your best possible CGPA is {fmt(tr.best)}.</p>}
              {tr.state === 'already' && <p className="meta">Already secured: even a 0 average keeps you at {fmt(tr.worst)} or above.</p>}
            </div>
            <p className="note">Assumes a {scheme.max}-point scale and that all future credits count. Arrear, repeat or excluded-course rules can make the official result differ.</p>
          </div>
        </div>
      </section>

      <section id="percentage" className="section" aria-labelledby="p-h" data-reveal>
        <div className="wrap">
          <h2 id="p-h">CGPA to percentage</h2>
          <div className="panel">
            <Field label="CGPA"><input inputMode="decimal" value={pc} onChange={(e) => setPc(e.target.value)} /></Field>
            <p className={`badge ${scheme.pct.official ? 'verified' : 'custom'}`}>
              {scheme.pct.official ? `Official rule (cl. ${scheme.pct.clause}): percentage = CGPA × ${scheme.pct.multiplier}` : `Custom rule: percentage = CGPA × ${scheme.pct.multiplier}${scheme.pct.offset ? ` ${scheme.pct.offset < 0 ? '−' : '+'} ${Math.abs(scheme.pct.offset)}` : ''}`}
            </p>
            <div className="result" aria-live="polite">
              {pr.state === 'empty' && <p className="empty">Enter a CGPA to convert.</p>}
              {pr.state === 'error' && <Errors list={[pr.msg]} />}
              {pr.state === 'ok' && <p className="big"><span>Percentage</span><strong>{fmt(pr.value)}%</strong></p>}
              {pr.state === 'ok' && pr.warn && <p className="warn">{pr.warn}</p>}
            </div>
            <p className="note">The rule follows the scheme selected above. Change the scheme there; use General to enter your institution’s published formula.</p>
          </div>
        </div>
      </section>
    </>
  );
}
