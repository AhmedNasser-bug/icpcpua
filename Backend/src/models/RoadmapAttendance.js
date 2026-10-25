import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapSession', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  checkedInAt: { type: Date, required: true, default: Date.now },
  pointsAwarded: { type: Number, min: 0, required: true, default: 0 },
  pointsReversed: { type: Number, min: 0, default: 0 },
  reversedAt: { type: Date, default: null },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reversalReason: { type: String, trim: true, maxlength: 300, default: '' },
  recordedBy: { type: String, enum: ['qr', 'admin'], default: 'qr' },
  recordedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceSchema.index({ student: 1, checkedInAt: -1 });

export default mongoose.model('RoadmapAttendance', attendanceSchema);
