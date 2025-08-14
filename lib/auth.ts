import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  role: 'admin' | 'manager' | 'viewer';
}

export function getVerifiedSession(request: NextRequest): UserPayload | null {
  const token = request.headers.get('x-auth-token');

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
