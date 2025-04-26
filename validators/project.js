const { check } = require("express-validator");
const validateResult = require("../utils/handleValidator");

const validatorCreateProject = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("client").isMongoId().withMessage("ID de cliente inválido"),
    check("description").optional().isString(),
    check("address").optional().isString(),
    check("postalCode").optional().isString(),
    check("city").optional().isString(),
    validateResult
];

const validatorUpdateProject = [
    check("name").optional().isString(),
    check("description").optional().isString(),
    check("address").optional().isString(),
    check("postalCode").optional().isString(),
    check("city").optional().isString(),
    validateResult
];

module.exports = { validatorCreateProject, validatorUpdateProject };
