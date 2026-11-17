# cf-auth · 接口文档 (API Reference)

本文档详细描述 `cf-auth` 统一身份认证中心的所有 RESTful API 接口规格与数据结构。

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
- **说明**：用于前端判断当前是否为首次部署，需要引导用户进入管理员安装向导。
- **响应示例**：
```json
{
  "needSetup": false
}
```

---

## 2. 核心认证与会话接口

### 2.1 首次安装初始化管理员

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
    "nickname": "BlueGrey"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "redirectUrl": "https://book.b1uegrey.xyz/"
}
```
- **响应标头 (Set-Cookie)**：
  - `auth_token=<JWT>; Domain=.b1uegrey.xyz; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`

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
  - `redirect` (string, 选填): 登录成功后的回跳目标 URL（经过白名单安全过滤，若为恶意外部地址则自动回退至 `/`）
- **响应示例 (200 OK)**：
```json
{
  "user": {
    "id": "usr_0aa1ec00e3c64231",
    "username": "admin",
    "nickname": "BlueGrey"
  },
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "redirectUrl": "https://book.b1uegrey.xyz/dashboard"
}
```
- **错误响应**：
  - `400 Bad Request`: `{"error": "请输入用户名和密码"}`
  - `401 Unauthorized`: `{"error": "用户名或密码错误"}`

---

### 2.3 获取当前会话用户信息

- **接口地址**：`GET /api/auth/me`
- **鉴权要求**：需要携带有效 Cookie `auth_token` 或 `Authorization: Bearer <token>`
- **响应示例 (200 OK)**：
```json
{
  "user": {
    "id": "usr_0aa1ec00e3c64231",
    "username": "admin",
    "nickname": "BlueGrey"
  }
}
```
- **未登录响应 (401 Unauthorized)**：
```json
{
  "error": "未登录，请先登录"
}
```

---

### 2.4 全域退出登录

- **接口地址**：`POST /api/auth/logout`
- **鉴权要求**：公开访问
- **说明**：向客户端下发过期指令，同时清除 `.b1uegrey.xyz` 全域及当前子域下的 `auth_token` Cookie。
- **响应示例 (200 OK)**：
```json
{
  "success": true
}
```

---

### 2.5 修改密码

- **接口地址**：`POST /api/auth/password`
- **鉴权要求**：已登录
- **请求体 (JSON)**：
```json
{
  "oldPassword": "old_secure_password",
  "newPassword": "new_secure_password_123"
}
```
- **响应示例 (200 OK)**：
```json
{
  "message": "密码修改成功"
}
```
- **错误响应**：
  - `400 Bad Request`: `{"error": "新密码不能少于 6 位"}` 或 `{"error": "原密码错误"}`

---

## 3. JWT 载荷 (Claims) 规范

SSO 体系中，`auth_token` 的 JWT 载荷规范如下：

```json
{
  "sub": "usr_0aa1ec00e3c64231",
  "username": "admin",
  "nickname": "BlueGrey",
  "exp": 1797489323,
  "iat": 1765953323
}
```

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `sub` | string | 全局唯一用户 ID（在所有子系统中作为统一关联外键） |
| `username` | string | 用户名（用于界面显示及业务归属） |
| `nickname` | string | 用户昵称 |
| `exp` | number | 过期时间戳（默认 30 天） |
| `iat` | number | 签发时间戳 |

---

## 4. 安全机制

1. **防钓鱼开放重定向过滤**：
   - 系统仅允许回跳到相对路径（`/xxx`）或经允许的白名单根域名（`b1uegrey.xyz`、`*.b1uegrey.xyz`、`localhost`、`127.0.0.1`）。
   - 任何其他外部链接（如 `https://attacker.com`）会被强制修正为 `/`。
2. **凭据安全存储**：
   - 使用 WebCrypto PBKDF2 (100,000 次哈希迭代 + 16 字节真随机 Salt)。
   - 数据库中不保存明文密码，即使数据库文件泄露也无法通过常规手段破解。
3. **Cookie 安全策略**：
   - `HttpOnly`: 防止 XSS 脚本窃取 Token。
   - `Secure`: 仅在 HTTPS 安全通道传输（本地开发环境自适应兼容 HTTP）。
   - `SameSite=Lax`: 有效抵御 CSRF 跨站请求伪造攻击。
