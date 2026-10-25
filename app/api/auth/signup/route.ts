import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { DatabaseStore } from '@/lib/db/store';
import { signToken } from '@/lib/auth/jwt';
import { COOKIE_NAME } from '@/lib/auth/session';
import { UserRole } from '@/lib/db/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role, adminCode, area, vehicle } = body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'All fields (name, email, phone, password, role) are required.' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['requester', 'admin', 'volunteer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified. Must be requester, admin, or volunteer.' },
        { status: 400 }
      );
    }

    // Admin Invite Code Verification
    if (role === 'admin') {
      const expectedAdminCode = process.env.ADMIN_CODE || 'RELIEF2026';
      if (!adminCode || adminCode.trim() !== expectedAdminCode) {
        return NextResponse.json(
          { error: 'Invalid or missing administrator invite code.' },
          { status: 403 }
        );
      }
    }

    // Volunteer specific validation
    if (role === 'volunteer') {
      if (!area || !vehicle) {
        return NextResponse.json(
          { error: 'Assigned operating area and vehicle type are required for volunteer drivers.' },
          { status: 400 }
        );
      }
    }

    // Check duplicate email
    const existing = await DatabaseStore.getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in instead.' },
        { status: 409 }
      );
    }

    // Password hash with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr-${role.slice(0, 3)}-${Date.now().toString(36)}`;
    const newUser = await DatabaseStore.createUser({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password_hash: passwordHash,
      role,
    });

    // If volunteer, create 1-to-1 volunteer driver record
    if (role === 'volunteer') {
      await DatabaseStore.createVolunteer({
        user_id: userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        area: area.trim(),
        vehicle,
        is_available: true,
      });
    }

    // Create session token
    const token = await signToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to complete registration.' },
      { status: 500 }
    );
  }
}
