import { Resend } from 'resend';

class EmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')));
      throw new Error('RESEND_API_KEY is required');
    }

    this.resend = new Resend(apiKey);
    console.log('Resend email service initialized successfully');
  }

  async sendOTP(email: string, otp: string, name: string = 'User'): Promise<boolean> {
    try {
      console.log(`Attempting to send email OTP to: ${email}`);
      
      const { data, error } = await this.resend.emails.send({
        from: 'AltQ <team@altq.in>', // Use your verified domain or resend.dev for testing
        to: [email],
        subject: 'AltQ - Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #e91e63; margin: 0; font-size: 28px;">AltQ</h1>
                <p style="color: #666; margin: 5px 0 0 0;">Smart Queue Management</p>
              </div>
              
              <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
                Hi ${name},<br><br>
                Thank you for registering with AltQ! To complete your account setup, please verify your email address using the code below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #e91e63; letter-spacing: 5px;">${otp}</span>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                This verification code will expire in <strong>5 minutes</strong>. If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  This is an automated message from AltQ. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('Resend email error:', error);
        return false;
      }

      console.log('Email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Test the connection by attempting to get API key info
      const { data, error } = await this.resend.apiKeys.list();
      
      if (error) {
        console.error('Resend connection failed:', error);
        return false;
      }
      
      console.log('Resend service is ready');
      return true;
    } catch (error) {
      console.error('Resend service connection failed:', error);
      return false;
    }
  }
}

export default new EmailService();