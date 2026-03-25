import './styles/app.css';

import { mountHomePage } from './pages/home.js';
import { mountCubePage } from './pages/cube.js';
import { mountCubesPage } from './pages/cubes.js';
import { mountModelPage } from './pages/model.js';

const routes = [
  {
    path: '/',
    label: 'Home',
    description: 'Project structure and available scene entries.',
    mount: mountHomePage,
  },
  {
    path: '/cube',
    label: 'Cube',
    description: 'A basic multi-cube scene.',
    mount: mountCubePage,
  },
  {
    path: '/cubes',
    label: 'Cubes',
    description: 'A basic multi-cube scene.',
    mount: mountCubesPage,
  },
  {
    path: '/model',
    label: 'Model',
    description: 'Load a GLB model and frame it automatically.',
    mount: mountModelPage,
  },
];

const navRoutes = routes.filter((route) => route.path === '/');
const routesByPath = new Map(routes.map((route) => [route.path, route]));
const app = document.querySelector('#app');

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">Vite + Three.js</p>
        <h1>Single Entry Router Demo</h1>
      </div>
      <nav class="app-nav" aria-label="Routes">
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
  document.title = `${route.label} | Three.js Router Demo`;
  unmountCurrentPage = route.mount(routeRoot, { routes }) ?? (() => {});
}

// 切换路由触发重新渲染
window.addEventListener('hashchange', renderRoute);

if (!window.location.hash) {
  window.location.hash = '#/';
}

renderRoute();