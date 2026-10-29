import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Bell, CalendarDays, ChevronLeft, ExternalLink, KeyRound, Link2, LogOut, Moon, Palette, Plus, Shield, Sun, Trophy, UserRound } from "lucide-react";
import { api, eventDate } from "../../../shared/services/api.js";
import { studentProfileForm } from '../utils/profileForm.js';
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
  useEffect(() => {
    setUsername(session.user.username || '');
  }, [session.user.username]);
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
          programmingLanguages: studentProfile.programmingLanguages,
          technicalInterests: studentProfile.technicalInterests,
          cpStats: studentProfile.cpStats,
          icpcJourney: studentProfile.icpcJourney,
          teamStatus: studentProfile.teamStatus,
          teamPreferences: studentProfile.teamPreferences,
          trainingGoals: studentProfile.trainingGoals,
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
  if (!['account', 'profile', 'privacy', 'notifications', 'appearance', 'connections'].includes(section)) {
    return <Navigate to="/settings/account" replace />;
  }
  return <main className="page-wrap settings-page">
      <div className="page-heading"><h1>Settings</h1></div>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {[['account', 'Account', UserRound], ['profile', 'Profile', UserRound], ['privacy', 'Privacy', Shield], ['notifications', 'Notifications', Bell], ['appearance', 'Appearance', Palette], ['connections', 'Connections', Link2]].map(([path, label, Icon]) => <Link key={path} className={section === path ? 'settings-nav-link active' : 'settings-nav-link'} to={`/settings/${path}`} aria-current={section === path ? 'page' : undefined}><Icon size={17} />{label}</Link>)}
        </nav>
        <div className="settings-content">
      {section === 'account' && <section className="settings-card settings-profile-card" aria-labelledby="settings-profile-title">
        <div className="settings-card-heading">
          <div className="profile-avatar settings-avatar" aria-hidden="true">{session.user.name.trim().charAt(0).toUpperCase()}</div>
          <div><span className="eyebrow">ACCOUNT</span><h2 id="settings-profile-title">{session.user.name}</h2></div>
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
        <span className="eyebrow">YOUR STUDENT PROFILE</span>
        <h2>Edit your profile</h2>
        <p>Your existing account name remains required; every other profile field is optional and can be updated later.</p>
        <fieldset>
          <legend>Basic information</legend>
          <label>Full name<input required maxLength="80" value={studentProfile.name} onChange={event => updateStudentProfileField('name', event.target.value)} aria-invalid={Boolean(profileFieldErrors.name)} /></label>
          {profileFieldErrors.name && <span className="field-error">{profileFieldErrors.name}</span>}
          <label>Profile picture URL<input type="text" inputMode="url" maxLength="500" value={studentProfile.pictureUrl} onChange={event => updateStudentProfileField('pictureUrl', event.target.value)} aria-invalid={Boolean(profileFieldErrors.pictureUrl)} /></label>
          {profileFieldErrors.pictureUrl && <span className="field-error">{profileFieldErrors.pictureUrl}</span>}
          <label>University<input maxLength="120" value={studentProfile.university} onChange={event => updateStudentProfileField('university', event.target.value)} /></label>
          <div className="profile-form-grid">
            <label>Academic year<input maxLength="40" placeholder="e.g. 3rd year" value={studentProfile.academicYear} onChange={event => updateStudentProfileField('academicYear', event.target.value)} /></label>
            <label>Graduation year<input type="number" min="1900" max="2200" value={studentProfile.graduationYear} onChange={event => updateStudentProfileField('graduationYear', event.target.value)} /></label>
          </div>
          <label>Short bio<textarea maxLength="500" rows="3" value={studentProfile.bio} onChange={event => updateStudentProfileField('bio', event.target.value)} /></label>
          <label>Programming languages <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile.programmingLanguages.join('\n')} onChange={event => updateStudentProfileField('programmingLanguages', event.target.value.split('\n').map(item => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors.programmingLanguages)} /></label>
          {profileFieldErrors.programmingLanguages && <span className="field-error">{profileFieldErrors.programmingLanguages}</span>}
          <label>Technical interests <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile.technicalInterests.join('\n')} onChange={event => updateStudentProfileField('technicalInterests', event.target.value.split('\n').map(item => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors.technicalInterests)} /></label>
          {profileFieldErrors.technicalInterests && <span className="field-error">{profileFieldErrors.technicalInterests}</span>}
        </fieldset>
        <fieldset>
          <legend>Competitive programming</legend>
          <p className="profile-field-hint">These values are self-reported and will be shown as unverified. No platform integration is connected.</p>
          <div className="profile-form-grid">
            <label>Platform<input maxLength="40" value={studentProfile.cpStats.platform} onChange={event => updateNestedProfileField('cpStats', 'platform', event.target.value)} /></label>
            <label>Handle<input maxLength="80" value={studentProfile.cpStats.handle} onChange={event => updateNestedProfileField('cpStats', 'handle', event.target.value)} /></label>
            {[['problemsSolved', 'Problems solved'], ['contestsParticipated', 'Contests participated'], ['currentRating', 'Current rating'], ['highestRating', 'Highest rating']].map(([field, label]) => <label key={field}>{label}<input type="number" min="0" step="1" value={studentProfile.cpStats[field]} onChange={event => updateNestedProfileField('cpStats', field, event.target.value)} aria-invalid={Boolean(profileFieldErrors[`cpStats.${field}`])} />{profileFieldErrors[`cpStats.${field}`] && <span className="field-error">{profileFieldErrors[`cpStats.${field}`]}</span>}</label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Looking for a team</legend>
          <label>Team status<select value={studentProfile.teamStatus} onChange={event => updateStudentProfileField('teamStatus', event.target.value)}><option value="">Not specified</option><option value="looking">Looking for a team</option><option value="in_team">Already in a team</option><option value="not_looking">Not currently looking</option></select></label>
          {studentProfile.teamStatus === 'looking' && <div className="profile-form-grid">
            <label>Preferred programming language<input maxLength="40" value={studentProfile.teamPreferences.preferredLanguage} onChange={event => updateNestedProfileField('teamPreferences', 'preferredLanguage', event.target.value)} /></label>
            <label>Experience or approximate level<input maxLength="200" value={studentProfile.teamPreferences.experience} onChange={event => updateNestedProfileField('teamPreferences', 'experience', event.target.value)} /></label>
            <label>Preferred training schedule<input maxLength="120" value={studentProfile.teamPreferences.schedule} onChange={event => updateNestedProfileField('teamPreferences', 'schedule', event.target.value)} /></label>
            <label>Training preference<select value={studentProfile.teamPreferences.preference} onChange={event => updateNestedProfileField('teamPreferences', 'preference', event.target.value)}><option value="">Not specified</option><option value="online">Online</option><option value="offline">Offline</option><option value="either">Either</option></select></label>
            <label className="profile-form-wide">Introduction for potential teammates<textarea maxLength="300" rows="3" value={studentProfile.teamPreferences.introduction} onChange={event => updateNestedProfileField('teamPreferences', 'introduction', event.target.value)} /></label>
          </div>}
        </fieldset>
        <fieldset>
          <legend>Training goals</legend>
          <label>Current learning goals <span className="profile-field-hint">One per line</span><textarea rows="3" value={studentProfile.trainingGoals.join('\n')} onChange={event => updateStudentProfileField('trainingGoals', event.target.value.split('\n').map(item => item.trim()).filter(Boolean))} aria-invalid={Boolean(profileFieldErrors.trainingGoals)} />{profileFieldErrors.trainingGoals && <span className="field-error">{profileFieldErrors.trainingGoals}</span>}</label>
        </fieldset>
        {profileSaveError && <div className="notice error-notice" role="alert">{profileSaveError}</div>}
        {profileSaveSuccess && <div className="notice success-notice" role="status">{profileSaveSuccess}</div>}
        <div className="profile-form-actions"><button className="button button-outline" type="button" onClick={cancelStudentProfile} disabled={profileSaveBusy}>Cancel</button><button className="button button-dark" type="submit" disabled={profileSaveBusy}>{profileSaveBusy ? 'Saving profile...' : 'Save changes'} <ArrowRight size={16} /></button></div>
      </form>}
      {section === 'connections' && <form className="settings-card profile-editor" onSubmit={saveConnections}>
        <span className="eyebrow">MANUALLY ENTERED PROFILES</span>
        <h2>Public profile links</h2>
        <p>These are public profile links and handles only. They are not authenticated account connections, and every field is optional.</p>
        <fieldset>
          <legend>Competitive and social profiles</legend>
          {[['githubUrl', 'GitHub profile URL'], ['linkedinUrl', 'LinkedIn profile URL'], ['codeforcesUrl', 'Codeforces profile URL']].map(([field, label]) => {
              const key = `externalProfiles.${field}`;
              return <div key={field}>
              <label>{label}<input type="text" inputMode="url" maxLength="500" value={studentProfile.externalProfiles[field]} onChange={event => updateNestedProfileField('externalProfiles', field, event.target.value)} aria-invalid={Boolean(profileFieldErrors[key])} /></label>
              {profileFieldErrors[key] && <span className="field-error">{profileFieldErrors[key]}</span>}
            </div>;
            })}
          <label>Codeforces handle<input maxLength="40" value={studentProfile.externalProfiles.codeforcesHandle} onChange={event => updateNestedProfileField('externalProfiles', 'codeforcesHandle', event.target.value)} /></label>
          {studentProfile.externalProfiles.otherProfiles.map((entry, index) => <div className="profile-form-grid profile-other-link" key={`other-profile-${index}`}>
            <label>Platform<input maxLength="40" value={entry.platform} onChange={event => setStudentProfile(current => ({
                  ...current,
                  externalProfiles: {
                    ...current.externalProfiles,
                    otherProfiles: current.externalProfiles.otherProfiles.map((item, itemIndex) => itemIndex === index ? {
                      ...item,
                      platform: event.target.value
                    } : item)
                  }
                }))} /></label>
            <label>Profile URL<input type="text" inputMode="url" maxLength="500" value={entry.url} onChange={event => setStudentProfile(current => ({
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
        <span className="eyebrow">ACCOUNT SECURITY</span>
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
          {[['profileVisible', 'Public profile', 'Show your public profile page and list your name on the community leaderboard.'], ['externalProfilesVisible', 'External profile links', 'Show your manually entered GitHub, LinkedIn, Codeforces, and other profile links.'], ['cpStatsVisible', 'Competitive programming stats', 'Show self-reported platform ratings and counts. Verified community leaderboard points remain visible.'], ['trainingVisible', 'Training interests and goals', 'Show the topics, milestones, and training goals on your profile.'], ['teamStatusVisible', 'Team status and preferences', 'Show whether you are looking for a team and any preferences you shared.'], ['attendanceHistoryVisible', 'Attendance history', 'Show verified community event attendance on your public profile.']].map(([key, label, description]) => <label className="privacy-option" key={key}>
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
          <p>Choose which supported updates you receive in the future. Existing notifications remain in your inbox. Essential account-security messages are not controlled here.</p>
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
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api(`/events/${encodeURIComponent(username)}/profile`).then(({
      profile: result
    }) => active && setProfile(result)).catch(reason => active && setError(reason.message)).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [username]);
  if (loading) return <main className="page-wrap"><div className="empty-state"><span className="loader" /> Loading member profile...</div></main>;
  if (error || !profile) return <main className="page-wrap"><div className="notice error-notice">{error || 'Member profile not found.'}</div><Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link></main>;
  const details = profile.profile || {};
  const externalProfiles = details.externalProfiles || {};
  const externalLinks = [['GitHub', externalProfiles.githubUrl], ['LinkedIn', externalProfiles.linkedinUrl], ['Codeforces', externalProfiles.codeforcesUrl], ...(externalProfiles.otherProfiles || []).map(item => [item.platform || 'Other profile', item.url])].map(([label, value]) => ({
    label,
    url: safeExternalUrl(value)
  })).filter(item => item.label && item.url);
  const cpStats = details.cpStats || {};
  const visibleStats = [['Problems solved', cpStats.problemsSolved], ['Contests participated', cpStats.contestsParticipated], ['Current rating', cpStats.currentRating], ['Highest rating', cpStats.highestRating]].filter(([, value]) => value !== null && value !== undefined && value !== '');
  const isOwner = session.user?.username && session.user.username === profile.username;
  return <main className="page-wrap profile-page">
      <Link className="back-link" to="/leaderboard"><ChevronLeft size={16} /> Back to leaderboard</Link>
      <section className="profile-card">
        <div className="profile-identity">
          <div className="profile-avatar" aria-hidden="true">{profile.name.trim().charAt(0).toUpperCase()}{safeExternalUrl(details.pictureUrl) && <img src={safeExternalUrl(details.pictureUrl)} alt="" onError={event => event.currentTarget.remove()} />}</div>
          <div className="profile-identity-copy"><span className="eyebrow">PUA ICPC COMMUNITY MEMBER</span><h1>{profile.name}</h1><p>{[details.university, details.academicYear, details.graduationYear ? `Class of ${details.graduationYear}` : ''].filter(Boolean).join(' · ') || `Member since ${new Date(profile.joinedAt).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric'
            })}`}</p>{details.teamStatus && <span className="team-status-badge">{details.teamStatus === 'looking' ? 'Looking for a Team' : details.teamStatus === 'in_team' ? 'Already in a Team' : 'Not Looking for a Team'}</span>}</div>
          {isOwner && <Link className="button button-dark profile-edit-button" to="/settings/profile">Edit profile <ArrowRight size={15} /></Link>}
        </div>
        <div className="profile-stats">
          <div><small>LEADERBOARD RANK</small><strong>{profile.standing.rank ? `#${profile.standing.rank}` : '—'}</strong></div>
          <div><small>TOTAL POINTS</small><strong>{profile.standing.points}</strong></div>
          <div><small>EVENTS ATTENDED</small><strong>{profile.standing.eventsAttended}</strong></div>
        </div>
      </section>
      {(details.bio || details.programmingLanguages?.length || details.technicalInterests?.length) && <section className="profile-section">
        <h2>About</h2>
        {details.bio && <p className="profile-bio">{details.bio}</p>}
        {details.programmingLanguages?.length > 0 && <div className="profile-detail-row"><strong>Languages</strong><div className="profile-chip-list">{details.programmingLanguages.map(language => <span className="profile-chip" key={language}>{language}</span>)}</div></div>}
        {details.technicalInterests?.length > 0 && <div className="profile-detail-row"><strong>Interests</strong><div className="profile-chip-list">{details.technicalInterests.map(interest => <span className="profile-chip" key={interest}>{interest}</span>)}</div></div>}
      </section>}
      {externalLinks.length > 0 && <section className="profile-section">
        <h2>External profiles</h2>
        <div className="profile-external-links">{externalLinks.map(({
          label,
          url
        }) => <a key={`${label}-${url}`} href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={14} /></a>)}</div>
        {externalProfiles.codeforcesHandle && <p className="profile-handle">Codeforces handle: <strong>{externalProfiles.codeforcesHandle}</strong></p>}
      </section>}
      {!externalLinks.length && externalProfiles.codeforcesHandle && <section className="profile-section"><h2>Competitive programming profile</h2><p className="profile-handle">Codeforces handle: <strong>{externalProfiles.codeforcesHandle}</strong></p></section>}
      {(visibleStats.length > 0 || cpStats.platform || cpStats.handle) && <section className="profile-section">
        <div className="profile-section-heading"><h2>Competitive programming</h2><span className="unverified-badge">Self-reported · Unverified</span></div>
        {(cpStats.platform || cpStats.handle) && <p className="profile-handle">{[cpStats.platform, cpStats.handle].filter(Boolean).join(' · ')}</p>}
        <div className="profile-cp-stats">{visibleStats.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
      </section>}
      {details.icpcJourney?.length > 0 && <section className="profile-section">
        <div className="profile-section-heading"><h2>ICPC journey</h2><span className="unverified-badge">User-provided · Unverified</span></div>
        <div className="profile-journey-list">{details.icpcJourney.map((entry, index) => <article className="profile-journey-card" key={`${entry.contestName || 'contest'}-${entry.season || index}-${index}`}>
          <h3>{entry.contestName || 'ICPC participation'}</h3>
          <p>{[entry.season, entry.stage, entry.result].filter(Boolean).join(' · ')}</p>
          {entry.teamName && <p><strong>Team:</strong> {entry.teamName}</p>}
          {entry.teammates?.length > 0 && <p><strong>Teammates:</strong> {entry.teammates.join(', ')}</p>}
          {entry.achievement && <p><strong>Achievement:</strong> {entry.achievement}</p>}
        </article>)}</div>
      </section>}
      {details.teamStatus === 'looking' && details.teamPreferences && Object.values(details.teamPreferences).some(Boolean) && <section className="profile-section">
        <h2>Team preferences</h2>
        <div className="profile-public-details">
          {details.teamPreferences.preferredLanguage && <p><strong>Preferred language:</strong> {details.teamPreferences.preferredLanguage}</p>}
          {details.teamPreferences.experience && <p><strong>Experience:</strong> {details.teamPreferences.experience}</p>}
          {details.teamPreferences.schedule && <p><strong>Training schedule:</strong> {details.teamPreferences.schedule}</p>}
          {details.teamPreferences.preference && <p><strong>Training preference:</strong> {details.teamPreferences.preference}</p>}
          {details.teamPreferences.introduction && <p>{details.teamPreferences.introduction}</p>}
        </div>
      </section>}
      {(details.trainingGoals?.length || details.trainingTopics?.length || details.milestones?.length || details.trainingProgress) && <section className="profile-section">
        <h2>Training goals</h2>
        {details.trainingGoals?.length > 0 && <div className="profile-detail-row"><strong>Goals</strong><div className="profile-chip-list">{details.trainingGoals.map(goal => <span className="profile-chip" key={goal}>{goal}</span>)}</div></div>}
        {details.trainingTopics?.length > 0 && <div className="profile-detail-row"><strong>Studying</strong><div className="profile-chip-list">{details.trainingTopics.map(topic => <span className="profile-chip" key={topic}>{topic}</span>)}</div></div>}
        {details.milestones?.length > 0 && <div className="profile-detail-row"><strong>Milestones</strong><div className="profile-chip-list">{details.milestones.map(milestone => <span className="profile-chip" key={milestone}>{milestone}</span>)}</div></div>}
        {details.trainingProgress && <p className="profile-bio">{details.trainingProgress}</p>}
      </section>}
      {profile.attendanceHistory && <section className="profile-history">
        <div className="profile-history-heading"><span className="eyebrow"><CalendarDays size={15} /> ATTENDANCE HISTORY</span></div>
        {profile.attendanceHistory.length ? profile.attendanceHistory.map(entry => <article className="profile-history-row" key={`${entry.event.id}-${entry.checkedInAt}`}>
            <div><span className="category-label">{entry.event.category}</span><h2><Link to={`/events/${entry.event.slug}`}>{entry.event.title}</Link></h2><small>{eventDate(entry.checkedInAt)} · {entry.event.location || 'Online'}</small></div>
            <strong><Trophy size={15} /> +{entry.pointsAwarded} pts</strong>
          </article>) : <div className="profile-empty-history"><p>No event attendance recorded yet.</p><Link className="button button-dark" to="/">Explore events <ArrowRight size={16} /></Link></div>}
      </section>}
    </main>;
}
