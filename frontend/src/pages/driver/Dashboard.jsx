import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportAPI } from '../../services/api';
import { Bus, MapPin, Users, Play, Square, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const qc = useQueryClient();
  const [tripLoading, setTripLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-bus'],
    queryFn: async () => {
      const { data } = await transportAPI.my();
      return data.data;
    },
    staleTime: 30000,
  });

  const bus = data?.bus ?? data;
  const students = bus?.students ?? bus?.enrolledStudentIds ?? [];

  async function handleTripToggle() {
    if (!bus?._id) return;
    const isActive = bus.status === 'on_trip' || bus.tripStatus === 'active';
    if (isActive && !window.confirm('End this trip?\n\nAre you sure you want to end the current trip?')) return;

    setTripLoading(true);
    try {
      const response = await transportAPI.trip(bus._id, { action: isActive ? 'end' : 'start' });
      const updatedBus = response.data?.data;
      if (updatedBus) {
        qc.setQueryData(['driver-bus'], (current) => {
          if (!current) return updatedBus;
          if (current.bus) return { ...current, bus: { ...current.bus, ...updatedBus } };
          return { ...current, ...updatedBus };
        });
      }
      toast.success(isActive ? 'Trip ended successfully.' : 'Trip started successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to end the trip. Please try again.');
    } finally {
      setTripLoading(false);
    }
  }

  async function handleShareLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await transportAPI.updateLocation({
            busId: bus._id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          alert('Location updated successfully');
        } catch {
          alert('Failed to update location');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        alert('Unable to get your location. Please allow location access.');
        setLocationLoading(false);
      }
    );
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <div className="skeleton" style={{ height: '2rem', width: '200px', marginBottom: 'var(--space-2)' }} />
          <div className="skeleton" style={{ height: '1rem', width: '300px' }} />
        </div>
        <div className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (!bus) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <h1 className="page-title">Driver Dashboard</h1>
        </div>
        <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
          <Bus size={48} style={{ margin: '0 auto var(--space-4)' }} />
          <h2 style={{ color: 'var(--ink)', marginBottom: 'var(--space-2)' }}>No bus assigned</h2>
          <p style={{ fontSize: 'var(--text-sm)' }}>Contact your transport staff to get assigned to a bus.</p>
        </div>
      </div>
    );
  }

  const isActive = bus.status === 'on_trip' || bus.tripStatus === 'active';
  const isEnded = bus.status === 'active' && bus.tripStatus === 'ended' || bus.tripStatus === 'ended';
  const route = bus.routeId;
  const stops = route?.stops || [];

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Driver Dashboard</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Bus Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              background: isActive ? 'var(--success-bg)' : 'var(--brand-muted)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3)'
            }}>
              <Bus size={28} style={{ color: isActive ? 'var(--success)' : 'var(--brand)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', color: 'var(--ink)' }}>{bus.busNumber}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Capacity: {bus.capacity} seats</div>
            </div>
          </div>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-neutral'}`} style={{ fontWeight: 600 }}>
            {isActive ? '● Trip Active' : isEnded ? 'Trip Ended' : 'Not Started'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
          <MapPin size={15} style={{ flexShrink: 0, color: 'var(--brand)' }} />
          <span>{bus.routeName || route?.routeName || 'Campus Transport Route'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
          <Users size={15} style={{ flexShrink: 0 }} />
          <span>{students.length} registered students assigned</span>
        </div>
      </div>

      {/* Trip Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <button
          onClick={handleTripToggle}
          disabled={tripLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
            background: isActive ? 'var(--danger)' : 'var(--success)',
            color: '#fff', fontWeight: 700, fontSize: 'var(--text-base)',
            cursor: tripLoading ? 'not-allowed' : 'pointer',
            border: 'none', opacity: tripLoading ? 0.7 : 1,
            transition: 'opacity var(--transition-fast)'
          }}
        >
          {isActive ? <Square size={20} /> : <Play size={20} />}
          {tripLoading ? (isActive ? 'Ending Trip...' : 'Starting Trip...') : isActive ? 'End Trip' : isEnded ? 'Start New Trip' : 'Start Trip'}
        </button>
        <button
          onClick={handleShareLocation}
          disabled={locationLoading || !isActive}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
            background: 'var(--brand)', color: '#fff', fontWeight: 700,
            fontSize: 'var(--text-base)', cursor: (!isActive || locationLoading) ? 'not-allowed' : 'pointer',
            border: 'none', opacity: (!isActive || locationLoading) ? 0.5 : 1,
            transition: 'opacity var(--transition-fast)'
          }}
        >
          <Navigation size={20} />
          {locationLoading ? 'Updating...' : 'Share Location'}
        </button>
      </div>
      {!isActive && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          Start the trip to enable live location sharing
        </p>
      )}

      {/* Route Stops Timeline */}
      {stops.length > 0 && (
        <section style={{ marginBottom: 'var(--space-5)' }}>
          <h2 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>Route Pickup Stops</h2>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stops.map((stop, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-sm)', borderBottom: idx < stops.length - 1 ? '1px solid var(--line)' : 'none', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--brand-muted)', color: 'var(--brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 700
                    }}>
                      {stop.order || idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{stop.name}</div>
                      {stop.landmark && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{stop.landmark}</div>}
                    </div>
                  </div>
                  {stop.estimatedTime && (
                    <span className="badge badge-neutral" style={{ fontSize: 'var(--text-xs)' }}>
                      {stop.estimatedTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Students List */}
      <section>
        <h2 className="section-title">Assigned Students ({students.length})</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {students.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-faint)' }}>
              <Users size={28} style={{ margin: '0 auto var(--space-3)' }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No students assigned to this bus</p>
            </div>
          ) : (
            students.map((s, i) => {
              const name = s.name || s.student?.name || 'Student';
              const reg = s.regNo || s.registrationNumber || s.student?.regNo || s.student?.registrationNumber || '';
              const stop = s.stopName || s.pickupPoint || s.student?.pickupPoint || '';
              return (
                <div key={s._id || i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderBottom: i < students.length - 1 ? '1px solid var(--line)' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                      {reg && <span style={{ fontFamily: 'monospace', marginRight: '6px' }}>{reg}</span>}
                      {stop ? `• Stop: ${stop}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textAlign: 'right' }}>
                    {s.department || s.student?.department || ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
