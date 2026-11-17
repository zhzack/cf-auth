import { Hono } from 'hono';
import { Env, UserRole, UserSession, UserStatus, AppItem } from '../types';
import { hashPassword, parseAllowedApps, requireAdmin, requireAuth } from '../auth';

export const adminRouter = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

// 所有管理接口必须经过登录认证与管理员权限双重校验
adminRouter.use('*', requireAuth, requireAdmin);

// ====================== 1. 用户账号管理 (User Management) ======================

// 获取所有用户列表
adminRouter.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, username, nickname, role, status, allowed_apps, remark, created_at, updated_at 
       FROM users 
       ORDER BY created_at ASC`
    ).all<{
      id: string;
      username: string;
      nickname: string;
      role: string;
      status: string;
      allowed_apps: string;
      remark: string | null;
      created_at: string;
      updated_at: string;
    }>();

    const formatted = (results || []).map((u) => ({
      ...u,
      role: (u.role as UserRole) || 'user',
      status: (u.status as UserStatus) || 'active',
      allowedAppsList: parseAllowedApps(u.allowed_apps),
    }));

    return c.json({ users: formatted });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 创建新账号
adminRouter.post('/users', async (c) => {
  const { username, password, nickname, role, status, allowedApps, remark } = await c.req.json();

  if (!username || !username.trim()) {
    return c.json({ error: '用户名不能为空' }, 400);
  }
  if (!password || password.length < 6) {
    return c.json({ error: '密码长度至少为 6 位' }, 400);
  }

  const cleanUsername = username.trim();
  // 检查用户名是否已存在
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(cleanUsername)
    .first();
  if (existing) {
    return c.json({ error: '该用户名已存在，请换一个' }, 400);
  }

  const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const { hash, salt } = await hashPassword(password);
  const finalNickname = nickname?.trim() || cleanUsername;
  const finalRole: UserRole = ['admin', 'user', 'readonly'].includes(role) ? role : 'user';
  const finalStatus: UserStatus = status === 'disabled' ? 'disabled' : 'active';

  let finalAllowedApps = '*';
  if (Array.isArray(allowedApps)) {
    finalAllowedApps = allowedApps.includes('*') ? '*' : JSON.stringify(allowedApps);
  } else if (typeof allowedApps === 'string' && allowedApps.trim()) {
    finalAllowedApps = allowedApps.trim();
  }

  await c.env.DB.prepare(
    `INSERT INTO users (id, username, password_hash, salt, nickname, role, status, allowed_apps, remark) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    cleanUsername,
    hash,
    salt,
    finalNickname,
    finalRole,
    finalStatus,
    finalAllowedApps,
    remark?.trim() || ''
  ).run();

  return c.json({
    message: '创建账号成功',
    user: {
      id: userId,
      username: cleanUsername,
      nickname: finalNickname,
      role: finalRole,
      status: finalStatus,
      allowedAppsList: parseAllowedApps(finalAllowedApps),
      remark: remark?.trim() || '',
    },
  });
});

// 编辑用户信息与权限配置
adminRouter.put('/users/:id', async (c) => {
  const targetId = c.req.param('id');
  const currentUser = c.get('user');
  const { nickname, role, status, allowedApps, remark } = await c.req.json();

  const user = await c.env.DB.prepare('SELECT id, role, status FROM users WHERE id = ?')
    .bind(targetId)
    .first<{ id: string; role: string; status: string }>();

  if (!user) {
    return c.json({ error: '用户不存在' }, 404);
  }

  // 安全防线：管理员不能禁用或降级自己
  if (targetId === currentUser.id) {
    if (status === 'disabled') {
      return c.json({ error: '不能禁用当前登录的管理员账号' }, 400);
    }
    if (role && role !== 'admin') {
      return c.json({ error: '不能降级当前登录的管理员账号' }, 400);
    }
  }

  const finalNickname = nickname?.trim();
  const finalRole: UserRole = ['admin', 'user', 'readonly'].includes(role) ? role : (user.role as UserRole);
  const finalStatus: UserStatus = ['active', 'disabled'].includes(status) ? status : (user.status as UserStatus);

  let finalAllowedApps: string | undefined = undefined;
  if (Array.isArray(allowedApps)) {
    finalAllowedApps = allowedApps.includes('*') ? '*' : JSON.stringify(allowedApps);
  } else if (typeof allowedApps === 'string') {
    finalAllowedApps = allowedApps.trim();
  }

  await c.env.DB.prepare(
    `UPDATE users 
     SET nickname = COALESCE(?, nickname),
         role = COALESCE(?, role),
         status = COALESCE(?, status),
         allowed_apps = COALESCE(?, allowed_apps),
         remark = COALESCE(?, remark),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    finalNickname || null,
    finalRole,
    finalStatus,
    finalAllowedApps ?? null,
    remark !== undefined ? remark.trim() : null,
    targetId
  ).run();

  return c.json({ message: '更新账号成功' });
});

// 重置指定用户密码
adminRouter.post('/users/:id/reset-password', async (c) => {
  const targetId = c.req.param('id');
  const { newPassword } = await c.req.json();

  if (!newPassword || newPassword.length < 6) {
    return c.json({ error: '新密码长度至少为 6 位' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?')
    .bind(targetId)
    .first();
  if (!user) {
    return c.json({ error: '用户不存在' }, 404);
  }

  const { hash, salt } = await hashPassword(newPassword);
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(hash, salt, targetId).run();

  return c.json({ message: '密码重置成功' });
});

// 删除指定账号
adminRouter.delete('/users/:id', async (c) => {
  const targetId = c.req.param('id');
  const currentUser = c.get('user');

  if (targetId === currentUser.id) {
    return c.json({ error: '不能删除当前登录的管理员账号' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();
  return c.json({ message: '删除账号成功' });
});

// ====================== 2. 生态应用管理 (App Ecosystem) ======================

// 获取所有登记应用列表
adminRouter.get('/apps', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, description, url, icon, badge, sort_order, created_at FROM apps ORDER BY sort_order ASC, created_at ASC'
    ).all<AppItem>();

    return c.json({ apps: results || [] });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 注册新生态子应用
adminRouter.post('/apps', async (c) => {
  const { id, name, description, url, icon, badge, sort_order } = await c.req.json();

  if (!id || !/^[a-z0-9_-]{2,20}$/.test(id.trim())) {
    return c.json({ error: '应用标识必须为 2-20 位小写字母、数字或横杠 (例如 notes, book)' }, 400);
  }
  if (!name || !name.trim()) {
    return c.json({ error: '应用名称不能为空' }, 400);
  }
  if (!url || !url.trim().startsWith('http')) {
    return c.json({ error: '请输入有效的应用访问 URL' }, 400);
  }

  const cleanId = id.trim();
  const existing = await c.env.DB.prepare('SELECT id FROM apps WHERE id = ?').bind(cleanId).first();
  if (existing) {
    return c.json({ error: '该应用标识已存在' }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO apps (id, name, description, url, icon, badge, sort_order) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    cleanId,
    name.trim(),
    description?.trim() || '',
    url.trim(),
    icon?.trim() || 'Globe',
    badge?.trim() || '',
    Number(sort_order) || 10
  ).run();

  return c.json({ message: '添加应用成功' });
});

// 修改应用信息
adminRouter.put('/apps/:id', async (c) => {
  const appId = c.req.param('id');
  const { name, description, url, icon, badge, sort_order } = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE apps 
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         url = COALESCE(?, url),
         icon = COALESCE(?, icon),
         badge = COALESCE(?, badge),
         sort_order = COALESCE(?, sort_order)
     WHERE id = ?`
  ).bind(
    name?.trim() || null,
    description !== undefined ? description.trim() : null,
    url?.trim() || null,
    icon?.trim() || null,
    badge !== undefined ? badge.trim() : null,
    sort_order !== undefined ? Number(sort_order) : null,
    appId
  ).run();

  return c.json({ message: '更新应用成功' });
});

// 删除应用登记
adminRouter.delete('/apps/:id', async (c) => {
  const appId = c.req.param('id');
  if (appId === 'book') {
    return c.json({ error: '核心应用不可删除' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM apps WHERE id = ?').bind(appId).run();
  return c.json({ message: '删除应用成功' });
});
