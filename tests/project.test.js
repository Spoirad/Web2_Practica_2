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
