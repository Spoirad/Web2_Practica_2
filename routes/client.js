const express = require("express");
const router = express.Router();
const { createClient, updateClient, getClients, getClientById, deleteClient, getArchivedClients, restoreClient} = require("../controllers/client");
const { validatorCreateClient, validatorUpdateClient } = require("../validators/client");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, validatorCreateClient, createClient);
router.patch("/:id", authMiddleware, validatorUpdateClient, updateClient);
router.get("/", authMiddleware, getClients);
router.get("/archived", authMiddleware, getArchivedClients);
router.get("/:id", authMiddleware, getClientById);
router.delete("/:id", authMiddleware, deleteClient);
router.patch("/:id/restore", authMiddleware, restoreClient);

module.exports = router;