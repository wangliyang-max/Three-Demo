import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL = '/assets/nailong.glb';

export function mountModelPage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/model</p>
        <h2>GLB 模型预览</h2>
        <p>这个页面负责加载模型并在离开路由时清理渲染器与 GPU 资源。</p>
        <p class="viewer-status" data-status hidden></p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const status = container.querySelector('[data-status]');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.4);
  directionalLight.position.set(4, 6, 8);
  scene.add(directionalLight);

  const loader = new GLTFLoader();
  let modelRoot = null;
  let animationFrameId = 0;
  let disposed = false;

  function setStatus(message, tone = 'info') {
    status.hidden = !message;
    status.textContent = message ?? '';
    status.classList.toggle('is-error', tone === 'error');
  }

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function frameModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = ((maxDimension / 2) / Math.tan(fov / 2)) * 1.5;

    camera.position.set(center.x, center.y + size.y * 0.15, center.z + distance);
    camera.near = Math.max(distance / 100, 0.1);
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    camera.lookAt(center);
  }

  function render() {
    if (disposed) {
      return;
    }

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  setStatus('模型加载中...');

  loader.load(
    MODEL_URL,
    (gltf) => {
      if (disposed) {
        disposeObject3D(gltf.scene);
        return;
      }

      modelRoot = gltf.scene;
      scene.add(modelRoot);
      frameModel(modelRoot);
      setStatus('');
    },
    undefined,
    (error) => {
      console.error('Failed to load model:', error);
      setStatus('未找到模型资源 /assets/nailong.glb，请补齐文件后重试。', 'error');
    },
  );

  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    if (modelRoot) {
      scene.remove(modelRoot);
      disposeObject3D(modelRoot);
    }

    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}

function disposeObject3D(root) {
  root.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  for (const value of Object.values(material)) {
    if (value && typeof value === 'object' && 'minFilter' in value) {
      value.dispose?.();
    }
  }

  material.dispose();
}