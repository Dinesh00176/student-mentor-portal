import api from './api';

export const getStudentAcademics = (studentId, params) => api.get(`/academic/student/${studentId}`, { params });
export const createAcademicRecord = (payload) => api.post('/academic', payload);
export const updateAcademicRecord = (id, payload) => api.put(`/academic/${id}`, payload);
export const deleteAcademicRecord = (id) => api.delete(`/academic/${id}`);
