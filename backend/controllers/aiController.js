/**
 * OPTIONAL, NON-AGENTIC AI FEATURE: "Mentor Summary Assistant" (Google Gemini)
 *
 * Flow (strictly single-shot, user-triggered):
 *   Mentor clicks "Generate Progress Summary"
 *     -> backend gathers ONLY permitted, already-visible data for that student
 *     -> one request is sent to the AI provider
 *     -> the raw text response is returned to the client, labeled
 *        "AI-generated - review before use."
 *     -> the mentor reviews it; nothing is auto-saved, nothing is auto-actioned.
 *
 * There is no agent loop, no autonomous scheduling, no background job, and the
 * AI never writes to the database or contacts a student directly.
 */
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { assertMentorOwnsStudent } = require('../services/ownership');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');

// POST /api/ai/summary/:studentId
const generateProgressSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, studentId);

  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(400, 'AI summary is not configured on this server. Set GEMINI_API_KEY to enable it.');
  }

  const inputs = await getStudentRiskInputs(studentId);
  if (!inputs) throw new ApiError(404, 'Student not found.');
  const attention = evaluateStudentAttention(inputs);

  const [sessions, interventions] = await Promise.all([
    CounselingSession.find({ student: studentId }).sort({ date: -1 }).limit(5),
    Intervention.find({ student: studentId }).sort({ createdAt: -1 }).limit(5),
  ]);

  const permittedData = {
    attendancePercentage: attention.signals.attendancePercentage,
    attendanceStatus: attention.signals.attendanceStatus,
    gpa: attention.signals.gpa,
    arrearCount: attention.signals.arrearCount,
    attentionStatus: attention.status,
    reasons: attention.reasons,
    recentCounseling: sessions.map((s) => ({ date: s.date, status: s.status, reason: s.reason })),
    recentInterventions: interventions.map((i) => ({ status: i.status, problemIdentified: i.problemIdentified })),
  };

  const prompt = `You are assisting a college mentor. Using ONLY the structured data below, write a concise,
factual, 4-6 sentence progress summary of this student for the mentor's own review. Do not diagnose,
predict future behavior, or make clinical/psychological claims - describe only what the data shows and
suggest general, practical next steps a mentor might consider. Data:\n${JSON.stringify(permittedData, null, 2)}`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
      }),
    }
  );

  if (!response.ok) {
    throw new ApiError(502, 'The AI summary service could not be reached. Please try again later.');
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim();

  sendSuccess(res, 200, {
    summary: text || 'No summary could be generated from the available data.',
    label: 'AI-generated — review before use.',
    basedOn: permittedData,
  }, 'Progress summary generated.');
});

module.exports = { generateProgressSummary };
