# Static Metrics Explorer (GitHub Pages)

The browser builds a toy corpus and computes the metrics in JavaScript (`js/engine.js`). No Python process and no JSON API.

This is a **second implementation** of the explorer, not `liberata_metrics`. Numbers will not match `python -m website.app` exactly. Connected components use union-find. The Fiedler value is the algebraic connectivity of the co-authorship Laplacian. Spanning-tree ratios count collaboration edges rather than applying Kirchhoff's theorem.

## Preview locally

```bash
cd website-static
python3 -m http.server 8080
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## GitHub Pages

Point Pages at this folder (include `.nojekyll`). This repo’s Sphinx docs already use the `gh-pages` branch for liberata.info; copy this folder beside those docs (for example as `/explorer/`) if you want both.

## Optional Python bake

`python -m website.export_static` still writes `snapshots.js` from the real library. The live static page does not load that file.
