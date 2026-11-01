import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Bell, Check, CheckCircle2, ChevronLeft, Code2, Copy, ExternalLink, Globe, KeyRound, Link2, LogOut, Moon, Palette, Plus, Shield, Sun, Trophy, UserRound } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { normalizeTeamPreference, normalizeTeamStatus, studentProfileForm } from '../utils/profileForm.js';
import { normalizeUsername, isValidUsername } from '../../auth/utils/username.js';
import { safeExternalUrl } from '../../../shared/utils/externalUrl.js';
function StudentIdField({
  id,
  label,
  value,
  onChange
}) {
  return <div className="student-id-entry">
      <label htmlFor={id}>{label}<input id={id} autoComplete="off" inputMode="numeric" pattern="[0-9]{4,20}" title="Enter 4–20 digits." required maxLength="20" value={value} onChange={onChange} /></label>
    </div>;
}
function ProfileFieldRequirement({ required = false }) {
  return <span className={`profile-field-requirement${required ? ' is-required' : ''}`}>{required ? 'Required' : 'Optional'}</span>;
}
function profileLines(value) {
  return value.split('\n');
}
export function SettingsPage({
  session,
  theme,
  onThemeChange
}) {
  const {
    section
  } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [studentId, setStudentId] = useState('');
  const [username, setUsername] = useState(session.user.username || '');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [studentProfile, setStudentProfile] = useState(() => studentProfileForm(session.user.profile, session.user.name));
  const [profileSaveError, setProfileSaveError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const [privacySuccess, setPrivacySuccess] = useState('');
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [notificationPreferenceError, setNotificationPreferenceError] = useState('');
  const [notificationPreferenceSuccess, setNotificationPreferenceSuccess] = useState('');
  const [notificationPreferenceBusy, setNotificationPreferenceBusy] = useState(false);
  const [pointsEntries, setPointsEntries] = useState([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState('');
  const [pointsReload, setPointsReload] = useState(0);
  const [pointsVerificationRequired, setPointsVerificationRequired] = useState(
    session.user.role === 'user' && session.user.profile?.codeforcesVerification?.status !== 'verified',
  );
  const [codeforcesVerification, setCodeforcesVerification] = useState(
    session.user.profile?.codeforcesVerification || { status: 'unverified' },
  );
  const [codeforcesHandle, setCodeforcesHandle] = useState(
    session.user.profile?.codeforcesVerification?.handle
      || session.user.profile?.externalProfiles?.codeforcesHandle
      || '',
  );
  const [codeforcesToken, setCodeforcesToken] = useState('');
  const [codeforcesError, setCodeforcesError] = useState('');
  const [codeforcesMessage, setCodeforcesMessage] = useState('');
  const [codeforcesBusy, setCodeforcesBusy] = useState(false);
  const [codeforcesLoading, setCodeforcesLoading] = useState(false);
  const [codeforcesCopied, setCodeforcesCopied] = useState(false);
  const [codeforcesChangingHandle, setCodeforcesChangingHandle] = useState(false);
  const saveCodeforcesVerification = verification => {
    setCodeforcesVerification(verification);
    if (verification.handle) setCodeforcesHandle(verification.handle);
    session.updateUser({
      ...session.user,
      profile: {
        ...(session.user.profile || {}),
        codeforcesVerification: verification
      }
    });
  };
  useEffect(() => {
    setUsername(session.user.username || '');
  }, [session.user.username]);
  useEffect(() => {
    if (section !== 'codeforces') return undefined;
    let active = true;
    setCodeforcesLoading(true);
    setCodeforcesError('');
    api('/auth/codeforces-verification', { token: session.token })
      .then(({ verification }) => {
        if (active) saveCodeforcesVerification(verification);
      })
      .catch(reason => {
        if (active) setCodeforcesError(reason.message);
      })
      .finally(() => {
        if (active) setCodeforcesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [section, session.token]);
  useEffect(() => {
    if (section !== 'points') return undefined;
    if (session.user.role === 'user' && session.user.profile?.codeforcesVerification?.status !== 'verified') {
      setPointsEntries([]);
      setPointsVerificationRequired(true);
      setPointsLoading(false);
      setPointsError('');
      return undefined;
    }
    let active = true;
    setPointsLoading(true);
    setPointsError('');
    setPointsVerificationRequired(false);
    Promise.all([
      api('/events/my', { token: session.token }),
      api('/roadmaps/my', { token: session.token })
    ]).then(([eventResult, roadmapResult]) => {
      if (!active) return;
      const eventEntries = eventResult.events
        .filter(entry => entry.checkedInAt && entry.pointsAwarded > 0)
        .map(entry => ({
          id: `event-${entry.registrationId}`,
          title: entry.event.title,
          category: entry.event.category,
          earnedAt: entry.checkedInAt,
          points: entry.pointsAwarded
        }));
      const cycleEntries = roadmapResult.roadmaps.flatMap(({ roadmap, cycle }) => cycle.sessions
        .filter(item => item.attended && item.checkedInAt && item.pointsAwarded > 0)
        .map(item => ({
          id: `session-${item._id}`,
          title: item.title,
          category: cycle.title || roadmap.title,
          earnedAt: item.checkedInAt,
          points: item.pointsAwarded
        })));
      setPointsEntries([...eventEntries, ...cycleEntries].sort((left, right) => new Date(right.earnedAt) - new Date(left.earnedAt)));
    }).catch(reason => {
      if (active && reason.code === 'CODEFORCES_VERIFICATION_REQUIRED') {
        setPointsEntries([]);
        setPointsVerificationRequired(true);
      } else if (active) setPointsError(reason.message);
    }).finally(() => {
      if (active) setPointsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [pointsReload, section, session.token, session.user.profile?.codeforcesVerification?.status, session.user.role]);
  const generateCodeforcesToken = async event => {
    event.preventDefault();
    setCodeforcesError('');
    setCodeforcesMessage('');
    setCodeforcesToken('');
    setCodeforcesCopied(false);
    setCodeforcesBusy(true);
    try {
      const result = await api('/auth/codeforces-verification/generate', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ handle: codeforcesHandle.trim() }),
      });
      saveCodeforcesVerification(result.verification);
      setCodeforcesToken(result.token);
      setCodeforcesChangingHandle(false);
      setCodeforcesMessage('Token generated. Add it to the First Name English field on Codeforces, then check verification.');
    } catch (reason) {
      setCodeforcesError(reason.message);
    } finally {
      setCodeforcesBusy(false);
    }
  };
  const checkCodeforcesToken = async () => {
    setCodeforcesError('');
    setCodeforcesMessage('');
    setCodeforcesBusy(true);
    try {
      const result = await api('/auth/codeforces-verification/check', {
        method: 'POST',
        token: session.token,
      });
      saveCodeforcesVerification(result.verification);
      setCodeforcesMessage(result.message || (result.verification.status === 'verified'
        ? 'Your Codeforces account is verified.'
        : result.verification.status === 'expired'
          ? 'Your verification token expired. Generate a new token to continue.'
          : 'Verification is still pending. Save the token on Codeforces and try again.'));
    } catch (reason) {
      setCodeforcesError(reason.message);
    } finally {
      setCodeforcesBusy(false);
    }
  };
  const copyCodeforcesToken = async () => {
    if (!navigator.clipboard?.writeText) {
      setCodeforcesError('Clipboard access is unavailable in this browser. Select and copy the token instead.');
      return;
    }
    try {
      await navigator.clipboard.writeText(codeforcesToken);
      setCodeforcesCopied(true);
      setCodeforcesError('');
    } catch {
      setCodeforcesError('Could not copy the token. Select and copy it manually.');
    }
  };
  const submit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await api('/auth/password', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });
      setSuccess(result.message);
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const saveStudentId = async event => {
    event.preventDefault();
    setProfileError('');
    setProfileBusy(true);
    try {
      const result = await api('/auth/student-id', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          studentId
        })
      });
      session.updateUser(result.user);
      setStudentId('');
    } catch (reason) {
      setProfileError(reason.message);
    } finally {
      setProfileBusy(false);
    }
  };
  const saveUsername = async event => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setUsernameError('Username must be 3–20 characters using letters, numbers, and underscores.');
      return;
    }
    setUsernameError('');
    setUsernameBusy(true);
    try {
      const result = await api('/auth/username', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          username: normalized
        })
      });
      session.updateUser(result.user);
    } catch (reason) {
      setUsernameError(reason.message);
    } finally {
      setUsernameBusy(false);
    }
  };
  const updateStudentProfileField = (field, value) => {
    setStudentProfile(current => ({
      ...current,
      [field]: value
    }));
    setProfileFieldErrors(current => ({
      ...current,
      [field]: ''
    }));
    setProfileSaveSuccess('');
  };
  const updateNestedProfileField = (section, field, value) => {
    setStudentProfile(current => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }));
    setProfileFieldErrors(current => ({
      ...current,
      [`${section}.${field}`]: ''
    }));
    setProfileSaveSuccess('');
  };
  const cancelStudentProfile = () => {
    setStudentProfile(studentProfileForm(session.user.profile, session.user.name));
    setProfileFieldErrors({});
    setProfileSaveError('');
    setProfileSaveSuccess('');
  };
  const saveStudentProfile = async event => {
    event.preventDefault();
    const errors = {};
    const urls = [['pictureUrl', studentProfile.pictureUrl]];
    urls.forEach(([field, value]) => {
      if (value && !safeExternalUrl(value)) errors[field] = 'Enter a valid HTTP or HTTPS URL.';
    });
    setProfileFieldErrors(errors);
    setProfileSaveError('');
    setProfileSaveSuccess('');
    if (Object.keys(errors).length) return;
    setProfileSaveBusy(true);
    try {
      const result = await api('/auth/profile', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          name: studentProfile.name,
          pictureUrl: studentProfile.pictureUrl,
          university: studentProfile.university,
          academicYear: studentProfile.academicYear,
          graduationYear: studentProfile.graduationYear,
          bio: studentProfile.bio,
          programmingLanguages: studentProfile.programmingLanguages.map(item => item.trim()).filter(Boolean),
          technicalInterests: studentProfile.technicalInterests.map(item => item.trim()).filter(Boolean),
          cpStats: studentProfile.cpStats,
          icpcJourney: studentProfile.icpcJourney,
          teamStatus: normalizeTeamStatus(studentProfile.teamStatus),
          teamPreferences: {
            ...studentProfile.teamPreferences,
            preference: normalizeTeamPreference(studentProfile.teamPreferences.preference)
          },
          trainingGoals: studentProfile.trainingGoals.map(item => item.trim()).filter(Boolean),
          trainingTopics: studentProfile.trainingTopics,
          milestones: studentProfile.milestones,
          trainingProgress: studentProfile.trainingProgress
        })
      });
      session.updateUser(result.user);
      setStudentProfile(studentProfileForm(result.user.profile, result.user.name));
      setProfileSaveSuccess('Your profile has been saved.');
    } catch (reason) {
      if (reason.field) setProfileFieldErrors(current => ({
        ...current,
        [reason.field]: reason.message
      }));
      setProfileSaveError(reason.message);
    } finally {
      setProfileSaveBusy(false);
    }
  };
  const saveConnections = async event => {
    event.preventDefault();
    const errors = {};
    [['externalProfiles.githubUrl', studentProfile.externalProfiles.githubUrl], ['externalProfiles.linkedinUrl', studentProfile.externalProfiles.linkedinUrl], ['externalProfiles.codeforcesUrl', studentProfile.externalProfiles.codeforcesUrl]].forEach(([field, value]) => {
      if (value && !safeExternalUrl(value)) errors[field] = 'Enter a valid HTTP or HTTPS URL.';
    });
    studentProfile.externalProfiles.otherProfiles.forEach((entry, index) => {
      if (entry.url && !safeExternalUrl(entry.url)) errors[`externalProfiles.otherProfiles.${index}.url`] = 'Enter a valid HTTP or HTTPS URL.';
    });
    setProfileFieldErrors(errors);
    setProfileSaveError('');
    setProfileSaveSuccess('');
    if (Object.keys(errors).length) return;
    setProfileSaveBusy(true);
    try {
      const result = await api('/auth/profile', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          externalProfiles: studentProfile.externalProfiles
        })
      });
      session.updateUser(result.user);
      setStudentProfile(current => ({
        ...current,
        externalProfiles: studentProfileForm(result.user.profile, result.user.name).externalProfiles
      }));
      setProfileSaveSuccess('Your manually entered profiles have been saved.');
    } catch (reason) {
      if (reason.field) setProfileFieldErrors(current => ({
        ...current,
        [reason.field]: reason.message
      }));
      setProfileSaveError(reason.message);
    } finally {
      setProfileSaveBusy(false);
    }
  };
  const privacySettings = {
    profileVisible: true,
    leaderboardVisible: true,
    externalProfilesVisible: true,
    cpStatsVisible: true,
    trainingVisible: true,
    teamStatusVisible: true,
    attendanceHistoryVisible: session.user.profile?.privacy?.attendanceHistoryVisible ?? session.user.profile?.privacy?.journeyVisible ?? true,
    ...(session.user.profile?.privacy || {})
  };
  const updatePrivacy = async (field, value) => {
    setPrivacyBusy(true);
    setPrivacyError('');
    setPrivacySuccess('');
    try {
      const result = await api('/auth/privacy', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          [field]: value
        })
      });
      session.updateUser(result.user);
      setPrivacySuccess('Privacy preference saved.');
    } catch (reason) {
      setPrivacyError(reason.message);
    } finally {
      setPrivacyBusy(false);
    }
  };
  const notificationPreferences = {
    contestAnnouncements: true,
    icpcEvents: true,
    ...(session.user.notificationPreferences || {})
  };
  const updateNotificationPreference = async (field, value) => {
    setNotificationPreferenceBusy(true);
    setNotificationPreferenceError('');
    setNotificationPreferenceSuccess('');
    try {
      const result = await api('/auth/notification-preferences', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify({
          [field]: value
        })
      });
      session.updateUser(result.user);
      setNotificationPreferenceSuccess('Notification preference saved.');
    } catch (reason) {
      setNotificationPreferenceError(reason.message);
    } finally {
      setNotificationPreferenceBusy(false);
    }
  };
  const logout = () => {
    session.signOut();
    navigate('/login', {
      replace: true
    });
  };
  if (!['account', 'profile', 'privacy', 'notifications', 'appearance', 'connections', 'points', 'codeforces'].includes(section)) {
    return <Navigate to="/settings/account" replace />;
  }
  return <main className="page-wrap settings-page settings-modern-page">
      <header className="settings-hero">
        <h1>Your Settings</h1>
      </header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[['account', 'Account', UserRound], ['profile', 'Profile', UserRound], ['privacy', 'Privacy', Shield], ['notifications', 'Notifications', Bell], ['appearance', 'Appearance', Palette], ['connections', 'Connections', Link2], ['codeforces', 'Codeforces', Code2], ['points', 'Points history', Trophy]].map(([path, label, Icon]) => <Link key={path} className={section === path ? 'settings-nav-link active' : 'settings-nav-link'} to={`/settings/${path}`} aria-current={section === path ? 'page' : undefined}><Icon size={17} />{label}</Link>)}
        </nav>
        <div className="settings-content">
      {section === 'points' && pointsVerificationRequired ? <section className="settings-card codeforces-required-card" aria-labelledby="points-verification-title">
        <span className="eyebrow">STUDENT DASHBOARD</span>
        <h2 id="points-verification-title">Verify your Codeforces account</h2>
        <p>Verify your account to view your personal points history and dashboard data.</p>
        <Link className="button button-dark" to="/settings/codeforces">Go to Codeforces verification <ArrowRight size={16} /></Link>
      </section> : section === 'points' && <section className="settings-card points-history-card" aria-labelledby="points-history-title">
        <div className="points-history-heading">
          <div><span className="eyebrow">YOUR ACTIVITY</span><h2 id="points-history-title">Points history</h2><p>Points recorded for your event and training-session attendance.</p></div>
          <div className="points-history-total"><small>Points earned</small><strong>{pointsLoading ? '—' : pointsEntries.reduce((total, entry) => total + entry.points, 0).toLocaleString()}</strong></div>
        </div>
        {pointsError && <div className="notice error-notice" role="alert">{pointsError} <button className="text-link" type="button" onClick={() => setPointsReload(value => value + 1)}>Try again</button></div>}
        {pointsLoading ? <p className="points-history-message" role="status">Loading your points history...</p> : pointsError ? null : pointsEntries.length ? <div className="points-history-list">
          {pointsEntries.map(entry => <article className="points-history-entry" key={entry.id}>
            <span className="points-history-icon"><Trophy size={17} aria-hidden="true" /></span>
            <div className="points-history-copy"><strong>{entry.title}</strong><small>{entry.category} · {new Date(entry.earnedAt).toLocaleString()}</small></div>
            <b>+{entry.points} pts</b>
          </article>)}
        </div> : <p className="points-history-message">No points have been recorded yet. Points from checked-in events and attended training sessions will appear here.</p>}
      </section>}
      {section === 'codeforces' && <section className="settings-card codeforces-verification-card" aria-labelledby="codeforces-verification-title">
        <span className="eyebrow">ACCOUNT VERIFICATION</span>
        <h2 id="codeforces-verification-title">Codeforces verification</h2>
        <p>Verify that you own your Codeforces account to access your personal student dashboard data.</p>
        {codeforcesLoading ? <p className="points-history-message" role="status">Loading verification status...</p> : <>
          {codeforcesVerification.status === 'verified' && !codeforcesChangingHandle ? <div className="codeforces-verified-state" role="status">
            <CheckCircle2 size={21} aria-hidden="true" />
            <div><strong>Codeforces account verified</strong><span><a href={`https://codeforces.com/profile/${encodeURIComponent(codeforcesVerification.handle)}`} target="_blank" rel="noopener noreferrer">{codeforcesVerification.handle} <ExternalLink size={14} aria-hidden="true" /></a></span>
              {codeforcesVerification.verifiedAt && <small>Verified {new Date(codeforcesVerification.verifiedAt).toLocaleDateString()}</small>}
              <button className="button button-outline" type="button" onClick={() => {
                setCodeforcesHandle('');
                setCodeforcesError('');
                setCodeforcesMessage('');
                setCodeforcesChangingHandle(true);
              }}>Change handle</button>
            </div>
          </div> : <>
            {codeforcesChangingHandle && <div className="notice info-notice" role="status">
              Generate a new verification token for the replacement handle. Your current verification remains active until you start verification for that handle.
            </div>}
            <form onSubmit={generateCodeforcesToken}>
              <label htmlFor="codeforces-handle">Codeforces handle
                <input id="codeforces-handle" name="handle" autoComplete="off" maxLength="24" pattern="[A-Za-z0-9._-]{3,24}" required value={codeforcesHandle} onChange={event => setCodeforcesHandle(event.target.value)} />
              </label>
              <button className="button button-dark" type="submit" disabled={codeforcesBusy}>{codeforcesBusy ? 'Checking handle...' : codeforcesVerification.status === 'pending' ? 'Generate a new token' : 'Generate token'} <ArrowRight size={16} /></button>
              {codeforcesChangingHandle && <button className="button button-outline codeforces-cancel-change" type="button" onClick={() => {
                setCodeforcesChangingHandle(false);
                setCodeforcesHandle(codeforcesVerification.handle || '');
                setCodeforcesError('');
              }}>Cancel</button>}
            </form>
            {codeforcesVerification.status === 'expired' && <div className="notice error-notice" role="status">Your previous token expired. Generate a new token to continue.</div>}
            {codeforcesVerification.status === 'pending' && <div className="codeforces-pending-state" role="status">
              <strong>Verification pending for {codeforcesVerification.handle}</strong>
              {!codeforcesToken && <p>The token is only shown when generated. You can check again or generate a new token.</p>}
              {codeforcesToken && <div className="codeforces-token-row"><code>{codeforcesToken}</code><button className="button button-outline" type="button" onClick={copyCodeforcesToken} aria-label="Copy verification token">{codeforcesCopied ? <Check size={16} /> : <Copy size={16} />}{codeforcesCopied ? 'Copied' : 'Copy token'}</button></div>}
              <ol>
                <li>Open your <a href="https://codeforces.com/settings/social" target="_blank" rel="noopener noreferrer">Codeforces profile settings <ExternalLink size={14} aria-hidden="true" /></a>.</li>
                <li>Put the generated token in the <strong>First Name English</strong> field.</li>
                <li>Save your changes on Codeforces.</li>
                <li>Return here and click <strong>Check verification</strong>.</li>
              </ol>
              {codeforcesToken && <p className="codeforces-token-expiry">Token expires {codeforcesVerification.expiresAt ? new Date(codeforcesVerification.expiresAt).toLocaleTimeString() : 'in 15 minutes'}.</p>}
              <button className="button button-outline" type="button" onClick={checkCodeforcesToken} disabled={codeforcesBusy}>{codeforcesBusy ? 'Checking...' : 'Check verification'}</button>
            </div>}
          </>}
        </>}
        {codeforcesError && <div className="notice error-notice" role="alert">{codeforcesError}</div>}
        {codeforcesMessage && <div className={`notice ${codeforcesVerification.status === 'verified' ? 'success-notice' : codeforcesVerification.status === 'expired' ? 'error-notice' : 'info-notice'}`} role="status">{codeforcesMessage}</div>}
      </section>}
      {section === 'account' && <section className="settings-card settings-profile-card" aria-labelledby="settings-profile-title">
        <div className="settings-card-heading">
          <div className="profile-avatar settings-avatar" aria-hidden="true">
            {session.user.name.trim().charAt(0).toUpperCase()}
            {safeExternalUrl(session.user.profile?.pictureUrl) && <img src={safeExternalUrl(session.user.profile.pictureUrl)} alt="" onError={event => event.currentTarget.remove()} />}
          </div>
          <div><span className="eyebrow">ACCOUNT</span><h2 id="settings-profile-title">{session.user.name}</h2><span className="settings-role-badge">STUDENT</span></div>
        </div>
        <dl className="settings-profile-details">
          <div><dt>Username</dt><dd>{session.user.username || 'Not set'}</dd></div>
          <div><dt>Email address</dt><dd>{session.user.email}</dd></div>
          <div><dt>Student ID</dt><dd>{session.user.studentId || 'Not provided yet'}</dd></div>
          {session.user.createdAt && <div><dt>Account created</dt><dd>{new Date(session.user.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</dd></div>}
        </dl>
        <form className="student-id-form" onSubmit={saveUsername}>
          <label htmlFor="settings-username">Username<input id="settings-username" autoComplete="username" required minLength="3" maxLength="20" pattern="[A-Za-z0-9_]{3,20}" value={username} onChange={event => setUsername(event.target.value)} /></label>
          {usernameError && <div className="notice error-notice" role="alert">{usernameError}</div>}
          <button className="button button-dark" type="submit" disabled={usernameBusy}>{usernameBusy ? 'Saving...' : 'Save username'} <ArrowRight size={16} /></button>
        </form>
        {!session.user.studentId && <form className="student-id-form" onSubmit={saveStudentId}>
          <StudentIdField id="settings-student-id" label="Add your student ID" value={studentId} onChange={event => setStudentId(event.target.value)} />
          <p>Student ID is optional and can only be added once.</p>
          {profileError && <div className="notice error-notice" role="alert">{profileError}</div>}
          <button className="button button-dark" type="submit" disabled={profileBusy}>{profileBusy ? 'Saving...' : 'Save student ID'} <ArrowRight size={16} /></button>
        </form>}
      </section>}
      {section === 'profile' && <form className="settings-card profile-editor" onSubmit={saveStudentProfile}>
        <h2>Edit your profile</h2>
        <fieldset>
          <legend>Basic information</legend>
          <label><span className="profile-field-label-row">Full name <ProfileFieldRequirement required /></span><input required maxLength="80" value={studentProfile.name} onChange={event => updateStudentProfileField('name', event.target.value)} aria-invalid={Boolean(profileFieldErrors.name)} /></label>
          {profileFieldErrors.name && <span className="field-error">{profileFieldErrors.name}</span>}
          <label><span className="profile-field-label-row">Profile picture URL <ProfileFieldRequirement /></span><input type="text" inputMode="url" maxLength="500" value={studentProfile.pictureUrl} onChange={event => updateStudentProfileField('pictureUrl', event.target.value)} aria-invalid={Boolean(profileFieldErrors.pictureUrl)} /></label>
          {profileFieldErrors.pictureUrl && <span className="field-error">{profileFieldErrors.pictureUrl}</span>}
          <label><span className="profile-field-label-row">University <ProfileFieldRequirement /></span><input maxLength="120" value={studentProfile.university} onChange={event => updateStudentProfileField('university', event.target.value)} /></label>
          <div className="profile-form-grid">
            <label><span className="profile-field-label-row">Academic year <ProfileFieldRequirement /></span><input maxLength="40" placeholder="e.g. 3rd year" value={studentProfile.academicYear} onChange={event => updateStudentProfileField('academicYear', event.target.value)} /></label>
            <label><span className="profile-field-label-row">Graduation year <ProfileFieldRequirement /></span><input type="number" min="1900" max="2200" value={studentProfile.graduationYear} onChange={event => updateStudentProfileField('graduationYear', event.target.value)} /></label>
          </div>
          <label><span className="profile-field-label-row">Short bio <ProfileFieldRequirement /></span><textarea maxLength="500" rows="3" value={studentProfile.bio} onChange={event => updateStudentProfileField('bio', event.target.value)} /></label>
          <label><span className="profile-field-label-row">Programming languages <ProfileFieldRequirement /> <span className="profile-field-hint">One per line</span></span><textarea rows="4" value={studentProfile.programmingLanguages.join('\n')} onChange={event => updateStudentProfileField('programmingLanguages', profileLines(event.target.value))} aria-invalid={Boolean(profileFieldErrors.programmingLanguages)} /></label>
          {profileFieldErrors.programmingLanguages && <span className="field-error">{profileFieldErrors.programmingLanguages}</span>}
          <label><span className="profile-field-label-row">Technical interests <ProfileFieldRequirement /> <span className="profile-field-hint">One per line</span></span><textarea rows="4" value={studentProfile.technicalInterests.join('\n')} onChange={event => updateStudentProfileField('technicalInterests', profileLines(event.target.value))} aria-invalid={Boolean(profileFieldErrors.technicalInterests)} /></label>
          {profileFieldErrors.technicalInterests && <span className="field-error">{profileFieldErrors.technicalInterests}</span>}
        </fieldset>
        <fieldset>
          <legend>Looking for a team</legend>
          <label><span className="profile-field-label-row">Team status <ProfileFieldRequirement /></span><select value={studentProfile.teamStatus} onChange={event => updateStudentProfileField('teamStatus', event.target.value)}><option value="">Not specified</option><option value="looking">Looking for a team</option><option value="in_team">Already in a team</option><option value="not_looking">Not currently looking</option></select></label>
          {studentProfile.teamStatus === 'looking' && <div className="profile-form-grid">
            <label><span className="profile-field-label-row">Preferred programming language <ProfileFieldRequirement /></span><input maxLength="40" value={studentProfile.teamPreferences.preferredLanguage} onChange={event => updateNestedProfileField('teamPreferences', 'preferredLanguage', event.target.value)} /></label>
            <label><span className="profile-field-label-row">Experience or approximate level <ProfileFieldRequirement /></span><input maxLength="200" value={studentProfile.teamPreferences.experience} onChange={event => updateNestedProfileField('teamPreferences', 'experience', event.target.value)} /></label>
            <label><span className="profile-field-label-row">Preferred training schedule <ProfileFieldRequirement /></span><input maxLength="120" value={studentProfile.teamPreferences.schedule} onChange={event => updateNestedProfileField('teamPreferences', 'schedule', event.target.value)} /></label>
            <label><span className="profile-field-label-row">Training preference <ProfileFieldRequirement /></span><select value={studentProfile.teamPreferences.preference} onChange={event => updateNestedProfileField('teamPreferences', 'preference', event.target.value)}><option value="">Not specified</option><option value="online">Online</option><option value="offline">Offline</option><option value="either">Either</option></select></label>
            <label className="profile-form-wide"><span className="profile-field-label-row">Introduction for potential teammates <ProfileFieldRequirement /></span><textarea maxLength="300" rows="4" value={studentProfile.teamPreferences.introduction} onChange={event => updateNestedProfileField('teamPreferences', 'introduction', event.target.value)} /></label>
          </div>}
        </fieldset>
        <fieldset>
          <legend>Training goals</legend>
          <label><span className="profile-field-label-row">Current learning goals <ProfileFieldRequirement /> <span className="profile-field-hint">One per line</span></span><textarea rows="4" value={studentProfile.trainingGoals.join('\n')} onChange={event => updateStudentProfileField('trainingGoals', profileLines(event.target.value))} aria-invalid={Boolean(profileFieldErrors.trainingGoals)} />{profileFieldErrors.trainingGoals && <span className="field-error">{profileFieldErrors.trainingGoals}</span>}</label>
        </fieldset>
        {profileSaveError && <div className="notice error-notice" role="alert">{profileSaveError}</div>}
        {profileSaveSuccess && <div className="notice success-notice" role="status">{profileSaveSuccess}</div>}
        <div className="profile-form-actions"><button className="button button-outline" type="button" onClick={cancelStudentProfile} disabled={profileSaveBusy}>Cancel</button><button className="button button-dark" type="submit" disabled={profileSaveBusy}>{profileSaveBusy ? 'Saving profile...' : 'Save changes'} <ArrowRight size={16} /></button></div>
      </form>}
      {section === 'connections' && <form className="settings-card profile-editor" onSubmit={saveConnections}>
        <span className="eyebrow">MANUALLY ENTERED PROFILES</span>
        <h2>Public profile links</h2>
        <p>These are manually entered public links and handles, not authenticated connections. Use Codeforces settings to verify Codeforces ownership; every field here is optional.</p>
        <fieldset>
          <legend>Competitive and social profiles</legend>
          {[['githubUrl', 'GitHub profile URL'], ['linkedinUrl', 'LinkedIn profile URL'], ['codeforcesUrl', 'Codeforces profile URL']].map(([field, label]) => {
              const key = `externalProfiles.${field}`;
              return <div key={field}>
              <label><span className="profile-field-label-row">{label} <ProfileFieldRequirement /></span><input type="text" inputMode="url" maxLength="500" value={studentProfile.externalProfiles[field]} onChange={event => updateNestedProfileField('externalProfiles', field, event.target.value)} aria-invalid={Boolean(profileFieldErrors[key])} /></label>
              {profileFieldErrors[key] && <span className="field-error">{profileFieldErrors[key]}</span>}
            </div>;
            })}
          <label><span className="profile-field-label-row">Codeforces handle <ProfileFieldRequirement /></span><input maxLength="40" value={studentProfile.externalProfiles.codeforcesHandle} onChange={event => updateNestedProfileField('externalProfiles', 'codeforcesHandle', event.target.value)} /></label>
          {studentProfile.externalProfiles.otherProfiles.map((entry, index) => <div className="profile-form-grid profile-other-link" key={`other-profile-${index}`}>
            <label><span className="profile-field-label-row">Platform <ProfileFieldRequirement /></span><input maxLength="40" value={entry.platform} onChange={event => setStudentProfile(current => ({
                  ...current,
                  externalProfiles: {
                    ...current.externalProfiles,
                    otherProfiles: current.externalProfiles.otherProfiles.map((item, itemIndex) => itemIndex === index ? {
                      ...item,
                      platform: event.target.value
                    } : item)
                  }
                }))} /></label>
            <label><span className="profile-field-label-row">Profile URL <ProfileFieldRequirement /></span><input type="text" inputMode="url" maxLength="500" value={entry.url} onChange={event => setStudentProfile(current => ({
                  ...current,
                  externalProfiles: {
                    ...current.externalProfiles,
                    otherProfiles: current.externalProfiles.otherProfiles.map((item, itemIndex) => itemIndex === index ? {
                      ...item,
                      url: event.target.value
                    } : item)
                  }
                }))} aria-invalid={Boolean(profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`])} /></label>
          </div>)}
          {studentProfile.externalProfiles.otherProfiles.map((entry, index) => profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`] && <span className="field-error" key={`other-profile-error-${index}`}>{profileFieldErrors[`externalProfiles.otherProfiles.${index}.url`]}</span>)}
          <button className="button button-outline profile-add-button" type="button" onClick={() => setStudentProfile(current => ({
              ...current,
              externalProfiles: {
                ...current.externalProfiles,
                otherProfiles: [...current.externalProfiles.otherProfiles, {
                  platform: '',
                  url: ''
                }]
              }
            }))}><Plus size={16} /> Add another profile</button>
        </fieldset>
        {profileSaveError && <div className="notice error-notice" role="alert">{profileSaveError}</div>}
        {profileSaveSuccess && <div className="notice success-notice" role="status">{profileSaveSuccess}</div>}
        <div className="profile-form-actions"><button className="button button-outline" type="button" onClick={cancelStudentProfile} disabled={profileSaveBusy}>Cancel</button><button className="button button-dark" type="submit" disabled={profileSaveBusy}>{profileSaveBusy ? 'Saving...' : 'Save changes'} <ArrowRight size={16} /></button></div>
      </form>}
      {section === 'appearance' && <section className="settings-card settings-theme-card" aria-labelledby="settings-theme-title">
        <div><span className="eyebrow">APPEARANCE</span><h2 id="settings-theme-title">Theme</h2><p>Choose how the community looks on this device.</p></div>
        <div className="theme-options" role="group" aria-label="Color theme">
          <button type="button" className={theme === 'light' ? 'theme-option selected' : 'theme-option'} aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}><Sun size={18} /> Light Mode</button>
          <button type="button" className={theme === 'dark' ? 'theme-option selected' : 'theme-option'} aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}><Moon size={18} /> Dark Mode</button>
        </div>
      </section>}
      {section === 'account' && <form className="settings-card" onSubmit={submit}>
        <span className="settings-icon"><KeyRound size={21} /></span>
        <h2>Change password</h2>
        <p>Enter your current password, then choose a new one with at least 8 characters.</p>
        <label>Current password<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={event => setForm({
              ...form,
              currentPassword: event.target.value
            })} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength="8" required value={form.newPassword} onChange={event => setForm({
              ...form,
              newPassword: event.target.value
            })} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength="8" required value={form.confirmPassword} onChange={event => setForm({
              ...form,
              confirmPassword: event.target.value
            })} /></label>
        {error && <div className="notice error-notice" role="alert">{error}</div>}
        {success && <div className="notice success-notice" role="status">{success}</div>}
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Updating password...' : 'Change password'} <ArrowRight size={16} /></button>
        <div className="settings-signout-divider">
          <button className="button button-outline settings-logout" type="button" onClick={logout}><LogOut size={16} /> Logout</button>
        </div>
      </form>}
      {section === 'privacy' && <section className="settings-card settings-privacy-card" aria-labelledby="settings-privacy-title">
        <span className="eyebrow">PUBLIC PROFILE</span>
        <h2 id="settings-privacy-title">Privacy</h2>
        <p>Choose which parts of your profile can be seen by people in the community. Your email and student ID are never shown publicly.</p>
        <div className="privacy-options">
          {[['profileVisible', 'Public profile', 'Show your public profile page. Turning this off also hides you from the community leaderboard.'], ['leaderboardVisible', 'Show me on the Leaderboard', 'Include your name, rank, avatar, and statistics on the public leaderboard. Turning off Public profile also hides you there.'], ['externalProfilesVisible', 'External profile links', 'Show your manually entered GitHub, LinkedIn, Codeforces, and other profile links.'], ['cpStatsVisible', 'Competitive programming stats', 'Show self-reported platform ratings and counts. Verified community leaderboard points remain visible.'], ['trainingVisible', 'Training interests and goals', 'Show the topics, milestones, and training goals on your profile.'], ['teamStatusVisible', 'Team status and preferences', 'Show whether you are looking for a team and any preferences you shared.'], ['attendanceHistoryVisible', 'Attendance history', 'Show verified community event attendance on your public profile.']].map(([key, label, description]) => <label className="privacy-option" key={key}>
            <span><strong>{label}</strong><small>{description}</small></span>
            <input type="checkbox" checked={Boolean(privacySettings[key])} disabled={privacyBusy} onChange={event => updatePrivacy(key, event.target.checked)} aria-label={label} />
          </label>)}
        </div>
        {privacyError && <div className="notice error-notice" role="alert">{privacyError}</div>}
        {privacySuccess && <div className="notice success-notice" role="status">{privacySuccess}</div>}
      </section>}
        {section === 'notifications' && <section className="settings-card settings-privacy-card" aria-labelledby="settings-notification-title">
          <span className="eyebrow">COMMUNITY UPDATES</span>
          <h2 id="settings-notification-title">Notifications</h2>
          <p></p>
          <div className="privacy-options">
            {[['contestAnnouncements', 'Contest announcements', 'Newly published contest and competition events.'], ['icpcEvents', 'ICPC events', 'Newly published ICPC community events and important event updates.']].map(([key, label, description]) => <label className="privacy-option" key={key}>
              <span><strong>{label}</strong><small>{description}</small></span>
              <input type="checkbox" checked={Boolean(notificationPreferences[key])} disabled={notificationPreferenceBusy} onChange={event => updateNotificationPreference(key, event.target.checked)} aria-label={label} />
            </label>)}
          </div>
          {notificationPreferenceError && <div className="notice error-notice" role="alert">{notificationPreferenceError}</div>}
          {notificationPreferenceSuccess && <div className="notice success-notice" role="status">{notificationPreferenceSuccess}</div>}
        </section>}
        </div>
      </div>
    </main>;
}
export function UserProfilePage({
  session
}) {
  const {
    username
  } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [roadmapProblemProgress, setRoadmapProblemProgress] = useState({ status: 'idle' });
  const [roadmapProgressRetry, setRoadmapProgressRetry] = useState(0);
  const isOwner = session.user?.username === username;
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setVerificationRequired(false);
    api(`/events/${encodeURIComponent(username)}/profile`, { token: session.token }).then(({
      profile: result
    }) => active && setProfile(result)).catch(reason => {
      if (!active) return;
      if (reason.code === 'CODEFORCES_VERIFICATION_REQUIRED') setVerificationRequired(true);
      else setError(reason.message);
    }).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [username, session.token]);
  useEffect(() => {
    let active = true;
    if (!isOwner || !session.token) {
      setRoadmapProblemProgress({ status: 'unavailable' });
      return () => {
        active = false;
      };
    }
    setRoadmapProblemProgress({ status: 'loading' });
    const loadProgress = async () => {
      try {
        const { roadmaps } = await api('/roadmaps');
        const roadmapData = await Promise.all(roadmaps.map(async ({ slug }) => {
          const [{ roadmap }, { solvedProblems }] = await Promise.all([
            api(`/roadmaps/${encodeURIComponent(slug)}`),
            api(`/roadmaps/${encodeURIComponent(slug)}/progress`, { token: session.token })
          ]);
          return { roadmap, solvedProblems };
        }));
        const counts = {
          total: 0,
          solved: 0,
          easy: 0,
          medium: 0,
          hard: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0
        };
        for (const { roadmap, solvedProblems } of roadmapData) {
          const solvedKeys = new Set(solvedProblems.map(({ nodeId, problemUrl }) => `${nodeId}\u0000${problemUrl}`));
          for (const node of roadmap.nodes || []) {
            for (const problem of node.problems || []) {
              const difficulty = ['easy', 'medium', 'hard'].includes(problem.difficulty?.toLowerCase())
                ? problem.difficulty.toLowerCase()
                : null;
              const solved = solvedKeys.has(`${node._id}\u0000${problem.url}`);
              counts.total += 1;
              if (difficulty) counts[difficulty] += 1;
              if (solved) {
                counts.solved += 1;
                if (difficulty) counts[`${difficulty}Solved`] += 1;
              }
            }
          }
        }
        if (active) setRoadmapProblemProgress({ status: 'ready', counts });
      } catch (reason) {
        if (active) setRoadmapProblemProgress({ status: 'error', message: reason.message });
      }
    };
    loadProgress();
    return () => {
      active = false;
    };
  }, [isOwner, roadmapProgressRetry, session.token]);
  if (loading) return <main className="page-wrap"><div className="empty-state"><span className="loader" /> Loading member profile...</div></main>;
  if (verificationRequired) return <main className="page-wrap profile-page member-profile-page">
    <section className="member-profile-card codeforces-dashboard-gate" aria-labelledby="profile-verification-title">
      <span className="eyebrow">STUDENT DASHBOARD</span>
      <h1 id="profile-verification-title">Codeforces verification required</h1>
      <p>Verify your Codeforces account to access your personal dashboard and roadmap progress.</p>
      <Link className="button button-dark" to="/settings/codeforces">Go to Codeforces verification <ArrowRight size={16} /></Link>
    </section>
  </main>;
  if (error || !profile) return <main className="page-wrap"><div className="notice error-notice">{error || 'Member profile not found.'}</div><Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link></main>;
  const details = profile.profile || {};
  const externalProfiles = details.externalProfiles || {};
  const externalLinks = [['GitHub', externalProfiles.githubUrl], ['LinkedIn', externalProfiles.linkedinUrl], ['Codeforces', externalProfiles.codeforcesUrl], ...(externalProfiles.otherProfiles || []).map(item => [item.platform || 'Other profile', item.url])].map(([label, value]) => ({
    label,
    url: safeExternalUrl(value)
  })).filter(item => item.label && item.url);
  const attendanceFeed = Array.isArray(profile.attendanceHistory) ? profile.attendanceHistory.slice(0, 5) : [];
  const teamStatusLabels = {
    looking: 'Looking for a team',
    in_team: 'Already in a team',
    not_looking: 'Not currently looking'
  };
  const roadmapDifficultySegments = [
    { difficulty: 'easy', length: 62.8, offset: 0 },
    { difficulty: 'medium', length: 94.2, offset: -68 },
    { difficulty: 'hard', length: 31.4, offset: -167 }
  ].map(segment => {
    const counts = roadmapProblemProgress.counts;
    const total = counts?.[segment.difficulty] || 0;
    const solved = counts?.[`${segment.difficulty}Solved`] || 0;
    return {
      ...segment,
      count: total,
      progressLength: total && solved ? segment.length * (solved / total) : 0
    };
  });
  const academicDetails = [
    details.university,
    details.academicYear,
    details.graduationYear ? `Class of ${details.graduationYear}` : ''
  ].filter(Boolean);
  const languagePills = Array.isArray(details.programmingLanguages) ? details.programmingLanguages : [];
  const interestPills = Array.isArray(details.technicalInterests) ? details.technicalInterests : [];
  const goals = Array.isArray(details.trainingGoals) ? details.trainingGoals.filter(Boolean) : [];
  const codeforcesHandle = externalProfiles.codeforcesHandle;
  return <main className="page-wrap profile-page member-profile-page">
    <Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link>
    <div className="member-profile-grid">
      <aside className="member-profile-sidebar">
        <section className="member-profile-card member-profile-identity">
          <div className="member-profile-identity-row">
            <div className="member-profile-avatar" aria-hidden="true">
              {profile.name.trim().charAt(0).toUpperCase()}
              {safeExternalUrl(details.pictureUrl) && <img src={safeExternalUrl(details.pictureUrl)} alt="" onError={event => event.currentTarget.remove()} />}
            </div>
            <div className="member-profile-identity-copy">
              <h1>{profile.name}</h1>
              <span className="member-profile-username">@{profile.username}</span>
            </div>
          </div>
          {isOwner && <Link className="member-profile-button" to="/settings/profile">Edit Profile <UserRound size={16} /></Link>}
          {details.bio && <p className="member-profile-bio">{details.bio}</p>}

          {academicDetails.length > 0 && <div className="member-profile-section">
            <h2>Academic details</h2>
            <p>{academicDetails.join(' · ')}</p>
          </div>}

          {languagePills.length > 0 && <div className="member-profile-section">
            <h2>Programming languages</h2>
            <div className="member-profile-tags">{languagePills.map(language => <span className="member-profile-tag" key={language}><Code2 size={13} />{language}</span>)}</div>
          </div>}

          {interestPills.length > 0 && <div className="member-profile-section">
            <h2>Technical interests</h2>
            <div className="member-profile-tags">{interestPills.map(interest => <span className="member-profile-tag member-profile-tag-outline" key={interest}>{interest}</span>)}</div>
          </div>}

          <div className="member-profile-section">
            <h2>External profiles</h2>
            {externalLinks.length > 0 || codeforcesHandle ? <div className="member-profile-links">
              {externalLinks.map(link => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer"><span>{link.label}</span><ExternalLink size={14} /></a>)}
              {codeforcesHandle && !externalProfiles.codeforcesUrl && <span className="member-profile-handle">Codeforces: {codeforcesHandle}</span>}
            </div> : <p className="member-profile-muted">No external profiles added.</p>}
          </div>
        </section>
      </aside>

      <div className="member-profile-content">
        <section className="member-profile-card member-profile-summary">
          <div>
            <h2>Score</h2>
          </div>
          <div className="member-profile-summary-stats">
            <div><small>Leaderboard rank</small><strong>{profile.standing?.rank ? `#${profile.standing.rank}` : '—'}</strong></div>
            <div><small>Total points</small><strong>{profile.standing?.points ?? '—'}</strong></div>
            <div><small>Events attended</small><strong>{profile.standing?.eventsAttended ?? '—'}</strong></div>
          </div>
        </section>

        {isOwner && <section className="member-profile-card member-profile-roadmap-problem-card">
          <div className="member-profile-heading">
            <div><h2>problems solved</h2><p>Progress tracked across your learning roadmaps</p></div>
          </div>
          {roadmapProblemProgress.status === 'loading' && <p className="member-profile-muted">Loading roadmap progress...</p>}
          {roadmapProblemProgress.status === 'unavailable' && <p className="member-profile-muted">Sign in to view your private roadmap progress.</p>}
          {roadmapProblemProgress.status === 'error' && <p className="member-profile-error" role="alert">{roadmapProblemProgress.message} <button type="button" className="member-profile-retry" onClick={() => setRoadmapProgressRetry(current => current + 1)}>Retry</button></p>}
          {roadmapProblemProgress.status === 'ready' && <div className="member-profile-roadmap-progress">
            <div className="member-profile-roadmap-gauge" role="progressbar" aria-label="Roadmap problems solved" aria-valuemin={0} aria-valuemax={roadmapProblemProgress.counts.total || 1} aria-valuenow={roadmapProblemProgress.counts.solved}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                {roadmapDifficultySegments.map(({ difficulty, length, offset, progressLength }) => <g className={`segment-${difficulty}`} key={difficulty}>
                  <circle className="learning-progress-gauge-track" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${length} 188.4`} strokeDashoffset={offset} />
                  {progressLength > 0
                    ? <circle className="learning-progress-gauge-value" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray={`${progressLength} 251.2`} strokeDashoffset={offset} />
                    : <circle className="learning-progress-gauge-marker" cx="50" cy="50" r="40" pathLength="251.2" strokeDasharray="1 250.2" strokeDashoffset={offset} />}
                </g>)}
              </svg>
              <div className="member-profile-roadmap-gauge-label">
                <div><strong>{roadmapProblemProgress.counts.solved}</strong><span>/{roadmapProblemProgress.counts.total}</span></div>
                <small><CheckCircle2 size={15} aria-hidden="true" /> Solved</small>
              </div>
            </div>
            <div className="member-profile-roadmap-difficulty-list">
              {roadmapDifficultySegments.map(({ difficulty, count }) => <div className={`member-profile-roadmap-difficulty is-${difficulty}`} key={difficulty}>
                <span>{difficulty === 'medium' ? 'Med.' : difficulty}</span>
                <strong>{roadmapProblemProgress.counts[`${difficulty}Solved`]} / {count}</strong>
              </div>)}
            </div>
          </div>}
        </section>}

        {goals.length > 0 && <section className="member-profile-card">
          <div className="member-profile-heading"><div><span className="member-profile-eyebrow">LEARNING PLAN</span><h2>Current training goals</h2></div></div>
          <ul className="member-profile-goals">{goals.map((goal, index) => <li key={`${goal}-${index}`}><CheckCircle2 size={17} />{goal}</li>)}</ul>
        </section>}

        <section className="member-profile-card">
          <div className="member-profile-heading"><div><span className="member-profile-eyebrow">ATTENDANCE HISTORY</span><h2>Recent community events</h2></div><Trophy size={19} aria-hidden="true" /></div>
          {profile.attendanceHistory === null ? <p className="member-profile-muted">Attendance history is private.</p> : attendanceFeed.length ? <div className="member-profile-attendance">
            {attendanceFeed.map(entry => <article key={`${entry.event.id}-${entry.checkedInAt}`}>
              <div><h3>{entry.event.title}</h3><p>{entry.event.category} · {eventDate(entry.checkedInAt)}{entry.event.location ? ` · ${entry.event.location}` : ''}</p></div>
              <strong>+{entry.pointsAwarded} pts</strong>
            </article>)}
          </div> : <p className="member-profile-muted">No event attendance recorded yet.</p>}
        </section>
      </div>
    </div>
  </main>;
}
