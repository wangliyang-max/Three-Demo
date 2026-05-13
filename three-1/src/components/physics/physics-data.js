export const physicsCatalog = [
  {
    id: 'gravity-step',
    name: 'Gravity Step',
    label: '重力和速度积分',
    summary: '用最小物理循环演示重力：速度受重力影响，位置再根据速度变化。',
    learningFocus: '理解 three.js 只负责显示 mesh，物理状态通常由 position、velocity 等数据先计算出来。',
    observationHint: '观察球体上下弹跳：每一帧先更新速度和位置，再把结果同步到 mesh。',
    code: `const state = {
  position: new THREE.Vector3(0, 3, 0),
  velocity: new THREE.Vector3(0, 0, 0),
};
const gravity = new THREE.Vector3(0, -9.8, 0);

function stepPhysics(deltaTime) {
  // 1. 重力改变速度
  state.velocity.addScaledVector(gravity, deltaTime);

  // 2. 速度改变位置
  state.position.addScaledVector(state.velocity, deltaTime);

  // 3. 和地面做一个简单碰撞
  if (state.position.y < 0.5) {
    state.position.y = 0.5;
    state.velocity.y *= -0.72;
  }

  // 4. 把物理状态同步给 three.js mesh
  ballMesh.position.copy(state.position);
}`,
    parameters: [
      { name: 'state.position', description: '物理世界里的位置数据，最后会同步给 ballMesh.position。' },
      { name: 'state.velocity', description: '速度，表示物体每秒移动多少单位。' },
      { name: 'gravity', description: '重力加速度，每帧累加到 velocity 上。' },
      { name: 'deltaTime', description: '当前物理步长，用来让运动速度和帧率解耦。' },
      { name: 'ballMesh.position.copy', description: '把物理计算结果同步到 three.js 可见物体。' },
    ],
    usageNotes: ['真实项目通常交给物理引擎计算，这里是教学版最小模型。', '先更新物理，再同步 mesh，再渲染。', '弹性小于 1 时，球会逐渐损失能量。'],
  },
  {
    id: 'mesh-body-sync',
    name: 'Mesh Body Sync',
    label: '物理 body 和 mesh 同步',
    summary: '展示 three.js 可见对象和物理 body 是两套数据：body 负责计算，mesh 负责显示。',
    learningFocus: '理解物理世界和渲染场景分离：不要直接让 mesh 决定物理结果，而是把 body 的结果复制给 mesh。',
    observationHint: '观察多个盒子：彩色 mesh 的位置来自对应 body，而不是自己随便移动。',
    code: `const bodies = boxes.map((mesh, index) => ({
  mesh,
  position: new THREE.Vector3(index - 1, 2 + index, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  halfSize: 0.45,
}));

function stepPhysics(deltaTime) {
  for (const body of bodies) {
    body.velocity.y += -9.8 * deltaTime;
    body.position.addScaledVector(body.velocity, deltaTime);

    if (body.position.y < body.halfSize) {
      body.position.y = body.halfSize;
      body.velocity.y *= -0.45;
    }

    // 关键：body 是物理数据，mesh 是渲染对象
    body.mesh.position.copy(body.position);
  }
}`,
    parameters: [
      { name: 'body', description: '简化版物理刚体，保存位置、速度、碰撞半径或半尺寸。' },
      { name: 'mesh', description: 'three.js 里真正画出来的对象，不直接负责物理计算。' },
      { name: 'halfSize', description: '盒子半高，用于判断是否碰到地面。' },
      { name: 'mesh.position.copy', description: '每帧把 body 的位置复制给 mesh，完成物理到渲染的同步。' },
    ],
    usageNotes: ['使用 cannon-es、Rapier 等库时，body 通常由库提供。', '复杂项目会维护 body 和 mesh 的映射表。', '如果有旋转，还要同步 quaternion。'],
  },
  {
    id: 'fixed-time-step',
    name: 'Fixed Time Step',
    label: '固定时间步',
    summary: '用固定时间步更新物理，让物理模拟不直接依赖浏览器当前帧率。',
    learningFocus: '理解渲染帧率可能波动，但物理模拟更适合稳定的小步长。',
    observationHint: '观察小球运动稳定：即使渲染 delta 变化，也会拆成多个固定 step 更新。',
    code: `const fixedTimeStep = 1 / 60;
let accumulator = 0;
let lastTime = 0;

function render(time) {
  const currentTime = time * 0.001;
  const frameDelta = Math.min(currentTime - lastTime, 0.1);
  lastTime = currentTime;
  accumulator += frameDelta;

  // 把不稳定的渲染间隔拆成稳定的 1/60 秒物理步
  while (accumulator >= fixedTimeStep) {
    stepPhysics(fixedTimeStep);
    accumulator -= fixedTimeStep;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}`,
    parameters: [
      { name: 'fixedTimeStep', description: '固定物理步长，常见值是 1/60 秒。' },
      { name: 'accumulator', description: '累积渲染帧之间经过的时间，够一个固定步长就更新一次物理。' },
      { name: 'frameDelta', description: '当前渲染帧和上一帧的真实时间差。' },
      { name: 'while 循环', description: '一帧较慢时可能执行多次物理 step，追上真实时间。' },
    ],
    usageNotes: ['固定步长能让碰撞和约束更稳定。', 'frameDelta 通常要设置上限，避免切回标签页时一次补太多。', '物理引擎通常也推荐类似的 step 方式。'],
  },
  {
    id: 'cannon-es-world',
    name: 'cannon-es World',
    label: '使用 cannon-es 刚体世界',
    summary: '用 cannon-es 创建真实物理世界、刚体和碰撞形状，再把 body 的位置和旋转同步给 three.js mesh。',
    learningFocus: '理解接入物理库后的标准流程：World.step -> Body 模拟 -> mesh 同步。',
    observationHint: '观察蓝色球和金色盒子：运动结果来自 cannon-es 的 World，而不是手写 position/velocity。',
    code: `import * as CANNON from 'cannon-es';

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Box(new CANNON.Vec3(3.5, 0.08, 2.3)),
  position: new CANNON.Vec3(0, 0, 0),
});
world.addBody(groundBody);

const sphereBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Sphere(0.38),
  position: new CANNON.Vec3(-0.85, 3.5, 0.1),
});
sphereBody.velocity.set(1.15, 0, 0.35);
world.addBody(sphereBody);

function render(deltaTime) {
  world.step(1 / 60, deltaTime, 3);

  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);

  renderer.render(scene, camera);
}`,
    parameters: [
      { name: 'CANNON.World', description: 'cannon-es 的物理世界，负责统一推进所有刚体模拟。' },
      { name: 'CANNON.Body', description: '物理刚体，保存质量、位置、速度、旋转和碰撞形状。' },
      { name: 'CANNON.Shape', description: '碰撞形状，例如 Sphere、Box；它决定 body 如何参与碰撞。' },
      { name: 'mass: 0', description: '静态刚体，不会被重力推动，常用于地面、墙体等固定物体。' },
      { name: 'world.step', description: '推进物理世界一步，真正计算重力、碰撞、位置和旋转。' },
      { name: 'quaternion.copy', description: '同步旋转；如果只同步 position，盒子翻滚不会显示出来。' },
    ],
    usageNotes: ['这个示例真实调用 cannon-es，不是手写物理。', 'CANNON.Box 使用半尺寸，和 THREE.BoxGeometry 的完整尺寸不同。', 'three.js mesh 和 CANNON.Body 需要通过数组或 Map 维护对应关系。'],
  },
  {
    id: 'rapier-world',
    name: 'RapierPhysics Addon',
    label: '使用 three 官方 RapierPhysics 封装',
    summary: '展示 three/addons/physics/RapierPhysics.js 的接入方式，用 addMesh 快速把 mesh 加入 Rapier 物理模拟。',
    learningFocus: '理解官方 addon 会封装 Rapier 初始化、物理 step 和 mesh 同步，适合快速原型。',
    observationHint: '预览区展示 body/mesh 同步概念；核心代码展示官方 RapierPhysics addon 的接入方式。',
    code: `import { RapierPhysics } from 'three/addons/physics/RapierPhysics.js';

const physics = await RapierPhysics();

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(6, 0.2, 4),
  groundMaterial,
);
ground.position.y = -0.1;
scene.add(ground);
physics.addMesh(ground, 0, 0.2);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.4),
  sphereMaterial,
);
sphere.position.set(0, 4, 0);
scene.add(sphere);
physics.addMesh(sphere, 1, 0.7);

physics.setMeshVelocity(sphere, new THREE.Vector3(1, 0, 0));`,
    parameters: [
      { name: 'RapierPhysics', description: 'three 官方 examples 里的 Rapier 封装，内部使用 Rapier 物理世界。' },
      { name: 'physics.addMesh', description: '把 three.js mesh 添加到物理模拟，第 2 个参数是质量，第 3 个参数是弹性。' },
      { name: 'mass: 0', description: '静态物体，例如地面；质量大于 0 的物体会受物理模拟影响。' },
      { name: 'setMeshVelocity', description: '给已经加入物理世界的 mesh 设置线速度。' },
      { name: '自动同步', description: 'addon 内部会 step 物理世界，并把 Rapier body 的位置旋转同步回 mesh。' },
    ],
    usageNotes: ['官方 addon 适合快速示例和原型验证。', '它会动态加载 Rapier，需要注意网络和部署环境。', '当前预览区为避免本地 WASM 打包问题，使用降级演示；核心代码展示真实接入方式。'],
  },
  {
    id: 'collision-response',
    name: 'Collision Response',
    label: '碰撞响应和边界',
    summary: '演示简化碰撞响应：物体撞到地面或墙面后修正位置并反转速度。',
    learningFocus: '理解碰撞不是只“检测到重叠”，还要把物体推回合法位置并改变速度。',
    observationHint: '观察球在盒子边界内弹跳：每次碰撞都会修正位置并衰减速度。',
    code: `function collideWithBounds(body, bounds) {
  if (body.position.x < bounds.minX + body.radius) {
    body.position.x = bounds.minX + body.radius;
    body.velocity.x *= -body.restitution;
  }

  if (body.position.x > bounds.maxX - body.radius) {
    body.position.x = bounds.maxX - body.radius;
    body.velocity.x *= -body.restitution;
  }

  if (body.position.y < body.radius) {
    body.position.y = body.radius;
    body.velocity.y *= -body.restitution;
  }
}`,
    parameters: [
      { name: 'bounds', description: '碰撞边界，这里用最简单的 minX/maxX 表示墙。' },
      { name: 'radius', description: '球体半径，用于判断球心距离边界的最小合法距离。' },
      { name: 'restitution', description: '弹性系数，越接近 1 越弹，越接近 0 越不弹。' },
      { name: '位置修正', description: '碰撞后先把物体推回边界内，避免下一帧仍然卡在墙里。' },
      { name: '速度反转', description: '撞墙后反转对应方向速度，形成弹回效果。' },
    ],
    usageNotes: ['完整物理引擎会处理更复杂的形状、摩擦、旋转和堆叠。', '教学示例适合理解碰撞响应顺序。', '只检测不修正位置，物体可能会穿透或抖动。'],
  },
];

export function getPhysicsById(id) {
  return physicsCatalog.find((item) => item.id === id);
}




