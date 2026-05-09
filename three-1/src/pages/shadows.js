import { shadowCatalog } from '../components/shadows/shadows-data.js';
import { mountShadowScene } from '../components/shadows/shadows-preview.js';

export function mountShadowsPage(container) {
  container.innerHTML = `
    <style>
      .shadows-stage { padding: 24px; }
      .shadows-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .shadow-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.09);
        background: linear-gradient(145deg, rgba(18,24,36,0.96), rgba(10,13,20,0.92));
        box-shadow: 0 18px 40px rgba(0,0,0,0.24);
      }
      .shadow-card__preview {
        min-height: 210px;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: radial-gradient(circle at 50% 10%, rgba(126,199,255,0.16), rgba(8,10,16,0.96) 58%);
      }
      .shadow-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .shadow-card__title {
        margin: 0;
        color: #f7f8ff;
        font-weight: 800;
      }
      .shadow-card__label {
        margin: 4px 0 0;
        color: #7ec7ff;
        font-size: 0.9rem;
      }
      .shadow-card__summary,
      .shadow-card__hint {
        margin: 0;
        color: #b9c2d6;
        line-height: 1.65;
      }
      .shadow-card__hint {
        padding: 10px 12px;
        border-radius: 14px;
        color: #ffe2ad;
        background: rgba(255, 209, 138, 0.08);
        border: 1px solid rgba(255, 209, 138, 0.12);
      }
      .shadow-card__code {
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
      .shadow-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .shadow-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(126, 199, 255, 0.26);
        color: #7ec7ff;
        background: rgba(126, 199, 255, 0.08);
      }
      @media (max-width: 760px) {
        .shadows-stage { padding: 16px; }
        .shadow-card { padding: 16px; }
        .shadow-card__preview { min-height: 180px; }
      }
    </style>

    <section class="page shadows-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/shadows</p>
        <h2>Three.js 阴影总览</h2>
        <p>这个页面专门讲阴影：从弹跳球假阴影开始，再过渡到方向光阴影相机、阴影贴图分辨率，以及聚光灯和点光源的性能成本。</p>
        <p>为了和相机模块保持一致，每张卡片都把一个概念拆成“预览、代码、观察提示、详情入口”，方便逐个理解。</p>
      </div>
      <div class="viewer-stage shadows-stage">
        <div class="shadows-grid">
          ${shadowCatalog
            .map(
              (definition, index) => `
                <article class="shadow-card">
                  <div class="shadow-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="shadow-card__title">${definition.name}</p>
                    <p class="shadow-card__label">${definition.label}</p>
                  </div>
                  <p class="shadow-card__summary">${definition.summary}</p>
                  <p class="shadow-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="shadow-card__code">${definition.code}</pre>
                  <div class="shadow-card__footer">
                    <a class="shadow-card__link" href="#/shadows/${definition.id}">查看详情</a>
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
  const disposers = shadowCatalog.map((definition, index) => mountShadowScene(previewElements[index], definition));

  return () => {
    disposers.forEach((dispose) => dispose());
    container.innerHTML = '';
  };
}
