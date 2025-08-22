import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  role: 'admin' | 'manager' | 'viewer';
}

export function getVerifiedSession(request: NextRequest): UserPayload | null {
  // Support both standard Authorization header and legacy x-auth-token
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : null;
  const token = bearerToken || request.headers.get('x-auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}
