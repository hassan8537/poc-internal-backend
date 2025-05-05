const jwt = require("jsonwebtoken");
const { handlers } = require("../handlers/handlers");

const secret_key = process.env.SECRET_KEY;
const token_expiration_time = process.env.TOKEN_EXPIRATION_TIME;

const secure = process.env.NODE_ENV;
const same_site = process.env.SAME_SITE;
const max_age = process.env.MAX_AGE;

const generateToken = ({ _id, res }) => {
  try {
    const token = jwt.sign({ _id }, secret_key, {
      expiresIn: token_expiration_time
    });

    res.cookie("authorization", token, {
      httpOnly: true,
      secure: secure === "production",
      sameSite: same_site,
      maxAge: max_age
    });

    return token;
  } catch (error) {
    handlers.logger.error({ message: error });
  }
};

module.exports = generateToken;
