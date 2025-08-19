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

  return fetch(url, { ...options, headers });
};
