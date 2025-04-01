import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
export async function onRequest(context) {
  const RESEND_API_KEY = context.env.RESEND_API_KEY || 're_ENYzvups_8H6hiYiw8NbNZAu88XwragZW';
  const resend = new Resend(RESEND_API_KEY);

  // Continue with the request handling
  try {
    // Handle CORS preflight requests
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    // Only allow POST requests
    if (context.request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Parse request body
    const { to, subject, html } = await context.request.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: to, subject, and html are required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Send email with Resend
    const response = await resend.emails.send({
      from: 'EyeSentry <no-reply@email.eyesentrymed.com>',
      to,
      subject,
      html
    });

    return new Response(JSON.stringify({ 
      success: true, 
      data: response 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
