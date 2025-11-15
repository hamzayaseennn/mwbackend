const crypto = require('crypto');

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = {
  hashOTP
};

