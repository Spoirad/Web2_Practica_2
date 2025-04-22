const clientModel = require("../models/client");
const { handleHttpError } = require("../utils/handleHttpError");

const createClient = async (req, res) => {
    try {
        const { name, cif, email, phone, address } = req.body;
        const existing = await clientModel.findOne({ cif });

        if (existing) return res.status(409).json({ error: "El cliente ya existe" });

        const client = await clientModel.create({
            name, cif, email, phone, address,
            owner: req.user._id
        });

        res.status(201).json(client);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_CREATE_CLIENT");
    }
};

module.exports = { createClient };
