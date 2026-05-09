import * as THREE from 'three';
import { createLightPreview } from '../components/lights/lights-preview.js';
import { getLightById } from '../components/lights/lights-data.js';

// 光照详情页复用 createLightPreview 生成的 scene/camera，
// 这里负责 renderer、尺寸同步、动画循环和路由卸载清理。
export function mountLightDetailPage(container, { lightId }) {
  const definition = getLightById(lightId);

  if (!definition) {
    container.innerHTML = `
      <section class="page viewer-page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/lights">返回光照总览</a>
          <p class="eyebrow">Route: #/lights/${lightId}</p>
          <h2>未找到这个光照类型</h2>
          <p>当前路由没有匹配到对应的光照详情，请返回总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .light-detail-page { display: grid; gap: 18px; }
      .light-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.92fr);
        gap: 18px;
      }
      .light-detail-stage,
      .light-detail-panel,
      .light-detail-docs,
      .light-detail-notes {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
      }
      .light-detail-stage {
        min-height: 520px;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(255, 209, 138, 0.18), transparent 34%),
          linear-gradient(180deg, rgba(126, 199, 255, 0.1), transparent 42%),
          #0e1016;
      }
      .light-detail-stage canvas { display: block; width: 100%; height: 100%; }
      .light-detail-panel,
      .light-detail-docs,
      .light-detail-notes { padding: 22px; }
      .light-detail-panel { display: grid; gap: 16px; align-content: start; }
      .light-detail-code {
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
      .light-detail-tip {
        margin: 0;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(126, 199, 255, 0.14);
        background: rgba(126, 199, 255, 0.08);
        color: #d9e6ff;
        line-height: 1.7;
      }
      .light-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .light-detail-doc {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .light-detail-doc h3 { margin: 0 0 8px; font-size: 1rem; }
      .light-detail-doc p { margin: 0; color: var(--muted); line-height: 1.65; }
      .light-detail-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .light-detail-tag {
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        color: var(--text);
        background: rgba(255,255,255,0.03);
      }
      .light-detail-notes ul { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.75; }
      @media (max-width: 920px) {
        .light-detail-layout { grid-template-columns: 1fr; }
        .light-detail-stage { min-height: 420px; }
      }
    </style>

    <section class="page light-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/lights">返回光照总览</a>
        <p class="eyebrow">Route: #/lights/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="light-detail-layout">
        <div class="light-detail-stage" data-stage></div>
        <aside class="light-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="light-detail-code">${definition.code}</pre>
          </div>
          <div>
            <p class="eyebrow">学习重点</p>
            <p>${definition.learningFocus}</p>
          </div>
          <div>
            <p class="eyebrow">观察提示</p>
            <p class="light-detail-tip">${definition.observationHint}</p>
          </div>
        </aside>
      </div>

      <div class="light-detail-docs">
        <p class="eyebrow">关键参数</p>
        <div class="light-detail-docs-grid">
          ${definition.parameterNotes
            .map(
              (note) => `
                <article class="light-detail-doc">
                  <h3>${note.name}</h3>
                  <p>${note.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="light-detail-notes">
        <p class="eyebrow">典型用途</p>
        <p>这页会把当前光照类型单独放大展示，方便你只看它如何影响同一组物体，以及它与其他光照模型最大的行为差异在哪里。</p>
        <div class="light-detail-tags">
          ${definition.useCases.map((tag) => `<span class="light-detail-tag">${tag}</span>`).join('')}
        </div>
        <ul>
          ${definition.fixedInputs.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="light-detail-notes">
        <p class="eyebrow">使用提醒</p>
        <ul>
          ${definition.usageNotes.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const preview = createLightPreview(definition);
  // 每个详情页单独创建 renderer，离开路由时销毁，避免多个 WebGL 上下文堆积。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  stage.appendChild(renderer.domElement);

  let animationFrameId = 0;
  let disposed = false;

  // 容器尺寸变化时同步相机 aspect、投影矩阵和 renderer 尺寸，避免画面拉伸。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 每帧更新共享舞台里会旋转的物体，再渲染当前灯光示例。
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

  // hash 路由切换时执行清理：停止动画、移除监听、释放 three.js 资源和 DOM。
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

