# 相机模块设计

**目标**

在现有 Three.js 示例站点中新增一个 `#/cameras` 相机模块，提供总览页和独立详情页。内容参考 three.js 官方 `cameras` 手册，覆盖透视相机、正交相机、双视口 + `CameraHelper` 观察，以及正交相机模拟 2D 坐标系的示例。

**范围**

- 新增相机总览页 `#/cameras`
- 新增 4 个详情页路由 `#/cameras/:id`
- 首页导航加入相机模块入口
- 总览页展示每个示例的简介、关键参数、代码片段和详情页入口
- 详情页提供更大的交互式场景，用于清晰讲解各类相机差异

**不做的内容**

- 不扩展到 `ArrayCamera`、`CubeCamera`、VR/XR 相机等更高级主题
- 不引入复杂 GUI 面板或大规模可调参数控制器
- 不在总览页复刻双视口这种高复杂度示例，只保留轻量预览或静态说明

**信息架构**

模块结构沿用现有 `materials`、`lights`、`textures` 模式：

- `src/components/cameras/cameras-data.js`
  - 定义相机示例目录数据
  - 提供 `cameraCatalog` 和 `getCameraById`
- `src/components/cameras/cameras-preview.js`
  - 负责总览页卡片的小型预览场景
- `src/pages/cameras.js`
  - 渲染总览页卡片列表
- `src/pages/camera-detail.js`
  - 根据 `cameraId` 挂载对应详情示例
- `src/main.js`
  - 注册 `#/cameras`
  - 解析 `#/cameras/:id` 动态详情路由

这样可以保证“文案与元数据”和“真实渲染逻辑”解耦，后续继续增加相机示例时不需要重写页面框架。

**页面设计**

总览页：

- 风格与现有总览页保持一致，使用卡片网格
- 每张卡片展示：
  - 相机名称
  - 中文标签
  - 核心差异说明
  - 一段关键代码
  - 进入详情页按钮
- 预览策略分层：
  - `PerspectiveCamera` 和 `OrthographicCamera` 使用轻量动态预览
  - `CameraHelper` 与 `Orthographic 2D` 使用更轻的静态或半动态预览，避免总览页渲染负担过重

详情页：

- 顶部保留返回相机总览入口
- 左右或上下布局展示：
  - 大型预览舞台
  - 当前示例的代码片段
  - 学习重点
  - 关键参数说明
  - 观察提示
- 找不到 `cameraId` 时提供和现有详情页一致的兜底状态

**示例清单**

1. `perspective`

- 主题：透视相机 `PerspectiveCamera`
- 教学目标：展示“离相机越远，看起来越小”的透视缩放效果
- 核心参数：`fov`、`aspect`、`near`、`far`
- 建议场景：多组沿深度方向排布的几何体，配合轻微旋转或相机环绕，让远近关系清楚可见

2. `orthographic`

- 主题：正交相机 `OrthographicCamera`
- 教学目标：展示“物体不会因为远近产生透视缩小”
- 核心参数：`left`、`right`、`top`、`bottom`、`near`、`far`、`zoom`
- 建议场景：与透视示例尽量使用同一类物体排布，方便直接对比

3. `camera-helper`

- 主题：双视口 + `CameraHelper`
- 教学目标：从一台观察相机的视角，看到另一台工作相机的拍摄范围
- 核心参数：被观察相机的 `fov`、`near`、`far`，以及 `CameraHelper` 的可视化作用
- 建议场景：
  - 左侧或上方视口显示最终拍摄结果
  - 右侧或下方视口显示外部观察视角
  - 在观察视角中绘制 `CameraHelper`

4. `orthographic-2d`

- 主题：正交相机模拟 2D 坐标系
- 教学目标：解释在 three.js 中如何用正交相机实现接近 2D 画布的布局思路
- 核心参数：相机边界与视口像素尺寸之间的映射关系
- 建议场景：
  - 使用 `PlaneGeometry` 或 sprite 排布几个 2D 元素
  - 说明左上角、中心点、边界位置的坐标含义
  - 在窗口尺寸变化时同步更新相机边界

**实现策略**

1. 数据驱动

- `cameraCatalog` 中统一管理 `id`、`name`、`label`、`summary`、`code`、`parameterNotes`、`observationHint`
- 总览页与详情页都读取同一份目录数据
- 这样能避免总览和详情两边文案漂移

2. 预览和详情分离

- 总览页预览以“低复杂度、易理解”为优先
- 详情页承担完整教学演示
- `camera-helper` 的双视口逻辑只放在详情页中，避免总览页多卡片情况下出现复杂多视口调度

3. 详情页挂载分发

- `mountCameraDetailPage` 读取 `cameraId`
- 先渲染统一的详情页框架
- 再通过 `switch` 或映射表调用不同的场景构建函数
- 每个场景构建函数返回自己的 `dispose`、`resize` 和 `render` 逻辑

4. 场景复用

- `perspective` 与 `orthographic` 尽量共享同一组基础物体和灯光
- 区别主要来自相机类型和参数配置
- 这样用户能更聚焦地比较“相机差异”，而不是被场景差异分散注意力

**交互与讲解策略**

- 默认自动播放轻微动画，让示例在打开时就能表达差异
- 避免把页面做成参数调试器；每页只保留必要的展示和说明
- 对 `orthographic-2d`，重点解释“这是用 3D 引擎模拟 2D 布局”，避免误导成 three.js 内建独立“2D 相机”类型

**错误处理**

- 未匹配到 `cameraId` 时显示未找到页面
- 如果 WebGL 初始化失败，沿用项目现有 viewer 错误提示风格
- 路由切换时统一释放 renderer、geometry、material、texture 和事件监听

**验证**

- 运行 `npm run build`
- 手工检查首页是否出现相机入口
- 手工检查 `#/cameras`
- 手工检查以下详情页是否可进入且能正确返回：
  - `#/cameras/perspective`
  - `#/cameras/orthographic`
  - `#/cameras/camera-helper`
  - `#/cameras/orthographic-2d`
- 手工检查透视与正交示例的视觉差异是否明显
- 手工检查双视口示例中 `CameraHelper` 是否与工作相机同步
- 手工检查窗口缩放时正交相机 2D 示例是否保持正确布局

**风险与控制**

- 风险：双视口 + `CameraHelper` 的渲染逻辑明显复杂于现有单相机场景
  - 控制：把复杂度限制在单独详情页，不扩散到总览页
- 风险：总览卡片里塞入过重的实时场景会拖慢页面
  - 控制：总览页只做轻量预览，复杂示例用说明卡片承接
- 风险：用户把“2D 相机”理解成 three.js 中独立的相机类型
  - 控制：所有文案统一写为“正交相机用于 2D 坐标系示例”
