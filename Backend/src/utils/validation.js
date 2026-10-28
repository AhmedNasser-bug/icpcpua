export function validateEventInput(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Event details must be a JSON object.'), { status: 400 });
  }
  const fields = ['title', 'description', 'coverImageUrl', 'category', 'startsAt', 'endsAt', 'registrationDeadline', 'checkInOpensAt', 'checkInClosesAt', 'attendancePoints', 'mode', 'location', 'capacity', 'status'];
  const allowed = new Set(fields);
  const unexpected = Object.keys(input).find((key) => !allowed.has(key));
  if (unexpected) throw Object.assign(new Error(`Unexpected field: ${unexpected}`), { status: 400 });

  const output = {};
  for (const key of fields) {
    if (!(key in input)) continue;
    const value = input[key];
    if (key === 'coverImageUrl') {
      if (typeof value !== 'string' || value.trim().length > 500) {
        throw Object.assign(new Error('coverImageUrl must be a URL with 500 characters or fewer.'), { status: 400 });
      }
      const normalized = value.trim();
      if (!normalized) {
        output.coverImageUrl = '';
      } else {
        let url;
        try {
          url = new URL(normalized);
        } catch {
          throw Object.assign(new Error('coverImageUrl must be a valid HTTP or HTTPS URL.'), { status: 400 });
        }
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
          throw Object.assign(new Error('coverImageUrl must be a valid HTTP or HTTPS URL.'), { status: 400 });
        }
        output.coverImageUrl = url.toString();
      }
    } else if (['title', 'description', 'category', 'location'].includes(key)) {
      if (typeof value !== 'string' || (key !== 'location' && !value.trim())) {
        throw Object.assign(new Error(`${key} must be a non-empty string.`), { status: 400 });
      }
      output[key] = value.trim();
    } else if (key === 'startsAt' || key === 'endsAt' || key === 'registrationDeadline' || key === 'checkInOpensAt' || key === 'checkInClosesAt') {
      if (value === null && key !== 'startsAt' && key !== 'endsAt') {
        output[key] = null;
      } else {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw Object.assign(new Error(`${key} must be a valid date.`), { status: 400 });
        output[key] = date;
      }
    } else if (key === 'capacity') {
      if (value === null || value === '') output.capacity = null;
      else if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        throw Object.assign(new Error('capacity must be a positive whole number or null.'), { status: 400 });
      } else output.capacity = Number(value);
    } else if (key === 'attendancePoints') {
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        throw Object.assign(new Error('attendancePoints must be a non-negative number.'), { status: 400 });
      }
      output.attendancePoints = Number(value);
    } else if (key === 'mode') {
      if (!['online', 'offline'].includes(value)) throw Object.assign(new Error('mode must be online or offline.'), { status: 400 });
      output.mode = value;
    } else if (key === 'status') {
      if (!['draft', 'published', 'cancelled'].includes(value)) throw Object.assign(new Error('status must be draft, published, or cancelled.'), { status: 400 });
      output.status = value;
    }
  }

  if (!partial) {
    for (const key of ['title', 'description', 'category', 'startsAt', 'endsAt', 'mode']) {
      if (!(key in output)) throw Object.assign(new Error(`${key} is required.`), { status: 400 });
    }
  }

  const startsAt = output.startsAt;
  const endsAt = output.endsAt;
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw Object.assign(new Error('endsAt must be after startsAt.'), { status: 400 });
  }
  if (output.registrationDeadline && startsAt && output.registrationDeadline >= startsAt) {
    throw Object.assign(new Error('registrationDeadline must be before startsAt.'), { status: 400 });
  }
  const checkInOpensAt = output.checkInOpensAt ?? startsAt;
  const checkInClosesAt = output.checkInClosesAt ?? endsAt;
  if (checkInOpensAt && checkInClosesAt && checkInClosesAt <= checkInOpensAt) {
    throw Object.assign(new Error('checkInClosesAt must be after checkInOpensAt.'), { status: 400 });
  }
  if (output.mode === 'offline' && !('location' in output)) {
    throw Object.assign(new Error('location is required for offline events.'), { status: 400 });
  }
  return output;
}

export function validatePasswordChangeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Password details must be a JSON object.'), { status: 400 });
  }
  const unexpected = Object.keys(input).find((key) => !['currentPassword', 'newPassword'].includes(key));
  if (unexpected) throw Object.assign(new Error(`Unexpected field: ${unexpected}`), { status: 400 });
  if (typeof input.currentPassword !== 'string' || !input.currentPassword) {
    throw Object.assign(new Error('Enter your current password.'), { status: 400 });
  }
  if (typeof input.newPassword !== 'string' || input.newPassword.length < 8) {
    throw Object.assign(new Error('New password must be at least 8 characters.'), { status: 400 });
  }
  return { currentPassword: input.currentPassword, newPassword: input.newPassword };
}

export function validateStudentId(studentId) {
  if (studentId === undefined || studentId === null || studentId === '') return undefined;
  if (typeof studentId !== 'string' || !/^\d{4,20}$/.test(studentId.trim())) {
    throw Object.assign(new Error('Student ID must contain 4–20 digits.'), { status: 400 });
  }
  return studentId.trim();
}

export function validateUsername(username) {
  if (typeof username !== 'string') {
    throw Object.assign(new Error('Username must be 3–20 characters using letters, numbers, and underscores.'), { status: 400 });
  }
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    throw Object.assign(new Error('Username must be 3–20 characters using letters, numbers, and underscores.'), { status: 400 });
  }
  return normalized;
}

const profileFields = new Set([
  'name', 'pictureUrl', 'university', 'academicYear', 'graduationYear', 'bio',
  'programmingLanguages', 'technicalInterests', 'externalProfiles', 'cpStats',
  'icpcJourney', 'teamStatus', 'teamPreferences', 'trainingGoals',
  'trainingTopics', 'milestones', 'trainingProgress',
]);

function invalidProfile(message, field) {
  return Object.assign(new Error(message), { status: 400, field });
}

function validateProfileText(value, field, maxLength) {
  if (typeof value !== 'string') throw invalidProfile(`${field} must be text.`, field);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw invalidProfile(`${field} must be ${maxLength} characters or fewer.`, field);
  return normalized;
}

function validateProfileUrl(value, field) {
  const normalized = validateProfileText(value, field, 500);
  if (!normalized) return '';
  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw invalidProfile(`${field} must be a valid HTTP or HTTPS URL.`, field);
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw invalidProfile(`${field} must be a valid HTTP or HTTPS URL.`, field);
  }
  return url.toString();
}

function validateProfileTextList(value, field, maxItems, maxLength) {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw invalidProfile(`${field} must be a list of up to ${maxItems} items.`, field);
  }
  return value.map((item, index) => validateProfileText(item, `${field}.${index + 1}`, maxLength)).filter(Boolean);
}

function validateProfileObject(input, field, fields) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidProfile(`${field} must be an object.`, field);
  }
  const unexpected = Object.keys(input).find((key) => !fields.includes(key));
  if (unexpected) throw invalidProfile(`Unexpected field: ${field}.${unexpected}`, `${field}.${unexpected}`);
  return input;
}

export function validateStudentProfileInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidProfile('Profile details must be a JSON object.', 'profile');
  }
  const unexpected = Object.keys(input).find((key) => !profileFields.has(key));
  if (unexpected) throw invalidProfile(`Unexpected field: ${unexpected}`, unexpected);

  const output = {};
  if ('name' in input) {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 80) {
      throw invalidProfile('Name must be 1–80 characters.', 'name');
    }
    output.name = input.name.trim();
  }
  const textFields = {
    university: 120,
    academicYear: 40,
    bio: 500,
    trainingProgress: 300,
  };
  for (const [field, maxLength] of Object.entries(textFields)) {
    if (field in input) output[field] = validateProfileText(input[field], field, maxLength);
  }
  if ('pictureUrl' in input) output.pictureUrl = validateProfileUrl(input.pictureUrl, 'pictureUrl');
  if ('graduationYear' in input) {
    const value = input.graduationYear;
    if (value === '' || value === null) output.graduationYear = null;
    else if (!Number.isInteger(Number(value)) || Number(value) < 1900 || Number(value) > 2200) {
      throw invalidProfile('graduationYear must be a valid year or empty.', 'graduationYear');
    } else output.graduationYear = Number(value);
  }
  for (const field of ['programmingLanguages', 'technicalInterests', 'trainingGoals', 'trainingTopics', 'milestones']) {
    if (field in input) output[field] = validateProfileTextList(input[field], field, 20, field === 'trainingTopics' || field === 'technicalInterests' ? 60 : 120);
  }
  if ('externalProfiles' in input) {
    const fields = ['githubUrl', 'linkedinUrl', 'codeforcesHandle', 'codeforcesUrl', 'otherProfiles'];
    const source = validateProfileObject(input.externalProfiles, 'externalProfiles', fields);
    output.externalProfiles = {};
    for (const field of ['githubUrl', 'linkedinUrl', 'codeforcesUrl']) {
      if (field in source) output.externalProfiles[field] = validateProfileUrl(source[field], `externalProfiles.${field}`);
    }
    if ('codeforcesHandle' in source) {
      output.externalProfiles.codeforcesHandle = validateProfileText(source.codeforcesHandle, 'externalProfiles.codeforcesHandle', 40);
    }
    if ('otherProfiles' in source) {
      if (!Array.isArray(source.otherProfiles) || source.otherProfiles.length > 10) {
        throw invalidProfile('otherProfiles must contain up to 10 entries.', 'externalProfiles.otherProfiles');
      }
      output.externalProfiles.otherProfiles = source.otherProfiles.map((entry, index) => {
        const field = `externalProfiles.otherProfiles.${index + 1}`;
        const item = validateProfileObject(entry, field, ['platform', 'url']);
        return {
          platform: validateProfileText(item.platform ?? '', `${field}.platform`, 40),
          url: validateProfileUrl(item.url ?? '', `${field}.url`),
        };
      }).filter((entry) => entry.platform || entry.url);
    }
  }
  if ('cpStats' in input) {
    const fields = ['platform', 'handle', 'problemsSolved', 'contestsParticipated', 'currentRating', 'highestRating'];
    const source = validateProfileObject(input.cpStats, 'cpStats', fields);
    output.cpStats = {};
    for (const field of ['platform', 'handle']) {
      if (field in source) output.cpStats[field] = validateProfileText(source[field], `cpStats.${field}`, field === 'platform' ? 40 : 80);
    }
    for (const field of ['problemsSolved', 'contestsParticipated', 'currentRating', 'highestRating']) {
      if (!(field in source)) continue;
      const value = source[field];
      if (value === '' || value === null) output.cpStats[field] = null;
      else if (!Number.isInteger(Number(value)) || Number(value) < 0) {
        throw invalidProfile(`${field} must be a non-negative whole number or empty.`, `cpStats.${field}`);
      } else output.cpStats[field] = Number(value);
    }
  }
  if ('icpcJourney' in input) {
    if (!Array.isArray(input.icpcJourney) || input.icpcJourney.length > 20) {
      throw invalidProfile('icpcJourney must contain up to 20 entries.', 'icpcJourney');
    }
    const fields = ['contestName', 'season', 'stage', 'result', 'teamName', 'teammates', 'achievement'];
    const limits = { contestName: 120, season: 40, stage: 80, result: 100, teamName: 100, achievement: 160 };
    output.icpcJourney = input.icpcJourney.map((entry, index) => {
      const field = `icpcJourney.${index + 1}`;
      const source = validateProfileObject(entry, field, fields);
      const item = {};
      for (const [key, maxLength] of Object.entries(limits)) {
        if (key in source) item[key] = validateProfileText(source[key], `${field}.${key}`, maxLength);
      }
      if ('teammates' in source) item.teammates = validateProfileTextList(source.teammates, `${field}.teammates`, 10, 80);
      return item;
    }).filter((entry) => Object.values(entry).some((value) => Array.isArray(value) ? value.length : Boolean(value)));
  }
  if ('teamStatus' in input) {
    if (!['looking', 'in_team', 'not_looking', ''].includes(input.teamStatus)) {
      throw invalidProfile('teamStatus must be looking, in_team, not_looking, or empty.', 'teamStatus');
    }
    output.teamStatus = input.teamStatus || null;
  }
  if ('teamPreferences' in input) {
    const fields = ['preferredLanguage', 'experience', 'schedule', 'preference', 'introduction'];
    const source = validateProfileObject(input.teamPreferences, 'teamPreferences', fields);
    output.teamPreferences = {};
    const limits = { preferredLanguage: 40, experience: 200, schedule: 120, introduction: 300 };
    for (const [field, maxLength] of Object.entries(limits)) {
      if (field in source) output.teamPreferences[field] = validateProfileText(source[field], `teamPreferences.${field}`, maxLength);
    }
    if ('preference' in source) {
      if (!['online', 'offline', 'either', ''].includes(source.preference)) {
        throw invalidProfile('preference must be online, offline, either, or empty.', 'teamPreferences.preference');
      }
      output.teamPreferences.preference = source.preference || null;
    }
  }
  return output;
}

export function validateProfilePrivacyInput(input) {
  const fields = [
    'profileVisible',
    'externalProfilesVisible',
    'cpStatsVisible',
    'trainingVisible',
    'teamStatusVisible',
    'journeyVisible',
    'attendanceHistoryVisible',
  ];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidProfile('Privacy preferences must be a JSON object.', 'privacy');
  }
  const unexpected = Object.keys(input).find((key) => !fields.includes(key));
  if (unexpected) throw invalidProfile(`Unexpected privacy setting: ${unexpected}`, `privacy.${unexpected}`);
  if (!Object.keys(input).length) throw invalidProfile('Choose at least one privacy setting to update.', 'privacy');
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'boolean') throw invalidProfile(`${key} must be true or false.`, `privacy.${key}`);
  }
  return input;
}

export function validateNotificationPreferencesInput(input) {
  const fields = ['contestAnnouncements', 'icpcEvents'];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Notification preferences must be a JSON object.'), { status: 400 });
  }
  const unexpected = Object.keys(input).find((key) => !fields.includes(key));
  if (unexpected) throw Object.assign(new Error(`Unsupported notification preference: ${unexpected}`), { status: 400 });
  if (!Object.keys(input).length) {
    throw Object.assign(new Error('Choose at least one notification preference to update.'), { status: 400 });
  }
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'boolean') {
      throw Object.assign(new Error(`${key} must be true or false.`), { status: 400 });
    }
  }
  return input;
}

export function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
