export interface User {
  id: string;
  username: string;
  nickname: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  redirectUrl?: string;
  error?: string;
}
