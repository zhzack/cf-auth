# cf-auth · 接口文档 (API Reference)

本文档详细描述 `cf-auth` 统一身份认证与权限管理中心 (IAM Hub) 的所有 RESTful API 接口规格与数据结构。

所有 API 均以 `/api` 为统一前缀，采用 JSON 格式传输数据，跨域请求携带 Cookie 凭证（`credentials: include`）。

---

## 1. 系统与状态接口

### 1.1 健康检查

- **接口地址**：`GET /api/health`
- **鉴权要求**：公开访问
- **响应示例**：
```json
{
  "status": "ok",
  "service": "cf-auth",
  "time": "2026-11-17T06:35:16.154Z"
}
```

### 1.2 检查系统初始化状态

- **接口地址**：`GET /api/auth/status`
- **鉴权要求**：公开访问
- **响应示例**：
```json
{
  "needSetup": false
}
```

---

## 2. 核心认证与会话接口

### 2.1 首次安装初始化超级管理员

- **接口地址**：`POST /api/auth/setup`
- **鉴权要求**：仅允许数据库中无用户时调用（重复调用返回 400）
- **请求体 (JSON)**：
```json
{
  "username": "admin",
  "password": "your_secure_password",
  "nickname": "BlueGrey",
  "redirect": "https://book.b1uegrey.xyz/"
}
```
- **响应示例 (200 OK)**：
```json
{
  "user": {
    "id": "usr_0aa1ec00e3c64231",
    "username": "admin",
    "nickname": "BlueGrey",
    "role": "admin",
    "status": "active",
    "allowedApps": ["*"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "redirectUrl": "https://book.b1uegrey.xyz/"
}
```

---

### 2.2 统一账号密码登录

- **接口地址**：`POST /api/auth/login`
- **鉴权要求**：公开访问
- **请求体 (JSON)**：
```json
{
  "username": "admin",
  "password": "your_secure_password",
  "redirect": "https://book.b1uegrey.xyz/dashboard"
}
```
- **字段说明**：
  - `username` (string, 必填): 用户名
  - `password` (string, 必填): 密码
  - `redirect` (string, 选填): 登录成功后的回跳目标 URL（经白名单过滤）
- **响应示例 (200 OK)**：
```json
{
  "user": {
    "id": "usr_0aa1ec00e3c64231",
    "username": "admin",
    "nickname": "BlueGrey",
    "role": "admin",
    "status": "active",
    "allowedApps": ["*"]
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "redirectUrl": "https://book.b1uegrey.xyz/dashboard"
}
```
- **错误响应**：
  - `401 Unauthorized`: `{"error": "用户名或密码错误"}`
  - `403 Forbidden`: `{"error": "该账号已被管理员禁用，请联系管理员开通"}`

---

### 2.3 获取当前会话用户信息与可见应用

- **接口地址**：`GET /api/auth/me`
- **鉴权要求**：需登录
- **响应示例 (200 OK)**：
```json
{
  "user": {
    "id": "usr_0aa1ec00e3c64231",
    "username": "admin",
    "nickname": "BlueGrey",
    "role": "admin",
    "status": "active",
    "allowedApps": ["*"]
  },
  "apps": [
    {
      "id": "book",
      "name": "个人记账与大件资产",
      "description": "个人全维度财务收支与大件消费品日均成本折旧管理",
      "url": "https://book.b1uegrey.xyz",
      "icon": "Wallet",
      "badge": "核心应用",
      "sort_order": 1
    }
  ]
}
```

---

### 2.4 全域退出登录

- **接口地址**：`POST /api/auth/logout`
- **鉴权要求**：公开访问
- **说明**：向客户端下发过期指令，同时清除 `.b1uegrey.xyz` 根域 Cookie。

---

### 2.5 个人修改密码

- **接口地址**：`POST /api/auth/password`
- **鉴权要求**：需登录
- **请求体 (JSON)**：
```json
{
  "oldPassword": "old_secure_password",
  "newPassword": "new_secure_password_123"
}
```

---

## 3. 管理员用户与权限管理接口 (Admin Users API)

> **鉴权要求**：必须已登录且 `role === 'admin'`，否则返回 `403 Forbidden`。

### 3.1 获取所有用户列表

- **接口地址**：`GET /api/admin/users`
- **响应示例**：
```json
{
  "users": [
    {
      "id": "usr_31f1444f07b94242",
      "username": "b1uegrey",
      "nickname": "b1uegrey",
      "role": "admin",
      "status": "active",
      "allowed_apps": "*",
      "allowedAppsList": ["*"],
      "remark": "超级管理员",
      "created_at": "2026-11-17 07:15:45",
      "updated_at": "2026-11-17 07:15:45"
    }
  ]
}
```

### 3.2 创建新用户

- **接口地址**：`POST /api/admin/users`
- **请求体 (JSON)**：
```json
{
  "username": "family_member",
  "password": "initial_password_123",
  "nickname": "家庭成员",
  "role": "user",
  "status": "active",
  "allowedApps": ["book"],
  "remark": "仅允许记账"
}
```

### 3.3 编辑用户与权限

- **接口地址**：`PUT /api/admin/users/:id`
- **请求体 (JSON)**：
```json
{
  "nickname": "新昵称",
  "role": "user",
  "status": "active",
  "allowedApps": ["book", "notes"],
  "remark": "已开通笔记权限"
}
```

### 3.4 管理员重置指定用户密码

- **接口地址**：`POST /api/admin/users/:id/reset-password`
- **请求体 (JSON)**：
```json
{
  "newPassword": "new_secure_password_888"
}
```

### 3.5 注销删除用户

- **接口地址**：`DELETE /api/admin/users/:id`
- **说明**：管理员不可删除自己。

---

## 4. 管理员生态应用管理接口 (Admin Apps API)

> **鉴权要求**：必须已登录且 `role === 'admin'`。

### 4.1 获取所有登记应用

- **接口地址**：`GET /api/admin/apps`

### 4.2 接入登记新应用

- **接口地址**：`POST /api/admin/apps`
- **请求体 (JSON)**：
```json
{
  "id": "notes",
  "name": "个人知识库",
  "description": "私有 Markdown 笔记与代码归档",
  "url": "https://notes.b1uegrey.xyz",
  "icon": "BookOpen",
  "badge": "v1.0",
  "sort_order": 20
}
```

### 4.3 编辑应用信息

- **接口地址**：`PUT /api/admin/apps/:id`

### 4.4 移除应用接入

- **接口地址**：`DELETE /api/admin/apps/:id`（核心应用 `book` 禁止删除）

---

## 5. JWT 载荷 (Claims) 与 RBAC 验签规范

跨子域 SSO Token 包含角色与应用权限矩阵：

```json
{
  "sub": "usr_31f1444f07b94242",
  "username": "b1uegrey",
  "nickname": "b1uegrey",
  "role": "admin",
  "status": "active",
  "apps": ["*"],
  "exp": 1797491823
}
```

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `sub` | string | 全局唯一用户 ID |
| `username` | string | 账号名 |
| `nickname` | string | 显示昵称 |
| `role` | string | 角色：`admin` (超管) \| `user` (成员) \| `readonly` (访客) |
| `status` | string | 账号状态：`active` (正常) \| `disabled` (已封禁) |
| `apps` | string[] | 允许访问的应用标识数组，`["*"]` 为全通，或 `["book"]` 细粒度控制 |
| `exp` | number | 过期时间戳（默认 30 天） |

### 业务子系统轻量拦截规则（<1ms 内存执行）：
```typescript
if (payload.status === 'disabled') {
  return c.json({ error: '该账号已被禁用' }, 403);
}
if (Array.isArray(payload.apps)) {
  const isAllowed = payload.apps.includes('*') || payload.apps.includes(APP_ID);
  if (!isAllowed) {
    return c.json({ error: '无权访问此应用，请联系管理员分配权限' }, 403);
  }
}
```
