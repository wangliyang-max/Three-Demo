import * as THREE from 'three';
import { clonePrimitiveParams, getPrimitiveCode, primitiveCatalog } from '../components/primitives/primitives-data.js';
import { createPrimitivePreview } from '../components/primitives/primitives-preview.js';

// 图元总览页只负责两件事：
// 1. 生成卡片 DOM
// 2. 用共享 renderer 把每张卡片对应的预览画进去。
export function mountPrimitivesPage(container) {
  container.innerHTML = `
    <style>
      .primitives-page { display: grid; gap: 18px; }
      .primitives-page .viewer-copy p + p { margin-top: 12px; }
      .primitives-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(109, 211, 206, 0.12), transparent 32%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.08), transparent 40%),
          #0d1016;
      }
      .primitives-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        position: relative;
        z-index: 1;
      }
      .primitive-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.04), transparent),
          rgba(18, 21, 30, 0.88);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
        transition: transform 180ms ease, border-color 180ms ease;
      }
      .primitive-card:hover {
        transform: translateY(-3px);
        border-color: rgba(109, 211, 206, 0.38);
      }
      .primitive-card__preview {
        position: relative;
        min-height: 188px;
        border: 1px solid rgba(109, 211, 206, 0.14);
        border-radius: 18px;
        background:
          radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.16), transparent 34%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.18), rgba(109, 211, 206, 0.04)),
          #10141d;
        overflow: hidden;
      }
      .primitive-card__preview::after {
        content: '';
        position: absolute;
        inset: auto 14px 14px 14px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
      }
      .primitive-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .primitive-card__label { margin: 4px 0 0; color: var(--accent); font-size: 0.9rem; }
      .primitive-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .primitive-card__code {
        margin: 0;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(9,11,16,0.72);
        color: #d8def0;
        font-size: 0.82rem;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .primitive-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 0.88rem;
      }
      .primitive-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(109,211,206,0.26);
        color: var(--accent);
        background: rgba(109,211,206,0.08);
      }
      .primitives-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }
      @media (max-width: 760px) {
        .primitives-stage { padding: 16px; }
        .primitive-card { padding: 16px; }
        .primitive-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page primitives-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/primitives</p>
        <h2>Three.js 图元总览</h2>
        <p>这里是图元入口页。每张卡片展示一个图元的默认外观、构造代码和简短用途说明。</p>
        <p>点击卡片右下角的“查看详情”后，会进入独立详情页，看到更大的预览、参数滑块、参数解释和典型用途。</p>
      </div>
      <div class="viewer-stage primitives-stage" data-stage>
        <div class="primitives-grid">
          ${primitiveCatalog
            .map((definition, index) => {
              const code = getPrimitiveCode(definition, clonePrimitiveParams(definition));
              return `
                <article class="primitive-card">
                  <div class="primitive-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="primitive-card__title">${definition.name}</p>
                    <p class="primitive-card__label">${definition.label}</p>
                  </div>
                  <p class="primitive-card__summary">${definition.summary}</p>
                  <pre class="primitive-card__code">${code}</pre>
                  <div class="primitive-card__footer">
                    <span>支持滑块调参和参数说明</span>
                    <a class="primitive-card__link" href="#/primitives/${definition.id}">查看详情</a>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const previewElements = Array.from(container.querySelectorAll('[data-preview-index]'));
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.className = 'primitives-overlay';
  stage.appendChild(renderer.domElement);

  // 这里先把每张卡片对应的 preview 数据准备好。
  // 注意：createPrimitivePreview 只是在内存里创建 scene / camera / mesh，
  // 真正渲染到页面是在下面的 render() 循环里完成。
  const previews = primitiveCatalog.map((definition, index) => ({
    element: previewElements[index],
    preview: createPrimitivePreview(definition, clonePrimitiveParams(definition)),
  }));

  let animationFrameId = 0;
  let disposed = false;

  function resizeRenderer() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 总览页使用一个共享 renderer，然后通过 viewport / scissor
  // 把同一个 canvas 切成很多小区域，看起来就像每张卡片都有自己的预览窗口。
  function render(time) {
    if (disposed) return;

    const viewportWidth = Math.max(stage.clientWidth, 1);
    const viewportHeight = Math.max(stage.clientHeight, 1);
    const stageRect = stage.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const seconds = time * 0.001;

    renderer.setViewport(0, 0, viewportWidth, viewportHeight);
    renderer.setScissor(0, 0, viewportWidth, viewportHeight);
    renderer.clear(true, true, true);

    previews.forEach(({ element, preview }, index) => {
      const rect = element.getBoundingClientRect();

      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > windowHeight || rect.right < 0 || rect.left > windowWidth) {
        return;
      }

      const left = Math.floor(rect.left - stageRect.left);
      const top = Math.floor(rect.top - stageRect.top);
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      const bottom = Math.floor(viewportHeight - top - height);

      preview.camera.aspect = width / height;
      preview.camera.updateProjectionMatrix();
      preview.setRotation(seconds, index);

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.render(preview.scene, preview.camera);
    });

    animationFrameId = window.requestAnimationFrame(render);
  }

  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeRenderer);
    previews.forEach(({ preview }) => preview.dispose());
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}

