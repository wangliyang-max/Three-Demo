import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// 其他后处理模块同理

// 场景
const scene = new THREE.Scene();
// 相机(视野范围-视角-读数为单位, 宽高比, 近裁剪面, 远裁剪面)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// 渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
// 相比setInterval, WebGLRenderer 内部使用的 requestAnimationFrame 有很多优势,当用户切换到其他浏览器标签页时它会自动暂停，从而不会浪费宝贵的处理资源和电池寿命
// setAnimationLoop会在每一帧执行（通常每秒 60 次）
renderer.setAnimationLoop( animate );

// 将 renderer 元素添加到 HTML 文档中。这是一个 <canvas> 元素
document.body.appendChild( renderer.domElement );

// 立方体
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// 立方体材质
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// 把材质应用到立方体上
const cube = new THREE.Mesh( geometry, material );
// 立方体添加到场景
scene.add( cube );

// 线条（绘制规则：线条是在每对相邻顶点之间绘制的）
const lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );
const line = new THREE.Line( geometry, lineMaterial );
// 线条加到场景
scene.add( line );

// 相机向外拉一点，默认和场景在同一层，看不到
camera.position.z = 5;

// 渲染循环，让渲染器在每次屏幕刷新时绘制场景（在普通屏幕上这意味着每秒 60 次）
function animate( time ) {

  // 立方体旋转
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;

  // 线条跟着旋转
  line.rotation.x = time / 2000;
  line.rotation.y = time / 1000;

  // 重新渲染
  // renderer.render( scene, camera );
   // 使用合成器渲染（自动执行所有通道）
    composer.render();
}

// 记录相机的初始值
var tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
var windowHeight = window.innerHeight;

// 监听窗口变化,确保放大缩小网页都可以在当前视窗内渲染
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize( event ) {
    // 重置相机的宽高比例
    camera.aspect = window.innerWidth / window.innerHeight;
    
    // 重置相机的视角
    camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / windowHeight ) );
    
    // 重新计算相机的投影矩阵的方法
    camera.updateProjectionMatrix();

    // 让相机对准 scene（场景）所在的位置
    camera.lookAt( scene.position );

    // 重新渲染
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.render( scene, camera );
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.render();
}

// 后处理管理器
const composer = new EffectComposer(renderer);
// 将场景渲染到纹理（必备）- 这里相当于做了 renderer.render( scene, camera )，所以后续渲染直接使用 composer.render()即可
composer.addPass(new RenderPass(scene, camera));
// 让亮部产生光晕效果
/**
 * new THREE.Vector2(width, height)：渲染纹理的尺寸，通常与画布一致
 * 0.5：泛光强度（strength），控制光晕的亮度。
 * 0.2：泛光半径（radius），控制光晕扩散范围。
 * 0.1：泛光阈值（threshold），亮度低于此值的像素不会被光晕处理。
 */
 const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,
    0.2,
    0.1
  );
composer.addPass(bloomPass);
