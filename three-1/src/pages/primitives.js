import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetikerRegular from 'three/examples/fonts/helvetiker_regular.typeface.json';

// TextGeometry 需要先把字体 JSON 解析成 three.js 可识别的字体对象。
const parsedFont = new FontLoader().parse(helvetikerRegular);

function createStarShape() {
  const shape = new THREE.Shape();
  const outerRadius = 0.95;
  const innerRadius = 0.42;

  // 用内外半径交替的 10 个点拼一个五角星轮廓，给 ExtrudeGeometry 使用。
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

function createTriangleShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1);
  shape.lineTo(-0.95, -0.7);
  shape.lineTo(0.95, -0.7);
  shape.closePath();
  return shape;
}

function createLathePoints() {
  // LatheGeometry 需要一组 2D 轮廓点，这里画的是类似酒瓶 / 烛台的侧面线稿。
  return [
    new THREE.Vector2(0, -1.7),
    new THREE.Vector2(0.3, -1.7),
    new THREE.Vector2(0.44, -1.3),
    new THREE.Vector2(0.36, -0.6),
    new THREE.Vector2(0.3, 0.1),
    new THREE.Vector2(0.22, 0.8),
    new THREE.Vector2(0.15, 1.25),
    new THREE.Vector2(0.12, 1.55),
    new THREE.Vector2(0.18, 1.82),
    new THREE.Vector2(0, 1.82),
  ];
}

function createPolyhedronGeometry() {
  // PolyhedronGeometry 需要手动提供顶点和三角面索引。
  // 这里先给一个立方体的顶点，再让 three.js 把它投影成球面风格的多面体。
  const vertices = [
    -1, -1, -1,
    1, -1, -1,
    1, 1, -1,
    -1, 1, -1,
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1,
  ];

  const indices = [
    0, 1, 2, 2, 3, 0,
    4, 7, 6, 6, 5, 4,
    0, 4, 5, 5, 1, 0,
    1, 5, 6, 6, 2, 1,
    2, 6, 7, 7, 3, 2,
    3, 7, 4, 4, 0, 3,
  ];

  return new THREE.PolyhedronGeometry(vertices, indices, 0.92, 1);
}

function createTubePath() {
  // TubeGeometry 会沿着这条三维曲线生成一根圆管。
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, -0.2, -0.55),
    new THREE.Vector3(-0.55, 0.6, 0.28),
    new THREE.Vector3(-0.1, -0.45, 0.78),
    new THREE.Vector3(0.52, 0.38, 0.05),
    new THREE.Vector3(1, -0.15, -0.72),
  ]);
}

function waveSurface(u, v, target) {
  // ParametricGeometry 的核心是把二维参数 (u, v) 映射成三维坐标 (x, y, z)。
  const x = (u - 0.5) * 2.3;
  const z = (v - 0.5) * 2.3;
  const y =
    Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * 0.34 +
    Math.sin(v * Math.PI * 3) * 0.08;

  target.set(x, y, z);
}

// 所有图元都通过这份配置统一管理，页面渲染时直接遍历它来生成卡片和预览。
const primitiveDefinitions = [
  {
    name: 'BoxGeometry',
    label: '盒子',
    signature: 'new THREE.BoxGeometry(1.2, 1.2, 1.2, 2, 2, 2)',
    note: '长宽高都可以继续细分。',
    color: 0x6dd3ce,
    createGeometry: () => new THREE.BoxGeometry(1.2, 1.2, 1.2, 2, 2, 2),
    baseRotationX: 0.45,
    baseRotationY: 0.55,
  },
  {
    name: 'CircleGeometry',
    label: '平面圆',
    signature: 'new THREE.CircleGeometry(0.9, 48)',
    note: '二维圆面，常配合贴图或 UI 面片使用。',
    color: 0x9cf0b6,
    createGeometry: () => new THREE.CircleGeometry(0.9, 48),
    baseRotationX: -0.95,
    baseRotationY: 0.35,
  },
  {
    name: 'ConeGeometry',
    label: '锥形',
    signature: 'new THREE.ConeGeometry(0.72, 1.6, 48, 1)',
    note: '半径、长度和径向分段都可调。',
    color: 0xf5b971,
    createGeometry: () => new THREE.ConeGeometry(0.72, 1.6, 48, 1),
    baseRotationX: 0.28,
    baseRotationY: 0.45,
  },
  {
    name: 'CylinderGeometry',
    label: '圆柱',
    signature: 'new THREE.CylinderGeometry(0.65, 0.65, 1.5, 40)',
    note: '上下半径不同就能变成截头圆锥。',
    color: 0xe68ca8,
    createGeometry: () => new THREE.CylinderGeometry(0.65, 0.65, 1.5, 40),
    baseRotationX: 0.28,
    baseRotationY: 0.5,
  },
  {
    name: 'OctahedronGeometry',
    label: '八面体',
    signature: 'new THREE.OctahedronGeometry(0.95, 0)',
    note: '8 个面，适合低模风格。',
    color: 0x8ea7ff,
    createGeometry: () => new THREE.OctahedronGeometry(0.95, 0),
    baseRotationX: 0.55,
    baseRotationY: 0.58,
  },
  {
    name: 'DodecahedronGeometry',
    label: '十二面体',
    signature: 'new THREE.DodecahedronGeometry(0.9, 0)',
    note: '由 12 个五边形面组成。',
    color: 0xffc857,
    createGeometry: () => new THREE.DodecahedronGeometry(0.9, 0),
    baseRotationX: 0.42,
    baseRotationY: 0.62,
  },
  {
    name: 'ExtrudeGeometry',
    label: '挤压 2D 形状',
    signature: 'new THREE.ExtrudeGeometry(starShape, { depth: 0.45, bevelEnabled: true })',
    note: '这里用五角星轮廓做了带倒角的挤出。',
    color: 0x5dd39e,
    createGeometry: () =>
      new THREE.ExtrudeGeometry(createStarShape(), {
        depth: 0.45,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.06,
        bevelThickness: 0.08,
      }),
    baseRotationX: -0.35,
    baseRotationY: 0.55,
  },
  {
    name: 'IcosahedronGeometry',
    label: '二十面体',
    signature: 'new THREE.IcosahedronGeometry(0.92, 0)',
    note: '20 个三角面，常见于低模球体。',
    color: 0x7fc8f8,
    createGeometry: () => new THREE.IcosahedronGeometry(0.92, 0),
    baseRotationX: 0.38,
    baseRotationY: 0.55,
  },
  {
    name: 'LatheGeometry',
    label: '旋转成型',
    signature: 'new THREE.LatheGeometry(points(10), 32)',
    note: '10 个 2D 轮廓点绕 Y 轴旋转 32 段，可做酒瓶、蜡烛台、玻璃杯。',
    color: 0xf08a5d,
    createGeometry: () => new THREE.LatheGeometry(createLathePoints(), 32),
    baseRotationX: 0.14,
    baseRotationY: 0.42,
    distanceMultiplier: 1.9,
  },
  {
    name: 'ParametricGeometry',
    label: '参数曲面',
    signature: 'new ParametricGeometry((u, v) => xyz, 32, 32)',
    note: '把二维网格里的 (u, v) 映射成三维波浪曲面。',
    color: 0x72efdd,
    createGeometry: () => new ParametricGeometry(waveSurface, 32, 32),
    baseRotationX: -0.7,
    baseRotationY: 0.35,
    distanceMultiplier: 1.75,
  },
  {
    name: 'PlaneGeometry',
    label: '2D 平面',
    signature: 'new THREE.PlaneGeometry(1.8, 1.1, 8, 6)',
    note: '最常见的二维面片，适合贴图、屏幕和地板。',
    color: 0xa1c181,
    createGeometry: () => new THREE.PlaneGeometry(1.8, 1.1, 8, 6),
    baseRotationX: -0.95,
    baseRotationY: 0.28,
  },
  {
    name: 'PolyhedronGeometry',
    label: '多面体投影',
    signature: 'new THREE.PolyhedronGeometry(vertices, indices, 0.92, 1)',
    note: '先给顶点和三角面，再投影到球面上。',
    color: 0xf7a072,
    createGeometry: () => createPolyhedronGeometry(),
    baseRotationX: 0.4,
    baseRotationY: 0.55,
  },
  {
    name: 'RingGeometry',
    label: '中空圆盘',
    signature: 'new THREE.RingGeometry(0.4, 0.9, 48)',
    note: '内半径和外半径共同决定“洞”的大小。',
    color: 0xb8c0ff,
    createGeometry: () => new THREE.RingGeometry(0.4, 0.9, 48),
    baseRotationX: -1.05,
    baseRotationY: 0.42,
  },
  {
    name: 'ShapeGeometry',
    label: '2D 三角轮廓',
    signature: 'new THREE.ShapeGeometry(triangleShape, 8)',
    note: '把二维 Shape 直接三角化成平面网格。',
    color: 0xf4d35e,
    createGeometry: () => new THREE.ShapeGeometry(createTriangleShape(), 8),
    baseRotationX: -0.9,
    baseRotationY: 0.38,
  },
  {
    name: 'SphereGeometry',
    label: '球体',
    signature: 'new THREE.SphereGeometry(0.9, 48, 32)',
    note: '经纬分段越高，球体越圆滑。',
    color: 0x6c9bd2,
    createGeometry: () => new THREE.SphereGeometry(0.9, 48, 32),
    baseRotationX: 0.36,
    baseRotationY: 0.52,
  },
  {
    name: 'TetrahedronGeometry',
    label: '四面体',
    signature: 'new THREE.TetrahedronGeometry(1)',
    note: '4 个三角面，是最简单的规则多面体。',
    color: 0xff7b72,
    createGeometry: () => new THREE.TetrahedronGeometry(1),
    baseRotationX: 0.55,
    baseRotationY: 0.6,
  },
  {
    name: 'TextGeometry',
    label: '3D 文字',
    signature: 'new TextGeometry("Three", { font, size: 0.45, depth: 0.18 })',
    note: '使用 helvetiker 字体 JSON，把字符串直接变成三维实体。',
    color: 0x7bdff2,
    createGeometry: () =>
      new TextGeometry('Three', {
        font: parsedFont,
        size: 0.45,
        depth: 0.18,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 3,
      }),
    baseRotationX: -0.18,
    baseRotationY: 0.42,
    distanceMultiplier: 1.9,
  },
  {
    name: 'TorusGeometry',
    label: '圆环体',
    signature: 'new THREE.TorusGeometry(0.65, 0.22, 20, 64)',
    note: '甜甜圈形体，主半径和管半径最关键。',
    color: 0xcdb4db,
    createGeometry: () => new THREE.TorusGeometry(0.65, 0.22, 20, 64),
    baseRotationX: 0.88,
    baseRotationY: 0.25,
  },
  {
    name: 'TorusKnotGeometry',
    label: '环形节',
    signature: 'new THREE.TorusKnotGeometry(0.55, 0.18, 100, 16, 2, 3)',
    note: '通过 p / q 参数控制缠绕方式。',
    color: 0x80ed99,
    createGeometry: () => new THREE.TorusKnotGeometry(0.55, 0.18, 100, 16, 2, 3),
    baseRotationX: 0.72,
    baseRotationY: 0.28,
  },
  {
    name: 'TubeGeometry',
    label: '沿路径生成圆管',
    signature: 'new THREE.TubeGeometry(path, 64, 0.14, 16, false)',
    note: '圆管沿 CatmullRomCurve3 路径挤出，常用于电缆、轨道、流线。',
    color: 0x4ecdc4,
    createGeometry: () => new THREE.TubeGeometry(createTubePath(), 64, 0.14, 16, false),
    baseRotationX: 0.4,
    baseRotationY: 0.25,
    distanceMultiplier: 1.85,
  },
];

function frameContent(content, camera, distanceMultiplier = 1.65) {
  // 根据包围盒自动计算相机距离，让不同大小的图元都能完整显示在卡片里。
  const box = new THREE.Box3().setFromObject(content);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const fitHeightDistance =
    maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  const distance = fitHeightDistance * distanceMultiplier;

  content.position.sub(center);
  camera.position.set(distance * 0.62, distance * 0.48, distance * 1.1);
  camera.near = Math.max(distance / 100, 0.1);
  camera.far = distance * 8;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function disposeMaterial(material) {
  // three.js 里的材质和几何体都要手动释放，否则切换页面时会积累 GPU 资源。
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

function createPreview(definition, element) {
  // 每张卡片对应一个独立 scene + camera，但所有卡片共享一个 renderer。
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const pivot = new THREE.Group();
  const content = new THREE.Group();
  const geometry = definition.createGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: definition.color,
    roughness: 0.32,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  // 叠一层边线，方便看清图元的轮廓和分段。
  const edgeGeometry = new THREE.EdgesGeometry(geometry, 18);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

  scene.add(
    new THREE.HemisphereLight(0xffffff, 0x12141c, 1.2),
  );

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(2.6, 3.2, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8ea7ff, 1.1);
  rimLight.position.set(-2.2, 1.8, -3.4);
  scene.add(rimLight);

  content.add(mesh, edges);
  pivot.add(content);
  scene.add(pivot);

  frameContent(content, camera, definition.distanceMultiplier);

  return {
    element,
    scene,
    camera,
    pivot,
    geometry,
    material,
    edgeGeometry,
    edgeMaterial,
    baseRotationX: definition.baseRotationX ?? 0.3,
    baseRotationY: definition.baseRotationY ?? 0.45,
    baseRotationZ: definition.baseRotationZ ?? 0,
  };
}

export function mountPrimitivesPage(container) {
  // 第一步：先用 innerHTML 一次性生成页面结构。
  // 这里只创建普通 DOM 卡片，每张卡片里预留一个 .primitive-card__preview 容器，
  // three.js 的内容稍后再根据这些容器的位置逐个渲染进去。
  container.innerHTML = `
    <style>
      .primitives-page {
        display: grid;
        gap: 18px;
      }

      .primitives-page .viewer-copy p + p {
        margin-top: 12px;
      }

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
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
          linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent),
          rgba(18, 21, 30, 0.88);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
      }

      .primitive-card__preview {
        position: relative;
        min-height: 180px;
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
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
      }

      .primitive-card__header {
        display: grid;
        gap: 6px;
      }

      .primitive-card__name {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 700;
      }

      .primitive-card__label {
        margin: 0;
        color: var(--accent);
        font-size: 0.9rem;
      }

      .primitive-card__signature {
        margin: 0;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(9, 11, 16, 0.7);
        color: #d8def0;
        font-size: 0.84rem;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .primitive-card__note {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
        font-size: 0.92rem;
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
        .primitives-stage {
          padding: 16px;
        }

        .primitive-card {
          padding: 16px;
        }

        .primitive-card__preview {
          min-height: 160px;
        }
      }
    </style>

    <section class="page primitives-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/primitives</p>
        <h2>Three.js 常见图元画廊</h2>
        <p>
          这一页把常见的几何图元集中展示出来。每张卡片都包含图元名称、构造参数和实时旋转的渲染效果，
          方便直接对照学习。
        </p>
        <p>
          对于 <code>LatheGeometry</code>、<code>ParametricGeometry</code>、
          <code>TubeGeometry</code>、<code>TextGeometry</code> 这类稍微特殊的图元，
          也额外写了轮廓点、参数曲面、路径和字体来源说明。
        </p>
      </div>
      <div class="viewer-stage primitives-stage" data-stage>
        <div class="primitives-grid">
          <!--
            第二步：遍历 primitiveDefinitions 生成一张张卡片。
            data-preview-index 用来把“第几个 DOM 预览框”和“第几个 three.js 场景配置”对应起来。
          -->
          ${primitiveDefinitions
            .map(
              (definition, index) => `
                <article class="primitive-card">
                  <div class="primitive-card__preview" data-preview-index="${index}"></div>
                  <div class="primitive-card__header">
                    <p class="primitive-card__name">${definition.name}</p>
                    <p class="primitive-card__label">${definition.label}</p>
                  </div>
                  <pre class="primitive-card__signature">${definition.signature}</pre>
                  <p class="primitive-card__note">${definition.note}</p>
                </article>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  // 这里拿到所有预览框 DOM，后面 createPreview 会按相同索引给它们绑定 three.js 预览数据。
  const previewElements = Array.from(container.querySelectorAll('[data-preview-index]'));

  // 用一个共享的 renderer 做多区域裁剪渲染，避免每张卡片都占用一个 WebGL 上下文。
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.autoClear = false;
  renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.className = 'primitives-overlay';
  stage.appendChild(renderer.domElement);

  // 第三步：根据配置项 + 对应的预览框 DOM，创建每张卡片自己的 scene / camera / mesh 数据。
  // 注意 createPreview 只是“准备好要渲染什么”，真正画到页面上是在下面的 render() 里完成的。
  const previews = primitiveDefinitions.map((definition, index) =>
    createPreview(definition, previewElements[index]),
  );

  let animationFrameId = 0;
  let disposed = false;

  function resizeRenderer() {
    // 让共享 canvas 覆盖整个 stage，而不是固定在视口上。
    // 这样滚动时 canvas 会和卡片一起移动，不会再出现 fixed 图层跟不上页面滚动的问题。
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function render(time) {
    if (disposed) {
      return;
    }

    const viewportWidth = Math.max(stage.clientWidth, 1);
    const viewportHeight = Math.max(stage.clientHeight, 1);
    const stageRect = stage.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const seconds = time * 0.001;

    renderer.setViewport(0, 0, viewportWidth, viewportHeight);
    renderer.setScissor(0, 0, viewportWidth, viewportHeight);
    renderer.clear(true, true, true);

    previews.forEach((preview, index) => {
      const rect = preview.element.getBoundingClientRect();

      // 不在可视区域内的卡片直接跳过，减少无意义渲染。
      if (
        rect.width < 1 ||
        rect.height < 1 ||
        rect.bottom < 0 ||
        rect.top > windowHeight ||
        rect.right < 0 ||
        rect.left > windowWidth
      ) {
        return;
      }

      // 这里不用视口坐标，而是换算成“相对于 stage 左上角”的坐标。
      // 因为 renderer 现在和 stage 一起滚动，坐标体系也要跟着切到 stage 内部。
      const left = Math.floor(rect.left - stageRect.left);
      const top = Math.floor(rect.top - stageRect.top);
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      const bottom = Math.floor(viewportHeight - top - height);

      // 第四步：读取当前预览框在页面里的实际位置和尺寸，
      // 再用 setViewport / setScissor 把共享 canvas 的绘制区域裁到这一个小格子里。
      // 所以页面上看起来像“很多独立小画布”，实际底层只有一个 renderer。
      preview.camera.aspect = width / height;
      preview.camera.updateProjectionMatrix();

      // 在基础角度上叠加一点缓慢旋转，让模型更容易观察体积。
      preview.pivot.rotation.x =
        preview.baseRotationX + Math.sin(seconds * 0.85 + index * 0.3) * 0.08;
      preview.pivot.rotation.y = preview.baseRotationY + seconds * 0.72;
      preview.pivot.rotation.z =
        preview.baseRotationZ + Math.sin(seconds * 0.55 + index * 0.5) * 0.04;

      renderer.setViewport(left, bottom, width, height);
      renderer.setScissor(left, bottom, width, height);

      // 第五步：把当前卡片对应的 scene 渲染到它自己的小区域中。
      renderer.render(preview.scene, preview.camera);
    });

    animationFrameId = window.requestAnimationFrame(render);
  }

  resizeRenderer();
  window.addEventListener('resize', resizeRenderer);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeRenderer);

    // 页面卸载时显式释放 geometry / material / renderer，避免内存和显存泄漏。
    previews.forEach((preview) => {
      preview.geometry.dispose();
      preview.edgeGeometry.dispose();
      preview.edgeMaterial.dispose();
      disposeMaterial(preview.material);
    });

    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}
