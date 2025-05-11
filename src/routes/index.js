const express = require("express");
const app = express();

const projectRoutes = require("./project-routes");
const roomRoutes = require("./room-routes");
const exportRoutes = require("./export-routes");

const apiVersion = process.env.API_VERSION;

// 🔹 Register Routes
app.use(`/api/${apiVersion}/projects`, projectRoutes);
app.use(`/api/${apiVersion}/projects`, roomRoutes);
app.use(`/api/${apiVersion}/exports`, exportRoutes);

module.exports = app;
