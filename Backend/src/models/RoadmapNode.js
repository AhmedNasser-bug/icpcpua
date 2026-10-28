import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  url: { type: String, required: true, trim: true, maxlength: 500 },
}, { _id: false });

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  url: { type: String, required: true, trim: true, maxlength: 500 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
}, { _id: false });

const roadmapNodeSchema = new mongoose.Schema({
  roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 3000, default: '' },
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapNode' }],
  position: { type: Number, min: 0, default: 0 },
  estimatedHours: { type: Number, min: 0, default: null },
  resources: { type: [resourceSchema], default: [] },
  problems: { type: [problemSchema], default: [] },
  isRequired: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

roadmapNodeSchema.index({ roadmap: 1, position: 1, createdAt: 1 });

export default mongoose.model('RoadmapNode', roadmapNodeSchema);
