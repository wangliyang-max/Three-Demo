# Materials Overview Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new materials overview page that compares multiple Three.js materials on the same geometry and expose it through the main navigation.

**Architecture:** Follow the existing page-module pattern and mirror the primitives overview page. Build a dedicated `materials` page with a shared renderer, one preview card per material, and route it through the existing hash router and home card list.

**Tech Stack:** Vite, Three.js, plain JavaScript, hash routing, plain CSS

---

### Task 1: Add the materials overview page

**Files:**
- Create: `src/pages/materials.js`

- [ ] Define a small materials catalog with labels, summary text, sample code, and material factories.
- [ ] Build a shared-renderer grid page that previews one common geometry with different materials.
- [ ] Add concise comments explaining the shared renderer pattern and how each preview is built.

### Task 2: Wire the page into routing and navigation

**Files:**
- Modify: `src/main.js`
- Modify: `src/pages/home.js`

- [ ] Register the `#/materials` route in the router table.
- [ ] Add the route to the header navigation set.
- [ ] Ensure the home page route cards include the new materials page.

### Task 3: Verify the feature

**Files:**
- Verify: `npm run build`

- [ ] Run a fresh production build.
- [ ] Confirm the new page compiles and the router still builds successfully.
