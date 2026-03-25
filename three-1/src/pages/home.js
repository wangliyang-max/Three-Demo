// 首页也是一个页面模块，只是不创建 Three 场景，只负责说明当前路由结构。
export function mountHomePage(container, { routes }) {
  // 首页本身不作为场景卡片展示，所以这里过滤掉根路由。
  const sceneRoutes = routes.filter((route) => route.path !== '/');

  container.innerHTML = `
    <section class="page page-home">
      <div class="intro-card">
        <p class="eyebrow">推荐结构</p>
        <h2>不要再让多个 <code>main.js</code> 直接躺在根目录</h2>
        <p class="intro-text">
          现在首页只负责路由壳层。每个场景都拆成一个页面模块，新增新页面时只需要新建一个模块，再注册一条路由。
        </p>
      </div>
      <div class="route-grid">
        ${sceneRoutes
          .map(
            (route) => `
              <a class="route-card" href="#${route.path}">
                <p class="route-card__label">${route.label}</p>
                <p class="route-card__desc">${route.description}</p>
              </a>
            `,
          )
          .join('')}
      </div>
      <div class="tips-card">
        <p>后面如果你要新增页面，推荐放到 <code>src/pages/</code>。</p>
        <p>如果以后你想把 hash 路由换成真正的 <code>/path</code> 路由，再补服务器回退配置就行。</p>
      </div>
    </section>
  `;

  // 跟其他页面保持同样的约定：返回一个卸载函数，供路由切换时调用。
  return () => {
    container.innerHTML = '';
  };
}