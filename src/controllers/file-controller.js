class Controller {
  constructor() {
    this.service = require("../services/file-service");
  }

  async uploadFile(req, res) {
    await this.service.uploadFile(req, res);
  }

  async deleteFile(req, res) {
    await this.service.deleteFile(req, res);
  }
}

module.exports = new Controller();
