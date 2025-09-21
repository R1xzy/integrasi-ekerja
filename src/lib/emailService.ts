import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Email verification types
type EmailVerificationType = 'REGISTRATION' | 'PASSWORD_RESET' | 'ORDER_STATUS_CHANGE';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Generate random 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save verification code to database
export const saveVerificationCode = async (
  email: string,
  code: string,
  type: 'REGISTRATION' | 'PASSWORD_RESET' | 'ORDER_STATUS_CHANGE',
  userId?: number
) => {
  // Set expiry time (10 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Invalidate any existing unused codes for this email and type
  await (prisma as any).emailVerification.updateMany({
    where: {
      email,
      type,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });

  // Create new verification record
  const verification = await (prisma as any).emailVerification.create({
    data: {
      email,
      code,
      type,
      expiresAt,
      userId,
    },
  });

  return verification;
};

// Verify code from database
export const verifyCode = async (
  email: string,
  code: string,
  type: 'REGISTRATION' | 'PASSWORD_RESET' | 'ORDER_STATUS_CHANGE'
) => {
  const verification = await (prisma as any).emailVerification.findFirst({
    where: {
      email,
      code,
      type,
      isUsed: false,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!verification) {
    return null;
  }

  // Mark code as used
  await (prisma as any).emailVerification.update({
    where: {
      id: verification.id,
    },
    data: {
      isUsed: true,
    },
  });

  return verification;
};

// --- PERUBAHAN UTAMA DIMULAI DI SINI ---

// Email templates
export const getEmailTemplate = (type: string, data: { code: string; link?: string }, additionalData?: any) => {
  const { code, link } = data; // Ekstrak kode dan link

  const baseStyle = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  `;

  const headerStyle = `
    background-color: #007bff;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
    margin: -20px -20px 20px -20px;
  `;

  const codeStyle = `
    font-size: 32px;
    font-weight: bold;
    color: #007bff;
    text-align: center;
    padding: 20px;
    border: 2px dashed #007bff;
    border-radius: 8px;
    margin: 20px 0;
    letter-spacing: 5px;
  `;

  // Gaya baru untuk tombol
  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    margin: 20px 0;
    background-color: #007bff;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    text-align: center;
  `;

  switch (type) {
    case 'REGISTRATION':
      // Template registrasi tetap menggunakan kode
      return {
        subject: 'Verifikasi Registrasi - eKerja Karawang',
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1>Verifikasi Registrasi</h1>
            </div>
            <h2>Selamat datang di eKerja Karawang!</h2>
            <p>Terima kasih telah mendaftar. Untuk menyelesaikan proses registrasi, gunakan kode verifikasi berikut:</p>
            <div style="${codeStyle}">${code}</div>
            <p><strong>Kode ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">© 2025 eKerja Karawang. Semua hak dilindungi.</p>
          </div>
        `,
      };

    case 'PASSWORD_RESET':
      // Template reset password sekarang menggunakan link/tombol
      return {
        subject: 'Reset Password - eKerja Karawang',
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1>Reset Password</h1>
            </div>
            <h2>Permintaan Reset Password</h2>
            <p>Kami menerima permintaan untuk mereset password akun Anda. Silakan klik tombol di bawah ini untuk melanjutkan:</p>
            <div style="text-align: center;">
              <a href="${link}" style="${buttonStyle}" target="_blank">Reset Password Anda</a>
            </div>
            <p>Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut di browser Anda:</p>
            <p style="font-size: 12px; word-break: break-all;">${link}</p>
            <p><strong>Tautan ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <p style="color: #d9534f;"><strong>Jika Anda tidak meminta reset password, mohon abaikan email ini.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">© 2025 eKerja Karawang. Semua hak dilindungi.</p>
          </div>
        `,
      };

    case 'ORDER_STATUS_CHANGE':
      // Template ini juga tetap menggunakan kode
      const { orderNumber, newStatus, customerName, providerName, serviceName } = additionalData || {};
      return {
        subject: `Perubahan Status Pesanan #${orderNumber} - eKerja Karawang`,
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1>Perubahan Status Pesanan</h1>
            </div>
            <h2>Status pesanan Anda telah diubah</h2>
            <p>Halo <strong>${customerName}</strong>,</p>
            <p>Detail perubahan:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nomor Pesanan:</strong> #${orderNumber}</p>
              <p><strong>Layanan:</strong> ${serviceName}</p>
              <p><strong>Provider:</strong> ${providerName}</p>
              <p><strong>Status Baru:</strong> <span style="color: #007bff; font-weight: bold;">${newStatus}</span></p>
            </div>
            <p>Untuk memverifikasi perubahan ini, gunakan kode berikut:</p>
            <div style="${codeStyle}">${code}</div>
            <p><strong>Kode ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">© 2025 eKerja Karawang. Semua hak dilindungi.</p>
          </div>
        `,
      };

    default:
      throw new Error('Unknown email template type');
  }
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV === 'development' && process.env.SMTP_PASSWORD === 'demo-mode-password') {
      console.log('=== EMAIL DEMO MODE ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('=======================');
      return true;
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: `"eKerja Karawang" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Combined function to generate, save, and send verification email
export const sendVerificationEmail = async (
  email: string,
  type: 'REGISTRATION' | 'PASSWORD_RESET' | 'ORDER_STATUS_CHANGE',
  additionalData?: any,
  userId?: number
): Promise<{ success: boolean; code?: string; error?: string }> => {
  try {
    const code = generateVerificationCode(); // Kode/Token tetap dibuat
    await saveVerificationCode(email, code, type, userId);

    let templateData: { code: string; link?: string } = { code };
    
    // Jika tipenya adalah PASSWORD_RESET, buat link-nya
    if (type === 'PASSWORD_RESET') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      templateData.link = `${baseUrl}/password/resetpassword?token=${code}`;
    }

    const template = getEmailTemplate(type, templateData, additionalData);
    const emailSent = await sendEmail(email, template.subject, template.html);

    if (!emailSent) {
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true, code: process.env.NODE_ENV === 'development' ? code : undefined };
  } catch (error) {
    console.error('Error in sendVerificationEmail:', error);
    return { success: false, error: 'Internal server error' };
  }
};
// --- PERUBAHAN UTAMA SELESAI ---

export default {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode,
  sendEmail,
  sendVerificationEmail,
  getEmailTemplate,
};