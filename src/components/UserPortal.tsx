import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutGrid, 
  Users, 
  Layers, 
  Lock, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { fetchApi } from '../api';
import { User, AppItem } from '../types';
import { LaunchpadTab } from './LaunchpadTab';
import { UserManagementTab } from './UserManagementTab';
import { AppManagementTab } from './AppManagementTab';
import { SecurityTab } from './SecurityTab';

interface Props {
  user: User;
  onLogout: () => void;
}

export const UserPortal: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'launchpad' | 'users' | 'apps' | 'security'>('launchpad');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [allApps, setAllApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载可见应用及全部应用配置
  const loadAppData = async () => {
    try {
      const res = await fetchApi<{ user: User; apps: AppItem[]; allApps?: AppItem[] }>('/api/auth/me');
      setApps(res.apps || []);
      setAllApps(res.allApps || res.apps || []);
    } catch (err) {
      console.error('加载生态数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } catch {}
    onLogout();
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12">
      {/* 顶部主导航栏 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & 品牌名 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                  b1uegrey 通行证
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                  统一认证与权限中心
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                auth.b1uegrey.xyz
              </span>
            </div>
          </div>

          {/* 用户信息与退出登录 */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">{user.nickname || user.username}</span>
              <span className="text-[10px] font-medium text-slate-400">
                {isAdmin ? '👑 超级管理员' : user.role === 'readonly' ? '只读访客' : '普通成员'}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user.nickname?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="全域退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 导航 Tab 栏 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('launchpad')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'launchpad'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            应用门户
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                用户与权限矩阵
              </button>

              <button
                onClick={() => setActiveTab('apps')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'apps'
                    ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                应用接入管理
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-50 text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            个人安全
          </button>
        </div>
      </header>

      {/* 页面内容区域 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'launchpad' && <LaunchpadTab user={user} apps={apps} />}
        {activeTab === 'users' && isAdmin && (
          <UserManagementTab currentUser={user} allApps={allApps} />
        )}
        {activeTab === 'apps' && isAdmin && (
          <AppManagementTab apps={allApps} onRefresh={loadAppData} />
        )}
        {activeTab === 'security' && <SecurityTab user={user} />}
      </main>
    </div>
  );
};
