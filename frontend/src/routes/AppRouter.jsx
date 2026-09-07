import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppShell from '../layouts/AppShell';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';
import Forbidden from '../pages/Forbidden';

import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminStudents from '../pages/admin/AdminStudents';
import AdminMentors from '../pages/admin/AdminMentors';
import AdminCounselors from '../pages/admin/AdminCounselors';
import AdminDepartments from '../pages/admin/AdminDepartments';
import AdminReports from '../pages/admin/AdminReports';
import AdminAuditLog from '../pages/admin/AdminAuditLog';

import MentorDashboard from '../pages/mentor/MentorDashboard';
import MentorStudents from '../pages/mentor/MentorStudents';
import MentorCounseling from '../pages/mentor/MentorCounseling';
import MentorInterventions from '../pages/mentor/MentorInterventions';
import MentorFollowUps from '../pages/mentor/MentorFollowUps';

import CounselorDashboard from '../pages/counselor/CounselorDashboard';
import CounselorCases from '../pages/counselor/CounselorCases';

import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfileSelf from '../pages/student/StudentProfileSelf';
import StudentCounseling from '../pages/student/StudentCounseling';
import StudentInterventions from '../pages/student/StudentInterventions';
import StudentAppointments from '../pages/student/StudentAppointments';

import StudentProfile from '../pages/shared/StudentProfile';
import AppointmentManager from '../pages/shared/AppointmentManager';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/403" element={<Forbidden />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/:id" element={<StudentProfile />} />
            <Route path="/admin/mentors" element={<AdminMentors />} />
            <Route path="/admin/counselors" element={<AdminCounselors />} />
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/audit-log" element={<AdminAuditLog />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
          <Route element={<AppShell />}>
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/mentor/students" element={<MentorStudents />} />
            <Route path="/mentor/students/:id" element={<StudentProfile />} />
            <Route path="/mentor/counseling" element={<MentorCounseling />} />
            <Route path="/mentor/interventions" element={<MentorInterventions />} />
            <Route path="/mentor/followups" element={<MentorFollowUps />} />
            <Route path="/mentor/appointments" element={<AppointmentManager />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['counselor']} />}>
          <Route element={<AppShell />}>
            <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
            <Route path="/counselor/cases" element={<CounselorCases />} />
            <Route path="/counselor/appointments" element={<AppointmentManager />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<AppShell />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfileSelf />} />
            <Route path="/student/counseling" element={<StudentCounseling />} />
            <Route path="/student/interventions" element={<StudentInterventions />} />
            <Route path="/student/appointments" element={<StudentAppointments />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
