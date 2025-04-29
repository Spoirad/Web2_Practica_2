const express = require("express");
const router = express.Router();
const { handleHttpError } = require("../utils/handleHttpError");

///////////////////////////////////////
//   UNICO PROPOSITO TESTEAR SLACK   //
///////////////////////////////////////
router.get("/test-error", (req, res) => {
  // Simular un fallo de servidor
  handleHttpError(res, "Error de prueba para Slack", 500);
});

module.exports = router;
