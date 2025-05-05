const { handlers } = require("../handlers/handlers");

const expireSession = (req, res) => {
  try {
    if (req.session) {
      req.session.destroy(() => {});
    }

    res.clearCookie("authorization");

    handlers.logger.failed({ message: "Session expired" });
    return handlers.response.failed({ res, message: "Session expired" });
  } catch (error) {
    handlers.logger.error({ message: error });
    return handlers.response.error({ res, message: error.message });
  }
};

module.exports = expireSession;
