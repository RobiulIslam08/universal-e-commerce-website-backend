require('dotenv').config();
const nodemailer = require('nodemailer');

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('=== EMAIL CONFIG ===');
console.log('HOST:', EMAIL_HOST);
console.log('PORT:', EMAIL_PORT);
console.log('USER:', EMAIL_USER);
console.log('PASS:', EMAIL_PASS ? `[SET - length: ${EMAIL_PASS.length}]` : '[NOT SET]');
console.log('===================\n');

async function testEmail() {
  // Test 1: Connection verify
  console.log('🔍 Test 1: Verifying connection to mail server...');
  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    await transporter.verify();
    console.log('✅ Connection SUCCESSFUL!\n');
  } catch (err) {
    console.error('❌ Connection FAILED!');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    console.error('   Command:', err.command);
    console.error('   Response:', err.response);
    console.log('\n--- Trying Gmail as fallback ---');
    await testGmail();
    return;
  }

  // Test 2: Send actual test email
  console.log('📧 Test 2: Sending test email to:', EMAIL_USER);
  try {
    const info = await transporter.sendMail({
      from: `"Test" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: 'Test Email - Universal E-Commerce',
      html: '<h1>Test Email Works! ✅</h1><p>Email system is working correctly.</p>',
    });
    console.log('✅ Email SENT successfully!');
    console.log('   MessageId:', info.messageId);
    console.log('   Response:', info.response);
  } catch (err) {
    console.error('❌ Send FAILED!');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    console.error('   Response:', err.response);
  }
}

async function testGmail() {
  // Gmail test with App Password
  const gmailUser = 'robiulislamrobi0874@gmail.com';
  const gmailPass = 'jexq sjej toel goin'; // from .env comment

  console.log('🔍 Testing Gmail SMTP...');
  const gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: gmailUser, pass: gmailPass },
    tls: { rejectUnauthorized: false },
  });

  try {
    await gmailTransporter.verify();
    console.log('✅ Gmail connection SUCCESSFUL!');
    console.log('👉 Switch to Gmail in .env file!');
  } catch (err) {
    console.error('❌ Gmail also FAILED:', err.message);
    console.log('\n=== DIAGNOSIS ===');
    console.log('Both mail servers failed. Please check:');
    console.log('1. Is EMAIL_HOST correct? Try ping from terminal: ping', EMAIL_HOST);
    console.log('2. For Gmail: Enable 2FA and create App Password at https://myaccount.google.com/apppasswords');
    console.log('3. For custom server: Contact your hosting provider');
  }
}

testEmail().catch(console.error);
