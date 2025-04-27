const express = require("express");
const router = express.Router();
const { createDeliveryNote, getDeliveryNotes, getDeliveryNoteById, uploadSignature, generateDeliveryNotePDF, deleteDeliveryNote } = require("../controllers/deliverynote");
const { validatorCreateDeliveryNote } = require("../validators/deliverynote");
const { authMiddleware } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, validatorCreateDeliveryNote, createDeliveryNote);
router.get("/", authMiddleware, getDeliveryNotes);
router.get("/pdf/:id", authMiddleware, generateDeliveryNotePDF); // ¡Ojo! Esta debe ir antes de ":id" normal
router.get("/:id", authMiddleware, getDeliveryNoteById);
router.patch("/:id/signature", authMiddleware, upload.single("signature"), uploadSignature);
router.delete("/:id", authMiddleware, deleteDeliveryNote);

module.exports = router;
