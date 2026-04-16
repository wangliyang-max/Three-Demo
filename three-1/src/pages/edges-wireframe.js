import * as THREE from 'three';

function createDemo(stage, setupScene) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.6, 4.2);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x12141c, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const demo = setupScene(scene);
  let disposed = false;
  let animationFrameId = 0;

  function resize() {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function render(time) {
    if (disposed) return;

    const seconds = time * 0.001;
    demo.group.rotation.x = demo.baseRotationX + seconds * 0.35;
    demo.group.rotation.y = demo.baseRotationY + seconds * 0.6;

    renderer.render(scene, camera);
    animationFrameId = window.requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize);
  animationFrameId = window.requestAnimationFrame(render);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
    demo.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

export function mountEdgesWireframePage(container) {
  container.innerHTML = `
    <style>
      .line-tools-page { display: grid; gap: 18px; }
      .line-tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 18px;
      }
      .line-tools-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(23, 26, 35, 0.88);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
        overflow: hidden;
      }
      .line-tools-card__copy { padding: 20px; display: grid; gap: 12px; }
      .line-tools-card__copy h3 { margin: 0; font-size: 1.2rem; }
      .line-tools-card__copy p { margin: 0; color: var(--muted); line-height: 1.7; }
      .line-tools-card__code {
        margin: 0;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(9, 11, 16, 0.74);
        color: #d8def0;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .line-tools-stage {
        min-height: 280px;
        background:
          radial-gradient(circle at top, rgba(109, 211, 206, 0.18), transparent 35%),
          linear-gradient(180deg, rgba(142, 167, 255, 0.12), transparent 42%),
          #0e1016;
      }
      .line-tools-stage canvas { display: block; width: 100%; height: 100%; }
    </style>

    <section class="page line-tools-page">
      <div class="viewer-copy">
        <a class="page-back-link" href="#/">返回首页</a>
        <p class="eyebrow">Route: #/edges-wireframe</p>
        <h2>EdgesGeometry 与 WireframeGeometry</h2>
        <p>这两个工具都能把已有几何体转换成线段，但目标不一样。EdgesGeometry 只提取硬边，适合做描边轮廓；WireframeGeometry 则会提取全部三角形边，适合观察网格结构。</p>
      </div>

      <div class="line-tools-grid">
        <article class="line-tools-card">
          <div class="line-tools-card__copy">
            <h3>EdgesGeometry（硬边轮廓）</h3>
            <p>它会根据相邻面夹角筛选边。阈值越大，被视为硬边的边越少，常用于技术描边和轮廓线效果。</p>
            <pre class="line-tools-card__code">// 创建一个立方体
const boxGeo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
const boxMat = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
const cube = new THREE.Mesh(boxGeo, boxMat);
scene.add(cube);

// 提取硬边轮廓
const edgesGeo = new THREE.EdgesGeometry(boxGeo, 30);
const edgesMat = new THREE.LineBasicMaterial({ color: 0xff5d73 });
const outline = new THREE.LineSegments(edgesGeo, edgesMat);
scene.add(outline);</pre>
          </div>
          <div class="line-tools-stage" data-demo="edges"></div>
        </article>

        <article class="line-tools-card">
          <div class="line-tools-card__copy">
            <h3>WireframeGeometry（完整线框）</h3>
            <p>它不做角度筛选，而是把所有三角面的边都取出来，更适合看模型切分、调试拓扑和理解网格密度。</p>
            <pre class="line-tools-card__code">// 创建一个球体
const sphereGeo = new THREE.SphereGeometry(0.82, 16, 16);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x66aaff });
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
scene.add(sphere);

// 提取全部三角形边
const wireframeGeo = new THREE.WireframeGeometry(sphereGeo);
const wireframeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
scene.add(wireframe);</pre>
          </div>
          <div class="line-tools-stage" data-demo="wireframe"></div>
        </article>
      </div>
    </section>
  `;

  const edgesStage = container.querySelector('[data-demo="edges"]');
  const wireframeStage = container.querySelector('[data-demo="wireframe"]');

  const disposeEdges = createDemo(edgesStage, (scene) => {
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x44aa88, roughness: 0.35, metalness: 0.12 });
    const cube = new THREE.Mesh(boxGeo, boxMat);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo, 30);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xff5d73 });
    const outline = new THREE.LineSegments(edgesGeo, edgesMat);

    group.add(cube, outline);
    scene.add(group);

    return {
      group,
      baseRotationX: 0.4,
      baseRotationY: 0.35,
      dispose: () => {
        boxGeo.dispose();
        boxMat.dispose();
        edgesGeo.dispose();
        edgesMat.dispose();
      },
    };
  });

  const disposeWireframe = createDemo(wireframeStage, (scene) => {
    const group = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.82, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x66aaff, roughness: 0.4, metalness: 0.08, transparent: true, opacity: 0.88 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    const wireframeGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);

    group.add(sphere, wireframe);
    scene.add(group);

    return {
      group,
      baseRotationX: 0.22,
      baseRotationY: 0.2,
      dispose: () => {
        sphereGeo.dispose();
        sphereMat.dispose();
        wireframeGeo.dispose();
        wireframeMat.dispose();
      },
    };
  });

  return () => {
    disposeEdges();
    disposeWireframe();
    container.innerHTML = '';
  };
}
