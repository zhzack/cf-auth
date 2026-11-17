# cf-auth · 统一身份与权限管理中心 (IAM Hub)

基于 **Cloudflare Workers + D1 (SQLite) + React 18 + Tailwind CSS** 构建的轻量级零成本统一单点登录与权限管理系统 (Identity and Access Management)。

专为个人及独立开发者的多子域名生态系统设计，实现全站所有服务（如 `book.b1uegrey.xyz`、`notes.b1uegrey.xyz` 等）**一套账号密码、跨子域免密单点登录 (SSO) 与细粒度应用权限矩阵 (RBAC)**。

---

## 🌟 核心特性

- 🚀 **零成本无服务器架构**：基于 Cloudflare Workers 免费配额（每日 100,000 次请求）与 Cloudflare D1 边缘数据库（免费 500 万次读/天）。
- 🔑 **跨子域免密单点登录**：颁发根域 Cookie（`Domain=.b1uegrey.xyz; Path=/; HttpOnly; Secure; SameSite=Lax`），用户在认证中心登录一次，全生态所有子项目即刻畅通无阻。
- 👥 **多用户与角色权限控制 (RBAC)**：
  - **角色体系**：`admin` (超级管理员) / `user` (普通成员) / `readonly` (只读访客)。
  - **账号生命周期管理**：管理员可在控制台随时新建账号、一键重置密码、修改昵称与备注。
  - **一键封禁与安全防护**：支持随时停用违规账号，全域即时生效无法登录。
- 🛡️ **应用接入与细粒度权限矩阵**：
  - 管理员可在认证中心随时登记新的生态子应用（如记账、知识库、网盘等）。
  - 精确配置每个账号允许访问的应用列表（`*` 全部通畅，或指定 `["book", "notes"]`）。
  - 子系统基于 JWT 内存极速验签（<1ms），无权访问直接拦截，零数据库负担。
- 🧭 **统一应用门户导航 (Launchpad)**：
  - 登录 `auth.b1uegrey.xyz` 后，以九宫格卡片展示当前账号有权限访问的系统，一键直达。
- 🔒 **银行级凭据安全**：基于 WebCrypto 原生 API，采用 **PBKDF2-HMAC-SHA256 (100,000 次迭代 + 独立真随机盐)** 算法，防彩虹表与硬件暴破。
- 🛡️ **防钓鱼开放重定向保护**：内置来源域名白名单校验机制，杜绝恶意钓鱼重定向。

---

## 📐 架构与 SSO 运作流程

```
[ 用户浏览器 ]
      │
      ├────────────────────── (1) 访问 https://book.b1uegrey.xyz/
      │                                    │
      │ ◄──── (2) 未登录：重定向至 auth ─────┤ (带上 ?redirect=https://book...)
      │
      ├────────────────────── (3) 访问 https://auth.b1uegrey.xyz/
      │                                    │
      │ ◄──── (4) 输入账号密码登录成功 ───────┤ (颁发 Set-Cookie: Domain=.b1uegrey.xyz)
      │
      ├────────────────────── (5) 自动跳回 https://book.b1uegrey.xyz/
      │                                    │ (浏览器自动附带 .b1uegrey.xyz 共享 Cookie)
      │ ◄──── (6) 业务子系统验签通过，免密进入 ──┤ (JIT 自动开通业务子账户)
```

---

## 🛠️ 项目结构

```
cf-auth/
├── d1/
│   └── schema.sql         # D1 数据库模式结构 (users 表与 apps 应用表)
├── server/
│   ├── index.ts           # Hono Worker 入口与静态资源分发
│   ├── types.ts           # 环境变量、用户角色会话与应用定义
│   ├── auth.ts            # PBKDF2 哈希、JWT 签发、Cookie Domain 与 RBAC 中间件
│   └── routes/
│       ├── auth.ts        # 认证基础路由: status, setup, login, logout, me, password
│       └── admin.ts       # 管理员路由: 用户列表、创建用户、重置密码、应用接入管理
├── src/
│   ├── App.tsx            # 前端路由调度 (安装向导 / 登录页 / 控制台)
│   ├── main.tsx           # React 18 入口
│   ├── api.ts             # 统一 API 请求封装
│   ├── types.ts           # 前端数据类型定义
│   └── components/
│       ├── LaunchpadTab.tsx       # 统一生态应用门户 (Launchpad)
│       ├── UserManagementTab.tsx  # 用户账号与权限矩阵管理
│       ├── AppManagementTab.tsx   # 生态应用接入与配置管理
│       ├── SecurityTab.tsx        # 个人密码与安全状态控制台
│       ├── LoginPage.tsx          # 统一登录页（带回跳业务来源指示）
│       └── SetupWizard.tsx        # 首次超级管理员安装向导
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 前端构建配置
└── wrangler.jsonc         # Cloudflare Workers 配置文件
```

---

## 🚀 本地开发与调试

```bash
# 1. 安装依赖
npm install

# 2. 初始化本地 D1 数据库
npx wrangler d1 execute cf_auth_db --local --file=./d1/schema.sql

# 3. 构建前端资源
npm run build

# 4. 启动本地全功能 Worker 服务
npx wrangler dev --port 8788 --ip 0.0.0.0
```

> **本地开发优化提示**：系统在 `127.0.0.1` 或 `localhost` 环境下会自动将 Cookie Domain 调整为当前主机，避免浏览器因跨域规则拒绝写入 Cookie。

---

## ☁️ Cloudflare 生产环境部署

```bash
# 1. 执行数据库结构变更（若已存在则自动保留现有数据）
npx wrangler d1 execute cf_auth_db --remote --file=./d1/schema.sql

# 2. 编译并部署 Worker
npm run deploy
```

已绑定的自定义域名：
👉 **https://auth.b1uegrey.xyz/**

---

## 🔗 子系统接入指南 (以任意新服务为例)

任何位于 `*.b1uegrey.xyz` 下的业务子系统（如 `book.b1uegrey.xyz`、`notes.b1uegrey.xyz`），只需两步即可无缝接入：

### 1. 统一环境变量配置 (`wrangler.jsonc`)
保证所有子系统的 `JWT_SECRET` 与 `cf-auth` 完全一致：
```jsonc
"vars": {
  "JWT_SECRET": "b1uegrey_shared_sso_secret_2026_xyz",
  "ROOT_DOMAIN": "b1uegrey.xyz",
  "AUTH_URL": "https://auth.b1uegrey.xyz"
}
```

### 2. 后端中间件验签与 RBAC 拦截
读取 `auth_token` Cookie 并通过 `verify(token, c.env.JWT_SECRET, 'HS256')` 解密：
```typescript
const payload = await verify(token, c.env.JWT_SECRET, 'HS256');

// 1. 拦截已封禁账号
if (payload.status === 'disabled') {
  return c.json({ error: '该账号已被禁用' }, 403);
}

// 2. 拦截未授权访问此应用的账号
if (Array.isArray(payload.apps)) {
  const isAllowed = payload.apps.includes('*') || payload.apps.includes('your_app_id');
  if (!isAllowed) {
    return c.json({ error: '您尚未获得访问此系统的权限' }, 403);
  }
}
```

### 3. 前端未登录自动回跳
前端检测到 401 未登录时，自动跳转到 SSO 认证中心：
```typescript
window.location.href = `https://auth.b1uegrey.xyz/?redirect=${encodeURIComponent(window.location.href)}`;
```

---

## 📄 授权许可
MIT License.
