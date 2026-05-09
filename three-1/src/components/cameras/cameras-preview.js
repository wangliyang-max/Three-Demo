import * as THREE from 'three';

// 相机总览页的小卡片预览只负责展示相机概念，不负责页面 DOM。
// 页面层会为每个卡片创建 renderer，这里只返回 scene / camera / resize / dispose。

// three.js 材质可能是单个 material，也可能是数组。
// 统一释放能避免路由切换后 GPU 资源残留。
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }
  material.dispose();
}

// 创建一组沿 z 轴排开的柱子，用同一组物体对比透视相机和正交相机。
// 这样视觉差异主要来自相机投影方式，而不是模型布局不同。
function createDepthColumns() {
  const group = new THREE.Group();
  const cleanup = [];
  const animated = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.92, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  group.add(floor);

  // 三组柱子放在不同深度：透视相机会让远处看起来更小，正交相机不会。
  const zPositions = [0, -5, -10];
  const colors = [0xffd18a, 0x7ec7ff, 0x9cf0b6];

  zPositions.forEach((z, index) => {
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 3.1, 1.4),
      new THREE.MeshStandardMaterial({ color: colors[index], roughness: 0.38, metalness: 0.12 }),
    );
    pillar.position.set((index - 1) * 2.25, 1.25, z);
    group.add(pillar);

    const cap = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.15, 18, 64),
      new THREE.MeshStandardMaterial({ color: 0xf6f8ff, roughness: 0.2, metalness: 0.74 }),
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.set((index - 1) * 2.25, 2.9, z);
    group.add(cap);

    animated.push((seconds) => {
      cap.rotation.z = seconds * 0.75 + index * 0.3;
    });

    cleanup.push(
      () => pillar.geometry.dispose(),
      () => disposeMaterial(pillar.material),
      () => cap.geometry.dispose(),
      () => disposeMaterial(cap.material),
    );
  });

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
  );

  return { group, cleanup, animated };
}

// 透视 / 正交共用同一个预览函数，通过 definition.id 切换相机类型。
// 重点是保持物体、灯光、观察目标一致，只改变相机投影规则。
function createPerspectiveOrthoPreview(definition) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1118);

  const cleanup = [];
  const animated = [];
  const columns = createDepthColumns();
  scene.add(columns.group);
  cleanup.push(...columns.cleanup);
  animated.push(...columns.animated);

  const hemi = new THREE.HemisphereLight(0xbcd9ff, 0x1c2232, 1.05);
  const dir = new THREE.DirectionalLight(0xffffff, 1.8);
  dir.position.set(5, 8, 6);
  scene.add(hemi, dir);

  // PerspectiveCamera 用 fov + aspect 描述视锥体，会产生近大远小。
  // OrthographicCamera 用 left/right/top/bottom 描述可见盒子，不会产生透视缩放。
  const camera =
    definition.id === 'perspective'
      ? new THREE.PerspectiveCamera(48, 1, 0.1, 100)
      : new THREE.OrthographicCamera(-5, 5, 4.5, -4.5, 0.1, 100);

  camera.position.set(6.6, 4.1, 10.2);
  camera.lookAt(0, 1.6, -5.2);

  // 轻微移动相机位置，让用户从动态画面里观察透视关系是否保持成立。
  function setRotation(seconds) {
    animated.forEach((animate) => animate(seconds));
    const angle = seconds * 0.16;
    camera.position.x = Math.cos(angle) * 10.2;
    camera.position.z = Math.sin(angle) * 3.4 + 8.4;
    camera.lookAt(0, 1.6, -5.2);
  }

  // 卡片尺寸变化时必须同步更新相机投影参数。
  // 透视相机改 aspect；正交相机改左右边界，保持内容不被拉伸。
  // 窗口变化时把正交相机边界同步到容器尺寸，保证 2D 元素位置稳定。
  function resize(width, height) {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    if (camera.isPerspectiveCamera) {
      camera.aspect = safeWidth / safeHeight;
    } else {
      const aspect = safeWidth / safeHeight;
      const frustumHeight = 9;
      camera.left = -frustumHeight * aspect * 0.5;
      camera.right = frustumHeight * aspect * 0.5;
      camera.top = frustumHeight * 0.5;
      camera.bottom = -frustumHeight * 0.5;
    }
    camera.updateProjectionMatrix();
  }

  function dispose() {
    cleanup.forEach((task) => task());
  }

  return { scene, camera, setRotation, resize, dispose };
}

// CameraHelper 预览：用一台 viewCamera 表示“正在拍摄的相机”，
// 再用 observerCamera 从旁边观察 viewCamera 的视锥体。
function createCameraHelperPreview() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1017);
  const cleanup = [];

  const grid = new THREE.GridHelper(14, 14, 0x46607d, 0x1f2b3a);
  scene.add(grid);

  const target = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.6, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xffd18a, roughness: 0.44, metalness: 0.08 }),
  );
  target.position.set(0, 1.1, -2.4);
  scene.add(target);

  // viewCamera 是被 Helper 可视化的相机，它的 near/far/fov 会显示成线框视锥。
  const viewCamera = new THREE.PerspectiveCamera(56, 1, 1.2, 10);
  viewCamera.position.set(3.2, 2.6, 5);
  viewCamera.lookAt(target.position);

  // CameraHelper 不是相机本体，只是把 viewCamera 的可见范围画出来。
  const helper = new THREE.CameraHelper(viewCamera);
  scene.add(helper);

  // observerCamera 是当前卡片真正用于渲染的相机，负责从外部看 helper 和目标物体。
  const observerCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  observerCamera.position.set(8.5, 5.2, 8.5);
  observerCamera.lookAt(0, 1, -2);

  const hemi = new THREE.HemisphereLight(0xaecfff, 0x20283a, 1.05);
  const dir = new THREE.DirectionalLight(0xffffff, 1.4);
  dir.position.set(4, 7, 3);
  scene.add(hemi, dir);

  cleanup.push(
    () => target.geometry.dispose(),
    () => disposeMaterial(target.material),
    () => helper.dispose?.(),
  );

  function setRotation(seconds) {
    const radius = 6.2;
    viewCamera.position.x = Math.cos(seconds * 0.42) * radius;
    viewCamera.position.z = Math.sin(seconds * 0.42) * radius + 0.5;
    viewCamera.lookAt(target.position);
    // viewCamera 每帧都在移动，helper 也要同步更新线框位置。
    helper.update();
    target.rotation.y = seconds * 0.55;
  }

  function resize(width, height) {
    observerCamera.aspect = Math.max(width, 1) / Math.max(height, 1);
    observerCamera.updateProjectionMatrix();
  }

  function dispose() {
    cleanup.forEach((task) => task());
  }

  return { scene, camera: observerCamera, setRotation, resize, dispose };
}

// 正交 2D 预览：把 OrthographicCamera 的边界设置成画布尺寸，
// 让 three.js 坐标接近常见 2D 画布坐标系统。
function createOrthographic2DPreview() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1016);
  const cleanup = [];

  // left=0、right=width、top=0、bottom=height 后，坐标可以按屏幕像素思路理解。
  const camera = new THREE.OrthographicCamera(0, 320, 200, 0, -10, 10);
  camera.position.z = 4;

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 200),
    new THREE.MeshBasicMaterial({ color: 0x101827 }),
  );
  board.position.set(160, 100, -1);
  scene.add(board);

  const topMarker = new THREE.Mesh(
    new THREE.PlaneGeometry(68, 40),
    new THREE.MeshBasicMaterial({ color: 0x7ec7ff }),
  );
  topMarker.position.set(62, 42, 0);
  scene.add(topMarker);

  const sidePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 132),
    new THREE.MeshBasicMaterial({ color: 0xffd18a }),
  );
  sidePanel.position.set(256, 98, 0);
  scene.add(sidePanel);

  const footer = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 28),
    new THREE.MeshBasicMaterial({ color: 0x9cf0b6 }),
  );
  footer.position.set(160, 176, 0);
  scene.add(footer);

  cleanup.push(
    () => board.geometry.dispose(),
    () => disposeMaterial(board.material),
    () => topMarker.geometry.dispose(),
    () => disposeMaterial(topMarker.material),
    () => sidePanel.geometry.dispose(),
    () => disposeMaterial(sidePanel.material),
    () => footer.geometry.dispose(),
    () => disposeMaterial(footer.material),
  );

  function setRotation(seconds) {
    topMarker.position.y = 42 + Math.sin(seconds * 2.1) * 6;
    sidePanel.rotation.z = Math.sin(seconds * 0.8) * 0.04;
  }

  function resize(width, height) {
    camera.left = 0;
    camera.right = Math.max(width, 1);
    camera.top = 0;
    camera.bottom = Math.max(height, 1);
    camera.updateProjectionMatrix();
    board.scale.set(Math.max(width, 1) / 320, Math.max(height, 1) / 200, 1);
    board.position.set(Math.max(width, 1) * 0.5, Math.max(height, 1) * 0.5, -1);
  }

  function dispose() {
    cleanup.forEach((task) => task());
  }

  return { scene, camera, setRotation, resize, dispose };
}

// 根据数据层 id 选择预览类型。页面层不用关心具体 Three.js 场景如何搭建。
export function createCameraPreview(definition) {
  if (definition.id === 'camera-helper') {
    return createCameraHelperPreview();
  }

  if (definition.id === 'orthographic-2d') {
    return createOrthographic2DPreview();
  }

  return createPerspectiveOrthoPreview(definition);
}
