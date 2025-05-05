class Controller {
  constructor() {
    this.service = require("../services/project-service");
  }

  async createProject(req, res) {
    await this.service.createProject(req, res);
  }

  async getProject(req, res) {
    await this.service.getProject(req, res);
  }

  async getProjects(req, res) {
    await this.service.getProjects(req, res);
  }

  async updateProject(req, res) {
    await this.service.updateProject(req, res);
  }

  async deleteProject(req, res) {
    await this.service.deleteProject(req, res);
  }
}

module.exports = new Controller();
