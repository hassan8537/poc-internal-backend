const Joi = require("joi");
const { handlers } = require("../utilities/handlers/handlers");

exports.validateSignup = (req, res, next) => {
  const schema = Joi.object({
    role: Joi.string().required(),
    email_address: Joi.string().email().required(),
    password: Joi.string().required(),
    terms_and_conditions: Joi.boolean().valid(true).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    handlers.logger.failed({ message: error.details[0].message });
    return handlers.response.failed({ res, message: error.details[0].message });
  }
  next();
};
