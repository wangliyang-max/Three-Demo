# Solar System Scenegraph Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new solar-system tutorial page that demonstrates scene-graph parent-child motion, and expose it through the existing navigation.

**Architecture:** Follow the existing `mountXxxPage` pattern. Create a dedicated `solar-system` page module that owns its Three.js scene, animation loop, resize handling, and cleanup. Wire it into the hash router and surface it through the header nav and home route cards.

**Tech Stack:** Vite, Three.js, plain JavaScript, hash routing, plain CSS

---

### Task 1: Add the solar-system page module

**Files:**
- Create: `src/pages/solar-system.js`

- [x] Build a new page with explanatory copy and a dedicated stage container.
- [x] Create a scene-graph hierarchy for the sun, earth orbit, earth, moon orbit, and moon.
- [x] Add concise comments that explain why the hierarchy is structured this way and how orbit/self-rotation are animated.
- [x] Implement resize handling, animation, and disposal following the existing page pattern.

### Task 2: Wire the page into routing and navigation

**Files:**
- Modify: `src/main.js`
- Modify: `src/pages/home.js`

- [x] Register the `#/solar-system` route in the router table.
- [x] Add the route to the top navigation set.
- [x] Ensure the home page route card list includes the new page.

### Task 3: Add styling for the new page layout

**Files:**
- Modify: `src/styles/app.css`

- [x] Add layout and card styles for the new info panel, legend, and scene stage.
- [x] Keep the new UI visually aligned with the existing site styles.

### Task 4: Verify the feature

**Files:**
- Verify: `npm run build`

- [x] Run a fresh production build.
- [x] Confirm the new module compiles and the router bundle still builds successfully.
