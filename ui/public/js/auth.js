async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('dira_token');
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.token;
}

async function register(name, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return data.token;
}

function logout() {
  localStorage.removeItem('dira_token');
  localStorage.removeItem('dira_user');
  window.location.href = '/';
}

function requireAuth() {
  if (!localStorage.getItem('dira_token')) {
    window.location.href = '/';
  }
}
