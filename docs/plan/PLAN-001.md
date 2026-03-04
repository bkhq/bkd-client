# PLAN-001 搭建 Expo + WebView 客户端应用

- **status**: completed
- **createdAt**: 2026-03-04 01:10
- **approvedAt**: 2026-03-04 01:30
- **relatedTask**: FEAT-001

## 现状

空仓库，无任何代码。需要从零搭建 Expo 项目。

## 需求确认

| 项目 | 决定 |
|------|------|
| 地址格式 | `https://ai.fr.ds.cc` 类 URL |
| 地址验证 | HTTP 探测，任何 HTTP 状态码均算成功，仅连接失败算失败 |
| 持久化 | expo-sqlite，支持多服务器增删改 |
| 首页 | Logo + 服务器列表（空时显示添加引导） |
| WebView | 沉浸式全屏，内部处理所有链接，加载状态+失败重试 |
| 设置入口 | WebView 页面顶部按钮，下拉显示（可切换/管理服务器） |
| 刷新按钮 | WebView 页面顶部刷新按钮，点击重新加载当前页面 |
| 平台 | Android + iOS，EAS + GitHub Actions |
| App | 名称 `BitK`，ID `io.bk.bitk`，EAS Project ID `5a903f10-5f45-481d-ac8d-29b1cff59222` |
| 测试 | Jest 单元/组件测试 + E2E |

## 方案

### 技术栈

- **Expo SDK 55** (managed workflow + dev build)
- **react-native-webview** — WebView 核心
- **expo-sqlite** — SQLite 持久化存储
- **expo-router** — 页面路由（首页 / WebView 页）
- **Jest + @testing-library/react-native** — 单元 & 组件测试
- **Maestro** — E2E 测试（Expo 官方推荐）

### 目录结构

```
bitk-client/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # 首页（服务器列表）
│   └── webview.tsx          # WebView 全屏页面
├── components/
│   ├── ServerList.tsx       # 服务器列表组件
│   ├── ServerForm.tsx       # 添加/编辑服务器表单（Modal）
│   ├── EmptyState.tsx       # 空状态引导
│   ├── WebViewScreen.tsx    # WebView + 加载/错误状态
│   └── DropdownMenu.tsx     # 顶部下拉菜单（设置）
├── hooks/
│   ├── useServers.ts        # 服务器 CRUD + 持久化
│   └── useServerProbe.ts    # HTTP 探测
├── utils/
│   ├── database.ts          # expo-sqlite 封装
│   └── probe.ts             # HTTP 连接检测
├── constants/
│   └── index.ts             # App 常量
├── assets/
│   └── logo.png             # BitK Logo
├── __tests__/               # 测试文件
│   ├── utils/
│   │   ├── database.test.ts
│   │   └── probe.test.ts
│   ├── hooks/
│   │   ├── useServers.test.ts
│   │   └── useServerProbe.test.ts
│   └── components/
│       ├── ServerList.test.tsx
│       ├── ServerForm.test.tsx
│       ├── EmptyState.test.tsx
│       └── WebViewScreen.test.tsx
├── e2e/                     # Maestro E2E flows
│   ├── add-server.yaml
│   ├── edit-server.yaml
│   ├── delete-server.yaml
│   └── open-webview.yaml
├── app.json
├── package.json
├── tsconfig.json
├── eas.json
└── .github/
    └── workflows/
        └── build.yml        # EAS Build via GitHub Actions
```

### 核心模块设计

#### 1. 数据模型

```typescript
interface Server {
  id: string;          // uuid
  name: string;        // 显示名称（可选，默认用 URL）
  url: string;         // https://ai.fr.ds.cc
  createdAt: number;   // timestamp
}
```

#### 2. database.ts — SQLite 持久化层

```typescript
initDatabase(): void                          // 建表（IF NOT EXISTS）
getServers(): Server[]                        // SELECT * FROM servers
addServer(url: string, name?: string): Server // INSERT
updateServer(id: string, updates): Server     // UPDATE
removeServer(id: string): void                // DELETE
```

#### 3. probe.ts — HTTP 探测

```typescript
probeServer(url: string): Promise<{ ok: boolean; status?: number; error?: string }>
// fetch HEAD 请求，任何 HTTP 状态码 = ok:true，连接失败 = ok:false
```

#### 4. useServers hook — CRUD

```typescript
useServers(): {
  servers: Server[];
  loading: boolean;
  addServer(url: string, name?: string): Promise<void>;
  updateServer(id: string, updates: Partial<Server>): Promise<void>;
  removeServer(id: string): Promise<void>;
}
```

#### 5. 页面流程

```
首页 (index.tsx)
  ├── 无服务器 → EmptyState → 点击添加 → ServerForm Modal
  ├── 有服务器 → ServerList → 点击某项 → 探测 → webview.tsx
  └── 长按/滑动 → 编辑/删除

WebView 页面 (webview.tsx)
  ├── 沉浸式全屏 WebView
  ├── 顶部工具栏：刷新按钮 + 设置按钮 → DropdownMenu（切换服务器/返回首页）
  ├── 加载中 → ActivityIndicator 覆盖层
  └── 加载失败 → 错误提示 + 重试按钮
```

### TDD 实施顺序

| 阶段 | 测试目标 | 实现目标 |
|------|----------|----------|
| 1 | `database.test.ts` | `database.ts` — SQLite CRUD |
| 2 | `probe.test.ts` | `probe.ts` — HTTP 探测逻辑 |
| 3 | `useServers.test.ts` | `useServers.ts` — hook 逻辑 |
| 4 | `EmptyState.test.tsx` | `EmptyState.tsx` — 空状态渲染 |
| 5 | `ServerForm.test.tsx` | `ServerForm.tsx` — 表单交互 |
| 6 | `ServerList.test.tsx` | `ServerList.test.tsx` — 列表渲染+操作 |
| 7 | `WebViewScreen.test.tsx` | `WebViewScreen.tsx` — 加载/错误状态 |
| 8 | 页面集成 | `index.tsx` + `webview.tsx` |
| 9 | EAS + CI | `eas.json` + GitHub Actions |
| 10 | E2E | Maestro flows |

## 风险

1. **react-native-webview 需要 dev build** — 不能用 Expo Go，必须 `npx expo prebuild` 或 EAS
2. **沉浸式全屏 + 顶部下拉菜单** — 需要处理 StatusBar 和安全区域（SafeAreaView）
3. **HTTP 探测跨域** — React Native 原生 fetch 无 CORS 限制，无风险

## 工作量

- 阶段 1-3（utils + hooks）：基础层
- 阶段 4-7（components）：UI 层
- 阶段 8（pages）：集成
- 阶段 9-10（CI + E2E）：部署层

## 备选方案

无。Expo + WebView 是用户明确的技术选型。

## 批注

- 2026-03-04: 用户审批通过，开始实施
