import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: 'text' },
    category: {
      type: String,
      enum: [
        'classroom',
        'lab',
        'library',
        'office',
        'department',
        'hostel',
        'bus_stop',
        'auditorium',
        'cafeteria',
        'sports',
        'medical',
        'parking',
        'administrative',
        'other',
      ],
      required: true,
      index: true,
    },
    building: { type: String, required: true, trim: true },
    block: { type: String, trim: true },
    floor: { type: String, trim: true }, // "Ground Floor", "1st Floor"
    roomNumber: { type: String, trim: true },
    description: { type: String, trim: true },
    directions: { type: String, trim: true }, // Plain text directions
    openingHours: { type: String, trim: true }, // "Mon-Fri: 9AM–5PM"
    contactPerson: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    facilities: [{ type: String, trim: true }],
    // For future map integration
    latitude: { type: Number },
    longitude: { type: Number },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

locationSchema.index({ name: 'text', description: 'text', building: 'text' });

export default mongoose.models.CampusLocation ||
  mongoose.model('CampusLocation', locationSchema);
