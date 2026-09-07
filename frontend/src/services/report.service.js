import api from './api';

export const getAttendanceConcerns = (params) => api.get('/reports/attendance-concerns', { params });
export const getAcademicConcerns = (params) => api.get('/reports/academic-concerns', { params });
export const getCounselingActivity = (params) => api.get('/reports/counseling-activity', { params });
export const getInterventionStatus = (params) => api.get('/reports/intervention-status', { params });
export const getMentorWorkload = (params) => api.get('/reports/mentor-workload', { params });
export const getStudentsNeedingAttention = (params) => api.get('/reports/students-needing-attention', { params });

// Fetches a report's CSV export via an authenticated request (so the
// Authorization header is sent correctly) and triggers a browser download,
// since a plain <a href> can't carry the JWT header.
export async function downloadReportCsv(path, params = {}, filename = 'report.csv') {
  const response = await api.get(path, { params: { ...params, export: 'csv' }, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
