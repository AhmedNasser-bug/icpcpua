import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, enum: ['contest_announcement', 'icpc_event'], required: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  message: { type: String, required: true, trim: true, maxlength: 240 },
  link: { type: String, required: true, trim: true, maxlength: 300 },
  sourceKey: { type: String, required: true, maxlength: 160 },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ user: 1, sourceKey: 1 }, { unique: true });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
