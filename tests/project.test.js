const supertest = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const clientsModel = require("../models/client.js");
const projectsModel = require("../models/project.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);

let token;
let userId;
let clientId;
let projectId;
let tokenAjeno;

beforeAll(async () => {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
    await mongoose.connection.db.dropDatabase();

    const password = await encrypt("password123");
    const user = await usersModel.create({
        email: "projectuser@test.com",
        password,
        status: true,
        nif: "40000000T",
        name: "Project",
        surnames: "Tester",
        company: {
            name: "Empresa SL",
            cif: "B00000001",
            street: "Calle Uno",
            number: 1,
            postal: 28001,
            city: "Madrid",
            province: "Madrid"
        }
    });

    token = await tokenSign(user);
    userId = user._id;

    const client = await clientsModel.create({
        name: "Cliente Vínculo",
        cif: "CIFCL1234",
        companyCIF: user.company.cif,
        owner: user._id
    });

    clientId = client._id;

    // Crear un proyecto base que usaremos en los tests
    const project = await projectsModel.create({
        name: "Proyecto Inicial",
        description: "Proyecto de prueba",
        address: "Calle Proyecto 1",
        postalCode: "28001",
        city: "Madrid",
        client: clientId,
        owner: userId,
        companyCIF: "B00000001",
        archived: false
    });
    projectId = project._id;

    // Crear usuario ajeno para probar acceso indebido
    const otroUser = await usersModel.create({
        email: "intruso@test.com",
        password: await encrypt("otro12345"),
        status: true,
        nif: "50000000R",
        name: "Intruso",
        surnames: "Ajeno",
        company: {
            name: "OtraEmpresa",
            cif: "B00000099",
            street: "Calle Dos",
            number: 2,
            postal: 28002,
            city: "Madrid",
            province: "Madrid"
        }
    });
    tokenAjeno = await tokenSign(otroUser);

});

afterAll(async () => {
    await mongoose.disconnect();
    server.close();
});

describe("Project API tests", () => {
    test("Create a project", async () => {
        const response = await api
            .post("/project")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Proyecto Ejemplo",
                description: "Proyecto de construcción de edificio",
                address: "Calle Mayor 15",
                postalCode: "28001",
                city: "Madrid",
                client: clientId
            })
            .expect(201);

        projectId = response.body._id;
        expect(response.body.name).toBe("Proyecto Ejemplo");
    });

    test("Get all projects", async () => {
        const response = await api
            .get("/project")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    test("Get specific project", async () => {
        const response = await api
            .get(`/project/${projectId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(response.body._id).toBe(projectId);
    });

    test("Update project", async () => {
        const response = await api
            .patch(`/project/${projectId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Nuevo nombre del proyecto",
                address: "Nueva dirección",
                postalCode: "28045"
            })
            .expect(200);

        expect(response.body.project.name).toBe("Nuevo nombre del proyecto");
    });

    test("Soft delete project", async () => {
        await api
            .delete(`/project/${projectId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        const archived = await projectsModel.findById(projectId);
        expect(archived.archived).toBe(true);
    });

    test("Get archived projects", async () => {
        const response = await api
            .get("/project/archived")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(response.body.some(p => p._id === projectId)).toBe(true);
    });

    test("Restore project", async () => {
        await api
            .patch(`/project/${projectId}/restore`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        const restored = await projectsModel.findById(projectId);
        expect(restored.archived).toBe(false);
    });

    test("Hard delete project", async () => {
        await api
            .delete(`/project/${projectId}?soft=false`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        const deleted = await projectsModel.findById(projectId);
        expect(deleted).toBeNull();
    });
});

describe("Project API Error Handling", () => {
    test("Create project without required fields", async () => {
        const res = await api
            .post("/project")
            .set("Authorization", `Bearer ${token}`)
            .send({})
            .expect(400); // Error del validador

        expect(res.body).toHaveProperty("error", true);
    });

    test("Get project with invalid ID", async () => {
        const res = await api
            .get("/project/invalidid123")
            .set("Authorization", `Bearer ${token}`)
            .expect(400); // ID inválido → validador

        expect(res.body).toHaveProperty("error", true);
    });

    test("Update project without permission", async () => {
        // Crear un proyecto nuevo con el usuario propietario
        const nuevoProyecto = await projectsModel.create({
            name: "Proyecto No Editable",
            description: "Test no permitido",
            address: "Calle Oculta 9",
            postalCode: "28010",
            city: "Madrid",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001",
            archived: false
        });

        // Intentar editarlo con un usuario ajeno (tokenAjeno)
        const res = await api
            .patch(`/project/${nuevoProyecto._id}`)
            .set("Authorization", `Bearer ${tokenAjeno}`)
            .send({ name: "Intento hackeo" })
            .expect(403); // Esperamos que no tenga permisos

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/no autorizado/i);
    });

    test("Restore project that is not archived", async () => {
        const res = await api
            .patch(`/project/${projectId}/restore`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404); // No está archivado

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/no archivado/i);
    });

    test("Delete project that does not exist", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await api
            .delete(`/project/${nonExistentId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404); // Proyecto no existe

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/no encontrado/i);
    });
    test("Create project with duplicate name", async () => {
        const res = await api
            .post("/project")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Proyecto Inicial", // ya lo creado en beforeAll
                description: "Duplicado",
                address: "Calle Falsa 1",
                postalCode: "28000",
                city: "Madrid",
                client: clientId
            })
            .expect(409);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Create project with non-existent client", async () => {
        const fakeClientId = new mongoose.Types.ObjectId();
        const res = await api
            .post("/project")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Proyecto Cliente Invalido",
                description: "Debería fallar",
                address: "Calle Fantasma",
                postalCode: "28000",
                city: "Madrid",
                client: fakeClientId
            })
            .expect(404);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Access archived project should return 404", async () => {
        const archived = await projectsModel.create({
            name: "Proyecto Archivado",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001",
            archived: true
        });

        const res = await api
            .get(`/project/${archived._id}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Restore project without permission", async () => {
        const nuevo = await projectsModel.create({
            name: "Proyecto Bloqueado",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001",
            archived: true
        });

        const res = await api
            .patch(`/project/${nuevo._id}/restore`)
            .set("Authorization", `Bearer ${tokenAjeno}`)
            .expect(403);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Get project from another user", async () => {
        const privado = await projectsModel.create({
            name: "Privado de otro",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001"
        });

        const res = await api
            .get(`/project/${privado._id}`)
            .set("Authorization", `Bearer ${tokenAjeno}`)
            .expect(403);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Delete project without token", async () => {
        const nuevo = await projectsModel.create({
            name: "Sin Token",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001"
        });

        const res = await api
            .delete(`/project/${nuevo._id}`)
            .expect(401);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Cannot restore a project that was already restored", async () => {
        // Crear y archivar un nuevo proyecto
        const proyecto = await projectsModel.create({
            name: "Proyecto Restaurado Dos Veces",
            client: clientId,
            owner: userId,
            companyCIF: "B00000001",
            archived: true
        });

        // Restaurar una vez
        await api
            .patch(`/project/${proyecto._id}/restore`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        // Intentar restaurar otra vez (ya está activo)
        const res = await api
            .patch(`/project/${proyecto._id}/restore`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404);

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/no archivado/i);
    });

});
