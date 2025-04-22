const express = require("express");
const router = express.Router();
const { createClient } = require("../controllers/client");
const { validatorCreateClient } = require("../validators/client");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, validatorCreateClient, createClient);

module.exports = router;
