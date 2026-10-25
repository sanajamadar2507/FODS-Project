'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HeartHandshake, LogOut, User, Bell, Shield, Truck, HelpingHand } from 'lucide-react';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'requester' | 'admin' | 'volunteer';
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        const unread = data.notifications.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUser();
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:bg-teal-700 transition-colors">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
              Relief<span className="text-teal-600">Link</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">
              Emergency Dispatch & Delivery
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            href="/requester"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith('/requester')
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpingHand className="w-4 h-4 text-teal-600" />
            Requester
          </Link>
          <Link
            href="/admin"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith('/admin')
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 text-teal-600" />
            Operations Admin
          </Link>
          <Link
            href="/volunteer"
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname.startsWith('/volunteer')
                ? 'bg-teal-50 text-teal-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-teal-600" />
            Driver Dispatch
          </Link>
        </nav>

        {/* User Account / Auth Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600" />
                </div>
              )}
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-teal-700 capitalize font-medium">
                  {user.role === 'admin' ? 'Coordinator' : user.role === 'volunteer' ? 'Driver' : 'Requester'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
