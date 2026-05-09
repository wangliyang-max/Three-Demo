import * as THREE from 'three';
import { createTexturePreview } from '../components/textures/textures-preview.js';
import { getTextureById } from '../components/textures/textures-data.js';

export function mountTextureDetailPage(container, { textureId }) {
  const definition = getTextureById(textureId);

  if (!definition) {
    container.innerHTML = `
      <section class="page viewer-page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/textures">返回纹理总览</a>
          <p class="eyebrow">Route: #/textures/${textureId}</p>
          <h2>未找到这个纹理类型</h2>
          <p>当前路由没有匹配到对应的纹理详情，请返回总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .texture-detail-page { display: grid; gap: 18px; }
      .texture-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.92fr);
        gap: 18px;
      }
      .texture-detail-stage,
      .texture-detail-panel,
      .texture-detail-docs,
      .texture-detail-notes {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
      }
      .texture-detail-stage {
        min-height: 520px;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(255, 209, 138, 0.18), transparent 34%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.1), transparent 42%),
          #0e1016;
      }
      .texture-detail-stage canvas { display: block; width: 100%; height: 100%; }
      .texture-detail-panel,
      .texture-detail-docs,
      .texture-detail-notes { padding: 22px; }
      .texture-detail-panel { display: grid; gap: 16px; align-content: start; }
      .texture-detail-code {
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
      .texture-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .texture-detail-doc {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .texture-detail-doc h3 { margin: 0 0 8px; font-size: 1rem; }
      .texture-detail-doc p { margin: 0; color: var(--muted); line-height: 1.65; }
      .texture-detail-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .texture-detail-tag {
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        color: var(--text);
        background: rgba(255,255,255,0.03);
      }
      .texture-detail-notes ul { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.75; }
      @media (max-width: 920px) {
        .texture-detail-layout { grid-template-columns: 1fr; }
        .texture-detail-stage { min-height: 420px; }
      }
    </style>

    <section class="page texture-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/textures">返回纹理总览</a>
        <p class="eyebrow">Route: #/textures/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="texture-detail-layout">
        <div class="texture-detail-stage" data-stage></div>
        <aside class="texture-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="texture-detail-code">${definition.code}</pre>
          </div>
          <div>
            <p class="eyebrow">学习重点</p>
            <p>${definition.summary}</p>
          </div>
        </aside>
      </div>

      <div class="texture-detail-docs">
        <p class="eyebrow">关键参数</p>
        <div class="texture-detail-docs-grid">
          ${definition.parameterNotes
            .map(
              (note) => `
                <article class="texture-detail-doc">
                  <h3>${note.name}</h3>
                  <p>${note.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="texture-detail-notes">
        <p class="eyebrow">典型用途</p>
        <p>这页会把当前纹理类型单独放大展示，方便你只关注它是如何生成、如何参与材质，以及它更适合解决哪一类问题。</p>
        <div class="texture-detail-tags">
          ${definition.useCases.map((tag) => `<span class="texture-detail-tag">${tag}</span>`).join('')}
        </div>
        <ul>
          ${definition.fixedInputs.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const preview = createTexturePreview(definition);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  stage.appendChild(renderer.domElement);

  let animationFrameId = 0;
  let disposed = false;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function render(time) {
    if (disposed) return;
    const seconds = time * 0.001;
    preview.setRotation(seconds, 0);
    preview.beforeRender?.(seconds, renderer);
    renderer.render(preview.scene, preview.camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
    preview.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}
