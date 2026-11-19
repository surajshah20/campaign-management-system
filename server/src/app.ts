import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import clientRoutes from './routes/client.routes';
import teamRoutes from './routes/team.routes';
import activityRoutes from './routes/activity.routes';
import campaignRoutes from './routes/campaign.routes';
import taskRoutes from './routes/task.routes';
import contentRoutes from './routes/content.routes';
import portalRoutes from './routes/portal.routes';
import advertisingRoutes from './routes/advertising.routes';
import analyticsRoutes from './routes/analytics.routes';

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-agency-id'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'agency-os-api',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/advertising', advertisingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
