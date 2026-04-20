export function mountHomePage(container, { routes }) {
  const sceneRoutes = routes.filter((route) => route.path !== '/');

  container.innerHTML = `
    <section class="page page-home">
      <div class="intro-card">
        <p class="eyebrow">项目导览</p>
        <h2>从 <code>main.js</code> 统一切换不同的 Three.js 示例</h2>
        <p class="intro-text">
          这个项目把每个示例页都挂在同一个入口里，再通过 hash 路由切换具体场景。
          这样你可以一边看页面结构，一边拆开每个场景是怎么初始化、渲染和清理的。
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
        <p>如果你想继续扩展示例，可以优先参考 <code>src/pages/</code> 里的页面模块模式。</p>
        <p>每个页面都通过 hash 对应一个 <code>/path</code>，这样新增路由时只需要接上入口和挂载函数。</p>
      </div>
    </section>
  `;

  return () => {
    container.innerHTML = '';
  };
}
