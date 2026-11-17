import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { fetchApi } from './api';
import { User } from './types';
import { LoginPage } from './components/LoginPage';
import { SetupWizard } from './components/SetupWizard';
import { UserPortal } from './components/UserPortal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [needSetup, setNeedSetup] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // 获取 URL 中的 redirect 参数
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get('redirect') || '';

  const initAuth = async () => {
    try {
      setLoading(true);
      // 1. 检查系统是否初始化
      const statusRes = await fetchApi<{ needSetup: boolean; rootDomain: string }>('/api/auth/status');
      if (statusRes.needSetup) {
        setNeedSetup(true);
        setLoading(false);
        return;
      }

      setNeedSetup(false);

      // 2. 检查当前是否已登录
      try {
        const meRes = await fetchApi<{ user: User; token?: string }>('/api/auth/me');
        if (meRes.user) {
          setUser(meRes.user);

          // 如果已经登录且带有 redirect 参数，自动跳转回来源业务站点 (附带 sso_token 兜底)
          if (redirectUrl && redirectUrl !== window.location.href) {
            setRedirecting(true);
            setTimeout(() => {
              try {
                const targetObj = new URL(redirectUrl, window.location.origin);
                if (meRes.token) {
                  targetObj.searchParams.set('sso_token', meRes.token);
                }
                window.location.href = targetObj.toString();
              } catch {
                window.location.href = redirectUrl;
              }
            }, 300);
            return;
          }
        }
      } catch {
        // 未登录，正常展示登录界面
        setUser(null);
      }
    } catch (err) {
      console.error('初始化认证状态失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const handleAuthSuccess = (authedUser: User, targetUrl?: string, token?: string) => {
    const dest = targetUrl || redirectUrl;
    if (dest && dest !== window.location.href) {
      setRedirecting(true);
      try {
        const targetObj = new URL(dest, window.location.origin);
        if (token) {
          targetObj.searchParams.set('sso_token', token);
        }
        window.location.href = targetObj.toString();
      } catch {
        window.location.href = dest;
      }
    } else {
      setUser(authedUser);
      setNeedSetup(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            {redirecting ? (
              <ArrowRight className="w-7 h-7 animate-pulse text-indigo-600" />
            ) : (
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {redirecting ? '认证成功，正在跳转...' : '正在验证身份...'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {redirecting ? `即将进入 ${redirectUrl}` : 'b1uegrey 通行证 · 统一身份认证中心'}
          </p>
        </div>
      </div>
    );
  }

  // 1. 初始化向导
  if (needSetup) {
    return <SetupWizard redirectUrl={redirectUrl} onSuccess={handleAuthSuccess} />;
  }

  // 2. 已登录 - 用户控制台
  if (user) {
    return <UserPortal user={user} onLogout={handleLogout} />;
  }

  // 3. 未登录 - 登录页
  return <LoginPage redirectUrl={redirectUrl} onSuccess={handleAuthSuccess} />;
};

export default App;
