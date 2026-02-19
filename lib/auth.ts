// Token management utility for auth flow
// Stores JWT tokens in localStorage for client-side access and cookies for middleware

const ACCESS_TOKEN_KEY = "wbs_access_token";
const REFRESH_TOKEN_KEY = "wbs_refresh_token";

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  
  // Store in localStorage for client-side access
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // Store in cookies for middleware access
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  
  // Clear from localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  // Clear from cookies
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
