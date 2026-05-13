import * as THREE from 'three';

export function mountHtmlBackgroundPage(container) {
  container.innerHTML = `
    <style>
      .html-background-page {
        max-width: none;
        min-height: calc(100vh - 142px);
        /* 作为 canvas 和 HTML 内容共同的定位上下文。 */
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        background:
          linear-gradient(135deg, rgba(14, 18, 28, 0.9), rgba(22, 25, 34, 0.72)),
          radial-gradient(circle at 18% 18%, rgba(109, 211, 206, 0.18), transparent 28%),
        #10131b;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      }
      .html-background-page__canvas {
        /* canvas 铺满整个页面容器，充当 Three.js 背景层。 */
        position: absolute;
        inset: 0;
        z-index: 0;
        /* 背景层不接管鼠标事件，前景链接和按钮才能正常点击。 */
        pointer-events: none;
      }
      .html-background-page__content {
        /* 前景 HTML 内容层，用 z-index 压在 canvas 上方。 */
        position: relative;
        z-index: 1;
        min-height: calc(100vh - 142px);
        display: grid;
        align-content: center;
        gap: 24px;
        padding: clamp(24px, 7vw, 86px);
      }
      .html-background-page__panel {
        width: min(680px, 100%);
        padding: clamp(22px, 4vw, 38px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        /* 半透明面板让背景动画可见，同时保证正文可读。 */
        background: rgba(11, 14, 22, 0.68);
        backdrop-filter: blur(18px);
      }
      .html-background-page__panel h2 {
        margin: 8px 0 14px;
        font-size: clamp(2rem, 1.55rem + 2vw, 4.6rem);
        line-height: 1.04;
      }
      .html-background-page__panel p {
        margin: 0;
        max-width: 58ch;
        color: var(--muted);
        line-height: 1.75;
      }
      .html-background-page__panel p + p {
        margin-top: 12px;
      }
      .html-background-page__notes {
        display: grid;
        /* 自动换列，保证说明卡片在桌面和移动端都不会挤压文字。 */
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 14px;
        width: min(820px, 100%);
      }
      .html-background-page__note {
        padding: 16px;
        border: 1px solid rgba(109, 211, 206, 0.16);
        border-radius: 18px;
        background: rgba(15, 18, 26, 0.6);
        backdrop-filter: blur(12px);
      }
      .html-background-page__note strong {
        display: block;
        margin-bottom: 8px;
        color: #9cf0b6;
      }
      .html-background-page__note span {
        color: var(--muted);
        line-height: 1.6;
      }
      @media (max-width: 760px) {
        .html-background-page,
        .html-background-page__content {
          min-height: calc(100vh - 188px);
        }
        .html-background-page__panel {
          border-radius: 20px;
        }
      }
    </style>

    <section class="page html-background-page" data-stage>
      <div class="html-background-page__content">
        <div class="html-background-page__panel">
          <a class="page-back-link" href="#/">返回首页</a>
          <p class="eyebrow">Route: #/html-background</p>
          <h2>把 Three.js 画布放到 HTML 背后</h2>
          <p>这个示例对应 three.js manual 里的 HTML background 技巧：WebGLRenderer 开启透明背景，canvas 绝对定位在页面底层，普通 HTML 继续负责排版、文字和交互。</p>
          <p>背景里的环形和小球来自 Three.js；前景标题、说明、卡片和返回链接都是普通 DOM。</p>
        </div>
        <div class="html-background-page__notes">
          <div class="html-background-page__note">
            <strong>alpha: true</strong>
            <span>让 renderer 的 canvas 透明，页面背景可以透出来。</span>
          </div>
          <div class="html-background-page__note">
            <strong>z-index 分层</strong>
            <span>canvas 放在底层，HTML 内容放在上层。</span>
          </div>
          <div class="html-background-page__note">
            <strong>pointer-events: none</strong>
            <span>背景 canvas 不拦截链接、按钮和文本选择。</span>
          </div>
        </div>
      </div>
    </section>
  `;

  // stage 是整个示例页容器，Three.js canvas 会作为背景层插到它里面。
  const stage = container.querySelector('[data-stage]');

  // 普通 Three.js 场景，相机只负责观察背景动画，不参与 HTML 排版。
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  // alpha: true + clear alpha 0 是这个示例的关键：
  // renderer 只画 Three.js 物体，没画到的区域保持透明，让 CSS 背景透出来。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'html-background-page__canvas';

  // prepend 让 canvas 位于内容 DOM 前面，再配合 z-index 把它压到视觉底层。
  stage.prepend(renderer.domElement);

  // group 方便统一给背景物体做轻微整体摆动。
  const group = new THREE.Group();
  scene.add(group);

  // 环形结用作主要视觉锚点，放在右侧，避免遮住前景文案。
  const ringGeometry = new THREE.TorusKnotGeometry(1.45, 0.16, 180, 18);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x6dd3ce,
    roughness: 0.36,
    metalness: 0.62,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(2.1, 0.2, 0);
  group.add(ring);

  // 多个小球复用同一套 geometry/material，减少重复 GPU 资源。
  const orbGeometry = new THREE.SphereGeometry(0.18, 24, 16);
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0x9cf0b6,
    emissive: 0x123a2f,
    roughness: 0.28,
    metalness: 0.18,
  });
  const orbs = Array.from({ length: 34 }, (_, index) => {
    const angle = index * 0.73;
    const radius = 2.4 + (index % 5) * 0.36;
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(Math.cos(angle) * radius, Math.sin(angle * 0.8) * 1.25, Math.sin(angle) * 1.6);
    group.add(orb);
    return { mesh: orb, angle, radius };
  });

  // 使用基础环境光 + 方向光 + 点光，让背景物体有明暗和高光层次。
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
  keyLight.position.set(-3, 4, 6);
  scene.add(keyLight);

  const accentLight = new THREE.PointLight(0x9cf0b6, 1.8, 12);
  accentLight.position.set(3, -2, 3);
  scene.add(accentLight);

  let animationFrameId = 0;
  let disposed = false;

  // canvas 尺寸始终跟随页面容器，相机宽高比也同步更新，避免背景被拉伸。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  // 背景持续轻微运动，前景 HTML 仍然是正常可读、可点击的 DOM。
  function render(time) {
    if (disposed) return;

    const seconds = time * 0.001;
    ring.rotation.x = seconds * 0.18;
    ring.rotation.y = seconds * 0.34;
    group.rotation.z = Math.sin(seconds * 0.18) * 0.08;

    orbs.forEach(({ mesh, angle, radius }, index) => {
      const orbit = angle + seconds * (0.18 + index * 0.002);
      mesh.position.x = Math.cos(orbit) * radius;
      mesh.position.z = Math.sin(orbit) * 1.6;
      mesh.position.y = Math.sin(orbit * 0.8 + index) * 1.25;
    });

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    // 离开路由时释放 Three.js 持有的 GPU 资源，避免反复切页后泄漏。
    ringGeometry.dispose();
    ringMaterial.dispose();
    orbGeometry.dispose();
    orbMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}
