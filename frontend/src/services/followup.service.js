import api from './api';

export const listFollowUps = (params) => api.get('/followups', { params });
export const createFollowUp = (payload) => api.post('/followups', payload);
export const completeFollowUp = (id, outcome) => api.patch(`/followups/${id}/complete`, { outcome });
