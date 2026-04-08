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

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
  }

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