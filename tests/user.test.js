const supertest = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);
const path = require("path");


let token;
let userId;

beforeAll(async () => {
  await new Promise((resolve) => mongoose.connection.once("open", resolve));
  await mongoose.connection.db.dropDatabase();

  const hashedPassword = await encrypt("password1");
  const user = await usersModel.create({
    email: "test21@test.com",
    password: hashedPassword,
    status: true,
    nif: "40000000W"
  });

  userId = user._id.toString();
  token = await tokenSign(user);
});

afterAll(async () => {
  await mongoose.disconnect();
  server.close();
});

describe("User API tests", () => {
  test("Register new user", async () => {
    const response = await api
      .post("/user/register")
      .send({
        email: "test22@test.com",
        password: "password1"
      })
      .expect(201)
      .expect("Content-Type", /application\/json/);

    expect(response.body.email).toBe("test22@test.com");
  });

  test("Login user", async () => {
    const response = await api
      .post("/user/login")
      .send({
        email: "test21@test.com",
        password: "password1"
      })
      .expect(200);

    expect(response.body.token).toBeDefined();
  });

  test("Update personal data", async () => {
    const response = await api
      .put("/user/register")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "José",
        surnames: "García Pérez",
        nif: "40000001A"
      })
      .expect(200);

    expect(response.body.nif).toBe("40000001A");
  });

  test("Update company data", async () => {
    const response = await api
      .patch("/user/company")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: {
          name: "Servitop2, SL.",
          cif: "BXXXXXXXY",
          street: "Carlos V",
          number: 22,
          postal: 28936,
          city: "Móstoles",
          province: "Madrid"
        }
      })
      .expect(200);

    expect(response.body.company.name).toBe("Servitop2, SL.");
  });

  test("Get user profile", async () => {
    const response = await api
      .get("/user")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.email).toBe("test21@test.com");
  });

  test("Soft delete user", async () => {
    await api
      .delete("/user?soft=true")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const user = await usersModel.findById(userId);
    expect(user.deleted).toBe(true);
  });

  test("Hard delete user", async () => {
    const newUser = await usersModel.create({
      email: "test23@test.com",
      password: await encrypt("password1"),
      nif: "40000002A",
      status: true
    });
    const newToken = await tokenSign(newUser);

    await api
      .delete("/user?soft=false")
      .set("Authorization", `Bearer ${newToken}`)
      .expect(200);

    const deleted = await usersModel.findById(newUser._id);
    expect(deleted).toBeNull();
  });

  test("Upload logo for user", async () => {
    const res = await api
      .patch("/user/logo")
      .set("Authorization", `Bearer ${token}`)
      .attach("logo", path.join(__dirname, "firma-fake.png"))
      .expect(200);

    expect(res.body).toHaveProperty("message", "Logo actualizado correctamente");
    expect(res.body).toHaveProperty("logo");
    expect(res.body.logo).toContain("ipfs.io/ipfs/");    
  });
});

describe("User API Error Handling", () => {
  test("Register with missing email", async () => {
    const res = await api
      .post("/user/register")
      .send({ password: "pass123" })
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Login with wrong credentials", async () => {
    const res = await api
      .post("/user/login")
      .send({ email: "nonexistent@test.com", password: "wrongpass" })
      .expect(404);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Access profile without token", async () => {
    const res = await api
      .get("/user")
      .expect(401);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Company update without required fields", async () => {
    const res = await api
      .patch("/user/company")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Delete user without token", async () => {
    const res = await api
      .delete("/user")
      .expect(401);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Access with invalid token", async () => {
    const res = await api
      .get("/user")
      .set("Authorization", "Bearer invalidtoken123")
      .expect(401);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Validate already verified email", async () => {
    // Asume que el user ya tiene status: true
    const res = await api
      .put("/user/validation")
      .set("Authorization", `Bearer ${token}`)
      .send({ codigo: 123456 }) // valor no relevante porque ya está verificado
      .expect(400);

    expect(res.body.message).toMatch(/ya ha sido validado/i);
  });

  test("Register with existing email", async () => {
    // Insertamos el email por si no está en la base de datos
    await usersModel.create({
      email: "paco@test.com",
      password: await encrypt("password123"),
      status: true,
      nif: "40000020A",
      name: "Duplicado",
      surnames: "Correo"
    });

    const res = await api
      .post("/user/register")
      .set("api_key", "prueba_api_random")
      .send({ email: "paco@test.com", password: "password123" })
      .expect(409);

    expect(res.body).toHaveProperty("error", true);
  });

  test("Register with short password", async () => {
    const res = await api
      .post("/user/register")
      .set("api_key", "prueba_api_random")
      .send({ email: "shortpass@test.com", password: "123" }) // muy corta
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  test("Upload logo Should fail without token", async () => {
    await api
      .patch("/user/logo")
      .attach("logo", path.join(__dirname, "firma-fake.png"))
      .expect(401);
  });

  test("Upload logo should fail if logo is missing", async () => {
    const res = await api
      .patch("/user/logo")
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    expect(res.body).toHaveProperty("error", true);
    expect(res.body.message).toMatch(/no se subió ninguna imagen/i);

  });
});
