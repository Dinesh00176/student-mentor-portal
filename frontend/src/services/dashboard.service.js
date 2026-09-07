import api from './api';

export const getMentorDashboard = () => api.get('/dashboard/mentor');
export const getAdminDashboard = () => api.get('/dashboard/admin');
export const getStudentDashboard = () => api.get('/dashboard/student');
export const getCounselorDashboard = () => api.get('/dashboard/counselor');
