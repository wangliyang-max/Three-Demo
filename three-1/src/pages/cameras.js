import * as THREE from 'three';
import { cameraCatalog } from '../components/cameras/cameras-data.js';
import { createCameraPreview } from '../components/cameras/cameras-preview.js';

export function mountCamerasPage(container) {
  container.innerHTML = `
    <style>
      .cameras-page { display: grid; gap: 18px; }
      .cameras-page .viewer-copy p + p { margin-top: 12px; }
      .cameras-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(255, 209, 138, 0.12), transparent 28%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.08), transparent 42%),
          #0d1016;
      }
      .cameras-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .camera-card {
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
      .camera-card:hover {
        transform: translateY(-3px);
        border-color: rgba(255, 209, 138, 0.38);
      }
      .camera-card__preview {
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
      .camera-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .camera-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .camera-card__label { margin: 4px 0 0; color: #ffd18a; font-size: 0.9rem; }
      .camera-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .camera-card__hint {
        margin: 0;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(126, 199, 255, 0.14);
        background: rgba(126, 199, 255, 0.08);
        color: #d9e6ff;
        font-size: 0.88rem;
        line-height: 1.6;
      }
      .camera-card__code {
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
      .camera-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .camera-card__link {
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
        .cameras-stage { padding: 16px; }
        .camera-card { padding: 16px; }
        .camera-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page cameras-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/cameras</p>
        <h2>Three.js 相机总览</h2>
        <p>这个页面专门对比“同一类场景，被不同相机如何解释”。这样你看到的差异主要来自投影方式、取景范围和坐标系设定，而不是来自模型本身。</p>
        <p>内容参考 three.js 官方 cameras 手册，先看透视和正交的核心区别，再看 CameraHelper 如何帮你理解取景，最后补上正交相机模拟 2D 坐标的思路。</p>
      </div>
      <div class="viewer-stage cameras-stage">
        <div class="cameras-grid">
          ${cameraCatalog
            .map(
              (definition, index) => `
                <article class="camera-card">
                  <div class="camera-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="camera-card__title">${definition.name}</p>
                    <p class="camera-card__label">${definition.label}</p>
                  </div>
                  <p class="camera-card__summary">${definition.summary}</p>
                  <p class="camera-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="camera-card__code">${definition.code}</pre>
                  <div class="camera-card__footer">
                    <a class="camera-card__link" href="#/cameras/${definition.id}">查看详情</a>
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
  const previews = cameraCatalog.map((definition, index) => {
    const preview = createCameraPreview(definition);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    previewElements[index].appendChild(renderer.domElement);
    return { element: previewElements[index], preview, renderer };
  });

  let animationFrameId = 0;
  let disposed = false;

  function resizeRenderers() {
    previews.forEach(({ element, preview, renderer }) => {
      const width = Math.max(element.clientWidth, 1);
      const height = Math.max(element.clientHeight, 1);
      preview.resize?.(width, height);
      if (!preview.resize && preview.camera.isPerspectiveCamera) {
        preview.camera.aspect = width / height;
        preview.camera.updateProjectionMatrix();
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    });
  }

  function render(time) {
    if (disposed) return;
    const seconds = time * 0.001;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

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
