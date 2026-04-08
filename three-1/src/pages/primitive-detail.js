import * as THREE from 'three';
import {
  clonePrimitiveParams,
  getPrimitiveById,
  getPrimitiveCode,
} from '../components/primitives/primitives-data.js';
import { createPrimitivePreview } from '../components/primitives/primitives-preview.js';

// 控件显示值和真实参数值分开处理。
// 例如布尔值要显示成 开启 / 关闭，数字要按阅读友好的形式展示。
function formatControlValue(control, value) {
  if (control.type === 'boolean') {
    return value ? '开启' : '关闭';
  }

  return Number.isInteger(value) ? `${value}` : `${Number(value.toFixed(2))}`;
}

// 详情页里的滑块和开关都是根据 definition.controls 动态生成的。
// 也就是说，新增图元时只要补好 controls 数据，这里就能自动渲染参数面板。
function renderControls(definition, params) {
  return definition.controls
    .map((control) => {
      const value = params[control.key];

      if (control.type === 'boolean') {
        return `
          <label class="primitive-detail__toggle">
            <span>
              <strong>${control.label}</strong>
              <small>${formatControlValue(control, value)}</small>
            </span>
            <input type="checkbox" data-control-key="${control.key}" ${value ? 'checked' : ''} />
          </label>
        `;
      }

      return `
        <label class="primitive-detail__control">
          <span class="primitive-detail__control-head">
            <strong>${control.label}</strong>
            <small data-value-key="${control.key}">${formatControlValue(control, value)}</small>
          </span>
          <input
            type="range"
            min="${control.min}"
            max="${control.max}"
            step="${control.step}"
            value="${value}"
            data-control-key="${control.key}"
          />
        </label>
      `;
    })
    .join('');
}

// 详情页入口：根据路由里的 primitiveId 找到对应图元定义。
// 找不到时直接渲染一个兜底状态，而不是让页面报错。
export function mountPrimitiveDetailPage(container, { primitiveId }) {
  const definition = getPrimitiveById(primitiveId);

  if (!definition) {
    container.innerHTML = `
      <section class="page viewer-page">
        <div class="viewer-copy">
          <a class="page-back-link" href="#/primitives">返回图元总览</a>
          <p class="eyebrow">Route: #/primitives/${primitiveId}</p>
          <h2>未找到这个图元</h2>
          <p>当前路由没有匹配到对应的图元详情，请返回总览页重新选择。</p>
        </div>
      </section>
    `;
    return () => {
      container.innerHTML = '';
    };
  }

  // params 是当前详情页自己的实时参数副本。
  // 拖动滑块时修改的是它，不会污染图元目录里的默认值。
  const params = clonePrimitiveParams(definition);
  const initialCode = getPrimitiveCode(definition, params);

  container.innerHTML = `
    <style>
      .primitive-detail-page { display: grid; gap: 18px; }
      .primitive-detail-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
        gap: 18px;
      }
      .primitive-detail-stage,
      .primitive-detail-panel,
      .primitive-detail-docs,
      .primitive-detail-notes {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
      }
      .primitive-detail-stage {
        min-height: 520px;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(109, 211, 206, 0.22), transparent 36%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.12), transparent 42%),
          #0e1016;
      }
      .primitive-detail-stage canvas { display: block; width: 100%; height: 100%; }
      .primitive-detail-panel,
      .primitive-detail-docs,
      .primitive-detail-notes { padding: 22px; }
      .primitive-detail-panel { display: grid; gap: 16px; align-content: start; }
      .primitive-detail-code {
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
      .primitive-detail-controls {
        display: grid;
        gap: 12px;
      }
      .primitive-detail__control,
      .primitive-detail__toggle {
        display: grid;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .primitive-detail__control-head,
      .primitive-detail__toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .primitive-detail__control strong,
      .primitive-detail__toggle strong { display: block; font-size: 0.95rem; }
      .primitive-detail__control small,
      .primitive-detail__toggle small { color: var(--muted); }
      .primitive-detail-panel input[type='range'] { width: 100%; }
      .primitive-detail-reset {
        width: fit-content;
        padding: 10px 14px;
        border: 1px solid rgba(109,211,206,0.26);
        border-radius: 999px;
        color: var(--accent);
        background: rgba(109,211,206,0.08);
        cursor: pointer;
      }
      .primitive-detail-docs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .primitive-detail-doc {
        padding: 16px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.02);
      }
      .primitive-detail-doc h3 { margin: 0 0 8px; font-size: 1rem; }
      .primitive-detail-doc p { margin: 0; color: var(--muted); line-height: 1.65; }
      .primitive-detail-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
      .primitive-detail-tag {
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        color: var(--text);
        background: rgba(255,255,255,0.03);
      }
      .primitive-detail-notes ul { margin: 12px 0 0; padding-left: 18px; color: var(--muted); line-height: 1.75; }
      @media (max-width: 920px) {
        .primitive-detail-layout { grid-template-columns: 1fr; }
        .primitive-detail-stage { min-height: 420px; }
      }
    </style>

    <section class="page primitive-detail-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/primitives">返回图元总览</a>
        <p class="eyebrow">Route: #/primitives/${definition.id}</p>
        <h2>${definition.name} · ${definition.label}</h2>
        <p>${definition.summary}</p>
      </div>

      <div class="primitive-detail-layout">
        <div class="primitive-detail-stage" data-stage></div>
        <aside class="primitive-detail-panel">
          <div>
            <p class="eyebrow">当前代码</p>
            <pre class="primitive-detail-code" data-code>${initialCode}</pre>
          </div>
          <div>
            <p class="eyebrow">参数滑块</p>
            <div class="primitive-detail-controls" data-controls>
              ${renderControls(definition, params)}
            </div>
          </div>
          <button type="button" class="primitive-detail-reset" data-reset>重置默认参数</button>
        </aside>
      </div>

      <div class="primitive-detail-docs">
        <p class="eyebrow">参数解释</p>
        <div class="primitive-detail-docs-grid">
          ${definition.controls
            .map(
              (control) => `
                <article class="primitive-detail-doc">
                  <h3>${control.label}</h3>
                  <p>${control.help}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>

      <div class="primitive-detail-notes">
        <p class="eyebrow">学习提示</p>
        <p>这个详情页展示的是当前示例里真正参与构造的参数。你拖动滑块后，几何体会立即重建，方便直接观察参数变化和体积变化的关系。</p>
        <div class="primitive-detail-tags">
          ${definition.useCases.map((tag) => `<span class="primitive-detail-tag">${tag}</span>`).join('')}
        </div>
        <ul>
          ${definition.fixedInputs.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const codeElement = container.querySelector('[data-code]');
  const resetButton = container.querySelector('[data-reset]');
  const preview = createPrimitivePreview(definition, params);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  stage.appendChild(renderer.domElement);

  let animationFrameId = 0;
  let disposed = false;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 滑块拖动后，除了重建 geometry，还要同步刷新面板右侧的当前数值显示。
  function updateValueLabels() {
    definition.controls.forEach((control) => {
      const value = params[control.key];
      const valueNode = container.querySelector(`[data-value-key="${control.key}"]`);
      if (valueNode) {
        valueNode.textContent = formatControlValue(control, value);
      }
      const toggleNode = container.querySelector(`[data-control-key="${control.key}"]`);
      if (toggleNode && control.type === 'boolean') {
        const small = toggleNode.closest('.primitive-detail__toggle')?.querySelector('small');
        if (small) small.textContent = formatControlValue(control, value);
      }
    });
  }

  // 这是详情页最关键的动作：
  // 1. 用当前 params 重建 geometry
  // 2. 更新代码展示
  // 3. 刷新控件右侧的数值文本
  function rebuildGeometry() {
    preview.updateGeometry(params);
    codeElement.textContent = getPrimitiveCode(definition, params);
    updateValueLabels();
  }

  // 所有滑块和开关都走同一套事件绑定。
  // 这里通过 data-control-key 反查 definition.controls 里的参数定义。
  container.querySelectorAll('[data-control-key]').forEach((input) => {
    input.addEventListener('input', () => {
      const control = definition.controls.find((item) => item.key === input.dataset.controlKey);
      if (!control) return;
      params[control.key] = control.type === 'boolean' ? input.checked : Number(input.value);
      rebuildGeometry();
    });
    input.addEventListener('change', () => {
      const control = definition.controls.find((item) => item.key === input.dataset.controlKey);
      if (!control) return;
      params[control.key] = control.type === 'boolean' ? input.checked : Number(input.value);
      rebuildGeometry();
    });
  });

  // 重置按钮会把 params 恢复成 defaults，同时把 DOM 控件值也一起恢复。
  resetButton.addEventListener('click', () => {
    Object.assign(params, clonePrimitiveParams(definition));
    definition.controls.forEach((control) => {
      const input = container.querySelector(`[data-control-key="${control.key}"]`);
      if (!input) return;
      if (control.type === 'boolean') {
        input.checked = params[control.key];
      } else {
        input.value = params[control.key];
      }
    });
    rebuildGeometry();
  });

  // 详情页只渲染一个图元，所以这里是标准的单场景渲染循环。
  function render(time) {
    if (disposed) return;
    const seconds = time * 0.001;
    preview.setRotation(seconds, 0);
    renderer.render(preview.scene, preview.camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  updateValueLabels();
  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

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

