class Controller {
  constructor() {
    this.service = require("../services/export-service");
  }

  async export(req, res) {
    await this.service.export(req, res);
  }
}

module.exports = new Controller();
