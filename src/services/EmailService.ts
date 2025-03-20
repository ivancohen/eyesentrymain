import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

export const EmailService = {
  async sendSpecialistAccessLink(
    recipientEmail: string,
    accessCode: string,
    patientName: string,
    doctorName: string
  ): Promise<boolean> {
    try {
      const accessUrl = `${window.location.origin}/specialist/${accessCode}`;
      
      await resend.emails.send({
        from: 'EyeSentry <no-reply@eyesentry.com>',
        to: recipientEmail,
        subject: `Access Link for Patient ${patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
              <h2 style="color: #4a6ee0;">EyeSentry Specialist Access</h2>
              <p>Hello,</p>
              <p>Dr. ${doctorName} has requested your specialist opinion for patient ${patientName}.</p>
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4a6ee0;">
                <p><strong>Access Link:</strong></p>
                <p><a href="${accessUrl}" style="color: #4a6ee0; text-decoration: none;">${accessUrl}</a></p>
              </div>
              <p>This link will give you access to the patient's questionnaire and allow you to provide your specialist response.</p>
              <p style="margin-top: 20px; font-size: 12px; color: #777;">This is an automated message from the EyeSentry system. Please do not reply to this email.</p>
            </div>
          </div>
        `
      });
      
      return true;
    } catch (error) {
      console.error('Error sending specialist access email:', error);
      return false;
    }
  }
}; 