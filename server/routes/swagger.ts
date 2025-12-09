/**
 * OpenAPI/Swagger Documentation Configuration
 * 
 * Provides interactive API documentation at /api/docs
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerJsdoc = require('swagger-jsdoc') as typeof import('swagger-jsdoc');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerUi = require('swagger-ui-express') as typeof import('swagger-ui-express');
import { Router } from 'express';
import { config } from '../config/env';

const log = require('../lib/logger').logger.child({ module: 'swagger' });

// OpenAPI specification options
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Xeno Shopify Data Platform API',
      version: '1.0.0',
      description: `
## Overview
Multi-tenant Shopify data platform providing customer analytics, RFM analysis, 
segmentation, and real-time data synchronization.

## Authentication
All API endpoints require authentication via the \`X-Shopify-Shop-Domain\` header.
The shop must be registered through the OAuth flow.

## Rate Limiting
- Per-tenant monthly limits based on plan tier
- Per-minute sliding window limits
- Rate limit headers included in responses

## Plan Tiers
| Plan | Monthly Requests | Per-Minute Burst |
|------|------------------|------------------|
| FREE | 10,000 | 10 |
| STARTER | 50,000 | 50 |
| GROWTH | 200,000 | 200 |
| ENTERPRISE | 1,000,000 | 500 |
      `,
      contact: {
        name: 'Xeno Support',
        email: 'support@xeno.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.isDev ? `http://localhost:${config.port}` : config.shopifyAppUrl,
        description: config.isDev ? 'Development server' : 'Production server',
      },
    ],
    tags: [
      { name: 'Health', description: 'System health and status endpoints' },
      { name: 'Customers', description: 'Customer management and RFM data' },
      { name: 'Orders', description: 'Order management and history' },
      { name: 'Segments', description: 'Customer segmentation builder' },
      { name: 'Analytics', description: 'RFM analysis and metrics' },
      { name: 'Tenants', description: 'Tenant management and settings' },
    ],
    components: {
      securitySchemes: {
        ShopDomain: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Shopify-Shop-Domain',
          description: 'Shopify shop domain (e.g., mystore.myshopify.com)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request parameters' },
                details: { type: 'object' },
                requestId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
            hasMore: { type: 'boolean', example: true },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            totalSpent: { type: 'number', format: 'decimal' },
            ordersCount: { type: 'integer' },
            avgOrderValue: { type: 'number', format: 'decimal' },
            lastOrderDate: { type: 'string', format: 'date-time' },
            recencyScore: { type: 'integer', minimum: 1, maximum: 5 },
            frequencyScore: { type: 'integer', minimum: 1, maximum: 5 },
            monetaryScore: { type: 'integer', minimum: 1, maximum: 5 },
            rfmSegment: { $ref: '#/components/schemas/RFMSegment' },
            isHighValue: { type: 'boolean' },
            isChurnRisk: { type: 'boolean' },
            churnProbability: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
        RFMSegment: {
          type: 'string',
          enum: [
            'CHAMPIONS', 'LOYAL', 'POTENTIAL_LOYALIST', 'NEW_CUSTOMERS',
            'PROMISING', 'NEED_ATTENTION', 'ABOUT_TO_SLEEP', 'AT_RISK',
            'CANNOT_LOSE', 'HIBERNATING', 'LOST',
          ],
          description: 'RFM-based customer segment',
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'integer' },
            orderName: { type: 'string', example: '#1001' },
            totalPrice: { type: 'number', format: 'decimal' },
            financialStatus: { type: 'string', enum: ['PENDING', 'PAID', 'REFUNDED', 'VOIDED'] },
            fulfillmentStatus: { type: 'string', enum: ['FULFILLED', 'PARTIAL', 'PENDING'] },
            lineItemsCount: { type: 'integer' },
            orderDate: { type: 'string', format: 'date-time' },
            currency: { type: 'string', example: 'USD' },
          },
        },
        Segment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            filters: { $ref: '#/components/schemas/SegmentFilters' },
            customerCount: { type: 'integer' },
            estimatedRevenue: { type: 'number', format: 'decimal' },
            isActive: { type: 'boolean' },
            lastComputedAt: { type: 'string', format: 'date-time' },
          },
        },
        SegmentFilters: {
          type: 'object',
          description: 'JSON-based filter DSL for segment definition',
          properties: {
            operator: { type: 'string', enum: ['AND', 'OR'] },
            conditions: {
              type: 'array',
              items: { $ref: '#/components/schemas/FilterCondition' },
            },
          },
        },
        FilterCondition: {
          type: 'object',
          properties: {
            field: { type: 'string', example: 'totalSpent' },
            operator: {
              type: 'string',
              enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'between', 'contains', 'isNull', 'isNotNull'],
            },
            value: { oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'array' }] },
          },
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
                queues: { type: 'object' },
                scheduler: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Invalid request parameters',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Unauthorized: {
          description: 'Missing or invalid authentication',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        RateLimited: {
          description: 'Rate limit exceeded',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          headers: {
            'X-RateLimit-Limit': { description: 'Request limit per window', schema: { type: 'integer' } },
            'X-RateLimit-Remaining': { description: 'Remaining requests in window', schema: { type: 'integer' } },
            'X-RateLimit-Reset': { description: 'Window reset timestamp', schema: { type: 'integer' } },
          },
        },
      },
    },
    security: [{ ShopDomain: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'System health check',
          description: 'Returns health status of all system components',
          security: [],
          responses: {
            '200': {
              description: 'System is healthy',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthStatus' } } },
            },
            '503': {
              description: 'System is unhealthy',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthStatus' } } },
            },
          },
        },
      },
      '/api/v1/customers': {
        get: {
          tags: ['Customers'],
          summary: 'List customers',
          description: 'Get paginated list of customers with optional filters',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['totalSpent', 'ordersCount', 'lastOrderDate', 'createdAt'] } },
            { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by email, first/last name' },
            { name: 'rfmSegment', in: 'query', schema: { $ref: '#/components/schemas/RFMSegment' } },
            { name: 'isHighValue', in: 'query', schema: { type: 'boolean' } },
            { name: 'isChurnRisk', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            '200': {
              description: 'List of customers',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
            '401': { $ref: '#/components/responses/Unauthorized' },
            '429': { $ref: '#/components/responses/RateLimited' },
          },
        },
      },
      '/api/v1/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer details',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': {
              description: 'Customer details',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } },
            },
            '404': { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/v1/segments': {
        get: {
          tags: ['Segments'],
          summary: 'List segments',
          responses: {
            '200': {
              description: 'List of segments',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Segment' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Segments'],
          summary: 'Create segment',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'filters'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    filters: { $ref: '#/components/schemas/SegmentFilters' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Segment created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Segment' } } },
            },
            '400': { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/v1/analytics/rfm/distribution': {
        get: {
          tags: ['Analytics'],
          summary: 'RFM segment distribution',
          description: 'Get customer count and revenue by RFM segment',
          responses: {
            '200': {
              description: 'RFM distribution data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            segment: { $ref: '#/components/schemas/RFMSegment' },
                            count: { type: 'integer' },
                            totalSpent: { type: 'number' },
                            percentage: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/analytics/revenue/trend': {
        get: {
          tags: ['Analytics'],
          summary: 'Revenue trend',
          description: 'Get daily revenue trend for specified period',
          parameters: [
            { name: 'days', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Number of days to look back' },
          ],
          responses: {
            '200': {
              description: 'Revenue trend data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date' },
                            orderCount: { type: 'integer' },
                            revenue: { type: 'number' },
                            avgOrderValue: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We define paths inline above
};

// Generate OpenAPI spec
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Create router for Swagger UI
export const swaggerRouter: Router = Router();

// Serve Swagger UI
swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Xeno API Documentation',
}));

// Serve raw OpenAPI spec
swaggerRouter.get('/spec', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

log.info('Swagger documentation initialized');
