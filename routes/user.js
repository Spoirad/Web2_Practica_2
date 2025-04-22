const express = require("express");
const router = express.Router();
const { registerUser, validateEmail, loginUser, updateUserPersonalData, updateCompany, uploadImage, getUser, deleteUser } = require("../controllers/user.js");
const { validatorCreateItem, validatorVerificate, validatorLogin, validatorPersonalData, validatorCompany } = require("../validators/user.js");
const { authMiddleware } = require("../middleware/authMiddleware.js");
const multer = require("multer");
const upload = multer();

//POST
router.post("/register", validatorCreateItem, registerUser);
router.post("/login", validatorLogin, loginUser);

//PUT
router.put("/validation", authMiddleware, validatorVerificate, validateEmail);
router.put("/register", authMiddleware, validatorPersonalData, updateUserPersonalData);

//PATCH
router.patch("/company", authMiddleware, validatorCompany, updateCompany);
router.patch("/logo", authMiddleware, upload.single("logo"), uploadImage);

//GET
router.get("/", authMiddleware, getUser);

//DELETE
router.delete("/", authMiddleware, deleteUser);


module.exports = router;