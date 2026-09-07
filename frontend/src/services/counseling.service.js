import api from './api';

export const listCounselingSessions = (params) => api.get('/counseling', { params });
export const createCounselingSession = (payload) => api.post('/counseling', payload);
export const updateCounselingSession = (id, payload) => api.put(`/counseling/${id}`, payload);
