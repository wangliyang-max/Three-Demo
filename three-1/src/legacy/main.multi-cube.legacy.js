import * as THREE from 'three';

// 场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202025);

// 相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 相机位置移动一下
camera.position.z = 2;

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 添加到body上
document.body.appendChild(renderer.domElement);

// 加正方体
const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

function makeInstance(geometry, color, x) {
  const material = new THREE.MeshPhongMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = x;
  scene.add(cube);
  return cube;
}

const cubes = [
  makeInstance(geometry, 0x44aa88, 0),
  makeInstance(geometry, 0x8844aa, -2),
  makeInstance(geometry, 0xaa8844, 2),
];

// 加平行光
const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

//  监听窗口变化,确保放大缩小网页都可以在当前视窗内渲染
window.addEventListener('resize', onWindowResize);

// 窗口重置
function onWindowResize() {
  // 设置 camera.aspect 为显示区域的宽高比，核心目的就是为了防止渲染出来的图像在屏幕上被拉伸变形
  camera.aspect = window.innerWidth / window.innerHeight; // 重新计算相机宽高比
  camera.updateProjectionMatrix(); // 重新计算相机的投影矩阵的方法
  // 控制渲染大小
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

// 动态渲染
function render(time) {
  time *= 0.001;  // 将时间单位变为秒
  
  // 旋转立方体
   cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * .1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });
  
  renderer.render(scene, camera);
  
  requestAnimationFrame(render);
}
requestAnimationFrame(render);