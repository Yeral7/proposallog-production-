import { fetchWithAuth } from './apiClient';

export interface ClientAuditEntry {
  page: string;
  action: string;
}

export async function logClientAuditAction(entry: ClientAuditEntry) {
  try {
    // Get user info from localStorage or auth context
    const userInfo = getUserInfoFromStorage();
    if (!userInfo) {
      console.warn('No user info available for audit logging');
      return false;
    }

    const response = await fetchWithAuth('/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        username: userInfo.username,
        email: userInfo.email,
        page: entry.page,
        action: entry.action
      })
    });

    if (!response.ok) {
      console.error('Failed to log audit action:', await response.text());
      return false;
    }

    console.log('Audit action logged:', entry);
    return true;
  } catch (error) {
    console.error('Error logging audit action:', error);
    return false;
  }
}

function getUserInfoFromStorage(): { username: string; email: string } | null {
  try {
    // Try to get user info from localStorage or sessionStorage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        username: user.username || user.name || 'Unknown User',
        email: user.email || 'unknown@example.com'
      };
    }

    // Fallback: try to decode JWT token from localStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return {
        username: payload.username || payload.name || 'Unknown User',
        email: payload.email || 'unknown@example.com'
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user info from storage:', error);
    return null;
  }
}
