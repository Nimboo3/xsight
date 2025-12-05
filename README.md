# Shopify App - Next.js + Express

A Shopify app template built with **Next.js 14 (App Router)** and **Express.js** backend.

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework
- **React 18** - UI library
- **TanStack React Query** - Data fetching and state management
- **Recharts** - Charts and data visualization
- **Shopify App Bridge React** - Embedded app integration

### Backend
- **Node.js 20** + **TypeScript** - Runtime and type safety
- **Express.js** - HTTP server framework
- **Prisma** - Database ORM with PostgreSQL
- **BullMQ + Redis (Upstash)** - Queue for webhook processing
- **Pino** - Logging

### Infrastructure
- **PostgreSQL** (Railway) - Database
- **Redis** (Upstash) - Queue backend
- **Vercel** - Frontend deployment
- **Railway** - API & Worker deployment

## Project Structure

```
├── src/                    # Next.js frontend (App Router)
│   ├── app/               # App Router pages
│   │   ├── app/           # Embedded app pages
│   │   ├── auth/          # Authentication pages
│   │   └── layout.tsx     # Root layout
│   └── lib/               # Frontend utilities
├── server/                 # Express backend
│   ├── routes/            # API routes
│   │   ├── api.ts         # Main API endpoints
│   │   ├── shopify.ts     # OAuth handlers
│   │   └── webhooks.ts    # Webhook handlers
│   ├── lib/               # Backend utilities
│   │   ├── db.ts          # Prisma client
│   │   ├── logger.ts      # Pino logger
│   │   └── shopify.ts     # Shopify API client
│   └── index.ts           # Express server entry
├── prisma/                 # Database schema and migrations
└── extensions/             # Shopify app extensions
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Railway)
- Redis instance (or Upstash)
- Shopify Partner account

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd shopify-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and configure it:
   ```bash
   cp .env.example .env
   ```

4. Set up the database:
   ```bash
   npm run prisma migrate dev
   npm run setup
   ```

5. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Express backend on `http://localhost:3000`
- Next.js frontend on `http://localhost:3001`

## Environment Variables

```env
# Shopify API Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-app-url.ngrok.io
SCOPES=write_products,read_products

# Database Configuration (PostgreSQL - Railway)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis Configuration (Upstash)
REDIS_URL=redis://default:password@hostname:port

# Server Configuration
PORT=3000
NODE_ENV=development

# Next.js Client Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key_here
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:server` | Start only the Express backend |
| `npm run dev:client` | Start only the Next.js frontend |
| `npm run build` | Build both frontend and backend for production |
| `npm run start` | Start both in production mode |
| `npm run setup` | Generate Prisma client and run migrations |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## API Endpoints

### Authentication
- `GET /auth` - Initiate OAuth flow
- `GET /auth/callback` - OAuth callback
- `POST /auth/login` - Login with shop domain

### Webhooks
- `POST /webhooks/app/uninstalled` - Handle app uninstall
- `POST /webhooks/app/scopes_update` - Handle scope changes

### API
- `GET /api/shop` - Get current shop info
- `POST /api/products` - Create a sample product

## Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables
3. Deploy

### Backend (Railway)
1. Create a new project on Railway
2. Add PostgreSQL database
3. Deploy the Express backend
4. Set environment variables

### Redis (Upstash)
1. Create a Redis database on Upstash
2. Copy the connection URL to `REDIS_URL`

## License

MIT
