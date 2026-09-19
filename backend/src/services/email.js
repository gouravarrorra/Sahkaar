import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send OTP email via Resend
 * Free tier: 3000 emails/month
 */
export async function sendOTPEmail(toEmail, otp) {
  try {
    const { data, error } = await resend.emails.send({
      from: `Sahkaar <${FROM_EMAIL}>`,
      to: [toEmail],
      subject: `Your Sahkaar OTP: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #ffffff;">Sahkaar</h1>
            <p style="color: #888; font-size: 14px; margin-top: 4px;">Cooperative Service Platform</p>
          </div>
          
          <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #888; font-size: 14px; margin: 0 0 12px;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #22c55e; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 12px;">Valid for 5 minutes</p>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log(`📧 OTP email sent to ${toEmail} (Resend ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('Email send failed:', err);
    return { success: false, error: err.message };
  }
}
