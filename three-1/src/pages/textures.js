import * as THREE from 'three';
import { textureCatalog } from '../components/textures/textures-data.js';
import { createTexturePreview } from '../components/textures/textures-preview.js';

export function mountTexturesPage(container) {
  container.innerHTML = `
    <style>
      .textures-page { display: grid; gap: 18px; }
      .textures-page .viewer-copy p + p { margin-top: 12px; }
      .textures-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(255, 209, 138, 0.12), transparent 28%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.08), transparent 42%),
          #0d1016;
      }
      .textures-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        position: relative;
        z-index: 1;
      }
      .texture-card {
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
      .texture-card:hover {
        transform: translateY(-3px);
        border-color: rgba(255, 209, 138, 0.38);
      }
      .texture-card__preview {
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
      .texture-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .texture-card__label { margin: 4px 0 0; color: #ffd18a; font-size: 0.9rem; }
      .texture-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .texture-card__code {
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
      .texture-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .texture-card__link {
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
      .textures-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }
      @media (max-width: 760px) {
        .textures-stage { padding: 16px; }
        .texture-card { padding: 16px; }
        .texture-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page textures-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/textures</p>
        <h2>Three.js 纹理总览</h2>
        <p>这个页面专门对比纹理的不同来源。你会看到“图片、画布、视频、立方体、数据、压缩、深度”这些入口最终都能参与材质显示，但它们的创建方式和适用场景并不一样。</p>
        <p>每张卡片都会保持同一套观察舞台，只切换纹理来源或展示方式，这样你更容易聚焦纹理本身的作用，而不是被其他场景差异干扰。</p>
      </div>
      <div class="viewer-stage textures-stage" data-stage>
        <div class="textures-grid">
          ${textureCatalog
            .map(
              (definition, index) => `
                <article class="texture-card">
                  <div class="texture-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="texture-card__title">${definition.name}</p>
                    <p class="texture-card__label">${definition.label}</p>
                  </div>
                  <p class="texture-card__summary">${definition.summary}</p>
                  <pre class="texture-card__code">${definition.code}</pre>
                  <div class="texture-card__footer">
                    <a class="texture-card__link" href="#/textures/${definition.id}">查看详情</a>
                  </div>
                </article>
              `,
            )
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
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.className = 'textures-overlay';
  stage.appendChild(renderer.domElement);

  const previews = textureCatalog.map((definition, index) => ({
    element: previewElements[index],
    preview: createTexturePreview(definition),
  }));

  let animationFrameId = 0;
  let disposed = false;

  function resizeRenderer() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

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
      preview.beforeRender?.(seconds, renderer);

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
