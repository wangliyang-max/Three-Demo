# Materials Detail Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the materials overview into a full materials flow by adding shared materials data, detail-page routing, and per-material detail pages.

**Architecture:** Split materials definitions and preview creation into shared helpers so the overview page and detail page can reuse the same catalog and rendering logic. Extend the hash router with `#/materials/:id`, add detail links from the overview cards, and keep the UX consistent with the existing primitives overview/detail pair.

**Tech Stack:** Vite, Three.js, plain JavaScript, hash routing, plain CSS

---

### Task 1: Extract shared materials catalog and preview helpers

**Files:**
- Create: `src/components/materials/materials-data.js`
- Create: `src/components/materials/materials-preview.js`
- Modify: `src/pages/materials.js`

- [ ] Move material definitions into a shared catalog module.
- [ ] Move preview scene/material construction into a reusable preview helper.
- [ ] Update the overview page to consume the shared modules and add per-card detail links.

### Task 2: Add the materials detail page

**Files:**
- Create: `src/pages/material-detail.js`

- [ ] Build a dedicated detail page with large preview, code block, key parameter notes, and usage tags.
- [ ] Reuse the shared preview helper so the overview and detail page stay visually consistent.
- [ ] Add a graceful fallback UI when the route id does not exist.

### Task 3: Extend router support

**Files:**
- Modify: `src/main.js`

- [ ] Add route resolution for `#/materials/:id`.
- [ ] Keep the `材质` nav item active for both the overview and detail pages.
- [ ] Update document titles for material detail routes.

### Task 4: Verify the feature

**Files:**
- Verify: `npm run build`

- [ ] Run a fresh production build.
- [ ] Confirm the overview page, detail page, and router all compile successfully.
