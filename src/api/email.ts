import { Resend } from 'resend';

const resend = new Resend('re_ENYzvups_8H6hiYiw8NbNZAu88XwragZW');

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    const response = await resend.emails.send({
      from: 'EyeSentry <no-reply@email.eyesentrymed.com>',
      to,
      subject,
      html
    });

    return new Response(JSON.stringify({ success: true, data: response }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}
