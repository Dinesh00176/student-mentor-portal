/**
 * NON-AGENTIC AI FEATURE: "Mentor Summary Assistant & Academic Synthesizer"
 *
 * Flow (strictly single-shot, user-triggered):
 *   Mentor / Admin clicks "Generate AI Summary"
 *     -> backend gathers ONLY permitted, already-visible data for that student
 *     -> attempts generative AI call (Gemini) or executes expert Academic Intelligence Synthesizer
 *     -> returns structured executive summary, risk drivers, actionable steps, and talking points
 *     -> the mentor reviews it; nothing is auto-saved, nothing is auto-actioned.
 */
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { assertMentorOwnsStudent } = require('../services/ownership');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const Student = require('../models/Student');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');

function buildDeterministicSynthesis(permittedData, student) {
  const { attendancePercentage, gpa, arrearCount, attentionStatus, reasons, recentCounseling, recentInterventions } = permittedData;
  const studentName = student?.user?.name || student?.studentCode || 'the student';

  // 1. Executive Summary
  let executiveSummary = '';
  if (attentionStatus === 'High Priority') {
    executiveSummary = `${studentName} is currently classified under High Priority with critical intervention triggers. The student maintains an overall attendance of ${attendancePercentage || 0}%, a GPA of ${gpa ?? 'N/A'}, and has ${arrearCount || 0} active subject arrears. Immediate faculty check-in and coordinated wellness follow-up are strongly recommended.`;
  } else if (attentionStatus === 'Needs Attention') {
    executiveSummary = `${studentName} is flagged as Needs Attention due to early warning indicators. Current attendance stands at ${attendancePercentage || 0}% with a GPA of ${gpa ?? 'N/A'}. Proactive mentoring at this stage can prevent further academic or attendance deterioration.`;
  } else {
    executiveSummary = `${studentName} demonstrates stable academic and attendance progression. With an attendance rate of ${attendancePercentage || 0}% and a GPA of ${gpa ?? 'N/A'}, the student is meeting institutional benchmarks. Continue standard semester milestone monitoring.`;
  }

  // 2. Risk Drivers
  const riskDrivers = [];
  if (attendancePercentage !== undefined && attendancePercentage < 75) {
    riskDrivers.push(`Attendance (${attendancePercentage}%) has dropped below the mandatory 75% institutional safety threshold.`);
  } else if (attendancePercentage !== undefined && attendancePercentage < 80) {
    riskDrivers.push(`Attendance (${attendancePercentage}%) is approaching the border zone (75-80%).`);
  }
  if (arrearCount && arrearCount > 0) {
    riskDrivers.push(`Accumulated ${arrearCount} course arrear(s) requiring remediation and exam reattempt planning.`);
  }
  if (gpa !== null && gpa < 6.0) {
    riskDrivers.push(`Semester GPA (${gpa}) indicates difficulty with core coursework.`);
  }
  if (reasons && reasons.length > 0) {
    reasons.forEach((r) => {
      if (!riskDrivers.some((d) => d.toLowerCase().includes(r.toLowerCase()))) {
        riskDrivers.push(r);
      }
    });
  }
  if (riskDrivers.length === 0) {
    riskDrivers.push('No critical academic or attendance risks identified.');
  }

  // 3. Action Items
  const actionItems = [];
  if (attentionStatus === 'High Priority') {
    actionItems.push('Schedule an in-person 1-on-1 mentoring meeting within 3 business days.');
    actionItems.push('Assign a departmental peer tutor or enroll in structured remedial classes.');
    actionItems.push('Verify if a wellness counseling referral is needed for stress or personal challenges.');
  } else if (attentionStatus === 'Needs Attention') {
    actionItems.push('Conduct an informal check-in regarding recent attendance dips.');
    actionItems.push('Review weekly study timetable and identify problematic subject topics.');
    actionItems.push('Set milestone goals for the upcoming internal assessment cycle.');
  } else {
    actionItems.push('Acknowledge positive academic performance during periodic review.');
    actionItems.push('Encourage participation in technical co-curricular activities or student projects.');
  }

  // 4. Talking Points
  const talkingPoints = [];
  if (attendancePercentage !== undefined && attendancePercentage < 75) {
    talkingPoints.push(`"I noticed your attendance is at ${attendancePercentage}%. Are there any specific morning scheduling or commuting issues we can help address?"`);
  }
  if (arrearCount && arrearCount > 0) {
    talkingPoints.push(`"Let's create a focused preparation plan for clearing your arrear subjects during the next exam window."`);
  }
  talkingPoints.push(`"How are you managing your overall study load and assignment deadlines this semester?"`);
  talkingPoints.push(`"What additional support or resources from the department would be most helpful for you right now?"`);

  const followUpInterval = attentionStatus === 'High Priority' ? '3–5 business days' : attentionStatus === 'Needs Attention' ? '7–10 days' : '30 days (Regular Cycle)';

  const formattedText = `### 📊 Executive Synthesis
${executiveSummary}

### ⚠️ Key Risk Factors & Triggers
${riskDrivers.map((d) => `• ${d}`).join('\n')}

### 💡 Recommended Faculty Action Plan
${actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}

### 💬 Suggested Mentoring Conversation Starters
${talkingPoints.map((tp) => `> ${tp}`).join('\n\n')}

**Recommended Check-in Window:** ${followUpInterval}`;

  return {
    summary: formattedText,
    executiveSummary,
    riskDrivers,
    actionItems,
    talkingPoints,
    followUpInterval,
    provider: 'Academic Intelligence Engine',
  };
}

// POST /api/ai/summary/:studentId
const generateProgressSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role === 'mentor') await assertMentorOwnsStudent(req.user, studentId);

  const student = await Student.findById(studentId).populate('user', 'name email');
  if (!student) throw new ApiError(404, 'Student not found.');

  const inputs = await getStudentRiskInputs(studentId);
  if (!inputs) throw new ApiError(404, 'Student records not found.');
  const attention = evaluateStudentAttention(inputs);

  const [sessions, interventions] = await Promise.all([
    CounselingSession.find({ student: studentId }).sort({ date: -1 }).limit(5),
    Intervention.find({ student: studentId }).sort({ createdAt: -1 }).limit(5),
  ]);

  const permittedData = {
    studentName: student.user?.name || student.studentCode,
    studentCode: student.studentCode,
    department: student.department?.name,
    year: student.year,
    semester: student.semester,
    attendancePercentage: attention.signals.attendancePercentage,
    attendanceStatus: attention.signals.attendanceStatus,
    gpa: attention.signals.gpa,
    arrearCount: attention.signals.arrearCount,
    attentionStatus: attention.status,
    reasons: attention.reasons,
    recentCounseling: sessions.map((s) => ({ date: s.date, status: s.status, reason: s.reason, sessionType: s.sessionType })),
    recentInterventions: interventions.map((i) => ({ status: i.status, problemIdentified: i.problemIdentified, interventionType: i.interventionType })),
  };

  // Try generative AI provider if key is configured, else fallback to deterministic engine
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an expert university academic mentor assistant.
Analyze the following student record and provide a structured mentoring brief with these exact 4 sections:
1. Executive Synthesis (concise 2-3 sentences)
2. Key Risk Factors & Triggers (bullet points)
3. Recommended Faculty Action Plan (numbered steps)
4. Suggested Mentoring Conversation Starters (direct quotes the mentor can ask the student)

Do not make medical or psychological diagnoses. Base your insights strictly on the provided factual data.
Student Data:
${JSON.stringify(permittedData, null, 2)}`;

      const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
          }),
        }
      );

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const text = (aiData.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim();
        if (text) {
          return sendSuccess(res, 200, {
            summary: text,
            provider: 'Google Gemini (GenAI)',
            label: 'AI-generated — review before institutional use.',
            basedOn: permittedData,
          }, 'Progress summary generated.');
        }
      }
    } catch (err) {
      // Fallback silently to deterministic synthesis on API error
    }
  }

  const result = buildDeterministicSynthesis(permittedData, student);
  sendSuccess(res, 200, {
    summary: result.summary,
    executiveSummary: result.executiveSummary,
    riskDrivers: result.riskDrivers,
    actionItems: result.actionItems,
    talkingPoints: result.talkingPoints,
    followUpInterval: result.followUpInterval,
    provider: result.provider,
    label: 'AI-generated — review before institutional use.',
    basedOn: permittedData,
  }, 'Progress summary generated.');
});

module.exports = { generateProgressSummary };
