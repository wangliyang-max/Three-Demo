import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * 释放材质资源。
 * mesh.material 可能是单个材质，也可能是材质数组；统一封装后，cleanup 队列里不用关心具体形态。
 */
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}

/**
 * 创建当前物理示例专用的 WebGLRenderer。
 * three.js 只负责把 mesh 画出来；物理状态在本文件的 body 对象里计算。
 */
function createRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'physics-canvas';
  stage.appendChild(renderer.domElement);
  return renderer;
}

/**
 * 创建所有物理示例共用的舞台：场景、相机、灯光、地面和网格。
 * cleanup 是资源释放队列，路由卸载时会统一执行里面的 dispose 任务。
 */
function createBaseScene(cleanup) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101827);
  scene.fog = new THREE.Fog(0x101827, 10, 24);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  camera.position.set(5, 4.2, 7.5);
  camera.lookAt(0, 0.9, 0);

  scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x172033, 1.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  // 地面是可见 mesh，同时也是本教学物理里的“碰撞平面”。
  // 简化处理：物理碰撞不读取 floor 几何体，而是统一把 y = 0 当作地面高度。
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.16, 4.6),
    new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.78, metalness: 0.04 }),
  );
  floor.position.y = -0.08;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(7, 14, 0x60a5fa, 0x25364f);
  grid.position.y = 0.01;
  scene.add(grid);

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => grid.geometry.dispose(),
    () => disposeMaterial(grid.material),
  );

  return { scene, camera };
}

/**
 * 创建一个可见球体 mesh。
 * 注意：这个 mesh 只是渲染对象；真正的物理数据会放在 body.position / body.velocity 里。
 */
function createBall(scene, cleanup, color = 0x7dd3fc, radius = 0.38) {
  const geometry = new THREE.SphereGeometry(radius, 32, 16);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.08 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);

  cleanup.push(() => geometry.dispose(), () => disposeMaterial(material));
  return mesh;
}

/**
 * 创建一个可见盒子 mesh。
 * 盒子的物理碰撞在示例中用 halfSize 简化表示，不直接使用 BoxGeometry 做碰撞计算。
 */
function createBox(scene, cleanup, color = 0xfbbf24, size = 0.72) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.08 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  scene.add(mesh);

  cleanup.push(() => geometry.dispose(), () => disposeMaterial(material));
  return mesh;
}

/**
 * 示例 1：重力和速度积分。
 *
 * 这里的 body 是简化版物理刚体：
 * - mesh：three.js 负责显示的对象；
 * - position：物理世界里的位置；
 * - velocity：物理速度；
 * - radius：碰撞检测需要的半径；
 * - restitution：反弹系数。
 */
function createGravityStepDemo(scene, cleanup) {
  const ball = createBall(scene, cleanup, 0x7dd3fc, 0.42);
  const body = {
    mesh: ball,
    position: new THREE.Vector3(0, 3.2, 0),
    velocity: new THREE.Vector3(1.2, 0, 0),
    radius: 0.42,
    restitution: 0.72,
  };
  const gravity = new THREE.Vector3(0, -9.8, 0);

  function step(deltaTime) {
    // 1. 重力影响速度：v = v + g * dt。
    body.velocity.addScaledVector(gravity, deltaTime);

    // 2. 速度影响位置：p = p + v * dt。
    body.position.addScaledVector(body.velocity, deltaTime);

    // 3. 地面碰撞：球心不能低于 radius，否则球体会穿到地面以下。
    if (body.position.y < body.radius) {
      body.position.y = body.radius;
      body.velocity.y *= -body.restitution;
    }

    // 4. 左右边界碰撞，让球保持在可见舞台内。
    if (Math.abs(body.position.x) > 2.7) {
      body.position.x = Math.sign(body.position.x) * 2.7;
      body.velocity.x *= -0.8;
    }

    // 5. 同步：物理 body 算完后，把结果复制给 three.js mesh。
    body.mesh.position.copy(body.position);
  }

  return { step };
}

/**
 * 示例 2：物理 body 和可见 mesh 的同步关系。
 *
 * 真实物理引擎中 body 通常来自 cannon-es、Rapier、Ammo 等库；
 * 这里用普通对象模拟 body，强调“物理数据”和“渲染对象”是两套东西。
 */
function createMeshBodySyncDemo(scene, cleanup) {
  const palette = [0x38bdf8, 0xfbbf24, 0xfb7185];
  const bodies = palette.map((color, index) => ({
    mesh: createBox(scene, cleanup, color, 0.72),
    position: new THREE.Vector3(index - 1, 1.6 + index * 0.9, 0),
    velocity: new THREE.Vector3(0.35 - index * 0.35, 0, 0.15 * index),
    halfSize: 0.36,
    restitution: 0.5 + index * 0.1,
  }));

  function step(deltaTime) {
    bodies.forEach((body, index) => {
      body.velocity.y += -9.8 * deltaTime;
      body.position.addScaledVector(body.velocity, deltaTime);

      // halfSize 表示盒子中心到地面的最小合法高度。
      if (body.position.y < body.halfSize) {
        body.position.y = body.halfSize;
        body.velocity.y *= -body.restitution;
        body.velocity.x += Math.sin(index + body.position.x) * 0.08;
      }

      if (Math.abs(body.position.x) > 2.8) {
        body.position.x = Math.sign(body.position.x) * 2.8;
        body.velocity.x *= -0.75;
      }

      // 同步位置：这是物理引擎接入 three.js 时最常见的一步。
      body.mesh.position.copy(body.position);

      // 教学用的简化旋转：根据速度给 mesh 加一点翻滚感。
      // 完整物理引擎会提供 body.quaternion，再同步给 mesh.quaternion。
      body.mesh.rotation.x += body.velocity.z * 0.04;
      body.mesh.rotation.z -= body.velocity.x * 0.05;
    });
  }

  return { step };
}

/**
 * 示例 3：固定时间步。
 *
 * 这个 demo 的 step 本身和普通重力类似，重点在 createPhysicsPreview 里的 accumulator 逻辑：
 * 不管渲染帧间隔是多少，物理都按固定 1/60 秒的小步推进。
 */
function createFixedTimeStepDemo(scene, cleanup) {
  const ball = createBall(scene, cleanup, 0xa7f3d0, 0.34);
  const marker = createBox(scene, cleanup, 0x64748b, 0.18);
  marker.scale.set(10, 0.15, 0.15);
  marker.position.set(0, 1.6, -1.2);

  const body = {
    mesh: ball,
    position: new THREE.Vector3(-2.4, 1.8, 0),
    velocity: new THREE.Vector3(1.9, 0, 0),
    radius: 0.34,
    restitution: 0.86,
  };

  function step(deltaTime) {
    body.velocity.y += -9.8 * deltaTime;
    body.position.addScaledVector(body.velocity, deltaTime);

    if (body.position.y < body.radius) {
      body.position.y = body.radius;
      body.velocity.y *= -body.restitution;
    }

    if (Math.abs(body.position.x) > 2.6) {
      body.position.x = Math.sign(body.position.x) * 2.6;
      body.velocity.x *= -1;
    }

    body.mesh.position.copy(body.position);
    marker.rotation.y += deltaTime * 0.9;
  }

  return { step };
}

/**
 * 示例 4：碰撞响应。
 *
 * 碰撞处理分两步：
 * 1. 位置修正：把已经穿出边界的物体推回合法位置；
 * 2. 速度响应：反转对应方向速度，并乘以 restitution 模拟能量损失。
 */
function createCollisionResponseDemo(scene, cleanup) {
  const balls = [
    { mesh: createBall(scene, cleanup, 0x60a5fa, 0.34), position: new THREE.Vector3(-1.4, 2.2, 0.2), velocity: new THREE.Vector3(2.0, 0.2, 0.9), radius: 0.34, restitution: 0.82 },
    { mesh: createBall(scene, cleanup, 0xfb7185, 0.28), position: new THREE.Vector3(1.1, 2.7, -0.4), velocity: new THREE.Vector3(-1.5, 0.1, 1.1), radius: 0.28, restitution: 0.76 },
  ];
  const bounds = { minX: -3, maxX: 3, minZ: -1.8, maxZ: 1.8 };

  function collideWithBounds(body) {
    if (body.position.x < bounds.minX + body.radius) {
      body.position.x = bounds.minX + body.radius;
      body.velocity.x *= -body.restitution;
    }

    if (body.position.x > bounds.maxX - body.radius) {
      body.position.x = bounds.maxX - body.radius;
      body.velocity.x *= -body.restitution;
    }

    if (body.position.z < bounds.minZ + body.radius) {
      body.position.z = bounds.minZ + body.radius;
      body.velocity.z *= -body.restitution;
    }

    if (body.position.z > bounds.maxZ - body.radius) {
      body.position.z = bounds.maxZ - body.radius;
      body.velocity.z *= -body.restitution;
    }

    if (body.position.y < body.radius) {
      body.position.y = body.radius;
      body.velocity.y *= -body.restitution;

      // 简单模拟一点摩擦/空气阻力，让球不会永远保持同样速度。
      body.velocity.multiplyScalar(0.985);
    }
  }

  function step(deltaTime) {
    balls.forEach((body) => {
      body.velocity.y += -9.8 * deltaTime;
      body.position.addScaledVector(body.velocity, deltaTime);
      collideWithBounds(body);
      body.mesh.position.copy(body.position);
    });
  }

  return { step };
}

/**
 * 根据 definition.id 选择具体物理示例。
 * 页面层只传入数据定义，具体创建哪组 body/mesh 在这里分发。
 */

/**
 * 示例：使用 cannon-es 的真实物理世界。
 *
 * 和前面的手写 body 不同，这里真正创建了 CANNON.World、CANNON.Body 和 CANNON.Shape。
 * 每次 step 都由 cannon-es 计算重力、碰撞、位置、旋转；three.js 只负责显示结果。
 */
function createCannonWorldDemo(scene, cleanup) {
  // 1. 创建 CANNON 物理世界。
  // World 是 cannon-es 的“模拟容器”，所有参与物理的 Body 都要 add 到这个 world 里。
  // gravity 用 CANNON.Vec3 表示三维重力方向和大小，这里是标准向下重力。
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

  // 2. 设置 broadphase（粗略碰撞筛选算法）。
  // SAPBroadphase 会先快速筛掉明显不可能碰撞的物体，减少后续精确碰撞计算成本。
  // 对这种物体主要沿少数方向运动的简单场景，SAPBroadphase 比默认策略更合适。
  world.broadphase = new CANNON.SAPBroadphase(world);

  // 3. 允许 body 进入睡眠。
  // 当某些刚体静止很久后，cannon-es 可以让它们 sleep，避免每帧继续计算，节省性能。
  world.allowSleep = true;

  // 4. 创建物理材质。
  // CANNON.Material 不是 three.js 的视觉材质，它只描述物理接触属性的分类。
  // 后续 ContactMaterial 会告诉 cannon-es：两个 defaultMaterial 接触时摩擦和弹性是多少。
  const defaultMaterial = new CANNON.Material('default');

  // 5. 设置默认接触材质。
  // friction：摩擦系数，越大越不容易滑动。
  // restitution：弹性系数，越大碰撞后越容易弹起。
  world.defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.32,
    restitution: 0.68,
  });

  // 6. 创建地面的物理 body。
  // Body 是 cannon-es 中真正参与物理计算的刚体。
  // mass = 0 表示静态刚体：它可以被撞到，但不会被推动，也不会受重力下落。
  const groundBody = new CANNON.Body({
    mass: 0,
    material: defaultMaterial,

    // CANNON.Box 的参数是“半尺寸”，不是完整宽高深。
    // 这里表示完整尺寸约为 7 x 0.16 x 4.6，和 three.js 里的可见地面保持一致。
    shape: new CANNON.Box(new CANNON.Vec3(3.5, 0.08, 2.3)),

    // CANNON.Vec3 是 cannon-es 自己的向量类型，不是 THREE.Vector3。
    position: new CANNON.Vec3(0, 0, 0),
  });

  // 7. 把地面 body 加入物理世界。
  // 只有 addBody 之后，world.step() 才会把它纳入碰撞计算。
  world.addBody(groundBody);

  // 8. 创建 three.js 可见球体 mesh。
  // mesh 只负责显示，不负责物理计算；真正运动的是下面的 sphereBody。
  const sphereMesh = createBall(scene, cleanup, 0x60a5fa, 0.38);

  // 9. 创建球体物理 body。
  // mass > 0 表示动态刚体，会受重力、碰撞、速度影响。
  // shape 使用 CANNON.Sphere，半径要和 three.js SphereGeometry 的半径一致。
  const sphereBody = new CANNON.Body({
    mass: 1,
    material: defaultMaterial,
    shape: new CANNON.Sphere(0.38),
    position: new CANNON.Vec3(-0.85, 3.5, 0.1),
  });

  // 10. 给球一个初始线速度。
  // set(x, y, z) 分别表示 x/y/z 方向每秒移动多少单位。
  sphereBody.velocity.set(1.15, 0, 0.35);
  world.addBody(sphereBody);

  // 11. 创建 three.js 可见盒子 mesh。
  const boxMesh = createBox(scene, cleanup, 0xfbbf24, 0.72);

  // 12. 创建盒子的物理 body。
  // CANNON.Box 同样使用半尺寸，所以 0.36 对应完整边长 0.72。
  const boxBody = new CANNON.Body({
    mass: 1.2,
    material: defaultMaterial,
    shape: new CANNON.Box(new CANNON.Vec3(0.36, 0.36, 0.36)),
    position: new CANNON.Vec3(0.9, 4.6, -0.15),
  });

  // 13. 给盒子一个初始角速度。
  // angularVelocity 控制刚体绕 x/y/z 轴旋转的速度，cannon-es 会继续计算碰撞后的旋转变化。
  boxBody.angularVelocity.set(1.3, 0.7, 0.4);
  world.addBody(boxBody);

  // 14. 建立 mesh 和 body 的映射关系。
  // 真实项目里通常会维护一个数组或 Map：每个可见 mesh 对应一个物理 body。
  const pairs = [
    { mesh: sphereMesh, body: sphereBody },
    { mesh: boxMesh, body: boxBody },
  ];

  // 15. 把 cannon-es 的 body 状态同步给 three.js mesh。
  // position 同步位置；quaternion 同步旋转。
  // 如果只同步 position，不同步 quaternion，盒子的翻滚不会显示出来。
  function syncMeshFromBody({ mesh, body }) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  return {
    step(deltaTime) {
      // 16. 推进物理世界。
      // 第 1 个参数：固定物理步长，这里是 1/60 秒。
      // 第 2 个参数：真实经过时间，来自外层固定时间步循环。
      // 第 3 个参数：最多补算次数，避免某一帧太慢时无限追赶。
      world.step(1 / 60, deltaTime, 3);

      // 17. 物理世界算完后，把 body 的结果同步回 mesh，然后 three.js 再渲染。
      pairs.forEach(syncMeshFromBody);
    },
  };
}

/**
 * Rapier 示例的本地预览降级实现。
 * 详情页核心代码会展示 three 官方 RapierPhysics addon 的真实写法；
 * 预览区为了避免构建阶段打包大型 WASM，复用 mesh/body 同步 demo 展示同类效果。
 */
function createRapierWorldDemo(scene, cleanup) {
  return createMeshBodySyncDemo(scene, cleanup);
}

function createPhysicsDemo(definition, scene, cleanup) {
  if (definition.id === 'mesh-body-sync') return createMeshBodySyncDemo(scene, cleanup);
  if (definition.id === 'fixed-time-step') return createFixedTimeStepDemo(scene, cleanup);
  if (definition.id === 'cannon-es-world') return createCannonWorldDemo(scene, cleanup);
  if (definition.id === 'rapier-world') return createRapierWorldDemo(scene, cleanup);
  if (definition.id === 'collision-response') return createCollisionResponseDemo(scene, cleanup);
  return createGravityStepDemo(scene, cleanup);
}

/**
 * 创建完整物理预览上下文。
 *
 * 这里实现了固定时间步：
 * - requestAnimationFrame 给的是不稳定渲染帧间隔；
 * - accumulator 累积这些真实时间；
 * - 每攒够 1/60 秒，就执行一次 demo.step(fixedTimeStep)。
 */
export function createPhysicsPreview(definition) {
  const cleanup = [];
  const { scene, camera } = createBaseScene(cleanup);
  const demo = createPhysicsDemo(definition, scene, cleanup);
  const fixedTimeStep = 1 / 60;
  let accumulator = 0;
  let lastSeconds = 0;

  function animate(seconds) {
    if (!lastSeconds) lastSeconds = seconds;

    // 限制最大帧间隔，避免切回浏览器标签页时一次补算太多物理步。
    const frameDelta = Math.min(seconds - lastSeconds, 0.1);
    lastSeconds = seconds;
    accumulator += frameDelta;

    while (accumulator >= fixedTimeStep) {
      demo.step(fixedTimeStep);
      accumulator -= fixedTimeStep;
    }
  }

  return { scene, camera, cleanup, animate };
}

/**
 * 挂载物理示例并启动渲染循环。
 * 返回 disposer，路由离开时停止动画、解绑事件并释放 WebGL 资源。
 */
export function mountPhysicsScene(stage, definition) {
  const preview = createPhysicsPreview(definition);
  const renderer = createRenderer(stage);
  let disposed = false;
  let animationFrameId = 0;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
  }

  function render(time) {
    if (disposed) return;

    // 先推进物理世界，再渲染 three.js 场景。
    preview.animate(time * 0.001);
    renderer.render(preview.scene, preview.camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    // 执行创建阶段登记的资源释放任务，避免路由切换后 GPU 资源残留。
    preview.cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  };
}




