export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  COOKIE_DOMAIN?: string;
  ROOT_DOMAIN?: string;
  ASSETS?: Fetcher;
}

export type UserRole = 'admin' | 'user' | 'readonly';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  allowed_apps: string; // '*' 或 JSON 字符串 '["book"]'
  remark?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  username: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  allowedApps: string[];
}

export interface AppItem {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  icon: string;
  badge?: string | null;
  sort_order: number;
  created_at: string;
}
