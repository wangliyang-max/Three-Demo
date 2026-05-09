import * as THREE from 'three';

// 光照总览页的小卡片预览统一复用同一个几何舞台。
// 这样每张卡片只切换灯光，用户更容易看出不同 Light 类型的差异。
import {
  SpotLightHelper,
  PointLightHelper,
  DirectionalLightHelper,
  HemisphereLightHelper,
} from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';

// RectAreaLight 依赖 examples 里的 uniform 初始化。
// 放在模块顶层只执行一次，避免每个卡片重复初始化。
RectAreaLightUniformsLib.init();

// 创建所有灯光示例共用的场景：地面、球、方块、金属结体和一个假阴影盘。
// 灯光模块的教学重点是“光如何改变同一组物体”，所以几何体尽量保持一致。
function createCommonStage() {
  const scene = new THREE.Scene();
  // 小卡片统一使用透视相机，观察角度固定，避免相机变化干扰光照对比。
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.8, 6.2);
  camera.lookAt(0, 0.7, 0);

  scene.background = new THREE.Color(0x0e1016);

  const cleanup = [];
  const animated = [];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x171b25, roughness: 0.92, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.05;
  scene.add(floor);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 40, 28),
    new THREE.MeshStandardMaterial({ color: 0x7ec7ff, roughness: 0.34, metalness: 0.08 }),
  );
  sphere.position.set(-1.15, 0.0, 0.1);
  scene.add(sphere);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 1.25, 1.25),
    new THREE.MeshStandardMaterial({ color: 0xffd18a, roughness: 0.56, metalness: 0.05 }),
  );
  box.position.set(1.25, -0.1, -0.35);
  scene.add(box);

  const torus = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.42, 0.14, 120, 18),
    new THREE.MeshStandardMaterial({ color: 0xf5f7ff, roughness: 0.18, metalness: 0.72 }),
  );
  torus.position.set(0.15, 1.2, 0.45);
  scene.add(torus);

  // 这里的圆盘是视觉参考用的假接地阴影，不是 Light 产生的真实阴影。
  // 灯光章节先强调受光效果，不把阴影计算混进来。
  const shadowDisk = new THREE.Mesh(
    new THREE.CircleGeometry(1.8, 48),
    new THREE.MeshBasicMaterial({ color: 0x05070d, transparent: true, opacity: 0.26 }),
  );
  shadowDisk.rotation.x = -Math.PI / 2;
  shadowDisk.position.y = -1.02;
  scene.add(shadowDisk);

  animated.push(
    (seconds, index = 0) => {
      torus.rotation.x = seconds * 0.55 + index * 0.08;
      torus.rotation.y = seconds * 0.82 + index * 0.12;
    },
  );

  cleanup.push(
    () => floor.geometry.dispose(),
    () => floor.material.dispose(),
    () => sphere.geometry.dispose(),
    () => sphere.material.dispose(),
    () => box.geometry.dispose(),
    () => box.material.dispose(),
    () => torus.geometry.dispose(),
    () => torus.material.dispose(),
    () => shadowDisk.geometry.dispose(),
    () => shadowDisk.material.dispose(),
  );

  return { scene, camera, cleanup, animated, sphere, box, torus };
}

// 根据 definition.id 创建对应灯光。
// 返回 scene / camera / setRotation / dispose，由页面层负责 renderer 和动画循环。
export function createLightPreview(definition) {
  const base = createCommonStage();
  const { scene, camera, cleanup, animated } = base;

  let beforeRender = null;

  // 给所有场景补一层很轻的环境雾感背景球，避免纯黑空间让光照差异难观察。
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(12, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x141927,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  scene.add(dome);
  cleanup.push(() => dome.geometry.dispose(), () => dome.material.dispose());

  // AmbientLight：没有方向，给所有受光材质均匀补亮，不会产生高光方向和阴影。
  if (definition.id === 'ambient') {
    const light = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(light);
  }

  // HemisphereLight：上方 skyColor、下方 groundColor，适合模拟户外天空和地面反光。
  if (definition.id === 'hemisphere') {
    const light = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 1.6);
    scene.add(light);

    // Helper 只负责把半球光方向和颜色关系可视化，方便观察。
    const helper = new HemisphereLightHelper(light, 0.75);
    scene.add(helper);
    cleanup.push(() => helper.dispose?.());
  }

  // DirectionalLight：用 position + target 决定光线方向，常用于太阳光或主方向光。
  if (definition.id === 'directional') {
    const light = new THREE.DirectionalLight(0xffffff, 2.8);
    light.position.set(3.2, 4.8, 3.4);
    // 方向光真正照向哪里由 target 决定；只改 position 很容易误解光照方向。
    light.target.position.set(0.15, 0.3, 0);
    scene.add(light);
    scene.add(light.target);

    const helper = new DirectionalLightHelper(light, 0.75, 0xffd18a);
    scene.add(helper);
    cleanup.push(() => helper.dispose?.());
  }

  // PointLight：从一个点向四周发光，距离和 decay 会明显影响亮度衰减。
  if (definition.id === 'point') {
    const light = new THREE.PointLight(0xffffff, 28, 12, 2);
    light.position.set(0, 2.1, 2.8);
    scene.add(light);

    const helper = new PointLightHelper(light, 0.22, 0xffd18a);
    scene.add(helper);
    cleanup.push(() => helper.dispose?.());
  }

  // SpotLight：锥形光束，适合手电筒、台灯、舞台追光这类局部照明。
  if (definition.id === 'spot') {
    const light = new THREE.SpotLight(0xffffff, 42, 14, Math.PI / 6, 0.38, 2);
    light.position.set(2.2, 4.2, 2.8);
    // 聚光灯也需要 target，锥形光束会朝 target 方向照射。
    light.target.position.set(0, 0.1, 0);
    scene.add(light);
    scene.add(light.target);

    const helper = new SpotLightHelper(light, 0x7ec7ff);
    scene.add(helper);
    cleanup.push(() => helper.dispose?.());
  }

  // RectAreaLight：面光源，常用来模拟柔和灯箱、窗户或屏幕发光。
  // 注意它只影响 PBR 材质，不像点光源那样从一点发散。
  if (definition.id === 'rect-area') {
    const light = new THREE.RectAreaLight(0xffffff, 14, 2.4, 1.6);
    light.position.set(0, 2.5, 3);
    light.lookAt(0, 0.45, 0);
    scene.add(light);

    // RectAreaLightHelper 需要挂到 light 自身下面，才能跟随面光源的位置和朝向。
    const helper = new RectAreaLightHelper(light);
    light.add(helper);
    cleanup.push(() => helper.dispose?.());
  }

  // 每帧只旋转共享舞台里的高光物体，让不同灯光的明暗变化更容易观察。
  function setRotation(seconds, index = 0) {
    animated.forEach((animate) => animate(seconds, index));
  }

  // 页面卸载时释放几何体、材质和 helper，避免反复进出路由造成资源堆积。
  function dispose() {
    cleanup.forEach((task) => task());
  }

  return { scene, camera, setRotation, beforeRender, dispose };
}


