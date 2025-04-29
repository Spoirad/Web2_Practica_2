const { sendSlackError } = require("./sendSlackError");

const handleHttpError = (res, message = "Error", code = 403) => {
    if (code >= 500) {
        sendSlackError(`${message} - Código ${code}`);
    }
    res.status(code).json({ error: true, message });
};

module.exports = { handleHttpError };
