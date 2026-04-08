import * as THREE from 'three';

export function mountCubesPage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/cubes</p>
        <h2>多个立方体</h2>
        <p>这个页面对应原来的多立方体示例，现在会随着路由进入和离开完成挂载与清理。</p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  const stage = container.querySelector('[data-stage]');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cubes = [
    createCube(geometry, 0x44aa88, 0),
    createCube(geometry, 0x8844aa, -2),
    createCube(geometry, 0xaa8844, 2),
  ];

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(-1, 2, 4);
  scene.add(ambientLight, directionalLight);

  let animationFrameId = 0;
  let disposed = false;

  function createCube(sharedGeometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(sharedGeometry, material);
    cube.position.x = x;
    scene.add(cube);
    return cube;
  }

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function render(time) {
    if (disposed) {
      return;
    }

    const seconds = time * 0.001;

    cubes.forEach((cube, index) => {
      const speed = 1 + index * 0.1;
      const rotation = seconds * speed;
      cube.rotation.x = rotation;
      cube.rotation.y = rotation;
    });

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    cubes.forEach((cube) => {
      cube.material.dispose();
      scene.remove(cube);
    });

    geometry.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    container.innerHTML = '';
  };
}