import api from './api';

export const listInterventions = (params) => api.get('/interventions', { params });
export const createIntervention = (payload) => api.post('/interventions', payload);
export const updateInterventionStatus = (id, payload) => api.patch(`/interventions/${id}/status`, payload);
