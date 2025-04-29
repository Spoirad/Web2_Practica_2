const supertest = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const clientModel = require("../models/client.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);

let token;
let clientId = "";

beforeAll(async () => {
  await new Promise((resolve) => {
    mongoose.connection.once("open", resolve);
  });
  await mongoose.connection.db.dropDatabase();

  const password = await encrypt("mipassword");
  const user = await usersModel.create({
    email: "cliente@example.com",
    password,
    nif: "11111111A",
    name: "Cliente",
    surnames: "Test",
    status: true,
    company: {
      name: "TestCompany",
      cif: "TESTCIF123",
      street: "Calle Falsa",
      number: 123,
      postal: 28080,
      city: "Madrid",
      province: "Madrid",
      logo: ""
    }
  });

  token = await tokenSign(user);
});

afterAll(async () => {
  await mongoose.connection.close();
  server.close();
});

describe("Client API tests", () => {
  test("Create a client", async () => {
    const response = await api
      .post("/client")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Cliente Ejemplo 2",
        cif: "B12345658"
      })
      .expect(201)
      .expect("Content-Type", /application\/json/);

    clientId = response.body._id;
    expect(response.body.name).toBe("Cliente Ejemplo 2");
  });

  test("Get all clients", async () => {
    const response = await api
      .get("/client")
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test("Get one client by ID", async () => {
    const response = await api
      .get(`/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body._id).toBe(clientId);
  });

  test("Update client", async () => {
    const response = await api
      .patch(`/client/${clientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Nuevo nombre" })
      .expect(200)
      .expect("Content-Type", /application\/json/);

    expect(response.body.client.name).toBe("Nuevo nombre");
  });

  test("Soft delete client", async () => {
    await api
      .delete(`/client/${clientId}?soft=true`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const archived = await clientModel.findById(clientId);
    expect(archived.archived).toBe(true);
  });

  test("Get archived clients", async () => {
    const response = await api
      .get("/client/archived")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((c) => c._id === clientId)).toBe(true);
  });

  test("Restore archived client", async () => {
    await api
      .patch(`/client/${clientId}/restore`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const restored = await clientModel.findById(clientId);
    expect(restored.archived).toBe(false);
  });

  test("Delete client hard", async () => {
    await api
      .delete(`/client/${clientId}?soft=false`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const deleted = await clientModel.findById(clientId);
    expect(deleted).toBeNull();
  });
});