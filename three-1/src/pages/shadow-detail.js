import { getShadowById } from '../components/shadows/shadows-data.js';
import { mountShadowScene } from '../components/shadows/shadows-preview.js';

export function mountShadowDetailPage(container, { shadowId }) {
  const definition = getShadowById(shadowId);

  if (!definition) {
    container.innerHTML = `
      <section class="page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/shadows">返回阴影总览</a>
          <h2>没有找到这个阴影示例</h2>
          <p>当前路由没有匹配到已注册的阴影示例，请回到总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  container.innerHTML = `
    <style>
      .shadow-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.72fr);
        gap: 22px;
        align-items: stretch;
      }
      .shadow-detail-stage {
        min-height: 560px;
        overflow: hidden;
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,0.1);
        background: radial-gradient(circle at 50% 8%, rgba(126,199,255,0.16), rgba(9,12,18,0.96) 62%);
      }
      .shadow-detail-stage canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .shadow-detail-panel,
      .shadow-detail-docs,
      .shadow-detail-notes {
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(14,18,28,0.88);
        box-shadow: 0 18px 38px rgba(0,0,0,0.22);
      }
      .shadow-detail-panel {
        display: grid;
        gap: 18px;
        align-content: start;
        padding: 22px;
      }
      .shadow-detail-code {
        margin: 0;
        padding: 14px;
        border-radius: 16px;
        color: #dfe7f8;
        background: rgba(6,8,13,0.82);
        border: 1px solid rgba(255,255,255,0.08);
        white-space: pre-wrap;
        line-height: 1.6;
        font-size: 0.88rem;
      }
      .shadow-detail-tip {
        padding: 12px 14px;
        border-radius: 16px;
        color: #ffe2ad;
        background: rgba(255, 209, 138, 0.08);
        border: 1px solid rgba(255, 209, 138, 0.12);
      }
      .shadow-detail-docs,
      .shadow-detail-notes {
        margin-top: 22px;
        padding: 22px;
      }
      .shadow-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .shadow-detail-doc {
        padding: 16px;
        border-radius: 18px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.07);
      }
      .shadow-detail-doc h3 {
        margin: 0 0 8px;
        color: #7ec7ff;
      }
      .shadow-detail-doc p,
      .shadow-detail-panel p,
      .shadow-detail-notes p,
      .shadow-detail-notes li {
        color: #b9c2d6;
        line-height: 1.7;
      }
      .shadow-detail-notes ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
      @media (max-width: 920px) {
        .shadow-detail-layout { grid-template-columns: 1fr; }
        .shadow-detail-stage { min-height: 430px; }
      }
    </style>

    <section class="page shadow-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/shadows">返回阴影总览</a>
        <p class="eyebrow">Route: #/shadows/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="shadow-detail-layout">
        <div class="shadow-detail-stage" data-stage></div>
        <aside class="shadow-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="shadow-detail-code">${definition.code}</pre>
          </div>
          <div>
            <p class="eyebrow">学习重点</p>
            <p>${definition.learningFocus}</p>
          </div>
          <div>
            <p class="eyebrow">观察提示</p>
            <p class="shadow-detail-tip">${definition.observationHint}</p>
          </div>
        </aside>
      </div>

      <div class="shadow-detail-docs">
        <p class="eyebrow">关键参数</p>
        <div class="shadow-detail-docs-grid">
          ${definition.parameterNotes
            .map(
              (note) => `
                <article class="shadow-detail-doc">
                  <h3>${note.name}</h3>
                  <p>${note.description}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="shadow-detail-notes">
        <p class="eyebrow">使用提醒</p>
        <ul>
          ${definition.usageNotes.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const disposeScene = mountShadowScene(stage, definition);

  return () => {
    disposeScene();
    container.innerHTML = '';
  };
}

