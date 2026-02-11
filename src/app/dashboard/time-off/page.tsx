'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock3
} from 'lucide-react';

interface TimeOffRequest {
  id: string;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
  requestDate: string;
}

export default function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/time-off');
      const result = await response.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch time-off:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/time-off', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved' })
      });
      const result = await response.json();
      if (result.success) fetchRequests();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      const response = await fetch('/api/time-off', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'denied' })
      });
      const result = await response.json();
      if (result.success) fetchRequests();
    } catch (error) {
      console.error('Failed to deny:', error);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const totalDays = requests.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.days, 0);

  const upcoming = requests
    .filter(r => r.status === 'Approved' && new Date(r.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Off</h1>
          <p className="text-muted-foreground">Loading time-off requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Off</h1>
          <p className="text-muted-foreground">Manage employee time-off requests and schedules</p>
        </div>
        <Button className="bg-accent-blue hover:bg-accent-blue/90">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Pending Requests</div>
              <div className="text-2xl font-bold text-accent-yellow">{pendingCount}</div>
            </div>
            <Clock3 className="h-8 w-8 text-accent-yellow" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Approved</div>
              <div className="text-2xl font-bold text-accent-green">{approvedCount}</div>
            </div>
            <CheckCircle className="h-8 w-8 text-accent-green" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Days Off Total</div>
              <div className="text-2xl font-bold text-accent-blue">{totalDays}</div>
            </div>
            <Calendar className="h-8 w-8 text-accent-blue" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
              <div className="text-2xl font-bold text-white">{requests.length}</div>
            </div>
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">All Requests</h3>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No time-off requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white">{request.employee}</div>
                      <div className="text-sm text-muted-foreground">{request.type}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      request.status === 'Pending' ? 'bg-accent-yellow/15 text-accent-yellow'
                        : request.status === 'Approved' ? 'bg-accent-green/15 text-accent-green'
                        : 'bg-accent-red/15 text-accent-red'
                    }`}>{request.status}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    <span className="ml-2 text-muted-foreground">({request.days} day{request.days > 1 ? 's' : ''})</span>
                  </div>
                  {request.reason && (
                    <div className="text-sm text-muted-foreground mb-3">
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  )}
                  {request.status === 'Pending' && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-accent-green border-accent-green/30" onClick={() => handleApprove(request.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button variant="outline" size="sm" className="text-accent-red border-accent-red/30" onClick={() => handleDeny(request.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Time Off</h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming time off scheduled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-accent-blue rounded-full"></div>
                    <div>
                      <div className="font-medium text-white">{item.employee}</div>
                      <div className="text-sm text-muted-foreground">{item.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {new Date(item.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.days} day{item.days > 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
