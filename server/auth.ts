import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { Env, UserSession } from './types';

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

// 签发跨子域通用的 JWT
export async function createSessionToken(user: UserSession, secret: string): Promise<string> {
  const payload = {
    sub: user.id,
    username: user.username,
    nickname: user.nickname,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30天有效
  };
  return await sign(payload, secret, 'HS256');
}

// 获取生效的 Cookie Domain
// 关键优化：本地开发时（如 127.0.0.1 或 localhost）返回 undefined，生产域名返回 .b1uegrey.xyz
export function getEffectiveCookieDomain(c: Context<{ Bindings: Env }>): string | undefined {
  const host = c.req.header('host')?.split(':')[0] || '';
  // 如果是本地IP或localhost，不指定 domain，由浏览器自动作用于当前 host
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return undefined;
  }
  const rootDomain = c.env.ROOT_DOMAIN || 'b1uegrey.xyz';
  if (host === rootDomain || host.endsWith('.' + rootDomain)) {
    return c.env.COOKIE_DOMAIN || '.' + rootDomain;
  }
  return undefined;
}

// 安全验证回跳地址，防止恶意重定向
export function validateRedirectUrl(redirectUrl: string | undefined | null, rootDomain: string = 'b1uegrey.xyz'): string {
  if (!redirectUrl || !redirectUrl.trim()) return '/';

  const clean = redirectUrl.trim();
  // 相对路径安全回跳
  if (clean.startsWith('/') && !clean.startsWith('//')) {
    return clean;
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname;
    // 允许的主机列表：b1uegrey.xyz, *.b1uegrey.xyz, localhost, 127.0.0.1
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

// 鉴权中间件
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

    c.set('user', {
      id: payload.sub as string,
      username: (payload.username as string) || '',
      nickname: (payload.nickname as string) || '',
    });

    await next();
  } catch (err: any) {
    return c.json({ error: '登录凭证已过期，请重新登录' }, 401);
  }
}
