import api from './api';

export const listStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (payload) => api.post('/students', payload);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload);
export const deactivateStudent = (id) => api.delete(`/students/${id}`);
export const assignMentor = (id, mentorUserId, overrideCapacity = false) =>
  api.patch(`/students/${id}/assign-mentor`, { mentorUserId, overrideCapacity });
export const bulkImportStudents = (students) => api.post('/students/bulk-import', { students });
export const getStudentAttention = (id) => api.get(`/students/${id}/attention`);
export const getStudentActivity = (id) => api.get(`/students/${id}/activity`);
