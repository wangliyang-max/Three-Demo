import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202025);

// 相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); //  是告诉 Three.js 这个 canvas 实际要按多高的像素密度去渲染.window.devicePixelRatio 是设备像素比
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

/*
AmbientLight 是环境光
  - 从所有方向均匀照亮物体
  - 不产生明显方向感
  - 不产生阴影层次
  - 主要作用是给模型一个基础亮度
如果模型是 MeshBasicMaterial，基本不受光照影响，还是能看到
但我现在的 .glb 模型是 MeshStandardMaterial，这种 PBR 材质依赖光照
*/
scene.add(new THREE.AmbientLight(0xffffff, 1.6));

/**
 * DirectionalLight 是方向光，可以理解成“很远处打过来的平行光”，最像太阳光
 *    - 只有方向，没有明显的距离衰减
      - 整个场景里的光线方向基本一致
      - 很适合表现明暗面、立体感
      - 可以配合阴影使用
 */
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.4);
directionalLight.position.set(4, 6, 8); // 光从这儿个方向照过来
scene.add(directionalLight);

// 加载3d模型
const loader = new GLTFLoader();
loader.load(
  new URL('./assets/nailong.glb', import.meta.url).href,
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    frameModel(model);
  },
  undefined,
  (error) => {
    console.error('Failed to load model:', error);
  }
);

//  根据模型的实际大小和中心点，自动把相机摆到一个“刚好能看到整个模型”的位置。
function frameModel(model) {
  // 计算模型包围盒
  const box = new THREE.Box3().setFromObject(model);
  // 算出模型的尺寸
  const size = box.getSize(new THREE.Vector3()); 
  // 算出模型中心点
  const center = box.getCenter(new THREE.Vector3());
  // 取最大边长
  const maxDim = Math.max(size.x, size.y, size.z);
  // 根据相机 fov 反推一个合适的观察距离 distance
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = ((maxDim / 2) / Math.tan(fov / 2)) * 1.5;

  // 把相机放到模型前上方一点
  camera.position.set(center.x, center.y + size.y * 0.15, center.z + distance);
  camera.near = Math.max(distance / 100, 0.1);
  camera.far = distance * 100;
  //  重新计算相机的投影矩阵的方法
  camera.updateProjectionMatrix();
  // 让相机对准模型中心
  camera.lookAt(center);
}

//  监听窗口变化,确保放大缩小网页都可以在当前视窗内渲染
window.addEventListener('resize', onWindowResize);

// 
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight; // 重新计算相机宽高比
  camera.updateProjectionMatrix(); // 重新计算相机的投影矩阵的方法
  // 控制渲染大小
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 渲染循环，让渲染器在每次屏幕刷新时绘制场景（在普通屏幕上这意味着每秒 60 次）
function animate() {
  renderer.render(scene, camera);
}
