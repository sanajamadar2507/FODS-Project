'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        showToast(data.error || 'Login failed', 'error');
        setLoading(false);
        return;
      }

      showToast(`Welcome back, ${data.user.name}`, 'success');

      // Redirect by role
      if (data.user.role === 'admin') router.push('/admin');
      else if (data.user.role === 'volunteer') router.push('/volunteer');
      else router.push('/requester');
      router.refresh();
    } catch {
      setError('Network communication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-600 text-white items-center justify-center shadow-sm mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to ReliefLink</h1>
          <p className="text-sm text-slate-500 mt-1">Access disaster relief coordination tools</p>
        </div>

        {/* Demo Credentials Quick-Select Pill */}
        <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3 mb-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-teal-800 mb-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Quick Demo Autofill
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@relieflink.org')}
              className="py-1 px-2 rounded-lg bg-white border border-teal-200 text-slate-700 hover:bg-teal-100/50 font-medium transition-colors text-center truncate"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('sarah.jenkins@example.com')}
              className="py-1 px-2 rounded-lg bg-white border border-teal-200 text-slate-700 hover:bg-teal-100/50 font-medium transition-colors text-center truncate"
            >
              Requester
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('marcus.driver@relieflink.org')}
              className="py-1 px-2 rounded-lg bg-white border border-teal-200 text-slate-700 hover:bg-teal-100/50 font-medium transition-colors text-center truncate"
            >
              Driver
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@relieflink.org"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link href="/signup" className="text-teal-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
