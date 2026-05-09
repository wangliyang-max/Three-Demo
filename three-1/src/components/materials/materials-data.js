import * as THREE from 'three';

// 材质示例页统一用这个蓝色作为基础颜色。
// 这样不同材质之间的差异更多来自“受光和高光模型不同”，
// 而不是因为每张卡片颜色不一样导致比较失真。
const BASE_COLOR = 0x7ec7ff;

// MeshToonMaterial 需要 gradientMap 才能表现出“卡通分层”效果。
// 这里手动构造一张 4 像素宽的颜色带贴图，用最小成本做出几档明暗层次。
function createToonGradientMap() {
  const data = new Uint8Array([
    32, 32, 32,
    96, 96, 96,
    176, 176, 176,
    255, 255, 255,
  ]);

  // DataTexture 允许直接从字节数组创建纹理，
  // 非常适合这种极小、纯程序生成的渐变贴图。
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RGBFormat);
  texture.needsUpdate = true;

  // Toon 渲染需要“分档”而不是平滑插值，
  // 所以采样模式改成 Nearest，避免颜色过渡被模糊掉。
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ShaderMaterial 示例使用一个最小的顶点着色器：
// 把模型空间法线传给片元着色器，后续用它来生成自定义颜色。
const SHADER_VERTEX_SOURCE = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 片元着色器不依赖 three.js 内置材质模型，
// 而是直接根据法线方向手工计算一个冷暖渐变，
// 用来说明 ShaderMaterial 的核心价值：外观完全由你自己定义。
const SHADER_FRAGMENT_SOURCE = `
  varying vec3 vNormal;

  void main() {
    vec3 normalColor = normalize(vNormal) * 0.5 + 0.5;
    vec3 base = vec3(0.18, 0.55, 0.88);
    vec3 highlight = vec3(1.0, 0.82, 0.52);
    float fresnel = pow(1.0 - clamp(vNormal.z * 0.5 + 0.5, 0.0, 1.0), 2.2);
    vec3 color = mix(base, normalColor, 0.45);
    color += highlight * fresnel * 0.28;
    gl_FragColor = vec4(color, 1.0);
  }
`;

// materialCatalog 是材质系统的共享目录。
// 总览页、详情页、动态路由、代码展示和预览创建都依赖它。
// 每个条目里最关键的字段有：
// - id: 路由和查找使用的唯一键
// - name / label / summary: 页面展示文案
// - code: 用于展示给用户看的构建代码
// - parameterNotes: 详情页里“关键参数”解释
// - useCases / fixedInputs: 学习提示和适用场景
// - createMaterial: 真正创建 three.js 材质实例的工厂函数
export const materialCatalog = [
  {
    id: 'basic',
    name: 'MeshBasicMaterial',
    label: '不受光材质',
    summary: '不参与灯光计算，只稳定地显示颜色和贴图，非常适合调试和纯展示。',
    code: `const material = new THREE.MeshBasicMaterial({\n  color: 0x7ec7ff,\n});`,
    parameterNotes: [
      { name: 'color', description: '基础颜色，不受灯光影响时它就是最直接的视觉结果。' },
      { name: 'map', description: '颜色贴图，常用于把图片直接贴到模型表面。' },
      { name: 'wireframe', description: '切换成线框显示，方便观察几何结构。' },
    ],
    useCases: ['调试几何体', 'UI 面片', '不需要灯光的示意物体'],
    fixedInputs: ['这个材质最大的特点就是“不受光”。'],
    createMaterial: () => ({
      material: new THREE.MeshBasicMaterial({ color: BASE_COLOR }),
    }),
  },
  {
    id: 'lambert',
    name: 'MeshLambertMaterial',
    label: '基础受光',
    summary: '受光但计算较轻，能看出立体明暗，适合性能优先的受光场景。',
    code: `const material = new THREE.MeshLambertMaterial({\n  color: 0x7ec7ff,\n  emissive: 0x102030,\n});`,
    parameterNotes: [
      { name: 'color', description: '基础颜色，会参与受光后的最终结果。' },
      { name: 'emissive', description: '自发光颜色，可让物体自己带一点亮度。' },
      { name: 'flatShading', description: '开启后会更有硬朗分面感。' },
    ],
    useCases: ['轻量受光模型', '性能优先场景', '低成本立体展示'],
    fixedInputs: ['它能表现明暗，但没有 MeshPhongMaterial 那样明显的高光。'],
    createMaterial: () => ({
      material: new THREE.MeshLambertMaterial({
        color: BASE_COLOR,
        emissive: 0x102030,
      }),
    }),
  },
  {
    id: 'phong',
    name: 'MeshPhongMaterial',
    label: '传统高光',
    summary: '支持镜面高光，塑料、漆面这类传统 3D 质感会更明显。',
    code: `const material = new THREE.MeshPhongMaterial({\n  color: 0x7ec7ff,\n  shininess: 100,\n  specular: 0x223344,\n});`,
    parameterNotes: [
      { name: 'shininess', description: '高光集中程度，越高越会出现尖亮的高光点。' },
      { name: 'specular', description: '镜面高光颜色，决定高光偏什么色。' },
      { name: 'emissive', description: '附加自发光，让材质本身再多一点亮度。' },
    ],
    useCases: ['塑料感物体', '传统游戏材质', '需要明显高光的模型'],
    fixedInputs: ['这是 three.js 里非常经典的一种传统受光材质。'],
    createMaterial: () => ({
      material: new THREE.MeshPhongMaterial({
        color: BASE_COLOR,
        shininess: 100,
        specular: 0x223344,
      }),
    }),
  },
  {
    id: 'toon',
    name: 'MeshToonMaterial',
    label: '卡通分层',
    summary: '明暗不是连续变化，而是分成几档，更适合卡通和风格化渲染。',
    code: `const gradientMap = createToonGradientMap();\nconst material = new THREE.MeshToonMaterial({\n  color: 0x7ec7ff,\n  gradientMap,\n});`,
    parameterNotes: [
      { name: 'gradientMap', description: '控制明暗分层的关键贴图，决定卡通渲染的层次感。' },
      { name: 'color', description: '材质基础颜色，最终会和分层明暗一起表现。' },
      { name: 'emissive', description: '可用来让卡通材质再多一点发光感。' },
    ],
    useCases: ['卡通角色', '风格化场景', '分层阴影效果'],
    fixedInputs: ['这里使用的是程序生成的 4 档 gradientMap。'],
    createMaterial: () => {
      // Toon 材质除了 material 自身，还额外持有一张 gradientMap，
      // 所以后面需要把它一起释放掉。
      const gradientMap = createToonGradientMap();
      return {
        material: new THREE.MeshToonMaterial({
          color: BASE_COLOR,
          gradientMap,
        }),
        dispose: () => gradientMap.dispose(),
      };
    },
  },
  {
    id: 'standard',
    name: 'MeshStandardMaterial',
    label: 'PBR 标准材质',
    summary: '用 roughness 和 metalness 描述材质，是现代 three.js 里最常见的真实感材质。',
    code: `const material = new THREE.MeshStandardMaterial({\n  color: 0x7ec7ff,\n  roughness: 0.42,\n  metalness: 0.35,\n});`,
    parameterNotes: [
      { name: 'roughness', description: '粗糙度，越高越糙，高光越散。' },
      { name: 'metalness', description: '金属度，越高越像金属。' },
      { name: 'envMap', description: '环境反射贴图，PBR 材质在真实感场景里非常常用。' },
    ],
    useCases: ['现代真实感材质', '金属 / 塑料 / 石头', 'PBR 流程项目'],
    fixedInputs: ['这是 three.js 里最常见的 PBR 基础材质。'],
    createMaterial: () => ({
      material: new THREE.MeshStandardMaterial({
        color: BASE_COLOR,
        roughness: 0.42,
        metalness: 0.35,
      }),
    }),
  },
  {
    id: 'physical',
    name: 'MeshPhysicalMaterial',
    label: 'PBR 增强材质',
    summary: '在 Standard 的基础上增加 clearcoat 等物理属性，适合更复杂的真实材质。',
    code: `const material = new THREE.MeshPhysicalMaterial({\n  color: 0x7ec7ff,\n  roughness: 0.24,\n  metalness: 0.1,\n  clearcoat: 1,\n  clearcoatRoughness: 0.08,\n});`,
    parameterNotes: [
      { name: 'clearcoat', description: '清漆层强度，适合做车漆、亮面保护层。' },
      { name: 'clearcoatRoughness', description: '清漆层的粗糙度。' },
      { name: 'transmission', description: '更真实的透光参数，适合玻璃等材质。' },
    ],
    useCases: ['汽车漆', '玻璃', '高阶真实感材质'],
    fixedInputs: ['它是 MeshStandardMaterial 的增强版，能力更强，计算也更重。'],
    createMaterial: () => ({
      material: new THREE.MeshPhysicalMaterial({
        color: BASE_COLOR,
        roughness: 0.24,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    }),
  },
  {
    id: 'normal',
    name: 'MeshNormalMaterial',
    label: '法线可视化',
    summary: '直接把法线方向映射为 RGB 颜色，常用于调试模型朝向和观察表面变化。',
    code: `const material = new THREE.MeshNormalMaterial({\n  flatShading: false,\n});`,
    parameterNotes: [
      { name: 'flatShading', description: '控制法线是平滑还是按面分段，便于观察几何分面。' },
      { name: 'wireframe', description: '可叠加线框查看法线可视化与网格结构的对应关系。' },
      { name: 'normalMap', description: '配合法线贴图时能进一步观察法线扰动后的表面方向。' },
    ],
    useCases: ['调试法线方向', '检查模型表面连续性', '做技术演示'],
    fixedInputs: ['这个材质不是在表现真实世界材质，而是在直接可视化法线。'],
    createMaterial: () => ({
      material: new THREE.MeshNormalMaterial({
        flatShading: false,
      }),
    }),
  },
  {
    id: 'depth',
    name: 'MeshDepthMaterial',
    label: '深度可视化',
    summary: '根据物体到相机的深度输出灰度值，越远通常越接近浅色或深色，用于深度调试。',
    code: `const material = new THREE.MeshDepthMaterial({\n  depthPacking: THREE.BasicDepthPacking,\n});`,
    parameterNotes: [
      { name: 'depthPacking', description: '控制深度值如何编码到颜色通道中。' },
      { name: 'wireframe', description: '可切换成线框，结合深度信息一起观察模型结构。' },
      { name: 'map', description: '某些场景里会搭配贴图 alpha 裁切使用，但核心仍然是深度输出。' },
    ],
    useCases: ['调试相机深度', '理解深度缓冲', '做后处理前的可视化检查'],
    fixedInputs: ['它不是传统意义上的表面着色材质，而是把“距离相机多远”可视化出来。'],
    createMaterial: () => ({
      material: new THREE.MeshDepthMaterial({
        depthPacking: THREE.BasicDepthPacking,
      }),
    }),
  },
  {
    id: 'shadow',
    name: 'ShadowMaterial',
    label: '阴影接收材质',
    summary: '自身几乎透明，主要用于接收并显示其他物体投下来的阴影，不是普通表面材质。',
    code: `const material = new THREE.ShadowMaterial({\n  color: 0x000000,\n  opacity: 0.55,\n});`,
    parameterNotes: [
      { name: 'opacity', description: '阴影的可见强度，越高阴影越明显。' },
      { name: 'color', description: '阴影显示出来的颜色，常见是黑色或偏冷灰色。' },
      { name: 'transparent', description: '它通常会保持透明，只把阴影部分显示出来。' },
    ],
    useCases: ['地面阴影接收面', '产品展示台阴影', '让阴影单独可控'],
    fixedInputs: ['这个材质的重点不是显示物体表面，而是显示“投下来的阴影”。'],
    createMaterial: () => ({
      material: new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0.55,
      }),
    }),
  },
  {
    id: 'shader',
    name: 'ShaderMaterial',
    label: '自定义着色器',
    summary: '允许你自己编写顶点和片元着色器，是 three.js 里可编程程度最高的材质入口。',
    code: `const material = new THREE.ShaderMaterial({\n  vertexShader: vertexSource,\n  fragmentShader: fragmentSource,\n});`,
    parameterNotes: [
      { name: 'vertexShader', description: '顶点着色器源码，负责顶点位置、法线、插值数据等处理。' },
      { name: 'fragmentShader', description: '片元着色器源码，负责每个像素最终显示什么颜色。' },
      { name: 'uniforms', description: 'JS 向 shader 传值的主要通道，常用于时间、颜色、纹理等动态数据。' },
    ],
    useCases: ['特效材质', '程序化表面', '完全自定义渲染风格'],
    fixedInputs: ['它不是预设外观，而是“你自己定义规则，GPU 按规则画出来”。'],
    createMaterial: () => ({
      material: new THREE.ShaderMaterial({
        vertexShader: SHADER_VERTEX_SOURCE,
        fragmentShader: SHADER_FRAGMENT_SOURCE,
      }),
    }),
  },
];

// 详情页路由进入后，会先通过 id 找到对应的材质定义。
// 这里保持和图元系统一致的查找接口，方便页面层统一处理。
export function getMaterialById(id) {
  return materialCatalog.find((item) => item.id === id);
}

