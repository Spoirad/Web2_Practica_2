const express = require("express");
const router = express.Router();
const { createProject, getProjects, getProjectById, updateProject, deleteProject, getArchivedProjects, restoreProject } = require("../controllers/project");
const { validatorCreateProject, validatorUpdateProject, validatorGetItem } = require("../validators/project.js");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, validatorCreateProject, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/archived", authMiddleware, getArchivedProjects);
router.patch("/:id/restore", authMiddleware, restoreProject);
router.get("/:id", authMiddleware,validatorGetItem, getProjectById);
router.patch("/:id", authMiddleware,validatorGetItem, validatorUpdateProject, updateProject);
router.delete("/:id", authMiddleware,validatorGetItem, deleteProject);

module.exports = router;