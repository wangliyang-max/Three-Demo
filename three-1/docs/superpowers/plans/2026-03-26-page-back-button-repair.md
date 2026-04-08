# Page Back Button Repair Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a consistent back button to every routed scene page under `src/pages` and repair the broken page source left by the previous partial edit.

**Architecture:** Keep the existing single-entry hash router intact and update each scene page module to render its own back link inside the page copy block. Normalize the affected page files by rewriting the broken source instead of layering incremental edits on top of corrupted content.

**Tech Stack:** Vite, Three.js, hash-based routing, plain CSS

---

### Task 1: Repair Scene Page Modules

**Files:**
- Modify: `src/pages/cube.js`
- Modify: `src/pages/cubes.js`
- Modify: `src/pages/model.js`

- [ ] Rewrite the `cube` page so the module parses again and renders a back link to `#/`.
- [ ] Add the same back link pattern to the `cubes` page.
- [ ] Rewrite the `model` page so the module parses again, keeps cleanup logic intact, and exposes a visible load error if the model asset is unavailable.

### Task 2: Support Shared UI Styling

**Files:**
- Modify: `src/styles/app.css`

- [ ] Keep the shared `.page-back-link` styling.
- [ ] Add lightweight status styling for model-load failures so missing assets do not fail silently.

### Task 3: Verify the Repair

**Files:**
- Verify: `npm run build`

- [ ] Run a fresh production build.
- [ ] Confirm the previous parse errors are gone and note any remaining non-blocking asset issues.