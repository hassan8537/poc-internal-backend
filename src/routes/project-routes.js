const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project-controller"); // Assuming you exported the ProjectService as 'projectService'

router.post("", projectController.createProject.bind(projectController));

router.get(
  "/:projectId/:creationDate",
  projectController.getProject.bind(projectController)
);

router.get("/", projectController.getProjects.bind(projectController));

router.put(
  "/:projectId/:creationDate",
  projectController.updateProject.bind(projectController)
);

router.delete(
  "/:projectId/:creationDate",
  projectController.deleteProject.bind(projectController)
);

module.exports = router;
