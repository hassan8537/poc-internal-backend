const express = require("express");
const router = express.Router();
const controller = require("../controllers/export-controller");

router.post("/", controller.export.bind(controller));

module.exports = router;
