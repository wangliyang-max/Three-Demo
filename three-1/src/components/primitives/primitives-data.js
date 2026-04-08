import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetikerRegular from 'three/examples/fonts/helvetiker_regular.typeface.json';

// TextGeometry 不能直接读取字体 JSON。
// 这里先把字体数据解析成 three.js 可用的字体对象，后面 TextGeometry 会直接复用它。
const parsedFont = new FontLoader().parse(helvetikerRegular);

// 页面里会同时展示示例代码。
// 这个函数专门把浮点数压缩成更短、更适合阅读的字符串。
function formatNumber(value) {
  if (Number.isInteger(value)) return `${value}`;
  return `${Number(value.toFixed(2))}`;
}

// 下面几个辅助函数负责生成特殊图元需要的输入数据。
// 例如星形轮廓给 ExtrudeGeometry，路径给 TubeGeometry，参数曲面函数给 ParametricGeometry。
function createStarShape(spikes, outerRadius, innerRadius) {
  const shape = new THREE.Shape();
  const totalPoints = spikes * 2;
  for (let i = 0; i < totalPoints; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + i * (Math.PI / spikes);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function createTriangleShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, height * 0.6);
  shape.lineTo(-width * 0.5, -height * 0.4);
  shape.lineTo(width * 0.5, -height * 0.4);
  shape.closePath();
  return shape;
}

function createLathePoints(profileWidth, profileHeight, neckWidth) {
  const base = [[0,-1.7],[0.3,-1.7],[0.44,-1.3],[0.36,-0.6],[0.3,0.1],[0.22,0.8],[0.15,1.25],[0.12,1.55],[0.18,1.82],[0,1.82]];
  return base.map(([x, y], index) => new THREE.Vector2(x * (index >= 6 ? neckWidth : profileWidth), y * profileHeight));
}

function createTubePath(pathHeight, pathDepth) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, -0.2 * pathHeight, -0.55 * pathDepth),
    new THREE.Vector3(-0.55, 0.6 * pathHeight, 0.28 * pathDepth),
    new THREE.Vector3(-0.1, -0.45 * pathHeight, 0.78 * pathDepth),
    new THREE.Vector3(0.52, 0.38 * pathHeight, 0.05 * pathDepth),
    new THREE.Vector3(1, -0.15 * pathHeight, -0.72 * pathDepth),
  ]);
}

function createPolyhedronGeometry(radius, detail) {
  const vertices = [-1,-1,-1,1,-1,-1,1,1,-1,-1,1,-1,-1,-1,1,1,-1,1,1,1,1,-1,1,1];
  const indices = [0,1,2,2,3,0,4,7,6,6,5,4,0,4,5,5,1,0,1,5,6,6,2,1,2,6,7,7,3,2,3,7,4,4,0,3];
  return new THREE.PolyhedronGeometry(vertices, indices, radius, detail);
}

function createParametricSurface(params) {
  return (u, v, target) => {
    const x = (u - 0.5) * params.width;
    const z = (v - 0.5) * params.depth;
    const y = Math.sin(u * Math.PI * params.frequencyU) * Math.cos(v * Math.PI * params.frequencyV) * params.amplitude + Math.sin(v * Math.PI * (params.frequencyV + 1)) * 0.06;
    target.set(x, y, z);
  };
}

// geometryFactories 是这个文件最核心的一层。
// 它把图元类型映射到真正创建 geometry 的函数。
// 页面层只要拿到 type 和 params，就能统一生成任意图元。
const geometryFactories = {
  box: (p) => new THREE.BoxGeometry(p.width, p.height, p.depth, p.widthSegments, p.heightSegments, p.depthSegments),
  circle: (p) => new THREE.CircleGeometry(p.radius, p.segments, p.thetaStart, p.thetaLength),
  cone: (p) => new THREE.ConeGeometry(p.radius, p.height, p.radialSegments, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength),
  cylinder: (p) => new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments, p.heightSegments, p.openEnded, p.thetaStart, p.thetaLength),
  octahedron: (p) => new THREE.OctahedronGeometry(p.radius, p.detail),
  dodecahedron: (p) => new THREE.DodecahedronGeometry(p.radius, p.detail),
  extrude: (p) => new THREE.ExtrudeGeometry(createStarShape(p.spikes, p.outerRadius, p.innerRadius), { depth: p.depth, steps: p.steps, bevelEnabled: p.bevelEnabled, bevelSegments: p.bevelSegments, bevelSize: p.bevelSize, bevelThickness: p.bevelThickness }),
  icosahedron: (p) => new THREE.IcosahedronGeometry(p.radius, p.detail),
  lathe: (p) => new THREE.LatheGeometry(createLathePoints(p.profileWidth, p.profileHeight, p.neckWidth), p.segments, 0, p.phiLength),
  parametric: (p) => new ParametricGeometry(createParametricSurface(p), p.slices, p.stacks),
  plane: (p) => new THREE.PlaneGeometry(p.width, p.height, p.widthSegments, p.heightSegments),
  polyhedron: (p) => createPolyhedronGeometry(p.radius, p.detail),
  ring: (p) => new THREE.RingGeometry(p.innerRadius, p.outerRadius, p.thetaSegments, p.phiSegments, p.thetaStart, p.thetaLength),
  shape: (p) => new THREE.ShapeGeometry(createTriangleShape(p.width, p.height), p.curveSegments),
  sphere: (p) => new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength),
  tetrahedron: (p) => new THREE.TetrahedronGeometry(p.radius, p.detail),
  text: (p) => new TextGeometry('Three', { font: parsedFont, size: p.size, depth: p.depth, curveSegments: p.curveSegments, bevelEnabled: p.bevelEnabled, bevelThickness: p.bevelThickness, bevelSize: p.bevelSize, bevelSegments: p.bevelSegments }),
  torus: (p) => new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments, p.arc),
  torusKnot: (p) => new THREE.TorusKnotGeometry(p.radius, p.tube, p.tubularSegments, p.radialSegments, p.p, p.q),
  tube: (p) => new THREE.TubeGeometry(createTubePath(p.pathHeight, p.pathDepth), p.tubularSegments, p.radius, p.radialSegments, p.closed),
};

// codeFactories 和 geometryFactories 一一对应。
// geometryFactories 负责真的创建图元，codeFactories 负责生成页面上展示的构造代码。
const codeFactories = {
  box: (p) => `new THREE.BoxGeometry(${formatNumber(p.width)}, ${formatNumber(p.height)}, ${formatNumber(p.depth)}, ${p.widthSegments}, ${p.heightSegments}, ${p.depthSegments})`,
  circle: (p) => `new THREE.CircleGeometry(${formatNumber(p.radius)}, ${p.segments}, ${formatNumber(p.thetaStart)}, ${formatNumber(p.thetaLength)})`,
  cone: (p) => `new THREE.ConeGeometry(${formatNumber(p.radius)}, ${formatNumber(p.height)}, ${p.radialSegments}, ${p.heightSegments}, ${p.openEnded}, ${formatNumber(p.thetaStart)}, ${formatNumber(p.thetaLength)})`,
  cylinder: (p) => `new THREE.CylinderGeometry(${formatNumber(p.radiusTop)}, ${formatNumber(p.radiusBottom)}, ${formatNumber(p.height)}, ${p.radialSegments}, ${p.heightSegments}, ${p.openEnded}, ${formatNumber(p.thetaStart)}, ${formatNumber(p.thetaLength)})`,
  octahedron: (p) => `new THREE.OctahedronGeometry(${formatNumber(p.radius)}, ${p.detail})`,
  dodecahedron: (p) => `new THREE.DodecahedronGeometry(${formatNumber(p.radius)}, ${p.detail})`,
  extrude: (p) => `new THREE.ExtrudeGeometry(starShape, { depth: ${formatNumber(p.depth)}, steps: ${p.steps}, bevelEnabled: ${p.bevelEnabled}, bevelSegments: ${p.bevelSegments}, bevelSize: ${formatNumber(p.bevelSize)}, bevelThickness: ${formatNumber(p.bevelThickness)} })`,
  icosahedron: (p) => `new THREE.IcosahedronGeometry(${formatNumber(p.radius)}, ${p.detail})`,
  lathe: (p) => `new THREE.LatheGeometry(points(profile), ${p.segments}, 0, ${formatNumber(p.phiLength)})`,
  parametric: (p) => `new ParametricGeometry(surfaceFn, ${p.slices}, ${p.stacks})`,
  plane: (p) => `new THREE.PlaneGeometry(${formatNumber(p.width)}, ${formatNumber(p.height)}, ${p.widthSegments}, ${p.heightSegments})`,
  polyhedron: (p) => `new THREE.PolyhedronGeometry(vertices, indices, ${formatNumber(p.radius)}, ${p.detail})`,
  ring: (p) => `new THREE.RingGeometry(${formatNumber(p.innerRadius)}, ${formatNumber(p.outerRadius)}, ${p.thetaSegments}, ${p.phiSegments}, ${formatNumber(p.thetaStart)}, ${formatNumber(p.thetaLength)})`,
  shape: (p) => `new THREE.ShapeGeometry(triangleShape, ${p.curveSegments})`,
  sphere: (p) => `new THREE.SphereGeometry(${formatNumber(p.radius)}, ${p.widthSegments}, ${p.heightSegments}, ${formatNumber(p.phiStart)}, ${formatNumber(p.phiLength)}, ${formatNumber(p.thetaStart)}, ${formatNumber(p.thetaLength)})`,
  tetrahedron: (p) => `new THREE.TetrahedronGeometry(${formatNumber(p.radius)}, ${p.detail})`,
  text: (p) => `new TextGeometry("Three", { font, size: ${formatNumber(p.size)}, depth: ${formatNumber(p.depth)}, curveSegments: ${p.curveSegments}, bevelEnabled: ${p.bevelEnabled}, bevelThickness: ${formatNumber(p.bevelThickness)}, bevelSize: ${formatNumber(p.bevelSize)}, bevelSegments: ${p.bevelSegments} })`,
  torus: (p) => `new THREE.TorusGeometry(${formatNumber(p.radius)}, ${formatNumber(p.tube)}, ${p.radialSegments}, ${p.tubularSegments}, ${formatNumber(p.arc)})`,
  torusKnot: (p) => `new THREE.TorusKnotGeometry(${formatNumber(p.radius)}, ${formatNumber(p.tube)}, ${p.tubularSegments}, ${p.radialSegments}, ${p.p}, ${p.q})`,
  tube: (p) => `new THREE.TubeGeometry(path, ${p.tubularSegments}, ${formatNumber(p.radius)}, ${p.radialSegments}, ${p.closed})`,
};

// primitiveCatalog 是整个图元系统的共享目录。
// 总览页、详情页、滑块、代码展示都从这里读取。
// 每一项里最重要的字段有 id、type、defaults、controls。
export const primitiveCatalog = [
  { id: 'box-geometry', type: 'box', name: 'BoxGeometry', label: '盒子', summary: '规则立方体。', color: 0x6dd3ce, baseRotationX: 0.45, baseRotationY: 0.55, defaults: { width: 1.2, height: 1.2, depth: 1.2, widthSegments: 2, heightSegments: 2, depthSegments: 2 }, controls: [{ key: 'width', label: '宽度', min: 0.4, max: 3, step: 0.1, help: '控制 X 方向尺寸。' }, { key: 'height', label: '高度', min: 0.4, max: 3, step: 0.1, help: '控制 Y 方向尺寸。' }, { key: 'depth', label: '深度', min: 0.4, max: 3, step: 0.1, help: '控制 Z 方向尺寸。' }, { key: 'widthSegments', label: '宽度分段', min: 1, max: 8, step: 1, help: '宽度方向的网格密度。' }, { key: 'heightSegments', label: '高度分段', min: 1, max: 8, step: 1, help: '高度方向的网格密度。' }, { key: 'depthSegments', label: '深度分段', min: 1, max: 8, step: 1, help: '深度方向的网格密度。' }], useCases: ['建筑体块', '占位模型', '规则几何'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'circle-geometry', type: 'circle', name: 'CircleGeometry', label: '平面圆', summary: '二维圆面。', color: 0x9cf0b6, baseRotationX: -0.95, baseRotationY: 0.35, defaults: { radius: 0.9, segments: 48, thetaStart: 0, thetaLength: Math.PI * 2 }, controls: [{ key: 'radius', label: '半径', min: 0.2, max: 1.6, step: 0.05, help: '控制圆面的大小。' }, { key: 'segments', label: '圆周分段', min: 3, max: 64, step: 1, help: '越高越圆滑。' }, { key: 'thetaStart', label: '起始角', min: 0, max: Math.PI * 2, step: 0.1, help: '从哪个角度开始绘制。' }, { key: 'thetaLength', label: '角度长度', min: 0.2, max: Math.PI * 2, step: 0.1, help: '小于整圆时会变成扇形。' }], useCases: ['扇形图', 'UI 圆盘', '标记面片'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'cone-geometry', type: 'cone', name: 'ConeGeometry', label: '锥形', summary: '适合箭头和尖顶。', color: 0xf5b971, baseRotationX: 0.28, baseRotationY: 0.45, defaults: { radius: 0.72, height: 1.6, radialSegments: 48, heightSegments: 1, openEnded: false, thetaStart: 0, thetaLength: Math.PI * 2 }, controls: [{ key: 'radius', label: '底部半径', min: 0.2, max: 1.4, step: 0.05, help: '控制底座大小。' }, { key: 'height', label: '高度', min: 0.4, max: 2.6, step: 0.05, help: '控制锥体长度。' }, { key: 'radialSegments', label: '圆周分段', min: 3, max: 64, step: 1, help: '越高越圆。' }, { key: 'heightSegments', label: '高度分段', min: 1, max: 8, step: 1, help: '高度方向切多少层。' }, { key: 'thetaStart', label: '起始角', min: 0, max: Math.PI * 2, step: 0.1, help: '从哪个角度开始绘制。' }, { key: 'thetaLength', label: '角度长度', min: 0.3, max: Math.PI * 2, step: 0.1, help: '控制绘制范围。' }, { key: 'openEnded', label: '底部开口', type: 'boolean', help: '开启后底部不会封口。' }], useCases: ['箭头', '尖顶', '路标'], fixedInputs: ['ConeGeometry 是上半径为 0 的圆柱体。'] },
  { id: 'cylinder-geometry', type: 'cylinder', name: 'CylinderGeometry', label: '圆柱', summary: '适合柱子和瓶身。', color: 0xe68ca8, baseRotationX: 0.28, baseRotationY: 0.5, defaults: { radiusTop: 0.65, radiusBottom: 0.65, height: 1.5, radialSegments: 40, heightSegments: 1, openEnded: false, thetaStart: 0, thetaLength: Math.PI * 2 }, controls: [{ key: 'radiusTop', label: '顶部半径', min: 0.1, max: 1.3, step: 0.05, help: '控制上端粗细。' }, { key: 'radiusBottom', label: '底部半径', min: 0.1, max: 1.3, step: 0.05, help: '控制下端粗细。' }, { key: 'height', label: '高度', min: 0.4, max: 2.6, step: 0.05, help: '控制整体高度。' }, { key: 'radialSegments', label: '圆周分段', min: 3, max: 64, step: 1, help: '越高越圆。' }, { key: 'heightSegments', label: '高度分段', min: 1, max: 8, step: 1, help: '高度方向切多少层。' }, { key: 'thetaStart', label: '起始角', min: 0, max: Math.PI * 2, step: 0.1, help: '从哪个角度开始绘制。' }, { key: 'thetaLength', label: '角度长度', min: 0.3, max: Math.PI * 2, step: 0.1, help: '控制绘制范围。' }, { key: 'openEnded', label: '上下开口', type: 'boolean', help: '开启后上下都不封口。' }], useCases: ['柱子', '瓶身', '管道'], fixedInputs: ['当顶部半径为 0 时会退化成锥体。'] },
  { id: 'octahedron-geometry', type: 'octahedron', name: 'OctahedronGeometry', label: '八面体', summary: '低模经典多面体。', color: 0x8ea7ff, baseRotationX: 0.55, baseRotationY: 0.58, defaults: { radius: 0.95, detail: 0 }, controls: [{ key: 'radius', label: '半径', min: 0.3, max: 1.8, step: 0.05, help: '控制整体大小。' }, { key: 'detail', label: '细分层级', min: 0, max: 3, step: 1, help: '越高越圆润。' }], useCases: ['低模宝石', '抽象图形'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'dodecahedron-geometry', type: 'dodecahedron', name: 'DodecahedronGeometry', label: '十二面体', summary: '由 12 个五边形面构成。', color: 0xffc857, baseRotationX: 0.42, baseRotationY: 0.62, defaults: { radius: 0.9, detail: 0 }, controls: [{ key: 'radius', label: '半径', min: 0.3, max: 1.8, step: 0.05, help: '控制整体大小。' }, { key: 'detail', label: '细分层级', min: 0, max: 3, step: 1, help: '越高越圆润。' }], useCases: ['抽象装饰', '数学教学'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'extrude-geometry', type: 'extrude', name: 'ExtrudeGeometry', label: '挤压 2D 形状', summary: '把二维轮廓挤出成实体。', color: 0x5dd39e, baseRotationX: -0.35, baseRotationY: 0.55, defaults: { spikes: 5, outerRadius: 0.95, innerRadius: 0.42, depth: 0.45, steps: 1, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.06, bevelThickness: 0.08 }, controls: [{ key: 'spikes', label: '星角数量', min: 3, max: 8, step: 1, help: '控制示例轮廓有几个角。' }, { key: 'outerRadius', label: '外半径', min: 0.4, max: 1.4, step: 0.05, help: '控制外轮廓大小。' }, { key: 'innerRadius', label: '内半径', min: 0.1, max: 0.8, step: 0.05, help: '越小尖角越明显。' }, { key: 'depth', label: '挤出深度', min: 0.1, max: 1.2, step: 0.05, help: '控制立体厚度。' }, { key: 'steps', label: '挤出层数', min: 1, max: 8, step: 1, help: '沿厚度方向切多少层。' }, { key: 'bevelEnabled', label: '启用倒角', type: 'boolean', help: '控制边缘是否圆滑。' }, { key: 'bevelSegments', label: '倒角分段', min: 1, max: 8, step: 1, help: '倒角切分层数。' }, { key: 'bevelSize', label: '倒角宽度', min: 0, max: 0.2, step: 0.01, help: '倒角在平面方向的宽度。' }, { key: 'bevelThickness', label: '倒角厚度', min: 0, max: 0.2, step: 0.01, help: '倒角在厚度方向推进的深度。' }], useCases: ['徽标', '按钮', '铭牌'], fixedInputs: ['示例固定使用星形轮廓，但换任意 Shape 都可以。'] },
  { id: 'icosahedron-geometry', type: 'icosahedron', name: 'IcosahedronGeometry', label: '二十面体', summary: '20 个三角面构成。', color: 0x7fc8f8, baseRotationX: 0.38, baseRotationY: 0.55, defaults: { radius: 0.92, detail: 0 }, controls: [{ key: 'radius', label: '半径', min: 0.3, max: 1.8, step: 0.05, help: '控制整体大小。' }, { key: 'detail', label: '细分层级', min: 0, max: 3, step: 1, help: '越高越接近球体。' }], useCases: ['低模球体', '宝石'], fixedInputs: ['detail 越高越圆。'] },
  { id: 'lathe-geometry', type: 'lathe', name: 'LatheGeometry', label: '旋转成型', summary: '让 2D 轮廓绕 Y 轴旋转。', color: 0xf08a5d, baseRotationX: 0.14, baseRotationY: 0.42, distanceMultiplier: 1.9, defaults: { profileWidth: 1, profileHeight: 1, neckWidth: 0.8, segments: 32, phiLength: Math.PI * 2 }, controls: [{ key: 'profileWidth', label: '轮廓宽度', min: 0.5, max: 1.6, step: 0.05, help: '控制瓶身整体宽度。' }, { key: 'profileHeight', label: '轮廓高度', min: 0.6, max: 1.6, step: 0.05, help: '控制瓶身整体高度。' }, { key: 'neckWidth', label: '瓶颈宽度', min: 0.4, max: 1.2, step: 0.05, help: '控制收口区域粗细。' }, { key: 'segments', label: '旋转分段', min: 3, max: 64, step: 1, help: '绕轴旋转时切成多少段。' }, { key: 'phiLength', label: '旋转角度', min: 0.3, max: Math.PI * 2, step: 0.1, help: '总共旋转多大角度。' }], useCases: ['酒瓶', '烛台', '杯子', '灯泡'], fixedInputs: ['底层是一组固定 2D 轮廓点模板。'] },
  { id: 'parametric-geometry', type: 'parametric', name: 'ParametricGeometry', label: '参数曲面', summary: '用函数把二维参数映射到三维表面。', color: 0x72efdd, baseRotationX: -0.7, baseRotationY: 0.35, distanceMultiplier: 1.75, defaults: { width: 2.3, depth: 2.3, amplitude: 0.34, frequencyU: 2, frequencyV: 2, slices: 32, stacks: 32 }, controls: [{ key: 'width', label: '表面宽度', min: 1.2, max: 3.4, step: 0.1, help: '控制 X 方向展开宽度。' }, { key: 'depth', label: '表面深度', min: 1.2, max: 3.4, step: 0.1, help: '控制 Z 方向展开深度。' }, { key: 'amplitude', label: '波浪振幅', min: 0.05, max: 0.8, step: 0.01, help: '控制波峰和波谷落差。' }, { key: 'frequencyU', label: 'U 方向频率', min: 1, max: 6, step: 1, help: '控制 U 方向波纹密度。' }, { key: 'frequencyV', label: 'V 方向频率', min: 1, max: 6, step: 1, help: '控制 V 方向波纹密度。' }, { key: 'slices', label: 'U 方向分段', min: 4, max: 64, step: 1, help: 'U 方向切多少列。' }, { key: 'stacks', label: 'V 方向分段', min: 4, max: 64, step: 1, help: 'V 方向切多少行。' }], useCases: ['波浪地形', '数学曲面', '自定义表面'], fixedInputs: ['示例底层是波浪函数，不是固定图元。'] },
  { id: 'plane-geometry', type: 'plane', name: 'PlaneGeometry', label: '2D 平面', summary: '最常用的二维矩形面片。', color: 0xa1c181, baseRotationX: -0.95, baseRotationY: 0.28, defaults: { width: 1.8, height: 1.1, widthSegments: 8, heightSegments: 6 }, controls: [{ key: 'width', label: '宽度', min: 0.4, max: 3.4, step: 0.1, help: '控制平面宽度。' }, { key: 'height', label: '高度', min: 0.4, max: 3.4, step: 0.1, help: '控制平面高度。' }, { key: 'widthSegments', label: '宽度分段', min: 1, max: 20, step: 1, help: '宽度方向切分数量。' }, { key: 'heightSegments', label: '高度分段', min: 1, max: 20, step: 1, help: '高度方向切分数量。' }], useCases: ['地面', '屏幕', '位移贴图'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'polyhedron-geometry', type: 'polyhedron', name: 'PolyhedronGeometry', label: '多面体投影', summary: '先给顶点和三角面，再投影到球面。', color: 0xf7a072, baseRotationX: 0.4, baseRotationY: 0.55, defaults: { radius: 0.92, detail: 1 }, controls: [{ key: 'radius', label: '半径', min: 0.3, max: 1.8, step: 0.05, help: '控制投影后整体大小。' }, { key: 'detail', label: '细分层级', min: 0, max: 3, step: 1, help: '越高越接近球体。' }], useCases: ['晶体', '数学演示'], fixedInputs: ['顶点和三角索引使用固定示例数据。'] },
  { id: 'ring-geometry', type: 'ring', name: 'RingGeometry', label: '中空圆盘', summary: '可做圆环 UI 和魔法阵。', color: 0xb8c0ff, baseRotationX: -1.05, baseRotationY: 0.42, defaults: { innerRadius: 0.4, outerRadius: 0.9, thetaSegments: 48, phiSegments: 1, thetaStart: 0, thetaLength: Math.PI * 2 }, controls: [{ key: 'innerRadius', label: '内半径', min: 0.05, max: 0.9, step: 0.05, help: '控制中心洞大小。' }, { key: 'outerRadius', label: '外半径', min: 0.2, max: 1.4, step: 0.05, help: '控制外缘大小。' }, { key: 'thetaSegments', label: '圆周分段', min: 3, max: 64, step: 1, help: '圆周方向切分数量。' }, { key: 'phiSegments', label: '径向分段', min: 1, max: 8, step: 1, help: '从内圈到外圈分几层。' }, { key: 'thetaStart', label: '起始角', min: 0, max: Math.PI * 2, step: 0.1, help: '从哪个角度开始绘制。' }, { key: 'thetaLength', label: '角度长度', min: 0.3, max: Math.PI * 2, step: 0.1, help: '控制绘制范围。' }], useCases: ['圆环 UI', '进度条', '魔法阵'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'shape-geometry', type: 'shape', name: 'ShapeGeometry', label: '2D 三角轮廓', summary: '把二维 Shape 三角化成平面网格。', color: 0xf4d35e, baseRotationX: -0.9, baseRotationY: 0.38, defaults: { width: 1.9, height: 1.7, curveSegments: 8 }, controls: [{ key: 'width', label: '宽度', min: 0.6, max: 3, step: 0.1, help: '控制示例轮廓宽度。' }, { key: 'height', label: '高度', min: 0.6, max: 3, step: 0.1, help: '控制示例轮廓高度。' }, { key: 'curveSegments', label: '曲线分段', min: 1, max: 20, step: 1, help: '曲线离散化时的分段数。' }], useCases: ['平面图标', '自定义轮廓'], fixedInputs: ['示例固定使用三角形 Shape。'] },
  { id: 'sphere-geometry', type: 'sphere', name: 'SphereGeometry', label: '球体', summary: '适合星球和球形道具。', color: 0x6c9bd2, baseRotationX: 0.36, baseRotationY: 0.52, defaults: { radius: 0.9, widthSegments: 48, heightSegments: 32, phiStart: 0, phiLength: Math.PI * 2, thetaStart: 0, thetaLength: Math.PI }, controls: [{ key: 'radius', label: '半径', min: 0.2, max: 1.6, step: 0.05, help: '控制球体大小。' }, { key: 'widthSegments', label: '经向分段', min: 3, max: 64, step: 1, help: '控制横向圆滑程度。' }, { key: 'heightSegments', label: '纬向分段', min: 2, max: 48, step: 1, help: '控制纵向圆滑程度。' }, { key: 'phiStart', label: '经度起点', min: 0, max: Math.PI * 2, step: 0.1, help: '从哪条经线开始绘制。' }, { key: 'phiLength', label: '经度范围', min: 0.3, max: Math.PI * 2, step: 0.1, help: '控制经度方向绘制范围。' }, { key: 'thetaStart', label: '纬度起点', min: 0, max: Math.PI, step: 0.1, help: '从哪个纬度开始绘制。' }, { key: 'thetaLength', label: '纬度范围', min: 0.3, max: Math.PI, step: 0.1, help: '控制纬度方向绘制范围。' }], useCases: ['星球', '球体道具', '半球'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'tetrahedron-geometry', type: 'tetrahedron', name: 'TetrahedronGeometry', label: '四面体', summary: '最简单的规则多面体。', color: 0xff7b72, baseRotationX: 0.55, baseRotationY: 0.6, defaults: { radius: 1, detail: 0 }, controls: [{ key: 'radius', label: '半径', min: 0.3, max: 1.8, step: 0.05, help: '控制整体大小。' }, { key: 'detail', label: '细分层级', min: 0, max: 3, step: 1, help: '越高越圆润。' }], useCases: ['数学教学', '低模图形'], fixedInputs: ['四面体只有 4 个三角面。'] },
  { id: 'text-geometry', type: 'text', name: 'TextGeometry', label: '3D 文字', summary: '把字符串和字体变成立体文字。', color: 0x7bdff2, baseRotationX: -0.18, baseRotationY: 0.42, distanceMultiplier: 1.9, defaults: { size: 0.45, depth: 0.18, curveSegments: 12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3 }, controls: [{ key: 'size', label: '字号', min: 0.2, max: 1, step: 0.02, help: '控制文字大小。' }, { key: 'depth', label: '厚度', min: 0.05, max: 0.6, step: 0.01, help: '控制挤出的厚度。' }, { key: 'curveSegments', label: '曲线分段', min: 1, max: 24, step: 1, help: '控制字体轮廓圆滑度。' }, { key: 'bevelEnabled', label: '启用倒角', type: 'boolean', help: '控制边缘是否圆滑。' }, { key: 'bevelThickness', label: '倒角厚度', min: 0, max: 0.1, step: 0.005, help: '控制倒角推进深度。' }, { key: 'bevelSize', label: '倒角宽度', min: 0, max: 0.1, step: 0.005, help: '控制倒角平面宽度。' }, { key: 'bevelSegments', label: '倒角分段', min: 1, max: 8, step: 1, help: '控制倒角切分层数。' }], useCases: ['标题', 'Logo', '3D 文案'], fixedInputs: ['示例文字固定为 Three，字体固定为 helvetiker_regular。'] },
  { id: 'torus-geometry', type: 'torus', name: 'TorusGeometry', label: '圆环体', summary: '甜甜圈形体。', color: 0xcdb4db, baseRotationX: 0.88, baseRotationY: 0.25, defaults: { radius: 0.65, tube: 0.22, radialSegments: 20, tubularSegments: 64, arc: Math.PI * 2 }, controls: [{ key: 'radius', label: '主半径', min: 0.2, max: 1.4, step: 0.05, help: '控制圆环主尺寸。' }, { key: 'tube', label: '管半径', min: 0.05, max: 0.5, step: 0.01, help: '控制圆管粗细。' }, { key: 'radialSegments', label: '截面分段', min: 3, max: 32, step: 1, help: '控制截面圆切分数量。' }, { key: 'tubularSegments', label: '环向分段', min: 3, max: 96, step: 1, help: '控制主环切分数量。' }, { key: 'arc', label: '环绕角度', min: 0.3, max: Math.PI * 2, step: 0.1, help: '控制环绕绘制范围。' }], useCases: ['轮胎', '戒指', '环形装饰'], fixedInputs: ['没有额外固定输入。'] },
  { id: 'torus-knot-geometry', type: 'torusKnot', name: 'TorusKnotGeometry', label: '环形节', summary: '复杂缠绕的圆环结构。', color: 0x80ed99, baseRotationX: 0.72, baseRotationY: 0.28, defaults: { radius: 0.55, tube: 0.18, tubularSegments: 100, radialSegments: 16, p: 2, q: 3 }, controls: [{ key: 'radius', label: '主半径', min: 0.2, max: 1.2, step: 0.05, help: '控制整体大小。' }, { key: 'tube', label: '管半径', min: 0.05, max: 0.4, step: 0.01, help: '控制管体粗细。' }, { key: 'tubularSegments', label: '路径分段', min: 16, max: 160, step: 1, help: '控制沿路径的切分数量。' }, { key: 'radialSegments', label: '截面分段', min: 3, max: 32, step: 1, help: '控制截面切分数量。' }, { key: 'p', label: 'P 缠绕次数', min: 1, max: 8, step: 1, help: '控制一个方向的绕圈次数。' }, { key: 'q', label: 'Q 缠绕次数', min: 1, max: 8, step: 1, help: '和 P 一起决定缠绕形态。' }], useCases: ['科幻物件', '装饰 Logo', '数学演示'], fixedInputs: ['P / Q 组合会决定完全不同的缠绕结果。'] },
  { id: 'tube-geometry', type: 'tube', name: 'TubeGeometry', label: '沿路径生成圆管', summary: '让圆管沿着路径前进。', color: 0x4ecdc4, baseRotationX: 0.4, baseRotationY: 0.25, distanceMultiplier: 1.85, defaults: { pathHeight: 1, pathDepth: 1, tubularSegments: 64, radius: 0.14, radialSegments: 16, closed: false }, controls: [{ key: 'pathHeight', label: '路径高度起伏', min: 0.5, max: 1.8, step: 0.05, help: '控制路径在 Y 方向的起伏。' }, { key: 'pathDepth', label: '路径前后摆动', min: 0.5, max: 1.8, step: 0.05, help: '控制路径在 Z 方向的摆动。' }, { key: 'tubularSegments', label: '路径分段', min: 8, max: 128, step: 1, help: '控制沿路径切多少段。' }, { key: 'radius', label: '管半径', min: 0.04, max: 0.3, step: 0.01, help: '控制圆管粗细。' }, { key: 'radialSegments', label: '截面分段', min: 3, max: 32, step: 1, help: '控制截面切分数量。' }, { key: 'closed', label: '闭合路径', type: 'boolean', help: '控制路径是否首尾闭合。' }], useCases: ['电缆', '轨道', '管道', '流线'], fixedInputs: ['底层路径使用 CatmullRomCurve3 模板。'] },
];

// 详情页路由进入后，会先通过 id 找到对应的图元定义。
export function getPrimitiveById(id) {
  return primitiveCatalog.find((item) => item.id === id);
}

// defaults 是目录里的原始默认值。
// 进入详情页或点击重置时，都要克隆一份新对象，避免直接修改目录本身。
export function clonePrimitiveParams(definition) {
  return { ...definition.defaults };
}

// 对外暴露统一的 geometry 创建入口。
// 这样别的文件不需要知道具体是 BoxGeometry 还是 TubeGeometry。
export function createGeometryForPrimitive(definition, params) {
  return geometryFactories[definition.type](params);
}

// 对外暴露统一的代码展示入口，和 geometry 创建逻辑保持同样的分发方式。
export function getPrimitiveCode(definition, params) {
  return codeFactories[definition.type](params);
}
