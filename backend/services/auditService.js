import AuditLog from '../models/AuditLog.js';

/**
 * Record a privileged action in the audit log.
 * Call this for: hostel status changes, fee edits, role changes,
 * admin deletions, leave approvals, etc.
 */
export async function createAuditLog({
  actor,
  actorEmail,
  actorRole,
  action,
  resource,
  resourceId = null,
  description = '',
  before = null,
  after = null,
  req = null,
}) {
  try {
    await AuditLog.create({
      actor,
      actorEmail,
      actorRole,
      action,
      resource,
      resourceId,
      description,
      before,
      after,
      ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    // Audit logging must never crash the main request
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}
