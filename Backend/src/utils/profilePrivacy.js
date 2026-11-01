export function applyPublicProfilePrivacy(source = {}) {
  const sourcePrivacy = source.privacy || {};
  const privacy = {
    profileVisible: true,
    externalProfilesVisible: true,
    cpStatsVisible: true,
    trainingVisible: true,
    teamStatusVisible: true,
    journeyVisible: true,
    ...sourcePrivacy,
  };
  const attendanceHistoryVisible = sourcePrivacy.attendanceHistoryVisible
    ?? sourcePrivacy.journeyVisible
    ?? true;
  if (!privacy.profileVisible) return null;
  const profile = { ...source };
  delete profile.privacy;
  delete profile.codeforcesVerification;
  if (!privacy.externalProfilesVisible) delete profile.externalProfiles;
  if (!privacy.cpStatsVisible) delete profile.cpStats;
  if (!privacy.trainingVisible) {
    delete profile.trainingGoals;
    delete profile.trainingTopics;
    delete profile.milestones;
    delete profile.trainingProgress;
  }
  if (!privacy.teamStatusVisible) {
    delete profile.teamStatus;
    delete profile.teamPreferences;
  }
  if (!privacy.journeyVisible) delete profile.icpcJourney;
  return { profile, attendanceHistoryVisible };
}
