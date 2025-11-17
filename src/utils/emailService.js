const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example, can be configured for other services)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return null; // Return null if not configured
  }

  // For development, you can use Gmail with App Password
  // For production, use a service like SendGrid, AWS SES, etc.
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, name, code) => {
  try {
    const transporter = createTransporter();
    
    // If email is not configured, log to console (development mode)
    if (!transporter) {
      console.log('\n========================================');
      console.log('📧 EMAIL VERIFICATION CODE (Development Mode)');
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Verification Code: ${code}`);
      console.log('========================================\n');
      console.log('⚠️  Email not configured. Add EMAIL_USER and EMAIL_PASSWORD to .env file');
      console.log('For now, use the code above to verify your email.\n');
      return true; // Return true so signup can continue
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Momentum AutoWorks',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Momentum AutoWorks</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello ${name},
            </p>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up! Please use the verification code below to confirm your email address:
            </p>
            <div style="background-color: white; border: 2px dashed #c53032; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <h1 style="color: #c53032; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
            </div>
            <p style="color: #666; line-height: 1.6;">
              This code will expire in 10 minutes. If you didn't create an account, please ignore this email.
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              Momentum AutoWorks Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // In development, still log the code to console
    console.log('\n========================================');
    console.log('📧 EMAIL VERIFICATION CODE (Fallback)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Verification Code: ${code}`);
    console.log('========================================\n');
    console.log('⚠️  Email sending failed. Use the code above to verify your email.\n');
    
    // Return true so signup can continue even if email fails
    return true;
  }
};

// Send service reminder email
const sendServiceReminderEmail = async (email, name, vehicle, dueDate, daysUntil) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('\n========================================');
      console.log('📧 SERVICE REMINDER EMAIL (Development Mode)');
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Customer: ${name}`);
      console.log(`Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.plateNo})`);
      console.log(`Due Date: ${dueDate}`);
      console.log(`Days Until: ${daysUntil}`);
      console.log('========================================\n');
      return { success: true };
    }

    const isOverdue = daysUntil < 0;
    const subject = isOverdue 
      ? `⚠️ Service Overdue - ${vehicle.make} ${vehicle.model}`
      : `🔔 Service Reminder - ${vehicle.make} ${vehicle.model}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Momentum AutoWorks</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${isOverdue ? 'Service Overdue Alert' : 'Service Reminder'}</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello ${name},
            </p>
            <p style="color: #666; line-height: 1.6;">
              ${isOverdue 
                ? `Your vehicle <strong>${vehicle.make} ${vehicle.model} (${vehicle.plateNo})</strong> is overdue for service by <strong>${Math.abs(daysUntil)} days</strong>.`
                : `This is a reminder that your vehicle <strong>${vehicle.make} ${vehicle.model} (${vehicle.plateNo})</strong> is due for service in <strong>${daysUntil} days</strong>.`
              }
            </p>
            <div style="background-color: white; border: 2px solid #c53032; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #c53032; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 5px 0;"><strong>Make/Model:</strong> ${vehicle.make} ${vehicle.model}</p>
              <p style="margin: 5px 0;"><strong>Plate Number:</strong> ${vehicle.plateNo}</p>
              <p style="margin: 5px 0;"><strong>Service Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            </div>
            <p style="color: #666; line-height: 1.6;">
              Please schedule an appointment with us to ensure your vehicle is properly maintained.
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              Momentum AutoWorks Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Service reminder email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending service reminder email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send custom notification email
const sendCustomEmail = async (email, name, title, message, vehicle = null) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('\n========================================');
      console.log('📧 CUSTOM NOTIFICATION EMAIL (Development Mode)');
      console.log('========================================');
      console.log(`To: ${email}`);
      console.log(`Customer: ${name}`);
      console.log(`Title: ${title}`);
      console.log(`Message: ${message}`);
      if (vehicle) {
        console.log(`Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.plateNo})`);
      }
      console.log('========================================\n');
      return { success: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #c53032; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Momentum AutoWorks</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello ${name},
            </p>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">
              ${message}
            </p>
            ${vehicle ? `
            <div style="background-color: white; border: 2px solid #c53032; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #c53032; margin-top: 0;">Vehicle Details</h3>
              <p style="margin: 5px 0;"><strong>Make/Model:</strong> ${vehicle.make} ${vehicle.model}</p>
              <p style="margin: 5px 0;"><strong>Plate Number:</strong> ${vehicle.plateNo}</p>
              ${vehicle.year ? `<p style="margin: 5px 0;"><strong>Year:</strong> ${vehicle.year}</p>` : ''}
            </div>
            ` : ''}
            <p style="color: #666; line-height: 1.6; margin-top: 30px;">
              Best regards,<br>
              Momentum AutoWorks Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Custom notification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending custom notification email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send email (generic function for OTP emails)
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('\n========================================');
      console.log('📧 EMAIL (Development Mode)');
      console.log('========================================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text || html || ''}`);
      console.log('========================================\n');
      return { success: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendServiceReminderEmail,
  sendCustomEmail,
  sendEmail
};

