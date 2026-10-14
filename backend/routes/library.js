import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { connectDB } from '../config/db.js';
import LibraryBook from '../models/LibraryBook.js';

const router = Router();

const DEMO_BOOKS = [
  { _id: 'demo-book-dsa', title: 'Data Structures and Algorithms', author: 'Thomas H. Cormen', isbn: '9780262046305', subject: 'Computer Science', shelf: 'C-12', availableCopies: 4, totalCopies: 6, isActive: true },
  { _id: 'demo-book-os', title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '9781119800361', subject: 'Operating Systems', shelf: 'C-18', availableCopies: 2, totalCopies: 5, isActive: true },
  { _id: 'demo-book-networks', title: 'Computer Networks', author: 'Andrew S. Tanenbaum', isbn: '9780132126953', subject: 'Computer Networks', shelf: 'C-22', availableCopies: 3, totalCopies: 4, isActive: true },
];

// Public: search books
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter at least 2 characters to search.' });
    }
    if (!process.env.MONGODB_URI) {
      const books = DEMO_BOOKS.filter((book) => `${book.title} ${book.author} ${book.isbn} ${book.subject}`.toLowerCase().includes(q.trim().toLowerCase()));
      return res.json({ success: true, message: books.length ? 'Books found (Demo Mode).' : 'No books found matching your search.', data: books });
    }
    try { await connectDB(); } catch {
      const books = DEMO_BOOKS.filter((book) => `${book.title} ${book.author} ${book.isbn} ${book.subject}`.toLowerCase().includes(q.trim().toLowerCase()));
      return res.json({ success: true, message: books.length ? 'Books found (Demo Mode).' : 'No books found matching your search.', data: books });
    }
    const books = await LibraryBook.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(20).lean();
    res.json({ success: true, message: books.length ? 'Books found.' : 'No books found matching your search.', data: books });
  } catch (err) { next(err); }
});

// Public: list books
router.get('/', async (req, res, next) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    if (!process.env.MONGODB_URI) {
      const books = DEMO_BOOKS.filter((book) => !subject || book.subject.toLowerCase().includes(String(subject).toLowerCase()));
      return res.json({ success: true, message: 'Books fetched (Demo Mode).', data: { books, total: books.length, page: Number(page), pages: Math.ceil(books.length / Number(limit)) } });
    }
    try { await connectDB(); } catch {
      const books = DEMO_BOOKS.filter((book) => !subject || book.subject.toLowerCase().includes(String(subject).toLowerCase()));
      return res.json({ success: true, message: 'Books fetched (Demo Mode).', data: { books, total: books.length, page: Number(page), pages: Math.ceil(books.length / Number(limit)) } });
    }
    const filter = { isActive: true };
    if (subject) filter.subject = new RegExp(subject, 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [books, total] = await Promise.all([
      LibraryBook.find(filter).sort({ title: 1 }).skip(skip).limit(parseInt(limit)).lean(),
      LibraryBook.countDocuments(filter),
    ]);
    res.json({ success: true, message: 'Books fetched.', data: { books, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) { next(err); }
});

// Admin: add book
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const book = await LibraryBook.create({ ...req.body, lastUpdatedBy: req.user.id });
    res.status(201).json({ success: true, message: 'Book added.', data: book });
  } catch (err) { next(err); }
});

// Admin: update book
router.patch('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await connectDB();
    const book = await LibraryBook.findByIdAndUpdate(
      req.params.id, { ...req.body, lastUpdatedBy: req.user.id }, { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Book updated.', data: book });
  } catch (err) { next(err); }
});

export default router;
