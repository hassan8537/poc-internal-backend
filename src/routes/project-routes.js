const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project-controller"); // Assuming you exported the ProjectService as 'projectService'

router.post("", projectController.createProject.bind(projectController));

router.get("/:projectId", projectController.getProject.bind(projectController));

router.get("/", projectController.getProjects.bind(projectController));

router.put(
  "/:projectId",
  projectController.updateProject.bind(projectController)
);

router.delete(
  "/:projectId",
  projectController.deleteProject.bind(projectController)
);

module.exports = router;
