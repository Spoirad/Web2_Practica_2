const { check } = require("express-validator");
const validateResult = require("../utils/handleValidator.js");

const validatorCreateItem = [
    check("email").exists().notEmpty().isEmail(), //Definir validador para que sea un email válido.
    check("password").exists().notEmpty().isLength({ min: 8 }), //Definir validador para que la password contenga al menos 8 caracteres.
    //check("role").exists().notEmpty(), //al tener default esto lo rompe si no pones nada
    validateResult
]

const validatorVerificate = [
    check("codigo").exists().isNumeric().isLength({ min: 6, max: 6 }).withMessage("El código debe ser un numero de 6 cifras."),
    validateResult
]

const validatorLogin = [
    check("email").isEmail().withMessage("Formato de email inválido"),
    check("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    validateResult
];

const validatorPersonalData = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("surnames").notEmpty().withMessage("Los apellidos son obligatorios"),
    check("nif").notEmpty().withMessage("El NIF es obligatorio"),
    validateResult
];

const validatorCompany = [
    check("company.name").notEmpty().withMessage("El nombre de la empresa es obligatorio"),
    check("company.cif").notEmpty().isLength({ min: 9, max: 9 }).withMessage("El CIF debe tener 9 caracteres"),
    check("company.street").notEmpty().withMessage("La calle es obligatoria"),
    check("company.number").isNumeric().withMessage("El número debe ser un valor numérico"),
    check("company.postal").isNumeric().withMessage("El código postal debe ser numérico"),
    check("company.city").notEmpty().withMessage("La ciudad es obligatoria"),
    check("company.province").notEmpty().withMessage("La provincia es obligatoria"),
    validateResult
]

module.exports = { validatorCreateItem, validatorVerificate, validatorLogin, validatorPersonalData, validatorCompany };