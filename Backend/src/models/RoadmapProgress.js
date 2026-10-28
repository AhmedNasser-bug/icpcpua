import mongoose from 'mongoose';

const solvedProblemSchema = new mongoose.Schema({
  node: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode', required: true },
  problemUrl: { type: String, required: true, trim: true, maxlength: 500 },
}, { _id: false });

const roadmapProgressSchema = new mongoose.Schema({
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  solvedProblems: { type: [solvedProblemSchema], default: [] },
}, { timestamps: true });

roadmapProgressSchema.index({ roadmap: 1, student: 1 }, { unique: true });

export default mongoose.model('RoadmapProgress', roadmapProgressSchema);
