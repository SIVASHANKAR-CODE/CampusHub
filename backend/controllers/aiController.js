import { connectDB, isDbConnected } from '../config/db.js';
import { detectIntent, isHighRiskAction, retrieveContext } from '../services/aiContextService.js';
import { callAI } from '../services/aiService.js';

/**
 * POST /api/ai/chat
 * Body: { message: string }
 */
export async function chat(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please type a message.' });
    }
    if (message.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long. Keep it under 500 characters.' });
    }

    // 1. Check for high-risk action request
    if (isHighRiskAction(message)) {
      return res.json({
        success: true,
        message: 'Response generated.',
        data: {
          answer: "I can explain how to do this, but I'm not able to perform this action directly. Please use the relevant section of the app, or contact your mentor or admin.",
          isHighRisk: true,
        },
      });
    }

    // 2. Detect intent
    const intent = detectIntent(message);

    // 3. Fast-path: Only connect to MongoDB if user is NOT a demo account and DB is not connected
    const isDemoUser = typeof req.user?.id === 'string' && req.user.id.startsWith('mock_');
    if (!isDemoUser && !isDbConnected()) {
      try {
        await connectDB();
      } catch {
        // If DB fails to connect, we proceed with local knowledge context
        // instead of abruptly failing procedural campus questions!
      }
    }

    // 4. Retrieve grounded context (student's own data + knowledge base)
    const studentUserId = req.user?.role === 'student' ? req.user.id : null;
    const context = await retrieveContext(intent, studentUserId, message, req.user);

    // 5. Generate AI response (immediate deterministic or safe Gemini call)
    const answer = await callAI(message, context);

    res.json({
      success: true,
      message: 'Response generated.',
      data: { answer, intent, isHighRisk: false },
    });
  } catch (err) {
    console.error('[AIController] Error processing chat:', err);
    // Even in unhandled errors, provide a helpful fallback message instead of a broken screen
    res.json({
      success: true,
      message: 'Response generated.',
      data: {
        answer: "I am your CampusHub Assistant. I can help answer questions about your attendance, fees, exams, timetable, leave & OD applications, complaints, clubs, events, library, and campus directions. What would you like to know?",
        intent: 'general_campus',
        isHighRisk: false,
      },
    });
  }
}
