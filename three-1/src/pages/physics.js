import { physicsCatalog } from '../components/physics/physics-data.js';
import { mountPhysicsScene } from '../components/physics/physics-preview.js';

export function mountPhysicsPage(container) {
  container.innerHTML = `
    <style>
      .physics-stage { padding: 24px; }
      .physics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
      }
      .physics-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border-radius: 24px;
        border: 1px solid rgba(96,165,250,0.14);
        background: linear-gradient(145deg, rgba(14,22,38,0.97), rgba(7,10,18,0.94));
        box-shadow: 0 18px 42px rgba(0,0,0,0.26);
      }
      .physics-card__preview {
        min-height: 220px;
        overflow: hidden;
        border-radius: 18px;
        border: 1px solid rgba(96,165,250,0.12);
        background: radial-gradient(circle at 50% 15%, rgba(96,165,250,0.2), rgba(8,12,22,0.96) 62%);
      }
      .physics-card__preview canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .physics-card__title {
        margin: 0;
        color: #f7fbff;
        font-weight: 800;
      }
      .physics-card__label {
        margin: 4px 0 0;
        color: #93c5fd;
        font-size: 0.9rem;
      }
      .physics-card__summary,
      .physics-card__hint {
        margin: 0;
        color: #b9c5d8;
        line-height: 1.65;
      }
      .physics-card__hint {
        padding: 10px 12px;
        border-radius: 14px;
        color: #dbeafe;
        background: rgba(96, 165, 250, 0.08);
        border: 1px solid rgba(96, 165, 250, 0.14);
      }
      .physics-card__code {
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
      .physics-card__footer {
        display: flex;
        justify-content: flex-end;
      }
      .physics-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(96, 165, 250, 0.32);
        color: #93c5fd;
        background: rgba(96, 165, 250, 0.08);
      }
      @media (max-width: 760px) {
        .physics-stage { padding: 16px; }
        .physics-card { padding: 16px; }
        .physics-card__preview { min-height: 180px; }
      }
    </style>

    <section class="page physics-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/physics</p>
        <h2>Three.js 物理总览</h2>
        <p>这个页面参考官方 physics 手册，用轻量教学版物理循环演示重力、碰撞、body/mesh 同步和固定时间步。</p>
        <p>重点理解：three.js 负责渲染，物理状态负责计算；每帧把物理结果同步给可见 mesh。</p>
      </div>
      <div class="viewer-stage physics-stage">
        <div class="physics-grid">
          ${physicsCatalog
            .map(
              (definition, index) => `
                <article class="physics-card">
                  <div class="physics-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="physics-card__title">${definition.name}</p>
                    <p class="physics-card__label">${definition.label}</p>
                  </div>
                  <p class="physics-card__summary">${definition.summary}</p>
                  <p class="physics-card__hint">观察提示：${definition.observationHint}</p>
                  <pre class="physics-card__code">${definition.code}</pre>
                  <div class="physics-card__footer">
                    <a class="physics-card__link" href="#/physics/${definition.id}">查看详情</a>
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
  const disposers = physicsCatalog.map((definition, index) => mountPhysicsScene(previewElements[index], definition));

  return () => {
    disposers.forEach((dispose) => dispose());
    container.innerHTML = '';
  };
}
