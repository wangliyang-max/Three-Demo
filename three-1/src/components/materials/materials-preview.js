import * as THREE from 'three';

// 材质总览页和详情页都复用同一个球体几何体规格。
// 这样对比材质时，差异主要来自材质和光照响应本身，而不是几何体复杂度不同。
const SHARED_GEOMETRY_RADIUS = 0.95;
const SHARED_GEOMETRY_SEGMENTS = { width: 48, height: 32 };

// 创建单个“材质预览单元”。
// 这个函数只关心一件事：给定某个材质定义，返回一套可直接渲染的 scene / camera / 动画 / 销毁逻辑。
export function createMaterialPreview(definition) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  // 相机略微抬高并后撤一点，让球体表面的高光、暗面和轮廓都比较容易看出来。
  camera.position.set(0, 0.15, 4.2);
  camera.lookAt(0, 0, 0);

  // 统一使用球体作为材质载体。
  // 球体对受光、高光、粗糙度和金属度的响应都比较直观，很适合做材质教学示例。
  const geometry = new THREE.SphereGeometry(
    SHARED_GEOMETRY_RADIUS,
    SHARED_GEOMETRY_SEGMENTS.width,
    SHARED_GEOMETRY_SEGMENTS.height,
  );

  // definition.createMaterial 负责返回真正的材质实例。
  // 某些材质还会顺带返回额外的销毁逻辑，例如 Toon 材质的 gradientMap。
  const { material, dispose: disposeMaterialExtras } = definition.createMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 加一个很轻的底部暗盘，作用不是模拟真实阴影，
  // 而是给球体一个“落在场景里”的参考，让受光材质更容易看出空间感。
  const shadowDisk = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 40),
    new THREE.MeshBasicMaterial({ color: 0x05070d, transparent: true, opacity: 0.45 }),
  );
  shadowDisk.rotation.x = -Math.PI / 2;
  shadowDisk.position.y = -1.25;
  scene.add(shadowDisk);

  // 下面这组灯光是整个材质系统共享的观察条件：
  // 1. 环境光给一点底亮，避免暗面完全死黑。
  // 2. 半球光提供更柔和的上下明暗差。
  // 3. 主方向光负责主要高光和立体感。
  // 4. 辅助方向光补一点冷色反差。
  // 5. 点光用于抬一抬边缘和表面层次。
  // 这样能比较稳定地把不同材质的差异展示出来。
  scene.add(new THREE.AmbientLight(0x6d7694, 0.2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0e1118, 0.95));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
  keyLight.position.set(2.8, 3.4, 4.6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8ea7ff, 0.65);
  fillLight.position.set(-3.5, 1.8, -3.2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffd5a2, 1.2, 12, 2);
  rimLight.position.set(0, 1.6, 2.2);
  scene.add(rimLight);

  // 给每张卡片或详情页一个统一的缓慢旋转动画。
  // index 主要是给总览页里的多张卡片错开相位，避免大家完全同步转动，看起来太呆板。
  function setRotation(seconds, index = 0) {
    mesh.rotation.x = 0.28 + Math.sin(seconds * 0.7 + index * 0.45) * 0.12;
    mesh.rotation.y = seconds * 0.75 + index * 0.32;
  }

  // 释放当前预览自己占用的 WebGL 资源。
  // scene / camera 不需要手动 dispose，但 geometry / material / 额外贴图都需要清掉。
  function dispose() {
    geometry.dispose();
    material.dispose();
    shadowDisk.geometry.dispose();
    shadowDisk.material.dispose();
    disposeMaterialExtras?.();
  }

  return { scene, camera, setRotation, dispose };
}
