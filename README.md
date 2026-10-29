# Metrics Explorer (React)

The page builds a synthetic corpus in the browser and computes the metrics in JavaScript (`src/engine.js`). Mathematics, computer science, medicine, and economics each start from an OpenAlex profile for team size, citation rate, within-field citations, citation inequality, and citation timing. The corpus sliders scale those profiles; at the default, the profiles are used as measured. Credit shares are assigned by the inequality control. Every citation stays inside the corpus, so the counts match the network. The page is a React app. No Python process and no JSON API.

This is a **second implementation** of the explorer, not `liberata_metrics`. Numbers will not match `python -m website.app` exactly. Connected components use union-find. The Fiedler value is the algebraic connectivity of the co-authorship Laplacian. Spanning-tree ratios count collaboration edges rather than applying Kirchhoff's theorem.

## Preview locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually [http://127.0.0.1:5173](http://127.0.0.1:5173)).

## GitHub Pages

Pushes to `main` build the app and deploy the `dist` folder. The site is static files; the metric math still runs in the browser.

## Optional Python bake

`python -m website.export_static` still writes `snapshots.js` from the real library. The live page does not load that file.
