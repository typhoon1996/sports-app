// backend/swaggerDef.js

const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sports App API Documentation',
      version: '1.0.0',
      description: 'API documentation for the Sports App backend.',
    },
    servers: [
      {
        url: '/api',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to your API route files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;