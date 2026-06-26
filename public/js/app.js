const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
    return data;
  },

  register(username, email, password) {
    return this.request('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  },

  login(username, password) {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  logout() {
    return this.request('/api/logout', { method: 'POST' });
  },

  me() {
    return this.request('/api/me');
  },

  getMenus() {
    return this.request('/api/menus');
  },

  purchase(items) {
    return this.request('/api/purchase', {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  },

  getOrders() {
    return this.request('/api/orders');
  }
};

function showAlert(container, message, type = 'error') {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatPrice(price) {
  return `$${parseFloat(price).toFixed(2)}`;
}

async function checkAuth() {
  try {
    const data = await API.me();
    return data.user;
  } catch {
    return null;
  }
}

function updateNav(user) {
  const authLinks = document.getElementById('auth-links');
  const userNav = document.getElementById('user-nav');

  if (!authLinks || !userNav) return;

  if (user) {
    authLinks.classList.add('hidden');
    userNav.classList.remove('hidden');
    document.getElementById('username-display').textContent = user.username;
  } else {
    authLinks.classList.remove('hidden');
    userNav.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  updateNav(user);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await API.logout();
      window.location.href = '/';
    });
  }
});
