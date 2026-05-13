import * as THREE from 'three';

/**
 * 释放材质资源。
 *
 * Three.js 的 mesh.material 有两种形态：
 * 1. 单个 Material；
 * 2. Material[]，例如一个几何体不同面使用不同材质。
 *
 * 页面切换路由时，如果只移除 canvas，不调用 dispose，GPU 上的 shader、纹理引用等资源可能继续占用显存。
 */
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}

/**
 * 创建当前预览卡片/详情页专用的 renderer。
 *
 * 本项目每个示例都独立创建 renderer，离开路由时再完整释放，
 * 这样示例之间不会共享 WebGL 状态，也方便讲清楚生命周期边界。
 */
function createRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.domElement.className = 'custom-buffergeometry-canvas';
  stage.appendChild(renderer.domElement);
  return renderer;
}

/**
 * 创建一个小棋盘 CanvasTexture。
 *
 * 这个纹理用于演示 uv attribute：
 * - 如果 uv 正确，棋盘会完整铺在面片上；
 * - 如果 uv 缺失或错误，贴图采样位置就会不符合预期。
 */
function createCheckerTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? '#7dd3fc' : '#0f172a';
      context.fillRect((x * size) / 8, (y * size) / 8, size / 8, size / 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * 创建仅包含 position attribute 的三角形。
 *
 * BufferGeometry 的最小使用链路是：
 * 1. 用 TypedArray 准备连续内存数据；
 * 2. 用 BufferAttribute 声明“每几个数字组成一个顶点属性”；
 * 3. 用 setAttribute('position', attribute) 注册给 geometry。
 *
 * 这里没有使用内置的 ShapeGeometry 或 PlaneGeometry，三角形完全由 positions 里的 9 个数字决定。
 */
function createPositionTriangle(cleanup) {
  const geometry = new THREE.BufferGeometry();

  // Float32Array 更接近 GPU 需要的数据格式，内存紧凑，适合被 WebGL 上传为顶点缓冲。
  // 这里每 3 个数字是一组：x, y, z，所以 9 个数字刚好表示 3 个顶点。
  const positions = new Float32Array([-1.25, -0.95, 0, 1.25, -0.95, 0, 0, 1.15, 0]);

  // 第二个参数 itemSize = 3，告诉 three.js：读取 position 时每 3 个数字组成一个顶点位置。
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // MeshBasicMaterial 不依赖法线；这里仍计算一次法线，方便后续切换受光材质时保持正确。
  geometry.computeVertexNormals();

  const material = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);

  // cleanup 队列只登记释放动作，不立刻执行；路由卸载时统一释放 GPU 资源。
  cleanup.push(() => geometry.dispose(), () => disposeMaterial(material));
  return { mesh, animate: (seconds) => { mesh.rotation.y = Math.sin(seconds * 0.9) * 0.35; } };
}

/**
 * 创建带 index 的正方形。
 *
 * 没有 index 时，一个正方形通常要写 6 个顶点：两个三角形各 3 个。
 * 有 index 时，只需要写 4 个唯一角点，再用 6 个索引指定三角形拼接顺序。
 */
function createIndexedQuad(cleanup) {
  const geometry = new THREE.BufferGeometry();

  // 4 个唯一顶点：左下、右下、右上、左上。
  const positions = new Float32Array([-1.2, -1.2, 0, 1.2, -1.2, 0, 1.2, 1.2, 0, -1.2, 1.2, 0]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // 每 3 个索引组成一个三角形：
  // 0,1,2 是第一个三角形；0,2,3 是第二个三角形。
  // 索引值不是坐标，而是指向 position attribute 中的“第几个顶点”。
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.42, metalness: 0.08, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);

  // EdgesGeometry 只用于可视化边界，帮助观察 4 个点如何拼成 2 个三角形。
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 }),
  );
  mesh.add(edges);

  cleanup.push(
    () => geometry.dispose(),
    () => disposeMaterial(material),
    () => edges.geometry.dispose(),
    () => disposeMaterial(edges.material),
  );
  return { mesh, animate: (seconds) => { mesh.rotation.y = seconds * 0.45; } };
}

/**
 * 创建同时包含 position、uv、normal 的贴图面片。
 *
 * 这段示例重点说明：一个“顶点”不是只有位置。
 * 对渲染来说，一个顶点通常是 position + uv + normal + color 等属性的组合。
 * 如果两个顶点空间位置相同，但 uv 或 normal 不同，它们仍然应该拆成不同顶点。
 */
function createUvNormalPlane(cleanup) {
  const geometry = new THREE.BufferGeometry();

  // position：每个顶点 3 个数字，决定面片四个角在 3D 空间中的位置。
  const positions = new Float32Array([-1.35, -1, 0, 1.35, -1, 0.15, 1.15, 1, 0.45, -1.15, 1, -0.1]);

  // uv：每个顶点 2 个数字，决定纹理上哪个位置贴到这个顶点。
  // 这里从 (0,0) 到 (1,1)，表示整张棋盘纹理铺满面片。
  const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);

  // normal：每个顶点 3 个数字，表示该顶点的受光方向。
  // 后面会 computeVertexNormals，所以这里主要保留“normal attribute 结构”的教学展示。
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);

  // 根据当前面片形状重新计算法线，使 MeshStandardMaterial 的光照更贴合倾斜面。
  geometry.computeVertexNormals();

  const texture = createCheckerTexture();
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.48, metalness: 0.05, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);

  cleanup.push(() => geometry.dispose(), () => disposeMaterial(material), () => texture.dispose());
  return { mesh, animate: (seconds) => { mesh.rotation.y = Math.sin(seconds * 0.6) * 0.45; } };
}

/**
 * 创建动态顶点平面。
 *
 * PlaneGeometry 已经内置创建好了 position attribute。
 * 我们每帧修改 position 中每个顶点的高度，再设置 needsUpdate = true，
 * three.js 才会把 CPU 侧的新数据重新上传到 GPU。
 */
function createDynamicWave(cleanup) {
  const geometry = new THREE.PlaneGeometry(3.6, 3.6, 36, 36);

  // PlaneGeometry 默认在 XY 平面上；旋转到 XZ 平面后，更像一片水平水面。
  geometry.rotateX(-Math.PI / 2);

  // 直接拿到内置几何体生成的 position attribute。
  // 后续不创建新几何体，只改这个 attribute 内部的顶点数据。
  const position = geometry.attributes.position;

  // DynamicDrawUsage 是给底层 WebGL 的使用提示：这份 buffer 会经常被更新。
  position.setUsage(THREE.DynamicDrawUsage);

  const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.38, metalness: 0.12, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);

  cleanup.push(() => geometry.dispose(), () => disposeMaterial(material));
  return {
    mesh,
    animate(seconds) {
      for (let index = 0; index < position.count; index += 1) {
        // getX/getZ 读取当前顶点在平面上的水平位置。
        // 用 sin/cos 根据位置和时间算出高度，就能形成连续波浪。
        const x = position.getX(index);
        const z = position.getZ(index);
        const y = Math.sin(x * 2.4 + seconds * 1.8) * 0.18 + Math.cos(z * 2.2 + seconds * 1.4) * 0.18;
        position.setY(index, y);
      }

      // 关键：只改 TypedArray 不够，必须设置 needsUpdate，three.js 才会重新上传 position buffer。
      position.needsUpdate = true;

      // 顶点高度变了，面法线也应该跟着变；否则光照仍像旧平面，看起来会不自然。
      geometry.computeVertexNormals();
      mesh.rotation.y = seconds * 0.18;
    },
  };
}

/**
 * 根据数据层 definition.id 选择对应的 BufferGeometry 示例。
 * 页面层只关心“挂载哪个 definition”，具体几何体创建细节留在这里集中管理。
 */
function createPreviewObject(definition, cleanup) {
  if (definition.id === 'indexed-geometry') return createIndexedQuad(cleanup);
  if (definition.id === 'uv-normal-attributes') return createUvNormalPlane(cleanup);
  if (definition.id === 'dynamic-vertex-update') return createDynamicWave(cleanup);
  return createPositionTriangle(cleanup);
}

/**
 * 创建一个完整的自定义缓冲几何体预览场景。
 *
 * 返回值包含 scene、camera、animate 和 cleanup：
 * - scene/camera 用于 renderer.render；
 * - animate 用于每帧更新演示对象；
 * - cleanup 队列用于路由卸载时统一释放几何体、材质、纹理等资源。
 */
export function createCustomBufferGeometryPreview(definition) {
  const cleanup = [];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.Fog(0x0f172a, 8, 18);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  camera.position.set(3.6, 2.6, 5.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x111827, 1.25));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  // 地面只是辅助参照物，用来体现几何体的空间关系和动态波浪的高度变化。
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.82, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.25;
  scene.add(floor);

  const previewObject = createPreviewObject(definition, cleanup);
  previewObject.mesh.position.y = definition.id === 'dynamic-vertex-update' ? -0.25 : 0;
  scene.add(previewObject.mesh);

  cleanup.push(() => floor.geometry.dispose(), () => disposeMaterial(floor.material));

  function animate(seconds) {
    previewObject.animate(seconds);
  }

  return { scene, camera, cleanup, animate };
}

/**
 * 把预览场景挂载到指定 DOM 容器，并启动 requestAnimationFrame 循环。
 *
 * 这个函数是页面和 Three.js 之间的生命周期边界：
 * 页面进入时调用它创建 renderer 和动画；页面离开时调用返回的 disposer 清理资源。
 */
export function mountCustomBufferGeometryScene(stage, definition) {
  const preview = createCustomBufferGeometryPreview(definition);
  const renderer = createRenderer(stage);
  let disposed = false;
  let animationFrameId = 0;

  /**
   * 同步 canvas 尺寸和相机投影矩阵。
   * 容器尺寸变化后，如果只改 renderer，不改 camera.aspect，画面会被压扁或拉伸。
   */
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    preview.camera.aspect = width / height;
    preview.camera.updateProjectionMatrix();
  }

  /**
   * 单帧渲染流程：
   * 1. 把 requestAnimationFrame 的毫秒时间转成秒；
   * 2. 更新当前示例的几何体或旋转动画；
   * 3. 渲染 scene；
   * 4. 请求下一帧。
   */
  function render(time) {
    if (disposed) return;
    const seconds = time * 0.001;
    preview.animate(seconds);
    renderer.render(preview.scene, preview.camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);

    // 执行所有在创建阶段登记的资源释放任务。
    // 这里会释放自定义 BufferGeometry、材质、纹理和辅助地面，避免路由切换后显存泄漏。
    preview.cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
