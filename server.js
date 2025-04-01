import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();

// Create SMTP transporter using Resend's SMTP server
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: 're_ENYzvups_8H6hiYiw8NbNZAu88XwragZW'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// More detailed error logging for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

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

    console.log('Attempting to send email via Resend SMTP...');
    const info = await transporter.sendMail({
      from: 'EyeSentry <no-reply@email.eyesentrymed.com>',
      to,
      subject,
      html
    });

    console.log('Email sent successfully:', info);
    return res.json({ success: true, data: info });
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

try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 