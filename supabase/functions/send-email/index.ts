// Supabase Edge Function to send emails using Resend API
// This avoids CORS issues when sending emails from the browser

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Define the request body type
interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Function to send email using Resend API
async function sendEmail(req: EmailRequest): Promise<Response> {
  try {
    // Get the API key from environment variables
    const apiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!apiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key not configured' 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }
    
    // Set default from address if not provided
    const from = req.from || 'EyeSentry <no-reply@eyesentry.com>';
    
    // Send the email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: req.to,
        subject: req.subject,
        html: req.html
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error from Resend API:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data 
        }),
        { 
          status: response.status,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data 
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
}

// Handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
          'Allow': 'POST, OPTIONS'
        }
      }
    );
  }
  
  try {
    // Parse the request body
    const body: EmailRequest = await req.json();
    
    // Validate required fields
    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }
    
    // Send the email
    return await sendEmail(body);
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
});