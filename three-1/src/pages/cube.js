import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// 路由切到 /cube 时，这个页面负责挂载一个带泛光后处理的基础立方体场景。
export function mountCubePage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <p class="eyebrow">Route: #/cube</p>
        <h2>单个立方体与泛光</h2>
        <p>这个页面保留了你原来带后处理的单立方体示例，但改成了可挂载、可卸载的路由页面模块。</p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  // 当前页面自己的渲染容器，避免像旧写法那样直接往 body 上追加 canvas。
  const stage = container.querySelector('[data-stage]');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  scene.add(cube, line);

  // 后处理合成器负责替代直接 renderer.render(scene, camera)。
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.5,
      0.2,
      0.1,
    ),
  );

  let animationFrameId = 0;
  let disposed = false;

  // 同时更新 renderer 和 composer 的尺寸，避免缩放后画面失真。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
  }

  // 动态渲染 - requestAnimationFrame
  function render(time) {
    if (disposed) {
      return;
    }

    cube.rotation.x = time / 2000;
    cube.rotation.y = time / 1000;
    line.rotation.x = time / 2000;
    line.rotation.y = time / 1000;

    composer.render();
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  // 路由离开时，释放事件、几何体、材质和渲染器资源。
  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    geometry.dispose();
    cube.material.dispose();
    line.material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}