// Simple, transparent GPA/CGPA calculation from AcademicRecord documents.
// gradePoint is stored per-subject (0-10 scale); GPA = credit-weighted average for a semester.

function computeSemesterGPA(records) {
  const relevant = records.filter((r) => typeof r.gradePoint === 'number' && r.credits);
  if (!relevant.length) return null;
  const totalCredits = relevant.reduce((sum, r) => sum + r.credits, 0);
  if (!totalCredits) return null;
  const weighted = relevant.reduce((sum, r) => sum + r.gradePoint * r.credits, 0);
  return Math.round((weighted / totalCredits) * 100) / 100;
}

// records: all AcademicRecord docs for a student across semesters
function computeCGPA(records) {
  return computeSemesterGPA(records); // same credit-weighted formula, just fed all records
}

function computeSemesterTrend(records) {
  const bySemester = {};
  records.forEach((r) => {
    if (!bySemester[r.semester]) bySemester[r.semester] = [];
    bySemester[r.semester].push(r);
  });
  return Object.keys(bySemester)
    .map(Number)
    .sort((a, b) => a - b)
    .map((sem) => ({
      semester: sem,
      gpa: computeSemesterGPA(bySemester[sem]),
      arrears: bySemester[sem].filter((r) => r.isArrear).length,
      subjectCount: bySemester[sem].length,
    }));
}

module.exports = { computeSemesterGPA, computeCGPA, computeSemesterTrend };
