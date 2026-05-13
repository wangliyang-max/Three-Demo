import * as THREE from 'three';

// 统一释放材质。three.js 的材质可能是单个 material，也可能是数组，
// 路由切换时主动 dispose 可以避免 GPU 资源在显存里堆积。
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

// 创建 fog 模块共用的 renderer。
// 雾效果不需要开启 shadowMap，它是材质着色阶段根据距离混合颜色。
function createRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  stage.appendChild(renderer.domElement);
  return renderer;
}

// 创建所有 fog 示例共用的“深度走廊”。
// 物体沿 z 轴向远处排布，这样用户能直观看到距离越远雾越明显。
function createDepthStage(scene, cleanup, options = {}) {
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: options.floorColor ?? 0x435260,
    roughness: 0.88,
    metalness: 0.02,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 42), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -12;
  scene.add(floor);

  const grid = new THREE.GridHelper(42, 28, 0x6f8394, 0x4e6070);
  grid.rotation.y = Math.PI / 2;
  grid.position.y = 0.01;
  grid.position.z = -12;
  scene.add(grid);

  const markers = [];
  const colors = [0xffa53d, 0x24a8ff, 0x24d678, 0xff4f85, 0x9b6cff];

  [-2, -7, -12, -17, -22].forEach((z, index) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.8 + index * 0.14, 0.85),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.42, metalness: 0.08 }),
    );
    pillar.position.set(index % 2 === 0 ? -1.35 : 1.35, pillar.geometry.parameters.height * 0.5, z);
    scene.add(pillar);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.1, 16, 56),
      new THREE.MeshStandardMaterial({ color: 0xfff0b8, roughness: 0.2, metalness: 0.58 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pillar.position.x, pillar.position.y + pillar.geometry.parameters.height * 0.58, z);
    scene.add(ring);

    markers.push({ pillar, ring, index });
    cleanup.push(
      () => pillar.geometry.dispose(),
      () => disposeMaterial(pillar.material),
      () => ring.geometry.dispose(),
      () => disposeMaterial(ring.material),
    );
  });

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => grid.dispose?.(),
  );

  return { markers };
}

// 创建一个基础雾场景：透视相机 + 深度走廊 + 基础灯光。
// 不同示例只需要在这个基础上设置 scene.fog 和少量额外物体。
function createBaseFogScene(options = {}) {
  const fogColor = options.fogColor ?? 0x6f8290;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(fogColor);

  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 80);
  camera.position.set(0, 3.4, 8.2);
  camera.lookAt(0, 1.0, -10);

  const cleanup = [];
  const { markers } = createDepthStage(scene, cleanup, options);

  scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x24313d, 0.95));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
  keyLight.position.set(4, 8, 5);
  scene.add(keyLight);

  function animate(seconds) {
    markers.forEach(({ pillar, ring, index }) => {
      pillar.rotation.y = seconds * 0.18 + index * 0.35;
      ring.rotation.z = seconds * 0.75 + index * 0.4;
    });
  }

  return { scene, camera, cleanup, animate };
}

// 示例 1：线性雾 THREE.Fog。
// near/far 控制一段明确的雾化区间，适合教学“从哪里开始、到哪里结束”。
function createLinearFogScene() {
  const preview = createBaseFogScene({ fogColor: 0x6f8290, floorColor: 0x3f4f5d });
  preview.scene.fog = new THREE.Fog(0x6f8290, 6, 20);
  return preview;
}

// 示例 2：指数雾 THREE.FogExp2。
// FogExp2 只有 density，距离越远雾增长越明显，更像自然空气感。
function createExponentialFogScene() {
  const preview = createBaseFogScene({ fogColor: 0x5f7f92, floorColor: 0x3b5566 });
  preview.scene.fog = new THREE.FogExp2(0x5f7f92, 0.072);
  return preview;
}

// 示例 3：雾色和背景色同步。
// 这里用左右两个物体展示同色背景的自然淡出效果，并在场景里保留一块不同色参考板。
function createFogBackgroundSyncScene() {
  const preview = createBaseFogScene({ fogColor: 0x657887, floorColor: 0x404f5b });
  preview.scene.fog = new THREE.Fog(0x657887, 5, 18);

  const contrastPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.1),
    new THREE.MeshBasicMaterial({ color: 0x17202c, fog: false }),
  );
  contrastPanel.position.set(0, 2.3, -18);
  preview.scene.add(contrastPanel);

  preview.cleanup.push(
    () => contrastPanel.geometry.dispose(),
    () => disposeMaterial(contrastPanel.material),
  );

  return preview;
}

// 示例 4：material.fog 开关。
// 同一个场景里放两个远处标签：左侧受雾影响，右侧关闭 material.fog 保持清晰。
function createMaterialFogToggleScene() {
  const preview = createBaseFogScene({ fogColor: 0x687d8e, floorColor: 0x3f5261 });
  preview.scene.fog = new THREE.Fog(0x687d8e, 4, 16);

  const foggedMaterial = new THREE.MeshBasicMaterial({ color: 0xffb12f });
  const clearMaterial = new THREE.MeshBasicMaterial({ color: 0xffb12f });
  clearMaterial.fog = false;

  const foggedLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.72), foggedMaterial);
  foggedLabel.position.set(-1.25, 2.4, -18);
  preview.scene.add(foggedLabel);

  const clearLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.72), clearMaterial);
  clearLabel.position.set(1.25, 2.4, -18);
  preview.scene.add(clearLabel);

  preview.cleanup.push(
    () => foggedLabel.geometry.dispose(),
    () => disposeMaterial(foggedLabel.material),
    () => clearLabel.geometry.dispose(),
    () => disposeMaterial(clearLabel.material),
  );

  return preview;
}

// 根据数据层 definition.id 选择对应的雾示例。
export function createFogPreview(definition) {
  if (definition.id === 'linear-fog-range') return createLinearFogScene();
  if (definition.id === 'exponential-fog-density') return createExponentialFogScene();
  if (definition.id === 'fog-background-sync') return createFogBackgroundSyncScene();
  return createMaterialFogToggleScene();
}

// 页面层只传入容器和 definition；这里统一管理 Three.js 生命周期。
// 返回 disposer，路由切换时停止动画、移除监听、释放 renderer 和场景资源。
export function mountFogScene(stage, definition) {
  const preview = createFogPreview(definition);
  const renderer = createRenderer(stage);
  let disposed = false;
  let animationFrameId = 0;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

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
