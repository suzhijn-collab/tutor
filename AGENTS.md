# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 常用命令

- `npm run dev` — 启动开发服务器 (port 3000, host 0.0.0.0)
- `npm run build` — 生产构建 (Vite build)
- `npm run lint` — TypeScript 类型检查 (`tsc --noEmit`，无 ESLint)
- `npm run preview` — 预览生产构建

**无测试框架。** 不要尝试运行测试。

## 环境变量

在 `.env.local` 中设置 `GEMINI_API_KEY`（参考 `.env.example`）。Vite 通过 `loadEnv` 注入，代码中以 `process.env.GEMINI_API_KEY` 访问。Doubao API Key 当前硬编码在 `src/services/deepseek.ts` 和 `api/deepseek.js` 中（生产环境通过 Vercel serverless 转发时不需前端携带 Key）。`APP_URL` 由 AI Studio 运行时自动注入。

## 关键约定

- **`@` 路径别名指向项目根目录**（`tsconfig.json` paths: `@/*` → `./*`），不是 `src/`。导入示例：`import x from '@/src/pages/Home'`
- **Tailwind CSS v4**：配置在 `src/index.css` 的 `@theme` 块中，不存在 `tailwind.config.js`。自定义颜色使用 `--color-primary`、`--color-surface` 等 CSS 变量
- **motion 库**：从 `motion/react` 导入，不是 `framer-motion`
- **路由**：无 react-router，页面切换通过 `App.tsx` 中 `useState<Page>` 实现，页面类型为 `'home' | 'wrong-questions' | 'discussion' | 'help' | 'settings' | 'login' | 'profile' | 'chat'`
- **tsconfig**：启用 `experimentalDecorators` 和 `useDefineForClassFields: false`，target ES2022
- **图标**：统一使用 `lucide-react`

## 架构概览

React 19 + Vite 6 + Tailwind CSS v4 单页应用。面向高校学生的 AI 辅助学习平台，内置 4 个专业 AI Agent。

### 页面路由机制

`App.tsx` 使用 `useState<Page>` + `AnimatePresence` 实现页面切换动画。当 `currentPage === 'login'` 时直接渲染 `<Login />`（不显示侧边栏），登录成功后切换到 `'home'`。页面组件通过 `onNavigate: (page: Page) => void` prop 实现跨页面跳转。

**Agent 切换机制**：`App.tsx` 维护独立的 `activeAgent` state（类型 `'math' | 'python' | 'torch' | 'matrix'`），通过侧边栏点击同时设置 `currentPage='home'` 和 `activeAgent`。`Home` 组件接收 `activeAgent` prop 来展现对应 Agent 的对话界面。

### AI Agent 对话系统

- 4 个 Agent：`math`（高数酱）、`python`（Py酱）、`torch`（Torch君）、`matrix`（矩阵妹）
- `src/services/deepseek.ts`：封装豆包（Doubao）多模态模型 API 调用（`doubao-seed-2-0-mini-260428`），每个 Agent 配备独立 system prompt。支持纯文本对话和图片分析两种模式
- `src/pages/Home.tsx`：核心对话界面，按 `Record<AgentKey, Conversation[]>` 隔离各 Agent 对话历史，支持图片上传 + 多模态分析
- 使用 `useRef` 追踪最新 state 解决 React 批量更新的竞态问题
- 图片分析流程：`FileReader` 转 base64 → `analyzeImageWithDeepSeek()` 发送多模态请求 → 豆包原生 `input_image` 格式

### API 代理模式（豆包 Doubao）

- **开发环境**：Vite proxy 将 `/api/deepseek` 代理到 `https://ark.cn-beijing.volces.com`，rewrite 前缀为 `/api/v3`。请求体使用豆包 `input` 数组格式（`input_text` / `input_image` 类型）
- **生产环境**：`api/deepseek.js` 作为 Vercel serverless function 处理 POST 请求，转发到 `https://ark.cn-beijing.volces.com/api/v3/responses`
- `vercel.json` 配置 rewrite 规则将 `/api/deepseek/(.*)` 路由到 serverless handler
- 模型：`doubao-seed-2-0-mini-260428`，响应提取逻辑见 `extractResponseText()` — 优先取 `output[].type === 'message'` 的条目

### 数据持久化

全部使用 localStorage，各模块独立 key：
- **对话系统**：`tutor_conversations`（按 Agent 分区）、`tutor_active_ids`（活跃对话 ID）、`tutor_saved_to_wrong`（已保存到错题本标记）、`tutor_dismissed_actions`（已忽略操作）
- **错题本**：`tutor_wrong_questions`（`src/services/wrongQuestions.ts` 提供 CRUD）
- **讨论区**：`tutor_discussion_posts`（帖子 + 评论 + 点赞 + 置顶/已解决标记）
- **好友系统**：`tutor_friends`、`tutor_friend_requests`（好友列表 + 申请管理）
- **聊天消息**：`tutor_chat_messages`（按 `userA::userB` 排序 key 分区存储）
- **用户设置**：`tutor_user_settings`（昵称、头像、偏好 Agent 等）

### 内容渲染

`src/components/MessageContent.tsx` 使用 react-markdown + remark-math + rehype-katex 渲染 AI 回复。需预处理 LaTeX 分隔符：`\[...\]` → `$$...$$`，`\(...\)` → `$...$`。

### 样式系统

- Material Design 3 色彩体系通过 Tailwind `@theme` 定义（primary purple #6e3bd8, secondary pink #b5146e）
- 工具类：`.glass-panel`（毛玻璃）、`.soul-gradient`（紫色渐变）
- 字体：Inter / Plus Jakarta Sans + 中文宋体回退

### 讨论区系统

`src/services/discussionService.ts` 提供完整的论坛功能：发帖、评论、点赞（帖子 & 评论）、置顶/取消置顶、标记已解决/未解决、删除帖子。`src/pages/Discussion.tsx` 为讨论区 UI 页面。

### 好友 & 聊天系统

- `src/services/friendService.ts`：好友管理（添加/删除/申请/接受/拒绝），预设可选用户列表 `AVAILABLE_USERS`
- `src/services/chatService.ts`：好友间聊天消息存储，按对话双方生成唯一 chatKey
- `src/pages/Chat.tsx`：好友列表 + 聊天界面 + 好友申请通知

### 用户设置 & 个人中心

- `src/services/settingsService.ts`：统一管理用户偏好（昵称、头像、签名、偏好 Agent、复习时间、推送开关、深色模式开关、字号、邮箱）
- `src/pages/Settings.tsx`：设置编辑页面
- `src/pages/Profile.tsx`：用户个人中心展示页面
- `getUserDisplayName()` / `getUserAvatar()` 供全局组件获取当前用户身份
- `App.tsx` 通过 `useEffect` 监听 `currentPage` 变化，每次页面切换时重新读取昵称和头像（确保从设置页返回后即时刷新）

### 视频背景

`src/components/VideoBackground.tsx`：自适应多分辨率视频背景组件，根据设备性能（`navigator.hardwareConcurrency`）和网络状况（`effectiveType`）自动选择 8K/4K/2K/默认视频源。`src/config/videoConfig.ts` 配置具体视频路径。

### 部署

- 平台：Vercel + AI Studio (https://ai.studio)
- `vercel.json`：cleanUrls + API rewrite 规则
- `metadata.json`：AI Studio 应用元数据
- Serverless function：`api/deepseek.js` 配置 `bodyParser.sizeLimit: '10mb'` 支持大图片上传
- 依赖中的 `express`、`tsx` 仅用于 Vercel serverless 运行时，前端不直接使用
