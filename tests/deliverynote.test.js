const supertest = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const clientModel = require("../models/client.js");
const projectModel = require("../models/project.js");
const deliveryModel = require("../models/deliverynote.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);

let token;
let deliveryId;
let clientId;
let projectId;
let userId;
let tokenAjeno;

beforeAll(async () => {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
    await mongoose.connection.db.dropDatabase();

    const password = await encrypt("password1");
    user = await usersModel.create({
        email: "delivery@test.com",
        password,
        status: true,
        nif: "40000003T",
        name: "Delivery",
        surnames: "Tester",
        company: {
            name: "Empresa SL",
            cif: "B00000002",
            street: "Calle Dos",
            number: 2,
            postal: 28002,
            city: "Madrid",
            province: "Madrid"
        }
    });

    token = await tokenSign(user);
    userId = user._id;

    const client = await clientModel.create({
        name: "Cliente Test",
        cif: "CIFCL4567",
        companyCIF: user.company.cif,
        owner: user._id
    });
    clientId = client._id;

    const project = await projectModel.create({
        name: "Proyecto Test",
        address: "Calle Test 123",
        postalCode: "28010",
        city: "Madrid",
        client: clientId,
        owner: user._id
    });
    projectId = project._id;

    const otroUser = await usersModel.create({
        email: "otro@test.com",
        password: await encrypt("password1"),
        status: true,
        nif: "40000012Z",
        name: "Ajeno",
        surnames: "Test",
        company: {
            name: "Otra S.L.",
            cif: "B00000005",
            street: "Calle Ajena",
            number: 5,
            postal: 28005,
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

describe("DeliveryNote API tests", () => {
    test("Create a deliverynote", async () => {
        const response = await api
            .post("/deliverynote")
            .set("Authorization", `Bearer ${token}`)
            .send({
                client: clientId,
                project: projectId,
                description: "Instalación eléctrica de oficinas",
                materials: [
                    {
                        description: "Cableado eléctrico",
                        quantity: 200,
                        unit: "metros",
                        price: 0.5
                    }
                ],
                hours: [
                    {
                        worker: "Juan Pérez",
                        hours: 8,
                        pricePerHour: 20
                    }
                ],
                totalCost: 300
            })
            .expect(201);

        deliveryId = response.body._id;
        expect(response.body.description).toBe("Instalación eléctrica de oficinas");
    });

    test("Get all deliverynotes", async () => {
        const response = await api
            .get("/deliverynote")
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    test("Get one deliverynote", async () => {
        const response = await api
            .get(`/deliverynote/${deliveryId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(response.body._id).toBe(deliveryId);
    });

    test("Get PDF for deliverynote", async () => {
        const response = await api
            .get(`/deliverynote/pdf/${deliveryId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        expect(response.header["content-type"]).toContain("application/pdf");
    });

    test("Upload signature to deliverynote", async () => {
        const response = await api
            .patch(`/deliverynote/${deliveryId}/signature`)
            .set("Authorization", `Bearer ${token}`)
            .attach("signature", path.join(__dirname, "firma-fake.png"))
            .expect(200);

        expect(response.body.signatureUrl).toContain("http");
    });

    test("Prevent delete if signed", async () => {
        await api
            .delete(`/deliverynote/${deliveryId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(400);
    });

    test("Delete deliverynote", async () => {
        // Crear un nuevo albarán limpio para testear el borrado
        const response = await api
            .post("/deliverynote")
            .set("Authorization", `Bearer ${token}`)
            .send({
                client: clientId,
                project: projectId,
                description: "Para prueba de borrado",
                materials: [],
                hours: [],
                totalCost: 0
            })
            .expect(201);

        const tempId = response.body._id;

        await api
            .delete(`/deliverynote/${tempId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(200);

        const deleted = await deliveryModel.findById(tempId);
        expect(deleted).toBeNull();
    });
});

describe("DeliveryNote API Error Handling", () => {
    test("Should not create deliverynote with missing fields", async () => {
        const res = await api
            .post("/deliverynote")
            .set("Authorization", `Bearer ${token}`)
            .send({}) // Campos vacíos
            .expect(400);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Should return 400 for invalid ID on GET", async () => {
        const res = await api
            .get("/deliverynote/invalid-id-123")
            .set("Authorization", `Bearer ${token}`)
            .expect(400);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Should return 404 for non-existent deliverynote", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await api
            .get(`/deliverynote/${fakeId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Should not upload signature with invalid ID", async () => {
        const res = await api
            .patch("/deliverynote/invalid-id-456/signature")
            .set("Authorization", `Bearer ${token}`)
            .attach("signatureUrl", path.join(__dirname, "firma-fake.png"))
            .expect(400);

        expect(res.body).toHaveProperty("error", true);
    });

    test("Should not allow signing a deliverynote twice", async () => {
        const note = await deliveryModel.create({
            user: userId,
            client: clientId,
            project: projectId,
            description: "Firmado 2 veces",
            signed: true,
            signatureUrl: "https://ejemplo.com/firma.png"
        });

        const res = await api
            .patch(`/deliverynote/${note._id}/signature`)
            .set("Authorization", `Bearer ${token}`)
            .attach("signature", path.join(__dirname, "firma-fake.png"))
            .expect(400);

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/ya está firmado/i);
    });

    test("Should not allow PDF generation for unauthorized user", async () => {
        const notaPrivada = await deliveryModel.create({
            user: userId,
            client: clientId,
            project: projectId,
            description: "Acceso denegado",
            signed: false
        });

        const res = await api
            .get(`/deliverynote/pdf/${notaPrivada._id}`)
            .set("Authorization", `Bearer ${tokenAjeno}`)
            .expect(403);

        expect(res.body).toHaveProperty("error", true);
        expect(res.body.message).toMatch(/no autorizado/i);
    });

    test("Should return 404 when deleting non-existent deliverynote", async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await api
            .delete(`/deliverynote/${fakeId}`)
            .set("Authorization", `Bearer ${token}`)
            .expect(404);

        expect(res.body).toHaveProperty("error", true);
    });

});