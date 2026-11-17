import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { Env, UserRole, UserSession, UserStatus } from './types';

// PBKDF2 密码哈希 (利用 WebCrypto API)
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const finalSalt = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash, salt: finalSalt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

// 解析允许访问的应用列表
export function parseAllowedApps(allowedAppsStr: string | null | undefined): string[] {
  if (!allowedAppsStr || allowedAppsStr === '*') return ['*'];
  try {
    const parsed = JSON.parse(allowedAppsStr);
    return Array.isArray(parsed) ? parsed : ['*'];
  } catch {
    return allowedAppsStr.split(',').map((s) => s.trim()).filter(Boolean);
  }
}

// 签发跨子域通用的 JWT (包含角色与权限列表)
export async function createSessionToken(user: UserSession, secret: string): Promise<string> {
  const payload = {
    sub: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role,
    status: user.status,
    apps: user.allowedApps,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30天有效
  };
  return await sign(payload, secret, 'HS256');
}

// 获取生效的 Cookie Domain
export function getEffectiveCookieDomain(c: Context<{ Bindings: Env }>): string | undefined {
  const host = c.req.header('host')?.split(':')[0] || '';
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return undefined;
  }
  const rootDomain = c.env.ROOT_DOMAIN || 'b1uegrey.xyz';
  if (host === rootDomain || host.endsWith('.' + rootDomain)) {
    return c.env.COOKIE_DOMAIN || '.' + rootDomain;
  }
  return undefined;
}

// 安全验证回跳地址
export function validateRedirectUrl(redirectUrl: string | undefined | null, rootDomain: string = 'b1uegrey.xyz'): string {
  if (!redirectUrl || !redirectUrl.trim()) return '/';

  const clean = redirectUrl.trim();
  if (clean.startsWith('/') && !clean.startsWith('//')) {
    return clean;
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname;
    if (
      host === rootDomain ||
      host.endsWith('.' + rootDomain) ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return clean;
    }
  } catch {}

  return '/';
}

// 登录认证中间件
export async function requireAuth(c: Context<{ Bindings: Env; Variables: { user: UserSession } }>, next: Next) {
  let token = getCookie(c, 'auth_token');

  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return c.json({ error: '未登录，请先登录' }, 401);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (!payload || !payload.sub) {
      return c.json({ error: '登录凭证无效或已过期' }, 401);
    }

    const status = (payload.status as UserStatus) || 'active';
    if (status === 'disabled') {
      return c.json({ error: '账号已被管理员禁用，请联系管理员' }, 403);
    }

    c.set('user', {
      id: payload.sub as string,
      username: (payload.username as string) || '',
      nickname: (payload.nickname as string) || '',
      role: (payload.role as UserRole) || 'user',
      status,
      allowedApps: Array.isArray(payload.apps) ? (payload.apps as string[]) : ['*'],
    });

    await next();
  } catch (err: any) {
    return c.json({ error: '登录凭证已过期，请重新登录' }, 401);
  }
}

// 超级管理员权限中间件
export async function requireAdmin(c: Context<{ Bindings: Env; Variables: { user: UserSession } }>, next: Next) {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ error: '权限不足，仅超级管理员可执行此操作' }, 403);
  }
  await next();
}
