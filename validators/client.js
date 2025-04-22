const { check } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validatorCreateClient = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("cif").notEmpty().withMessage("El CIF es obligatorio"),
    check("email").optional().isEmail().withMessage("Email inválido"),
    check("phone").optional().isString(),
    check("address").optional().isString(),
    validateResults
];

module.exports = { validatorCreateClient };
