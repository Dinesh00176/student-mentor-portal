import api from './api';

export const listStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (payload) => api.post('/students', payload);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload);
export const deactivateStudent = (id) => api.delete(`/students/${id}`);
export const assignMentor = (id, mentorUserId) => api.patch(`/students/${id}/assign-mentor`, { mentorUserId });
export const getStudentAttention = (id) => api.get(`/students/${id}/attention`);
export const getStudentActivity = (id) => api.get(`/students/${id}/activity`);
