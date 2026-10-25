import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  cycle: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapCycle', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
}, { timestamps: true });

enrollmentSchema.index({ cycle: 1, student: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, enrolledAt: -1 });

export default mongoose.model('RoadmapEnrollment', enrollmentSchema);
