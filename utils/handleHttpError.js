const handleHttpError = (res, message, code = 403) => {  // code 403 solo aplica si no ha tercera variable mandada a httperror
    res.status(code).send(message);
}

module.exports = { handleHttpError }