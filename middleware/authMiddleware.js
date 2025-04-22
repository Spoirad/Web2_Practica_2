const jwt = require("jsonwebtoken");
const { handleHttpError } = require("../utils/handleHttpError");
const usersModel = require("../models/user.js");


const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Extrae el token del header
        if (!token) {
            return handleHttpError(res, "No se proporcionó token", 401);
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded._id) {
            return handleHttpError(res, "Token inválido", 401);
        }

        // Buscar el usuario en la base de datos
        const user = await usersModel.findById(decoded._id);
        if (!user) {
            return handleHttpError(res, "Usuario no encontrado", 404);
        }

        req.user = user; // Guardamos el usuario en la request para que el controlador lo use
        next();
    } catch (error) {
        console.log(error);
        return handleHttpError(res, "Error en la autenticación", 403);
    }
};

module.exports = { authMiddleware };
