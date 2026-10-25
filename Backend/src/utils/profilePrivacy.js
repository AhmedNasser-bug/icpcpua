export function applyPublicProfilePrivacy(source = {}) {
  const privacy = {
    profileVisible: true,
    externalProfilesVisible: true,
    cpStatsVisible: true,
    trainingVisible: true,
    teamStatusVisible: true,
    journeyVisible: true,
    ...(source.privacy || {}),
  };
  if (!privacy.profileVisible) return null;
  const profile = { ...source };
  delete profile.privacy;
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
  return { profile, journeyVisible: privacy.journeyVisible };
}
