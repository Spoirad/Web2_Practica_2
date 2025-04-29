const supertest = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../app.js");
const usersModel = require("../models/user.js");
const { encrypt } = require("../utils/handlePassword.js");
const { tokenSign } = require("../utils/handleJwt.js");
const api = supertest(app);

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
});
