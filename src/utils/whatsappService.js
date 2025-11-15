// WhatsApp service using Twilio API
// For production, you'll need to set up Twilio WhatsApp Business API

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

    // Uncomment and install twilio package when ready to use
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // const result = await client.messages.create({
    //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    //   to: `whatsapp:${to}`,
    //   body: message
    // });

    // For now, return success in dev mode
    console.log(`✅ WhatsApp message would be sent to ${to}`);
    return { success: true, messageId: 'dev-mode-' + Date.now() };
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

