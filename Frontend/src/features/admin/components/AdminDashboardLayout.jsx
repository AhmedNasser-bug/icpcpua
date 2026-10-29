import { NavLink } from "react-router-dom";
import { BookOpen, CalendarDays, Map, Shield } from "lucide-react";
export function AdminDashboardLayout({
  activeSection,
  children
}) {
  return <div className="admin-dashboard-shell">
    <div className="admin-dashboard-heading">
      <span className="admin-dashboard-mark"><Shield size={20} /></span>
      <div><h1>Admin Dashboard</h1></div>
    </div>
    <nav className="admin-dashboard-nav" aria-label="Admin dashboard sections">
      <NavLink end to="/admin/overview" className={activeSection === 'overview' ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link'}><Shield size={17} /> Overview</NavLink>
      <NavLink to="/admin/events" className={activeSection === 'events' ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link'}><CalendarDays size={17} /> Events</NavLink>
      <NavLink to="/admin/roadmaps" className={activeSection === 'roadmaps' ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link'}><Map size={17} /> Roadmaps</NavLink>
      <NavLink to="/admin/cycles" className={activeSection === 'cycles' ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link'}><BookOpen size={17} /> Cycles</NavLink>
    </nav>
    <div className="admin-dashboard-content">{children}</div>
  </div>;
}
