const { check } = require("express-validator");
const validateResults = require("../utils/handleValidator");

const validatorCreateDeliveryNote = [
    check("client").isMongoId().withMessage("ID de cliente inválido"),
    check("project").isMongoId().withMessage("ID de proyecto inválido"),
    check("description").optional().isString(),

    check("materials").optional().isArray(),
    check("materials.*.description").optional().isString(),
    check("materials.*.quantity").optional().isNumeric(),
    check("materials.*.unit").optional().isString(),
    check("materials.*.price").optional().isNumeric(),

    check("hours").optional().isArray(),
    check("hours.*.worker").optional().isString(),
    check("hours.*.hours").optional().isNumeric(),
    check("hours.*.pricePerHour").optional().isNumeric(),

    check("totalCost").optional().isNumeric(),

    validateResults
];

module.exports = { validatorCreateDeliveryNote };
