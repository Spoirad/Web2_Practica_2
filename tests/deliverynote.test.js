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

beforeAll(async () => {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
    await mongoose.connection.db.dropDatabase();

    const password = await encrypt("password1");
    const user = await usersModel.create({
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
