import * as THREE from 'three';
import { createGeometryForPrimitive } from './primitives-data.js';

// 根据当前图元的包围盒自动摆放相机，让不同大小的几何体都能被完整看见。
function frameContent(content, camera, distanceMultiplier = 1.65) {
  content.position.set(0, 0, 0);
  content.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(content);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  const fitHeightDistance =
    maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
  const distance = fitHeightDistance * distanceMultiplier;

  content.position.sub(center);
  camera.position.set(distance * 0.62, distance * 0.48, distance * 1.1);
  camera.near = Math.max(distance / 100, 0.1);
  camera.far = distance * 8;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
    return;
  }

  material.dispose();
}

// 这个函数是“预览工厂”：
// 输入某个图元定义 + 当前参数，输出一个可直接拿去渲染的 preview 对象。
// 总览页和详情页都会复用它，避免两边各写一套 Three.js 初始化逻辑。
export function createPrimitivePreview(definition, params, options = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const pivot = new THREE.Group();
  const content = new THREE.Group();
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: definition.color,
    roughness: 0.32,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });

  // 真正生成 geometry 的地方不在当前文件，而是委托给 primitives-data.js。
  // 这样这个文件只关心“怎么预览”，不关心“每种图元具体怎么创建”。
  let geometry = createGeometryForPrimitive(definition, params);
  let edgeGeometry = new THREE.EdgesGeometry(geometry, 18);
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x12141c, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(2.6, 3.2, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x8ea7ff, 1.1);
  rimLight.position.set(-2.2, 1.8, -3.4);
  scene.add(rimLight);

  content.add(mesh, edges);
  pivot.add(content);
  scene.add(pivot);

  const distanceMultiplier = options.distanceMultiplier ?? definition.distanceMultiplier;
  frameContent(content, camera, distanceMultiplier);

  // 详情页拖动滑块后，不需要重建整个 scene / camera，
  // 只需要替换 mesh.geometry 和边线 geometry 即可。
  function updateGeometry(nextParams) {
    const nextGeometry = createGeometryForPrimitive(definition, nextParams);
    const nextEdgeGeometry = new THREE.EdgesGeometry(nextGeometry, 18);

    mesh.geometry.dispose();
    edges.geometry.dispose();

    geometry = nextGeometry;
    edgeGeometry = nextEdgeGeometry;
    mesh.geometry = geometry;
    edges.geometry = edgeGeometry;

    frameContent(content, camera, distanceMultiplier);
  }

  // 总览页和详情页都调用这个函数做统一旋转动画。
  function setRotation(seconds, index = 0) {
    pivot.rotation.x =
      (definition.baseRotationX ?? 0.3) + Math.sin(seconds * 0.85 + index * 0.3) * 0.08;
    pivot.rotation.y = (definition.baseRotationY ?? 0.45) + seconds * 0.72;
    pivot.rotation.z =
      (definition.baseRotationZ ?? 0) + Math.sin(seconds * 0.55 + index * 0.5) * 0.04;
  }

  function dispose() {
    mesh.geometry.dispose();
    edges.geometry.dispose();
    disposeMaterial(meshMaterial);
    edgeMaterial.dispose();
  }

  return {
    scene,
    camera,
    pivot,
    updateGeometry,
    setRotation,
    dispose,
  };
}
