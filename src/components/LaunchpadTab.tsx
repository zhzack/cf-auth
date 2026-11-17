import React from 'react';
import { ExternalLink, Sparkles, Globe, Wallet, BookOpen, Layers, ShieldCheck, Database, HardDrive, Cpu } from 'lucide-react';
import { AppItem, User } from '../types';

interface Props {
  user: User;
  apps: AppItem[];
}

export const LaunchpadTab: React.FC<Props> = ({ user, apps }) => {
  // 动态匹配图标
  const renderIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'wallet':
        return <Wallet className="w-6 h-6 text-indigo-600" />;
      case 'bookopen':
      case 'book':
        return <BookOpen className="w-6 h-6 text-emerald-600" />;
      case 'database':
        return <Database className="w-6 h-6 text-amber-600" />;
      case 'harddrive':
        return <HardDrive className="w-6 h-6 text-purple-600" />;
      case 'cpu':
        return <Cpu className="w-6 h-6 text-rose-600" />;
      case 'layers':
        return <Layers className="w-6 h-6 text-blue-600" />;
      default:
        return <Globe className="w-6 h-6 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部引导标语 */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100 rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              欢迎回到 b1uegrey 统一通行证生态
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              已激活跨子域免密单点登录（SSO），点击下方任一应用卡片即可直接进入，无需重复输入账号密码。
            </p>
          </div>
        </div>
      </div>

      {/* 应用卡片列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            授权接入的应用矩阵 ({apps.length})
          </h3>
          <span className="text-xs text-slate-400">
            {user.role === 'admin' ? '拥有全站最高调度权限' : '已按账号权限自动过滤'}
          </span>
        </div>

        {apps.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600">暂无可访问的应用</p>
            <p className="text-xs text-slate-400 mt-1">请联系超级管理员在权限控制中心为您开通应用访问权限。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-100 group-hover:border-indigo-100 flex items-center justify-center transition-colors">
                      {renderIcon(app.icon)}
                    </div>
                    {app.badge && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {app.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mt-3 group-hover:text-indigo-600 transition-colors">
                    {app.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {app.description || '生态子系统'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <span className="truncate max-w-[200px] text-[11px] font-mono text-slate-400">
                    {app.url}
                  </span>
                  <span className="flex items-center gap-1">
                    直达系统 <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
