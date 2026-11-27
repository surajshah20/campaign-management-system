import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Strict runtime validation for production
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev-super-secret') || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'FATAL [Configuration Error]: In production, JWT_SECRET must be set in .env to a secure, high-entropy string (minimum 32 characters).'
    );
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('FATAL [Configuration Error]: In production, DATABASE_URL must be specified.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  jwtSecret: process.env.JWT_SECRET || 'dev-super-secret-jwt-key-minimum-32-chars-long!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5174',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'NPR',
};
