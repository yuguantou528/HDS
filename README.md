# 应急指挥调度系统

基于Vue 3 + TypeScript + Vite + Element Plus的应急指挥调度系统。

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite 4
- Element Plus
- Vue Router 4
- Pinia
- ECharts

## 项目结构

```
src/
├── assets/        # 静态资源
│   └── images/    # 图片
├── components/    # 公共组件
│   ├── AppHeader.vue      # 顶部导航栏
│   ├── AppSidebar.vue     # 侧边菜单栏
│   └── AppBreadcrumb.vue  # 面包屑导航
├── views/         # 页面视图
│   ├── Home.vue           # 首页
│   └── Login.vue          # 登录页
├── store/         # 状态管理
│   └── auth.ts            # 认证状态
├── types/         # TypeScript类型定义
│   └── index.ts
├── styles/        # 全局样式
│   └── main.css
├── router/        # 路由配置
│   └── index.ts
├── App.vue        # 根组件
└── main.ts        # 应用入口
```

## 功能特性

- 响应式布局，适配不同屏幕尺寸
- 用户认证与授权系统
- 路由守卫，保护需要认证的页面
- 状态管理，使用Pinia管理应用状态
- Element Plus组件库集成，按需导入
- TypeScript类型支持，增强代码健壮性
- 首页数据可视化，使用ECharts图表展示数据
- 主题定制，使用CSS变量统一管理样式

## 页面功能

### 首页
- 顶部统计卡片：用户总数、访问量、文章数、系统消息
- 中部图表区域：访问统计图表、用户分布图表
- 底部表格区域：最近活动记录表格

### 登录页
- 左侧渐变背景区域
- 右侧登录表单区域
- 表单验证功能
- 验证码生成与验证
- 记住密码功能

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 浏览器兼容性

支持所有现代浏览器，如Chrome、Firefox、Edge、Safari等。

## 登录信息

- 用户名: admin
- 密码: 123456 # HDS
