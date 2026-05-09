import * as THREE from 'three';

// 统一释放材质。three.js 的 material 既可能是单个材质，也可能是材质数组，
// 所以这里做一层兼容，避免页面切换后 GPU 资源继续留在显存里。
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

// 用 Canvas 动态生成一张“中心深、边缘透明”的圆形阴影纹理。
// 这个纹理用于假阴影示例：它不是灯光计算出来的阴影，而是一张贴在地面上的透明图片。
function createRadialShadowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.26)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 每个卡片/详情页都会创建自己的 renderer。
// enableShadowMap 控制是否开启真实阴影：假阴影示例不需要，真实阴影示例才开启。
function createRenderer(stage, enableShadowMap = false) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = enableShadowMap;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  return renderer;
}

// 创建所有阴影示例共用的地面和网格。
// 地面设置 receiveShadow = true，这样真实阴影才能投射到地面上；
// 网格稍微抬高 0.004，避免和地面共面导致闪烁。
function createRoom(scene, cleanup, options = {}) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: options.floorColor ?? 0x6f7784, roughness: 0.88, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(12, 12, 0x9aa8ba, 0x7f8b9c);
  grid.position.y = 0.004;
  scene.add(grid);

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => grid.dispose?.(),
  );

  return floor;
}

// 示例 1：弹跳球假阴影。
// 核心思路：球体负责真实 3D 动画，阴影只是一个贴在地面上的透明 Plane。
// 这样几乎没有阴影计算成本，很适合移动端、角色脚底阴影、道具接地感等场景。
export function createFakeBouncingBallsScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c0cc);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
  camera.position.set(0, 4.2, 8.4);
  camera.lookAt(0, 1.05, 0);

  const cleanup = [];
  createRoom(scene, cleanup, { floorColor: 0x818a96 });

  // 这里的灯光只负责照亮球体，不负责计算阴影。
  // 因为阴影由地面贴片模拟，所以不需要开启 renderer.shadowMap。
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x5f6670, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 8, 5);
  scene.add(keyLight);

  const shadowTexture = createRadialShadowTexture();
  cleanup.push(() => shadowTexture.dispose());

  const balls = [];
  const colors = [0x7ec7ff, 0xffd18a, 0x9cf0b6];
  const xPositions = [-2.4, 0, 2.4];

  xPositions.forEach((x, index) => {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 36, 24),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.34, metalness: 0.08 }),
    );
    scene.add(ball);

    // 假阴影本体：一张贴在地面上的透明平面。
    // MeshBasicMaterial 不受灯光影响，能保证阴影贴片颜色稳定。
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.012, 0);
    scene.add(shadow);

    balls.push({ ball, shadow, x, phase: index * 1.75 });
    cleanup.push(
      () => ball.geometry.dispose(),
      () => disposeMaterial(ball.material),
      () => shadow.geometry.dispose(),
      () => disposeMaterial(shadow.material),
    );
  });

  function animate(seconds) {
    balls.forEach(({ ball, shadow, x, phase }, index) => {
      // bounce 范围是 0..1。数值越大，球越高。
      const bounce = Math.abs(Math.sin(seconds * 1.8 + phase));
      const height = THREE.MathUtils.lerp(0.55, 3.0, bounce);

      ball.position.set(x, height, Math.sin(seconds * 0.8 + phase) * 0.35);
      ball.rotation.set(seconds * 0.7 + index, seconds * 1.1, 0);

      // 阴影跟随球体的 x/z 位置，但 y 始终贴近地面。
      shadow.position.x = ball.position.x;
      shadow.position.z = ball.position.z;

      // 球越高，阴影越大、越淡；球越接近地面，阴影越小、越深。
      shadow.scale.setScalar(THREE.MathUtils.lerp(0.92, 1.45, bounce));
      shadow.material.opacity = THREE.MathUtils.lerp(0.54, 0.15, bounce);
    });
  }

  return { scene, camera, animate, cleanup, usesShadowMap: false };
}

// 示例 2：方向光阴影相机。
// DirectionalLight 的阴影不是由主相机决定的，而是由 light.shadow.camera 决定的。
// 对方向光来说，这个 shadow camera 是 OrthographicCamera。
function createDirectionalShadowCameraScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c0cc);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(6.2, 4.5, 7.6);
  camera.lookAt(0, 1, 0);

  const cleanup = [];
  createRoom(scene, cleanup);

  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x646b76, 1.2));

  const light = new THREE.DirectionalLight(0xffffff, 2.6);
  light.position.set(4.5, 7.5, 3.5);
  light.castShadow = true;

  // 阴影贴图分辨率。分辨率越高越清晰，但也越耗显存和渲染性能。
  light.shadow.mapSize.set(1024, 1024);

  // 方向光的 shadow.camera 是正交相机。
  // 这些 left/right/top/bottom 决定“哪些区域会参与阴影计算”。
  // 范围太小会裁掉阴影，范围太大会让同样大小的贴图被拉得更散，阴影变糊。
  light.shadow.camera.left = -4.6;
  light.shadow.camera.right = 4.6;
  light.shadow.camera.top = 4.6;
  light.shadow.camera.bottom = -4.6;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 16;
  light.shadow.camera.updateProjectionMatrix();
  scene.add(light);

  // CameraHelper 不是阴影相机本体。
  // 它只是把 light.shadow.camera 的范围用线框画出来，方便观察阴影计算区域。
  const helper = new THREE.CameraHelper(light.shadow.camera);
  helper.visible = true;
  scene.add(helper);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xffd18a, roughness: 0.45 }),
  );
  cube.position.set(-1.05, 0.62, -0.25);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 36, 24),
    new THREE.MeshStandardMaterial({ color: 0x7ec7ff, roughness: 0.32 }),
  );
  sphere.position.set(1.25, 0.72, 0.35);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  cleanup.push(
    () => helper.dispose(),
    () => cube.geometry.dispose(),
    () => disposeMaterial(cube.material),
    () => sphere.geometry.dispose(),
    () => disposeMaterial(sphere.material),
  );

  function animate(seconds) {
    cube.rotation.y = seconds * 0.55;
    cube.rotation.x = seconds * 0.18;
    sphere.position.y = 0.74 + Math.sin(seconds * 1.5) * 0.18;

    // helper 依赖 shadow.camera 的矩阵；相机或目标变化时需要更新。
    helper.update();
  }

  return { scene, camera, animate, cleanup, usesShadowMap: true };
}

// 示例 3：阴影贴图分辨率。
// 这里使用较小的 512x512 mapSize，便于观察阴影边缘的像素感。
function createShadowMapSizeScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c0cc);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(4.8, 3.8, 6.2);
  camera.lookAt(0, 0.7, 0);

  const cleanup = [];
  createRoom(scene, cleanup, { floorColor: 0x78818e });

  scene.add(new THREE.AmbientLight(0xaeb8c8, 1.4));

  const light = new THREE.DirectionalLight(0xffffff, 3.2);
  light.position.set(3, 6, 4);
  light.castShadow = true;

  // mapSize 控制阴影贴图尺寸。
  // 如果阴影相机覆盖范围不变，mapSize 越大，阴影边缘通常越清晰。
  light.shadow.mapSize.set(512, 512);
  light.shadow.camera.left = -3.4;
  light.shadow.camera.right = 3.4;
  light.shadow.camera.top = 3.4;
  light.shadow.camera.bottom = -3.4;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 12;
  light.shadow.camera.updateProjectionMatrix();
  scene.add(light);

  const blocks = [];
  [-1.5, 0, 1.5].forEach((x, index) => {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 1.2 + index * 0.25, 0.72),
      new THREE.MeshStandardMaterial({ color: [0x7ec7ff, 0xffd18a, 0x9cf0b6][index], roughness: 0.42 }),
    );
    block.position.set(x, block.geometry.parameters.height * 0.5, 0);

    // castShadow 表示“这个物体会不会投射阴影”。
    // receiveShadow 表示“这个物体表面会不会接收阴影”。
    block.castShadow = true;
    block.receiveShadow = true;
    scene.add(block);

    blocks.push(block);
    cleanup.push(() => block.geometry.dispose(), () => disposeMaterial(block.material));
  });

  function animate(seconds) {
    blocks.forEach((block, index) => {
      block.rotation.y = seconds * 0.35 + index * 0.5;
    });
  }

  return { scene, camera, animate, cleanup, usesShadowMap: true };
}

// 示例 4：SpotLight 和 PointLight 的阴影成本。
// SpotLight 像手电筒，阴影来自一个锥形范围；PointLight 像灯泡，需要向多个方向生成阴影，成本更高。
function createSpotPointCostScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c0cc);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(5.8, 4, 6.8);
  camera.lookAt(0, 1.2, 0);

  const cleanup = [];
  createRoom(scene, cleanup, { floorColor: 0x737d8a });

  // 加一面后墙，让点光源和聚光灯的阴影不只落在地面上，也能投到竖直面上。
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 5),
    new THREE.MeshStandardMaterial({ color: 0x8d97a5, roughness: 0.86 }),
  );
  backWall.position.set(0, 2.5, -3.4);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // PointLight 会向四面八方发光。
  // 开启阴影后，通常需要为多个方向生成阴影贴图，因此不要滥用。
  const pointLight = new THREE.PointLight(0xffdf9e, 28, 10, 2);
  pointLight.position.set(-1.7, 2.4, 1.2);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.set(512, 512);
  scene.add(pointLight);

  // 小灯泡只是一个可视化标记，用来告诉用户点光源大概在哪里。
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffdf9e }),
  );
  bulb.position.copy(pointLight.position);
  scene.add(bulb);

  // SpotLight 是锥形照明，更适合做局部重点照明，比如手电筒、台灯、舞台追光。
  const spot = new THREE.SpotLight(0x7ec7ff, 16, 12, Math.PI / 7, 0.42, 1.6);
  spot.position.set(2.2, 4.2, 2.4);
  spot.target.position.set(0.8, 0.2, -0.8);
  spot.castShadow = true;
  spot.shadow.mapSize.set(512, 512);
  scene.add(spot, spot.target);

  const objects = [];
  [
    [-0.8, 0.55, -0.9, 0x9cf0b6],
    [1.15, 0.75, 0.2, 0xffd18a],
  ].forEach(([x, y, z, color]) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.38, 0.13, 88, 14),
      new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.12 }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    objects.push(mesh);
    cleanup.push(() => mesh.geometry.dispose(), () => disposeMaterial(mesh.material));
  });

  cleanup.push(
    () => backWall.geometry.dispose(),
    () => disposeMaterial(backWall.material),
    () => bulb.geometry.dispose(),
    () => disposeMaterial(bulb.material),
  );

  function animate(seconds) {
    // 让点光源轻微移动，方便观察阴影方向跟着灯光位置变化。
    pointLight.position.x = -1.7 + Math.sin(seconds * 0.75) * 0.45;
    bulb.position.copy(pointLight.position);

    objects.forEach((mesh, index) => {
      mesh.rotation.x = seconds * 0.55 + index;
      mesh.rotation.y = seconds * 0.85;
    });
  }

  return { scene, camera, animate, cleanup, usesShadowMap: true };
}

// 根据数据层的 definition.id 选择对应的 Three.js 示例场景。
export function createShadowPreview(definition) {
  if (definition.id === 'fake-bouncing-balls') return createFakeBouncingBallsScene();
  if (definition.id === 'directional-shadow-camera') return createDirectionalShadowCameraScene();
  if (definition.id === 'shadow-map-size') return createShadowMapSizeScene();
  return createSpotPointCostScene();
}

// 页面层只负责提供容器和 definition；真正的 Three.js 生命周期都在这里统一处理。
// 返回的函数会在路由切换时调用，停止动画、移除 resize 监听、释放 WebGL 资源。
export function mountShadowScene(stage, definition) {
  const preview = createShadowPreview(definition);
  const renderer = createRenderer(stage, preview.usesShadowMap);
  let disposed = false;
  let animationFrameId = 0;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    // 画布尺寸变化时必须同步更新相机宽高比和投影矩阵，否则画面会被拉伸。
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
  }

  function render(time) {
    if (disposed) return;

    const seconds = time * 0.001;
    preview.animate(seconds);
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
    preview.cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
