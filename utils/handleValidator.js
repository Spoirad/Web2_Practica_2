const { validationResult } = require ("express-validator")
const { handleHttpError } = require("./handleHttpError");

const validateResult = (req, res, next) => {
    try{
        validationResult(req).throw()
        next()
    } catch (err) {
        return handleHttpError(res, err.array(), 400);
    }

}

module.exports = validateResult