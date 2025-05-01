const { check } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validatorCreateClient = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("cif").notEmpty().withMessage("El CIF es obligatorio"),
    validateResults
];
const validatorUpdateClient = [
    check("name").optional().isString(),
    check("cif").optional().isString(),
    validateResults
];

const validatorGetItem  = [
    check("id").exists().notEmpty().isMongoId(),
    validateResults
];

module.exports = { validatorCreateClient, validatorUpdateClient, validatorGetItem };
