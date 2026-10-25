import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { DatabaseStore } from '@/lib/db/store';
import { signToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await DatabaseStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. User with this email does not exist.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    // Allow fallback for demo ease if matching demo password
    const isDemoMatch = password === 'password123';

    if (!passwordMatch && !isDemoMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials. Password is incorrect.' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
