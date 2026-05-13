import { fogCatalog } from '../components/fog/fog-data.js';
import { mountFogScene } from '../components/fog/fog-preview.js';

export function mountFogPage(container) {
  container.innerHTML = `
    <style>
      .fog-stage { padding: 24px; }
      .fog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .fog-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.09);
        background: linear-gradient(145deg, rgba(18,24,36,0.96), rgba(10,13,20,0.92));
        box-shadow: 0 18px 40px rgba(0,0,0,0.24);
      }
      .fog-card__preview {
        min-height: 210px;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: radial-gradient(circle at 50% 10%, rgba(215,231,243,0.24), rgba(8,10,16,0.96) 62%);
      }
      .fog-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .fog-card__title {
        margin: 0;
        color: #f7f8ff;
        font-weight: 800;
      }
      .fog-card__label {
        margin: 4px 0 0;
        color: #9fd9ff;
        font-size: 0.9rem;
      }
      .fog-card__summary,
      .fog-card__hint {
        margin: 0;
        color: #b9c2d6;
        line-height: 1.65;
      }
      .fog-card__hint {
        padding: 10px 12px;
        border-radius: 14px;
        color: #d8f0ff;
        background: rgba(159, 217, 255, 0.08);
        border: 1px solid rgba(159, 217, 255, 0.13);
      }
      .fog-card__code {
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
      .fog-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .fog-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(159, 217, 255, 0.28);
        color: #9fd9ff;
        background: rgba(159, 217, 255, 0.08);
      }
      @media (max-width: 760px) {
        .fog-stage { padding: 16px; }
        .fog-card { padding: 16px; }
        .fog-card__preview { min-height: 180px; }
      }
    </style>

    <section class="page fog-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/fog</p>
        <h2>Three.js 雾总览</h2>
        <p>这个页面按照阴影模块的结构展示雾效果：线性雾、指数雾、雾色和背景同步，以及材质是否参与雾计算。</p>
        <p>雾的重点是用距离塑造空间层次，而不是简单把画面变灰。所有示例都使用沿深度排布的同一组物体，方便观察距离变化。</p>
      </div>
      <div class="viewer-stage fog-stage">
        <div class="fog-grid">
          ${fogCatalog
            .map(
              (definition, index) => `
                <article class="fog-card">
                  <div class="fog-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="fog-card__title">${definition.name}</p>
                    <p class="fog-card__label">${definition.label}</p>
                  </div>
                  <p class="fog-card__summary">${definition.summary}</p>
                  <p class="fog-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="fog-card__code">${definition.code}</pre>
                  <div class="fog-card__footer">
                    <a class="fog-card__link" href="#/fog/${definition.id}">查看详情</a>
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
  const disposers = fogCatalog.map((definition, index) => mountFogScene(previewElements[index], definition));

  return () => {
    disposers.forEach((dispose) => dispose());
    container.innerHTML = '';
  };
}
