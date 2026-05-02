import swaggerJsdoc from "swagger-jsdoc";

const serverUrl = process.env.SERVER_URL || "http://localhost:3000";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Email Verification API",
      version: "1.0.0",
      description:
        "Validate and verify emails with MX checks, disposable detection, role analysis and scoring.",
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);