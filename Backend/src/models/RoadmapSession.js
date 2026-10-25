import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  url: { type: String, required: true, trim: true, maxlength: 500 },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  cycle: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapCycle', required: true, index: true },
  ordinal: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true },
  timeZone: { type: String, required: true, maxlength: 80 },
  sessionDurationMinutes: { type: Number, min: 15, max: 600, default: 120 },
  instructor: { type: String, trim: true, maxlength: 120, default: '' },
  materials: { type: [resourceSchema], default: [] },
  problemSets: { type: [resourceSchema], default: [] },
  attendancePoints: { type: Number, min: 0, default: 0 },
  checkInOpensAt: { type: Date, default: null },
  checkInClosesAt: { type: Date, default: null },
  checkInTokenHash: { type: String, select: false, default: null },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled', index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

sessionSchema.index({ cycle: 1, ordinal: 1 }, { unique: true });

export default mongoose.model('RoadmapSession', sessionSchema);
