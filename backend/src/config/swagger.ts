import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Red Bull Austria Supply Chain Intelligence Platform API',
      version: '1.0.0',
      description: 'REST API for delivery cost calculation, route optimization, and analytics',
      contact: {
        name: 'API Support',
        email: 'support@redbull.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.supply-chain.redbull.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2024-01-15T10:30:00Z',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Coordinates: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              format: 'double',
              minimum: 46.4,
              maximum: 49.0,
              example: 47.8095,
            },
            longitude: {
              type: 'number',
              format: 'double',
              minimum: 9.5,
              maximum: 17.2,
              example: 13.0550,
            },
            elevation: {
              type: 'number',
              format: 'double',
              minimum: 0,
              example: 424,
            },
          },
        },
        Premise: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Vienna Nightclub',
            },
            category: {
              type: 'string',
              enum: ['nightclub', 'gym', 'retail', 'restaurant', 'hotel'],
              example: 'nightclub',
            },
            address: {
              type: 'string',
              example: 'Stephansplatz 1, 1010 Vienna',
            },
            latitude: {
              type: 'number',
              format: 'double',
            },
            longitude: {
              type: 'number',
              format: 'double',
            },
            elevation: {
              type: 'number',
              format: 'double',
            },
            weeklyDemand: {
              type: 'integer',
              minimum: 1,
              example: 500,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Small Van',
            },
            type: {
              type: 'string',
              enum: ['small_van', 'medium_truck', 'large_truck'],
            },
            capacity: {
              type: 'integer',
              example: 800,
            },
            fuelConsumptionRate: {
              type: 'number',
              format: 'double',
              example: 0.12,
            },
            co2EmissionRate: {
              type: 'number',
              format: 'double',
              example: 0.28,
            },
            hourlyLaborCost: {
              type: 'number',
              format: 'double',
              example: 25.0,
            },
            fixedCostPerDelivery: {
              type: 'number',
              format: 'double',
              example: 15.0,
            },
          },
        },
        CostBreakdown: {
          type: 'object',
          properties: {
            fuelCost: {
              type: 'number',
              format: 'double',
              example: 87.50,
            },
            laborCost: {
              type: 'number',
              format: 'double',
              example: 125.00,
            },
            vehicleCost: {
              type: 'number',
              format: 'double',
              example: 15.00,
            },
            carbonCost: {
              type: 'number',
              format: 'double',
              example: 17.80,
            },
            totalCost: {
              type: 'number',
              format: 'double',
              example: 245.30,
            },
            distance: {
              type: 'number',
              format: 'double',
              example: 250.5,
            },
            duration: {
              type: 'number',
              format: 'double',
              example: 4.175,
            },
            co2Emissions: {
              type: 'number',
              format: 'double',
              example: 70.14,
            },
            isAlpine: {
              type: 'boolean',
              example: false,
            },
            hasOvertime: {
              type: 'boolean',
              example: false,
            },
          },
        },
        OptimizedRoute: {
          type: 'object',
          properties: {
            sequence: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Premise',
              },
            },
            totalDistance: {
              type: 'number',
              format: 'double',
            },
            totalCost: {
              type: 'number',
              format: 'double',
            },
            totalDuration: {
              type: 'number',
              format: 'double',
            },
            totalCO2: {
              type: 'number',
              format: 'double',
            },
            segmentDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: {
                    type: 'object',
                  },
                  to: {
                    $ref: '#/components/schemas/Premise',
                  },
                  distance: {
                    type: 'number',
                  },
                  cost: {
                    type: 'number',
                  },
                  duration: {
                    type: 'number',
                  },
                  co2: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
