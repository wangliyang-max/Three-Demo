import * as THREE from 'three';
import { clonePrimitiveParams, getPrimitiveCode, primitiveCatalog } from '../components/primitives/primitives-data.js';
import { createPrimitivePreview } from '../components/primitives/primitives-preview.js';

// 图元总览页只负责两件事：
// 1. 生成卡片 DOM，让用户能看到名称、简介、代码片段和详情入口。
// 2. 用一个共享的 Three.js renderer，把每张卡片的小预览画到对应区域。
// 这样做的好处是避免“每张卡片一个 renderer”的高开销方案，
// 同时保留每张卡片都像有独立预览窗口一样的视觉效果。
export function mountPrimitivesPage(container) {
  container.innerHTML = `
    <style>
      .primitives-page { display: grid; gap: 18px; }
      .primitives-page .viewer-copy p + p { margin-top: 12px; }
      .primitives-stage {
        min-height: auto;
        overflow: visible;
        position: relative;
        padding: 22px;
        background:
          radial-gradient(circle at top left, rgba(109, 211, 206, 0.12), transparent 32%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.08), transparent 40%),
          #0d1016;
      }
      .primitives-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 18px;
        position: relative;
        z-index: 1;
      }
      .primitive-card {
        display: grid;
        gap: 14px;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.04), transparent),
          rgba(18, 21, 30, 0.88);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
        transition: transform 180ms ease, border-color 180ms ease;
      }
      .primitive-card:hover {
        transform: translateY(-3px);
        border-color: rgba(109, 211, 206, 0.38);
      }
      .primitive-card__preview {
        position: relative;
        min-height: 188px;
        border: 1px solid rgba(109, 211, 206, 0.14);
        border-radius: 18px;
        background:
          radial-gradient(circle at 50% 22%, rgba(255, 255, 255, 0.16), transparent 34%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.18), rgba(109, 211, 206, 0.04)),
          #10141d;
        overflow: hidden;
      }
      .primitive-card__preview::after {
        content: '';
        position: absolute;
        inset: auto 14px 14px 14px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
      }
      .primitive-card__title { margin: 0; font-size: 1.04rem; font-weight: 700; }
      .primitive-card__label { margin: 4px 0 0; color: var(--accent); font-size: 0.9rem; }
      .primitive-card__summary { margin: 0; color: var(--muted); line-height: 1.65; font-size: 0.93rem; }
      .primitive-card__code {
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
      .primitive-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 0.88rem;
      }
      .primitive-card__link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(109,211,206,0.26);
        color: var(--accent);
        background: rgba(109,211,206,0.08);
      }
      .primitives-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
      }
      @media (max-width: 760px) {
        .primitives-stage { padding: 16px; }
        .primitive-card { padding: 16px; }
        .primitive-card__preview { min-height: 170px; }
      }
    </style>

    <section class="page primitives-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/primitives</p>
        <h2>Three.js 图元总览</h2>
        <p>这里是图元入口页。每张卡片展示一个图元的默认外观、构造代码和简短用途说明。</p>
        <p>点击卡片右下角的“查看详情”后，会进入独立详情页，看到更大的预览、参数滑块、参数解释和典型用途。</p>
      </div>
      <div class="viewer-stage primitives-stage" data-stage>
        <div class="primitives-grid">
          ${primitiveCatalog
            .map((definition, index) => {
              // 这里用默认参数生成一段“静态代码预览”，目的是让用户先看到基础写法。
              // clonePrimitiveParams 用来避免直接引用 catalog 里的默认对象，防止后续哪里误改时影响源数据。
              const code = getPrimitiveCode(definition, clonePrimitiveParams(definition));
              return `
                <article class="primitive-card">
                  <div class="primitive-card__preview" data-preview-index="${index}"></div>
                  <div>
                    <p class="primitive-card__title">${definition.name}</p>
                    <p class="primitive-card__label">${definition.label}</p>
                  </div>
                  <p class="primitive-card__summary">${definition.summary}</p>
                  <pre class="primitive-card__code">${code}</pre>
                  <div class="primitive-card__footer">
                    <span>支持滑块调参和参数说明</span>
                    <a class="primitive-card__link" href="#/primitives/${definition.id}">查看详情</a>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    </section>
  `;

  // stage 是整个图元页里承载共享 canvas 的容器。
  // 所有小预览最终都画在这个容器上方的一张大 canvas 里。
  const stage = container.querySelector('[data-stage]');

  // 收集每张卡片的预览占位元素，后面会根据它们的真实屏幕位置来设置 viewport。
  const previewElements = Array.from(container.querySelectorAll('[data-preview-index]'));

  // 只创建一个 renderer，是这个页面最关键的设计点。
  // 如果每张卡片都单独 new WebGLRenderer：
  // 1. 资源开销会明显增大。
  // 2. DOM 里会有很多 canvas，不利于统一管理。
  // 3. 切页和销毁也会更麻烦。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  // autoClear 关闭以后，我们可以在同一帧里手动清屏，再多次绘制不同区域。
  renderer.autoClear = false;

  // scissor test 开启后，renderer 只会在我们指定的矩形区域里绘制。
  // 这正是“一张 canvas 伪装成多张预览窗”的核心机制之一。
  renderer.setScissorTest(true);

  // 画布本身透明，这样卡片自己的背景和边框仍然能透出来。
  renderer.setClearColor(0x000000, 0);

  // 色调映射让预览里的材质和灯光表现更柔和一些，看起来不会太生硬。
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // 这张共享 canvas 绝对定位覆盖在整个 stage 上面。
  // pointer-events: none 能保证用户点击“查看详情”按钮时，不会被 canvas 挡住。
  renderer.domElement.className = 'primitives-overlay';
  stage.appendChild(renderer.domElement);

  // 这里先把每张卡片对应的 preview 数据准备好。
  // 注意：createPrimitivePreview 只是在内存里创建 scene / camera / mesh，
  // 真正渲染到页面是在下面的 render() 循环里完成。
  const previews = primitiveCatalog.map((definition, index) => ({
    element: previewElements[index],
    preview: createPrimitivePreview(definition, clonePrimitiveParams(definition)),
  }));

  // 维护动画循环的状态。
  // disposed 用来阻止卸载后的继续渲染。
  // animationFrameId 用来在切页时取消 requestAnimationFrame。
  let animationFrameId = 0;
  let disposed = false;

  // 共享 renderer 的尺寸要始终和 stage 保持一致。
  // 因为所有卡片预览的 viewport 都是基于这个总画布来切分的。
  function resizeRenderer() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  // 总览页使用一个共享 renderer，然后通过 viewport / scissor
  // 把同一个 canvas 切成很多小区域，看起来就像每张卡片都有自己的预览窗口。
  function render(time) {
    if (disposed) return;

    const viewportWidth = Math.max(stage.clientWidth, 1);
    const viewportHeight = Math.max(stage.clientHeight, 1);

    // stageRect 是共享画布容器在页面中的位置。
    // 后面每张卡片的 rect 都要减去它，才能得到“相对于 stage 的局部坐标”。
    const stageRect = stage.getBoundingClientRect();

    // 记录当前窗口尺寸，用于快速跳过完全不在可视区内的卡片，减少无意义渲染。
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const seconds = time * 0.001;

    // 先把整张共享画布清干净。
    renderer.setViewport(0, 0, viewportWidth, viewportHeight);
    renderer.setScissor(0, 0, viewportWidth, viewportHeight);
    renderer.clear(true, true, true);

    previews.forEach(({ element, preview }, index) => {
      const rect = element.getBoundingClientRect();

      // 如果这张卡片太小，或者完全不在视口里，就直接跳过。
      // 这样可以少做很多没意义的 draw call。
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.top > windowHeight || rect.right < 0 || rect.left > windowWidth) {
        return;
      }

      // 把卡片的页面坐标换算成“相对于 stage”的局部坐标。
      const left = Math.floor(rect.left - stageRect.left);
      const top = Math.floor(rect.top - stageRect.top);
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);

      // WebGL 的 viewport 原点在左下角，DOM 的 rect 原点在左上角，
      // 所以这里要额外换算一次 bottom。
      const bottom = Math.floor(viewportHeight - top - height);

      // 每个小预览都有自己的 camera，但共享同一张 renderer。
      // 当卡片尺寸变化时，相机宽高比也要同步更新。
      preview.camera.aspect = width / height;
      preview.camera.updateProjectionMatrix();

      // setRotation 会根据时间和索引给不同图元一点不同的转动节奏，
      // 避免所有卡片都完全同步，看起来更死板。
      preview.setRotation(seconds, index);

      // 下面这两行就是多视口渲染的关键：
      // 1. viewport 决定这次渲染输出到共享 canvas 的哪一块区域。
      // 2. scissor 保证只在那块区域内真正写像素。
      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);
      renderer.render(preview.scene, preview.camera);
    });

    animationFrameId = window.requestAnimationFrame(render);
  }

  // 初始化时先同步一次尺寸，再开始监听窗口变化和启动动画循环。
  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  animationFrameId = window.requestAnimationFrame(render);

  // 返回卸载函数。
  // 路由切走时必须把动画、事件和所有 preview 的 WebGL 资源都清掉。
  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeRenderer);

    // 每个 preview 内部都有自己的 scene / geometry / material，
    // 这里统一调用 dispose，避免切页后显存残留。
    previews.forEach(({ preview }) => preview.dispose());

    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}
