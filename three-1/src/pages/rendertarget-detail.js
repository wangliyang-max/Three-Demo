import { getRenderTargetById } from '../components/rendertargets/rendertargets-data.js';
import { mountRenderTargetScene } from '../components/rendertargets/rendertargets-preview.js';

export function mountRenderTargetDetailPage(container, { renderTargetId }) {
  const definition = getRenderTargetById(renderTargetId);

  if (!definition) {
    container.innerHTML = `
      <section class="page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/rendertargets">返回渲染目标总览</a>
          <h2>没有找到这个渲染目标示例</h2>
          <p>当前路径里的 id 是：${renderTargetId}</p>
        </div>
      </section>
    `;

    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .render-target-detail-stage {
        display: grid;
        gap: 18px;
      }
      .render-target-detail-canvas {
        min-height: 460px;
        overflow: hidden;
        border-radius: 26px;
        border: 1px solid rgba(125,211,252,0.14);
        background: radial-gradient(circle at 50% 16%, rgba(56,189,248,0.22), rgba(8,12,22,0.96) 64%);
      }
      .render-target-detail-canvas canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .render-target-detail-panel {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
        gap: 18px;
      }
      .render-target-detail-card {
        padding: 18px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(12,16,26,0.82);
      }
      .render-target-detail-card h3 {
        margin: 0 0 12px;
        color: #f7fbff;
      }
      .render-target-detail-card p,
      .render-target-detail-card li {
        color: #bdc8da;
        line-height: 1.7;
      }
      .render-target-detail-card ul {
        margin: 0;
        padding-left: 18px;
      }
      .render-target-detail-code {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        overflow: auto;
        border: 1px solid rgba(125,211,252,0.12);
        background: rgba(6,9,15,0.9);
        color: #dbeafe;
        line-height: 1.65;
      }
      .render-target-param-list {
        display: grid;
        gap: 10px;
      }
      .render-target-param-list p {
        margin: 0;
      }
      .render-target-param-list strong {
        color: #7dd3fc;
      }
      @media (max-width: 860px) {
        .render-target-detail-panel { grid-template-columns: 1fr; }
        .render-target-detail-canvas { min-height: 340px; }
      }
    </style>

    <section class="page render-target-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/rendertargets">返回渲染目标总览</a>
        <p class="eyebrow">Route: #/rendertargets/${definition.id}</p>
        <h2>${definition.name}</h2>
        <p>${definition.summary}</p>
        <p>${definition.learningFocus}</p>
      </div>

      <div class="viewer-stage render-target-detail-stage">
        <div class="render-target-detail-canvas" data-detail-stage></div>
        <div class="render-target-detail-panel">
          <article class="render-target-detail-card">
            <h3>核心代码</h3>
            <pre class="render-target-detail-code">${definition.code}</pre>
          </article>
          <article class="render-target-detail-card">
            <h3>参数说明</h3>
            <div class="render-target-param-list">
              ${definition.parameters
                .map((item) => `<p><strong>${item.name}</strong>：${item.description}</p>`)
                .join('')}
            </div>
          </article>
          <article class="render-target-detail-card">
            <h3>使用建议</h3>
            <ul>
              ${definition.usageNotes.map((note) => `<li>${note}</li>`).join('')}
            </ul>
          </article>
          <article class="render-target-detail-card">
            <h3>观察重点</h3>
            <p>${definition.observationHint}</p>
          </article>
        </div>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-detail-stage]');
  const dispose = mountRenderTargetScene(stage, definition);

  return () => {
    dispose();
    container.innerHTML = '';
  };
}
