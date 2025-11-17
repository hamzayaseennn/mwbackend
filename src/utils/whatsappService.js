// WhatsApp service using Twilio API
// For production, you'll need to set up Twilio WhatsApp Business API

let twilioClient = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
};

const sendWhatsAppMessage = async (to, message) => {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM) {
      console.log('\n========================================');
      console.log('📱 WHATSAPP MESSAGE (Development Mode)');
      console.log('========================================');
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log('========================================\n');
      console.log('⚠️  WhatsApp not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM to .env file');
      console.log('For now, the message is logged above.\n');
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // e.g., +14155238886 (Twilio sandbox) or your approved number

    if (!client || !fromNumber) {
      console.log('\n========================================');
      console.log('📱 WHATSAPP MESSAGE (Development Mode)');
      console.log('========================================');
      console.log(`To: ${to}`);
      console.log(`Message: ${message}`);
      console.log('========================================\n');
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    const result = await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`,
      body: message
    });

    console.log(`✅ WhatsApp message sent to ${to} (SID: ${result.sid})`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    
    // Log in development mode
    console.log('\n========================================');
    console.log('📱 WHATSAPP MESSAGE (Fallback)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('========================================\n');
    
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppMessage
};

