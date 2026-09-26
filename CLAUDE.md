# Playground

Design explorations, published with GitHub Pages.

## Convention

- **One folder per exploration:** kebab-case, at the repo root (e.g. `key-features-carousel/`).
- **Each folder is self-contained:** it has its own `index.html`, its assets live inside the folder, and every path is relative (`assets/image.jpg`, never `/assets/...`).
- **The root `index.html` lists them all:** whenever you add a folder, add a link to it in the root `index.html` list, labeled with the exploration's name.
- Keep the root index plain and simple. No build step, no frameworks.

## Publishing

- GitHub Pages serves from `main`, at the repo root. Pushing to `main` publishes.
- Live URL: `https://christopher-tds.github.io/playground/<folder>/`
- `.nojekyll` makes Pages serve the files exactly as they are. Keep it.
- **The repo is public:** anyone can see every file. Check before adding client work that shouldn't be visible.
