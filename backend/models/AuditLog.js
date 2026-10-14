import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorEmail: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    action: { type: String, required: true, trim: true }, // e.g. "UPDATE_HOSTEL_STATUS"
    resource: { type: String, required: true, trim: true }, // e.g. "Student"
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, trim: true }, // Human-readable summary
    before: { type: mongoose.Schema.Types.Mixed }, // Previous state
    after: { type: mongoose.Schema.Types.Mixed },  // New state
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
