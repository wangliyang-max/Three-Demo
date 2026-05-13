import * as THREE from 'three';

/**
 * 统一释放材质资源。
 * Three.js 的 mesh.material 可能是单个 Material，也可能是材质数组；
 * 页面卸载时通过这个函数避免遗漏数组材质里的 GPU 资源。
 * @param {THREE.Material|THREE.Material[]} material 需要释放的材质或材质数组。
 */
function disposeMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}

/**
 * 创建并挂载当前示例专用的 WebGLRenderer。
 * 每个卡片/详情舞台拥有独立 renderer，方便路由卸载时完整 dispose，
 * 同时开启阴影和 sRGB 输出，让主场景材质、离屏纹理颜色保持一致。
 * @param {HTMLElement} stage 承载 canvas 的页面节点。
 * @returns {THREE.WebGLRenderer} 已挂载到 stage 的渲染器。
 */
function createRenderer(stage) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'render-target-canvas';
  stage.appendChild(renderer.domElement);
  return renderer;
}

/**
 * 创建离屏渲染目标。
 * renderer.setRenderTarget(renderTarget) 后，画面不会画到屏幕，
 * 而是写入 renderTarget.texture，主场景再把这张纹理当作 map 使用。
 * @param {number} width 离屏纹理宽度，固定小屏通常用 512/1024。
 * @param {number} height 离屏纹理高度，需和离屏相机 aspect 匹配。
 * @returns {THREE.WebGLRenderTarget} 持有颜色纹理和深度缓冲的 GPU 资源。
 */
function createRenderTarget(width = 512, height = 512) {
  // WebGLRenderTarget 是一块离屏 framebuffer。
  // renderer 渲染到它时，颜色结果会写入 renderTarget.texture，之后这张纹理可被材质复用。
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
  });

  // 颜色空间和普通贴图一样重要；这里和 renderer.outputColorSpace 保持一致，避免贴图偏灰。
  renderTarget.texture.colorSpace = THREE.SRGBColorSpace;
  renderTarget.texture.name = 'Live render target texture';

  return renderTarget;
}

/**
 * 搭建会被渲染进 render target 的离屏场景。
 * 这个 scene 不直接出现在浏览器 canvas 上，它只负责生成实时纹理内容；
 * 返回的 animate 会在每帧更新小球和光环，让主场景贴图能看到动态变化。
 * @param {Function[]} cleanup cleanup 是资源释放队列：这里不立刻 dispose，
 * 而是把每个几何体/材质的释放函数 push 进去，等路由离开时统一执行。
 * @param {Object} options 离屏场景外观参数，例如雾色、地面色和色板。
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, animate: Function}} 离屏渲染所需对象。
 */
function createOffscreenScene(cleanup, options = {}) {
  const scene = new THREE.Scene();
  const fogColor = options.fogColor ?? 0x24384f;
  scene.background = new THREE.Color(fogColor);
  scene.fog = new THREE.FogExp2(fogColor, options.fogDensity ?? 0.045);

  // 离屏相机只负责拍摄 render target 的内容。
  // 它的 aspect 应该跟 render target 的宽高比一致，而不是跟主画布一致。
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 60);
  camera.position.set(0, 2.6, 7.2);
  camera.lookAt(0, 0.8, 0);

  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x1b2230, 1.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ color: options.floorColor ?? 0x1b2a3d, roughness: 0.72, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.9;
  scene.add(floor);

  const orbGeometry = new THREE.SphereGeometry(0.42, 32, 16);
  const ringGeometry = new THREE.TorusGeometry(0.74, 0.025, 8, 72);
  const markers = [];

  const palette = options.palette ?? [0x7dd3fc, 0xfbbf24, 0xfb7185, 0xa7f3d0];
  for (let index = 0; index < 4; index += 1) {
    const group = new THREE.Group();
    group.position.set((index - 1.5) * 1.18, 0.1 + Math.sin(index) * 0.14, -index * 1.15);

    const orbMaterial = new THREE.MeshStandardMaterial({
      color: palette[index],
      roughness: 0.35,
      metalness: 0.2,
      emissive: palette[index],
      emissiveIntensity: 0.12,
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    group.add(orb);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    scene.add(group);
    markers.push({ group, orb, ring, index });
    cleanup.push(() => disposeMaterial(orbMaterial), () => disposeMaterial(ringMaterial));
  }

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => orbGeometry.dispose(),
    () => ringGeometry.dispose(),
  );

  function animate(seconds) {
    markers.forEach(({ group, orb, ring, index }) => {
      group.position.y = 0.1 + Math.sin(seconds * 1.4 + index) * 0.2;
      group.rotation.y = seconds * 0.35 + index * 0.4;
      orb.rotation.y = seconds * 0.9;
      ring.rotation.z = seconds * 1.5 + index;
    });
  }

  return { scene, camera, animate };
}

/**
 * 搭建真正显示到屏幕上的主场景。
 * 不同 definition.id 会创建不同演示物体：贴图立方体、监控屏、尺寸面板或资源释放提示；
 * 它们的共同点是材质都会读取 renderTarget.texture，展示离屏场景的最新渲染结果。
 * @param {Function[]} cleanup cleanup 是资源释放队列，用来登记主场景创建的几何体、材质等 GPU 资源释放任务。
 * @param {Object} definition 数据层中的示例定义，用 id 决定演示类型。
 * @param {THREE.WebGLRenderTarget} renderTarget 离屏场景输出的实时纹理来源。
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, animate: Function}} 屏幕渲染所需对象。
 */
function createMainScene(cleanup, definition, renderTarget) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101622);
  scene.fog = new THREE.Fog(0x101622, 10, 24);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
  camera.position.set(4.5, 3.2, 7.2);
  camera.lookAt(0, 0.7, 0);

  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x172033, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ color: 0x182234, roughness: 0.78, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.08;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(16, 16, 0x5aa7c8, 0x26384d);
  grid.position.y = -1.06;
  scene.add(grid);

  const liveTextureMaterial = new THREE.MeshStandardMaterial({
    map: renderTarget.texture,
    roughness: 0.42,
    metalness: 0.08,
  });

  const screenMaterial = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x26364d, roughness: 0.35, metalness: 0.45 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x2563eb, emissiveIntensity: 0.35 });

  const animatedObjects = [];

  if (definition.id === 'screen-with-depth') {
    // 监控屏案例：renderTarget.texture 贴在 PlaneGeometry 上，主场景只负责屏幕外壳。
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), screenMaterial);
    screen.position.set(0.75, 0.9, 0);
    screen.rotation.y = -0.25;
    scene.add(screen);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.72, 2.22, 0.14), frameMaterial);
    frame.position.copy(screen.position);
    frame.position.z -= 0.08;
    frame.rotation.copy(screen.rotation);
    frame.castShadow = true;
    scene.add(frame);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 1.2, 24), frameMaterial);
    stand.position.set(0.75, -0.38, -0.18);
    stand.castShadow = true;
    scene.add(stand);

    const cameraGlyph = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.45), accentMaterial);
    cameraGlyph.position.set(-2.2, -0.45, 0.4);
    cameraGlyph.castShadow = true;
    scene.add(cameraGlyph);
    animatedObjects.push(cameraGlyph);

    //  释放几何体 GPU 资源
    cleanup.push(
      () => screen.geometry.dispose(),
      () => frame.geometry.dispose(),
      () => stand.geometry.dispose(),
      () => cameraGlyph.geometry.dispose(),
    );
  } else if (definition.id === 'resize-render-target') {
    // 尺寸同步案例：主画面用多块小面板模拟采样像素，强调 render target 自身也有尺寸。
    const panelGroup = new THREE.Group();
    const panelGeometry = new THREE.BoxGeometry(0.72, 0.72, 0.08);
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const panel = new THREE.Mesh(panelGeometry, liveTextureMaterial);
        panel.position.set((col - 2) * 0.82, 0.5 + (1 - row) * 0.82, 0);
        panel.rotation.y = (col - 2) * 0.08;
        panelGroup.add(panel);
      }
    }
    panelGroup.position.set(0, 0.1, 0);
    scene.add(panelGroup);
    animatedObjects.push(panelGroup);
    cleanup.push(() => panelGeometry.dispose());
  } else if (definition.id === 'resource-cleanup') {
    // 资源释放案例：仍然使用实时贴图，但额外放置资源标签，方便页面说明生命周期边界。
    const cube = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), liveTextureMaterial);
    cube.position.set(0, 0.25, 0);
    cube.castShadow = true;
    scene.add(cube);
    animatedObjects.push(cube);

    const bars = [];
    for (let index = 0; index < 4; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28 + index * 0.24, 0.35), accentMaterial);
      bar.position.set(-2.4 + index * 0.48, -0.9 + (0.28 + index * 0.24) / 2, 1.1);
      bar.castShadow = true;
      scene.add(bar);
      bars.push(bar);
      animatedObjects.push(bar);
    }

    cleanup.push(() => cube.geometry.dispose(), ...bars.map((bar) => () => bar.geometry.dispose()));
  } else {
    // 基础案例：renderTarget.texture 直接作为立方体贴图。
    const cube = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), liveTextureMaterial);
    cube.position.set(0, 0.35, 0);
    cube.castShadow = true;
    scene.add(cube);
    animatedObjects.push(cube);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.035, 8, 96), accentMaterial);
    halo.position.set(0, 0.35, 0);
    halo.rotation.x = Math.PI / 2;
    scene.add(halo);
    animatedObjects.push(halo);

    cleanup.push(() => cube.geometry.dispose(), () => halo.geometry.dispose());
  }

  cleanup.push(
    () => floor.geometry.dispose(),
    () => disposeMaterial(floor.material),
    () => grid.geometry.dispose(),
    () => disposeMaterial(grid.material),
    () => disposeMaterial(liveTextureMaterial),
    () => disposeMaterial(screenMaterial),
    () => disposeMaterial(frameMaterial),
    () => disposeMaterial(accentMaterial),
  );

  function animate(seconds) {
    animatedObjects.forEach((object, index) => {
      object.rotation.y += 0.004 + index * 0.0008;
      object.rotation.x = Math.sin(seconds * 0.55 + index) * 0.08;
    });
  }

  return { scene, camera, animate };
}

/**
 * 组装一个完整的渲染目标示例。
 * 这里把 render target、离屏 scene、主 scene 和 cleanup 队列打包在一起，
 * 让页面层不需要了解内部资源结构，只需要调用 mount/dispose。
 * @param {Object} definition 数据层中的示例定义。
 * @returns {{renderTarget: THREE.WebGLRenderTarget, offscreen: Object, main: Object, cleanup: Function[]}} 示例运行上下文。
 */
export function createRenderTargetPreview(definition) {
  // cleanup 队列用来集中管理本示例创建的 GPU 资源释放任务。
  // 创建场景时只负责登记 () => resource.dispose()，真正释放发生在 mountRenderTargetScene 返回的 disposer 中。
  // 这样页面层切换路由时只需要调用一个 dispose 函数，就能清掉离屏场景、主场景和 render target 的资源。
  const cleanup = [];
  const renderTargetSize = definition.id === 'resize-render-target' ? 768 : 512;
  const renderTarget = createRenderTarget(renderTargetSize, renderTargetSize);

  const offscreen = createOffscreenScene(cleanup, {
    fogColor: definition.id === 'resource-cleanup' ? 0x2f3e46 : 0x203a55,
    floorColor: definition.id === 'screen-with-depth' ? 0x1f2f46 : 0x1a2a3e,
  });
  const main = createMainScene(cleanup, definition, renderTarget);

  // WebGLRenderTarget 自身也持有颜色纹理和深度缓冲，所以同样登记到 cleanup 队列。
  cleanup.push(() => renderTarget.dispose());

  return { renderTarget, offscreen, main, cleanup };
}

/**
 * 将渲染目标示例挂载到页面节点并启动动画循环。
 * 每帧先把 offscreen.scene 渲染进 renderTarget，再把 main.scene 渲染到屏幕；
 * 返回的 disposer 会停止动画、解绑 resize、释放 render target、renderer、几何体和材质。
 * @param {HTMLElement} stage 页面中的预览容器或详情舞台。
 * @param {Object} definition 数据层中的示例定义。
 * @returns {Function} 路由离开时调用的清理函数。
 */
export function mountRenderTargetScene(stage, definition) {
  const preview = createRenderTargetPreview(definition);
  const renderer = createRenderer(stage);
  let disposed = false;
  let animationFrameId = 0;

  /**
   * 同步主画布尺寸、主相机宽高比，并在尺寸同步示例中更新 render target。
   * 注意：固定贴图示例不跟随容器重建离屏纹理，避免不必要的 GPU 分配。
   */
  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);

    preview.main.camera.aspect = width / height;
    preview.main.camera.updateProjectionMatrix();

    if (definition.id === 'resize-render-target') {
      // 只有“尺寸同步”示例让 render target 跟随容器变化。
      // 其他示例固定为 512x512，展示小屏幕/小贴图时更省 GPU 资源。
      const targetWidth = Math.max(Math.floor(width * pixelRatio), 1);
      const targetHeight = Math.max(Math.floor(height * pixelRatio), 1);
      preview.renderTarget.setSize(targetWidth, targetHeight);
      preview.offscreen.camera.aspect = targetWidth / targetHeight;
      preview.offscreen.camera.updateProjectionMatrix();
    }
  }

  /**
   * 单帧渲染流程。
   * 1. 更新离屏场景和主场景动画；
   * 2. 切到 render target，把离屏画面写进 texture；
   * 3. 切回 null，把使用该 texture 的主场景画到屏幕。
   * @param {number} time requestAnimationFrame 传入的毫秒时间戳。
   */
  function render(time) {
    if (disposed) return;

    const seconds = time * 0.001;
    preview.offscreen.animate(seconds);
    preview.main.animate(seconds);

    // 第一步：把 离屏scene 渲染到 离屏Target。
    // 此时不会更新屏幕 canvas，渲染结果写入 preview.renderTarget.texture。
    renderer.setRenderTarget(preview.renderTarget);
    renderer.render(preview.offscreen.scene, preview.offscreen.camera);

    // 第二步：恢复默认渲染目标，也就是浏览器里的 canvas。
    // 主场景中的材质会读取刚刚更新过的 renderTarget.texture。
    renderer.setRenderTarget(null);
    renderer.render(preview.main.scene, preview.main.camera);

    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
    renderer.setRenderTarget(null);
    // 按队列执行所有资源释放任务：几何体、材质、render target 都在创建时登记到了这里。
    preview.cleanup.forEach((task) => task());
    renderer.dispose();
    renderer.domElement.remove();
  };
}


