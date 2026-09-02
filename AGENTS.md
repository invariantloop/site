# Repository guide

## Architecture and stack

Invariant Loop is a static knowledge site built with VitePress 2 and Vue 3. Markdown under `docs/` is the content source; VitePress configuration defines navigation and local search. A custom Vue theme adds the home/overview knowledge graph, Mermaid rendering, and site-wide styling.

- Runtime/tooling: Node.js 24 in CI, pnpm 11, ESM (`"type": "module"`)
- Site: VitePress, Vue single-file components
- Content: Markdown, MathJax-compatible math, Mermaid diagrams
- Visualization: `force-graph` and `d3-force`; graph data is static JSON
- Deployment: GitHub Pages from `main` via `.github/workflows/deploy.yml`

There is no application server, database runtime, migration system, or API in this repository.

## Important paths

- `docs/index.md`: home-page frontmatter
- `docs/{database,discrete-mathematics,dsa,networking}/`: topic notes
- `docs/overview/overview.md`: knowledge-graph page
- `docs/.vitepress/config.mts`: site metadata, sidebar, search, and Markdown options
- `docs/.vitepress/theme/`: custom layout, Vue components, and global styles
- `docs/public/`: files copied verbatim to the site root, including images, PWA assets, `CNAME`, and `graph-data.json`
- `docs/.vitepress/{cache,dist}/`: generated and gitignored; do not edit

## Commands

Use the package-manager version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev              # local VitePress development server
pnpm build            # production build
pnpm preview          # preview the production build
```

Equivalent `docs:dev`, `docs:build`, and `docs:preview` scripts also exist. No automated test, lint, or format command is configured; the production build is the repository's available validation step.

## Existing conventions

- Topic filenames use a numeric section prefix plus kebab-case, for example `17_3-b-trees-and-b-plus-trees.md`.
- Content pages commonly begin with `outline: deep` frontmatter and start visible content at `##`.
- Public assets are referenced with root-relative URLs such as `/images/database/17_1-image.png`.
- Notes use Markdown tables, fenced code blocks, `$...$`/`$$...$$` math, VitePress custom blocks such as `:::info`, and `<mark>` for highlighted terms.
- Mermaid diagrams use the globally registered `<Mermaid :code="..." />` component.
- Vue components use `<script setup>`, Composition API lifecycle hooks/refs, scoped component CSS, and browser-only rendering through `<ClientOnly>` where needed.
- JavaScript in the theme generally uses single quotes and omits semicolons; preserve the style of the file being edited.
- Knowledge-graph nodes have `id`, `label`, `group`, `link`, and `desc`; links refer to node IDs through `source` and `target`.

## Database content conventions

`docs/database/` contains educational notes based on Ramez Elmasri and Shamkant B. Navathe's *Fundamentals of Database Systems* (7th edition), not executable database code. Preserve the source book's chapter/section mapping, keep the numbered filename pattern, place associated images in `docs/public/images/database/`, and add or update the matching Database sidebar entry in `docs/.vitepress/config.mts` when pages change.

## Rules for future agents

- Treat Markdown as the primary product; preserve mathematical notation, bilingual terminology, examples, and image references unless the task explicitly changes them.
- When adding, renaming, or removing a page, keep its route and the sidebar in `config.mts` synchronized.
- When changing graph topics or routes, keep `docs/public/graph-data.json` synchronized and ensure every link targets an existing page.
- Put deployable static files under `docs/public/`; never hand-edit generated `cache/` or `dist/` output.
- Preserve the forced-dark theme and existing design tokens unless a design change is requested.
- Keep `pnpm-lock.yaml` in sync with dependency changes and do not introduce another package manager's lockfile.
- Run `pnpm build` after source or content changes and report any build warnings or failures.
