import mongoose from 'mongoose';

const otherProfileSchema = new mongoose.Schema({
  platform: { type: String, trim: true, maxlength: 40 },
  url: { type: String, trim: true, maxlength: 500 },
}, { _id: false });

const icpcJourneySchema = new mongoose.Schema({
  contestName: { type: String, trim: true, maxlength: 120 },
  season: { type: String, trim: true, maxlength: 40 },
  stage: { type: String, trim: true, maxlength: 80 },
  result: { type: String, trim: true, maxlength: 100 },
  teamName: { type: String, trim: true, maxlength: 100 },
  teammates: [{ type: String, trim: true, maxlength: 80 }],
  achievement: { type: String, trim: true, maxlength: 160 },
}, { _id: false });

const profileSchema = new mongoose.Schema({
  privacy: {
    profileVisible: { type: Boolean, default: true },
    externalProfilesVisible: { type: Boolean, default: true },
    cpStatsVisible: { type: Boolean, default: true },
    trainingVisible: { type: Boolean, default: true },
    teamStatusVisible: { type: Boolean, default: true },
    journeyVisible: { type: Boolean, default: true },
    attendanceHistoryVisible: { type: Boolean },
  },
  pictureUrl: { type: String, trim: true, maxlength: 500 },
  university: { type: String, trim: true, maxlength: 120 },
  academicYear: { type: String, trim: true, maxlength: 40 },
  graduationYear: { type: Number, min: 1900, max: 2200 },
  bio: { type: String, trim: true, maxlength: 500 },
  programmingLanguages: [{ type: String, trim: true, maxlength: 40 }],
  technicalInterests: [{ type: String, trim: true, maxlength: 60 }],
  externalProfiles: {
    githubUrl: { type: String, trim: true, maxlength: 500 },
    linkedinUrl: { type: String, trim: true, maxlength: 500 },
    codeforcesHandle: { type: String, trim: true, maxlength: 40 },
    codeforcesUrl: { type: String, trim: true, maxlength: 500 },
    otherProfiles: [otherProfileSchema],
  },
  cpStats: {
    platform: { type: String, trim: true, maxlength: 40 },
    handle: { type: String, trim: true, maxlength: 80 },
    problemsSolved: { type: Number, min: 0 },
    contestsParticipated: { type: Number, min: 0 },
    currentRating: { type: Number, min: 0 },
    highestRating: { type: Number, min: 0 },
  },
  icpcJourney: [icpcJourneySchema],
  teamStatus: { type: String, enum: ['looking', 'in_team', 'not_looking'] },
  teamPreferences: {
    preferredLanguage: { type: String, trim: true, maxlength: 40 },
    experience: { type: String, trim: true, maxlength: 200 },
    schedule: { type: String, trim: true, maxlength: 120 },
    preference: { type: String, enum: ['online', 'offline', 'either'] },
    introduction: { type: String, trim: true, maxlength: 300 },
  },
  trainingGoals: [{ type: String, trim: true, maxlength: 120 }],
  trainingTopics: [{ type: String, trim: true, maxlength: 60 }],
  milestones: [{ type: String, trim: true, maxlength: 120 }],
  trainingProgress: { type: String, trim: true, maxlength: 300 },
}, { _id: false });

const notificationPreferencesSchema = new mongoose.Schema({
  contestAnnouncements: { type: Boolean, default: true },
  icpcEvents: { type: Boolean, default: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_]{3,20}$/,
      unique: true,
      sparse: true,
    },
    studentId: { type: String, trim: true, match: /^\d{4,20}$/, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    profile: { type: profileSchema, default: () => ({}) },
    notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

export default mongoose.model('User', userSchema);
