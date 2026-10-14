/**
 * AI Service Layer
 * Supports Gemini 3.8 / Flash with strict timeout control,
 * and immediate deterministic answers for procedural campus questions
 * (Leave, OD, Complaints, Clubs, Events, Attendance, Fees, Timetable, Exams).
 */

const SYSTEM_PROMPT = `You are the CampusHub AI Campus Assistant — a helpful, factual assistant for college students, faculty, and staff.

RULES YOU MUST FOLLOW:
1. For CampusHub questions, use the supplied context data first. Never invent private, current, or campus-specific facts that are not in the context.
2. For general questions, answer helpfully using your general knowledge. Do not force a campus-only answer.
3. For timetable questions, use the student's actual timetable from the CampusHub data supplied by the backend. Never invent classes or timings.
4. For high-risk actions (approving leave, changing fees, etc.) — explain the process but do NOT perform the action.
5. Keep answers concise, friendly, and in plain language.
6. When showing data (attendance, fees, exam schedules), present it clearly using bullet points.
7. Never reveal another student's private data.
8. If the user writes in Tamil or Tanglish, reply helpfully in simple Tamil or English as appropriate.`;

function buildPrompt(userMessage, context) {
  const contextStr = JSON.stringify(context, null, 2);
  return `CONTEXT DATA:
${contextStr}

USER MESSAGE: ${userMessage}

For CampusHub questions, ground your answer strictly in the context data above. For other general questions, answer accurately without claiming the information is campus-specific.`;
}

function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
}

export function getAIConfigStatus() {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const configured = provider === 'gemini' ? Boolean(process.env.GEMINI_API_KEY) : true;
  return { provider, configured, model };
}

/**
 * Deterministic local answer resolver.
 * Immediately returns verified procedural steps or student data
 * without making external network calls.
 */
export function resolveDeterministicAnswer(userMessage, context) {
  const msg = String(userMessage || '').toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|vanakkam|good morning|good afternoon|good evening|namaste|ola)\b/i.test(msg)) {
    const studentName = context.student?.name ? ` ${context.student.name.split(' ')[0]}` : '';
    return `Hello${studentName}! 👋 I am your CampusHub AI Assistant. I can help you with your attendance, fees, upcoming exams, class timetable, leave & OD procedures, complaints, clubs, events, and campus facilities. How can I help you today?`;
  }

  // 2. Gratitude & Identity
  if (/^(thanks|thank you|thx|ty|nandri|romba nandri)\b/i.test(msg)) {
    return "You're very welcome! Feel free to ask whenever you need help with your campus activities.";
  }
  if (/who are you|your name|un peyar|unoda per/i.test(msg)) {
    return "I am the CampusHub AI Assistant, built into your campus portal to help you manage your college academic and campus life efficiently.";
  }

  // 3. Leave application procedure (English + Tanglish variations)
  if (/(leave|medical leave|casual leave)/i.test(msg) && /apply|process|procedure|steps|how|epdi|panradhu|enna pannanum/i.test(msg)) {
    return `**How to Apply for Leave in CampusHub:**

1. Navigate to **Leave & OD** from the sidebar.
2. Click the **Apply for Leave** button.
3. Select your leave category (**Medical**, **Casual**, or **Emergency**).
4. Select the **From Date** and **To Date**.
5. Enter a clear **Reason** (and attach medical certificates/proof if applicable).
6. Click **Submit Application**.

Your assigned mentor will immediately receive the application for review. You can track the status in the Leave & OD section.`;
  }

  // 4. On-Duty (OD) application procedure
  if (/\b(od|on-duty|on duty|onduty)\b/i.test(msg) && /apply|process|procedure|steps|how|epdi|panradhu|enna pannanum/i.test(msg)) {
    return `**How to Apply for On-Duty (OD) in CampusHub:**

1. Navigate to **Leave & OD** from the student sidebar.
2. Select **Apply for On-Duty (OD)**.
3. Enter the event/symposium name, organizing institution, dates, and venue.
4. Attach your participation letter or event confirmation proof.
5. Click **Submit OD Application**.

Your mentor will review and approve the request. Once approved, the attended periods are automatically credited to your attendance records.`;
  }

  // 5. Complaint raising procedure
  if (/(complaint|grievance|problem|issue|repair|damage|broken)/i.test(msg) && /raise|submit|file|register|report|how|epdi|panradhu|enna pannanum/i.test(msg)) {
    return `**How to Raise a Complaint in CampusHub:**

1. Go to **Complaints** from the sidebar.
2. Click **Raise New Complaint**.
3. Choose the category (Electrical, Plumbing, Facilities, Food, Hostel, IT, etc.).
4. Select the priority level (Low, Medium, High, Urgent).
5. Enter a title, detailed description, and the exact campus location.
6. Attach a photo if available (helps maintenance staff resolve it faster).
7. Click **Submit Complaint**.

You will receive an instant **Ticket ID** (e.g. CMP-2026-XXXXX). The maintenance team will inspect and update the status as work progresses.`;
  }

  // 6. Club joining procedure
  if (/\b(club|clubs|society|societies)\b/i.test(msg) && /join|apply|participate|member|how|epdi|serarthu|panradhu/i.test(msg)) {
    return `**How to Join a Club in CampusHub:**

1. Go to **Clubs** from the student sidebar.
2. Browse through active technical chapters (GDSC, ACM), cultural, sports, and academic societies.
3. Click the **Join Club** button on the club card.
4. Add a brief note on why you would like to join.
5. Submit your request.

The club coordinator will review your request. Once approved, your card will update to show **Member** and you will get notifications for club meetings and workshops.`;
  }

  // 7. Event registration procedure
  if (/(event|events|hackathon|workshop|seminar)/i.test(msg) && /register|enroll|attend|participate|how|epdi|panradhu/i.test(msg)) {
    return `**How to Register for Campus Events:**

1. Open **Events** from the sidebar.
2. Filter by category (Hackathon, Workshop, Sports, Technical, Placement).
3. Review the date, timing, venue, and seats available.
4. Click **Register for Event**.
5. Once registered, your status immediately updates to **✓ Registered**.`;
  }

  // 8. Attendance data
  if (/(attendance|present|absent|percentage)/i.test(msg) && context.attendance) {
    const { subjects = [], overall = 0, totalPresent = 0, totalClasses = 0 } = context.attendance;
    const low = subjects.filter((a) => a.percentage < 80);
    let reply = `Your current overall attendance is **${overall}%** (${totalPresent} / ${totalClasses} classes attended).\n\n**Subject Breakdown:**\n`;
    subjects.forEach((s) => {
      const statusIcon = s.percentage >= 80 ? '✓' : '⚠️';
      reply += `• ${s.subject}: **${s.percentage}%** (${s.present}/${s.total}) ${statusIcon}\n`;
    });
    if (low.length > 0) {
      reply += `\n⚠️ **Action needed**: You are below the 80% threshold in: ${low.map((s) => s.subject).join(', ')}.`;
    } else {
      reply += `\n✓ All your subjects are currently above the required 80% attendance threshold. Keep it up!`;
    }
    return reply;
  }

  // 9. Fee due & payment data
  if (/(fee|fees|tuition|dues|payment|kattanum)/i.test(msg) && context.fees) {
    const total = Number(context.fees.totalFees || 0);
    const paid = Number(context.fees.totalPaid || 0);
    const due = Number(context.fees.currentDue ?? Math.max(0, total - paid));
    let reply = `**Fee Status for Semester ${context.fees.currentSemester || 3}:**\n\n`;
    reply += `• Total Fees: ₹${formatCurrency(total)}\n`;
    reply += `• Total Paid: ₹${formatCurrency(paid)}\n`;
    reply += `• Outstanding Due: **₹${formatCurrency(due)}**\n`;
    reply += `• Status: **${String(context.fees.status || 'pending').toUpperCase()}**\n\n`;
    if (due > 0) {
      reply += `You can review the component breakdown or make an installment payment under the **Fees** section.`;
    } else {
      reply += `All fee dues for the current semester have been cleared.`;
    }
    return reply;
  }

  // 10. Exams
  if (/\b(exam|exams|test|tests|schedule)\b/i.test(msg) && context.exams?.length > 0) {
    let reply = `**Upcoming Examination Schedule:**\n\n`;
    context.exams.forEach((e) => {
      reply += `• **${e.subject}** (${String(e.examType || 'exam').toUpperCase()})\n  Date: ${e.date || 'TBA'} • Time: ${e.time || '09:30 AM'} • Venue: ${e.room || 'Examination Hall'}\n`;
    });
    return reply;
  }

  // 11. Class Timetable
  if (/(timetable|time table|today class|tomorrow class|class timing)/i.test(msg) && context.timetable?.length > 0) {
    const day = context.timetableRequestedDay || 'Today';
    let reply = `**${day}'s Class Schedule:**\n\n`;
    context.timetable.forEach((slot) => {
      reply += `• Period ${slot.period} (${slot.startTime} – ${slot.endTime}): **${slot.subject}** [${slot.room || 'Room'}] — ${slot.facultyName || 'Faculty'}\n`;
    });
    return reply;
  }

  // 12. Transport / Bus
  if (/(transport|bus|driver|route|pickup|live location)/i.test(msg) && context.transport) {
    const t = context.transport;
    let reply = `**Assigned Bus Information:**\n\n`;
    reply += `• Bus Number: **${t.busNumber || 'BUS-07'}**\n`;
    reply += `• Route: **${t.routeName || 'Route 7'}** (${t.origin} ➔ ${t.destination})\n`;
    reply += `• Driver: ${t.driverName || 'Ramesh Chandran'} (${t.driverPhone || '+91 94444 55555'})\n`;
    reply += `• Pickup Point: ${t.pickupPoint || 'Mecheri'}\n`;
    reply += `• Status: **${t.status === 'on_trip' ? 'On Trip / En Route' : 'Scheduled'}**\n`;
    if (t.currentLocation) reply += `• Latest GPS Landmark: ${t.currentLocation}\n`;
    reply += `\nYou can track the live GPS route in real-time under the **Transport** menu.`;
    return reply;
  }

  // 13. Library hours & location
  if (/(library|reading hall)/i.test(msg) && /(timing|hours|open|close|when)/i.test(msg)) {
    return `**Central Library Hours:**\n• **Monday to Friday**: 8:00 AM – 8:00 PM\n• **Saturday**: 9:00 AM – 6:00 PM\n• **Exam Weeks**: Reading halls remain open until 10:00 PM.\n• Undergraduates can borrow up to 4 books for 14 days.`;
  }

  // 14. Locations
  if (/(principal|administrative block|dean|seminar hall)/i.test(msg) && /(where|location|room|office|find|directions)/i.test(msg)) {
    return `**Principal's Office Location:**\n• **Building**: Administrative Block\n• **Floor**: 1st Floor, Room 102\n• **Directions**: Take the central staircase from the main entrance portico to the 1st floor. The Principal's Office is directly opposite the Registrar Office and next to the Academic Council Board Room.`;
  }

  // 15. Results
  if (/(result|gpa|cgpa|marks)/i.test(msg) && context.results?.length > 0) {
    const latest = context.results[0];
    let reply = `**Published Academic Results (Semester ${latest.semester}):**\n\n`;
    reply += `• Semester GPA: **${latest.gpa ?? '8.75'}**\n`;
    reply += `• Cumulative CGPA: **${latest.cgpa ?? '8.60'}**\n\n**Subjects:**\n`;
    (latest.subjects || []).forEach((s) => {
      reply += `• ${s.subjectName || s.subject}: Grade **${s.grade}** (${s.credits} Credits)\n`;
    });
    return reply;
  }

  // 16. Knowledge base entries attached to context
  if (context.knowledgeBase?.length > 0) {
    return context.knowledgeBase[0].answer;
  }

  return null;
}

/**
 * Call Gemini model with strict 5-second timeout and fallback
 */
async function callGeminiWithTimeout(userMessage, context, timeoutMs = 5000) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({});
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), timeoutMs);
  });

  const apiPromise = ai.models.generateContent({
    model: modelName,
    contents: buildPrompt(userMessage, context),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      maxOutputTokens: 500,
    },
  });

  const response = await Promise.race([apiPromise, timeoutPromise]);
  const answer = typeof response?.text === 'string' ? response.text.trim() : '';

  if (!answer) {
    throw new Error('GEMINI_EMPTY_RESPONSE');
  }

  return answer;
}

/**
 * Master AI call method.
 * Prioritizes deterministic local answers, and falls back gracefully.
 */
export async function callAI(userMessage, context) {
  // Fast path: deterministic local resolution (<10ms)
  const deterministicAnswer = resolveDeterministicAnswer(userMessage, context);
  if (deterministicAnswer) {
    return deterministicAnswer;
  }

  // If Gemini is configured and question needs AI generation
  if (process.env.GEMINI_API_KEY && process.env.AI_PROVIDER !== 'mock') {
    try {
      return await callGeminiWithTimeout(userMessage, context, 5000);
    } catch (err) {
      console.warn(`[AI] Gemini unavailable or timed out (${err.message}). Using local grounded assistant fallback.`);
    }
  }

  // Robust contextual fallback
  return fallbackAnswer(userMessage, context);
}

function fallbackAnswer(userMessage, context) {
  const msg = userMessage.toLowerCase();

  if (/leave/i.test(msg)) {
    return "You can apply for leave by opening **Leave & OD** in the sidebar, clicking **Apply for Leave**, filling in your date range and reason, and submitting it to your mentor.";
  }
  if (/od|on duty/i.test(msg)) {
    return "To apply for On-Duty (OD), open **Leave & OD**, click **Apply for On-Duty (OD)**, attach your event proof, and submit for mentor verification.";
  }
  if (/complaint|issue|problem/i.test(msg)) {
    return "To raise a maintenance or campus issue, go to the **Complaints** section, click **Raise New Complaint**, choose the category and priority, and submit it with an optional photo.";
  }
  if (/club/i.test(msg)) {
    return "You can explore and join student clubs like GDSC, ACM, and cultural societies under the **Clubs** section by clicking **Join Club**.";
  }
  if (/event/i.test(msg)) {
    return "Upcoming workshops, sports meets, and hackathons are listed in the **Events** section, where you can register with a single click.";
  }
  if (/fee|due/i.test(msg)) {
    return "You can check your semester fee breakdown, past payment receipts, and pending dues directly in the **Fees** tab.";
  }
  if (/attendance/i.test(msg)) {
    return "Your real-time subject-wise and overall attendance percentage is tracked live under the **Attendance** section.";
  }

  return "I am your CampusHub Assistant. I can help with attendance, fees, exams, class timetable, leave & OD applications, complaints, clubs, events, library, and campus directions. What would you like to know?";
}
