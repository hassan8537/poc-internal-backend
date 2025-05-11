const { handlers } = require("../utilities/handlers/handlers");

class Service {
  constructor() {}

  async export(req, res) {
    try {
      handlers.logger.success({
        message: "Exported"
      });
      return handlers.response.success({
        res,
        message: "Exported"
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: "Failed to export" });
    }
  }
}

module.exports = new Service();
