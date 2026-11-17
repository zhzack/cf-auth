export type UserRole = 'admin' | 'user' | 'readonly';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  allowedApps: string[];
}

export interface ManagedUser {
  id: string;
  username: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  allowed_apps: string;
  allowedAppsList: string[];
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface AppItem {
  id: string;
  name: string;
  description?: string;
  url: string;
  icon: string;
  badge?: string;
  sort_order: number;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  redirectUrl?: string;
  error?: string;
}
