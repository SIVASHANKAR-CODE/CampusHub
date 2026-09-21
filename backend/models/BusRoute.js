import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    estimatedTime: { type: String, trim: true }, // "07:30"
    landmark: { type: String, trim: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    stops: [stopSchema],
    distance: { type: Number }, // km
    duration: { type: String, trim: true }, // "1h 30m"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.BusRoute || mongoose.model('BusRoute', routeSchema);
