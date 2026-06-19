const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Storefront API',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://localhost:3000'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          firstname: { type: 'string' },
          lastname: { type: 'string' }
        }
      },
      UserInput: {
        type: 'object',
        required: ['firstname', 'lastname', 'password'],
        properties: {
          firstname: { type: 'string' },
          lastname: { type: 'string' },
          password: { type: 'string' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          price: { type: 'integer' },
          category: { type: 'string' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'complete'] }
        }
      },
      OrderProduct: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          order_id: { type: 'integer' },
          product_id: { type: 'integer' },
          quantity: { type: 'integer' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          '201': { description: 'Registered' },
          '400': { description: 'Could not create user' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstname', 'password'],
                properties: {
                  firstname: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Logged in' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Users returned' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          '201': { description: 'User created' },
          '400': { description: 'Could not create user' }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User returned' },
          '404': { description: 'User not found' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          '200': { description: 'User updated' },
          '404': { description: 'User not found' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'User deleted' },
          '404': { description: 'User not found' }
        }
      }
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'integer', minimum: 0 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 0, maximum: 100 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 } }
        ],
        responses: { '200': { description: 'Products returned' } }
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' }
            }
          }
        },
        responses: {
          '201': { description: 'Product created' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/products/popular': {
      get: {
        tags: ['Products'],
        summary: 'List popular products',
        responses: { '200': { description: 'Popular products returned' } }
      }
    },
    '/products/filters': {
      get: {
        tags: ['Products'],
        summary: 'Get product filter metadata',
        responses: { '200': { description: 'Product filter metadata returned' } }
      }
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Product returned' },
          '404': { description: 'Product not found' }
        }
      },
      put: {
        tags: ['Products'],
        summary: 'Update product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Product' }
            }
          }
        },
        responses: {
          '200': { description: 'Product updated' },
          '404': { description: 'Product not found' }
        }
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Product deleted' },
          '404': { description: 'Product not found' }
        }
      }
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Orders returned' } }
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' }
            }
          }
        },
        responses: { '201': { description: 'Order created' } }
      }
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Order returned' },
          '404': { description: 'Order not found' }
        }
      },
      put: {
        tags: ['Orders'],
        summary: 'Update order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Order' }
            }
          }
        },
        responses: { '200': { description: 'Order updated' } }
      },
      delete: {
        tags: ['Orders'],
        summary: 'Delete order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Order deleted' } }
      }
    },
    '/orders/{id}/products': {
      post: {
        tags: ['Orders'],
        summary: 'Add product to order',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                  product_id: { type: 'integer' },
                  quantity: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Product added' } }
      }
    },
    '/orders/users/{userId}/current': {
      get: {
        tags: ['Orders'],
        summary: 'Get current orders by user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Current orders returned' } }
      }
    },
    '/orders/users/{userId}/completed': {
      get: {
        tags: ['Orders'],
        summary: 'Get completed orders by user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Completed orders returned' } }
      }
    }
  }
}

export default swaggerDocument
