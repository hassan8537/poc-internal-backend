const { handlers } = require("../handlers/handlers");
const crypto = require("crypto");

const generateOtp = () => {
  try {
    // const otp = crypto.randomInt(100000, 999999);
    const otp = 123456;
    return otp;
  } catch (error) {
    return handlers.logger.error({ message: error });
  }
};

module.exports = generateOtp;
