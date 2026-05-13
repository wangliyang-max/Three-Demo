export const fogCatalog = [
  {
    id: 'linear-fog-range',
    name: 'THREE.Fog',
    label: '线性雾范围',
    summary: '用 near 和 far 控制雾从哪里开始、到哪里完全融入背景色，适合精确管理可视距离。',
    learningFocus: '线性雾的关键不是“把场景变灰”，而是用一段距离区间让远处物体自然淡出。',
    observationHint: '重点看远处柱子如何逐渐接近背景色：near 前清晰，near 到 far 之间过渡，far 后基本融入雾色。',
    code: `const fogColor = '#6f8290';\n\nscene.fog = new THREE.Fog(fogColor, 6, 20);\nscene.background = new THREE.Color(fogColor);`,
    parameterNotes: [
      { name: 'near', description: '距离相机多远开始起雾。near 前的物体基本保持自身颜色。' },
      { name: 'far', description: '距离相机多远完全变成雾颜色。far 越近，远处越快消失。' },
      { name: 'far - near', description: '决定过渡柔和程度。差值越小，雾越像一道硬边；差值越大，过渡越平滑。' },
    ],
    usageNotes: ['适合隐藏远裁剪面。', '适合精确控制可视距离。', '雾颜色最好和 scene.background 保持一致。'],
  },
  {
    id: 'exponential-fog-density',
    name: 'THREE.FogExp2',
    label: '指数雾密度',
    summary: '用 density 控制空气密度，距离越远雾感增长越明显，更适合自然大气和晨雾氛围。',
    learningFocus: 'FogExp2 不指定起止距离，而是让雾按距离非线性增强，画面会比线性雾更像自然空气散射。',
    observationHint: '观察远处球体和柱子：不是到某个固定 far 才消失，而是越远越快被雾吞没。',
    code: `const fogColor = '#5f7f92';\n\nscene.fog = new THREE.FogExp2(fogColor, 0.072);\nscene.background = new THREE.Color(fogColor);`,
    parameterNotes: [
      { name: 'density', description: '雾密度。数值很敏感，建议从 0.01、0.02 这类小值开始调。' },
      { name: '自然感', description: '指数雾没有明确 near/far 边界，更适合森林、山谷、清晨、雨后等氛围。' },
      { name: '调试方式', description: 'density 稍微变大就可能很浓，调试时要比线性雾更克制。' },
    ],
    usageNotes: ['适合大气感场景。', '不适合精确控制某个距离完全消失。', 'density 从小值开始逐步增加。'],
  },
  {
    id: 'fog-background-sync',
    name: 'Fog Color Sync',
    label: '雾色和背景同步',
    summary: '雾只影响物体像素，不会自动改变背景；想让远景自然淡出，雾色和背景色应该绑定。',
    learningFocus: '理解雾不是屏幕滤镜：物体会混合到 fog.color，但背景需要手动设置成同色，否则远景会断层。',
    observationHint: '看远处物体边缘是否自然融入背景；如果背景和雾色不同，就会出现明显割裂。',
    code: `class FogGUIHelper {\n  constructor(fog, backgroundColor) {\n    this.fog = fog;\n    this.backgroundColor = backgroundColor;\n  }\n\n  set color(value) {\n    this.fog.color.set(value);\n    this.backgroundColor.set(value);\n  }\n}`,
    parameterNotes: [
      { name: 'scene.fog.color', description: '物体远离相机时会逐渐混合到这个颜色。' },
      { name: 'scene.background', description: '背景不会自动受雾影响，需要手动设置成和雾一致或协调的颜色。' },
      { name: 'FogGUIHelper', description: '开发调试时可以用辅助类同步修改雾颜色和背景颜色。' },
    ],
    usageNotes: ['雾色和背景色尽量使用同一个变量。', 'GUI 调色时同步更新 fog.color 和 scene.background。', '天空盒或背景图也要和雾色协调。'],
  },
  {
    id: 'material-fog-toggle',
    name: 'material.fog',
    label: '材质是否受雾影响',
    summary: '支持雾的材质可以通过 material.fog 控制是否参与雾计算，适合让 UI、车内或室内物体保持清晰。',
    learningFocus: '场景有雾不代表所有物体都必须受雾影响；某些近景或界面元素应该主动关闭 fog。',
    observationHint: '对比两个标签板：一个会随距离融入雾色，另一个关闭 material.fog 后始终保持清晰。',
    code: `const labelMaterial = new THREE.MeshBasicMaterial({\n  color: '#ffdd88',\n});\n\nlabelMaterial.fog = false;`,
    parameterNotes: [
      { name: 'material.fog = true', description: '材质参与 scene.fog 计算，多数内置材质默认支持。' },
      { name: 'material.fog = false', description: '材质忽略场景雾，适合 UI、仪表盘、室内墙面或重要标记。' },
      { name: 'ShaderMaterial', description: '自定义 shader 需要自己处理 fog 逻辑，否则可能不会自动受雾影响。' },
    ],
    usageNotes: ['UI 标记通常关闭 fog。', '车内和室内材质可以关闭 fog。', '自定义 shader 要额外确认是否实现 fog。'],
  },
];

export function getFogById(id) {
  return fogCatalog.find((item) => item.id === id);
}

