import * as THREE from 'three';
import { lightCatalog } from '../components/lights/lights-data.js';
import { createLightPreview } from '../components/lights/lights-preview.js';

export function mountLightsPage(container) {
  container.innerHTML = `
    <style>
      .lights-page { display: grid; gap: 18px; }
      .lights-page .viewer-copy p + p { margin-top: 12px; }
      .lights-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(255, 209, 138, 0.12), transparent 28%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.08), transparent 42%),
          #0d1016;
      }
      .lights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .light-card {
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
      .light-card:hover {
        transform: translateY(-3px);
        border-color: rgba(255, 209, 138, 0.38);
      }
      .light-card__preview {
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
      .light-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .light-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .light-card__label { margin: 4px 0 0; color: #ffd18a; font-size: 0.9rem; }
      .light-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .light-card__hint {
        margin: 0;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(126, 199, 255, 0.14);
        background: rgba(126, 199, 255, 0.08);
        color: #d9e6ff;
        font-size: 0.88rem;
        line-height: 1.6;
      }
      .light-card__code {
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
      .light-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .light-card__link {
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
      @media (max-width: 760px) {
        .lights-stage { padding: 16px; }
        .light-card { padding: 16px; }
        .light-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page lights-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/lights</p>
        <h2>Three.js 光照总览</h2>
        <p>这个页面专门对比不同光照类型如何影响同一组物体。为了把注意力集中在灯光本身，所有卡片都复用统一的几何体舞台，只切换光照配置。</p>
        <p>内容范围参考 three.js 官方 lights 手册，重点覆盖环境光、半球光、方向光、点光源、聚光灯和矩形区域光。</p>
      </div>
      <div class="viewer-stage lights-stage">
        <div class="lights-grid">
          ${lightCatalog
            .map(
              (definition, index) => `
                <article class="light-card">
                  <div class="light-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="light-card__title">${definition.name}</p>
                    <p class="light-card__label">${definition.label}</p>
                  </div>
                  <p class="light-card__summary">${definition.summary}</p>
                  <p class="light-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="light-card__code">${definition.code}</pre>
                  <div class="light-card__footer">
                    <a class="light-card__link" href="#/lights/${definition.id}">查看详情</a>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  const previewElements = Array.from(container.querySelectorAll('[data-preview-index]'));

  const previews = lightCatalog.map((definition, index) => {
    const preview = createLightPreview(definition);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    previewElements[index].appendChild(renderer.domElement);

    return {
      element: previewElements[index],
      preview,
      renderer,
    };
  });

  let animationFrameId = 0;
  let disposed = false;

  function resizeRenderers() {
    previews.forEach(({ element, preview, renderer }) => {
      const width = Math.max(element.clientWidth, 1);
      const height = Math.max(element.clientHeight, 1);
      preview.camera.aspect = width / height;
      preview.camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    });
  }

  function render(time) {
    if (disposed) return;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const seconds = time * 0.001;

    previews.forEach(({ element, preview, renderer }, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > windowHeight || rect.right < 0 || rect.left > windowWidth) {
        return;
      }

      preview.setRotation(seconds, index);
      preview.beforeRender?.(seconds, renderer);
      renderer.render(preview.scene, preview.camera);
    });

    animationFrameId = window.requestAnimationFrame(render);
  }

  resizeRenderers();
  window.addEventListener('resize', resizeRenderers);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeRenderers);
    previews.forEach(({ preview, renderer }) => {
      preview.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    });
    container.innerHTML = '';
  };
}
