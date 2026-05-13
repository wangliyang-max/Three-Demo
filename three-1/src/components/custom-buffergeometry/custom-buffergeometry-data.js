export const customBufferGeometryCatalog = [
  {
    id: 'position-attribute-triangle',
    name: 'Position Attribute',
    label: '用 position 顶点数组画三角形',
    summary: '从最基础的 position attribute 开始，手动告诉 BufferGeometry 每个顶点在哪里。',
    learningFocus: '理解 BufferGeometry 本身不关心“三角形”这个概念，它只读取 position 数组并按每 3 个顶点组成一个三角形。',
    observationHint: '观察彩色三角面：它不是 PlaneGeometry，而是手动写入 3 个顶点位置生成的。',
    code: `// 1. 创建空的 BufferGeometry
const geometry = new THREE.BufferGeometry();

// 2. position 数组：每 3 个数字表示一个顶点的 x、y、z
const positions = new Float32Array([
  -1, -1, 0,
   1, -1, 0,
   0,  1, 0,
]);

// 3. itemSize = 3，表示一个顶点位置由 3 个数字组成
const positionAttribute = new THREE.BufferAttribute(positions, 3);

// 4. 名字必须叫 position，内置材质才知道这是顶点位置
geometry.setAttribute('position', positionAttribute);

// 5. 使用普通材质渲染这份自定义几何体
const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshBasicMaterial({ color: '#7dd3fc', side: THREE.DoubleSide }),
);
scene.add(mesh);`,
    parameters: [
      { name: 'BufferGeometry', description: '空几何体容器，本身不自带顶点，顶点数据由 attribute 提供。' },
      { name: 'positions', description: '顶点位置数组，按 x、y、z 连续排列。' },
      { name: 'BufferAttribute(positions, 3)', description: '把 TypedArray 包装成 three.js 能上传到 GPU 的顶点属性，3 表示每个顶点占 3 个数。' },
      { name: "setAttribute('position')", description: '把这组数据注册成顶点位置；position 是内置材质识别的固定名称。' },
    ],
    usageNotes: ['最少 3 个顶点可以组成一个三角形。', 'position 通常必须存在，否则几何体没有空间形状。', 'Float32Array 比普通数组更适合传给 GPU。'],
  },
  {
    id: 'indexed-geometry',
    name: 'Indexed Geometry',
    label: '用 index 复用顶点',
    summary: '当多个三角形可以共享完全相同的顶点数据时，可以用 setIndex 减少重复顶点。',
    learningFocus: '理解索引不是顶点数据本身，而是告诉 GPU 按什么顺序引用已有顶点。',
    observationHint: '观察正方形：它由 4 个顶点和 6 个索引组成，而不是重复写 6 个顶点。',
    code: `const geometry = new THREE.BufferGeometry();

// 1. 只写 4 个顶点，表示正方形四个角
const positions = new Float32Array([
  -1, -1, 0,
   1, -1, 0,
   1,  1, 0,
  -1,  1, 0,
]);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 2. index 定义三角形如何引用这 4 个顶点
// 第一个三角形：0 -> 1 -> 2
// 第二个三角形：0 -> 2 -> 3
geometry.setIndex([
  0, 1, 2,
  0, 2, 3,
]);

// 3. 计算法线后，受光材质才能正确显示明暗
geometry.computeVertexNormals();

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);`,
    parameters: [
      { name: 'positions', description: '只保存 4 个唯一顶点，避免把共享顶点重复写两遍。' },
      { name: 'setIndex', description: '索引数组，每 3 个索引组成一个三角形，索引值指向 position 中的顶点编号。' },
      { name: 'computeVertexNormals', description: '根据三角形面自动计算 normal，方便 MeshStandardMaterial 等受光材质使用。' },
      { name: '顶点复用限制', description: '只有 position、normal、uv 等所有属性都相同时，顶点才适合共享。' },
    ],
    usageNotes: ['索引适合网格、地形、规则面片等共享顶点多的模型。', '立方体角点虽然位置相同，但不同面 normal/uv 不同，通常不能简单共享 8 个角。', '索引能减少数据量，但也要保证顶点属性语义正确。'],
  },
  {
    id: 'uv-normal-attributes',
    name: 'UV And Normal Attributes',
    label: '补充 uv 和 normal 属性',
    summary: 'position 只决定形状，uv 决定贴图怎么铺，normal 决定灯光怎么照。',
    learningFocus: '理解一个顶点是 position、normal、uv 等属性的组合；位置相同但属性不同，也应该拆成不同顶点。',
    observationHint: '观察斜面上的棋盘贴图和受光明暗：它们分别来自 uv 和 normal 属性。',
    code: `const geometry = new THREE.BufferGeometry();

const positions = new Float32Array([
  -1, -1, 0,
   1, -1, 0,
   1,  1, 0,
  -1,  1, 0,
]);
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1,
]);
const normals = new Float32Array([
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
]);

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
geometry.setIndex([0, 1, 2, 0, 2, 3]);

const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ map: checkerTexture }),
);`,
    parameters: [
      { name: 'uv', description: '纹理坐标，每个顶点 2 个数字，表示贴图中的 u、v 采样位置。' },
      { name: 'normal', description: '法线方向，每个顶点 3 个数字，影响受光材质的明暗计算。' },
      { name: 'itemSize', description: 'position/normal 的 itemSize 是 3，uv 的 itemSize 是 2。' },
      { name: '顶点组合', description: '同一个空间位置如果需要不同 uv 或 normal，就应该拆成多个顶点。' },
    ],
    usageNotes: ['使用贴图时通常需要 uv。', '使用受光材质时通常需要 normal。', '法线方向错误会导致光照看起来反了或发黑。'],
  },
  {
    id: 'dynamic-vertex-update',
    name: 'Dynamic Vertex Update',
    label: '动态更新顶点数据',
    summary: '运行时修改 BufferAttribute 的数组内容，让几何体像水面、布料或音频波形一样实时变形。',
    learningFocus: '理解修改 TypedArray 后，还要设置 needsUpdate，three.js 才会把新数据重新上传到 GPU。',
    observationHint: '观察网格表面持续起伏：每一帧都在更新 position attribute 的 z 值。',
    code: `const geometry = new THREE.PlaneGeometry(4, 4, 40, 40);
const position = geometry.attributes.position;

// 1. 告诉 three.js：这个 attribute 会频繁更新
position.setUsage(THREE.DynamicDrawUsage);

function render(time) {
  time *= 0.001;

  // 2. 每一帧修改顶点高度，形成波浪
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = Math.sin(x * 2 + time) * 0.25 + Math.cos(y * 2 + time) * 0.25;
    position.setZ(i, z);
  }

  // 3. 通知 three.js 把修改后的 position 上传到 GPU
  position.needsUpdate = true;

  // 4. 顶点变形后重新计算法线，受光效果才会跟着变化
  geometry.computeVertexNormals();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}`,
    parameters: [
      { name: 'geometry.attributes.position', description: 'PlaneGeometry 已经创建好的 position attribute，可直接读取并修改。' },
      { name: 'DynamicDrawUsage', description: '提示 WebGL 这份缓冲会频繁变化，适合动态顶点动画。' },
      { name: 'setZ', description: '修改某个顶点的 z 坐标，让平面产生高度变化。' },
      { name: 'needsUpdate', description: '必须设置为 true，否则 CPU 里改了数组，GPU 不一定会收到新数据。' },
      { name: 'computeVertexNormals', description: '顶点高度变化后重新计算法线，让光照和波浪形状一致。' },
    ],
    usageNotes: ['适合水面、布料、地形、音频可视化等实时变形。', '频繁更新大量顶点有性能成本，要控制细分数量。', '只改颜色或 uv 时，也要对对应 attribute 设置 needsUpdate。'],
  },
];

export function getCustomBufferGeometryById(id) {
  return customBufferGeometryCatalog.find((item) => item.id === id);
}
