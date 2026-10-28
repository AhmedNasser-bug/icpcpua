import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  coverImageUrl: { type: String, trim: true, maxlength: 500, default: '' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedDuration: { type: String, trim: true, maxlength: 80, default: '' },
  objectives: [{ type: String, trim: true, maxlength: 160 }],
  audience: { type: String, trim: true, maxlength: 500, default: '' },
  prerequisites: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['draft', 'published', 'completed', 'archived'], default: 'draft', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model('Roadmap', roadmapSchema);
