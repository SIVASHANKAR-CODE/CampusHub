import mongoose from 'mongoose';

const transportBusSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true, trim: true, index: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusRoute', index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverName: { type: String, trim: true },
    capacity: { type: Number, required: true },
    enrolledStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'on_trip'],
      default: 'active',
      index: true,
    },
    // Polling-based location (updated by driver)
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      locationName: { type: String, trim: true },
      updatedAt: { type: Date },
    },
    tripStartedAt: { type: Date },
    tripEndedAt: { type: Date },
    vehicleModel: { type: String, trim: true },
    registrationNo: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.TransportBus ||
  mongoose.model('TransportBus', transportBusSchema);
