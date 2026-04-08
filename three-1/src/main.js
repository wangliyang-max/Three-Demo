import './styles/app.css';

import { mountHomePage } from './pages/home.js';
import { mountCubePage } from './pages/cube.js';
import { mountCubesPage } from './pages/cubes.js';
import { mountModelPage } from './pages/model.js';
import { mountPrimitivesPage } from './pages/primitives.js';

const routes = [
  {
    path: '/',
    label: '首页',
    description: '查看项目结构和可用的场景入口。',
    mount: mountHomePage,
  },
  {
    path: '/cube',
    label: '单立方体',
    description: '一个基础的立方体演示场景。',
    mount: mountCubePage,
  },
  {
    path: '/cubes',
    label: '多立方体',
    description: '一个基础的多立方体演示场景。',
    mount: mountCubesPage,
  },
  {
    path: '/model',
    label: '模型',
    description: '加载 GLB 模型并自动完成视角取景。',
    mount: mountModelPage,
  },
  {
    path: '/primitives',
    label: '图元',
    description: '预览常见的 Three.js 基础几何图元。',
    mount: mountPrimitivesPage,
  },
];

const navRoutes = routes.filter(
  (route) => route.path === '/' || route.path === '/primitives',
);
const routesByPath = new Map(routes.map((route) => [route.path, route]));
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

// 获取路由
function getCurrentPath() {
  const hashPath = window.location.hash.slice(1).trim();

  if (!hashPath) {
    return '/';
  }

  return hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
}

// 设置活跃nav
function setActiveNav(path) {
  document.querySelectorAll('.nav-link').forEach((link) => {
    const isActive = link.dataset.path === path;
    link.classList.toggle('is-active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function renderRoute() {
  // 获取路由
  const path = getCurrentPath();
  // 获取路由路径对应的组件
  const route = routesByPath.get(path) ?? routesByPath.get('/');

  // 卸载当前内容
  unmountCurrentPage();
  routeRoot.innerHTML = '';
  setActiveNav(route.path);
  document.title = `${route.label} | Three.js 路由演示`;
  unmountCurrentPage = route.mount(routeRoot, { routes }) ?? (() => {});
}

// 切换路由触发重新渲染
window.addEventListener('hashchange', renderRoute);

if (!window.location.hash) {
  window.location.hash = '#/';
}

renderRoute();
