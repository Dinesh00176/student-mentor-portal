import api from './api';

export const generateProgressSummary = (studentId) => api.post(`/ai/summary/${studentId}`);
