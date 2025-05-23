const projectModel = require("../models/project");
const clientModel = require("../models/client");
const { handleHttpError } = require("../utils/handleHttpError");

const createProject = async (req, res) => {
    try {
        const { name, description, address, postalCode, city, client } = req.body;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        // Verificar que el cliente existe y pertenece al usuario o su empresa
        const clientFound = await clientModel.findOne({
            _id: client,
            $or: [{ owner: userId }, { companyCIF }]
        });

        if (!clientFound) {
            return handleHttpError(res, "Cliente no válido o no encontrado", 404);
        }

        // Verificar que NO exista ya un proyecto con ese nombre para este usuario o su empresa
        const existingProject = await projectModel.findOne({
            name: name,
            $or: [{ owner: userId }, { companyCIF }]
        });

        if (existingProject) {
            return handleHttpError(res, "Ya existe un proyecto con ese nombre para este usuario o compañía", 409);
        }

        // Crear el proyecto
        const project = await projectModel.create({
            name,
            description,
            address,
            postalCode,
            city,
            client,
            owner: userId,
            companyCIF
        });

        res.status(201).json(project);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_CREATE_PROJECT");
    }
};

const getProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const projects = await projectModel.find({
            archived: false,
            $or: [
                { owner: userId },
                ...(companyCIF ? [{ companyCIF: companyCIF }] : [])
            ]
        }).populate("client"); // Opcional: para traer datos del cliente asociado

        res.json(projects);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_PROJECTS");
    }
};

const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const project = await projectModel.findById(id).populate("client");

        if (!project || project.archived) {
            return handleHttpError(res, "Proyecto no encontrado o archivado", 404);
        }

        if (
            !project.owner.equals(userId) &&
            project.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No tienes acceso a este proyecto", 403);
        }

        res.json(project);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_PROJECT_BY_ID");
    }
};

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const project = await projectModel.findById(id);

        if (!project || project.archived) {
            return handleHttpError(res, "Proyecto no encontrado o archivado", 404);
        }

        if (
            !project.owner.equals(userId) &&
            project.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para actualizar este proyecto", 403);
        }

        const fieldsToUpdate = ["name", "description", "address", "postalCode", "city"];

        fieldsToUpdate.forEach((field) => {
            if (req.body[field] !== undefined) {
                project[field] = req.body[field];
            }
        });

        await project.save();
        res.json({ message: "Proyecto actualizado correctamente", project });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_UPDATE_PROJECT");
    }
};

const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;
        const isSoft = req.query.soft !== "false"; // por defecto true

        const project = await projectModel.findById(id);

        if (!project) {
            return handleHttpError(res, "Proyecto no encontrado", 404);
        }

        if (
            !project.owner.equals(userId) &&
            project.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para eliminar este proyecto", 403);
        }

        if (isSoft) {
            project.archived = true;
            await project.save();
            return res.json({ message: "Proyecto archivado correctamente", project });
        } else {
            await projectModel.findByIdAndDelete(id);
            return res.json({ message: "Proyecto eliminado permanentemente" });
        }
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_DELETE_PROJECT");
    }
};

const getArchivedProjects = async (req, res) => {
    try {
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const projects = await projectModel.find({
            archived: true,
            $or: [
                { owner: userId },
                ...(companyCIF ? [{ companyCIF: companyCIF }] : [])
            ]
        }).populate("client"); // opcional: para traer el cliente asociado

        res.json(projects);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_ARCHIVED_PROJECTS");
    }
};

const restoreProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const project = await projectModel.findById(id);

        if (!project || !project.archived) {
            return handleHttpError(res, "Proyecto no archivado o no encontrado", 404);
        }

        if (
            !project.owner.equals(userId) &&
            project.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para restaurar este proyecto", 403);
        }

        project.archived = false;
        await project.save();

        res.json({ message: "Proyecto restaurado correctamente", project });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_RESTORE_PROJECT");
    }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, getArchivedProjects, restoreProject };
