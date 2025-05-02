# ErrorHub

ErrorHub is a centralized error management system with message localization. The system allows developers to use error codes instead of text messages in code, while dynamically retrieving user-facing messages by code and required locale through API.

## Features

- 🌐 **Multilingual out of the box** - support for message localization in different languages
- 🔄 **Dynamic message retrieval** - real-time error text retrieval via API
- 💻 **SDK for various platforms** - Node.js, browser, and Fastify plugin support
- 🧰 **Administrative interface** - for managing messages and translations
- 📦 **Caching** - multi-level caching for fast access to messages
- 🔌 **Integrations** - with loggers, monitoring, and CI/CD

## Project Structure

The project is built as a monorepo using npm workspaces and includes the following packages:

- `packages/sdk` - SDK for working with the error API
- `packages/api` - REST API server
- `packages/admin-ui` - administrative interface
- `packages/shared-ui` - shared UI components



### SDK package

SDK for integration with the error API, including:

- Core module with basic functionality
- Browser module for use in the browser
- Node module with Fastify plugin support
- Message caching for performance optimization
- Parameter substitution in message templates

### API server

REST API server based on Fastify for:

- Retrieving error messages by code and locale
- Batch loading of messages
- Creating, updating, and deleting errors
- Managing localizations

### Admin UI

Web interface for:

- Managing the error catalog
- Creating and editing messages
- Translating messages into different languages
- Importing/exporting translations

## Installation

### Cloning the repository

```bash
git clone https://github.com/yourusername/errorHub.git
cd errorHub
```

### Installing dependencies

```bash
npm install
```

### Building packages

```bash
npm run build
```

## Using the SDK

### Node.js

```javascript
import { ErrorHub } from '@errorhub/sdk';

const errorHub = new ErrorHub({
  apiUrl: 'https://api.errorhub.example.com',
  apiKey: 'your-api-key',
  defaultLanguage: 'en'
});

// Getting an error message
const error = await errorHub.getError('USER.NOT_FOUND', 'ru');
console.log(error.message); // "Пользователь не найден"

// Using with parameters
const message = await errorHub.getMessage(
  'ORDER.ITEM.OUT_OF_STOCK', 
  'en', 
  { item: 'Laptop' }
);
console.log(message); // "Item 'Laptop' is out of stock"
```

### Fastify Plugin

```javascript
import Fastify from 'fastify';
import { ErrorHub } from '@errorhub/sdk';

const fastify = Fastify();

const errorHub = new ErrorHub({
  apiUrl: 'https://api.errorhub.example.com',
  apiKey: 'your-api-key',
  defaultLanguage: 'en'
});

// Plugin registration
fastify.register(errorHub.createFastifyPlugin());

// Using in a route
fastify.get('/users/:id', async (request, reply) => {
  // Getting an error
  if (!userExists) {
    return reply.sendErrorResponse('USER.NOT_FOUND', 404);
  }
  
  // Regular response
  return { user };
});

fastify.listen({ port: 3000 });
```

### Browser

```javascript
import { ErrorHub } from '@errorhub/sdk';

const errorHub = new ErrorHub({
  apiUrl: 'https://api.errorhub.example.com',
  apiKey: 'your-api-key',
  defaultLanguage: 'en',
  cache: {
    enabled: true,
    ttl: 3600000 // 1 hour
  }
});

// Handling form error
async function validateForm() {
  if (!isPasswordStrong(password)) {
    const message = await errorHub.getMessage('VALIDATION.PASSWORD_TOO_WEAK');
    showError(message);
  }
}
```

## Running the API server

```bash
cd packages/api
npm run dev
```

The server will be available at http://localhost:4000

## Running the Admin UI

```bash
cd packages/admin-ui
npm run dev
```

The interface will be available at http://localhost:3000

## Architecture

ErrorHub is built on the following principles:

- **Separation of concerns** - each package has a clear role in the system
- **API-first approach** - all interactions happen through the API
- **Multi-level caching** - for optimal performance
- **Extensibility** - possibility to add new error types and integrations

### Data Flow Diagram

```
+-------------+      +--------------+      +---------------+
| Application  |----->| ErrorHub SDK |----->| ErrorHub API  |
| (client)     |<-----| (caching)    |<-----| (server)      |
+-------------+      +--------------+      +------^--------+
                                                  |
                                           +------+--------+
                                           | Database      |
                                           | (errors and   |
                                           |  translations)|
                                           +---------------+
```

## Development

### Package Structure

```
errorHub/
├── packages/
│   ├── sdk/
│   │   ├── core/
│   │   │   ├── client/
│   │   │   │   ├── base-client.ts
│   │   │   │   └── http-client.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── browser/
│   │   │   └── index.ts
│   │   ├── node/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── api/
│   │   └── src/
│   │       ├── middleware/
│   │       │   └── error-handler.ts
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   └── error-routes.ts
│   │       ├── services/
│   │       └── index.ts
│   ├── admin-ui/
│   └── shared-ui/
└── package.json
```

### Running in development mode

```bash
npm run dev
```

This will start all packages in development mode with change tracking.

## License

MIT 