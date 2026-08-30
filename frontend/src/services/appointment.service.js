import api from './api';

export const listAppointments = (params) => api.get('/appointments', { params });
export const createAppointment = (payload) => api.post('/appointments', payload);
export const updateAppointmentStatus = (id, payload) => api.patch(`/appointments/${id}/status`, payload);
