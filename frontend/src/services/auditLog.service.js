import api from './api';

export const listAuditLogs = (params) => api.get('/audit-logs', { params });
