const supertest = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const clientModel = require("../models/client.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);

let token;
let tokenAjeno;
let user;
let clientId = "";

beforeAll(async () => {
  await new Promise((resolve) => {
    mongoose.connection.once("open", resolve);
  });
  await mongoose.connection.db.dropDatabase();

  const password = await encrypt("mipassword");
  user = await usersModel.create({
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

describe("Client API Error Handling", () => {
  test("Create client with missing fields", async () => {
    const res = await api
      .post("/client")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Get client with invalid ID", async () => {
    const res = await api
      .get("/client/invalidid123")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });
  test("Get client that does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await api
      .get(`/client/${nonExistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Update client with invalid ID", async () => {
    const res = await api
      .patch("/client/invalidid123")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Actualizado" })
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Delete client with invalid ID", async () => {
    const res = await api
      .delete("/client/invalidid123")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Delete client that does not exist", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await api
      .delete(`/client/${nonExistentId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Restore client that is not archived", async () => {
    const res = await api
      .patch(`/client/${clientId}/restore`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("error", true);
    expect(res.body.message).toMatch(/no archivado/i);
  });

  test("Access client from another user", async () => {
    // Crear un cliente con el usuario propietario
    const cliente = await clientModel.create({
      name: "Cliente privado",
      cif: "CLPRIVADO01",
      owner: user._id,
      companyCIF: user.company.cif,
      archived: false
    });

    // Intentar acceder con otro usuario (no tiene acceso)
    const res = await api
      .get(`/client/${cliente._id}`)
      .set("Authorization", `Bearer ${tokenAjeno}`)
      .expect(403);

    expect(res.body).toHaveProperty("error", true);
    expect(res.body.message).toMatch(/no tienes acceso/i);
  });


  test("Create client without token", async () => {
    const res = await api
      .post("/client")
      .send({ name: "Cliente sin token", cif: "SIN1234" })
      .expect(401);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Cannot restore a client that was already restored", async () => {
    const client = await clientModel.create({
      name: "Cliente Restaurado",
      cif: "CLIRES123",
      owner: user._id,
      companyCIF: "B00000001",
      archived: true
    });

    // Primera restauración (válida)
    await api
      .patch(`/client/${client._id}/restore`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Segunda restauración (debe fallar)
    const res = await api
      .patch(`/client/${client._id}/restore`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(res.body).toHaveProperty("error", true);
    expect(res.body.message).toMatch(/no archivado/i);
  });

});