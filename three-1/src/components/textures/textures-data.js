import * as THREE from 'three';

// 项目里现有的 GLB 模型就是通过 '/assets/...' 这种根路径字符串来引用的，
// 因此这里也保持同一套资源组织方式，避免纹理模块单独走另一套路径规则。
//
// 这两个路径都指向已经复制进项目的真实文件：
// - assets/textures/yaya.png
// - assets/textures/aaa.mp4
//
// 这样做的直接好处是：
// 1. 示例代码和项目现有风格保持一致
// 2. 不会再把用户机器上的原始绝对路径暴露到运行时代码里
// 3. 能避开当前环境下 import.meta.url 资源解析触发的构建权限问题
const IMAGE_TEXTURE_URL = '/assets/textures/yaya.png';
const VIDEO_TEXTURE_URL = '/assets/textures/aaa.mp4';

// 下面这些辅助函数仍然保留，因为纹理目录里并不只有“真实文件加载”。
// 例如：
// - CanvasTexture 仍然需要程序动态绘制画布
// - DataTexture 仍然需要程序直接生成像素数组
// - CubeTexture 示例仍然需要六张程序生成的面图
// 也就是说，这个文件现在同时承担两类职责：
// 1. 提供真实资源 URL
// 2. 提供非文件型纹理示例所需的程序化数据
function createCheckerCanvas(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f1724';
  ctx.fillRect(0, 0, size, size);

  const cells = 8;
  const cellSize = size / cells;
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffd18a' : '#7ec7ff';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, size, size);
  return canvas;
}

function createCanvasLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#0f1724');
  gradient.addColorStop(0.55, '#1f4b7f');
  gradient.addColorStop(1, '#ffd18a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.arc(64 + i * 36, 380 - (i % 3) * 22, 14 + (i % 4) * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Arial';
  ctx.fillText('Hello 3D', 54, 138);
  ctx.font = '28px Arial';
  ctx.fillText('CanvasTexture updates can be pushed live.', 56, 192);
  return canvas;
}

function createGradientDataTexture() {
  const width = 128;
  const height = 128;
  const size = width * height;
  const data = new Uint8Array(4 * size);

  for (let i = 0; i < size; i += 1) {
    const stride = i * 4;
    const x = i % width;
    const y = Math.floor(i / width);
    data[stride] = 255;
    data[stride + 1] = Math.floor((x / (width - 1)) * 255);
    data[stride + 2] = Math.floor((y / (height - 1)) * 180);
    data[stride + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCubeFaceDataUrl(label, backgroundColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, backgroundColor);
  gradient.addColorStop(1, '#0c1018');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 10;
  ctx.strokeRect(14, 14, 228, 228);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 128);
  return canvas.toDataURL('image/png');
}

export const textureCatalog = [
  {
    id: 'image',
    name: 'Texture / TextureLoader',
    label: '图片纹理',
    summary: '最基础的图片纹理入口，常见于 JPEG、PNG 等贴图资源，通常挂到材质的 map 属性上。',
    code: `const loader = new THREE.TextureLoader();\nconst texture = loader.load('/assets/textures/yaya.png');\n\nconst material = new THREE.MeshBasicMaterial({\n  map: texture,\n});`,
    parameterNotes: [
      { name: 'TextureLoader', description: '负责异步加载图片并返回 Texture 对象，是最常见的纹理加载入口。' },
      { name: 'map', description: '材质的颜色贴图槽位，把纹理显示到模型表面时最先接触的就是它。' },
      { name: '2 的幂尺寸', description: '512、1024 这类尺寸更利于 mipmap 和采样表现，教学项目里也更容易观察差异。' },
    ],
    useCases: ['角色/场景贴图', 'UI 面片', '最常见的静态资源纹理'],
    fixedInputs: ['这个示例会从项目内真实文件 assets/textures/yaya.png 加载图片纹理，而不是再用 Data URL 模拟。'],
    createPreview: () => {
      // 这里故意继续使用 TextureLoader，而不是直接 new Image() 再包一层 Texture。
      // 原因是这个页面本来就是教学示例：要展示的正是 three.js 官方最常见的图片纹理入口。
      const loader = new THREE.TextureLoader();
      const texture = loader.load(IMAGE_TEXTURE_URL);

      // 图片本身是普通颜色贴图，不是数据纹理，因此应该放在 sRGB 色彩空间里解码。
      // 这样最终显示出来的颜色才和原图一致，不会偏灰或偏暗。
      texture.colorSpace = THREE.SRGBColorSpace;
      return { texture };
    },
  },
  {
    id: 'canvas',
    name: 'CanvasTexture',
    label: '画布纹理',
    summary: '通过 Canvas 实时绘制内容生成纹理，适合动态标签、数据面板和程序化 2D 图形。',
    code: `const canvas = document.createElement('canvas');\nconst ctx = canvas.getContext('2d');\n\nctx.fillStyle = 'red';\nctx.fillRect(0, 0, canvas.width, canvas.height);\n\nconst canvasTexture = new THREE.CanvasTexture(canvas);\nconst material = new THREE.MeshBasicMaterial({ map: canvasTexture });\n\ncanvasTexture.needsUpdate = true;`,
    parameterNotes: [
      { name: 'CanvasTexture', description: '把 Canvas 当前像素直接包装成纹理对象，适合持续动态更新。' },
      { name: 'needsUpdate', description: '画布内容变化后需要把这个标记设为 true，Three.js 才会把新像素重新上传到 GPU。' },
      { name: '实时绘制', description: '不依赖静态图片文件，可以随程序状态实时改写内容。' },
    ],
    useCases: ['动态图标', '文字标签', '实时图表或雷达屏'],
    fixedInputs: ['预览里会周期性改写画布内容，演示 CanvasTexture 的实时刷新。'],
    createPreview: () => {
      const canvas = createCanvasLabelTexture();
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return { texture, canvas };
    },
  },
  {
    id: 'video',
    name: 'VideoTexture',
    label: '视频纹理',
    summary: '把 HTMLVideoElement 作为纹理源，适合屏幕播放、监控墙或动态广告牌这类场景。',
    code: `const video = document.createElement('video');\nvideo.src = '/assets/textures/aaa.mp4';\nvideo.loop = true;\nvideo.muted = true;\nvideo.play();\n\nconst videoTexture = new THREE.VideoTexture(video);\nconst material = new THREE.MeshBasicMaterial({ map: videoTexture });`,
    parameterNotes: [
      { name: 'VideoTexture', description: '直接读取 video 帧作为纹理数据，通常不需要手动设置 needsUpdate。' },
      { name: 'muted', description: '很多浏览器只有静音视频才允许自动播放，教学示例里通常会默认开启。' },
      { name: '自动更新', description: '视频每一帧都会被纹理系统自动同步到材质上，适合连续动态内容。' },
    ],
    useCases: ['屏幕播放', '广告牌', '动态面板或监控画面'],
    fixedInputs: ['这个示例会从项目内真实文件 assets/textures/aaa.mp4 创建 HTMLVideoElement，再交给 VideoTexture 自动逐帧更新。'],
    createPreview: () => {
      // VideoTexture 的关键不是“视频文件在哪里”，而是它始终绑定一个真实的 HTMLVideoElement。
      // 只要 video 元素能够正常播放，纹理就会持续读取视频帧。
      const video = document.createElement('video');
      video.src = VIDEO_TEXTURE_URL;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;

      // 预览页使用视频帧本身作为纹理内容，因此不再需要之前那套
      // “隐藏 canvas -> captureStream -> video.srcObject”的模拟流程。
      const texture = new THREE.VideoTexture(video);

      // 视频画面本质上仍然是常规颜色内容，所以也放在 sRGB 色彩空间里。
      texture.colorSpace = THREE.SRGBColorSpace;
      return { texture, video };
    },
  },
  {
    id: 'cube',
    name: 'CubeTexture',
    label: '立方体纹理 / 天空盒',
    summary: '由六张面图组成，既能做场景背景，也能给金属材质提供环境反射。',
    code: `const loader = new THREE.CubeTextureLoader();\nconst cubeTexture = loader.load([\n  'px.jpg', 'nx.jpg',\n  'py.jpg', 'ny.jpg',\n  'pz.jpg', 'nz.jpg'\n]);\n\nscene.background = cubeTexture;\n\nconst material = new THREE.MeshStandardMaterial({\n  envMap: cubeTexture,\n  roughness: 0.1,\n  metalness: 0.9,\n});`,
    parameterNotes: [
      { name: 'CubeTextureLoader', description: '专门加载 6 张面图，顺序固定为右左上下前后。' },
      { name: 'scene.background', description: '把立方体纹理直接设成背景时，本质上就是一个天空盒。' },
      { name: 'envMap', description: '环境贴图槽位，标准材质和物理材质会用它来做反射或环境贡献。' },
    ],
    useCases: ['天空盒', '反射环境', '金属或玻璃质感增强'],
    fixedInputs: ['这个示例用六张程序生成的面图构造 CubeTexture，并同时作为背景和 envMap。'],
    createPreview: () => {
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        createCubeFaceDataUrl('PX', '#255c9d'),
        createCubeFaceDataUrl('NX', '#6e4aa6'),
        createCubeFaceDataUrl('PY', '#2f8f79'),
        createCubeFaceDataUrl('NY', '#7b5b25'),
        createCubeFaceDataUrl('PZ', '#a24d61'),
        createCubeFaceDataUrl('NZ', '#44618e'),
      ]);
      texture.colorSpace = THREE.SRGBColorSpace;
      return { texture };
    },
  },
  {
    id: 'data',
    name: 'DataTexture',
    label: '数据纹理',
    summary: '直接从原始像素数组创建纹理，适合程序化噪点、渐变图和规则图案生成。',
    code: `const width = 512;\nconst height = 512;\nconst data = new Uint8Array(4 * width * height);\n\nconst dataTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);\nconst material = new THREE.MeshBasicMaterial({ map: dataTexture });`,
    parameterNotes: [
      { name: 'Uint8Array', description: '最常见的数据来源，每个像素的 RGBA 值都由程序直接控制。' },
      { name: 'DataTexture', description: '适合不想经过图片文件、而是直接生成像素的场景。' },
      { name: 'RGBAFormat', description: '告诉 Three.js 每 4 个字节表示一个像素的红绿蓝透明通道。' },
    ],
    useCases: ['程序化渐变', '噪点图', '调试纹理和技术可视化'],
    fixedInputs: ['这个示例会生成红到绿、并带一点蓝色纵向变化的渐变纹理。'],
    createPreview: () => ({ texture: createGradientDataTexture() }),
  },
  {
    id: 'compressed',
    name: 'CompressedTexture',
    label: '压缩纹理',
    summary: '使用 DDS、PVR、KTX2 等压缩格式减少显存占用和传输成本，常见于移动端和大型项目。',
    code: `const loader = new THREE.CompressedTextureLoader();\nloader.load('texture.dds', (texture) => {\n  const material = new THREE.MeshBasicMaterial({ map: texture });\n});`,
    parameterNotes: [
      { name: 'CompressedTextureLoader', description: '负责读取 GPU 可直接使用的压缩纹理资源，减少运行时解码压力。' },
      { name: '预压缩资源', description: '这类纹理必须提前离线转换，不能像普通 PNG 那样临时直接替代。' },
      { name: '显存收益', description: '在贴图很多或分辨率很高的项目里，压缩纹理能明显降低带宽和显存压力。' },
    ],
    useCases: ['大型场景', '移动端优化', '高分辨率贴图项目'],
    fixedInputs: ['项目里没有现成 DDS/PVR/KTX2 文件，所以这个示例用占位纹理强调 API 位置和使用目的。'],
    createPreview: () => {
      const texture = new THREE.CanvasTexture(createCheckerCanvas(256));
      texture.colorSpace = THREE.SRGBColorSpace;
      return { texture, isFallbackPreview: true };
    },
  },
  {
    id: 'depth',
    name: 'DepthTexture',
    label: '深度纹理',
    summary: '存储场景的深度信息，常用于景深、阴影、屏幕空间效果和其他后处理技术。',
    code: `const depthTexture = new THREE.DepthTexture(1024, 1024);\nconst renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {\n  depthTexture,\n});`,
    parameterNotes: [
      { name: 'DepthTexture', description: '保存的不是颜色，而是“离相机有多远”的深度值。' },
      { name: 'WebGLRenderTarget', description: '深度纹理通常配合离屏渲染目标使用，再把结果交给后处理或调试面板。' },
      { name: '高级特效', description: '景深、阴影、体积效果和许多屏幕空间算法都会依赖深度信息。' },
    ],
    useCases: ['景深', '阴影调试', '后处理和技术可视化'],
    fixedInputs: ['预览会先渲染一个小场景到带深度纹理的 RenderTarget，再把深度结果显示到前景面片。'],
    createPreview: () => ({}),
  },
];

export function getTextureById(id) {
  return textureCatalog.find((item) => item.id === id);
}
