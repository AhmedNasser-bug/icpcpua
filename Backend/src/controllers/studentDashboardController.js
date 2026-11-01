import { getStudentDashboard } from '../services/studentDashboardService.js';

export async function studentDashboard(req, res) {
  res.set('Cache-Control', 'private, no-store');
  return res.json({ dashboard: await getStudentDashboard(req.user.id) });
}
