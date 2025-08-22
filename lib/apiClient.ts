export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Safe access to localStorage (only in browser environment)
  let token = null;
  try {
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Allow cross-repo use with optional base URL; defaults to same-origin
  const baseUrl = process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL || '';
  const finalUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // First attempt
  let response = await fetch(finalUrl, { ...options, headers, credentials: 'include' });

  // If unauthorized, try to refresh once
  if (response.status === 401) {
    try {
      const apiBase = (process.env.NEXT_PUBLIC_DASHBOARD_BASE_URL || '').replace(/\/$/, '');
      const refreshUrl = `${apiBase}/api/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send HttpOnly cookie
        cache: 'no-store',
      });

      if (refreshRes.ok) {
        const { token: newToken } = await refreshRes.json();
        if (typeof window !== 'undefined' && newToken) {
          localStorage.setItem('token', newToken);
        }
        // Retry original request with new token
        const retryHeaders: any = { ...headers };
        if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(finalUrl, { ...options, headers: retryHeaders, credentials: 'include' });
      }
    } catch (e) {
      console.error('Refresh attempt failed:', e);
    }
  }

  // If still unauthorized, clear and redirect to login
  if (response.status === 401) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      console.error('Error handling 401:', e);
    }
  }

  return response;
};
