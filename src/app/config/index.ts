import dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to load .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

// process.cwd() gets the current working directory (CWD) of the Node.js process. This typically points to the root directory of your project.
// Combines the current working directory (process.cwd()) with the string '.env' to create the full path to the .env file.
// dotenv.config is called with the { path } option to tell dotenv where to find the .env filedotenv.config is called with the { path } option to tell dotenv where to find the .env file

export default {
  port: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL,

  bcrypt_solt_rounds: process.env.BCYPT_SALT_ROUNDS,
  default_pass: process.env.DEFAULT_PASS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  // Email configuration
  email_host: process.env.EMAIL_HOST,
  email_port: process.env.EMAIL_PORT,
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,
  email_from_name: process.env.EMAIL_FROM_NAME || 'UNIVERSEL',

  // ============================================================
  // CARRIER / COURIER API CONFIGURATION
  // পরে client এর কাছ থেকে API keys পেলে .env এ বসাবেন
  // ============================================================

  // DHL API (https://developer.dhl.com)
  dhl_api_url: process.env.DHL_API_URL,
  dhl_api_key: process.env.DHL_API_KEY,
  dhl_account_number: process.env.DHL_ACCOUNT_NUMBER,

  // FedEx API (https://developer.fedex.com)
  fedex_api_url: process.env.FEDEX_API_URL,
  fedex_api_key: process.env.FEDEX_API_KEY,
  fedex_account_number: process.env.FEDEX_ACCOUNT_NUMBER,
  fedex_client_id: process.env.FEDEX_CLIENT_ID,
  fedex_client_secret: process.env.FEDEX_CLIENT_SECRET,

  // UPS API (https://developer.ups.com)
  ups_api_url: process.env.UPS_API_URL,
  ups_api_key: process.env.UPS_API_KEY,
  ups_account_number: process.env.UPS_ACCOUNT_NUMBER,

  // USPS API (https://www.usps.com/business/web-tools-apis)
  usps_api_url: process.env.USPS_API_URL,
  usps_api_key: process.env.USPS_API_KEY,
  usps_user_id: process.env.USPS_USER_ID,

  // Local Courier API (আপনার নিজস্ব courier এর জন্য)
  local_courier_api_url: process.env.LOCAL_COURIER_API_URL,
  local_courier_api_key: process.env.LOCAL_COURIER_API_KEY,

  // ============================================================
  // STORE / WAREHOUSE INFO
  // Shipping label এ sender address হিসেবে ব্যবহার হবে
  // ============================================================
  store_name: process.env.STORE_NAME || 'E-Commerce Store',
  store_address: process.env.STORE_ADDRESS || '123 Store Street',
  store_city: process.env.STORE_CITY || 'New York',
  store_state: process.env.STORE_STATE || 'NY',
  store_zip_code: process.env.STORE_ZIP_CODE || '10001',
  store_country: process.env.STORE_COUNTRY || 'US',
  store_phone: process.env.STORE_PHONE || '+1-555-000-0000',

  // Frontend URL (email এ order detail link এর জন্য)
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',

  // CORS origins (comma-separated)
  cors_origin: process.env.CORS_ORIGIN,
};
