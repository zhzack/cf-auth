import React, { useState } from 'react';
import { Lock, User as UserIcon, LogIn, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../api';
import { AuthResponse, User } from '../types';

interface Props {
  redirectUrl: string;
  onSuccess: (user: User, redirectUrl?: string) => void;
}

export const LoginPage: React.FC<Props> = ({ redirectUrl, onSuccess }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('last_sso_username') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 提取回跳目标域名展示给用户
  let targetHost = '';
  try {
    if (redirectUrl && redirectUrl !== '/') {
      targetHost = new URL(redirectUrl).hostname;
    }
  } catch {}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApi<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password,
          redirect: redirectUrl,
        }),
      });
      localStorage.setItem('last_sso_username', username.trim());
      onSuccess(data.user, data.redirectUrl);
    } catch (err: any) {
      setError(err.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-md border border-indigo-100 shadow-2xl rounded-3xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-indigo-200 text-white mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">b1uegrey 通行证</h1>
          <p className="text-xs text-slate-400 mt-1">统一身份认证 · 全域免密单点登录</p>
        </div>

        {/* 提示回跳子系统信息 */}
        {targetHost && (
          <div className="mb-4 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-2 text-xs text-indigo-700">
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">登录后将安全返回至：<strong className="font-semibold">{targetHost}</strong></span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">账号 (用户名)</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">密码</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? '正在验证并派发通行证...' : '登 录'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>一次登录，畅通所有 *.b1uegrey.xyz 站点</span>
        </div>
      </div>
    </div>
  );
};
