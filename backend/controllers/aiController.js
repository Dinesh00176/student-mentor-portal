/**
 * NON-AGENTIC AI FEATURE: "Mentor Summary Assistant & Academic Synthesizer"
 *
 * Flow (strictly single-shot, user-triggered):
 *   Mentor / Admin clicks "Generate AI Summary"
 *     -> backend gathers ONLY permitted, already-visible data for that student
 *     -> attempts generative AI call (Gemini) with 8s timeout or executes expert Academic Intelligence Synthesizer
 *     -> returns structured executive summary, risk drivers, actionable steps, and talking points
 *     -> the mentor reviews it; nothing is auto-saved, nothing is auto-actioned.
 */
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { assertCanAccessStudent } = require('../services/ownership');
const { getStudentRiskInputs } = require('../services/studentDataAggregator');
const { evaluateStudentAttention } = require('../services/attentionEngine');
const Student = require('../models/Student');
const CounselingSession = require('../models/CounselingSession');
const Intervention = require('../models/Intervention');
const FollowUp = require('../models/FollowUp');

/**
 * Safe external Gemini API caller with strict 8-second timeout and zero credential leaking.
 */
async function callGeminiSafe(prompt, maxTokens = 800, temperature = 0.3) {
  if (!process.env.GEMINI_API_KEY) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const aiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
      signal: AbortSignal.timeout(8000), // 8-second timeout
    });

    if (!aiResponse.ok) {
      console.warn(`[AI Advisory] Gemini API responded with status ${aiResponse.status} (${aiResponse.statusText})`);
      return null;
    }

    const aiData = await aiResponse.json();
    const text = (aiData.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n').trim();
    return text || null;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn('[AI Advisory] Gemini API timed out after 8000ms. Falling back to Academic Intelligence Engine.');
    } else {
      console.warn('[AI Advisory] Gemini API connection issue:', err.message || 'Unknown network error');
    }
    return null;
  }
}

function buildDeterministicSynthesis(permittedData, student) {
  const { attendancePercentage, gpa, arrearCount, attentionStatus, reasons } = permittedData;
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
    provider: 'Academic Intelligence Engine (Deterministic Fallback)',
  };
}

// POST /api/ai/summary/:studentId
const generateProgressSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  await assertCanAccessStudent(req.user, studentId);

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
    recentCounseling: sessions.map((s) => ({ date: s.date, type: s.sessionType, status: s.status, reason: s.reason })),
    recentInterventions: interventions.map((i) => ({ type: i.interventionType, status: i.status, problem: i.problemIdentified })),
  };

  const prompt = `You are an expert academic mentoring advisor for higher education.
Analyze the following student record and provide a structured mentoring brief with these exact 4 sections:
1. Executive Synthesis (concise 2-3 sentences)
2. Key Risk Factors & Triggers (bullet points)
3. Recommended Faculty Action Plan (numbered steps)
4. Suggested Mentoring Conversation Starters (direct quotes the mentor can ask the student)

Do not make medical or psychological diagnoses. Base your insights strictly on the provided factual data.
Student Data:
${JSON.stringify(permittedData, null, 2)}`;

  const aiText = await callGeminiSafe(prompt, 800, 0.3);
  if (aiText) {
    return sendSuccess(res, 200, {
      summary: aiText,
      provider: 'Google Gemini (GenAI)',
      label: 'AI-generated — review before institutional use.',
      basedOn: permittedData,
    }, 'Progress summary generated.');
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

function buildDeterministicMeetingPrep(data, student) {
  const studentName = student.user?.name || student.studentCode;
  const { attendancePercentage, gpa, arrearCount, attentionStatus, recentFollowUps = [] } = data;

  const focusAreas = [];
  if (attendancePercentage !== undefined && attendancePercentage < 75) {
    focusAreas.push(`Attendance recovery plan (currently at ${attendancePercentage}%).`);
  }
  if (arrearCount && arrearCount > 0) {
    focusAreas.push(`Remediation roadmap for ${arrearCount} subject arrear(s).`);
  }
  if (gpa !== null && gpa < 6.0) {
    focusAreas.push('Core academic comprehension and internal test performance.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Career goals, academic milestones, and elective/project exploration.');
  }

  const pendingTasks = recentFollowUps.filter((f) => f.status === 'Pending' || f.status === 'Overdue');
  const pastActionReview = pendingTasks.length > 0
    ? `${pendingTasks.length} pending/overdue follow-up action(s) require review.`
    : 'All previous assigned follow-up commitments are up-to-date.';

  const suggestedQuestions = [
    `"How are you finding the pace and workload across your classes this semester, ${studentName}?"`,
    attendancePercentage < 75
      ? '"Your attendance in some subjects is under 75%. What challenges are impacting your class presence, and how can we assist?"'
      : '"Are there specific technical concepts or subjects where you feel extra faculty or peer support would help?"',
    arrearCount > 0
      ? '"What is your preparation strategy for the upcoming supplementary / arrear examinations?"'
      : '"Have you had time to explore student chapter activities, technical competitions, or projects?"',
    '"What is one concrete academic goal you would like us to track together for the next two weeks?"',
  ];

  const targetCommitments = [
    attendancePercentage < 75 ? 'Achieve 85%+ attendance in all scheduled classes over the next 14 days.' : 'Maintain regular class attendance without unexcused absences.',
    arrearCount > 0 ? 'Meet subject faculty for doubt resolution and submit arrear study schedule.' : 'Complete upcoming internal assessment revisions on schedule.',
    'Confirm next mentoring check-in date before concluding meeting.',
  ];

  const meetingBrief = `### 📋 Meeting Preparation Brief: ${studentName} (${student.studentCode})
**Cohort / Academic Unit:** ${student.department?.name || 'Department'} • Year ${student.year}, Semester ${student.semester}
**Current Status:** ${attentionStatus} | **Attendance:** ${attendancePercentage ?? 'N/A'}% | **GPA:** ${gpa ?? 'N/A'} | **Arrears:** ${arrearCount || 0}

#### 🎯 Key Focus Areas
${focusAreas.map((f) => `• ${f}`).join('\n')}

#### 🔄 Previous Follow-up Status
${pastActionReview}

#### 💬 Suggested Meeting Agenda & Questions
${suggestedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

#### 📝 Recommended Agreed Commitments
${targetCommitments.map((c) => `[ ] ${c}`).join('\n')}`;

  return {
    meetingBrief,
    focusAreas,
    pastActionReview,
    suggestedQuestions,
    targetCommitments,
    provider: 'Academic Intelligence Engine (Deterministic Fallback)',
  };
}

// POST /api/ai/meeting-prep/:studentId
const generateMeetingPreparation = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  await assertCanAccessStudent(req.user, studentId);

  const student = await Student.findById(studentId)
    .populate('user', 'name email')
    .populate('department', 'name code');
  if (!student) throw new ApiError(404, 'Student not found.');

  const inputs = await getStudentRiskInputs(studentId);
  if (!inputs) throw new ApiError(404, 'Student records not found.');
  const attention = evaluateStudentAttention(inputs);

  const [recentFollowUps, recentInterventions] = await Promise.all([
    FollowUp.find({ student: studentId }).sort({ dueDate: -1 }).limit(5),
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
    recentFollowUps: recentFollowUps.map((f) => ({ task: f.task, status: f.status, dueDate: f.dueDate })),
    recentInterventions: recentInterventions.map((i) => ({ type: i.interventionType, status: i.status, problem: i.problemIdentified })),
  };

  const prompt = `You are an expert faculty mentor advisor preparing for an upcoming 1-on-1 meeting with a student.
Provide a concise, practical Meeting Preparation Brief with:
1. Key Focus Areas (2-3 bullets)
2. Previous Follow-up Status Review (1-2 sentences)
3. Suggested Meeting Agenda & Questions (3-4 conversational quotes the mentor can ask)
4. Recommended Agreed Commitments (2-3 realistic action targets)

Data:
${JSON.stringify(permittedData, null, 2)}`;

  const aiText = await callGeminiSafe(prompt, 800, 0.3);
  if (aiText) {
    return sendSuccess(res, 200, {
      meetingBrief: aiText,
      provider: 'Google Gemini (GenAI)',
      label: 'Advisory guidance only — faculty judgment applies.',
      basedOn: permittedData,
    }, 'Meeting preparation brief generated.');
  }

  const result = buildDeterministicMeetingPrep(permittedData, student);
  sendSuccess(res, 200, {
    meetingBrief: result.meetingBrief,
    focusAreas: result.focusAreas,
    pastActionReview: result.pastActionReview,
    suggestedQuestions: result.suggestedQuestions,
    targetCommitments: result.targetCommitments,
    provider: result.provider,
    label: 'Advisory guidance only — faculty judgment applies.',
    basedOn: permittedData,
  }, 'Meeting preparation brief generated.');
});

function buildDeterministicNotesSummary(notes) {
  const lines = notes.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
  const actionItems = [];
  const keyPoints = [];

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.includes('will') || lower.includes('agree') || lower.includes('action') || lower.includes('follow') || lower.includes('submit') || lower.includes('meet') || lower.includes('deadline')) {
      actionItems.push(line.replace(/^[•\-\*]\s*/, ''));
    } else {
      keyPoints.push(line.replace(/^[•\-\*]\s*/, ''));
    }
  });

  const summary = `### 📝 Session Notes Summary
#### Key Discussion Highlights
${(keyPoints.length > 0 ? keyPoints : lines.slice(0, 3)).map((p) => `• ${p}`).join('\n')}

#### Agreed Action Items & Commitments
${(actionItems.length > 0 ? actionItems : ['Continue academic monitoring as discussed.']).map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : lines,
    actionItems: actionItems.length > 0 ? actionItems : ['Continue academic monitoring as discussed.'],
    provider: 'Academic Intelligence Engine (Deterministic Fallback)',
  };
}

// POST /api/ai/summarize-notes
const summarizeNotes = asyncHandler(async (req, res) => {
  const { notes, context } = req.body;
  if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
    throw new ApiError(400, 'Meeting notes text is required for summarization.');
  }

  const prompt = `You are an academic mentor assistant. Summarize the following meeting notes into:
1. Key Discussion Highlights (bullet points)
2. Agreed Action Items & Commitments (numbered list)

Notes:
${notes.trim()}
${context ? `Context: ${context}` : ''}`;

  const aiText = await callGeminiSafe(prompt, 600, 0.2);
  if (aiText) {
    return sendSuccess(res, 200, {
      summary: aiText,
      provider: 'Google Gemini (GenAI)',
      label: 'Advisory guidance only.',
    }, 'Notes summarized.');
  }

  const result = buildDeterministicNotesSummary(notes);
  sendSuccess(res, 200, {
    summary: result.summary,
    keyPoints: result.keyPoints,
    actionItems: result.actionItems,
    provider: result.provider,
    label: 'Advisory guidance only.',
  }, 'Notes summarized.');
});

module.exports = {
  generateProgressSummary,
  generateMeetingPreparation,
  summarizeNotes,
};
