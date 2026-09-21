import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

function typeColor(type) {
  const map = { important: 'var(--warning)', emergency: 'var(--danger)', success: 'var(--success)', info: 'var(--brand)', warning: 'var(--warning)' };
  return map[type] || 'var(--ink-muted)';
}

export default function StudentNotifications() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const notificationsKey = ['notifications', user?.id, user?.role];
  const notificationsCountKey = ['notifications-count', user?.id, user?.role];

  const { data, isLoading } = useQuery({
    queryKey: notificationsKey,
    queryFn: async () => { const { data } = await notificationsAPI.list(); return data.data; },
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationsAPI.readAll(),
    onMutate: async () => {
      await Promise.all([
        qc.cancelQueries({ queryKey: notificationsKey }),
        qc.cancelQueries({ queryKey: notificationsCountKey }),
      ]);
      const previousNotifications = qc.getQueryData(notificationsKey);
      const previousCount = qc.getQueryData(notificationsCountKey);
      qc.setQueryData(notificationsKey, (current) => current ? {
        ...current,
        unread: 0,
        notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
      } : current);
      qc.setQueryData(notificationsCountKey, 0);
      return { previousNotifications, previousCount };
    },
    onSuccess: ({ data }) => {
      const unreadCount = data.data?.unreadCount ?? 0;
      qc.setQueryData(notificationsCountKey, unreadCount);
      toast.success('All marked as read.');
    },
    onError: (error, _variables, context) => {
      if (context?.previousNotifications !== undefined) qc.setQueryData(notificationsKey, context.previousNotifications);
      if (context?.previousCount !== undefined) qc.setQueryData(notificationsCountKey, context.previousCount);
      toast.error(error.response?.data?.message || 'Unable to mark notifications as read.');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id) => notificationsAPI.dismiss(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: notificationsKey }),
        qc.cancelQueries({ queryKey: notificationsCountKey }),
      ]);
      const previousNotifications = qc.getQueryData(notificationsKey);
      const previousCount = qc.getQueryData(notificationsCountKey);
      const removedNotification = previousNotifications?.notifications?.find((notification) => notification._id === id);
      const unreadDelta = removedNotification && !removedNotification.read ? 1 : 0;
      qc.setQueryData(notificationsKey, (current) => current ? {
        ...current,
        unread: Math.max(0, (current.unread || 0) - unreadDelta),
        notifications: current.notifications.filter((notification) => notification._id !== id),
      } : current);
      qc.setQueryData(notificationsCountKey, (count) => Math.max(0, (count || 0) - unreadDelta));
      return { previousNotifications, previousCount, unreadDelta };
    },
    onSuccess: ({ data }) => {
      const unreadCount = data?.data?.unreadCount ?? data?.unreadCount ?? 0;
      qc.setQueryData(notificationsCountKey, unreadCount);
      qc.setQueryData(notificationsKey, (current) => current ? { ...current, unread: unreadCount } : current);
    },
    onError: (error, _variables, context) => {
      if (context?.previousNotifications !== undefined) qc.setQueryData(notificationsKey, context.previousNotifications);
      if (context?.previousCount !== undefined) qc.setQueryData(notificationsCountKey, context.previousCount);
      toast.error(error.response?.data?.message || "Couldn't dismiss notification. Please try again.");
    },
  });

  const readMutation = useMutation({
    mutationFn: (id) => notificationsAPI.read(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: notificationsKey }),
        qc.cancelQueries({ queryKey: notificationsCountKey }),
      ]);
      const previousNotifications = qc.getQueryData(notificationsKey);
      const previousCount = qc.getQueryData(notificationsCountKey);
      qc.setQueryData(notificationsKey, (current) => current ? {
        ...current,
        unread: Math.max(0, (current.unread || 0) - (current.notifications.some((notification) => notification._id === id && !notification.read) ? 1 : 0)),
        notifications: current.notifications.map((notification) => notification._id === id ? { ...notification, read: true } : notification),
      } : current);
      qc.setQueryData(notificationsCountKey, (count) => Math.max(0, (count || 0) - 1));
      return { previousNotifications, previousCount };
    },
    onSuccess: ({ data }) => {
      if (typeof data.data?.unreadCount === 'number') qc.setQueryData(notificationsCountKey, data.data.unreadCount);
    },
    onError: (error, _variables, context) => {
      if (context?.previousNotifications !== undefined) qc.setQueryData(notificationsKey, context.previousNotifications);
      if (context?.previousCount !== undefined) qc.setQueryData(notificationsCountKey, context.previousCount);
      toast.error(error.response?.data?.message || 'Unable to mark notification as read.');
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read) readMutation.mutate(notification._id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{data?.unread || 0} unread</p>
        </div>
        {data?.unread > 0 && (
          <button disabled={readAllMutation.isPending} onClick={() => readAllMutation.mutate()} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--brand)', fontWeight: 500, opacity: readAllMutation.isPending ? 0.6 : 1 }}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading && [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px', marginBottom: '8px' }} />)}
      {data?.notifications?.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-muted)' }}>
          <Bell size={32} style={{ margin: '0 auto 8px', color: 'var(--line-strong)' }} />
          <div>No notifications yet.</div>
        </div>
      )}

      {data?.notifications?.map((n) => (
        <div
          key={n._id}
          onClick={() => handleNotificationClick(n)}
          style={{
            display: 'flex', gap: '12px', padding: '16px',
            background: n.read ? 'var(--surface-raised)' : 'var(--brand-pale)',
            border: `1px solid ${n.read ? 'var(--line)' : 'var(--info-border)'}`,
            borderRadius: '12px', marginBottom: '8px', cursor: 'pointer',
            transition: 'background var(--transition-fast)',
            position: 'relative',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? 'transparent' : 'var(--brand)', flexShrink: 0, marginTop: '6px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 'var(--text-sm)', color: 'var(--ink)', marginBottom: '2px' }}>{n.title}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{n.body}</div>
            <div style={{ fontSize: '10px', color: 'var(--ink-faint)', marginTop: '4px' }}>
              {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: typeColor(n.type), flexShrink: 0, marginTop: '6px' }} />
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={(event) => {
              event.stopPropagation();
              dismissMutation.mutate(n._id);
            }}
            disabled={dismissMutation.isPending}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              opacity: dismissMutation.isPending ? 0.6 : 1,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
