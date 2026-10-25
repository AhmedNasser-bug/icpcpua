import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema({
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
  order: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  objectives: [{ type: String, trim: true, maxlength: 160 }],
  prerequisites: { type: String, trim: true, maxlength: 1000, default: '' },
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  sessionsPerWeek: { type: Number, required: true, min: 1, max: 7 },
  trainingDays: [{ type: Number, min: 0, max: 6 }],
  startTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
  sessionDurationMinutes: { type: Number, required: true, min: 15, max: 600 },
  timeZone: { type: String, required: true, maxlength: 80 },
  registrationOpensAt: { type: Date, required: true },
  registrationClosesAt: { type: Date, required: true },
  capacity: { type: Number, min: 1, default: null },
  enrollmentCount: { type: Number, min: 0, default: 0 },
  attendancePoints: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['draft', 'published', 'completed', 'cancelled', 'archived'], default: 'draft', index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

cycleSchema.index({ roadmap: 1, order: 1 }, { unique: true });
cycleSchema.index({ status: 1, registrationOpensAt: 1, registrationClosesAt: 1 });

export default mongoose.model('RoadmapCycle', cycleSchema);
