import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Lock, User as UserIcon } from 'lucide-react';
import { fetchApi } from '../api';
import { AuthResponse, User } from '../types';

interface Props {
  redirectUrl: string;
  onSuccess: (user: User, redirectUrl?: string) => void;
}

export const SetupWizard: React.FC<Props> = ({ redirectUrl, onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [nickname, setNickname] = useState('管理员');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少需要 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchApi<AuthResponse>('/api/auth/setup', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          nickname: nickname.trim(),
          password,
          redirect: redirectUrl,
        }),
      });
      onSuccess(data.user, data.redirectUrl);
    } catch (err: any) {
      setError(err.message || '初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-indigo-100 shadow-2xl rounded-3xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200 text-white mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">b1uegrey 通行证初始化</h1>
          <p className="text-xs text-slate-500 mt-1">设置您的全局主管理员账号，一键管理全站服务</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">主管理员账号 (用户名)</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: admin"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">您的昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例如: 站长"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">主密码 (至少6位)</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">确认主密码</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? '正在初始化并签发凭据...' : '完成设置并开启全域通行'}</span>
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-400">
          账号安全存储在 Cloudflare D1 边缘数据库中，全站通用
        </p>
      </div>
    </div>
  );
};
