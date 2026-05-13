import { getCustomBufferGeometryById } from '../components/custom-buffergeometry/custom-buffergeometry-data.js';
import { mountCustomBufferGeometryScene } from '../components/custom-buffergeometry/custom-buffergeometry-preview.js';

export function mountCustomBufferGeometryDetailPage(container, { customBufferGeometryId }) {
  const definition = getCustomBufferGeometryById(customBufferGeometryId);

  if (!definition) {
    container.innerHTML = `
      <section class="page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/custom-buffergeometry">返回自定义缓冲几何体总览</a>
          <h2>没有找到这个自定义缓冲几何体示例</h2>
          <p>当前路径里的 id 是：${customBufferGeometryId}</p>
        </div>
      </section>
    `;

    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .custom-buffergeometry-detail-stage {
        display: grid;
        gap: 18px;
      }
      .custom-buffergeometry-detail-canvas {
        min-height: 460px;
        overflow: hidden;
        border-radius: 26px;
        border: 1px solid rgba(52,211,153,0.14);
        background: radial-gradient(circle at 50% 16%, rgba(52,211,153,0.2), rgba(8,12,22,0.96) 64%);
      }
      .custom-buffergeometry-detail-canvas canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .custom-buffergeometry-detail-panel {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
        gap: 18px;
      }
      .custom-buffergeometry-detail-card {
        padding: 18px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(12,16,26,0.82);
      }
      .custom-buffergeometry-detail-card h3 {
        margin: 0 0 12px;
        color: #f7fbff;
      }
      .custom-buffergeometry-detail-card p,
      .custom-buffergeometry-detail-card li {
        color: #bdc8da;
        line-height: 1.7;
      }
      .custom-buffergeometry-detail-card ul {
        margin: 0;
        padding-left: 18px;
      }
      .custom-buffergeometry-detail-code {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        overflow: auto;
        border: 1px solid rgba(52,211,153,0.12);
        background: rgba(6,9,15,0.9);
        color: #dbeafe;
        line-height: 1.65;
      }
      .custom-buffergeometry-param-list {
        display: grid;
        gap: 10px;
      }
      .custom-buffergeometry-param-list p {
        margin: 0;
      }
      .custom-buffergeometry-param-list strong {
        color: #6ee7b7;
      }
      @media (max-width: 860px) {
        .custom-buffergeometry-detail-panel { grid-template-columns: 1fr; }
        .custom-buffergeometry-detail-canvas { min-height: 340px; }
      }
    </style>

    <section class="page custom-buffergeometry-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/custom-buffergeometry">返回自定义缓冲几何体总览</a>
        <p class="eyebrow">Route: #/custom-buffergeometry/${definition.id}</p>
        <h2>${definition.name}</h2>
        <p>${definition.summary}</p>
        <p>${definition.learningFocus}</p>
      </div>

      <div class="viewer-stage custom-buffergeometry-detail-stage">
        <div class="custom-buffergeometry-detail-canvas" data-detail-stage></div>
        <div class="custom-buffergeometry-detail-panel">
          <article class="custom-buffergeometry-detail-card">
            <h3>核心代码</h3>
            <pre class="custom-buffergeometry-detail-code">${definition.code}</pre>
          </article>
          <article class="custom-buffergeometry-detail-card">
            <h3>参数说明</h3>
            <div class="custom-buffergeometry-param-list">
              ${definition.parameters
                .map((item) => `<p><strong>${item.name}</strong>：${item.description}</p>`)
                .join('')}
            </div>
          </article>
          <article class="custom-buffergeometry-detail-card">
            <h3>使用建议</h3>
            <ul>
              ${definition.usageNotes.map((note) => `<li>${note}</li>`).join('')}
            </ul>
          </article>
          <article class="custom-buffergeometry-detail-card">
            <h3>观察重点</h3>
            <p>${definition.observationHint}</p>
          </article>
        </div>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-detail-stage]');
  const dispose = mountCustomBufferGeometryScene(stage, definition);

  return () => {
    dispose();
    container.innerHTML = '';
  };
}
