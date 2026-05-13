import { customBufferGeometryCatalog } from '../components/custom-buffergeometry/custom-buffergeometry-data.js';
import { mountCustomBufferGeometryScene } from '../components/custom-buffergeometry/custom-buffergeometry-preview.js';

export function mountCustomBufferGeometryPage(container) {
  container.innerHTML = `
    <style>
      .custom-buffergeometry-stage { padding: 24px; }
      .custom-buffergeometry-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .custom-buffergeometry-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(52,211,153,0.14);
        background: linear-gradient(145deg, rgba(10,23,30,0.97), rgba(7,12,18,0.94));
        box-shadow: 0 18px 42px rgba(0,0,0,0.26);
      }
      .custom-buffergeometry-card__preview {
        min-height: 220px;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(52,211,153,0.12);
        background: radial-gradient(circle at 50% 15%, rgba(52,211,153,0.18), rgba(8,12,22,0.96) 62%);
      }
      .custom-buffergeometry-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .custom-buffergeometry-card__title {
        margin: 0;
        color: #f7fbff;
        font-weight: 800;
      }
      .custom-buffergeometry-card__label {
        margin: 4px 0 0;
        color: #6ee7b7;
        font-size: 0.9rem;
      }
      .custom-buffergeometry-card__summary,
      .custom-buffergeometry-card__hint {
        margin: 0;
        color: #b9c5d8;
        line-height: 1.65;
      }
      .custom-buffergeometry-card__hint {
        padding: 10px 12px;
        border-radius: 14px;
        color: #dcfff2;
        background: rgba(52, 211, 153, 0.08);
        border: 1px solid rgba(52, 211, 153, 0.14);
      }
      .custom-buffergeometry-card__code {
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
      .custom-buffergeometry-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .custom-buffergeometry-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(52, 211, 153, 0.32);
        color: #6ee7b7;
        background: rgba(52, 211, 153, 0.08);
      }
      @media (max-width: 760px) {
        .custom-buffergeometry-stage { padding: 16px; }
        .custom-buffergeometry-card { padding: 16px; }
        .custom-buffergeometry-card__preview { min-height: 180px; }
      }
    </style>

    <section class="page custom-buffergeometry-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/custom-buffergeometry</p>
        <h2>Three.js 自定义缓冲几何体总览</h2>
        <p>这个页面参考官方 custom BufferGeometry 手册，演示如何直接用 BufferAttribute 控制顶点位置、索引、UV、法线和动态更新。</p>
        <p>重点观察：BufferGeometry 的核心不是“模型名称”，而是一组能被 GPU 读取的顶点属性数组。</p>
      </div>
      <div class="viewer-stage custom-buffergeometry-stage">
        <div class="custom-buffergeometry-grid">
          ${customBufferGeometryCatalog
            .map(
              (definition, index) => `
                <article class="custom-buffergeometry-card">
                  <div class="custom-buffergeometry-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="custom-buffergeometry-card__title">${definition.name}</p>
                    <p class="custom-buffergeometry-card__label">${definition.label}</p>
                  </div>
                  <p class="custom-buffergeometry-card__summary">${definition.summary}</p>
                  <p class="custom-buffergeometry-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="custom-buffergeometry-card__code">${definition.code}</pre>
                  <div class="custom-buffergeometry-card__footer">
                    <a class="custom-buffergeometry-card__link" href="#/custom-buffergeometry/${definition.id}">查看详情</a>
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
  const disposers = customBufferGeometryCatalog.map((definition, index) =>
    mountCustomBufferGeometryScene(previewElements[index], definition),
  );

  return () => {
    disposers.forEach((dispose) => dispose());
    container.innerHTML = '';
  };
}
