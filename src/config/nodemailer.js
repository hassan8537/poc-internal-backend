const nodemailer = require("nodemailer");
const { handlers } = require("../utilities/handlers/handlers");

const host = "smtp.gmail.com";
const port = 587;
const secure = false;
const user = process.env.AUTH_EMAIL;
const pass = process.env.APP_PASSWORD;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: user,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    handlers.logger.success({
      message: info.messageId
    });
    return info;
  } catch (error) {
    return handlers.logger.error({
      message: error
    });
  }
};

module.exports = sendEmail;
