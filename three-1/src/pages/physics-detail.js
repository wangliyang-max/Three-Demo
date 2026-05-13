import { getPhysicsById } from '../components/physics/physics-data.js';
import { mountPhysicsScene } from '../components/physics/physics-preview.js';

export function mountPhysicsDetailPage(container, { physicsId }) {
  const definition = getPhysicsById(physicsId);

  if (!definition) {
    container.innerHTML = `
      <section class="page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/physics">返回物理总览</a>
          <h2>没有找到这个物理示例</h2>
          <p>当前路径里的 id 是：${physicsId}</p>
        </div>
      </section>
    `;

    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .physics-detail-stage {
        display: grid;
        gap: 18px;
      }
      .physics-detail-canvas {
        min-height: 460px;
        overflow: hidden;
        border-radius: 26px;
        border: 1px solid rgba(96,165,250,0.14);
        background: radial-gradient(circle at 50% 16%, rgba(96,165,250,0.2), rgba(8,12,22,0.96) 64%);
      }
      .physics-detail-canvas canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .physics-detail-panel {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
        gap: 18px;
      }
      .physics-detail-card {
        padding: 18px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(12,16,26,0.82);
      }
      .physics-detail-card h3 {
        margin: 0 0 12px;
        color: #f7fbff;
      }
      .physics-detail-card p,
      .physics-detail-card li {
        color: #bdc8da;
        line-height: 1.7;
      }
      .physics-detail-card ul {
        margin: 0;
        padding-left: 18px;
      }
      .physics-detail-code {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        overflow: auto;
        border: 1px solid rgba(96,165,250,0.12);
        background: rgba(6,9,15,0.9);
        color: #dbeafe;
        line-height: 1.65;
      }
      .physics-param-list {
        display: grid;
        gap: 10px;
      }
      .physics-param-list p {
        margin: 0;
      }
      .physics-param-list strong {
        color: #93c5fd;
      }
      @media (max-width: 860px) {
        .physics-detail-panel { grid-template-columns: 1fr; }
        .physics-detail-canvas { min-height: 340px; }
      }
    </style>

    <section class="page physics-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/physics">返回物理总览</a>
        <p class="eyebrow">Route: #/physics/${definition.id}</p>
        <h2>${definition.name}</h2>
        <p>${definition.summary}</p>
        <p>${definition.learningFocus}</p>
      </div>

      <div class="viewer-stage physics-detail-stage">
        <div class="physics-detail-canvas" data-detail-stage></div>
        <div class="physics-detail-panel">
          <article class="physics-detail-card">
            <h3>核心代码</h3>
            <pre class="physics-detail-code">${definition.code}</pre>
          </article>
          <article class="physics-detail-card">
            <h3>参数说明</h3>
            <div class="physics-param-list">
              ${definition.parameters
                .map((item) => `<p><strong>${item.name}</strong>：${item.description}</p>`)
                .join('')}
            </div>
          </article>
          <article class="physics-detail-card">
            <h3>使用建议</h3>
            <ul>
              ${definition.usageNotes.map((note) => `<li>${note}</li>`).join('')}
            </ul>
          </article>
          <article class="physics-detail-card">
            <h3>观察重点</h3>
            <p>${definition.observationHint}</p>
          </article>
        </div>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-detail-stage]');
  const dispose = mountPhysicsScene(stage, definition);

  return () => {
    dispose();
    container.innerHTML = '';
  };
}
