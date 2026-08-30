import api from './api';

export const getStudentAttendance = (studentId, params) => api.get(`/attendance/student/${studentId}`, { params });
export const createAttendanceRecord = (payload) => api.post('/attendance', payload);
export const updateAttendanceRecord = (id, payload) => api.put(`/attendance/${id}`, payload);
