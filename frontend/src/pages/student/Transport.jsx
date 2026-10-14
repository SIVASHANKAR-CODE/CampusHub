import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transportAPI } from '../../services/api';
import { Bus, MapPin, Clock, Phone } from 'lucide-react';

export default function StudentTransport() {
  const { data: busInfo, isLoading } = useQuery({
    queryKey: ['transport-info'],
    queryFn: async () => { const { data } = await transportAPI.my(); return data.data; },
    retry: false,
  });

  const busId = busInfo?._id;

  // Poll location every 30 seconds when bus is on trip
  const { data: locationData } = useQuery({
    queryKey: ['bus-location', busId],
    queryFn: async () => {
      if (!busId) return null;
      const { data } = await transportAPI.location(busId);
      return data;
    },
    enabled: !!busId && ['on_trip', 'active'].includes(busInfo?.status || busInfo?.tripStatus),
    refetchInterval: 30000,
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Bus Transport</h1>
        <p className="page-subtitle">Your bus details and live location</p>
      </div>

      {isLoading && <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />}

      {!isLoading && !busInfo && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-muted)' }}>
          <Bus size={32} style={{ margin: '0 auto 12px', color: 'var(--line-strong)' }} />
          <div>No bus assigned. Contact transport staff.</div>
        </div>
      )}

      {busInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)' }}>Bus {busInfo.busNumber}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{busInfo.vehicleModel}</div>
              </div>
              <span className={`badge ${['on_trip', 'active'].includes(busInfo.status || busInfo.tripStatus) ? 'badge-success' : 'badge-neutral'}`}>
                {(busInfo.status || busInfo.tripStatus || 'inactive').replace('_', ' ')}
              </span>
            </div>
            {busInfo.routeId && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{busInfo.routeId.routeName}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  Stops: {busInfo.routeId.stops?.map(s => s.name || s.stopName).join(' → ')}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: 'var(--text-xs)' }}>
                  <span><Clock size={12} style={{ display: 'inline' }} /> Departure: {busInfo.routeId.departureTime}</span>
                  <span>Arrival: {busInfo.routeId.arrivalTime}</span>
                </div>
              </div>
            )}
          </div>

          {['on_trip', 'active'].includes(busInfo.status || busInfo.tripStatus) && locationData?.data && (
            <div className="card" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: 'var(--text-sm)' }}>Bus is on the way</span>
              </div>
              {locationData.data.locationName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}>
                  <MapPin size={14} style={{ color: 'var(--success)' }} />
                  <span>Currently near: <strong>{locationData.data.locationName}</strong></span>
                </div>
              )}
              {locationData.data.updatedAt && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>
                  Updated: {new Date(locationData.data.updatedAt).toLocaleTimeString('en-IN')}
                </div>
              )}
            </div>
          )}

          {busInfo.driverName && (
            <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--ink-faint)' }}>Driver: </span>
                <span style={{ fontWeight: 600 }}>{busInfo.driverName}</span>
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
