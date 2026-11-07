# RBX — SGPA & CGPA calculator

Independent student calculator: SGPA, CGPA (semester-wise), target CGPA, CGPA→percentage. React + Vite, static, no backend, no login.
Anna University presets (AR2023 departments, AR2025 affiliated, R-2021 affiliated) plus a custom grading mode.

## Run
```bash
npm install
npm run dev      # local dev
npm test         # unit tests for the calculation engine
npm run build    # static site in dist/
```

## Deploy to GitHub Pages
1. Create a new empty repo on GitHub (e.g. `rbx-cgpa-calculator`), then:
   ```bash
   git init && git add . && git commit -m "RBX" && git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/REPO.git && git push -u origin main
   ```
2. Repo → Settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
3. The workflow sets the Vite base path (`/REPO/`) and the canonical/sitemap URL automatically. For local builds, the default base is `/rbx-cgpa-calculator/` (edit `vite.config.js` if your repo name differs).
4. Custom domain later: set `VITE_BASE=/` and `VITE_SITE_URL=https://yourdomain/` in the workflow `env`.

## Search Console
Add your Pages URL as a URL-prefix property, verify with the HTML-tag method (add the tag to `index.html`), then submit `sitemap.xml`.

## Grading sources and open items
| Scheme | Status | Source |
|---|---|---|
| R-2021 Affiliated | Verified (text read) | Regulations 2021: cl. 15.1, 15.5 (U excluded), 15.5.3 (%=CGPA×10) |
| AR2025 Affiliated | Verified (text read from a college-hosted copy) | Table 13, cl. 21.2, 21.4, 21.10. B=6.5, C+=6 |
| AR2023 (Rev 1) Departments | Grade table verified; clause numbers carried over, **not re-opened** | Table 11, cl. 21.2, 21.10 |

Unresolved: official R-2025 for University Departments, other revisions/amendments, programme-specific amendments, SA/WC credit treatment, and rounding in R-2021 are unverified. Re-check everything against https://cac.annauniv.edu/ before calling it official.

## Not included in this build
Subject-wise multi-semester CGPA, CSV export, Google Analytics (no tracking exists, so the privacy page says so), AdSense hooks, and an Open Graph image. Add analytics only with a real GA4 ID and consent handling, and never send grades or names.
