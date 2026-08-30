import api from './api';

export const listCounselors = (params) => api.get('/counselors', { params });
export const createCounselor = (payload) => api.post('/counselors', payload);
export const updateCounselor = (id, payload) => api.put(`/counselors/${id}`, payload);
export const updateCounselorStatus = (id, status) => api.patch(`/counselors/${id}/status`, { status });
export const deactivateCounselor = (id) => api.delete(`/counselors/${id}`);
