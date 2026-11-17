import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, UserSession } from './types';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';

const app = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

// 允许跨域（支持来自任意 *.b1uegrey.xyz 子域或本地调试前端的直接请求）
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API 子路由
const api = new Hono<{ Bindings: Env; Variables: { user: UserSession } }>();

api.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'cf-auth', time: new Date().toISOString() });
});

api.route('/auth', authRouter);
api.route('/admin', adminRouter);

// 挂载 /api 路由
app.route('/api', api);

// 托管前端静态资源 (Cloudflare Workers Assets)
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    const res = await c.env.ASSETS.fetch(c.req.raw);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const headers = new Headers(res.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return new Response(res.body, {
        status: res.status,
        headers,
      });
    }
    return res;
  }
  return c.text('Cloudflare Auth Hub (b1uegrey SSO) is running.', 200);
});

export default app;
