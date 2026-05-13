import './styles/app.css';

import { mountHomePage } from './pages/home.js';
import { mountCubePage } from './pages/cube.js';
import { mountCubesPage } from './pages/cubes.js';
import { mountModelPage } from './pages/model.js';
import { mountPrimitivesPage } from './pages/primitives.js';
import { mountPrimitiveDetailPage } from './pages/primitive-detail.js';
import { mountEdgesWireframePage } from './pages/edges-wireframe.js';
import { mountSolarSystemPage } from './pages/solar-system.js';
import { mountMaterialsPage } from './pages/materials.js';
import { mountMaterialDetailPage } from './pages/material-detail.js';
import { mountTexturesPage } from './pages/textures.js';
import { mountTextureDetailPage } from './pages/texture-detail.js';
import { mountLightsPage } from './pages/lights.js';
import { mountLightDetailPage } from './pages/light-detail.js';
import { mountCamerasPage } from './pages/cameras.js';
import { mountCameraDetailPage } from './pages/camera-detail.js';
import { mountShadowsPage } from './pages/shadows.js';
import { mountShadowDetailPage } from './pages/shadow-detail.js';
import { mountFogPage } from './pages/fog.js';
import { mountFogDetailPage } from './pages/fog-detail.js';
import { mountRenderTargetsPage } from './pages/rendertargets.js';
import { mountRenderTargetDetailPage } from './pages/rendertarget-detail.js';
import { mountCustomBufferGeometryPage } from './pages/custom-buffergeometry.js';
import { mountCustomBufferGeometryDetailPage } from './pages/custom-buffergeometry-detail.js';
import { mountPhysicsPage } from './pages/physics.js';
import { mountPhysicsDetailPage } from './pages/physics-detail.js';
import { mountHtmlBackgroundPage } from './pages/html-background.js';
import { getPrimitiveById } from './components/primitives/primitives-data.js';
import { getMaterialById } from './components/materials/materials-data.js';
import { getTextureById } from './components/textures/textures-data.js';
import { getLightById } from './components/lights/lights-data.js';
import { getCameraById } from './components/cameras/cameras-data.js';
import { getShadowById } from './components/shadows/shadows-data.js';
import { getFogById } from './components/fog/fog-data.js';
import { getRenderTargetById } from './components/rendertargets/rendertargets-data.js';
import { getCustomBufferGeometryById } from './components/custom-buffergeometry/custom-buffergeometry-data.js';
import { getPhysicsById } from './components/physics/physics-data.js';

const routes = [
  {
    path: '/',
    label: '首页',
    description: '查看项目结构和可用场景入口。',
    mount: mountHomePage,
    title: '首页',
  },
  {
    path: '/cube',
    label: '单立方体',
    description: '一个基础的立方体演示场景。',
    mount: mountCubePage,
    title: '单立方体',
  },
  {
    path: '/cubes',
    label: '多立方体',
    description: '一个基础的多立方体演示场景。',
    mount: mountCubesPage,
    title: '多立方体',
  },
  {
    path: '/model',
    label: '模型',
    description: '加载 GLB 模型并自动取景。',
    mount: mountModelPage,
    title: '模型',
  },
  {
    path: '/primitives',
    label: '图元',
    description: '预览常见的 Three.js 基础几何图元。',
    mount: mountPrimitivesPage,
    title: '图元总览',
  },
  {
    path: '/materials',
    label: '材质',
    description: '对比同一几何体在不同 Three.js 材质下的表现差异。',
    mount: mountMaterialsPage,
    title: '材质总览',
  },
  {
    path: '/textures',
    label: '纹理',
    description: '对比不同纹理来源在 Three.js 里的创建方式和展示效果。',
    mount: mountTexturesPage,
    title: '纹理总览',
  },
  {
    path: '/lights',
    label: '光照',
    description: '对比不同光照类型如何影响同一组受光物体。',
    mount: mountLightsPage,
    title: '光照总览',
  },
  {
    path: '/cameras',
    label: '相机',
    description: '对比透视、正交和 CameraHelper 等相机示例的取景差异。',
    mount: mountCamerasPage,
    title: '相机总览',
  },
  {
    path: '/shadows',
    label: '阴影',
    description: '理解假阴影、阴影相机、阴影贴图和不同灯光阴影成本。',
    mount: mountShadowsPage,
    title: '阴影总览',
  },
  {
    path: '/fog',
    label: '雾',
    description: '理解线性雾、指数雾、背景同步和材质雾开关。',
    mount: mountFogPage,
    title: '雾总览',
  },
  {
    path: '/rendertargets',
    label: '渲染目标',
    description: '理解 WebGLRenderTarget、离屏渲染、实时贴图和资源释放。',
    mount: mountRenderTargetsPage,
    title: '渲染目标总览',
  },
  {
    path: '/custom-buffergeometry',
    label: '自定义几何体',
    description: '理解 BufferGeometry、BufferAttribute、索引、UV、法线和动态顶点更新。',
    mount: mountCustomBufferGeometryPage,
    title: '自定义缓冲几何体总览',
  },
  {
    path: '/physics',
    label: '物理',
    description: '理解重力、碰撞、body/mesh 同步和固定时间步。',
    mount: mountPhysicsPage,
    title: '物理总览',
  },
  {
    path: '/html-background',
    label: 'HTML 背景',
    description: '把透明 Three.js canvas 放在 HTML 内容背后，演示网页背景式渲染。',
    mount: mountHtmlBackgroundPage,
    title: 'HTML 背景',
  },
  {
    path: '/edges-wireframe',
    label: '边线与线框',
    description: '对比 EdgesGeometry 与 WireframeGeometry 的提取效果。',
    mount: mountEdgesWireframePage,
    title: '边线与线框',
  },
  {
    path: '/solar-system',
    label: '太阳系',
    description: '用 scene graph 展示公转、自转和父子层级关系。',
    mount: mountSolarSystemPage,
    title: '太阳系',
  },
];

const routesByPath = new Map(routes.map((route) => [route.path, route]));
const navRoutes = routes.filter(
  (route) => route.path === '/' || route.path === '/primitives' || route.path === '/materials' || route.path === '/textures' || route.path === '/lights' || route.path === '/cameras' || route.path === '/shadows' || route.path === '/fog' || route.path === '/rendertargets' || route.path === '/custom-buffergeometry' || route.path === '/physics' || route.path === '/html-background' || route.path === '/solar-system' || route.path === '/edges-wireframe',
);
const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">Vite + Three.js 示例</p>
        <h1>单入口路由演示</h1>
      </div>
      <nav class="app-nav" aria-label="页面导航">
        ${navRoutes
          .map(
            (route) =>
              `<a class="nav-link" href="#${route.path}" data-path="${route.path}">${route.label}</a>`,
          )
          .join('')}
      </nav>
    </header>
    <main id="route-root" class="route-root"></main>
  </div>
`;

const routeRoot = document.querySelector('#route-root');
let unmountCurrentPage = () => {};

function getCurrentPath() {
  const hashPath = window.location.hash.slice(1).trim();
  if (!hashPath) return '/';
  return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
}

function resolveRoute(path) {
  const staticRoute = routesByPath.get(path);
  if (staticRoute) {
    return { route: staticRoute, activePath: staticRoute.path, mountArgs: { routes }, title: staticRoute.title };
  }

  const primitiveMatch = path.match(/^\/primitives\/([^/]+)$/);
  if (primitiveMatch) {
    const primitive = getPrimitiveById(primitiveMatch[1]);
    return {
      route: { mount: mountPrimitiveDetailPage },
      activePath: '/primitives',
      mountArgs: { routes, primitiveId: primitiveMatch[1] },
      title: primitive ? `${primitive.name} 详情` : '图元详情',
    };
  }

  const materialMatch = path.match(/^\/materials\/([^/]+)$/);
  if (materialMatch) {
    const material = getMaterialById(materialMatch[1]);
    return {
      route: { mount: mountMaterialDetailPage },
      activePath: '/materials',
      mountArgs: { routes, materialId: materialMatch[1] },
      title: material ? `${material.name} 详情` : '材质详情',
    };
  }

  const textureMatch = path.match(/^\/textures\/([^/]+)$/);
  if (textureMatch) {
    const texture = getTextureById(textureMatch[1]);
    return {
      route: { mount: mountTextureDetailPage },
      activePath: '/textures',
      mountArgs: { routes, textureId: textureMatch[1] },
      title: texture ? `${texture.name} 详情` : '纹理详情',
    };
  }

  const lightMatch = path.match(/^\/lights\/([^/]+)$/);
  if (lightMatch) {
    const light = getLightById(lightMatch[1]);
    return {
      route: { mount: mountLightDetailPage },
      activePath: '/lights',
      mountArgs: { routes, lightId: lightMatch[1] },
      title: light ? `${light.name} 详情` : '光照详情',
    };
  }

  const cameraMatch = path.match(/^\/cameras\/([^/]+)$/);
  if (cameraMatch) {
    const camera = getCameraById(cameraMatch[1]);
    return {
      route: { mount: mountCameraDetailPage },
      activePath: '/cameras',
      mountArgs: { routes, cameraId: cameraMatch[1] },
      title: camera ? camera.name + ' 详情' : '相机详情',
    };
  }

  const shadowMatch = path.match(/^\/shadows\/([^/]+)$/);
  if (shadowMatch) {
    const shadow = getShadowById(shadowMatch[1]);
    return {
      route: { mount: mountShadowDetailPage },
      activePath: '/shadows',
      mountArgs: { routes, shadowId: shadowMatch[1] },
      title: shadow ? `${shadow.name} 详情` : '阴影详情',
    };
  }

  const fogMatch = path.match(/^\/fog\/([^/]+)$/);
  if (fogMatch) {
    const fog = getFogById(fogMatch[1]);
    return {
      route: { mount: mountFogDetailPage },
      activePath: '/fog',
      mountArgs: { routes, fogId: fogMatch[1] },
      title: fog ? `${fog.name} 详情` : '雾详情',
    };
  }

  const renderTargetMatch = path.match(/^\/rendertargets\/([^/]+)$/);
  if (renderTargetMatch) {
    const renderTarget = getRenderTargetById(renderTargetMatch[1]);
    return {
      route: { mount: mountRenderTargetDetailPage },
      activePath: '/rendertargets',
      mountArgs: { routes, renderTargetId: renderTargetMatch[1] },
      title: renderTarget ? `${renderTarget.name} 详情` : '渲染目标详情',
    };
  }
  const customBufferGeometryMatch = path.match(/^\/custom-buffergeometry\/([^/]+)$/);
  if (customBufferGeometryMatch) {
    const customBufferGeometry = getCustomBufferGeometryById(customBufferGeometryMatch[1]);
    return {
      route: { mount: mountCustomBufferGeometryDetailPage },
      activePath: '/custom-buffergeometry',
      mountArgs: { routes, customBufferGeometryId: customBufferGeometryMatch[1] },
      title: customBufferGeometry ? `${customBufferGeometry.name} 详情` : '自定义缓冲几何体详情',
    };
  }
  const physicsMatch = path.match(/^\/physics\/([^/]+)$/);
  if (physicsMatch) {
    const physics = getPhysicsById(physicsMatch[1]);
    return {
      route: { mount: mountPhysicsDetailPage },
      activePath: '/physics',
      mountArgs: { routes, physicsId: physicsMatch[1] },
      title: physics ? `${physics.name} 详情` : '物理详情',
    };
  }
  const homeRoute = routesByPath.get('/');
  return { route: homeRoute, activePath: '/', mountArgs: { routes }, title: homeRoute.title };
}

function setActiveNav(path) {
  document.querySelectorAll('.nav-link').forEach((link) => {
    const isActive = link.dataset.path === path;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function renderRoute() {
  const path = getCurrentPath();
  const resolved = resolveRoute(path);

  unmountCurrentPage();
  routeRoot.innerHTML = '';
  setActiveNav(resolved.activePath);
  document.title = `${resolved.title} | Three.js 路由演示`;
  unmountCurrentPage = resolved.route.mount(routeRoot, resolved.mountArgs) ?? (() => {});
}

window.addEventListener('hashchange', renderRoute);

if (!window.location.hash) {
  window.location.hash = '#/';
}

renderRoute();






