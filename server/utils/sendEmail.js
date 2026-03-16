const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Note: To use a real email service, configure SMTP details in environment variables (.env)
    // For development/demonstration, we can log the email content to console if SMTP is not set up
    // or use a mock service like Ethereal.

    // A minimal configuration assuming default SMTP or Ethereal for testing if env vars missing
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_EMAIL || 'test@ethereal.email',
            pass: process.env.SMTP_PASSWORD || 'testpassword',
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'CodeTrackr'} <${process.env.FROM_EMAIL || 'noreply@codetrackr.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);

    // In dev, if using Ethereal, log preview URL so you can see the reset email easily
    if (process.env.NODE_ENV !== 'production' && (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal'))) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    // Fallback: ALWAYS log the reset token to the server console so the developer can click it without setting up an email service during testing
    console.log('--------------------------------------------------');
    console.log(`FORGOT PASSWORD EMAIL CONTENT:\nSubject: ${options.subject}\nBody:\n${options.message}`);
    console.log('--------------------------------------------------');

};

module.exports = sendEmail;
