import * as THREE from 'three';

// 创建轨道辅助线。
// radius 是轨道的半径 color 是线的颜色，调用方可以根据需要创建不同半径、不同颜色的轨道线。
// 这里不使用 CircleGeometry，而是手动采样一圈点，原因是：
// 1. 我们只需要一条轻量的环形线，不需要可填充的面。
// 2. 手动生成点以后，可以直接喂给 BufferGeometry，结构简单且容易控制透明度。
// 3. 轨道线本身只是教学辅助，不参与任何物理计算，只负责把“公转半径”可视化。
function createOrbitRing(radius, color) {
  const points = [];

  // 采样 0 到 2π 的圆周点。
  // 128 段对这个页面已经足够平滑，同时不会带来不必要的几何开销。
  for (let i = 0; i <= 128; i += 1) {
    const angle = (i / 128) * Math.PI * 2;
    // x y z 三个方向
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  // 把离散点转成 GPU 可直接使用的缓冲几何体。
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // 轨道线用半透明材质即可。
  // 它的作用是“解释层级关系”，不是成为画面主体，所以透明度故意压低。
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 });

  // LineLoop 会自动把最后一个点和第一个点连接起来，正好适合闭合圆环。
  const line = new THREE.LineLoop(geometry, material);

  // 调用方需要在卸载时手动释放 geometry / material，
  // 所以这里把 line 和底层资源一起返回。
  return { line, geometry, material };
}

// 创建围绕球体的 2D 光晕精灵。
// 这个方案的目标不是模拟真实体积光，而是用一层始终朝向镜头的柔光片，
// 轻量地给“发光源”增加一点外扩感。
function createGlowSprite({ color, size, opacity }) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const context = canvas.getContext('2d');

  // 径向渐变从中心最亮、边缘完全透明。
  // 这样贴到 Sprite 上之后，外圈会自然衰减，不会出现硬边。
  const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.28, 'rgba(255, 255, 255, 0.75)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.22)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 把 canvas 转成 Three.js 纹理，后续交给 SpriteMaterial 使用。
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    // 光晕不应该写入深度缓冲，否则容易把后面的对象错误遮住。
    depthWrite: false,
    // 叠加混合会让光晕更像“向外发亮”，比普通 alpha 混合更适合这种效果。
    blending: THREE.AdditiveBlending,
  });

  // Sprite 始终朝向相机。
  // 对这个页面来说，它最大的优点是便宜、稳定，而且很适合做“发光边缘”的视觉辅助。
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);

  return { sprite, texture, material };
}

// 创建太阳表面的轻量纹理。
// 这里不是追求真实太阳贴图，而是提供一点横向流动和斑块变化，
// 让太阳表面不至于是一整片纯色，同时保留教学页面需要的简单结构。
function createSunSurfaceTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;

  const context = canvas.getContext('2d');

  // 先铺一层基础橙红色，作为整个太阳表面的底色。
  context.fillStyle = '#d96b14';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 叠加横向色带。
  // 横向条带能让球体旋转时更容易被感知，也更符合太阳表面“流动层”的视觉印象。
  for (let i = 0; i < 18; i += 1) {
    const y = (i / 18) * canvas.height;
    const height = 12 + Math.random() * 42;
    const alpha = 0.08 + Math.random() * 0.12;
    context.fillStyle = `rgba(255, ${130 + Math.floor(Math.random() * 40)}, ${40 + Math.floor(Math.random() * 30)}, ${alpha})`;
    context.fillRect(0, y, canvas.width, height);
  }

  // 再叠加一些径向热斑。
  // 这些热斑的作用不是高频细节，而是打破颜色均匀度，让表面更有“活着”的感觉。
  for (let i = 0; i < 90; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 16 + Math.random() * 46;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, 'rgba(255, 222, 148, 0.22)');
    glow.addColorStop(0.55, 'rgba(255, 148, 48, 0.1)');
    glow.addColorStop(1, 'rgba(255, 120, 32, 0)');
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);

  // 告诉 Three.js 这张贴图是 sRGB 色域，避免颜色在渲染时发灰。
  texture.colorSpace = THREE.SRGBColorSpace;

  // 让纹理在 U 方向可重复，后面我们会通过 offset.x 做轻微滚动。
  texture.wrapS = THREE.RepeatWrapping;

  // V 方向不需要重复，因为我们不希望上下边缘出现硬拼接。
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return texture;
}

// 页面挂载函数。
// 这个项目里的每个示例页都遵循同一个模式：
// 1. 先把页面 HTML 填进去。
// 2. 创建 Three.js 场景、相机、渲染器和对象。
// 3. 启动动画循环。
// 4. 返回一个卸载函数，负责清理监听器和 GPU 资源。
export function mountSolarSystemPage(container) {
  container.innerHTML = `
    <section class="page solar-system-page">
      <div class="viewer-copy solar-system-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/solar-system</p>
        <h2>太阳系 Scene Graph</h2>
        <p>
          这个版本保留了 three.js 手册里“父节点带着子节点一起动”的核心思路，
          但把视觉效果做得更直观一些。你可以把它理解成一个层级链：太阳系根节点带着地球轨道转，
          地球轨道再带着地球和月亮轨道一起转。
        </p>
        <div class="solar-system-legend" aria-label="层级说明">
          <div class="solar-system-legend__item">
            <span class="solar-system-legend__swatch solar-system-legend__swatch--sun"></span>
            <div>
              <strong>太阳</strong>
              <p>放在场景中心，既是视觉焦点，也作为点光源的位置参考。</p>
            </div>
          </div>
          <div class="solar-system-legend__item">
            <span class="solar-system-legend__swatch solar-system-legend__swatch--earth"></span>
            <div>
              <strong>地球轨道与地球</strong>
              <p>地球并不是直接绕场景旋转，而是挂在轨道节点上，让公转关系更清晰。</p>
            </div>
          </div>
          <div class="solar-system-legend__item">
            <span class="solar-system-legend__swatch solar-system-legend__swatch--moon"></span>
            <div>
              <strong>月亮轨道与月亮</strong>
              <p>月亮轨道继续挂在地球下面，所以地球一动，月亮会被整组一起带走。</p>
            </div>
          </div>
        </div>
        <pre class="solar-system-code">solarSystem
└─ sunMesh
   └─ sunGlow
└─ earthOrbit
   └─ earthMesh
      └─ earthGlow
   └─ moonOrbit
      └─ moonMesh
         └─ moonGlow</pre>
      </div>
      <div class="viewer-stage solar-system-stage" data-stage></div>
    </section>
  `;

  // Three.js 画布最终会插到这个容器里。
  const stage = container.querySelector('[data-stage]');

  // Scene 是所有 3D 对象的根容器。
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);

  // 透视相机负责把 3D 世界投影到 2D 屏幕上。
  // 这里用 45 度视野，近裁剪面 0.1，远裁剪面 100，足够覆盖当前场景范围。
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  // 相机稍微抬高并后撤，让太阳、地球、月亮的层级关系更容易整体看清。
  camera.position.set(0, 8, 18);
  camera.lookAt(0, 0, 0);

  // WebGLRenderer 负责真正把场景渲染到 canvas。
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  // 高 DPI 屏幕上适度提升像素比，2 作为上限是为了平衡清晰度和性能。
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);

  // 环境光只提供一层非常弱的底亮，避免暗面完全黑死。
  // 这里故意压得比较低，是为了给太阳本体保留更清楚的明暗层次。
  scene.add(new THREE.AmbientLight(0x74779a, 0.2));

  // 主光决定太阳最主要的亮面方向。
  // 这盏灯打得更斜、更集中，目的是让太阳表面出现明显的亮面到暗面的过渡。
  const sunKeyLight = new THREE.DirectionalLight(0xffcf8a, 1.65);
  sunKeyLight.position.set(5, 2.4, 4.5);
  scene.add(sunKeyLight);

  // 辅光只轻轻提一点背光侧，不让暗面完全丢细节。
  // 如果辅光太强，太阳又会回到“整体都很亮”的状态，球感会被冲掉。
  const sunFillLight = new THREE.DirectionalLight(0xff7c32, 0.16);
  sunFillLight.position.set(-3.5, -2, -3.5);
  scene.add(sunFillLight);

  // 点光源承担“太阳正在向外照亮周围空间”的感觉。
  // 它和主光的职责不同：主光负责球面体积感，点光负责发光源氛围。
  const sunLight = new THREE.PointLight(0xffefb3, 2.05, 82, 2);
  scene.add(sunLight);

  // 下面开始建立 scene graph 层级：
  // solarSystem
  // └─ earthOrbit
  //    └─ earthMesh
  //    └─ moonOrbit
  //       └─ moonMesh
  // 这样的结构可以让“父节点带动子节点”非常直观。
  const solarSystem = new THREE.Object3D();
  const earthOrbit = new THREE.Object3D();
  const moonOrbit = new THREE.Object3D();

  // 将所有轨道和天体添加到场景中
  scene.add(solarSystem);
  // 将地球轨道添加到太阳系节点下
  solarSystem.add(earthOrbit);

  // 创建太阳本体需要用到的贴图和几何。
  const sunSurfaceTexture = createSunSurfaceTexture();
  const sunGeometry = new THREE.SphereGeometry(2.2, 48, 48);
  const sunMaterial = new THREE.MeshStandardMaterial({
    // map 负责提供表面细节，让太阳不至于是一块纯色球面。
    map: sunSurfaceTexture,
    color: 0xffc06a,
    emissive: 0xff7924,
    // 自发光压低一些，给受光层次留空间，不然太阳会更像一张亮圆片。
    emissiveIntensity: 0.2,
    // roughness 拉高，避免表面出现太金属、太镜面的高光。
    roughness: 0.88,
  });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  // 太阳的光晕只做辅助，不再承担“制造球感”的任务。
  // 球感主要依赖前面的受光关系，而不是外圈发亮。
  const sunGlow = createGlowSprite({ color: 0xffa13d, size: 6.5, opacity: 0.32 });
  sunMesh.add(sunGlow.sprite);

  // 将太阳添加到太阳系的根节点
  solarSystem.add(sunMesh);

  // 地球材质不用做太复杂，重点是让 scene graph 的父子关系清楚。
  const earthGeometry = new THREE.SphereGeometry(0.78, 36, 36);
  const earthMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f82ff,
    roughness: 0.72,
    metalness: 0.05,
  });
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

  // 地球也保留一层很轻的光晕，用来让它从背景里更容易被分辨出来。
  const earthGlow = createGlowSprite({ color: 0x54a8ff, size: 2.2, opacity: 0.34 });
  earthMesh.add(earthGlow.sprite);

  // 地球并不是移动 earthOrbit 节点来离太阳“更远”，
  // 而是把地球 mesh 放到 orbit 节点的 x 轴上。
  // 这样只要旋转 orbit 节点，地球就会围着太阳转。
  // !!! 太阳位于中心原点位置
  earthMesh.position.x = 7.5;
  earthOrbit.add(earthMesh);

  // 月亮轨道挂在地球轨道节点下，这样地球公转时会自然带着月亮整组移动。
  // 这里同样把轨道节点先平移到地球所在位置，再通过旋转它来制造月亮公转。
  moonOrbit.position.x = 7.5;
  earthOrbit.add(moonOrbit);

  const moonGeometry = new THREE.SphereGeometry(0.28, 24, 24);
  const moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd6e6,
    roughness: 0.95,
    metalness: 0.02,
  });
  const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

  // 月亮光晕比地球更弱，因为月亮不是本场景里的主要发光主体。
  const moonGlow = createGlowSprite({ color: 0xe7efff, size: 0.95, opacity: 0.24 });
  moonMesh.add(moonGlow.sprite);

  // 月亮相对 moonOrbit 节点再沿 x 轴偏移，后续只要旋转 moonOrbit 就能形成公转。
  moonMesh.position.x = 1.65;
  moonOrbit.add(moonMesh);

  // 地球轨道线属于太阳系这组对象的一部分，所以挂在 solarSystem 下比直接挂 scene 更贴近语义。
  // 它会和太阳系整体保持同一个局部坐标系，但不会挂到负责公转执行的 earthOrbit 节点下面。
  const earthOrbitRing = createOrbitRing(7.5, 0x4db6ff);
  solarSystem.add(earthOrbitRing.line);

  // 月亮轨道线要跟着地球一起绕太阳移动，所以挂在 earthOrbit 下。
  // 但它本身不属于 moonOrbit 这个“执行月亮公转”的旋转节点，因此这里只把圆环平移到地球位置。
  const moonOrbitRing = createOrbitRing(1.65, 0xd5dde9);
  moonOrbitRing.line.position.x = 7.5;
  earthOrbit.add(moonOrbitRing.line);

  // 下面补一层星空背景。
  // 这些星点只是随机散布的 Points，不参与任何交互或动画逻辑。
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 400;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const stride = i * 3;
    starPositions[stride] = (Math.random() - 0.5) * 80;
    starPositions[stride + 1] = (Math.random() - 0.5) * 50;
    starPositions[stride + 2] = (Math.random() - 0.5) * 80;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // 用这两个变量管理动画循环的生命周期。
  // disposed 用来避免卸载后还继续渲染。
  // animationFrameId 用来在销毁时 cancelAnimationFrame。
  let disposed = false;
  let animationFrameId = 0;

  // 每次窗口尺寸变化时，都需要同步更新：
  // 1. 相机宽高比
  // 2. 相机投影矩阵
  // 3. 渲染器输出尺寸
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  // 动画主循环。
  // 这里把“公转”和“自转”分开：
  // 1. 轨道节点 rotation 负责公转
  // 2. 各个 mesh.rotation 负责自转
  function render(time) {
    if (disposed) return;

    const seconds = time * 0.001;

    // solarSystem 整体也轻微转一点，让整个场景不是完全静止的层级示意图。
    solarSystem.rotation.y = seconds * 0.08;

    // 旋转 earthOrbit 节点, (中心点是原点)相当于带着地球围着太阳转。
    earthOrbit.rotation.y = seconds * 0.45;

    // 旋转 moonOrbit 节点, (中心点是地球)相当于带着月亮围着地球转。
    moonOrbit.rotation.y = seconds * 1.8;

    // 下面是三个天体自己的自转。
    sunMesh.rotation.y = seconds * 0.18;
    earthMesh.rotation.y = seconds * 1.7;
    moonMesh.rotation.y = seconds * 1.2;

    // 光晕只做轻微呼吸，不去盖过太阳本体的明暗层次。
    // 每个天体用不同频率，是为了避免三层光晕完全同步，看起来更自然一点。
    const sunPulse = 1 + Math.sin(seconds * 1.4) * 0.025;
    const earthPulse = 1 + Math.sin(seconds * 2.1 + 1.2) * 0.04;
    const moonPulse = 1 + Math.sin(seconds * 2.8 + 2.4) * 0.03;
    sunGlow.sprite.scale.set(6.5 * sunPulse, 6.5 * sunPulse, 1);
    earthGlow.sprite.scale.set(2.2 * earthPulse, 2.2 * earthPulse, 1);
    moonGlow.sprite.scale.set(0.95 * moonPulse, 0.95 * moonPulse, 1);

    // 轻微滚动太阳表面纹理，让表面有一点活性。
    // 幅度非常小，目的是让“这是个活着的恒星”成立，但不抢掉球体受光本身的阅读重点。
    sunSurfaceTexture.offset.x = (seconds * 0.01) % 1;

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  // 首次挂载时先做一次尺寸同步，再启动 resize 监听和动画循环。
  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  // 返回卸载函数。
  // 这个函数会在路由切换时被调用，所以这里必须把所有浏览器侧和 GPU 侧资源清干净。
  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    // 下面这些 dispose 都是在释放 WebGL 资源。
    // 如果不手动释放，页面反复切换后会持续占用显存。
    sunGeometry.dispose();
    sunMaterial.dispose();
    sunSurfaceTexture.dispose();
    sunGlow.texture.dispose();
    sunGlow.material.dispose();

    earthGeometry.dispose();
    earthMaterial.dispose();
    earthGlow.texture.dispose();
    earthGlow.material.dispose();

    moonGeometry.dispose();
    moonMaterial.dispose();
    moonGlow.texture.dispose();
    moonGlow.material.dispose();

    earthOrbitRing.geometry.dispose();
    earthOrbitRing.material.dispose();
    moonOrbitRing.geometry.dispose();
    moonOrbitRing.material.dispose();

    starGeometry.dispose();
    starMaterial.dispose();

    // 销毁 renderer 并移除 canvas，避免 DOM 和 WebGL 上都残留旧场景。
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}

