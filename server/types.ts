export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  COOKIE_DOMAIN?: string;
  ROOT_DOMAIN?: string;
  ASSETS?: Fetcher;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  nickname: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  username: string;
  nickname: string;
}
