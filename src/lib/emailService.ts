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

// Email templates
export const getEmailTemplate = (type: string, code: string, additionalData?: any) => {
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

  switch (type) {
    case 'REGISTRATION':
      return {
        subject: 'Verifikasi Registrasi - eKerja Karawang',
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1>Verifikasi Registrasi</h1>
            </div>
            <h2>Selamat datang di eKerja Karawang!</h2>
            <p>Terima kasih telah mendaftar di platform eKerja Karawang. Untuk menyelesaikan proses registrasi Anda, silakan gunakan kode verifikasi berikut:</p>
            <div style="${codeStyle}">${code}</div>
            <p><strong>Kode verifikasi ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <p>Jika Anda tidak merasa mendaftar di eKerja Karawang, silakan abaikan email ini.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Email ini dikirim secara otomatis. Mohon jangan membalas email ini.<br>
              © 2025 eKerja Karawang. Semua hak dilindungi.
            </p>
          </div>
        `,
      };

    case 'PASSWORD_RESET':
      return {
        subject: 'Reset Password - eKerja Karawang',
        html: `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <h1>Reset Password</h1>
            </div>
            <h2>Permintaan Reset Password</h2>
            <p>Kami menerima permintaan untuk mereset password akun Anda di eKerja Karawang. Gunakan kode verifikasi berikut untuk melanjutkan proses reset password:</p>
            <div style="${codeStyle}">${code}</div>
            <p><strong>Kode verifikasi ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <p style="color: #d9534f;"><strong>Jika Anda tidak meminta reset password, segera hubungi customer service kami.</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Email ini dikirim secara otomatis. Mohon jangan membalas email ini.<br>
              © 2025 eKerja Karawang. Semua hak dilindungi.
            </p>
          </div>
        `,
      };

    case 'ORDER_STATUS_CHANGE':
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
            <p>Status pesanan Anda telah diubah. Berikut detail perubahan:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Nomor Pesanan:</strong> #${orderNumber}</p>
              <p><strong>Layanan:</strong> ${serviceName}</p>
              <p><strong>Provider:</strong> ${providerName}</p>
              <p><strong>Status Baru:</strong> <span style="color: #007bff; font-weight: bold;">${newStatus}</span></p>
            </div>
            <p>Untuk memverifikasi perubahan ini, gunakan kode verifikasi berikut:</p>
            <div style="${codeStyle}">${code}</div>
            <p><strong>Kode verifikasi ini akan kedaluwarsa dalam 10 menit.</strong></p>
            <p>Anda dapat menggunakan kode ini untuk mengkonfirmasi perubahan status pesanan melalui aplikasi atau website kami.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Email ini dikirim secara otomatis. Mohon jangan membalas email ini.<br>
              © 2025 eKerja Karawang. Semua hak dilindungi.
            </p>
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
    // In development mode with demo password, simulate email sending
    if (process.env.NODE_ENV === 'development' && process.env.SMTP_PASSWORD === 'demo-mode-password') {
      console.log('=== EMAIL DEMO MODE ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('Email content would be sent in production mode');
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
    // Generate verification code
    const code = generateVerificationCode();

    // Save to database
    await saveVerificationCode(email, code, type, userId);

    // Get email template
    const template = getEmailTemplate(type, code, additionalData);

    // Send email
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

export default {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode,
  sendEmail,
  sendVerificationEmail,
  getEmailTemplate,
};
