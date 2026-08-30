import StudentList from '../shared/StudentList';

export default function MentorStudents() {
  return <StudentList basePath="/mentor/students" showDepartmentFilter={false} />;
}
