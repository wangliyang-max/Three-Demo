import * as THREE from 'three';
import { materialCatalog } from '../components/materials/materials-data.js';
import { createMaterialPreview } from '../components/materials/materials-preview.js';

// 材质总览页的职责和图元总览页类似：
// 1. 生成卡片 DOM
// 2. 用共享 renderer 把每张卡片的材质预览画进去
// 3. 给用户提供跳转到详情页的入口
export function mountMaterialsPage(container) {
  container.innerHTML = `
    <style>
      .materials-page { display: grid; gap: 18px; }
      .materials-page .viewer-copy p + p { margin-top: 12px; }
      .materials-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(255, 209, 138, 0.12), transparent 28%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.08), transparent 42%),
          #0d1016;
      }
      .materials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        position: relative;
        z-index: 1;
      }
      .material-card {
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
      .material-card:hover {
        transform: translateY(-3px);
        border-color: rgba(255, 209, 138, 0.38);
      }
      .material-card__preview {
        position: relative;
        min-height: 192px;
        border: 1px solid rgba(255, 209, 138, 0.14);
        border-radius: 18px;
        background:
          radial-gradient(circle at 50% 20%, rgba(255,255,255,0.16), transparent 32%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.14), rgba(255, 209, 138, 0.04)),
          #10141d;
        overflow: hidden;
      }
      .material-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .material-card__label { margin: 4px 0 0; color: #ffd18a; font-size: 0.9rem; }
      .material-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .material-card__code {
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
      .material-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .material-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 209, 138, 0.24);
        color: #ffd18a;
        background: rgba(255, 209, 138, 0.08);
        white-space: nowrap;
      }
      .materials-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }
      @media (max-width: 760px) {
        .materials-stage { padding: 16px; }
        .material-card { padding: 16px; }
        .material-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page materials-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/materials</p>
        <h2>Three.js 材质总览</h2>
        <p>这个页面专门做“同一几何体，不同材质”的横向对比。这样你看到的差异，主要就来自材质本身，而不是模型形状不同造成的干扰。</p>
        <p>每张卡片都使用相同的球体和同一套灯光，只切换材质类型。重点观察它们是否受光、是否有高光，以及明暗过渡的风格差异。</p>
      </div>
      <div class="viewer-stage materials-stage" data-stage>
        <div class="materials-grid">
          ${materialCatalog
            .map(
              (definition, index) => `
                <article class="material-card">
                  <div class="material-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="material-card__title">${definition.name}</p>
                    <p class="material-card__label">${definition.label}</p>
                  </div>
                  <p class="material-card__summary">${definition.summary}</p>
                  <pre class="material-card__code">${definition.code}</pre>
                  <div class="material-card__footer">
                    <a class="material-card__link" href="#/materials/${definition.id}">查看详情</a>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  // stage 是共享 canvas 的承载层，所有卡片预览最终都绘制到它上面。
  const stage = container.querySelector('[data-stage]');

  // 收集每张卡片的小预览容器，后面会用它们的真实位置来设置 viewport/scissor。
  const previewElements = Array.from(container.querySelectorAll('[data-preview-index]'));

  // 这里延续图元页的共享 renderer 策略：
  // 一张大 canvas + 多个局部 viewport，而不是每张卡片各建一个 renderer。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.className = 'materials-overlay';
  stage.appendChild(renderer.domElement);

  // 提前把每张卡片对应的 preview 单元准备好。
  // 注意：这里只是创建 scene / camera / material，真正绘制发生在 render() 循环里。
  const previews = materialCatalog.map((definition, index) => ({
    element: previewElements[index],
    preview: createMaterialPreview(definition),
  }));

  let animationFrameId = 0;
  let disposed = false;

  // 共享 canvas 的实际尺寸必须始终和 stage 一致，
  // 否则后面的 viewport 计算会和 DOM 区域对不上。
  function resizeRenderer() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 多视口渲染主循环。
  // 和图元页一样，核心思想是：
  // 1. 先清整张共享 canvas
  // 2. 再把每个材质预览渲染到各自对应的小矩形区域里
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

      // 不在视口内的卡片直接跳过，避免做无意义渲染。
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > windowHeight || rect.right < 0 || rect.left > windowWidth) {
        return;
      }

      // 把卡片的页面坐标换算成相对于 stage 的局部坐标。
      const left = Math.floor(rect.left - stageRect.left);
      const top = Math.floor(rect.top - stageRect.top);
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);

      // DOM 是左上角原点，WebGL viewport 是左下角原点，所以这里要换算 bottom。
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

  // 路由切走时，需要统一停止动画、移除监听，并释放每个 preview 的 WebGL 资源。
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
