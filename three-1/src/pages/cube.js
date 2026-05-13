import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export function mountCubePage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/cube</p>
        <h2>单个立方体与泛光</h2>
        <p>这个页面保留了原来的单立方体泛光示例，但现在作为可挂载、可卸载的独立路由页面运行。</p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  // stage 是当前路由页面里的 Three.js 舞台容器。
  // renderer.domElement 会挂到这里，路由离开时也会从这里移除。
  const stage = container.querySelector('[data-stage]');

  // Scene 是 three.js 的场景容器，所有要被渲染的物体、线框、灯光等都会加入 scene。
  const scene = new THREE.Scene();

  // PerspectiveCamera 是透视相机，参数依次是：视野角度、宽高比、近裁剪面、远裁剪面。
  // 这里先把 aspect 写成 1，后面 resize() 会根据真实容器尺寸更新。
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;

  // WebGLRenderer 负责把 scene + camera 渲染成 canvas。
  // antialias 开启抗锯齿；pixelRatio 限制到 2，避免高分屏下像素过多导致性能浪费。
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  // BoxGeometry 是立方体几何体；这里 cube 和 line 共用同一个 geometry。
  // 共用几何体可以减少重复顶点数据，但卸载时只需要 dispose 一次。
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // Mesh = geometry + material，表示一个可渲染的实体表面。
  // MeshBasicMaterial 不受灯光影响，所以绿色会保持固定亮度。
  const cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));

  // Line 也可以复用同一个 geometry，但它只按顶点顺序绘制线段，用红色线条做对照。
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  scene.add(cube, line);

  // EffectComposer 是后期处理管线。
  // 普通 renderer.render(scene, camera) 是直接画到屏幕；composer 会先经过一组 pass (泛光 \ 滤镜)再输出。
  const composer = new EffectComposer(renderer);

  // RenderPass 负责把正常的 scene + camera 渲染结果交给后续后期效果。
  composer.addPass(new RenderPass(scene, camera));

  // UnrealBloomPass 是泛光效果：让高亮区域向周围溢出发光。
  // 参数依次是分辨率、强度 strength、半径 radius、阈值 threshold。
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.5,
      0.2,
      0.1,
    ),
  );

  // animationFrameId 用于路由卸载时取消下一帧动画。
  // disposed 是额外保险，避免卸载后 render 继续执行。
  let animationFrameId = 0;
  let disposed = false;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    // 容器尺寸变化后，相机宽高比必须同步更新，否则画面会被拉伸。
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // renderer 和 composer 都要同步尺寸。
    // renderer 控制 canvas 大小；composer 内部还有后期处理用的 render target，也需要 setSize。
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
  }

  function render(time) {
    if (disposed) {
      return;
    }

    // requestAnimationFrame 传入的 time 是毫秒时间戳。
    // 用不同除数控制 x/y 方向旋转速度，让立方体持续转动。
    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;
    line.rotation.x = time / 2000;
    line.rotation.y = time / 1000;

    // 因为当前页面使用了后期处理，所以这里调用 composer.render()。
    // composer.render() 内部会按顺序执行 RenderPass -> UnrealBloomPass；
    // 如果改成 renderer.render(scene, camera)，泛光 pass 就不会执行，画面只剩普通立方体。
    composer.render();
    // window.requestAnimationFrame 的作用是：告诉浏览器在下一次屏幕刷新前执行一次函数，常用于动画循环。
    // 浏览器屏幕刷新率：60Hz 屏幕,约 60 次/秒; 120Hz 屏幕,约 120 次/秒
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  // 返回 disposer 给路由系统调用。
  // 离开页面时必须停止动画、移除事件监听，并释放 WebGL 资源。
  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    // geometry 被 cube 和 line 共用，所以只释放一次。
    geometry.dispose();

    // 每个 material 都会持有 GPU 资源，需要分别释放。
    cube.material.dispose();
    line.material.dispose();

    // renderer.dispose() 释放渲染器内部缓存；remove() 移除 canvas DOM。
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}


