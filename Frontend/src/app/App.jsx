import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { api } from "../shared/services/api.js";
import { Header, Footer } from './layouts/SiteLayout.jsx';
import { AuthPage, UsernameSetupPage, RequireUsername } from '../features/auth/pages/AuthPages.jsx';
import { HomePage, EventsPage, EventDetail, CheckInPage } from '../features/events/pages/EventPages.jsx';
import { SettingsPage, UserProfilePage } from '../features/profile/pages/ProfilePages.jsx';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage.jsx';
import { LeaderboardPage } from '../features/leaderboard/pages/LeaderboardPage.jsx';
import { Admin } from '../features/admin/pages/AdminEventsPage.jsx';
import { AdminDashboardLayout } from '../features/admin/components/AdminDashboardLayout.jsx';
import { AdminOverviewPage } from '../features/admin/pages/AdminOverviewPage.jsx';
import { AdminCyclesPage, AdminRoadmapsPage } from '../features/roadmaps/pages/AdminRoadmapsPage.jsx';
import { RoadmapCheckInPage, RoadmapCyclePage, RoadmapDetailsPage, RoadmapsPage, TrainingPage } from '../features/roadmaps/pages/RoadmapsPages.jsx';
function useSession() {
  const [token, setToken] = useState(() => localStorage.getItem('pua-token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const signOut = useCallback(() => {
    localStorage.removeItem('pua-token');
    setToken(null);
    setUser(null);
  }, []);
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/auth/me', {
      token
    }).then(({
      user: currentUser
    }) => setUser(currentUser)).catch(signOut).finally(() => setLoading(false));
  }, [token, signOut]);
  const acceptSession = data => {
    localStorage.setItem('pua-token', data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
  };
  const updateUser = currentUser => setUser(currentUser);
  return {
    token,
    user,
    loading,
    acceptSession,
    updateUser,
    signOut
  };
}
export default function App() {
  const session = useSession();
  const [theme, setTheme] = useState(() => localStorage.getItem('pua-theme') === 'dark' ? 'dark' : 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pua-theme', theme);
  }, [theme]);
  return <div className="app-shell">
      <Header user={session.user} onSignOut={session.signOut} token={session.token} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetail token={session.token} user={session.user} />} />
        <Route path="/roadmaps" element={<RoadmapsPage token={session.token} />} />
        <Route path="/training" element={<RequireUsername session={session}><TrainingPage token={session.token} user={session.user} /></RequireUsername>} />
        <Route path="/roadmaps/:slug/cycles" element={<Navigate to="/training" replace />} />
        <Route path="/roadmaps/:slug/cycles/:cycleId" element={<RequireUsername session={session}><RoadmapCyclePage token={session.token} user={session.user} /></RequireUsername>} />
        <Route path="/roadmaps/check-in/:sessionId" element={<RequireUsername session={session}><RoadmapCheckInPage token={session.token} /></RequireUsername>} />
        <Route path="/roadmaps/:slug" element={<RoadmapDetailsPage token={session.token} user={session.user} />} />
        <Route path="/check-in/:eventId" element={session.loading ? <div className="empty-state"><span className="loader" /> Loading your account...</div> : <CheckInPage token={session.token} user={session.user} />} />
        <Route path="/login" element={<AuthPage session={session} />} />
        <Route path="/onboarding/username" element={session.loading ? <div className="empty-state"><span className="loader" /> Loading your account...</div> : session.user ? <UsernameSetupPage session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/my-activities" element={<Navigate to="/" replace />} />
        <Route path="/my-events" element={<Navigate to="/" replace />} />
        <Route path="/my-roadmaps" element={<Navigate to="/" replace />} />
        <Route path="/notifications" element={<RequireUsername session={session}><NotificationsPage token={session.token} /></RequireUsername>} />
        <Route path="/settings" element={<RequireUsername session={session}><Navigate to="/settings/account" replace /></RequireUsername>} />
        <Route path="/settings/:section" element={<RequireUsername session={session}><SettingsPage session={session} theme={theme} onThemeChange={setTheme} /></RequireUsername>} />
        <Route path="/resources" element={<Navigate to="/" replace />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/users/:username" element={<UserProfilePage session={session} />} />
        <Route path="/admin" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="events"><Admin token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/overview" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="overview"><AdminOverviewPage token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/events" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="events"><Admin token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/cycles" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="cycles"><AdminCyclesPage token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="/admin/roadmaps/*" element={<RequireUsername session={session}>{session.user?.role === 'admin' ? <AdminDashboardLayout activeSection="roadmaps"><AdminRoadmapsPage token={session.token} /></AdminDashboardLayout> : <Navigate to="/login" replace />}</RequireUsername>} />
        <Route path="*" element={<main className="page-wrap"><div className="empty-state"><h3>That page wandered off.</h3><Link className="button button-dark" to="/">Back to events</Link></div></main>} />
      </Routes>
      <Footer />
    </div>;
}
