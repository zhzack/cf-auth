import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { Env, UserRole, UserSession, UserStatus, AppItem } from '../types';
import { 
  hashPassword, 
  verifyPassword, 
  createSessionToken, 
  requireAuth, 
  getEffectiveCookieDomain, 
  validateRedirectUrl,
  parseAllowedApps
} from '../auth';

export const authRouter = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

// 检查是否需要初次初始化设置管理员
authRouter.get('/status', async (c) => {
  try {
    const row = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
    return c.json({ needSetup: (row?.count || 0) === 0 });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 首次安装设置超级管理员账号
authRouter.post('/setup', async (c) => {
  const row = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  if ((row?.count || 0) > 0) {
    return c.json({ error: '系统已初始化，禁止重复设置' }, 400);
  }

  const { username, password, nickname, redirect } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: '密码长度至少为 6 位' }, 400);
  }

  const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { hash, salt } = await hashPassword(password);
  const finalNickname = nickname?.trim() || username;

  // 首个注册用户自动成为拥有全部权限的超级管理员
  await c.env.DB.prepare(
    'INSERT INTO users (id, username, password_hash, salt, nickname, role, status, allowed_apps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(userId, username.trim(), hash, salt, finalNickname, 'admin', 'active', '*').run();

  const sessionUser: UserSession = { 
    id: userId, 
    username: username.trim(), 
    nickname: finalNickname,
    role: 'admin',
    status: 'active',
    allowedApps: ['*'],
  };
  const token = await createSessionToken(sessionUser, c.env.JWT_SECRET);

  const isHttps = c.req.url.startsWith('https');
  const cookieDomain = getEffectiveCookieDomain(c);

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Lax',
    domain: cookieDomain,
    maxAge: 60 * 60 * 24 * 30, // 30天跨子域免密
    path: '/',
  });

  const redirectUrl = validateRedirectUrl(redirect, c.env.ROOT_DOMAIN);
  return c.json({ user: sessionUser, token, redirectUrl });
});

// 账号密码登录
authRouter.post('/login', async (c) => {
  const { username, password, redirect } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: '请输入用户名和密码' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, salt, nickname, role, status, allowed_apps FROM users WHERE username = ?'
  ).bind(username.trim()).first<{
    id: string;
    username: string;
    password_hash: string;
    salt: string;
    nickname: string;
    role: string | null;
    status: string | null;
    allowed_apps: string | null;
  }>();

  if (!user || !(await verifyPassword(password, user.password_hash, user.salt))) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  const status = (user.status as UserStatus) || 'active';
  if (status === 'disabled') {
    return c.json({ error: '该账号已被管理员禁用，请联系管理员开通' }, 403);
  }

  const role = (user.role as UserRole) || 'user';
  const allowedApps = parseAllowedApps(user.allowed_apps);

  const sessionUser: UserSession = { 
    id: user.id, 
    username: user.username, 
    nickname: user.nickname,
    role,
    status,
    allowedApps,
  };
  const token = await createSessionToken(sessionUser, c.env.JWT_SECRET);

  const isHttps = c.req.url.startsWith('https');
  const cookieDomain = getEffectiveCookieDomain(c);

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Lax',
    domain: cookieDomain,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  const redirectUrl = validateRedirectUrl(redirect, c.env.ROOT_DOMAIN);
  return c.json({ user: sessionUser, token, redirectUrl });
});

// 退出登录 (全域清除 Cookie)
authRouter.post('/logout', (c) => {
  const cookieDomain = getEffectiveCookieDomain(c);
  deleteCookie(c, 'auth_token', { domain: cookieDomain, path: '/' });
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ success: true });
});

// 获取当前用户信息及可见生态应用
authRouter.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  let token = getCookie(c, 'auth_token');
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  try {
    const { results: allApps } = await c.env.DB.prepare(
      'SELECT id, name, description, url, icon, badge, sort_order, created_at FROM apps ORDER BY sort_order ASC, created_at ASC'
    ).all<AppItem>();

    const isAll = user.role === 'admin' || user.allowedApps.includes('*');
    const accessibleApps = isAll
      ? (allApps || [])
      : (allApps || []).filter((a) => user.allowedApps.includes(a.id));

    return c.json({ 
      user, 
      token,
      apps: accessibleApps,
      allApps: user.role === 'admin' ? (allApps || []) : undefined 
    });
  } catch {
    return c.json({ user, apps: [] });
  }
});

// 修改密码 (个人中心自助)
authRouter.post('/password', requireAuth, async (c) => {
  const user = c.get('user');
  const { oldPassword, newPassword } = await c.req.json();

  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return c.json({ error: '新密码不能少于 6 位' }, 400);
  }

  const dbUser = await c.env.DB.prepare(
    'SELECT password_hash, salt FROM users WHERE id = ?'
  ).bind(user.id).first<{ password_hash: string; salt: string }>();

  if (!dbUser || !(await verifyPassword(oldPassword, dbUser.password_hash, dbUser.salt))) {
    return c.json({ error: '原密码错误' }, 400);
  }

  const { hash, salt } = await hashPassword(newPassword);
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(hash, salt, user.id).run();

  return c.json({ message: '密码修改成功' });
});
