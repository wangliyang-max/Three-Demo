import * as THREE from 'three';

// 路由切到 /cubes 时，主入口会调用这个函数，把场景挂到当前页面容器里。
export function mountCubesPage(container) {
  container.innerHTML = `
    <section class="page viewer-page">
      <div class="viewer-copy">
        <p class="eyebrow">Route: #/cubes</p>
        <h2>多个正方体</h2>
        <p>这个页面对应你原来的多立方体示例，但已经收敛成可挂载、可销毁的页面模块。</p>
      </div>
      <div class="viewer-stage" data-stage></div>
    </section>
  `;

  // 这里的 stage 是当前路由页面自己的渲染区域，不再直接往 body 挂 canvas。
  const stage = container.querySelector('[data-stage]');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202025);

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  // 多个立方体共用一份几何体，减少重复创建的开销。
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

  // 每个立方体单独创建材质，这样颜色可以分别控制。
  function createCube(sharedGeometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(sharedGeometry, material);
    cube.position.x = x;
    scene.add(cube);
    return cube;
  }

  // 让渲染尺寸跟随当前页面容器变化，而不是固定整个窗口。
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);

    // 设置 camera.aspect 为显示区域的宽高比，核心目的就是为了防止渲染出来的图像在屏幕上被拉伸变形
    camera.aspect = width / height;
    // 重新计算相机的投影矩阵的方法
    camera.updateProjectionMatrix();
    // 控制渲染大小，重新设置渲染器输出画布的尺寸
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

  // 路由切走时必须释放动画、事件和 WebGL 资源，避免场景叠加。
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