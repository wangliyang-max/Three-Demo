# Primitives Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable Three.js primitive detail pages with live parameter sliders and per-parameter explanations.

**Architecture:** Split primitive metadata, preview rendering, gallery rendering, and detail-page rendering into focused modules. Keep the existing hash router, but extend it with a dedicated dynamic matcher for `#/primitives/:id`.

**Tech Stack:** Vite, Three.js, hash routing, plain JavaScript, plain CSS

---

### Task 1: Extract Shared Primitive Metadata

**Files:**
- Create: `src/pages/primitives-data.js`
- Create: `src/pages/primitives-preview.js`

- [ ] Define a shared primitive catalog with ids, default params, control metadata, parameter docs, fixed-input notes, and geometry builders.
- [ ] Move reusable preview framing / mesh rebuild / cleanup logic into a shared preview helper.

### Task 2: Rebuild the Primitive Gallery

**Files:**
- Modify: `src/pages/primitives.js`

- [ ] Rewrite the gallery page to render cards from the shared primitive catalog.
- [ ] Make each card clickable and route to `#/primitives/:id`.
- [ ] Keep the shared renderer approach for the grid preview.

### Task 3: Add Primitive Detail Pages

**Files:**
- Create: `src/pages/primitive-detail.js`

- [ ] Build the detail page layout with title, summary, live code preview, control panel, parameter docs, and learning notes.
- [ ] Mount a dedicated Three.js preview for the selected primitive.
- [ ] Rebuild geometry when sliders change and support reset-to-default behavior.

### Task 4: Extend Router Support

**Files:**
- Modify: `src/main.js`

- [ ] Add route resolution for `#/primitives/:id`.
- [ ] Keep the `图元` nav item active for both gallery and detail pages.
- [ ] Update document titles for primitive detail pages.

### Task 5: Verify the Feature

**Files:**
- Verify: `npm run build`

- [ ] Run a fresh production build.
- [ ] Confirm gallery and detail modules compile successfully.
- [ ] Note any non-blocking bundle size warnings separately from feature correctness.
