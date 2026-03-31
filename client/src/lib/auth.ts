export function saveAuth(token: string, role: string, username: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("username", username);
}

export function getAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    return { token: null, role: null, username: null };
  }
  return {
    token,
    role: localStorage.getItem("role"),
    username: localStorage.getItem("username")
  };
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
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

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}