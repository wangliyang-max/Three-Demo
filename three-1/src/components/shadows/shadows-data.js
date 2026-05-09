export const shadowCatalog = [
  {
    id: 'fake-bouncing-balls',
    name: 'Fake Shadows',
    label: '弹跳球假阴影',
    summary: '用一张透明圆形阴影贴片跟随弹跳球变化，不依赖真实灯光阴影，性能成本最低。',
    learningFocus: '先理解“阴影也可以是视觉假象”：球越高，地面贴片越淡、越大，用户就会自然感知到高度变化。',
    observationHint: '重点看球体上升时阴影透明度降低、面积略微变大；球体落地时阴影重新变深。',
    code: `const shadowMaterial = new THREE.MeshBasicMaterial({\n  map: shadowTexture,\n  transparent: true,\n  depthWrite: false,\n});\n\nshadowMesh.rotation.x = -Math.PI / 2;\nshadowMaterial.opacity = THREE.MathUtils.lerp(0.55, 0.16, bounce);`,
    parameterNotes: [
      { name: 'transparent', description: '假阴影贴图需要透明通道，圆形暗部之外保持不可见。' },
      { name: 'depthWrite: false', description: '避免半透明阴影贴片把深度写入缓冲，减少与地面或其他透明物体的排序问题。' },
      { name: 'opacity / scale', description: '根据球体高度动态改变透明度和大小，能模拟阴影离物体越远越淡的感觉。' },
    ],
    usageNotes: ['移动端或大量小物体场景优先考虑。', '不需要灯光开启 castShadow。', '适合球、角色脚底、道具接地感等“看起来像阴影”的场景。'],
  },
  {
    id: 'directional-shadow-camera',
    name: 'DirectionalLight Shadow Camera',
    label: '方向光阴影相机',
    summary: '方向光使用一个正交阴影相机决定哪些区域参与阴影贴图计算，CameraHelper 只是把这个范围画出来。',
    learningFocus: '阴影是否完整、是否清晰，很大程度取决于 light.shadow.camera 的覆盖范围，而不是主相机能不能看到。',
    observationHint: '观察橙色线框盒子：盒子里面的物体会参与阴影计算，范围太大时阴影清晰度会下降。',
    code: `light.castShadow = true;\nlight.shadow.camera.left = -5;\nlight.shadow.camera.right = 5;\nlight.shadow.camera.top = 5;\nlight.shadow.camera.bottom = -5;\nlight.shadow.camera.updateProjectionMatrix();\n\nconst helper = new THREE.CameraHelper(light.shadow.camera);`,
    parameterNotes: [
      { name: 'light.shadow.camera', description: '真正的阴影相机。方向光内部使用 OrthographicCamera 来生成阴影贴图。' },
      { name: 'CameraHelper', description: '辅助显示阴影相机范围，本身不是阴影相机。调试完成后通常可以移除。' },
      { name: 'left / right / top / bottom', description: '控制阴影相机的正交盒子大小，越贴合有效区域，阴影像素利用率越高。' },
    ],
    usageNotes: ['适合太阳光、主方向光。', '范围要尽量小但覆盖投影物体和接收面。', '修改相机参数后需要 updateProjectionMatrix()。'],
  },
  {
    id: 'shadow-map-size',
    name: 'Shadow Map Size',
    label: '阴影贴图分辨率',
    summary: '阴影贴图是一张从灯光视角生成的深度纹理，分辨率越高阴影越清晰，但显存和渲染成本也越高。',
    learningFocus: '阴影变糊时不要只会调大 mapSize，应该先检查阴影相机范围是不是过大。',
    observationHint: '看地面上方块投影边缘：贴图分辨率越低，边缘越容易显得像素化。',
    code: `light.shadow.mapSize.width = 1024;\nlight.shadow.mapSize.height = 1024;\n\n// 先缩小 shadow.camera 范围，\n// 再按需要提高 mapSize。`,
    parameterNotes: [
      { name: 'mapSize.width / height', description: '阴影贴图尺寸。常见值有 512、1024、2048，但不能无限增大。' },
      { name: '像素密度', description: '同一张贴图覆盖范围越大，单位地面分到的阴影像素越少。' },
      { name: '性能成本', description: '更大的阴影贴图会占用更多显存，并增加阴影渲染开销。' },
    ],
    usageNotes: ['先调阴影相机范围，再调 mapSize。', '移动端谨慎使用 2048 以上尺寸。', '不要给所有灯光都设置高分辨率阴影。'],
  },
  {
    id: 'spot-point-cost',
    name: 'SpotLight / PointLight Shadows',
    label: '聚光灯与点光源成本',
    summary: '聚光灯适合局部投影，点光源能向四周投影但成本最高，因为它需要从多个方向生成阴影。',
    learningFocus: '不同灯光的阴影不是同样便宜：PointLight 阴影通常比 DirectionalLight 和 SpotLight 更昂贵。',
    observationHint: '看灯泡周围的墙面和地面阴影关系，点光源像一个向四周发光的小灯泡。',
    code: `const spot = new THREE.SpotLight(0xffffff, 3);\nspot.castShadow = true;\n\nconst point = new THREE.PointLight(0xffffff, 2);\npoint.castShadow = true; // 成本更高，谨慎使用`,
    parameterNotes: [
      { name: 'SpotLight', description: '使用透视阴影相机，适合手电筒、舞台追光、台灯这类锥形照明。' },
      { name: 'PointLight', description: '向六个方向生成阴影，视觉直观但渲染成本更高。' },
      { name: 'castShadow 数量', description: '开启阴影的灯光越多，场景需要额外渲染的次数越多。' },
    ],
    usageNotes: ['聚光灯适合局部重点照明。', '点光源阴影只给关键灯具使用。', '能用假阴影或烘焙贴图替代时优先替代。'],
  },
];

export function getShadowById(id) {
  return shadowCatalog.find((item) => item.id === id);
}
