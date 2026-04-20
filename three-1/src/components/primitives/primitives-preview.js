import * as THREE from 'three';
import { createGeometryForPrimitive } from './primitives-data.js';

// 根据当前图元的包围盒自动摆放相机，让不同大小的几何体都能被完整看见。
// 这个函数的目标很明确：无论传进来的图元是盒子、管道还是文字，
// 都尽量把它自动放到一个“刚好能看清又不会太远”的镜头位置。
function frameContent(content, camera, distanceMultiplier = 1.65) {
  // 先把内容临时归零，确保包围盒计算的是“自身几何”的真实范围，
  // 不会受到外部残留平移的影响。
  content.position.set(0, 0, 0);
  content.updateMatrixWorld(true);

  // 用包围盒读取内容的尺寸和中心点。
  const box = new THREE.Box3().setFromObject(content);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // maxSize 取三轴最大值，作为“镜头至少要覆盖住的主体尺度”。
  const maxSize = Math.max(size.x, size.y, size.z) || 1;

  // 通过相机 fov 反推：如果想完整看见这么大的物体，相机至少要离多远。
  const fitHeightDistance =
    maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));

  // distanceMultiplier 允许不同图元按需“留白更多”或“靠近一点”。
  const distance = fitHeightDistance * distanceMultiplier;

  // 把内容整体平移到原点附近，这样不同图元都围绕统一中心旋转。
  content.position.sub(center);

  // 相机不正对着物体，而是略微偏上、偏侧地看过去，
  // 这样更容易读出 3D 体积感，而不是像平面投影。
  camera.position.set(distance * 0.62, distance * 0.48, distance * 1.1);

  // near / far 也按内容大小动态设置，避免裁剪面离得太近或太远。
  camera.near = Math.max(distance / 100, 0.1);
  camera.far = distance * 8;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

// 统一处理材质释放。
// Three.js 某些情况下材质可能是数组，所以这里做一层兼容，
// 避免调用方每次都自己写判断。
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
  // scene / camera / pivot / content 组成了一个完整但很轻量的预览单元。
  // 外部页面只需要拿到这个对象，然后在自己的 renderer 中调用 render 即可。
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);

  // pivot 是旋转枢轴。
  // 后面做统一动画时，我们旋转 pivot，而不是直接旋转 mesh，
  // 这样内容整体会更稳定，也更便于以后扩展多对象组合预览。
  const pivot = new THREE.Group();

  // content 用来包住 mesh 和 edges。
  // 这样 frameContent 可以针对“整组可见内容”计算包围盒和自动取景。
  const content = new THREE.Group();

  // 网格材质用于显示实体表面。
  // 这里统一采用偏柔和的金属/粗糙度设置，让大多数图元都能稳定出效果。
  const meshMaterial = new THREE.MeshStandardMaterial({
    color: definition.color,
    roughness: 0.32,
    metalness: 0.12,
    // DoubleSide 主要是为了照顾平面、Shape 这类可能单面的图元，
    // 避免某些角度下看过去完全消失。
    side: THREE.DoubleSide,
  });

  // 边线材质让图元轮廓更清楚，尤其是复杂网格或平面图元时更容易看结构。
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

  // 半球光提供一个比较均匀的基础明暗，让上方偏亮、下方略暗。
  scene.add(new THREE.HemisphereLight(0xffffff, 0x12141c, 1.2));

  // 主光负责塑造主要亮面。
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(2.6, 3.2, 4);
  scene.add(keyLight);

  // 轮廓光让背光侧不至于死黑，也能稍微把形体边缘挑出来。
  const rimLight = new THREE.DirectionalLight(0x8ea7ff, 1.1);
  rimLight.position.set(-2.2, 1.8, -3.4);
  scene.add(rimLight);

  // content 里真正要显示的是“实体网格 + 边线轮廓”。
  content.add(mesh, edges);
  pivot.add(content);
  scene.add(pivot);

  // 每种图元默认可以有自己的 distanceMultiplier，
  // 某些图元比如文字、参数曲面、管道会比标准盒子更需要留白。
  const distanceMultiplier = options.distanceMultiplier ?? definition.distanceMultiplier;
  frameContent(content, camera, distanceMultiplier);

  // 详情页拖动滑块后，不需要重建整个 scene / camera，
  // 只需要替换 mesh.geometry 和边线 geometry 即可。
  function updateGeometry(nextParams) {
    const nextGeometry = createGeometryForPrimitive(definition, nextParams);
    const nextEdgeGeometry = new THREE.EdgesGeometry(nextGeometry, 18);

    // 先释放旧 geometry，再把新 geometry 挂上去，避免显存泄漏。
    mesh.geometry.dispose();
    edges.geometry.dispose();

    geometry = nextGeometry;
    edgeGeometry = nextEdgeGeometry;
    mesh.geometry = geometry;
    edges.geometry = edgeGeometry;

    // 参数变化后，图元大小和中心都可能变化，所以要重新自动取景。
    frameContent(content, camera, distanceMultiplier);
  }

  // 总览页和详情页都调用这个函数做统一旋转动画。
  // index 主要用于给不同图元一点不同相位，让它们不要像复制粘贴一样同步旋转。
  function setRotation(seconds, index = 0) {
    pivot.rotation.x =
      (definition.baseRotationX ?? 0.3) + Math.sin(seconds * 0.85 + index * 0.3) * 0.08;
    pivot.rotation.y = (definition.baseRotationY ?? 0.45) + seconds * 0.72;
    pivot.rotation.z =
      (definition.baseRotationZ ?? 0) + Math.sin(seconds * 0.55 + index * 0.5) * 0.04;
  }

  // 释放当前 preview 自己持有的 WebGL 资源。
  // scene / camera 不需要手动 dispose，但 geometry / material 需要。
  function dispose() {
    mesh.geometry.dispose();
    edges.geometry.dispose();
    disposeMaterial(meshMaterial);
    edgeMaterial.dispose();
  }

  // 返回给页面层使用的最小接口。
  // 页面层只需要知道：
  // 1. scene / camera 用来渲染
  // 2. pivot 便于外部调试或扩展
  // 3. updateGeometry 用于参数变化
  // 4. setRotation 用于统一动画
  // 5. dispose 用于切页清理
  return {
    scene,
    camera,
    pivot,
    updateGeometry,
    setRotation,
    dispose,
  };
}
