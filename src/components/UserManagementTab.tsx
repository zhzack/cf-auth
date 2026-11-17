import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  KeyRound, 
  Trash2, 
  Search, 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Lock,
  User as UserIcon,
  Layers
} from 'lucide-react';
import { fetchApi } from '../api';
import { ManagedUser, AppItem, User, UserRole, UserStatus } from '../types';

interface Props {
  currentUser: User;
  allApps: AppItem[];
}

export const UserManagementTab: React.FC<Props> = ({ currentUser, allApps }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Modal 状态
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  // 表单状态
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('user');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formAllowedApps, setFormAllowedApps] = useState<string[]>(['*']);
  const [formRemark, setFormRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{ users: ManagedUser[] }>('/api/admin/users');
      setUsers(res.users || []);
    } catch (err: any) {
      setMsg({ text: err.message || '加载用户列表失败', isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 生成强随机密码
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pwd);
  };

  // 打开新建弹窗
  const openAddModal = () => {
    setFormUsername('');
    setFormPassword('');
    setFormNickname('');
    setFormRole('user');
    setFormStatus('active');
    setFormAllowedApps(['*']);
    setFormRemark('');
    generateRandomPassword();
    setIsAddModalOpen(true);
  };

  // 打开编辑弹窗
  const openEditModal = (u: ManagedUser) => {
    setEditingUser(u);
    setFormNickname(u.nickname || '');
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormAllowedApps(u.allowedAppsList || ['*']);
    setFormRemark(u.remark || '');
  };

  // 提交新建
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ text: '', isError: false });

    try {
      await fetchApi('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: formUsername,
          password: formPassword,
          nickname: formNickname,
          role: formRole,
          status: formStatus,
          allowedApps: formAllowedApps,
          remark: formRemark,
        }),
      });

      setMsg({ text: `账号 ${formUsername} 创建成功！`, isError: false });
      setIsAddModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setMsg({ text: err.message || '创建账号失败', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // 提交编辑
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setMsg({ text: '', isError: false });

    try {
      await fetchApi(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nickname: formNickname,
          role: formRole,
          status: formStatus,
          allowedApps: formAllowedApps,
          remark: formRemark,
        }),
      });

      setMsg({ text: `账号 ${editingUser.username} 配置已更新！`, isError: false });
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setMsg({ text: err.message || '更新账号失败', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // 提交重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser) return;
    setActionLoading(true);

    try {
      await fetchApi(`/api/admin/users/${resetPwdUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: formPassword }),
      });

      setMsg({ text: `用户 ${resetPwdUser.username} 的密码已重置成功！`, isError: false });
      setResetPwdUser(null);
    } catch (err: any) {
      setMsg({ text: err.message || '密码重置失败', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // 提交删除
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);

    try {
      await fetchApi(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' });
      setMsg({ text: `用户 ${deletingUser.username} 已成功注销删除！`, isError: false });
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      setMsg({ text: err.message || '删除用户失败', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // 切换允许的应用
  const toggleAppPermission = (appId: string) => {
    if (appId === '*') {
      setFormAllowedApps(['*']);
      return;
    }

    let next = formAllowedApps.filter((x) => x !== '*');
    if (next.includes(appId)) {
      next = next.filter((x) => x !== appId);
    } else {
      next.push(appId);
    }

    // 如果选了全部或没选任何
    if (next.length === 0) {
      setFormAllowedApps(['*']);
    } else {
      setFormAllowedApps(next);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.nickname && u.nickname.toLowerCase().includes(q)) ||
      (u.remark && u.remark.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* 提示消息 */}
      {msg.text && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-2.5 ${
            msg.isError
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ text: '', isError: false })}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 控制栏 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户名、昵称或备注..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            title="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            新建账号
          </button>
        </div>
      </div>

      {/* 用户列表表格 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">用户 / 昵称</th>
                <th className="py-3.5 px-4">角色</th>
                <th className="py-3.5 px-4">状态</th>
                <th className="py-3.5 px-4">授权应用矩阵</th>
                <th className="py-3.5 px-4">备注</th>
                <th className="py-3.5 px-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {loading ? '正在获取账号列表...' : '未找到匹配的账号'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isAll = u.allowedAppsList.includes('*');

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            {u.nickname?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{u.nickname || u.username}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                  我
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            👑 超级管理员
                          </span>
                        ) : u.role === 'readonly' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            只读访客
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            普通成员
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 正常
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 已封禁
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAll ? (
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            ⭐ 全生态应用通行
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.allowedAppsList.map((appKey) => {
                              const matchApp = allApps.find((a) => a.id === appKey);
                              return (
                                <span
                                  key={appKey}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                >
                                  {matchApp?.name || appKey}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-[150px] truncate">
                        {u.remark || '—'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="配置角色与应用权限"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setResetPwdUser(u);
                              generateRandomPassword();
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="重置登录密码"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="删除此账号"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= Modal: 新建账号 ======================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                新建生态通行证账号
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">用户名 (登录标识)</label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="如: zhangsan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">初始密码</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline"
                  >
                    🎲 随机生成强密码
                  </button>
                </div>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">显示昵称</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    placeholder="如: 张三"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">身份角色</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="user">普通成员 (User)</option>
                    <option value="readonly">只读访客 (Readonly)</option>
                    <option value="admin">超级管理员 (Admin)</option>
                  </select>
                </div>
              </div>

              {/* 授权应用勾选 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>授权访问的应用矩阵</span>
                  <button
                    type="button"
                    onClick={() => setFormAllowedApps(['*'])}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    一键设为全部通畅 (*)
                  </button>
                </label>
                <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAllowedApps.includes('*')}
                      onChange={() => toggleAppPermission('*')}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>⭐ 允许访问所有现有及未来新增子应用 (*)</span>
                  </label>

                  {!formAllowedApps.includes('*') &&
                    allApps.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formAllowedApps.includes(a.id)}
                          onChange={() => toggleAppPermission(a.id)}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{a.name} ({a.url})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">备注说明</label>
                <input
                  type="text"
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  placeholder="如: 家人、财务助理等"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? '正在创建...' : '确认开通账号'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= Modal: 编辑账号与权限 ======================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">编辑账号与权限配置</h3>
                <p className="text-xs text-slate-400 mt-0.5">账号: @{editingUser.username}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">显示昵称</label>
                <input
                  type="text"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">角色身份</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    disabled={editingUser.id === currentUser.id}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none disabled:opacity-50"
                  >
                    <option value="user">普通成员 (User)</option>
                    <option value="readonly">只读访客 (Readonly)</option>
                    <option value="admin">超级管理员 (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">账号状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    disabled={editingUser.id === currentUser.id}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none disabled:opacity-50"
                  >
                    <option value="active">正常通行 (Active)</option>
                    <option value="disabled">已封禁/禁止登录 (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* 授权应用列表 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>授权访问的应用矩阵</span>
                  <button
                    type="button"
                    onClick={() => setFormAllowedApps(['*'])}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    一键设为全部通畅 (*)
                  </button>
                </label>
                <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-36 overflow-y-auto">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAllowedApps.includes('*')}
                      onChange={() => toggleAppPermission('*')}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span>⭐ 允许访问所有子应用 (*)</span>
                  </label>

                  {!formAllowedApps.includes('*') &&
                    allApps.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formAllowedApps.includes(a.id)}
                          onChange={() => toggleAppPermission(a.id)}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span>{a.name} ({a.url})</span>
                      </label>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">备注说明</label>
                <input
                  type="text"
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? '正在保存...' : '保存配置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= Modal: 重置密码 ======================= */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                重置用户密码
              </h3>
              <button
                onClick={() => setResetPwdUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              正在为用户 <span className="font-bold text-slate-800">@{resetPwdUser.username}</span> 设置新登录密码：
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">新密码</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline"
                  >
                    🎲 随机生成
                  </button>
                </div>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-200 transition-all flex items-center gap-1.5"
                >
                  {actionLoading ? '正在重置...' : '确认重置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= Modal: 确认删除 ======================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">确认删除此账号？</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              确定要永久注销账号 <span className="font-bold text-slate-800">@{deletingUser.username}</span> 吗？该用户将立即失去所有子系统登录权限。
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all"
              >
                {actionLoading ? '正在删除...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
