import * as THREE from 'three';
import { getCameraById } from '../components/cameras/cameras-data.js';

// 详情页会创建更大的独立 WebGL 场景，离开路由时必须释放材质资源。
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

// 透视和正交详情页共用的比较舞台。
// 同一组物体沿深度方向排开，用来突出“相机投影规则”本身的差异。
function createComparisonScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1016);
  const cleanup = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 20),
    new THREE.MeshStandardMaterial({ color: 0x121725, roughness: 0.94, metalness: 0.03 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  scene.add(floor);

  const grid = new THREE.GridHelper(26, 20, 0x3c536e, 0x1d2735);
  grid.position.y = -0.34;
  scene.add(grid);

  const group = new THREE.Group();
  scene.add(group);

  const zPositions = [0, -5, -10];
  const colors = [0xffd18a, 0x7ec7ff, 0x9cf0b6];
  const rings = [];

  zPositions.forEach((z, index) => {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.4, 0.45, 32),
      new THREE.MeshStandardMaterial({ color: 0x1f2838, roughness: 0.84, metalness: 0.08 }),
    );
    base.position.set((index - 1) * 2.6, -0.1, z);
    group.add(base);

    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 3.4, 1.4),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.34, metalness: 0.12 }),
    );
    pillar.position.set((index - 1) * 2.6, 1.45, z);
    group.add(pillar);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.16, 18, 60),
      new THREE.MeshStandardMaterial({ color: 0xf7f8ff, roughness: 0.18, metalness: 0.78 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set((index - 1) * 2.6, 3.32, z);
    group.add(ring);
    rings.push(ring);

    cleanup.push(
      () => base.geometry.dispose(),
      () => disposeMaterial(base.material),
      () => pillar.geometry.dispose(),
      () => disposeMaterial(pillar.material),
      () => ring.geometry.dispose(),
      () => disposeMaterial(ring.material),
    );
  });

  const hemi = new THREE.HemisphereLight(0xb9d8ff, 0x1a2230, 1.0);
  const dir = new THREE.DirectionalLight(0xffffff, 1.95);
  dir.position.set(6, 9, 6);
  scene.add(hemi, dir);

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
  );

  return { scene, cleanup, rings };
}

// PerspectiveCamera 详情示例：模拟真实镜头，远处物体会看起来更小。
function buildPerspectiveDemo(stage) {
  const { scene, cleanup, rings } = createComparisonScene();
  // fov 控制垂直视角，aspect 会在 resize 中按舞台宽高比更新。
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  stage.appendChild(renderer.domElement);

  // 舞台尺寸变化时同步 renderer 尺寸和相机投影矩阵。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 每帧让相机轻微绕场移动，便于观察透视投影的近大远小。
  // 同一个 scene 渲染两次：先用 viewCamera 渲染左侧，再用 observerCamera 渲染右侧。
  function render(seconds) {
    const angle = seconds * 0.22;
    camera.position.x = Math.cos(angle) * 9.6;
    camera.position.z = Math.sin(angle) * 2.6 + 9.4;
    camera.position.y = 4.1 + Math.sin(seconds * 0.35) * 0.22;
    camera.lookAt(0, 1.6, -5.2);
    rings.forEach((ring, index) => {
      ring.rotation.z = seconds * 0.8 + index * 0.35;
    });
    renderer.render(scene, camera);
  }

  function dispose() {
    cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { resize, render, dispose };
}

// OrthographicCamera 详情示例：不产生近大远小，适合工程视图、地图和 2D 风格画面。
function buildOrthographicDemo(stage) {
  const { scene, cleanup, rings } = createComparisonScene();
  const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  stage.appendChild(renderer.domElement);

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    const aspect = width / height;
    const frustumHeight = 10;
    camera.left = -frustumHeight * aspect * 0.5;
    camera.right = frustumHeight * aspect * 0.5;
    camera.top = frustumHeight * 0.5;
    camera.bottom = -frustumHeight * 0.5;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function render(seconds) {
    const angle = seconds * 0.22;
    camera.position.x = Math.cos(angle) * 9.6;
    camera.position.z = Math.sin(angle) * 2.6 + 9.4;
    camera.position.y = 4.1 + Math.sin(seconds * 0.35) * 0.22;
    camera.lookAt(0, 1.6, -5.2);
    rings.forEach((ring, index) => {
      ring.rotation.z = seconds * 0.8 + index * 0.35;
    });
    renderer.render(scene, camera);
  }

  function dispose() {
    cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { resize, render, dispose };
}

// CameraHelper 详情示例：左侧渲染 viewCamera 看到的画面，右侧从外部观察这台相机。
function buildCameraHelperDemo(stage) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1016);
  const cleanup = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: 0x101621, roughness: 0.95, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  scene.add(floor);

  const grid = new THREE.GridHelper(24, 24, 0x3d5670, 0x1a2230);
  grid.position.y = -0.49;
  scene.add(grid);

  const target = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 3.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0xffd18a, roughness: 0.42, metalness: 0.08 }),
  );
  target.position.set(0, 1.1, -2.2);
  scene.add(target);

  const satellite = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.7, 0.2, 140, 20),
    new THREE.MeshStandardMaterial({ color: 0x7ec7ff, roughness: 0.18, metalness: 0.74 }),
  );
  satellite.position.set(-4.2, 2.2, -6.8);
  scene.add(satellite);

  const hemi = new THREE.HemisphereLight(0xb8d7ff, 0x20283a, 1.0);
  const dir = new THREE.DirectionalLight(0xffffff, 1.7);
  dir.position.set(6, 8, 5);
  scene.add(hemi, dir);

  // viewCamera 是“被观察的相机”，它决定左半屏最终画面。
  const viewCamera = new THREE.PerspectiveCamera(60, 1, 1, 22);
  const observerCamera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  observerCamera.position.set(10.5, 6.4, 10.5);
  observerCamera.lookAt(0, 1, -2.5);

  // helper 把 viewCamera 的视锥、near/far 裁剪面显示成线框，方便理解相机范围。
  const helper = new THREE.CameraHelper(viewCamera);
  scene.add(helper);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  // 开启 scissor 后，可以把一个 canvas 分成左右两个视口分别渲染。
  renderer.setScissorTest(true);
  stage.appendChild(renderer.domElement);

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => target.geometry.dispose(),
    () => disposeMaterial(target.material),
    () => satellite.geometry.dispose(),
    () => disposeMaterial(satellite.material),
    () => helper.dispose?.(),
  );

  function updateViewCamera(seconds) {
    const radius = 7.2;
    viewCamera.position.x = Math.cos(seconds * 0.45) * radius;
    viewCamera.position.z = Math.sin(seconds * 0.45) * radius + 0.6;
    viewCamera.position.y = 3.2 + Math.sin(seconds * 0.6) * 0.4;
    viewCamera.lookAt(target.position);
    helper.update();
  }

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    observerCamera.aspect = width / height;
    observerCamera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function render(seconds) {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    const split = Math.floor(width * 0.5);
    satellite.rotation.x = seconds * 0.4;
    satellite.rotation.y = seconds * 0.62;
    target.rotation.y = seconds * 0.34;
    updateViewCamera(seconds);

    viewCamera.aspect = Math.max(split, 1) / height;
    viewCamera.updateProjectionMatrix();

    // 左侧是 viewCamera 的最终画面，隐藏 helper，避免用户看到调试线框。
    helper.visible = false;
    renderer.setViewport(0, 0, split, height);
    renderer.setScissor(0, 0, split, height);
    renderer.clear(true, true, true);
    renderer.render(scene, viewCamera);

    // 右侧是外部观察视角，打开 helper 来看 viewCamera 的空间位置和视锥。
    helper.visible = true;
    observerCamera.aspect = Math.max(width - split, 1) / height;
    observerCamera.updateProjectionMatrix();
    renderer.setViewport(split, 0, width - split, height);
    renderer.setScissor(split, 0, width - split, height);
    renderer.render(scene, observerCamera);
  }

  function dispose() {
    cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { resize, render, dispose };
}

// 正交 2D 详情示例：用 OrthographicCamera 把 three.js 当作 2D 画布来布局。
function buildOrthographic2DDemo(stage) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1421);
  const cleanup = [];
  // 初始化时先给一个占位边界，真正的 left/right/top/bottom 会在 layout/resize 中同步到容器尺寸。
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  stage.appendChild(renderer.domElement);

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x111827 }),
  );
  scene.add(background);

  const topBar = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 64),
    new THREE.MeshBasicMaterial({ color: 0x182235 }),
  );
  scene.add(topBar);

  const leftCard = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 110),
    new THREE.MeshBasicMaterial({ color: 0x7ec7ff }),
  );
  scene.add(leftCard);

  const centerBadge = new THREE.Mesh(
    new THREE.CircleGeometry(42, 48),
    new THREE.MeshBasicMaterial({ color: 0xffd18a }),
  );
  scene.add(centerBadge);

  const rightPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 210),
    new THREE.MeshBasicMaterial({ color: 0x9cf0b6 }),
  );
  scene.add(rightPanel);

  const footer = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 42),
    new THREE.MeshBasicMaterial({ color: 0x2b3648 }),
  );
  scene.add(footer);

  cleanup.push(
    () => background.geometry.dispose(),
    () => disposeMaterial(background.material),
    () => topBar.geometry.dispose(),
    () => disposeMaterial(topBar.material),
    () => leftCard.geometry.dispose(),
    () => disposeMaterial(leftCard.material),
    () => centerBadge.geometry.dispose(),
    () => disposeMaterial(centerBadge.material),
    () => rightPanel.geometry.dispose(),
    () => disposeMaterial(rightPanel.material),
    () => footer.geometry.dispose(),
    () => disposeMaterial(footer.material),
  );

  stage.insertAdjacentHTML(
    'beforeend',
    `
      <div class="camera-2d-overlay">
        <span class="camera-2d-label" style="left: 28px; top: 24px;">(0,0)</span>
        <span class="camera-2d-label" style="left: 28px; top: 108px;">左上卡片</span>
        <span class="camera-2d-label" style="right: 28px; top: 108px;">右侧面板</span>
        <span class="camera-2d-label camera-2d-label--center">中心</span>
        <span class="camera-2d-label" style="left: 50%; bottom: 24px; transform: translateX(-50%);">底部条带</span>
      </div>
    `,
  );

  // 把正交相机边界设置成 0..width / 0..height，物体坐标就能按像素式坐标理解。
  function layout(width, height) {
    background.scale.set(width, height, 1);
    background.position.set(width * 0.5, height * 0.5, -2);

    topBar.scale.set(width, 1, 1);
    topBar.position.set(width * 0.5, 32, -1);

    leftCard.position.set(130, 144, 0);
    centerBadge.position.set(width * 0.5, height * 0.5, 0);
    rightPanel.position.set(width - 130, 168, 0);

    footer.scale.set(width, 1, 1);
    footer.position.set(width * 0.5, height - 21, -1);
  }

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    layout(width, height);
  }

  function render(seconds) {
    leftCard.rotation.z = Math.sin(seconds * 0.8) * 0.025;
    centerBadge.scale.setScalar(1 + Math.sin(seconds * 2) * 0.06);
    rightPanel.position.y = 168 + Math.sin(seconds * 1.4) * 8;
    renderer.render(scene, camera);
  }

  function dispose() {
    cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
    stage.querySelector('.camera-2d-overlay')?.remove();
  }

  return { resize, render, dispose };
}

const demoBuilders = {
  perspective: buildPerspectiveDemo,
  orthographic: buildOrthographicDemo,
  'camera-helper': buildCameraHelperDemo,
  'orthographic-2d': buildOrthographic2DDemo,
};

// 相机详情页负责选择具体 demo，并管理动画循环、resize 监听和销毁流程。
export function mountCameraDetailPage(container, { cameraId }) {
  const definition = getCameraById(cameraId);

  if (!definition) {
    container.innerHTML = `
      <section class="page viewer-page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/cameras">返回相机总览</a>
          <p class="eyebrow">Route: #/cameras/${cameraId}</p>
          <h2>未找到这个相机示例</h2>
          <p>当前路由没有匹配到对应的相机详情，请返回总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .camera-detail-page { display: grid; gap: 18px; }
      .camera-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.92fr);
        gap: 18px;
      }
      .camera-detail-stage,
      .camera-detail-panel,
      .camera-detail-docs,
      .camera-detail-notes {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
      }
      .camera-detail-stage {
        position: relative;
        min-height: 520px;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(255, 209, 138, 0.18), transparent 34%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.1), transparent 42%),
          #0e1016;
      }
      .camera-detail-stage canvas { display: block; width: 100%; height: 100%; }
      .camera-detail-panel,
      .camera-detail-docs,
      .camera-detail-notes { padding: 22px; }
      .camera-detail-panel { display: grid; gap: 16px; align-content: start; }
      .camera-detail-code {
        margin: 0;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(9, 11, 16, 0.74);
        color: #d8def0;
        line-height: 1.65;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .camera-detail-tip {
        margin: 0;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(126, 199, 255, 0.14);
        background: rgba(126, 199, 255, 0.08);
        color: #d9e6ff;
        line-height: 1.7;
      }
      .camera-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .camera-detail-doc {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .camera-detail-doc h3 { margin: 0 0 8px; font-size: 1rem; }
      .camera-detail-doc p { margin: 0; color: var(--muted); line-height: 1.65; }
      .camera-2d-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        font-size: 0.82rem;
        color: #f5f7ff;
      }
      .camera-2d-label {
        position: absolute;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(8, 11, 18, 0.58);
        backdrop-filter: blur(8px);
      }
      .camera-2d-label--center {
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      @media (max-width: 920px) {
        .camera-detail-layout { grid-template-columns: 1fr; }
        .camera-detail-stage { min-height: 420px; }
      }
    </style>

    <section class="page camera-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/cameras">返回相机总览</a>
        <p class="eyebrow">Route: #/cameras/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="camera-detail-layout">
        <div class="camera-detail-stage" data-stage></div>
        <aside class="camera-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="camera-detail-code">${definition.code}</pre>
          </div>
          <div>
            <p class="eyebrow">学习重点</p>
            <p>${definition.learningFocus}</p>
          </div>
          <div>
            <p class="eyebrow">观察提示</p>
            <p class="camera-detail-tip">${definition.observationHint}</p>
          </div>
        </aside>
      </div>

      <div class="camera-detail-docs">
        <p class="eyebrow">关键参数</p>
        <div class="camera-detail-docs-grid">
          ${definition.parameterNotes
            .map(
              (note) => `
                <article class="camera-detail-doc">
                  <h3>${note.name}</h3>
                  <p>${note.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="camera-detail-notes">
        <p class="eyebrow">理解方式</p>
        <p>这一页只放大讲一个相机主题，目的是把“相机如何解释场景”这件事单独拎出来。你可以把它和材质、纹理、光照页对照着看：这次没换物体类型，变的是观察规则本身。</p>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const buildDemo = demoBuilders[definition.id];
  const demo = buildDemo(stage);

  let animationFrameId = 0;
  let disposed = false;

  function resize() {
    demo.resize();
  }

  // requestAnimationFrame 传入毫秒，这里转成秒后交给具体 demo。
  function render(time) {
    if (disposed) return;
    demo.render(time * 0.001);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
    demo.dispose();
    container.innerHTML = '';
  };
}
