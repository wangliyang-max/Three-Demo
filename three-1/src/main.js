import './styles/app.css';

import { mountHomePage } from './pages/home.js';
import { mountCubePage } from './pages/cube.js';
import { mountCubesPage } from './pages/cubes.js';
import { mountModelPage } from './pages/model.js';
import { mountPrimitivesPage } from './pages/primitives.js';
import { mountPrimitiveDetailPage } from './pages/primitive-detail.js';
import { mountEdgesWireframePage } from './pages/edges-wireframe.js';
import { getPrimitiveById } from './components/primitives/primitives-data.js';

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
    path: '/edges-wireframe',
    label: '边线与线框',
    description: '对比 EdgesGeometry 与 WireframeGeometry 的提取效果。',
    mount: mountEdgesWireframePage,
    title: '边线与线框',
  },
];

const routesByPath = new Map(routes.map((route) => [route.path, route]));
const navRoutes = routes.filter(
  (route) => route.path === '/' || route.path === '/primitives' || route.path === '/edges-wireframe',
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
