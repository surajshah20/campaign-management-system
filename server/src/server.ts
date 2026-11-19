import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`[Agency OS API] Server running on http://localhost:${config.port}`);
  console.log(`[Agency OS API] Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('[Agency OS API] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Agency OS API] Server closed.');
  });
});
