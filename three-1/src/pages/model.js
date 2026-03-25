import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 路由切到 /model 时，这个页面负责加载模型、渲染场景，并在退出时完成清理。
export function mountModelPage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <p class="eyebrow">Route: #/model</p>
        <h2>GLB 模型预览</h2>
        <p>这个页面对应模型加载示例，路由切换后会主动释放渲染器和模型资源。</p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  // 模型页也只把 canvas 挂到当前页面自己的 stage 中。
  const stage = container.querySelector('[data-stage]');
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

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  // 根据模型包围盒自动算出相机位置，避免手写死距离后看不全模型。
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

  // 通过 import.meta.url 解析资源路径，交给 Vite 正确处理静态资源。
  loader.load(
    new URL('../../assets/nailong.glb', import.meta.url).href,
    (gltf) => {
      // 如果模型回调回来时页面已经卸载，就直接销毁，不再挂到场景里。
      if (disposed) {
        disposeObject3D(gltf.scene);
        return;
      }

      modelRoot = gltf.scene;
      scene.add(modelRoot);
      frameModel(modelRoot);
    },
    undefined,
    (error) => {
      console.error('Failed to load model:', error);
    },
  );

  animationFrameId = window.requestAnimationFrame(render);

  // 路由切换时，除了销毁 renderer，还要把模型占用的 GPU 资源一起释放。
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

// 遍历模型树，把几何体和材质统一释放掉。
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

// 材质里可能还挂着纹理，所以要先把这类资源一并 dispose。
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