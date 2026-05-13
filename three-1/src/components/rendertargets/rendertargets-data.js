export const renderTargetCatalog = [
  {
    id: 'texture-on-cube',
    name: 'Render Target Texture',
    label: '把离屏场景渲染成贴图',
    summary: '先把一个独立的小场景渲染进 WebGLRenderTarget，再把生成的 texture 贴到主场景的立方体上。',
    learningFocus: '理解渲染目标不是普通图片文件，而是每帧由 renderer 写入的一张实时纹理。',
    observationHint: '观察主立方体表面：里面的小球和光环来自另一个离屏 scene，而不是主场景里的几何体。',
    code: `// 1. 创建离屏目标：它负责接收离屏场景的渲染结果
const renderTarget = new THREE.WebGLRenderTarget(512, 512);

// 2. 创建离屏场景：它只负责生成贴图内容，不直接显示到屏幕
const offscreenScene = new THREE.Scene();
const offscreenCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);
offscreenCamera.position.z = 3;
offscreenScene.add(new THREE.Mesh(geometry, redMaterial));

// 3. 创建主场景：它才是真正显示到屏幕上的场景
const mainScene = new THREE.Scene();
const mainCamera = new THREE.PerspectiveCamera(75, canvasAspect, 0.1, 10);
mainCamera.position.z = 4;

// 4. 主场景物体使用 renderTarget.texture 作为贴图
const displayCube = new THREE.Mesh(
  new THREE.BoxGeometry(2, 2, 2),
  new THREE.MeshStandardMaterial({ map: renderTarget.texture }),
);
mainScene.add(displayCube);

function render() {
  // 5. 先把离屏场景渲染到 renderTarget，不显示到屏幕
  renderer.setRenderTarget(renderTarget);
  renderer.render(offscreenScene, offscreenCamera);

  // 6. 再切回屏幕，把主场景渲染到 canvas
  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);

  requestAnimationFrame(render);
}`,
    parameters: [
      { name: 'renderTarget', description: '离屏目标，接收 offscreenScene 的渲染结果；它不是场景，而是一块可写入的 GPU 纹理缓冲。' },
      { name: 'offscreenScene', description: '离屏场景，负责生成贴图内容；它不会直接显示到浏览器 canvas。' },
      { name: 'offscreenCamera', description: '离屏相机，决定从哪个角度拍摄 offscreenScene，宽高比通常匹配 renderTarget。' },
      { name: 'displayCube', description: '主场景中的展示物体，它通过 material.map 读取 renderTarget.texture。' },
      { name: 'setRenderTarget(renderTarget)', description: '把 renderer 输出切到离屏目标，下一次 render 会写入 renderTarget.texture。' },
      { name: 'setRenderTarget(null)', description: '把 renderer 输出切回屏幕 canvas，然后才能渲染 mainScene 给用户看。' },
    ],
    usageNotes: ['先渲染离屏场景，再渲染主场景。', '渲染目标纹理可以用于任意支持贴图的材质。', '离屏相机的 aspect 应该匹配 render target 的尺寸。'],
  },
  {
    id: 'screen-with-depth',
    name: 'Scene Monitor',
    label: '3D 场景里的实时屏幕',
    summary: '把渲染目标纹理贴到一块平面上，模拟监控屏、车载屏、传送门或画中画。',
    learningFocus: '掌握 render target 的典型用途：让场景中的某个物体显示另一个相机看到的画面。',
    observationHint: '观察右侧发光屏幕：屏幕画面来自离屏相机，外框和支架仍属于主场景。',
    code: `// 1. 离屏目标保存“摄像头画面”
const monitorTarget = new THREE.WebGLRenderTarget(1024, 512);

// 2. 离屏场景可以是另一个房间、另一个相机视角或一个独立小舞台
const monitorScene = new THREE.Scene();
const monitorCamera = new THREE.PerspectiveCamera(45, 1024 / 512, 0.1, 50);
monitorCamera.position.set(0, 2, 6);
monitorScene.add(objectSeenByMonitor);

// 3. 主场景里创建一块屏幕，屏幕材质读取离屏目标纹理
const screenMaterial = new THREE.MeshBasicMaterial({
  map: monitorTarget.texture,
});
const monitorScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 1.8),
  screenMaterial,
);
mainScene.add(monitorScreen);

function render() {
  // 4. 先更新屏幕里的画面
  renderer.setRenderTarget(monitorTarget);
  renderer.render(monitorScene, monitorCamera);

  // 5. 再渲染真正给用户看的主场景
  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);

  requestAnimationFrame(render);
}`,
    parameters: [
      { name: 'monitorTarget', description: '监控屏专用离屏目标，用来保存 monitorScene 每帧渲染出的画面。' },
      { name: 'monitorScene', description: '屏幕里显示的后台场景，可以理解为监控摄像头拍到的内容。' },
      { name: 'monitorCamera', description: '拍摄 monitorScene 的离屏相机，它决定屏幕里看到的视角。' },
      { name: 'screenMaterial', description: '屏幕材质，map 指向 monitorTarget.texture，所以平面会显示离屏画面。' },
      { name: 'monitorScreen', description: '主场景里的平面屏幕，属于 mainScene，但显示内容来自 monitorTarget。' },
      { name: 'mainScene / mainCamera', description: '最终渲染到浏览器 canvas 的主场景和主相机。' },
    ],
    usageNotes: ['屏幕画面使用 MeshBasicMaterial 可避免被主场景灯光染色。', '可以给屏幕外框使用普通 PBR 材质，让它融入主场景。', '离屏相机可固定，也可以跟随某个物体运动。'],
  },
  {
    id: 'resize-render-target',
    name: 'Resize Render Target',
    label: '同步尺寸和相机投影',
    summary: '当渲染目标用于全屏后期或高清预览时，需要在窗口变化时同步更新尺寸和相机宽高比。',
    learningFocus: '理解 render target 有自己的像素尺寸；尺寸不匹配会导致画面模糊、拉伸或采样浪费。',
    observationHint: '观察画面中的像素面板：渲染目标尺寸会跟随舞台变化，离屏相机也同步更新 aspect。',
    code: `const renderTarget = new THREE.WebGLRenderTarget(1, 1);
const offscreenScene = new THREE.Scene();
const offscreenCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

const mainScene = new THREE.Scene();
const mainCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
const previewMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({ map: renderTarget.texture }),
);
mainScene.add(previewMesh);

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // 屏幕 canvas 的尺寸和主相机同步
  renderer.setSize(width, height, false);
  mainCamera.aspect = width / height;
  mainCamera.updateProjectionMatrix();

  // 离屏目标的尺寸和离屏相机也要同步
  renderTarget.setSize(width, height);
  offscreenCamera.aspect = width / height;
  offscreenCamera.updateProjectionMatrix();
}

function render() {
  resize();

  renderer.setRenderTarget(renderTarget);
  renderer.render(offscreenScene, offscreenCamera);

  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);

  requestAnimationFrame(render);
}`,
    parameters: [
      { name: 'renderer.setSize', description: '更新浏览器 canvas 的渲染尺寸，影响主屏幕最终输出。' },
      { name: 'mainCamera.aspect', description: '同步主相机宽高比，避免主场景画面被拉伸。' },
      { name: 'renderTarget.setSize', description: '更新离屏目标尺寸，重新分配 renderTarget.texture 和内部缓冲。' },
      { name: 'offscreenCamera.aspect', description: '同步离屏相机宽高比，避免离屏贴图内容变形。' },
      { name: 'previewMesh', description: '主场景里的预览平面，使用 renderTarget.texture 展示离屏结果。' },
    ],
    usageNotes: ['只有需要贴合屏幕或容器时才动态改尺寸。', '小屏幕贴图可固定为 512 或 1024，性能更稳定。', '尺寸变化后一定更新相关相机的投影矩阵。'],
  },
  {
    id: 'resource-cleanup',
    name: 'Render Target Cleanup',
    label: '释放离屏纹理和缓冲区',
    summary: 'WebGLRenderTarget 会持有 GPU 纹理、深度缓冲等资源，路由卸载时必须显式 dispose。',
    learningFocus: '把 render target 当成 GPU 资源管理，而不是普通 JS 对象；不用时要释放。',
    observationHint: '观察左下角资源提示：页面卸载时会停止动画、移除 resize 监听并释放 renderer、材质、几何体和 render target。',
    code: `const renderTarget = new THREE.WebGLRenderTarget(512, 512);
const offscreenScene = new THREE.Scene();
const offscreenCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 10);

const mainScene = new THREE.Scene();
const mainCamera = new THREE.PerspectiveCamera(75, canvasAspect, 0.1, 10);
const material = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
const geometry = new THREE.BoxGeometry(2, 2, 2);
const mesh = new THREE.Mesh(geometry, material);
mainScene.add(mesh);

function render() {
  renderer.setRenderTarget(renderTarget);
  renderer.render(offscreenScene, offscreenCamera);

  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);

  frameId = requestAnimationFrame(render);
}

// 路由离开或组件卸载时，停止渲染并释放 GPU 资源
function dispose() {
  cancelAnimationFrame(frameId);
  renderer.setRenderTarget(null);

  renderTarget.dispose();
  geometry.dispose();
  material.dispose();
  renderer.dispose();
}`,
    parameters: [
      { name: 'frameId', description: 'requestAnimationFrame 返回的动画编号，卸载时用它停止下一帧渲染。' },
      { name: 'renderer.setRenderTarget(null)', description: '释放前先切回默认 canvas，避免 renderer 继续绑定即将 dispose 的离屏目标。' },
      { name: 'renderTarget.dispose()', description: '释放离屏目标持有的颜色纹理、深度缓冲和相关 WebGL 资源。' },
      { name: 'geometry.dispose()', description: '释放主场景物体的几何体缓冲数据。' },
      { name: 'material.dispose()', description: '释放引用 renderTarget.texture 的材质资源。' },
      { name: 'renderer.dispose()', description: '释放 renderer 内部缓存，适合路由级示例完全卸载。' },
    ],
    usageNotes: ['路由切换时必须调用 disposer。', '材质使用 renderTarget.texture 时，也要释放材质本身。', '不要只 remove canvas，否则 GPU 资源仍可能残留。'],
  },
];

export function getRenderTargetById(id) {
  return renderTargetCatalog.find((item) => item.id === id);
}


