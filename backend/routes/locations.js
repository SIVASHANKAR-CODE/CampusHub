import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import CampusLocation from '../models/CampusLocation.js';

const router = Router();

// All: list/search locations
router.get('/', async (req, res, next) => {
  try {
    await connectDB();
    const { q, category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    let query;
    if (q && q.trim().length >= 2) {
      query = CampusLocation.find({ ...filter, $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      query = CampusLocation.find(filter).sort({ category: 1, name: 1 });
    }
    const locations = await query.limit(50).lean();
    res.json({ success: true, message: 'Locations fetched.', data: locations });
  } catch (err) { next(err); }
});

// Admin: create location
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const loc = await CampusLocation.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Location added.', data: loc });
  } catch (err) { next(err); }
});

// Admin: update
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const loc = await CampusLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Location updated.', data: loc });
  } catch (err) { next(err); }
});

export default router;
