# Metrics Explorer (React)

The browser builds a toy corpus and computes the metrics in JavaScript (`src/engine.js`). The page is a React app. No Python process and no JSON API.

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
