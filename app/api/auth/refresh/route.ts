import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret) as any;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Issue new short-lived access token
    const accessToken = jwt.sign(
      { id: decoded.id, role: decoded.role || 'viewer' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Do NOT rotate the refresh token cookie here. This enforces an absolute
    // max session age of 14 days since the last login.
    return NextResponse.json({ success: true, token: accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 });
  }
}
