const teamPreferenceOptions = ['online', 'offline', 'either'];
const teamStatusOptions = ['looking', 'in_team', 'not_looking'];

export function normalizeTeamPreference(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  return teamPreferenceOptions.includes(normalized) ? normalized : '';
}

export function normalizeTeamStatus(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (teamStatusOptions.includes(normalized)) return normalized;
  if (['', 'not specified', 'none'].includes(normalized)) return '';
  if (normalized === 'looking for a team') return 'looking';
  if (normalized === 'already in a team') return 'in_team';
  if (normalized === 'not currently looking') return 'not_looking';
  return '';
}

export function studentProfileForm(profile = {}, name = '') {
  return {
    name,
    pictureUrl: profile.pictureUrl || '',
    university: profile.university || '',
    academicYear: profile.academicYear || '',
    graduationYear: profile.graduationYear || '',
    bio: profile.bio || '',
    programmingLanguages: profile.programmingLanguages || [],
    technicalInterests: profile.technicalInterests || [],
    externalProfiles: {
      githubUrl: profile.externalProfiles?.githubUrl || '',
      linkedinUrl: profile.externalProfiles?.linkedinUrl || '',
      codeforcesHandle: profile.externalProfiles?.codeforcesHandle || '',
      codeforcesUrl: profile.externalProfiles?.codeforcesUrl || '',
      otherProfiles: profile.externalProfiles?.otherProfiles || []
    },
    cpStats: {
      platform: profile.cpStats?.platform || '',
      handle: profile.cpStats?.handle || '',
      problemsSolved: profile.cpStats?.problemsSolved ?? '',
      contestsParticipated: profile.cpStats?.contestsParticipated ?? '',
      currentRating: profile.cpStats?.currentRating ?? '',
      highestRating: profile.cpStats?.highestRating ?? ''
    },
    icpcJourney: profile.icpcJourney || [],
    teamStatus: normalizeTeamStatus(profile.teamStatus),
    teamPreferences: {
      preferredLanguage: profile.teamPreferences?.preferredLanguage || '',
      experience: profile.teamPreferences?.experience || '',
      schedule: profile.teamPreferences?.schedule || '',
      preference: normalizeTeamPreference(profile.teamPreferences?.preference),
      introduction: profile.teamPreferences?.introduction || ''
    },
    trainingGoals: profile.trainingGoals || [],
    trainingTopics: profile.trainingTopics || [],
    milestones: profile.milestones || [],
    trainingProgress: profile.trainingProgress || ''
  };
}
