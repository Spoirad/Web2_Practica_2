const clientModel = require("../models/client");
const { handleHttpError } = require("../utils/handleHttpError");

const createClient = async (req, res) => {
    try {
        const { name, cif } = req.body;
        const existing = await clientModel.findOne({ cif });

        if (existing) return handleHttpError(res, "El cliente ya existe", 409);

        const client = await clientModel.create({
            name, cif,
            owner: req.user._id,
            companyCIF: req.user.company?.cif || null
        });

        res.status(201).json(client);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_CREATE_CLIENT", 500);
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);
        if (!client) return handleHttpError(res, "Cliente no encontrado", 404);

        if (!client.owner.equals(userId)) {
            return handleHttpError(res, "No tienes permiso para modificar este cliente", 403);
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
        handleHttpError(res, "ERROR_UPDATE_CLIENT", 500);
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
        handleHttpError(res, "ERROR_GET_CLIENTS", 500);
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);

        if (!client || client.archived) {
            return handleHttpError(res, "Cliente no encontrado", 404);
        }

        if (!client.owner.equals(userId) && client.companyCIF !== req.user.company?.cif) {
            return handleHttpError(res, "No tienes acceso a este cliente", 403);
        }

        res.json(client);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_CLIENT_BY_ID", 500);
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const isSoft = req.query.soft !== "false"; // por defecto soft

        const client = await clientModel.findById(id);

        if (!client) return handleHttpError(res, "Cliente no encontrado", 404);
        if (!client.owner.equals(userId)) return handleHttpError(res, "No autorizado", 403);

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
        handleHttpError(res, "ERROR_DELETE_CLIENT", 500);
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
        handleHttpError(res, "ERROR_GET_ARCHIVED_CLIENTS", 500);
    }
};

const restoreClient = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const client = await clientModel.findById(id);

        if (!client || !client.archived) {
            return handleHttpError(res, "Cliente no archivado o no encontrado", 404);
        }

        if (!client.owner.equals(userId)) {
            return handleHttpError(res, "No autorizado para restaurar este cliente", 403);
        }

        client.archived = false;
        await client.save();

        res.json({ message: "Cliente restaurado", client });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_RESTORE_CLIENT", 500);
    }
};

module.exports = {
    createClient, updateClient, getClients, getClientById, deleteClient, getArchivedClients, restoreClient
};
