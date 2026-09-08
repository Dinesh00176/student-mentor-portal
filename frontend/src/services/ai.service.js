import api from './api';

export const generateProgressSummary = (studentId) => api.post(`/ai/summary/${studentId}`);
export const generateMeetingPrep = (studentId) => api.post(`/ai/meeting-prep/${studentId}`);
export const summarizeNotes = (payload) => api.post('/ai/summarize-notes', payload);
