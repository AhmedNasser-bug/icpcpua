import mongoose from 'mongoose';
import { config } from '../config/env.js';

export default async function checkConnectionDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}
