export const cameraCatalog = [
  {
    id: 'perspective',
    name: 'PerspectiveCamera',
    label: '透视相机',
    summary: '透视相机会让远处物体看起来更小，最适合模拟人眼或真实镜头看到的空间压缩效果。',
    learningFocus: '观察同尺寸物体沿深度方向排开后，离相机越远就越小；这就是透视投影最核心的视觉特征。',
    observationHint: '先看前中后的三组立柱是否尺寸看起来逐渐缩小，再看镜头轻微绕场时透视关系会不会继续成立。',
    code: `const camera = new THREE.PerspectiveCamera(\n  50,\n  width / height,\n  0.1,\n  100,\n);\ncamera.position.set(7, 4, 11);\ncamera.lookAt(0, 1.2, -6);`,
    parameterNotes: [
      { name: 'fov', description: '垂直视角大小。数值越大，看到的范围越广，透视变形也越明显。' },
      { name: 'aspect', description: '画布宽高比。窗口变化时需要同步更新，否则画面会被拉伸。' },
      { name: 'near / far', description: '可见裁剪范围。太小或太大会影响深度精度，但示例里主要把它们当作可视范围边界。' },
    ],
  },
  {
    id: 'orthographic',
    name: 'OrthographicCamera',
    label: '正交相机 / 2D 相机思路',
    summary: '正交相机不会产生“远处更小”的透视缩放，常用于工程视图、地图和 2D 风格界面。',
    learningFocus: '把场景内容尽量保持和透视示例一致，就能更直接地看出差异来自相机，而不是来自模型布局。',
    observationHint: '重点看前中后三组立柱即使分布在不同深度，画面里的高度依然接近一致；这就是正交投影的关键。',
    code: `const frustumSize = 14;\nconst aspect = width / height;\nconst camera = new THREE.OrthographicCamera(\n  -frustumSize * aspect * 0.5,\n   frustumSize * aspect * 0.5,\n   frustumSize * 0.5,\n  -frustumSize * 0.5,\n  0.1,\n  100,\n);\ncamera.position.set(7, 4, 11);\ncamera.lookAt(0, 1.2, -6);`,
    parameterNotes: [
      { name: 'left / right / top / bottom', description: '定义可见盒子的四条边界。和透视相机不同，它不是通过视角，而是通过可见体积控制画面。' },
      { name: 'zoom', description: '在不改变物体透视关系的前提下整体放大或缩小画面，很适合做 2D 视图缩放。' },
      { name: 'near / far', description: '同样代表裁剪范围，但不会带来透视变化。' },
    ],
  },
  {
    id: 'camera-helper',
    name: 'CameraHelper',
    label: '双视口观察',
    summary: '用第二个观察视角加上 CameraHelper，可以直观看到“另一台相机到底在拍什么、视锥体指向哪里”。',
    learningFocus: '这个示例的重点不是切换相机类型，而是理解 three.js 里“工作相机”和“观察相机”可以同时存在并互相解释。',
    observationHint: '左侧看最终拍摄结果，右侧看外部观察视角中的视锥体；两边一起看，最容易理解 near、far 和 fov 的实际影响。',
    code: `const viewCamera = new THREE.PerspectiveCamera(60, 1, 1, 22);\nconst observerCamera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);\nconst helper = new THREE.CameraHelper(viewCamera);\nscene.add(helper);`,
    parameterNotes: [
      { name: 'CameraHelper', description: '把相机的视锥体、朝向和裁剪边界画出来，适合调试取景与裁剪范围。' },
      { name: '双视口', description: '一个视口负责“被观察的相机在看什么”，另一个视口负责“外部观察者看到这台相机如何摆放”。' },
      { name: '同步更新', description: '只要相机投影矩阵或位置变化，就要调用 helper.update() 保持可视化结果正确。' },
    ],
  },
  {
    id: 'orthographic-2d',
    name: 'Orthographic 2D Layout',
    label: '正交相机 2D 坐标系',
    summary: 'three.js 没有单独叫“2D 相机”的类型，常见做法是用 OrthographicCamera 把空间当作 2D 画布来使用。',
    learningFocus: '这里重点理解“像素尺寸和相机边界如何对应”，而不是把 three.js 变成完整 UI 系统。',
    observationHint: '看四角、中心和底部条带是否在窗口缩放后仍然保持预期位置，这能说明正交相机边界是否和视口同步了。',
    code: `const camera = new THREE.OrthographicCamera(0, width, height, 0, -10, 10);\ncamera.position.z = 5;\n\nmarker.position.set(96, 96, 0);\npanel.position.set(width - 164, 96, 0);`,
    parameterNotes: [
      { name: '0..width / 0..height 边界', description: '把正交相机边界直接设置成当前视口尺寸后，物体坐标就可以按“像素式思路”理解。' },
      { name: '左上角原点', description: '把 top 设为 0、bottom 设为 height 后，y 值向下增长，接近常见 2D 画布坐标。' },
      { name: 'resize 同步', description: '窗口变化时必须同时更新 right、bottom 和投影矩阵，否则 2D 布局会变形或错位。' },
    ],
  },
];

export function getCameraById(id) {
  return cameraCatalog.find((item) => item.id === id);
}
