const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend('re_ENYzvups_8H6hiYiw8NbNZAu88XwragZW');

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/email', async (req, res) => {
  try {
    console.log('Received email request:', { to: req.body.to, subject: req.body.subject });
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      console.error('Missing required fields:', { to, subject, html });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, and html are required' 
      });
    }

    // Verify domain first
    try {
      const domains = await resend.domains.list();
      console.log('Available domains:', domains);
    } catch (domainError) {
      console.error('Error checking domains:', domainError);
      throw new Error('Failed to verify email domain configuration');
    }

    console.log('Attempting to send email with Resend...');
    const response = await resend.emails.send({
      from: 'EyeSentry <no-reply@email.eyesentrymed.com>',
      to,
      subject,
      html
    });

    console.log('Email sent successfully:', response);
    return res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});
