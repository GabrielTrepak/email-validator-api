import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Email Validator API",
      version: "1.0.0",
      description:
        "Validate and normalize email addresses. Check format, domain and basic validity.",
    },
    servers: [
      {
        url: "https://email-validator-api-hscc.onrender.com",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);