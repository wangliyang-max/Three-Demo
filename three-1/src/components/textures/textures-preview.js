import * as THREE from 'three';

// 这个文件专门负责“怎么把某一种纹理定义渲染成可观察的预览场景”。
// 数据层（textures-data.js）只关心：
// - 每种纹理的说明文案
// - 示例代码
// - 如何创建对应的纹理资源
//
// 预览层则关心：
// - 用什么几何体承载这张纹理
// - 需要什么灯光和背景
// - 哪些类型需要逐帧更新
// - 哪些 WebGL / DOM 资源需要在卸载时释放
function createStageBackdrop() {
  const geometry = new THREE.CircleGeometry(1.55, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0x060912,
    transparent: true,
    opacity: 0.42,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1.18;
  return mesh;
}

function createSharedLights(scene) {
  scene.add(new THREE.AmbientLight(0x7c8aa8, 0.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111726, 1));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(2.4, 3.2, 4.6);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x83bfff, 0.8);
  fillLight.position.set(-2.8, 1.2, -2.4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffd18a, 1.25, 10, 2);
  rimLight.position.set(-1.8, 2.2, 2.8);
  scene.add(rimLight);
}

function createDepthMonitorMaterial(renderTarget) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uDepth: { value: renderTarget.depthTexture },
      cameraNear: { value: 0.1 },
      cameraFar: { value: 12 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      #include <packing>

      uniform sampler2D uDepth;
      uniform float cameraNear;
      uniform float cameraFar;
      varying vec2 vUv;

      void main() {
        float fragCoordZ = texture2D(uDepth, vUv).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        float depth = viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        vec3 nearColor = vec3(1.0, 0.82, 0.54);
        vec3 farColor = vec3(0.18, 0.48, 0.92);
        vec3 color = mix(nearColor, farColor, depth);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function updateCanvasTexture(canvas, seconds) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#101a2a');
  gradient.addColorStop(0.5, '#1f4b7f');
  gradient.addColorStop(1, '#ffd18a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 10; i += 1) {
    const x = 56 + i * 40;
    const y = 324 + Math.sin(seconds * 1.8 + i * 0.45) * 42;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Arial';
  ctx.fillText('Hello 3D', 54, 138);
  ctx.font = '28px Arial';
  ctx.fillText(`t = ${seconds.toFixed(1)}s`, 58, 204);
}

export function createTexturePreview(definition) {
  // 每个预览都生成自己独立的 scene 和 camera。
  // 这样总览页虽然共享一个 renderer，但每张卡片仍然可以拥有各自的场景对象和生命周期。
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 4.5);
  camera.lookAt(0, 0, 0);

  const backdrop = createStageBackdrop();
  scene.add(backdrop);
  createSharedLights(scene);

  const previewState = definition.createPreview();
  const cleanupTasks = [];
  const animatedMeshEntries = [];
  let renderHook = null;
  let overlayState = null;

  // 大多数纹理类型都可以直接挂在一个立方体上观察：
  // - 图片纹理：看平铺和采样
  // - CanvasTexture：看内容刷新
  // - VideoTexture：看逐帧播放
  // - DataTexture：看程序生成图案
  // - 压缩纹理：看它在材质上的最终表现
  //
  // cube / depth 这两种属于特殊场景：
  // - CubeTexture 既是背景又是环境贴图，不能只当普通 2D 贴图处理
  // - DepthTexture 需要离屏渲染目标，展示的是深度结果而不是普通颜色图
  if (previewState.texture && definition.id !== 'cube' && definition.id !== 'depth') {
    const geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8, 1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: previewState.texture,
      roughness: definition.id === 'compressed' ? 0.92 : 0.5,
      metalness: 0.08,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    animatedMeshEntries.push({ mesh, speed: 0.72 });
    cleanupTasks.push(() => geometry.dispose());
    cleanupTasks.push(() => material.dispose());
    cleanupTasks.push(() => previewState.texture.dispose());
  }

  if (definition.id === 'cube') {
    // CubeTexture 的教学重点是“两种用途”：
    // 1. 当作 scene.background，形成天空盒
    // 2. 当作 envMap，给金属球提供环境反射
    scene.background = previewState.texture;
    const geometry = new THREE.SphereGeometry(1.05, 48, 32);
    const material = new THREE.MeshStandardMaterial({
      envMap: previewState.texture,
      color: 0xf2f5ff,
      roughness: 0.08,
      metalness: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    animatedMeshEntries.push({ mesh, speed: 0.65 });
    cleanupTasks.push(() => geometry.dispose());
    cleanupTasks.push(() => material.dispose());
    cleanupTasks.push(() => previewState.texture.dispose());
  }

  if (definition.id === 'canvas') {
    // CanvasTexture 不会自己知道画布内容改了，所以每次重绘后都必须标记 needsUpdate。
    renderHook = (seconds) => {
      updateCanvasTexture(previewState.canvas, seconds);
      previewState.texture.needsUpdate = true;
    };
  }

  if (definition.id === 'video') {
    // 这里显式维护一个“页面内提示层”的状态，而不是继续依赖浏览器自己弹提示。
    // 原因是 macOS / Safari 上自动播放失败时，经常不会给出足够明确的 UI 反馈。
    // 如果我们不自己暴露状态，用户只会看到视频纹理停在黑屏或首帧，无法判断下一步该做什么。
    overlayState = {
      visible: true,
      message: '点击启用视频纹理播放',
      tone: 'info',
    };

    // VideoTexture 依赖真实 video 元素持续播放。
    // 这里在进入预览时主动调用 play()，以便让总览卡片和详情页都能尽快开始出帧。
    //
    // 由于浏览器自动播放策略可能在某些环境下阻止播放，所以这里不把失败视为致命错误；
    // 页面仍可加载，只是视频画面可能停在首帧，直到用户环境允许播放。
    renderHook = () => {
      if (previewState.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !previewState.video.paused) {
        overlayState.visible = false;
      }
    };

    // 统一把“尝试播放”抽成一个函数，方便自动尝试和用户手动点击时复用。
    async function tryPlayVideo() {
      try {
        await previewState.video.play();
        overlayState.visible = false;
        overlayState.message = '';
        return true;
      } catch {
        overlayState.visible = true;
        overlayState.message = '浏览器阻止了自动播放，点击这里继续';
        overlayState.tone = 'warning';
        return false;
      }
    }

    // 先自动尝试一次。成功则不展示提示；失败则由页面内提示层接管。
    tryPlayVideo();

    // VideoTexture 自身需要 dispose，video 元素本身也需要停止和解除资源引用。
    // 否则在频繁切换路由时，浏览器可能继续持有解码器、网络缓冲或媒体流状态。
    cleanupTasks.push(() => {
      previewState.video.pause();
      previewState.video.removeAttribute('src');
      previewState.video.load();
    });
  }

  if (definition.id === 'depth') {
    // DepthTexture 不是给用户直接“看颜色图”的类型。
    // 它的标准用法是：
    // 1. 先把一个 3D 场景渲染到带 depthTexture 的 RenderTarget
    // 2. 再把这个深度纹理交给后处理或调试材质使用
    //
    // 这里完整保留了这个流程，避免把 DepthTexture 错误地简化成普通贴图示例。
    const renderTarget = new THREE.WebGLRenderTarget(512, 512);
    renderTarget.depthTexture = new THREE.DepthTexture(512, 512);
    renderTarget.depthTexture.type = THREE.UnsignedIntType;

    const depthScene = new THREE.Scene();
    depthScene.background = new THREE.Color(0x0f1420);
    createSharedLights(depthScene);

    const depthCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 12);
    depthCamera.position.set(0, 1.1, 4.2);
    depthCamera.lookAt(0, 0, 0);

    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.55, 0.18, 128, 24),
      new THREE.MeshStandardMaterial({ color: 0x7ec7ff, roughness: 0.4, metalness: 0.12 }),
    );
    torus.position.x = -0.62;
    depthScene.add(torus);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 40, 28),
      new THREE.MeshStandardMaterial({ color: 0xffd18a, roughness: 0.58, metalness: 0.05 }),
    );
    sphere.position.set(0.9, 0.05, -0.7);
    depthScene.add(sphere);

    const panelGeometry = new THREE.PlaneGeometry(2.55, 2.2, 1, 1);
    const panelMaterial = createDepthMonitorMaterial(renderTarget);
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    scene.add(panel);

    renderHook = (seconds, renderer) => {
      // 先更新离屏场景中的物体状态，再把它渲染进 RenderTarget。
      torus.rotation.x = seconds * 0.42;
      torus.rotation.y = seconds * 0.88;
      sphere.position.y = Math.sin(seconds * 1.2) * 0.34;

      // 这里要保存 renderer 当前绑定的目标，再恢复回去。
      // 否则总览页共享 renderer 的多卡片渲染流程会被打乱。
      const currentTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(renderTarget);
      renderer.clear(true, true, true);
      renderer.render(depthScene, depthCamera);
      renderer.setRenderTarget(currentTarget);
    };

    cleanupTasks.push(() => renderTarget.dispose());
    cleanupTasks.push(() => panelGeometry.dispose());
    cleanupTasks.push(() => panelMaterial.dispose());
    cleanupTasks.push(() => torus.geometry.dispose());
    cleanupTasks.push(() => torus.material.dispose());
    cleanupTasks.push(() => sphere.geometry.dispose());
    cleanupTasks.push(() => sphere.material.dispose());
  }

  function setRotation(seconds, index = 0) {
    // 绝大多数预览只需要一个统一的缓慢旋转，这样更利于观察纹理在模型各面的变化。
    animatedMeshEntries.forEach(({ mesh, speed }) => {
      mesh.rotation.x = 0.24 + Math.sin(seconds * 0.7 + index * 0.4) * 0.1;
      mesh.rotation.y = seconds * speed + index * 0.28;
    });
  }

  function beforeRender(seconds, renderer) {
    renderHook?.(seconds, renderer);
  }

  async function activate() {
    if (definition.id !== 'video') {
      return false;
    }

    try {
      await previewState.video.play();
      if (overlayState) {
        overlayState.visible = false;
        overlayState.message = '';
      }
      return true;
    } catch {
      if (overlayState) {
        overlayState.visible = true;
        overlayState.message = '点击后仍未播放，请检查系统或浏览器自动播放设置';
        overlayState.tone = 'warning';
      }
      return false;
    }
  }

  function getOverlayState() {
    return overlayState;
  }

  function dispose() {
    // 这里统一执行所有注册过的清理任务。
    // 这样每种纹理类型只需要把自己的特殊清理逻辑 push 进来，
    // 就不用把销毁流程散落在多个 if 分支里。
    cleanupTasks.forEach((task) => task());
    backdrop.geometry.dispose();
    backdrop.material.dispose();
  }

  return { scene, camera, setRotation, beforeRender, activate, getOverlayState, dispose };
}
