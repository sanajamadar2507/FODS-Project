'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HelpingHand,
  Shield,
  Truck,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LandingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickDemoLogin = async (email: string, role: string, redirectPath: string) => {
    try {
      setLoadingRole(role);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to log in', 'error');
        return;
      }

      showToast(`Logged in as ${data.user.name} (${role})`, 'success');
      router.push(redirectPath);
      router.refresh();
    } catch {
      showToast('Login request failed', 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Real-Time Disaster Relief Network
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Rapid Relief Coordination & Verified Courier Delivery
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Connecting affected communities, emergency logistics coordinators, and volunteer drivers to deliver critical food, water, medical aid, and shelter.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-base shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            Sign In to Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-base border border-slate-300 shadow-sm transition-all"
          >
            Create an Account
          </Link>
        </div>

        {/* Quick Demo Switcher Strip */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span className="font-semibold text-slate-700 px-2">Instant Demo Login:</span>
          <button
            onClick={() => handleQuickDemoLogin('admin@relieflink.org', 'Admin', '/admin')}
            disabled={loadingRole !== null}
            className="px-3 py-1.5 rounded-lg bg-white shadow-xs hover:bg-teal-50 hover:text-teal-800 font-medium transition-colors"
          >
            {loadingRole === 'Admin' ? 'Entering...' : 'Elena (Admin)'}
          </button>
          <button
            onClick={() => handleQuickDemoLogin('sarah.jenkins@example.com', 'Requester', '/requester')}
            disabled={loadingRole !== null}
            className="px-3 py-1.5 rounded-lg bg-white shadow-xs hover:bg-teal-50 hover:text-teal-800 font-medium transition-colors"
          >
            {loadingRole === 'Requester' ? 'Entering...' : 'Sarah (Requester)'}
          </button>
          <button
            onClick={() => handleQuickDemoLogin('marcus.driver@relieflink.org', 'Volunteer', '/volunteer')}
            disabled={loadingRole !== null}
            className="px-3 py-1.5 rounded-lg bg-white shadow-xs hover:bg-teal-50 hover:text-teal-800 font-medium transition-colors"
          >
            {loadingRole === 'Volunteer' ? 'Entering...' : 'Marcus (Driver)'}
          </button>
        </div>
      </section>

      {/* Role Picker Section (3 Rounded Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Choose Your Operational Role</h2>
          <p className="text-sm text-slate-500 mt-1">Select a portal to explore role-specific tools and workflows</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Requester */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <HelpingHand className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Requester Portal</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Submit urgent emergency relief requests. Specify headcounts, situation severity, special groups present, and trace supply delivery step by step.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Streamlined emergency assistance form</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Real-time 5-stage shipment tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Instant urgency scoring preview</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleQuickDemoLogin('sarah.jenkins@example.com', 'Requester', '/requester')}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors text-center shadow-xs"
              >
                Enter as Requester
              </button>
            </div>
          </div>

          {/* Card 2: Operations Admin */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Operations Admin</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Central incident response hub. Inspect ranked priority queues, live inventory stocks, round-robin driver dispatch, and area demand heat maps.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Ranked Urgency Priority Queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Atomic stock allocation & driver dispatch</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Undo stack & inventory heat-map</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleQuickDemoLogin('admin@relieflink.org', 'Admin', '/admin')}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors text-center shadow-xs"
              >
                Enter as Admin
              </button>
            </div>
          </div>

          {/* Card 3: Volunteer Driver */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-7 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Volunteer Courier</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Field dispatch dashboard for delivery drivers. Review assigned missions, launch turn-by-turn navigation, and update drop-off statuses.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Live availability toggle & alert queue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>One-click Google Maps destination routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Sequential route itinerary & drop-off notes</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => handleQuickDemoLogin('marcus.driver@relieflink.org', 'Volunteer', '/volunteer')}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors text-center shadow-xs"
              >
                Enter as Volunteer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Efficiency Metrics */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Light Mode Simplicity</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">Dynamic</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Waiting-Time Urgency Escalation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">Atomic</div>
              <div className="text-xs text-slate-500 font-medium mt-1">ACID Stock Dispatches</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">Fair</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Round-Robin Driver Rotation</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
