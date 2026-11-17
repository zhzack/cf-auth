import React, { useState } from 'react';
import { Lock, ShieldCheck, Check, Sparkles, KeyRound, AlertCircle } from 'lucide-react';
import { fetchApi } from '../api';
import { User } from '../types';

interface Props {
  user: User;
}

export const SecurityTab: React.FC<Props> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    if (newPassword.length < 6) {
      setMsg({ text: '新密码不能少于 6 位', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: '两次输入的新密码不一致', isError: true });
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setMsg({ text: '主通行证密码修改成功！所有子系统登录凭证已自动同步。', isError: false });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ text: err.message || '修改失败', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* 修改密码表单 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">修改主通行证密码</h3>
            <p className="text-xs text-slate-400 mt-0.5">修改后，在整个 b1uegrey.xyz 生态系统中的所有子系统均同步生效</p>
          </div>
        </div>

        {msg.text && (
          <div
            className={`mb-5 p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              msg.isError
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {msg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">当前原密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入当前正在使用的密码"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 位安全密码"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? '正在更新中...' : '确认更新密码'}
          </button>
        </form>
      </div>

      {/* 身份与安全规范卡片 */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          当前账号安全配置状态
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-400 block mb-0.5">账号全局 ID</span>
            <span className="font-mono text-slate-800 font-semibold">{user.id}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-400 block mb-0.5">登录角色身份</span>
            <span className="font-semibold text-slate-800">
              {user.role === 'admin' ? '👑 超级管理员 (Admin)' : user.role === 'readonly' ? '👀 访客只读 (Readonly)' : '👤 普通成员 (User)'}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-400 block mb-0.5">凭据加密策略</span>
            <span className="font-semibold text-slate-800">PBKDF2-HMAC-SHA256 (100,000次)</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-slate-400 block mb-0.5">单点登录作用域</span>
            <span className="font-mono text-indigo-600 font-semibold">.b1uegrey.xyz (跨所有子域)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
