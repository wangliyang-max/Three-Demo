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
];

// 详情页路由进入后，会先通过 id 找到对应的材质定义。
// 这里保持和图元系统一致的查找接口，方便页面层统一处理。
export function getMaterialById(id) {
  return materialCatalog.find((item) => item.id === id);
}
