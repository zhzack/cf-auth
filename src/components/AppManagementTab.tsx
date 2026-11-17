import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Globe, 
  Wallet, 
  BookOpen, 
  Database, 
  HardDrive, 
  Cpu, 
  Zap,
  X, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { fetchApi } from '../api';
import { AppItem } from '../types';

interface Props {
  apps: AppItem[];
  onRefresh: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'Zap', label: '网关/触发器', icon: Zap },
  { id: 'Wallet', label: '财务/钱包', icon: Wallet },
  { id: 'BookOpen', label: '阅读/知识库', icon: BookOpen },
  { id: 'Database', label: '数据管理', icon: Database },
  { id: 'HardDrive', label: '云盘/存储', icon: HardDrive },
  { id: 'Cpu', label: '系统/监控', icon: Cpu },
  { id: 'Layers', label: '聚合/矩阵', icon: Layers },
  { id: 'Globe', label: '网络/通用', icon: Globe },
];

export const AppManagementTab: React.FC<Props> = ({ apps, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppItem | null>(null);
  const [deletingApp, setDeletingApp] = useState<AppItem | null>(null);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('Globe');
  const [formBadge, setFormBadge] = useState('');
  const [formSort, setFormSort] = useState(10);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const openAddModal = () => {
    setFormId('');
    setFormName('');
    setFormDescription('');
    setFormUrl('https://');
    setFormIcon('Globe');
    setFormBadge('');
    setFormSort(apps.length * 10 + 10);
    setIsAddModalOpen(true);
  };

  const openEditModal = (app: AppItem) => {
    setEditingApp(app);
    setFormName(app.name);
    setFormDescription(app.description || '');
    setFormUrl(app.url);
    setFormIcon(app.icon || 'Globe');
    setFormBadge(app.badge || '');
    setFormSort(app.sort_order || 10);
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', isError: false });

    try {
      await fetchApi('/api/admin/apps', {
        method: 'POST',
        body: JSON.stringify({
          id: formId,
          name: formName,
          description: formDescription,
          url: formUrl,
          icon: formIcon,
          badge: formBadge,
          sort_order: formSort,
        }),
      });

      setMsg({ text: `生态应用 "${formName}" 接入成功！`, isError: false });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || '接入失败', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    setLoading(true);

    try {
      await fetchApi(`/api/admin/apps/${editingApp.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          url: formUrl,
          icon: formIcon,
          badge: formBadge,
          sort_order: formSort,
        }),
      });

      setMsg({ text: `应用 "${formName}" 配置已更新！`, isError: false });
      setEditingApp(null);
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || '更新失败', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async () => {
    if (!deletingApp) return;
    setLoading(true);

    try {
      await fetchApi(`/api/admin/apps/${deletingApp.id}`, { method: 'DELETE' });
      setMsg({ text: `应用 "${deletingApp.name}" 已成功移除！`, isError: false });
      setDeletingApp(null);
      onRefresh();
    } catch (err: any) {
      setMsg({ text: err.message || '移除失败', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const item = AVAILABLE_ICONS.find((i) => i.id.toLowerCase() === iconName.toLowerCase());
    const IconComp = item?.icon || Globe;
    return <IconComp className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
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
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">已接入的生态子系统</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            在此登记所有部署在 *.b1uegrey.xyz 域下的业务子系统，供应用导航台与权限矩阵调度。
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          接入新应用
        </button>
      </div>

      {/* 应用列表卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((app) => {
          const isCore = app.id === 'book';

          return (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      {renderIcon(app.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{app.name}</h4>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          {app.id}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-indigo-600 truncate block max-w-[200px]">
                        {app.url}
                      </span>
                    </div>
                  </div>

                  {app.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {app.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {app.description || '无详细描述'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  测试直达 <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(app)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="编辑应用信息"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {!isCore && (
                    <button
                      onClick={() => setDeletingApp(app)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="删除应用接入"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================= Modal: 接入新应用 ======================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                接入新的生态子系统
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">应用唯一标识</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="如: notes, disk"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">显示名称</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="如: 个人知识库"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">访问入口 URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="如: https://notes.b1uegrey.xyz"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">功能描述</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="如: Markdown 笔记、代码片段与文档归档"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">系统图标</label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label} ({i.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">状态角标 (选填)</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="如: Beta, v1.0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
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
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all"
                >
                  {loading ? '正在接入...' : '确认接入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= Modal: 编辑应用 ======================= */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">编辑应用配置</h3>
                <p className="text-xs text-slate-400 mt-0.5">应用标识: {editingApp.id}</p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateApp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">应用名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">访问入口 URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">功能描述</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">系统图标</label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">状态角标</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all"
                >
                  {loading ? '正在保存...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= Modal: 确认删除 ======================= */}
      {deletingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">确认解除应用接入？</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              确定要将 <span className="font-bold text-slate-800">{deletingApp.name}</span> 从生态矩阵中移除吗？
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDeletingApp(null)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDeleteApp}
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all"
              >
                {loading ? '正在解除...' : '确认解除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
