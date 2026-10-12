import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Users } from 'lucide-react';

export default function StudentEvents() {
  const [category, setCategory] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', category],
    queryFn: async () => { const { data } = await eventsAPI.list({ category: category || undefined }); return data.data?.events || []; },
  });

  const registerMutation = useMutation({
    mutationFn: (id) => eventsAPI.register(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['events'] });
      const previous = qc.getQueriesData({ queryKey: ['events'] });
      qc.setQueriesData({ queryKey: ['events'] }, (events) => events?.map((event) => (
        event._id === id ? { ...event, isRegistered: true, registrationCount: (event.registrationCount ?? event.registrations?.length ?? 0) + 1 } : event
      )));
      return { previous };
    },
    onSuccess: (_, id) => {
      toast.success('Registered for event!');
      qc.setQueriesData({ queryKey: ['events'] }, (events) => events?.map((event) => (
        event._id === id ? { ...event, isRegistered: true } : event
      )));
    },
    onError: (err, _id, context) => {
      context?.previous?.forEach(([queryKey, events]) => qc.setQueryData(queryKey, events));
      toast.error(err.response?.data?.message || 'Registration could not be completed. Please try again.');
    },
  });

  const CATS = ['', 'technical', 'cultural', 'sports', 'workshop', 'seminar', 'hackathon', 'placement'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Campus Events</h1>
        <p className="page-subtitle">Upcoming events, workshops, and activities</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', fontWeight: 600,
            textTransform: 'capitalize', background: category === c ? 'var(--brand)' : 'var(--surface-raised)',
            color: category === c ? '#fff' : 'var(--ink-muted)',
            border: `1px solid ${category === c ? 'var(--brand)' : 'var(--line)'}`,
            cursor: 'pointer',
          }}>{c || 'All'}</button>
        ))}
      </div>

      {isLoading && [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px', marginBottom: '12px' }} />)}

      {data?.map((event) => {
        const eventDate = new Date(event.date);
        const registrationCount = event.registrationCount ?? event.registrations?.length ?? 0;
        const isFull = event.maxCapacity && registrationCount >= event.maxCapacity;
        return (
          <div key={event._id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{event.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '2px' }}>{event.organizer}</div>
              </div>
              <span className={`badge badge-info`} style={{ textTransform: 'capitalize' }}>{event.category}</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
              {event.description}
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{event.startTime ? ` at ${event.startTime}` : ''}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {event.venue}
              </span>
              {event.maxCapacity && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} /> {registrationCount} / {event.maxCapacity} enrolled
                </span>
              )}
            </div>
            {event.registrationDeadline && (
              <div style={{ fontSize: '11px', color: 'var(--warning)', marginBottom: '12px' }}>
                ⏰ Registration deadline: {new Date(event.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            )}
            <button
              onClick={() => registerMutation.mutate(event._id)}
              disabled={isFull || event.isRegistered || registerMutation.isPending}
              className={`btn ${isFull || event.isRegistered ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%' }}
            >
              {registerMutation.isPending && registerMutation.variables === event._id ? 'Registering...' : event.isRegistered ? '✓ Registered' : isFull ? 'Event Full' : 'Register for Event'}
            </button>
          </div>
        );
      })}

      {data?.length === 0 && !isLoading && <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)' }}>No events scheduled currently.</div>}
    </div>
  );
}
