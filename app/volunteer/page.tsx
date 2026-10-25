'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  Bell,
  AlertCircle,
  Package,
  Layers,
  Check,
  X,
  History,
  Send,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Tooltip } from '@/components/ui/Tooltip';
import { ReliefRequest, Volunteer, Notification } from '@/lib/db/types';

// Import our handcrafted Data Structures
import { SinglyLinkedList, Stack, NormalQueue } from '@/lib/ds';

export default function VolunteerDashboard() {
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [volunteerInfo, setVolunteerInfo] = useState<Volunteer | null>(null);
  const [requests, setRequests] = useState<ReliefRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Modal for delivery completion note
  const [deliveringAssignmentId, setDeliveringAssignmentId] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');

  // Modal for decline reason
  const [decliningAssignmentId, setDecliningAssignmentId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  // Driver "Last Delivered" History Stack (Data Structure: Stack)
  const [deliveryStack] = useState(() => new Stack<{ requestId: string; address: string; time: string }>());
  const [historyItems, setHistoryItems] = useState<Array<{ requestId: string; address: string; time: string }>>([]);

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.authenticated) {
        setCurrentUser(meData.user);
        if (meData.volunteer) {
          setVolunteerInfo(meData.volunteer);
          setIsAvailable(meData.volunteer.is_available);
        }
      }

      const reqRes = await fetch('/api/requests');
      const reqData = await reqRes.json();
      if (reqData.requests) {
        setRequests(reqData.requests);
      }

      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      if (notifData.notifications) {
        setNotifications(notifData.notifications);
      }
    } catch {
      showToast('Error syncing field courier data', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  // Filter deliveries assigned to this driver
  const myDeliveries = useMemo(() => {
    if (!volunteerInfo) return [];
    return requests.filter((r) => r.assignment?.volunteer_id === volunteerInfo.id);
  }, [requests, volunteerInfo]);

  const activeDeliveries = myDeliveries.filter((r) => r.status !== 'Delivered' && r.status !== 'Declined');
  const completedDeliveries = myDeliveries.filter((r) => r.status === 'Delivered');

  // DATA STRUCTURE: Singly Linked List for Ordered Delivery Stops Itinerary
  const itineraryStops = useMemo(() => {
    const list = new SinglyLinkedList<{
      stopNumber: number;
      requestId: string;
      recipient: string;
      address: string;
      area: string;
      phone: string;
      items: any[];
      status: string;
    }>();

    activeDeliveries.forEach((r, idx) => {
      list.append({
        stopNumber: idx + 1,
        requestId: r.id,
        recipient: r.requester_name,
        address: r.address,
        area: r.area,
        phone: r.phone,
        items: r.items || [],
        status: r.status,
      });
    });

    return list.toArray();
  }, [activeDeliveries]);

  // Toggle Availability
  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      const res = await fetch('/api/volunteers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`You are now marked ${nextState ? 'Available' : 'Offline'}`, 'success');
      }
    } catch {
      showToast('Failed to toggle on-call status', 'error');
      setIsAvailable(!nextState);
    }
  };

  // Step-by-Step Status Transitions
  const handleTransitionStatus = async (
    assignmentId: string,
    newStatus: 'Accepted' | 'Picked Up' | 'On the Way' | 'Delivered' | 'Declined',
    note?: string
  ) => {
    try {
      const res = await fetch('/api/assignments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, status: newStatus, notes: note }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Transition failed', 'error');
        return;
      }

      showToast(`Status updated to: ${newStatus}`, 'success');

      if (newStatus === 'Delivered' && data.request) {
        // Push onto Delivery History Stack (Data Structure: Stack)
        deliveryStack.push({
          requestId: data.request.id,
          address: data.request.address,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setHistoryItems(deliveryStack.toArray());
      }

      setDeliveringAssignmentId(null);
      setDecliningAssignmentId(null);
      setDeliveryNote('');
      setDeclineReason('');
      fetchData();
    } catch {
      showToast('Network error during delivery update', 'error');
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Greeting, Availability Toggle & Notification Bell */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {volunteerInfo?.name || 'Field Courier'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Sector: <strong>{volunteerInfo?.area || 'All Sectors'}</strong> • Vehicle:{' '}
              {volunteerInfo?.vehicle || 'Van'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Availability Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">
              {isAvailable ? 'Available' : 'Offline'}
            </span>
            <button
              onClick={handleToggleAvailability}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                isAvailable ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  isAvailable ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notification Count */}
          <div className="relative p-2 rounded-xl bg-slate-100 text-slate-700">
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* "New Assignment" Highlight Card (If active delivery waiting in 'Assigned' state) */}
      {activeDeliveries.length > 0 &&
        activeDeliveries
          .filter((r) => r.assignment?.status === 'Assigned')
          .map((req) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${req.address}, ${req.area}`
            )}`;

            return (
              <div
                key={req.id}
                className="bg-teal-50/90 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in slide-in-from-top-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      New Emergency Mission Assigned
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    {req.id}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  You have been assigned an emergency delivery to {req.area}, {req.address}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-teal-200/50">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Recipient</span>
                    <span className="font-semibold">{req.requester_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Contact Phone</span>
                    <a href={`tel:${req.phone}`} className="font-semibold text-teal-700 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {req.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Impact</span>
                    <span className="font-semibold">{req.people_affected} People Affected</span>
                  </div>
                </div>

                {/* Items to load */}
                {req.items && req.items.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-teal-950 block mb-1">
                      Manifest Supplies:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white border border-teal-200 px-2 py-0.5 rounded-md font-medium text-slate-800"
                        >
                          {it.item_name}: <strong className="text-teal-700">{it.quantity}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions: Maps link + Accept / Decline */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950 bg-white border border-teal-300 px-3 py-1.5 rounded-xl transition-colors shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDecliningAssignmentId(req.assignment!.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-xs font-semibold"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleTransitionStatus(req.assignment!.id, 'Accepted')}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Accept Mission
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

      {/* DATA STRUCTURE: Ordered Delivery Stops Itinerary (Singly Linked List) */}
      {itineraryStops.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Trip Itinerary (Stop Sequence)</h2>
              <Tooltip content="Singly Linked List: Sequentially chains your active delivery waypoints in optimized linear route order." />
            </div>
            <span className="text-xs text-slate-500">{itineraryStops.length} stops planned</span>
          </div>

          <div className="space-y-3">
            {itineraryStops.map((stop) => (
              <div
                key={stop.requestId}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {stop.stopNumber}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs">
                      {stop.recipient} • <span className="font-mono">{stop.requestId}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{stop.address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {stop.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "My Deliveries" Tabs (Active vs Completed) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Shipments ({activeDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'completed'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed ({completedDeliveries.length})
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total verified: <strong>{volunteerInfo?.total_deliveries || 0}</strong>
          </span>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-slate-100">
          {(activeTab === 'active' ? activeDeliveries : completedDeliveries).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No {activeTab} deliveries recorded at this time.
            </div>
          ) : (
            (activeTab === 'active' ? activeDeliveries : completedDeliveries).map((req) => {
              const currentStatus = req.assignment?.status;

              return (
                <div key={req.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{req.id}</span>
                        <span className="text-xs font-semibold text-slate-800">{req.requester_name}</span>
                        <span className="text-[11px] text-slate-500">({req.area})</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{req.address}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        {currentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  {activeTab === 'active' && req.assignment && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      {currentStatus === 'Accepted' && (
                        <button
                          onClick={() => handleTransitionStatus(req.assignment!.id, 'Picked Up')}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Confirm Supplies Picked Up
                        </button>
                      )}

                      {currentStatus === 'Picked Up' && (
                        <button
                          onClick={() => handleTransitionStatus(req.assignment!.id, 'On the Way')}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                        >
                          En Route to Drop-Off
                        </button>
                      )}

                      {currentStatus === 'On the Way' && (
                        <button
                          onClick={() => setDeliveringAssignmentId(req.assignment!.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Complete Delivery
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DATA STRUCTURE: Driver "Last Delivered" History Stack */}
      {historyItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Completed Drops (LIFO Stack)</h3>
              <Tooltip content="Driver Delivery Stack: Recent handoffs stored in reverse chronological order (most recent on top)." />
            </div>
          </div>
          <div className="space-y-2">
            {historyItems.map((h, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900">{h.requestId}</span> —{' '}
                  <span>{h.address}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Delivered Confirmation with Optional Note */}
      {deliveringAssignmentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-elevated space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Confirm Delivery Handoff</h3>
            <p className="text-xs text-slate-500">
              Provide an optional drop-off verification note (e.g. handed to building superintendent, porch drop).
            </p>
            <textarea
              rows={3}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Delivered in person to recipient liaison..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeliveringAssignmentId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleTransitionStatus(deliveringAssignmentId, 'Delivered', deliveryNote)
                }
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Decline Mission Reason */}
      {decliningAssignmentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-elevated space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Decline Mission Dispatch</h3>
            <p className="text-xs text-slate-500">
              This request will immediately return to the central triage queue and be re-routed to the next driver in fair rotation.
            </p>
            <input
              type="text"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason (e.g. mechanical repair, transit blockage)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDecliningAssignmentId(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleTransitionStatus(decliningAssignmentId, 'Declined', declineReason)
                }
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
