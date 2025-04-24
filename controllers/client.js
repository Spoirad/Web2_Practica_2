const clientModel = require("../models/client");
const { handleHttpError } = require("../utils/handleHttpError");

const createClient = async (req, res) => {
    try {
        const { name, cif } = req.body;
        const existing = await clientModel.findOne({ cif });

        if (existing) return res.status(409).json({ error: "El cliente ya existe" });

        const client = await clientModel.create({
            name, cif,
            owner: req.user._id,
            companyCIF: req.user.company?.cif || null
        });

        res.status(201).json(client);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_CREATE_CLIENT");
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);
        if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

        if (!client.owner.equals(userId)) {
            return res.status(403).json({ error: "No tienes permiso para modificar este cliente" });
        }

        const fields = ["name", "cif"];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                client[field] = req.body[field];
            }
        });

        await client.save();
        res.json({ message: "Cliente actualizado", client });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_UPDATE_CLIENT");
    }
};

const getClients = async (req, res) => {
    try {
        const userId = req.user._id;
        const clients = await clientModel.find({
            $or: [
                { owner: req.user._id },
                { companyCIF: req.user.company?.cif }
            ],
            archived: false
        });

        res.json(clients);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_CLIENTS");
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);

        if (!client || client.archived) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }

        if (!client.owner.equals(userId) && client.companyCIF !== req.user.company?.cif) {
            return res.status(403).json({ error: "No tienes acceso a este cliente" });
        }

        res.json(client);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_CLIENT_BY_ID");
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isSoft = req.query.soft !== "false"; // por defecto soft

        const client = await clientModel.findById(id);

        if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
        if (!client.owner.equals(userId)) return res.status(403).json({ error: "No autorizado" });

        if (isSoft) {
            client.archived = true;
            await client.save();
            return res.json({ message: "Cliente archivado (soft delete)", client });
        } else {
            await clientModel.findByIdAndDelete(id);
            return res.json({ message: "Cliente eliminado permanentemente (hard delete)" });
        }
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_DELETE_CLIENT");
    }
};
const getArchivedClients = async (req, res) => {
    try {
        const userId = req.user._id;

        const clients = await clientModel.find({
            owner: userId,
            archived: true
        });

        res.json(clients);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_ARCHIVED_CLIENTS");
    }
};
const restoreClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);

        if (!client || !client.archived) {
            return res.status(404).json({ error: "Cliente no archivado o no encontrado" });
        }

        if (!client.owner.equals(userId)) {
            return res.status(403).json({ error: "No autorizado para restaurar este cliente" });
        }

        client.archived = false;
        await client.save();

        res.json({ message: "Cliente restaurado", client });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_RESTORE_CLIENT");
    }
};


module.exports = { createClient, updateClient, getClients, getClientById, deleteClient, getArchivedClients, restoreClient };
