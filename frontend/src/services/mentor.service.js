import api from './api';

export const listMentors = (params) => api.get('/mentors', { params });
export const getMentor = (id) => api.get(`/mentors/${id}`);
export const createMentor = (payload) => api.post('/mentors', payload);
export const updateMentor = (id, payload) => api.put(`/mentors/${id}`, payload);
export const updateMentorStatus = (id, status) => api.patch(`/mentors/${id}/status`, { status });
export const deactivateMentor = (id) => api.delete(`/mentors/${id}`);
