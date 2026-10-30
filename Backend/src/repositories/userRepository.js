import User from '../models/User.js';

export function findByEmailWithPassword(email) {
  return User.findOne({ email }).select('+passwordHash');
}

export function findByEmail(email) {
  return User.findOne({ email });
}

export function findByGoogleId(googleId) {
  return User.findOne({ googleId });
}

export function linkGoogleIdentity(email, googleId) {
  return User.findOneAndUpdate(
    {
      email,
      $or: [{ googleId: { $exists: false } }, { googleId: null }, { googleId }],
    },
    { $set: { googleId } },
    { new: true, runValidators: true },
  );
}

export function setGooglePictureIfMissing(userId, pictureUrl) {
  return User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { 'profile.pictureUrl': { $exists: false } },
        { 'profile.pictureUrl': null },
        { 'profile.pictureUrl': '' },
      ],
    },
    { $set: { 'profile.pictureUrl': pictureUrl } },
    { new: true, runValidators: true },
  );
}

export function createUser(data) {
  return User.create(data);
}

export function findByIdWithPassword(id) {
  return User.findById(id).select('+passwordHash');
}

export function updatePasswordIfUnchanged(id, currentHash, passwordHash) {
  return User.findOneAndUpdate(
    { _id: id, passwordHash: currentHash },
    { $set: { passwordHash } },
    { new: true },
  );
}

export function setStudentIdIfMissing(userId, studentId) {
  return User.findOneAndUpdate(
    { _id: userId, studentId: { $exists: false } },
    { $set: { studentId } },
    { new: true, runValidators: true },
  );
}

export function setUsername(userId, username) {
  return User.findOneAndUpdate(
    { _id: userId },
    { $set: { username } },
    { new: true, runValidators: true },
  );
}

function flattenProfile(profile, prefix = 'profile') {
  return Object.entries(profile).flatMap(([key, value]) => {
    const path = `${prefix}.${key}`;
    if (value && typeof value === 'object' && !Array.isArray(value)) return flattenProfile(value, path);
    return [[path, value]];
  });
}

export function updateStudentProfile(userId, profile) {
  const updates = Object.fromEntries(Object.entries(profile).flatMap(([key, value]) => (
    key === 'name' ? [['name', value]] : flattenProfile({ [key]: value })
  )));
  if (!Object.keys(updates).length) return User.findById(userId);
  return User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
}

export function updateProfilePrivacy(userId, privacy) {
  const updates = Object.fromEntries(Object.entries(privacy).map(([key, value]) => [`profile.privacy.${key}`, value]));
  return User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
}

export function updateNotificationPreferences(userId, preferences) {
  const updates = Object.fromEntries(Object.entries(preferences).map(([key, value]) => [`notificationPreferences.${key}`, value]));
  return User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
}

export function findPublicMemberByUsername(username) {
  return User.findOne({ username, role: 'user' }).select('name username createdAt profile');
}
