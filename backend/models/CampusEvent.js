import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'technical',
        'cultural',
        'sports',
        'workshop',
        'seminar',
        'hackathon',
        'placement',
        'club',
        'other',
      ],
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    endDate: { type: Date },
    startTime: { type: String, trim: true }, // "09:00"
    endTime: { type: String, trim: true },
    venue: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    posterUrl: { type: String },
    registrationDeadline: { type: Date },
    registrationLink: { type: String, trim: true },
    maxCapacity: { type: Number },
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' }, // if club event
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, isPublished: 1 });

export default mongoose.models.CampusEvent || mongoose.model('CampusEvent', eventSchema);
