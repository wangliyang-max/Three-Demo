import { renderTargetCatalog } from '../components/rendertargets/rendertargets-data.js';
import { mountRenderTargetScene } from '../components/rendertargets/rendertargets-preview.js';

export function mountRenderTargetsPage(container) {
  container.innerHTML = `
    <style>
      .render-targets-stage { padding: 24px; }
      .render-targets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .render-target-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(125,211,252,0.14);
        background: linear-gradient(145deg, rgba(15,23,42,0.97), rgba(7,10,18,0.94));
        box-shadow: 0 18px 42px rgba(0,0,0,0.26);
      }
      .render-target-card__preview {
        min-height: 220px;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(125,211,252,0.12);
        background: radial-gradient(circle at 50% 15%, rgba(56,189,248,0.2), rgba(8,12,22,0.96) 62%);
      }
      .render-target-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .render-target-card__title {
        margin: 0;
        color: #f7fbff;
        font-weight: 800;
      }
      .render-target-card__label {
        margin: 4px 0 0;
        color: #7dd3fc;
        font-size: 0.9rem;
      }
      .render-target-card__summary,
      .render-target-card__hint {
        margin: 0;
        color: #b9c5d8;
        line-height: 1.65;
      }
      .render-target-card__hint {
        padding: 10px 12px;
        border-radius: 14px;
        color: #dbf4ff;
        background: rgba(125, 211, 252, 0.08);
        border: 1px solid rgba(125, 211, 252, 0.14);
      }
      .render-target-card__code {
        margin: 0;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(8,11,18,0.74);
        color: #dce7f7;
        font-size: 0.82rem;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .render-target-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .render-target-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(125, 211, 252, 0.32);
        color: #7dd3fc;
        background: rgba(125, 211, 252, 0.08);
      }
      @media (max-width: 760px) {
        .render-targets-stage { padding: 16px; }
        .render-target-card { padding: 16px; }
        .render-target-card__preview { min-height: 180px; }
      }
    </style>

    <section class="page render-targets-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/rendertargets</p>
        <h2>Three.js 渲染目标总览</h2>
        <p>这个页面参考官方 render targets 手册，演示如何把一个离屏场景先渲染到纹理，再把这张实时纹理用于主场景。</p>
        <p>重点观察渲染顺序：先 setRenderTarget(renderTarget) 更新贴图，再 setRenderTarget(null) 把主场景绘制到屏幕。</p>
      </div>
      <div class="viewer-stage render-targets-stage">
        <div class="render-targets-grid">
          ${renderTargetCatalog
            .map(
              (definition, index) => `
                <article class="render-target-card">
                  <div class="render-target-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="render-target-card__title">${definition.name}</p>
                    <p class="render-target-card__label">${definition.label}</p>
                  </div>
                  <p class="render-target-card__summary">${definition.summary}</p>
                  <p class="render-target-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="render-target-card__code">${definition.code}</pre>
                  <div class="render-target-card__footer">
                    <a class="render-target-card__link" href="#/rendertargets/${definition.id}">查看详情</a>
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
  const disposers = renderTargetCatalog.map((definition, index) =>
    mountRenderTargetScene(previewElements[index], definition),
  );

  return () => {
    disposers.forEach((dispose) => dispose());
    container.innerHTML = '';
  };
}
