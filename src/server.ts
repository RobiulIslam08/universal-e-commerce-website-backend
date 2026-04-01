import app from './app';
import config from './app/config';

import mongoose from 'mongoose';
import { testEmailConnection } from './app/utils/sendEmail';

// Validate critical environment variables at startup
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(', ')}`,
  );
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(config.database_url as string, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Database connected successfully');

    // Email connection verify করুন (startup এ)
    await testEmailConnection();

    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }
}
main();

