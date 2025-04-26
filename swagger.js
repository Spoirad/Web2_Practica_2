const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Definición básica de Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Digitalización de Albaranes",
      version: "1.0.0",
      description: "Documentación de la API Web2 Práctica Final",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./docs/*.yaml"], // Aquí leerá tus rutas o yaml
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = { swaggerDocs };
