'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HeartHandshake,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Shield,
  Truck,
  HelpingHand,
  KeyRound,
  MapPin,
  Car,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const RELIEF_AREAS = [
  'North Sector',
  'River Valley',
  'Coastal Belt',
  'Highland Ridge',
  'East Metro',
  'Industrial Zone',
];

const VEHICLE_TYPES = ['Motorcycle', 'Van', 'Truck', 'Pickup', 'Sedan'];

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [role, setRole] = useState<'requester' | 'admin' | 'volunteer'>('requester');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [area, setArea] = useState(RELIEF_AREAS[0]);
  const [vehicle, setVehicle] = useState(VEHICLE_TYPES[1]); // Van
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          email,
          phone,
          password,
          adminCode: role === 'admin' ? adminCode : undefined,
          area: role === 'volunteer' ? area : undefined,
          vehicle: role === 'volunteer' ? vehicle : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to register account.');
        showToast(data.error || 'Registration failed', 'error');
        setLoading(false);
        return;
      }

      showToast(`Account created! Welcome, ${data.user.name}`, 'success');

      if (role === 'admin') router.push('/admin');
      else if (role === 'volunteer') router.push('/volunteer');
      else router.push('/requester');
      router.refresh();
    } catch {
      setError('Network communication failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-teal-600 text-white items-center justify-center shadow-sm mb-4">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create ReliefLink Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join the coordinated disaster relief dispatch network</p>
        </div>

        {/* Role Picker Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole('requester')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'requester'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpingHand className="w-4 h-4 text-teal-600" />
            Requester
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'admin'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-teal-600" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'volunteer'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-teal-600" />
            Driver
          </button>
        </div>

        {/* Signup Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Legal or Liaison Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Elena Vance"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    placeholder="elena@relieflink.org"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emergency Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0100"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>

            {/* Admin Specific Invite Code */}
            {role === 'admin' && (
              <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200">
                <label className="block text-xs font-semibold text-teal-900 mb-1">
                  Administrator Invite Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-teal-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter code (Default: RELIEF2026)"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <p className="text-[11px] text-teal-700 mt-1">
                  Protected coordinator enrollment requires the organization access key.
                </p>
              </div>
            )}

            {/* Volunteer Specific Sector and Vehicle */}
            {role === 'volunteer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-teal-50/60 border border-teal-200">
                <div>
                  <label className="block text-xs font-semibold text-teal-900 mb-1">
                    Operating Sector
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-3" />
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {RELIEF_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-teal-900 mb-1">
                    Courier Vehicle
                  </label>
                  <div className="relative">
                    <Car className="w-4 h-4 text-teal-600 absolute left-3.5 top-3" />
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-teal-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="text-teal-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
