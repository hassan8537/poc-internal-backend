const express = require("express");
const app = express();

const projectRoutes = require("./project-routes");
const roomRoutes = require("./room-routes");

const upload = require("../middlewares/multer-middleware");

const middlewares = [];

const apiVersion = process.env.API_VERSION;

// 🔹 Register Routes
app.use(`/api/${apiVersion}/projects`, projectRoutes);
app.use(`/api/${apiVersion}/rooms`, roomRoutes);

module.exports = app;
