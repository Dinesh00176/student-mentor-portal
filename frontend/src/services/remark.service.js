import api from './api';

export const getStudentRemarks = (studentId) => api.get(`/remarks/student/${studentId}`);
export const createRemark = (payload) => api.post('/remarks', payload);
export const updateRemark = (id, payload) => api.put(`/remarks/${id}`, payload);
