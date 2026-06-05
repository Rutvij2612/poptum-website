type UserCountry = "India" | "Germany";

export const AUTH_CHANGE_EVENT = "poptum-auth-change";

function notifyAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

export function saveAuth(token: string, role: string, username: string, country?: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("username", username);
  if (country) {
    localStorage.setItem("country", country);
  }
  notifyAuthChange();
}

export function getAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    return { token: null, role: null, username: null, country: null };
  }
  return {
    token,
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username"),
    country: localStorage.getItem("country") as UserCountry | null,
  };
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  localStorage.removeItem("country");
  notifyAuthChange();
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function getUsername() {
  return localStorage.getItem("username");
}

export function getCountry() {
  return localStorage.getItem("country");
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
