// Token management utility for auth flow
// Stores JWT tokens in localStorage for client-side access and cookies for middleware

const ACCESS_TOKEN_KEY = "wbs_access_token";
const REFRESH_TOKEN_KEY = "wbs_refresh_token";
const TOKEN_EXPIRY_KEY = "wbs_token_expiry";

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  if (typeof window === "undefined") return;

  // Calculate expiry timestamp (current time + expiresIn seconds)
  const expiryTimestamp = Date.now() + (expiresIn * 1000);

  // Store in localStorage for client-side access
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());

  // Store in cookies for middleware access
  // Use the actual expiresIn from the API response instead of hardcoded values
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
  // Refresh token typically lasts longer (7 days default)
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

export function getTokenExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  // Add a 30-second buffer to account for network latency
  return Date.now() >= (expiry - 30000);
}

export function getTimeUntilExpiry(): number | null {
  const expiry = getTokenExpiry();
  if (!expiry) return null;
  return Math.max(0, expiry - Date.now());
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;

  // Clear from localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);

  // Clear from cookies
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !isTokenExpired();
}
