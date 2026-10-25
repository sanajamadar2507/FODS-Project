'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  X,
  Users,
  MapPin,
  Phone,
  Info,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ReliefRequest, RequestStatus } from '@/lib/db/types';

const RELIEF_AREAS = [
  'River Valley',
  'North Sector',
  'Coastal Belt',
  'Highland Ridge',
  'East Metro',
  'Industrial Zone',
];

const AVAILABLE_ITEMS = [
  { name: 'Food packets', unit: 'boxes', defaultQty: 25 },
  { name: 'Drinking water', unit: 'packs', defaultQty: 30 },
  { name: 'Medicine kits', unit: 'kits', defaultQty: 5 },
  { name: 'Blankets', unit: 'pieces', defaultQty: 20 },
  { name: 'Tents', unit: 'family units', defaultQty: 2 },
  { name: 'Clothes', unit: 'bundles', defaultQty: 15 },
];

const SPECIAL_GROUPS = ['Children', 'Elderly', 'Pregnant', 'Disabled'];

const STATUS_STEPS: RequestStatus[] = [
  'Submitted',
  'Approved',
  'Driver Assigned',
  'On the way',
  'Delivered',
];

export default function RequesterDashboard() {
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ id: string; priorityLabel: string; score: number } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: RELIEF_AREAS[0],
    address: '',
    peopleAffected: 15,
    situationType: 'Flood',
    description: '',
    specialGroups: [] as string[],
    selectedItems: {
      'Food packets': 20,
      'Drinking water': 25,
    } as Record<string, number>,
  });

  const fetchData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.authenticated) {
        setCurrentUser(userData.user);
        setFormData((prev) => ({
          ...prev,
          name: userData.user.name,
          phone: userData.user.phone || '',
        }));
      }

      const reqRes = await fetch('/api/requests');
      const reqData = await reqRes.json();
      if (reqData.requests) {
        setRequests(reqData.requests);
      }
    } catch {
      showToast('Error syncing requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleToggleItem = (itemName: string, defaultQty: number) => {
    setFormData((prev) => {
      const updated = { ...prev.selectedItems };
      if (updated[itemName] !== undefined) {
        delete updated[itemName];
      } else {
        updated[itemName] = defaultQty;
      }
      return { ...prev, selectedItems: updated };
    });
  };

  const handleQtyChange = (itemName: string, delta: number) => {
    setFormData((prev) => {
      const current = prev.selectedItems[itemName] || 1;
      const next = Math.max(1, current + delta);
      return {
        ...prev,
        selectedItems: { ...prev.selectedItems, [itemName]: next },
      };
    });
  };

  const handleToggleGroup = (group: string) => {
    setFormData((prev) => {
      const exists = prev.specialGroups.includes(group);
      return {
        ...prev,
        specialGroups: exists
          ? prev.specialGroups.filter((g) => g !== group)
          : [...prev.specialGroups, group],
      };
    });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsList = Object.entries(formData.selectedItems).map(([item_name, quantity]) => ({
      item_name,
      quantity,
    }));

    if (itemsList.length === 0) {
      showToast('Please select at least one relief item.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          area: formData.area,
          address: formData.address,
          peopleAffected: formData.peopleAffected,
          situationType: formData.situationType,
          specialGroups: formData.specialGroups,
          description: formData.description,
          itemsNeeded: itemsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to submit request', 'error');
        setSubmitting(false);
        return;
      }

      setSuccessData({
        id: data.request.id,
        priorityLabel: data.request.priority_label,
        score: data.request.priority_score,
      });

      showToast(`Request ${data.request.id} successfully lodged`, 'success');
      setIsModalOpen(false);
      fetchData();
    } catch {
      showToast('Network error while lodging request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute stat counts
  const activeCount = requests.filter(
    (r) => r.status === 'Approved' || r.status === 'Driver Assigned' || r.status === 'On the way'
  ).length;
  const deliveredCount = requests.filter((r) => r.status === 'Delivered').length;
  const pendingCount = requests.filter((r) => r.status === 'Submitted').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Section: Greeting & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Requester Portal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back{currentUser ? `, ${currentUser.name}` : ''}. Lodge emergency relief requests and monitor dispatches in real-time.
          </p>
        </div>

        <button
          onClick={() => {
            setSuccessData(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm hover:shadow transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Emergency Request</span>
        </button>
      </div>

      {/* 3 Small Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <div className="text-xs font-medium text-slate-500">Active In-Flight Deliveries</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{deliveredCount}</div>
            <div className="text-xs font-medium text-slate-500">Delivered Shipments</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs font-medium text-slate-500">Pending Triage Review</div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner after lodging */}
      {successData && (
        <div className="mb-8 p-5 bg-teal-50/90 border border-teal-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-teal-950 text-sm">
                Request Registered: <span className="font-mono">{successData.id}</span>
              </div>
              <div className="text-xs text-teal-800 mt-0.5">
                Urgency Classification: <strong className="font-semibold">{successData.priorityLabel}</strong> ({successData.score}% priority index). Dispatched to coordinator triage queue.
              </div>
            </div>
          </div>
          <button
            onClick={() => setSuccessData(null)}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 px-3 py-1.5 rounded-lg bg-teal-100 hover:bg-teal-200/80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* "My Requests" Section with Step Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Requests & Incident Dispatches</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking for registered relief shipments</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {requests.length} Total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No requests submitted yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click the "New Emergency Request" button above to lodge immediate disaster aid supplies.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const currentStepIdx = STATUS_STEPS.indexOf(req.status);

              return (
                <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  {/* Request Header Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {req.id}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          req.priority_label === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : req.priority_label === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : req.priority_label === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {req.priority_label} Urgency ({req.priority_score}%)
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {req.area}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Incident Summary Info */}
                  <div className="text-xs text-slate-600 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Situation</span>
                      <span className="font-medium text-slate-800">{req.situation_type} Incident</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Impact</span>
                      <span className="font-medium text-slate-800">{req.people_affected} People Affected</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span>
                      <span className="font-medium text-slate-800 truncate block">{req.address}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Courier</span>
                      <span className="font-medium text-teal-700">
                        {req.assignment ? `${req.assignment.volunteer_name || 'Driver'} (${req.assignment.status})` : 'Pending Allocation'}
                      </span>
                    </div>
                  </div>

                  {/* Requested Items Chips */}
                  {req.items && req.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {req.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-xs"
                        >
                          {it.item_name}: <strong className="text-teal-700">{it.quantity}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 5-Stage Step Tracker */}
                  <div className="pt-2">
                    <div className="relative">
                      {/* Connection track */}
                      <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />

                      <div className="grid grid-cols-5 text-center relative z-10">
                        {STATUS_STEPS.map((step, idx) => {
                          const isCompleted = currentStepIdx >= idx;
                          const isCurrent = currentStepIdx === idx;

                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                  isCompleted
                                    ? 'bg-teal-600 text-white ring-4 ring-teal-50'
                                    : 'bg-white border-2 border-slate-300 text-slate-400'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] mt-2 font-medium leading-tight ${
                                  isCurrent
                                    ? 'text-teal-800 font-bold'
                                    : isCompleted
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Single-Page New Request Modal (2 Columns Max) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lodge Emergency Relief Request</h3>
                <p className="text-xs text-slate-500 mt-0.5">Fill incident coordinates and required humanitarian supplies</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
              {/* Row 1: Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requester Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0100"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Row 2: Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Operating Sector / Area
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    {RELIEF_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exact Drop-Off Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, Building, Landmark"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Row 3: Incident Situation & People Affected */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Situation Type
                  </label>
                  <select
                    value={formData.situationType}
                    onChange={(e) => setFormData({ ...formData, situationType: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Flood">Flood (Severe Inundation)</option>
                    <option value="Earthquake">Earthquake (Structural Damage)</option>
                    <option value="Fire">Fire (Evacuation / Loss)</option>
                    <option value="Medical">Medical (Isolation / Health Emergency)</option>
                    <option value="Other">Other Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of People Affected
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.peopleAffected}
                    onChange={(e) => setFormData({ ...formData, peopleAffected: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Row 4: Items Needed (Checkbox Cards with Quantity) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supplies Needed (Select items and adjust quantities)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_ITEMS.map((item) => {
                    const isSelected = formData.selectedItems[item.name] !== undefined;
                    const qty = formData.selectedItems[item.name] || item.defaultQty;

                    return (
                      <div
                        key={item.name}
                        className={`p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleItem(item.name, item.defaultQty)}
                          className="cursor-pointer flex items-center justify-between mb-2 select-none"
                        >
                          <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                        </div>

                        {isSelected && (
                          <div className="flex items-center justify-between pt-1 border-t border-teal-200/60">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.name, -5)}
                              className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-teal-900 font-mono">
                              {qty} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(item.name, 5)}
                              className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 5: Vulnerable Groups */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Special Vulnerability Groups Present (+5% priority weight each)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_GROUPS.map((group) => {
                    const checked = formData.specialGroups.includes(group);
                    return (
                      <button
                        type="button"
                        key={group}
                        onClick={() => handleToggleGroup(group)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          checked
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{group}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Description & Access Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Water depth, road blockages, access gates, or medical specifics..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {submitting ? 'Lodge Incident...' : 'Submit Emergency Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
