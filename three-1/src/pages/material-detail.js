import * as THREE from 'three';
import { createMaterialPreview } from '../components/materials/materials-preview.js';
import { getMaterialById } from '../components/materials/materials-data.js';

// 材质详情页负责单个材质的放大讲解：
// 1. 根据路由 id 找到材质定义
// 2. 用共享预览函数渲染一个更大的材质预览
// 3. 展示代码、关键参数说明和典型用途
export function mountMaterialDetailPage(container, { materialId }) {
  const definition = getMaterialById(materialId);

  // 路由 id 不存在时，渲染一个兜底状态，而不是让页面报错。
  if (!definition) {
    container.innerHTML = `
      <section class="page viewer-page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/materials">返回材质总览</a>
          <p class="eyebrow">Route: #/materials/${materialId}</p>
          <h2>未找到这个材质</h2>
          <p>当前路由没有匹配到对应的材质详情，请返回总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .material-detail-page { display: grid; gap: 18px; }
      .material-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.92fr);
        gap: 18px;
      }
      .material-detail-stage,
      .material-detail-panel,
      .material-detail-docs,
      .material-detail-notes {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
      }
      .material-detail-stage {
        min-height: 520px;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(255, 209, 138, 0.18), transparent 34%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.1), transparent 42%),
          #0e1016;
      }
      .material-detail-stage canvas { display: block; width: 100%; height: 100%; }
      .material-detail-panel,
      .material-detail-docs,
      .material-detail-notes { padding: 22px; }
      .material-detail-panel { display: grid; gap: 16px; align-content: start; }
      .material-detail-code {
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
      .material-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .material-detail-doc {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .material-detail-doc h3 { margin: 0 0 8px; font-size: 1rem; }
      .material-detail-doc p { margin: 0; color: var(--muted); line-height: 1.65; }
      .material-detail-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .material-detail-tag {
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        color: var(--text);
        background: rgba(255,255,255,0.03);
      }
      .material-detail-notes ul { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.75; }
      @media (max-width: 920px) {
        .material-detail-layout { grid-template-columns: 1fr; }
        .material-detail-stage { min-height: 420px; }
      }
    </style>

    <section class="page material-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/materials">返回材质总览</a>
        <p class="eyebrow">Route: #/materials/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="material-detail-layout">
        <div class="material-detail-stage" data-stage></div>
        <aside class="material-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="material-detail-code">${definition.code}</pre>
          </div>
          <div>
            <p class="eyebrow">学习重点</p>
            <p>${definition.summary}</p>
          </div>
        </aside>
      </div>

      <div class="material-detail-docs">
        <p class="eyebrow">关键参数</p>
        <div class="material-detail-docs-grid">
          ${definition.parameterNotes
            .map(
              (note) => `
                <article class="material-detail-doc">
                  <h3>${note.name}</h3>
                  <p>${note.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="material-detail-notes">
        <p class="eyebrow">典型用途</p>
        <p>这一页保留和总览页一致的球体与灯光配置，目的是让你在放大观察时，仍然只聚焦材质本身的响应差异。</p>
        <div class="material-detail-tags">
          ${definition.useCases.map((tag) => `<span class="material-detail-tag">${tag}</span>`).join('')}
        </div>
        <ul>
          ${definition.fixedInputs.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');

  // 详情页复用总览页同一套预览逻辑，保证“总览里看到的”和“详情里看到的”是同一个材质响应条件。
  const preview = createMaterialPreview(definition);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  stage.appendChild(renderer.domElement);

  let animationFrameId = 0;
  let disposed = false;

  // 详情页只渲染一个预览，所以这里是标准的单场景 resize 逻辑。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 详情页的动画循环也更简单：
  // 只需要持续旋转当前材质球并渲染即可。
  function render(time) {
    if (disposed) return;
    const seconds = time * 0.001;
    preview.setRotation(seconds, 0);
    renderer.render(preview.scene, preview.camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  // 卸载时要停止动画、移除事件，并释放预览和 renderer 的资源。
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
