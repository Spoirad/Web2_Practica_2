const express = require("express");
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, deleteProject, getArchivedProjects, restoreProject } = require("../controllers/project");
const { validatorCreateProject, validatorUpdateProject } = require("../validators/project.js");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, validatorCreateProject, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/archived", authMiddleware, getArchivedProjects);
router.patch("/:id/restore", authMiddleware, restoreProject);
router.get("/:id", authMiddleware, getProjectById);
router.patch("/:id", authMiddleware, validatorUpdateProject, updateProject);
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
