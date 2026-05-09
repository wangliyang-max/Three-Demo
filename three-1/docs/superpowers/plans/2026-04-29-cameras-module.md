# Cameras Module Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `#/cameras` module with an overview page plus four camera detail demos covering perspective, orthographic, dual-view `CameraHelper`, and orthographic 2D coordinate layout.

**Architecture:** Follow the existing route-module pattern already used by `materials`, `lights`, and `textures`. Keep camera metadata in a shared catalog, use a lightweight preview builder for the overview cards, and centralize the large demo mounting logic in a single detail page that switches by `cameraId`.

**Tech Stack:** Vite, Three.js, plain JavaScript, hash routing, plain CSS

---

### Task 1: Add shared camera catalog data

**Files:**
- Create: `src/components/cameras/cameras-data.js`

- [ ] Define `cameraCatalog` entries for `perspective`, `orthographic`, `camera-helper`, and `orthographic-2d`.
- [ ] Include for each entry: `id`, `name`, `label`, `summary`, `code`, `parameterNotes`, and `observationHint`.
- [ ] Export `getCameraById(cameraId)` so the detail route can resolve a record from the URL.
- [ ] Keep wording explicit that “2D camera” here means an orthographic camera used for 2D-style layout.

### Task 2: Build overview preview helpers

**Files:**
- Create: `src/components/cameras/cameras-preview.js`

- [ ] Create a preview factory that returns `{ scene, camera, setRotation, dispose }` for lightweight overview-card rendering.
- [ ] Use the same base object arrangement for `perspective` and `orthographic` so their camera differences are easy to compare.
- [ ] Keep `camera-helper` and `orthographic-2d` previews intentionally lightweight so the overview page does not become a heavy multi-viewport scene.
- [ ] Add short comments only where the preview setup is not obvious from the code.

### Task 3: Add the cameras overview page

**Files:**
- Create: `src/pages/cameras.js`
- Read: `src/pages/materials.js`

- [ ] Mirror the existing overview-page layout pattern used by `materials` and `lights`.
- [ ] Render one card per `cameraCatalog` entry with title, label, summary, code block, and detail-link button.
- [ ] Mount lightweight previews into the cards, reusing either a shared renderer or one renderer per card based on the simplest maintainable fit for these demos.
- [ ] Add page copy that explains this module is about comparing camera behavior rather than object or material changes.

### Task 4: Add the camera detail page shell

**Files:**
- Create: `src/pages/camera-detail.js`

- [ ] Build the same fallback behavior used by existing detail pages when `cameraId` does not match a known entry.
- [ ] Render a reusable detail-page frame with back link, route eyebrow, title, summary, stage area, code panel, parameter-notes area, and observation-hint section.
- [ ] Route all per-demo scene setup through one internal dispatch map keyed by `cameraId`.
- [ ] Ensure the page unmount path consistently stops animation, removes listeners, and disposes WebGL resources.

### Task 5: Implement the perspective and orthographic detail demos

**Files:**
- Modify: `src/pages/camera-detail.js`

- [ ] Add a shared scene-builder for the comparison objects and lights used by both demos.
- [ ] Implement the `perspective` demo with `THREE.PerspectiveCamera` and a layout that clearly shows distance-based size change.
- [ ] Implement the `orthographic` demo with `THREE.OrthographicCamera` using the same or equivalent object layout.
- [ ] Add resize handling so both demos keep the right aspect or orthographic bounds when the viewport changes.

### Task 6: Implement the dual-view `CameraHelper` demo

**Files:**
- Modify: `src/pages/camera-detail.js`

- [ ] Add a detail demo that renders two views in one page: one “through the working camera” and one “from the observer camera.”
- [ ] Attach `THREE.CameraHelper` to the working camera and render it only in the observer view.
- [ ] Keep viewport and scissor calculations local to this demo so the complexity does not leak into the simpler detail demos.
- [ ] Verify the helper updates correctly if the working camera projection or size changes during resize.

### Task 7: Implement the orthographic 2D coordinate demo

**Files:**
- Modify: `src/pages/camera-detail.js`

- [ ] Add a demo that uses `THREE.OrthographicCamera` to place flat 2D-style elements in a coordinate space tied to the viewport.
- [ ] Show a few labeled positions such as corner, center, and edge alignment so the coordinate mapping is easy to read.
- [ ] Recompute orthographic bounds on resize so the 2D layout remains stable and understandable.
- [ ] Keep the example focused on coordinate interpretation rather than becoming a general 2D UI system.

### Task 8: Wire the new module into routing and navigation

**Files:**
- Modify: `src/main.js`
- Read: `src/pages/home.js`

- [ ] Import `mountCamerasPage`, `mountCameraDetailPage`, `getCameraById`, and register the static `#/cameras` route.
- [ ] Extend dynamic route resolution to support `#/cameras/:id`.
- [ ] Add `cameras` to the top navigation filter so the module appears beside the existing overview sections.
- [ ] Confirm the home page route-card list includes the new route automatically through the existing route array behavior.

### Task 9: Verify the module end to end

**Files:**
- Verify: `package.json`

- [ ] Run `npm run build`.
- [ ] Open and manually inspect `#/cameras`.
- [ ] Open and manually inspect `#/cameras/perspective`.
- [ ] Open and manually inspect `#/cameras/orthographic`.
- [ ] Open and manually inspect `#/cameras/camera-helper`.
- [ ] Open and manually inspect `#/cameras/orthographic-2d`.
- [ ] Confirm route transitions clean up correctly and do not leave broken canvases behind.
