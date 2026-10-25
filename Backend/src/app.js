import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { isAllowedClientOrigin } from './config/env.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import roadmapRoutes from './routes/roadmaps.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    return callback(null, !origin || isAllowedClientOrigin(origin));
  },
}));
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
