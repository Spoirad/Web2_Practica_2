const express = require("express");
const router = express.Router();
const { createClient, updateClient, getClients, getClientById, deleteClient, getArchivedClients, restoreClient } = require("../controllers/client");
const { validatorCreateClient, validatorUpdateClient, validatorGetItem } = require("../validators/client");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, validatorCreateClient, createClient);
router.patch("/:id", authMiddleware, validatorGetItem, validatorUpdateClient, updateClient);
router.get("/", authMiddleware, getClients);
router.get("/archived", authMiddleware, getArchivedClients);
router.get("/:id", authMiddleware, validatorGetItem, getClientById);
router.delete("/:id", authMiddleware, validatorGetItem, deleteClient);
router.patch("/:id/restore", authMiddleware, validatorGetItem, restoreClient);

module.exports = router;