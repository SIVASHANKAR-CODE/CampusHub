import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB, isDbConnected } from '../config/db.js';
import TransportBus from '../models/TransportBus.js';
import BusRoute from '../models/BusRoute.js';
import Student from '../models/Student.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(authenticate);
const demoDriverTripState = new Map();

// Student & Driver: get own bus info
router.get('/my', requireRole('student', 'driver'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isMockUser = typeof userId === 'string' && userId.startsWith('mock_');

    if (isMockUser) {
      const tripState = demoDriverTripState.get(userId) || { status: 'active', startedAt: new Date() };
      return res.json({
        success: true,
        message: 'Bus info fetched (Demo Mode).',
        data: {
          _id: 'mock_bus_001',
          busNumber: 'BUS-07',
          licensePlate: 'TN-01-AB-1234',
          capacity: 45,
          tripStatus: tripState.status,
          tripStartedAt: tripState.startedAt,
          tripEndedAt: tripState.endedAt || null,
          currentLocation: {
            latitude: 13.0827,
            longitude: 80.2707,
            locationName: 'City Center Stop',
            updatedAt: new Date(),
          },
          routeId: {
            _id: 'mock_route_001',
            routeName: 'Route 7 — Central Metro to Campus',
            startPoint: 'Central Metro',
            endPoint: 'Campus Main Gate',
            stops: [
              { name: 'Central Metro', pickupTime: '07:30 AM' },
              { name: 'Anna Nagar', pickupTime: '07:45 AM' },
              { name: 'Koyambedu', pickupTime: '08:05 AM' },
              { name: 'Campus Main Gate', pickupTime: '08:30 AM' },
            ],
          },
          driverId: {
            _id: 'mock_driver_001',
            name: 'Ramesh Chandran',
            phone: '+91 94444 55555',
          },
          students: [
            { _id: 's1', name: 'Aarav Patel', rollNo: 'DEMO001', stop: 'Anna Nagar', status: 'boarded' },
            { _id: 's2', name: 'Pooja Hegde', rollNo: 'DEMO002', stop: 'Koyambedu', status: 'pending' },
            { _id: 's3', name: 'Kiran Rao', rollNo: 'DEMO003', stop: 'Central Metro', status: 'boarded' },
          ],
        },
      });
    }

    await connectDB();

    if (req.user.role === 'driver') {
      let bus = await TransportBus.findOne({ driverId: req.user.id })
        .populate('routeId')
        .populate('enrolledStudentIds', 'name regNo registrationNumber department section stopName')
        .lean();

      if (!bus) {
        // Fallback: assign the primary demo bus to this driver account
        bus = await TransportBus.findOne({ status: { $in: ['active', 'on_trip'] } })
          .populate('routeId')
          .populate('enrolledStudentIds', 'name regNo registrationNumber department section stopName')
          .lean();
        if (bus) {
          await TransportBus.findByIdAndUpdate(bus._id, { driverId: req.user.id });
        }
      }

      if (!bus) return res.status(404).json({ success: false, message: 'No bus assigned to your account.' });
      return res.json({
        success: true,
        message: 'Bus info fetched.',
        data: {
          ...bus,
          tripStatus: bus.status === 'on_trip' ? 'active' : bus.tripEndedAt ? 'ended' : 'idle',
        },
      });
    }

    const student = await Student.findOne({ userId: req.user.id }).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    let bus = await TransportBus.findOne({ enrolledStudentIds: student._id })
      .populate('routeId').lean();

    if (!bus && student.hostelStatus === 'day_scholar') {
      // Find bus by student's busNumber or default route
      bus = await TransportBus.findOne({ busNumber: student.busNumber })
        .populate('routeId').lean();
      if (!bus) {
        bus = await TransportBus.findOne({ status: 'active' }).populate('routeId').lean();
      }
    }

    if (!bus) return res.status(404).json({ success: false, message: 'No bus assigned. Contact transport staff.' });
    res.json({ success: true, message: 'Bus info fetched.', data: bus });
  } catch (err) { next(err); }
});

// Student: poll bus location
router.get('/bus/:busId/location', requireRole('student', 'driver'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser) {
      return res.json({
        success: true,
        message: 'Location fetched (Demo Mode).',
        data: { latitude: 13.0827, longitude: 80.2707, locationName: 'Near Campus Gate' },
        status: 'active',
      });
    }
    await connectDB();
    const bus = await TransportBus.findById(req.params.busId).select('currentLocation status tripStartedAt').lean();
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
    res.json({ success: true, message: 'Location fetched.', data: bus.currentLocation, status: bus.status });
  } catch (err) { next(err); }
});

// Driver: update location
router.post('/location', requireRole('driver'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser) {
      return res.json({ success: true, message: 'Location updated (Demo Mode).' });
    }
    await connectDB();
    const { busId, latitude, longitude, locationName } = req.body;
    const bus = await TransportBus.findOneAndUpdate(
      { _id: busId, driverId: req.user.id },
      { 'currentLocation.latitude': latitude, 'currentLocation.longitude': longitude, 'currentLocation.locationName': locationName, 'currentLocation.updatedAt': new Date() },
      { new: true }
    );
    if (!bus) return res.status(403).json({ success: false, message: 'Bus not found or not assigned to you.' });
    res.json({ success: true, message: 'Location updated.' });
  } catch (err) { next(err); }
});

// Driver: start/end trip
router.patch('/bus/:busId/trip', requireRole('driver'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user.id === 'string' && req.user.id.startsWith('mock_');
    const { action } = req.body; // 'start' | 'end'
    if (!['start', 'end'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Trip action must be start or end.' });
    }
    if (isMockUser) {
      const current = demoDriverTripState.get(req.user.id) || { status: 'active', startedAt: new Date() };
      if (action === 'end' && current.status !== 'active') {
        return res.status(409).json({ success: false, message: 'There is no active trip to end.' });
      }
      const now = new Date();
      const next = action === 'start'
        ? { status: 'active', startedAt: now, endedAt: null }
        : { ...current, status: 'ended', endedAt: now };
      demoDriverTripState.set(req.user.id, next);
      return res.json({
        success: true,
        message: `Trip ${action}ed (Demo Mode).`,
        data: { _id: req.params.busId, tripStatus: next.status, tripStartedAt: next.startedAt, tripEndedAt: next.endedAt },
      });
    }
    await connectDB();
    const now = new Date();
    const update = action === 'start'
      ? { status: 'on_trip', tripStartedAt: now, tripEndedAt: null }
      : { status: 'active', tripEndedAt: now };
    const bus = await TransportBus.findOneAndUpdate(
      { _id: req.params.busId, driverId: req.user.id, ...(action === 'end' ? { status: 'on_trip' } : { status: { $ne: 'on_trip' } }) }, update, { new: true }
    );
    if (!bus) {
      return res.status(409).json({ success: false, message: action === 'end' ? 'There is no active trip to end.' : 'This bus is already on an active trip or is unavailable.' });
    }
    if (action === 'end') {
      await createNotification({
        userId: req.user.id,
        targetRole: 'driver',
        category: 'trip',
        type: 'success',
        title: 'Trip ended',
        body: `${bus.busNumber} trip ended at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
        link: '/driver',
      });
    }
    res.json({ success: true, message: `Trip ${action}ed.`, data: bus });
  } catch (err) { next(err); }
});

// Transport staff / Admin: list all buses
router.get('/', requireRole('admin', 'transport_staff'), async (req, res, next) => {
  try {
    const isMockUser = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser || !isDbConnected()) {
      return res.json({
        success: true,
        message: 'Buses fetched (Demo Mode).',
        data: [
          {
            _id: 'mock_bus_001',
            busNumber: 'BUS-07',
            licensePlate: 'TN-01-AB-1234',
            capacity: 45,
            enrolledStudentIds: [],
            status: 'active',
            routeId: { _id: 'mock_route_001', routeName: 'Route 7 — Central Metro to Campus' },
            driverId: { _id: 'mock_driver_001', name: 'Ramesh Kumar', email: 'driver@campushub.edu' },
          },
          {
            _id: 'mock_bus_002',
            busNumber: 'BUS-12',
            licensePlate: 'TN-01-CD-5678',
            capacity: 50,
            enrolledStudentIds: [],
            status: 'idle',
            routeId: { _id: 'mock_route_002', routeName: 'Route 12 — South Station to Campus' },
            driverId: { _id: 'mock_driver_002', name: 'Suresh Raina', email: 'driver2@campushub.edu' },
          },
        ],
      });
    }
    await connectDB();
    const buses = await TransportBus.find().populate('routeId driverId', 'routeName name email').lean();
    res.json({ success: true, message: 'Buses fetched.', data: buses });
  } catch (err) { next(err); }
});

// Transport staff: create bus
router.post('/', requireRole('admin', 'transport_staff'), async (req, res, next) => {
  try {
    await connectDB();
    const bus = await TransportBus.create(req.body);
    res.status(201).json({ success: true, message: 'Bus created.', data: bus });
  } catch (err) { next(err); }
});

// Transport staff: add/remove student
router.patch('/:busId/students', requireRole('admin', 'transport_staff'), async (req, res, next) => {
  try {
    await connectDB();
    const { studentId, action } = req.body; // action: 'add' | 'remove'
    const update = action === 'add'
      ? { $addToSet: { enrolledStudentIds: studentId } }
      : { $pull: { enrolledStudentIds: studentId } };
    const bus = await TransportBus.findByIdAndUpdate(req.params.busId, update, { new: true });
    res.json({ success: true, message: `Student ${action}ed.`, data: bus });
  } catch (err) { next(err); }
});

// Routes management
router.get('/routes', authenticate, async (req, res, next) => {
  try {
    const isMockUser = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (isMockUser || !isDbConnected()) {
      return res.json({
        success: true,
        message: 'Routes fetched (Demo Mode).',
        data: [
          { _id: 'mock_route_001', routeName: 'Route 7 — Central Metro to Campus', startPoint: 'Central Metro', endPoint: 'Campus Main Gate', isActive: true },
          { _id: 'mock_route_002', routeName: 'Route 12 — South Station to Campus', startPoint: 'South Station', endPoint: 'Campus North Gate', isActive: true },
        ],
      });
    }
    await connectDB();
    const routes = await BusRoute.find({ isActive: true }).lean();
    res.json({ success: true, message: 'Routes fetched.', data: routes });
  } catch (err) { next(err); }
});

router.post('/routes', requireRole('admin', 'transport_staff'), async (req, res, next) => {
  try {
    await connectDB();
    const route = await BusRoute.create(req.body);
    res.status(201).json({ success: true, message: 'Route created.', data: route });
  } catch (err) { next(err); }
});

export default router;
