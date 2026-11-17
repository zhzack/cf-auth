# cf-auth · 统一身份认证中心 (SSO Hub)

基于 **Cloudflare Workers + D1 (SQLite) + React 18 + Tailwind CSS** 构建的轻量级零成本统一单点登录与账号管理系统。

专为个人及独立开发者的多子域名生态系统设计，实现全站所有服务（如 `book.b1uegrey.xyz`、`notes.b1uegrey.xyz` 等）**一套账号密码、跨子域免密单点登录 (Single Sign-On, SSO)**。

---

## 🌟 核心特性

- 🚀 **零成本无服务器架构**：基于 Cloudflare Workers 免费配额（每日 100,000 次请求）与 Cloudflare D1 边缘数据库（免费 500 万次读/天）。
- 🔑 **跨子域免密单点登录**：颁发根域 Cookie（`Domain=.b1uegrey.xyz; Path=/; HttpOnly; Secure; SameSite=Lax`），用户在认证中心登录一次，全生态所有子项目即刻畅通无阻。
- ⚡ **无锁化极速验签 (<1ms)**：业务子应用无需跨库查询用户表，只需在 Worker 内存中比对共享 JWT 密钥即可完成无状态鉴权，极大减轻数据库压力。
- 🛡️ **生产级密码安全**：基于 WebCrypto 原生 API，采用 **PBKDF2-HMAC-SHA256 (100,000 次迭代 + 独立随机盐)** 算法，防彩虹表与硬件暴破。
- 🔒 **防钓鱼开放重定向保护**：内置来源域名白名单校验机制，杜绝恶意钓鱼重定向攻击。
- 🎨 **现代响应式用户控制台**：包含初次管理员极简安装向导、SSO 登录页（智能识别回跳来源）、账号安全控制台（修改密码、应用快捷导航）及全域一键登出。

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
│   └── schema.sql         # D1 数据库模式结构 (users 表)
├── server/
│   ├── index.ts           # Hono Worker 入口与静态资源分发
│   ├── types.ts           # 环境变量与用户会话接口
│   ├── auth.ts            # PBKDF2 哈希、JWT 签发、动态 Cookie Domain 与重定向安全
│   └── routes/
│       └── auth.ts        # 认证路由: status, setup, login, logout, me, password
├── src/
│   ├── App.tsx            # 前端路由调度 (安装向导 / 登录页 / 控制台)
│   ├── main.tsx           # React 18 入口
│   ├── api.ts             # 统一 API 请求封装
│   ├── types.ts           # 前端数据类型定义
│   └── components/
│       ├── LoginPage.tsx   # 统一登录页（带回跳业务来源指示）
│       ├── SetupWizard.tsx # 首次管理员安装向导
│       └── UserPortal.tsx  # 统一用户账号控制台与生态导航
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

## ☁️ Cloudflare 生产环境部署指南

### 第一步：创建 Cloudflare D1 数据库

```bash
npx wrangler d1 create cf_auth_db
```
执行后会输出类似如下内容：
```
[[d1_databases]]
binding = "DB"
database_name = "cf_auth_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 第二步：更新 `wrangler.jsonc`

将上面获得的实际 `database_id` 替换至 `cf-auth/wrangler.jsonc` 中的 `database_id`。

### 第三步：初始化线上数据库表结构

```bash
npx wrangler d1 execute cf_auth_db --remote --file=./d1/schema.sql
```

### 第四步：部署上线并绑定独立域名

```bash
npm run deploy
```

部署完成后，在 Cloudflare Dashboard：
1. 进入 **Workers & Pages** -> **cf-auth** -> **Settings** -> **Domains & Routes**。
2. 添加自定义域名：`auth.b1uegrey.xyz`。

---

## 🔗 子系统接入指南 (以任意新服务为例)

任何位于 `*.b1uegrey.xyz` 下的业务子系统（如 `book.b1uegrey.xyz`），只需两步即可无缝接入：

### 1. 统一环境变量配置 (`wrangler.jsonc`)
保证所有子系统的 `JWT_SECRET` 与 `cf-auth` 完全一致：
```jsonc
"vars": {
  "JWT_SECRET": "b1uegrey_shared_sso_secret_2026_xyz",
  "ROOT_DOMAIN": "b1uegrey.xyz",
  "AUTH_URL": "https://auth.b1uegrey.xyz"
}
```

### 2. 后端中间件验签
读取 `auth_token` Cookie 并通过 `verify(token, c.env.JWT_SECRET, 'HS256')` 解密即可直接获取用户身份：
```typescript
const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
// payload.sub = 用户唯一 ID
// payload.username = 用户名
// payload.nickname = 昵称
```

### 3. 前端未登录自动回跳
前端检测到 401 未登录时，自动跳转到 SSO 认证中心：
```typescript
window.location.href = `https://auth.b1uegrey.xyz/?redirect=${encodeURIComponent(window.location.href)}`;
```

---

## 📄 授权许可
MIT License.
