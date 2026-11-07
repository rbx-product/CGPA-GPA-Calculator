import { useEffect, useState } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';
import Calculator from './Calculator.jsx';
import { CONTACT } from './config.js';

const NAV = [['calculator', 'Calculator'], ['features', 'Features'], ['how', 'How It Works'], ['faq', 'FAQs'], ['about', 'About']];
const FEATURES = [
  ['SGPA and CGPA', 'Credit-weighted by subject or by semester, with the working shown.'],
  ['Target estimator', 'The average you need on remaining credits, or a clear “not reachable”.'],
  ['Percentage converter', 'Each rule is labelled official or custom.'],
  ['Verified presets', 'Anna University schemes cite the clause they come from.'],
  ['Your own grading', 'Enter any grade table, maximum point and percentage formula.'],
  ['Private by default', 'No login, no backend, no tracking. Saving is opt-in.'],
];
const FAQ = [
  ['What’s the difference between SGPA and CGPA?', 'SGPA covers one semester. CGPA combines semesters, weighted by credits.'],
  ['Why not average my SGPAs?', 'Semesters carry different credits, so a plain average gives lighter semesters too much weight.'],
  ['Are the Anna University results official?', 'No. RBX is independent. Presets are labelled with how they were verified. Your grade sheet is the only official result.'],
  ['Do all Anna University students use the same rules?', 'No. Affiliated institutions and University Departments follow different regulations, and grade points differ between them (for example B = 6 in AR2023 but 6.5 in AR2025). Pick the scheme for your admission year.'],
  ['Is my data stored?', 'Only if you tick “Save on this device”. Your theme choice is also remembered in your browser.'],
];

const LEGAL = {
  privacy: ['Privacy Policy', ['RBX runs in your browser. Calculations are never sent to a server, and there is no account.', 'Your browser’s local storage holds your theme choice, and your entries only if you tick “Save on this device”. Untick it to delete them.', 'This site currently uses no analytics, cookies or advertising. If that changes, this page will be updated before it does. This is an editable template, not legal advice.']],
  terms: ['Terms of Use', ['RBX is provided free and as is, for personal planning. Results are estimates and may differ from your institution’s official grade sheet.', 'Use of the site means you accept that you are responsible for checking results against official documents. This is an editable template, not legal advice.']],
  disclaimer: ['Disclaimer', ['RBX is an independent calculator. It is not affiliated with or endorsed by Anna University or any institution.', 'Presets follow published regulations as read by the author and may be out of date or misread. Always confirm with your official regulation, department or grade sheet.']],
};

function useHash() {
  const [h, setH] = useState(window.location.hash);
  useEffect(() => { const f = () => setH(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return h;
}

function useEffects(deps) {
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => { const m = root.scrollHeight - innerHeight; root.style.setProperty('--progress', m > 0 ? scrollY / m : 0); };
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io;
    if (!reduce && 'IntersectionObserver' in window) {
      root.classList.add('anim');
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
      document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
    }
    return () => { removeEventListener('scroll', onScroll); io?.disconnect(); root.classList.remove('anim'); };
  }, deps);
}

export default function App() {
  const hash = useHash();
  const legal = LEGAL[hash.replace('#/', '')];
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  const [open, setOpen] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('rbx:theme', theme); } catch { /* ignore */ } }, [theme]);
  useEffect(() => { document.title = legal ? `${legal[0]} — RBX` : 'RBX — SGPA & CGPA Calculator for Students'; if (legal) scrollTo(0, 0); }, [legal]);
  useEffects([!!legal]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="progress" aria-hidden="true" />
      <header className="top">
        <div className="wrap bar">
          <a className="brand" href="#/" onClick={() => setOpen(false)}>RBX</a>
          <nav id="nav" className={open ? 'open' : ''} aria-label="Main">
            {NAV.map(([id, t]) => <a key={id} href={legal ? `#${id}` : `#${id}`} onClick={() => { setOpen(false); if (legal) window.location.hash = ''; }}>{t}</a>)}
          </nav>
          <button className="icon" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <button className="icon menu" aria-expanded={open} aria-controls="nav" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>
      <main id="main">
        {legal ? (
          <section className="section"><div className="wrap prose">
            <h1>{legal[0]}</h1>{legal[1].map((p) => <p key={p}>{p}</p>)}
            <p><a href="#/">← Back to the calculator</a></p>
          </div></section>
        ) : (
          <>
            <section className="hero"><div className="wrap">
              <h1>Your grades. Your goals. Your next step.</h1>
              <p className="lede">Calculate SGPA and CGPA, plan the grades you need, and convert to percentage, with honest labels on what is official.</p>
              <a className="btn" href="#calculator">Start calculating</a>
              <div className="ruler" aria-hidden="true">{Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}</div>
            </div></section>
            <Calculator />
            <section id="how" className="section alt" data-reveal><div className="wrap">
              <h2>How it works</h2>
              <ol className="steps">
                <li><h3>Pick a scheme</h3><p>Choose a verified Anna University preset or define your own grading.</p></li>
                <li><h3>Enter credits and grades</h3><p>Add subjects, or semesters with their SGPA and credits.</p></li>
                <li><h3>Read the breakdown</h3><p>SGPA = Σ(credits × points) ÷ Σ credits. CGPA weights each semester by its credits.</p></li>
              </ol>
            </div></section>
            <section id="features" className="section" data-reveal><div className="wrap">
              <h2>What you get</h2>
              <ul className="feat">{FEATURES.map(([t, d], i) => <li key={t} style={{ '--i': i }}><h3>{t}</h3><p>{d}</p></li>)}</ul>
            </div></section>
            <section id="faq" className="section alt" data-reveal><div className="wrap prose">
              <h2>Common questions</h2>
              {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div></section>
            <section id="about" className="section" data-reveal><div className="wrap prose">
              <h2>About RBX</h2>
              <p>RBX is an independent calculator that helps students understand their academic performance. It runs entirely in your browser and isn’t affiliated with Anna University or any institution.</p>
            </div></section>
          </>
        )}
      </main>
      <footer className="foot"><div className="wrap">
        <p><strong>RBX</strong> · An independent student calculator. Not affiliated with or endorsed by Anna University or any institution.</p>
        <p><a href="#/privacy">Privacy Policy</a> · <a href="#/terms">Terms of Use</a> · <a href="#/disclaimer">Disclaimer</a> · Contact: <a href={CONTACT.url} target="_blank" rel="noreferrer">{CONTACT.label}</a></p>
        <p>© {new Date().getFullYear()} RBX</p>
      </div></footer>
    </>
  );
}
