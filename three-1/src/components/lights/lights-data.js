// 光照目录的数据层只负责“要展示什么”：
// - 每种灯光的名称、标签、摘要
// - 示例代码
// - 关键参数说明
// - 典型用途和学习提示
//
// 真正的 three.js 预览场景创建逻辑放在 lights-preview.js 中，
// 这样页面层和渲染层可以像材质、纹理模块一样继续解耦。
export const lightCatalog = [
  {
    id: 'ambient',
    name: 'AmbientLight',
    label: '环境光',
    summary: '给场景里所有物体统一补一层基础亮度，没有方向，也不会形成高光或阴影。',
    observationHint: '先看静止的球体和方块是否还存在明显方向差，再看上方白色结体转动时明暗变化是否很弱。环境光越强，整个场景越接近“整体提亮”。',
    learningFocus: 'AmbientLight 最适合当底光。它能解决场景过黑的问题，但不能单独建立体积感。',
    usageNotes: [
      '如果一个场景只放环境光，物体通常会显得平。',
      '它适合和 DirectionalLight、PointLight 这类有方向的光搭配。',
      '环境光不会自己制造阴影，也不会告诉用户光来自哪里。',
    ],
    code: `const light = new THREE.AmbientLight(0xffffff, 1);`,
    parameterNotes: [
      { name: 'color', description: '环境光的整体颜色，会均匀叠加到所有受光材质上。' },
      { name: 'intensity', description: '环境光强度，数值越高，场景整体越亮。' },
      { name: '无方向性', description: '环境光不区分上方、侧面或背面，因此不会产生方向感。' },
    ],
    useCases: ['给暗部补底光', '避免场景死黑', '与其他定向光组合使用'],
    fixedInputs: ['官方手册里强调它会“均匀照亮所有物体”，因此最适合当基础补光，而不是主光。'],
  },
  {
    id: 'hemisphere',
    name: 'HemisphereLight',
    label: '半球光',
    summary: '用天空色和地面色同时影响物体，适合模拟户外天空漫反射。',
    observationHint: '重点看静止物体上表面是否偏天空色、下边缘是否带一点地面反色，再看上方白色结体转动时这种冷暖变化是否持续存在。',
    learningFocus: 'HemisphereLight 不是“平均提亮”，而是给上方和下方分别提供不同颜色来源。',
    usageNotes: [
      '它非常适合做户外基础光，尤其是天空偏冷、地面偏暖的场景。',
      '如果 skyColor 和 groundColor 设得太艳，物体会有明显染色。',
      '它通常仍然需要一盏主光来塑造更强烈的明暗方向。',
    ],
    code: `const light = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 1);`,
    parameterNotes: [
      { name: 'skyColor', description: '从上方照向物体的颜色，通常拿来模拟天空光。' },
      { name: 'groundColor', description: '从下方反射回来的颜色，通常模拟地面或环境反光。' },
      { name: 'intensity', description: '半球光整体强度，数值越高，上下颜色混合效果越明显。' },
    ],
    useCases: ['户外场景', '天空补光', '快速建立冷暖上下光关系'],
    fixedInputs: ['官方手册用它说明“上方和下方颜色不同”的光照模型，这和普通环境光是最核心的区别。'],
  },
  {
    id: 'directional',
    name: 'DirectionalLight',
    label: '方向光',
    summary: '模拟从很远处照来的平行光，常见于太阳光或舞台主光。',
    observationHint: '重点看上方白色结体转动时高光和暗面如何变化，再对照静止球体的明暗分界线是否清晰。这最能说明方向光的方向性。',
    learningFocus: 'DirectionalLight 的核心不是离模型多近，而是光线方向。方向由 light.position 和 light.target 一起决定。',
    usageNotes: [
      '它非常适合模拟太阳光或稳定的主方向光。',
      '很多人只改 position，不处理 target，最后会误判灯光方向。',
      '需要明显立体感时，DirectionalLight 往往是最直观的一类光。',
    ],
    code: `const light = new THREE.DirectionalLight(0xffffff, 2);\nlight.position.set(5, 10, 2);\nlight.target.position.set(0, 0, 0);\nscene.add(light);\nscene.add(light.target);`,
    parameterNotes: [
      { name: 'position', description: '方向光位置会决定光线的照射方向。' },
      { name: 'target', description: '方向光实际朝向由 target 决定，three.js 手册特别强调这一点。' },
      { name: 'intensity', description: '主光强度，越高越容易拉出立体感和明暗面。' },
    ],
    useCases: ['太阳光', '主方向光', '需要明显受光方向的场景'],
    fixedInputs: ['DirectionalLight 的关键不是“离物体多远”，而是“朝哪个 target 方向照”。'],
  },
  {
    id: 'point',
    name: 'PointLight',
    label: '点光源',
    summary: '从一个点向四周发光，类似灯泡、火焰或小型发光装置。',
    observationHint: '先看静止球体和方块离点光源远近不同导致的亮度差，再看上方白色结体转动时高光如何保持来自同一个固定光位。',
    learningFocus: 'PointLight 最适合学习“位置变化”和“距离衰减”对受光结果的影响。',
    usageNotes: [
      '如果 intensity 很大但 distance 太小，局部会很亮但覆盖范围不够。',
      '如果 distance 不受控，点光源在小场景里很容易把全场打亮。',
      '它适合做局部小灯，而不是大面积均匀照明。',
    ],
    code: `const light = new THREE.PointLight(0xffffff, 40, 10);\nlight.position.set(1, 2, 4);\nscene.add(light);`,
    parameterNotes: [
      { name: 'position', description: '点光源的发光中心位置，所有方向都从这里向外扩散。' },
      { name: 'distance', description: '影响范围，超过这个距离后光照会衰减到 0。' },
      { name: 'decay', description: '衰减方式，决定离光源越远时亮度下降得多快。' },
    ],
    useCases: ['灯泡', '烛火', '小型局部发光源'],
    fixedInputs: ['点光源最适合演示“距离衰减”，所以预览里会让发光点围绕物体缓慢移动。'],
  },
  {
    id: 'spot',
    name: 'SpotLight',
    label: '聚光灯',
    summary: '从一点朝某个方向打出锥形光束，常见于手电筒、舞台追光和路灯。',
    observationHint: '重点观察静止物体是否明显落在聚光区域内，再看上方白色结体转动时高光是否始终来自同一个锥形方向。',
    learningFocus: 'SpotLight 同时有“方向”和“范围”两个维度，所以比 PointLight 更适合做聚焦式照明。',
    usageNotes: [
      'angle 决定锥形范围，penumbra 决定边缘是不是生硬切断。',
      '如果只改位置不改 target，经常会出现“灯在那儿但没有照到主体”的情况。',
      '舞台追光、手电筒、路灯这类效果通常优先考虑 SpotLight。',
    ],
    code: `const light = new THREE.SpotLight(0xffffff, 50);\nlight.position.set(2, 4, 2);\nlight.angle = Math.PI / 6;\nlight.penumbra = 0.3;\nlight.target.position.set(0, 0, 0);\nscene.add(light);\nscene.add(light.target);`,
    parameterNotes: [
      { name: 'angle', description: '光锥张角，越大照射范围越宽。' },
      { name: 'penumbra', description: '边缘过渡柔和程度，越高边缘越软。' },
      { name: 'target', description: '聚光灯照向哪里依然由 target 决定。' },
    ],
    useCases: ['舞台追光', '手电筒', '需要明确聚焦区域的灯光'],
    fixedInputs: ['SpotLight 的学习重点是“有方向、也有锥形范围”，所以会同时展示 target 和 cone。'],
  },
  {
    id: 'rect-area',
    name: 'RectAreaLight',
    label: '矩形区域光',
    summary: '从一个矩形面均匀发光，适合模拟柔光箱、发光面板和摄影棚布光。',
    observationHint: '重点看上方白色结体上的高光是不是比 SpotLight 更大、更软，同时对照静止球体判断这块面光的覆盖范围。',
    learningFocus: 'RectAreaLight 不是点状发光，而是一整块面在发光，所以视觉上更像摄影棚柔光箱。',
    usageNotes: [
      '它主要适合产品渲染和棚拍风格布光。',
      '官方文档明确说明它只影响标准/物理材质，普通基础材质不会正确响应。',
      '它不支持投射阴影，所以不要把它当成万能主光来理解。',
    ],
    code: `RectAreaLightUniformsLib.init();\nconst light = new THREE.RectAreaLight(0xffffff, 12, 2, 1.5);\nlight.position.set(0, 2, 2);\nlight.lookAt(0, 0, 0);\nscene.add(light);`,
    parameterNotes: [
      { name: 'width / height', description: '发光面的真实尺寸，会直接影响照明区域和视觉比例。' },
      { name: 'intensity', description: '区域光强度，通常需要比普通环境光更高。' },
      { name: 'PBR 限制', description: '官方文档说明它只会影响 MeshStandardMaterial 和 MeshPhysicalMaterial。' },
    ],
    useCases: ['摄影棚布光', '产品渲染', '柔和的大面积面光'],
    fixedInputs: ['官方手册明确指出 RectAreaLight 不支持投影阴影，也不是所有材质都能响应它。'],
  },
];

export function getLightById(id) {
  return lightCatalog.find((item) => item.id === id);
}
