import { getDb } from './db';

export interface AuditLogEntry {
  username: string;
  email: string;
  page: string;
  action: string;
}

export async function logAuditAction(entry: AuditLogEntry) {
  try {
    const supabase = getDb();
    
    const { error } = await supabase
      .from('audit_log')
      .insert([{
        username: entry.username,
        email: entry.email,
        page: entry.page,
        action: entry.action,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to log audit action:', error);
      // Don't throw error to avoid breaking main functionality
      return false;
    }

    console.log('Audit action logged:', entry);
    return true;
  } catch (error) {
    console.error('Error logging audit action:', error);
    return false;
  }
}

// Helper function to extract user info from JWT token
export function getUserInfoFromToken(authHeader?: string): { username: string; email: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    return {
      username: payload.username || payload.name || 'Unknown User',
      email: payload.email || 'unknown@example.com'
    };
  } catch (error) {
    console.error('Error extracting user info from token:', error);
    return null;
  }
}
