import React, { useState } from 'react';
import { User, Lock, LogOut, ExternalLink, ShieldCheck, Sparkles, Check, Wallet, Globe } from 'lucide-react';
import { fetchApi } from '../api';

interface Props {
  user: User;
  onLogout: () => void;
}

export const UserPortal: React.FC<Props> = ({ user, onLogout }) => {
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
      setMsg({ text: '主密码修改成功！所有子系统已同步更新。', isError: false });
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg space-y-4">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200">
              {user.nickname?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800">{user.nickname || user.username}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  全域已认证
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">主账号: @{user.username} · b1uegrey.xyz 通行证</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition text-xs flex items-center gap-1"
            title="退出全域登录"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>

        {/* 快捷进入已接入的子应用 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>已接入的子应用 (已免密授权)</span>
          </h2>

          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <a
              href="https://book.b1uegrey.xyz/"
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-indigo-50/40 hover:border-indigo-100 flex items-center justify-between group transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                    小记 (云端轻记账 & 持物资产)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">https://book.b1uegrey.xyz</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
                <span>免密进入</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </div>

        {/* 修改全局密码 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>修改全局密码</span>
          </h2>
          <p className="text-[11px] text-slate-400">修改后，所有接入 b1uegrey 通行证的子系统将同步生效。</p>

          {msg.text && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                msg.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              {msg.isError ? '⚠️' : '✓'} {msg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">原主密码</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">新密码</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">确认新密码</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white rounded-xl text-xs font-semibold transition disabled:opacity-60"
            >
              {loading ? '正在更新主密码...' : '确认更新全域主密码'}
            </button>
          </form>
        </div>

        {/* 底部全域注销按钮 */}
        <button
          onClick={onLogout}
          className="w-full py-3 bg-red-50 hover:bg-red-100 active:scale-[0.99] text-red-600 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>退出 b1uegrey 通行证登录状态</span>
        </button>
      </div>
    </div>
  );
};
