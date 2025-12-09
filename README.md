# XSight - Shopify Analytics & CRM Platform

> **Xeno FDE Internship Assignment 2025** - A production-grade Shopify analytics and CRM platform with advanced RFM segmentation, real-time sync progress tracking, and comprehensive customer insights.

[![Deploy Status](https://img.shields.io/badge/deploy-railway-purple)](https://xsight-production.up.railway.app)
[![Frontend](https://img.shields.io/badge/frontend-vercel-black)](https://xsight-frontend-production.up.railway.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

![XSight Dashboard](./docs/images/dashboard-overview.png)
*Main dashboard showing real-time analytics and customer insights*

---

## 📺 Demo Video

> **[Watch Full Demo (7 minutes)](_YOUR_YOUTUBE_OR_LOOM_LINK_)**

[![Demo Video Thumbnail](./docs/images/video-thumbnail.png)](_YOUR_YOUTUBE_OR_LOOM_LINK_)

**What's covered:**
- ✅ Shopify OAuth integration and store connection
- ✅ Real-time data sync with WebSocket progress tracking
- ✅ RFM segmentation and customer analytics
- ✅ Custom segment builder with complex rules
- ✅ Multi-tenancy and deployment architecture

---

<img width="1897" height="918" alt="Screenshot 2025-12-09 125957" src="https://github.com/user-attachments/assets/b31f03c0-0287-4a98-a92f-cf5e83871ac4" />

<img width="1901" height="918" alt="Screenshot 2025-12-09 130020" src="https://github.com/user-attachments/assets/bb0e022f-6844-44a0-b1a6-aef9060b41cd" />
<img width="1898" height="913" alt="Screenshot 2025-12-09 130033" src="https://github.com/user-attachments/assets/b0983489-3078-4122-a051-26ea2d1de550" />
<img width="1895" height="917" alt="Screenshot 2025-12-09 130052" src="https://github.com/user-attachments/assets/b22cb17a-5c6c-4d32-91b1-250694830bfa" />
<img width="1900" height="913" alt="Screenshot 2025-12-09 130101" src="https://github.com/user-attachments/assets/d978070f-94a6-414d-a0cd-69b4647f7803" />
<img width="1898" height="914" alt="Screenshot 2025-12-09 130114" src="https://github.com/user-attachments/assets/9cfca774-e321-4b81-bcaf-a37e508ec346" />
<img width="1896" height="916" alt="Screenshot 2025-12-09 130125" src="https://github.com/user-attachments/assets/4039575c-1a64-49a7-a3a0-f36efc968fca" />

## 🌟 Features

### Analytics & Segmentation
- **RFM Analysis**: Recency, Frequency, Monetary value segmentation
- **Churn Prediction**: Identify at-risk customers before they leave
- **Cohort Analysis**: Track customer behavior over time
- **Custom Segments**: Build dynamic customer segments with complex rules
- **Revenue Analytics**: Track orders, revenue, and customer lifetime value

### Real-Time Data Sync
- **WebSocket Progress Tracking**: See live sync progress with percentage and step info
- **BullMQ Job Processing**: Reliable background job queue with Redis
- **Webhook Processing**: Automatic real-time updates via Shopify webhooks
- **Incremental Sync**: Efficient sync with cursor-based pagination

### Security & Multi-Tenancy
- **JWT Authentication**: Secure HTTP-only cookie-based auth
- **Tenant Isolation**: Complete data separation between stores
- **Rate Limiting**: Per-tenant API rate limits with Redis
- **HMAC Verification**: Secure webhook validation

### Modern Architecture
- **Next.js 14 Frontend**: Server-side rendering, React 18, App Router
- **Express.js Backend**: RESTful API with TypeScript
- **Prisma ORM**: Type-safe database access with PostgreSQL
- **Redis**: Caching, rate limiting, job queue, Pub/Sub
- **Socket.IO**: Real-time WebSocket communication

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0 (package manager)
- **PostgreSQL**: >= 14.0 (database)
- **Redis**: >= 7.0 (cache, queue, Pub/Sub)
- **Shopify Partner Account**: For app credentials

## 📁 Project Structure

```
├── server/                 # Backend Express.js API
│   ├── config/            # Database, Redis, environment config
│   ├── lib/               # Utilities (JWT, crypto, logger, cache, sync-progress)
│   ├── middleware/        # Auth, rate limiting, error handling
│   ├── routes/            # API endpoints (v1, auth, webhooks)
│   ├── services/          # Business logic
│   │   ├── analytics/     # RFM, churn prediction, cohort analysis
│   │   ├── queue/         # BullMQ queue definitions
│   │   ├── segment/       # Segment management and rules
│   │   ├── shopify/       # Shopify API integration
│   │   ├── scheduler.ts   # Cron jobs and scheduled tasks
│   │   └── worker.ts      # Background job processor
│   ├── websocket/         # Socket.IO real-time server
│   └── index.ts           # Server entry point
├── src/                   # Frontend Next.js app
│   ├── app/               # Next.js pages and layouts
│   │   ├── app/           # Dashboard pages
│   │   ├── auth/          # Login/signup pages
│   │   ├── connect/       # Shopify connection flow
│   │   └── page.tsx       # Landing page
│   ├── components/        # React components
│   │   ├── analytics/     # Analytics charts and cards
│   │   ├── customers/     # Customer list and details
│   │   ├── segments/      # Segment builder and management
│   │   ├── sync/          # Sync status and progress
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # React hooks
│   │   ├── use-api.ts     # API queries and mutations
│   │   ├── use-auth.tsx   # Authentication context
│   │   ├── use-websocket.tsx  # WebSocket real-time updates
│   │   └── use-shop.tsx   # Shopify shop context
│   └── lib/               # Frontend utilities
├── prisma/                # Database schema and migrations
├── docs/                  # Documentation
└── public/               # Static assets
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd shopify-app-template-react-router-main
pnpm install
```

### 2. Environment Setup

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/xsight"

# Redis (Upstash recommended for production)
REDIS_URL="redis://localhost:6379"

# Shopify App Credentials
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SHOPIFY_APP_URL="https://your-domain.com"
SCOPES="read_customers,read_orders,read_products"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-jwt-secret-key"

# Frontend URL
FRONTEND_URL="http://localhost:3001"

# Node Environment
NODE_ENV="development"

# Server Port
PORT=3000

# Encryption Key (generate with: openssl rand -base64 32)
ENCRYPTION_KEY="your-encryption-key"

# Sentry (optional)
SENTRY_DSN="your-sentry-dsn"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm db:seed
```

### 4. Start Development Servers

```bash
# Start all services (backend, worker, frontend)
pnpm dev

# Or start individually:
pnpm dev:server   # Backend API (port 3000)
pnpm dev:worker   # Background worker
pnpm dev:client   # Frontend (port 3001)
```

### 5. Install WebSocket Dependencies

```bash
pnpm add socket.io socket.io-client js-cookie
pnpm add -D @types/js-cookie
```

## 🔧 Core Technologies

### Backend
- **Express.js**: Web server and API framework
- **Prisma**: Type-safe ORM with PostgreSQL
- **BullMQ**: Job queue with Redis
- **Socket.IO**: WebSocket server for real-time updates
- **Pino**: Structured JSON logging
- **Argon2**: Password hashing
- **JWT**: Stateless authentication

### Frontend
- **Next.js 14**: React framework with App Router
- **TanStack Query**: Data fetching and caching
- **shadcn/ui**: Accessible component library
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **GSAP**: Animations

### Infrastructure
- **PostgreSQL**: Primary database
- **Redis**: Cache, job queue, rate limiting, Pub/Sub
- **Upstash**: Managed Redis (recommended for production)
- **Vercel**: Frontend hosting (recommended)
- **Railway**: Backend hosting (recommended)

## 🏗️ Architecture

### High-Level Architecture Diagram

![System Architecture](./docs/images/architecture-diagram.png)
*Complete system architecture showing data flow, services, and integrations*

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Next.js 14  │  │  React Query │  │  Socket.IO   │         │
│  │  (Port 3001) │  │   + Zustand  │  │    Client    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Express.js  │  │  Socket.IO   │  │  BullMQ      │         │
│  │  REST API    │  │  Server      │  │  Worker      │         │
│  │  (Port 3000) │  │  (WebSocket) │  │  (Background)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Data & Queue Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │  Redis       │  │  Shopify     │         │
│  │  (Railway)   │  │  (Upstash)   │  │  Admin API   │         │
│  │  + Prisma    │  │  + Pub/Sub   │  │  + Webhooks  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

![Data Sync Flow](./docs/images/data-sync-flow.png)
*Real-time data synchronization flow with WebSocket progress updates*

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Monorepo Structure** | Single repo for frontend + backend simplifies development and deployment |
| **Redis Pub/Sub** | Enables real-time progress updates across worker and API server |
| **BullMQ Job Queue** | Reliable background processing with retry logic and persistence |
| **WebSocket + REST** | WebSocket for real-time updates, REST fallback for reliability |
| **Prisma ORM** | Type-safe queries, automatic migrations, multi-tenancy support |
| **HTTP-only Cookies** | Secure JWT storage, prevents XSS attacks |

---

## 📊 Real-Time Sync Architecture

![Real-Time Sync Sequence](./docs/images/sync-sequence.png)
*Sequence diagram showing WebSocket-based progress tracking*

XSight implements a sophisticated real-time progress tracking system:

1. **Trigger Sync**: User clicks "Sync Now"
2. **Generate syncRunId**: Server creates unique ID and stores in Redis
3. **Queue Jobs**: BullMQ queues customer and order sync jobs
4. **Worker Processing**: Background worker processes records, updates Redis every 500ms
5. **Redis Pub/Sub**: Progress published to `sync-progress` channel
6. **Socket.IO Broadcast**: WebSocket server receives and broadcasts to clients
7. **Frontend Updates**: React component shows live progress bar
8. **Completion**: Cache invalidated, fresh data loaded automatically

**Key Features:**
- Throttled updates (max 2/sec) to prevent Redis spam
- Multi-tenancy with room-based isolation
- REST fallback for WebSocket failures
- Automatic cleanup with 24-hour TTL

## 🔐 Security Features

![Security Architecture](./docs/images/security-architecture.png)
*Multi-layered security approach with tenant isolation*

- **HTTP-only Cookies**: JWT tokens stored securely
- **HMAC Verification**: Shopify webhook validation
- **Tenant Isolation**: Row-level security with tenant ID
- **Rate Limiting**: Per-tenant API limits with Redis
- **Encrypted Tokens**: Shopify access tokens encrypted at rest (AES-256-GCM)
- **CORS**: Strict origin validation
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for API requests

### Tenant Data Isolation

```sql
-- Every query automatically filtered by tenantId
SELECT * FROM customers WHERE tenantId = ? AND ...
SELECT * FROM orders WHERE tenantId = ? AND ...
SELECT * FROM segments WHERE tenantId = ? AND ...
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Shopify OAuth
- `GET /auth` - Start OAuth flow
- `GET /auth/callback` - OAuth callback
- `GET /auth/install` - App installation

### Tenants
- `GET /api/v1/tenants/me` - Current tenant info
- `GET /api/v1/tenants/me/stats` - Dashboard statistics
- `POST /api/v1/tenants/me/sync` - Trigger data sync
- `GET /api/v1/tenants/me/sync-status` - Recent sync jobs
- `GET /api/v1/tenants/me/sync/:syncRunId/status` - Real-time sync progress
- `GET /api/v1/tenants/me/sync/active` - Active syncs

### Customers
- `GET /api/v1/customers` - List customers with filters
- `GET /api/v1/customers/:id` - Customer details
- `GET /api/v1/customers/:id/timeline` - Customer activity timeline

### Orders
- `GET /api/v1/orders` - List orders with filters
- `GET /api/v1/orders/:id` - Order details

### Segments
- `GET /api/v1/segments` - List segments
- `POST /api/v1/segments` - Create segment
- `GET /api/v1/segments/:id` - Segment details
- `PUT /api/v1/segments/:id` - Update segment
- `DELETE /api/v1/segments/:id` - Delete segment
- `GET /api/v1/segments/:id/members` - Segment members
- `POST /api/v1/segments/:id/refresh` - Refresh segment

### Analytics
- `GET /api/v1/analytics/rfm` - RFM distribution
- `GET /api/v1/analytics/cohorts` - Cohort analysis
- `GET /api/v1/analytics/churn` - Churn prediction

### Webhooks
- `POST /webhooks/customers/create` - Customer created
- `POST /webhooks/customers/update` - Customer updated
- `POST /webhooks/orders/create` - Order created
- `POST /webhooks/orders/updated` - Order updated

## 🔌 WebSocket Events

### Client → Server
- `sync:subscribe` - Subscribe to sync progress
- `sync:unsubscribe` - Unsubscribe from sync
- `sync:status` - Request current status

### Server → Client
- `sync:active` - List of active syncs on connect
- `sync:progress` - Progress update
- `sync:update` - Tenant-wide sync notification
- `sync:completed` - Sync finished successfully
- `sync:failed` - Sync failed
- `sync:error` - Error message

## 📸 Screenshots

### Dashboard Overview
![Dashboard](./docs/images/dashboard.png)
*Real-time metrics, revenue trends, and customer insights*

### RFM Segmentation
![RFM Analysis](./docs/images/rfm-segmentation.png)
*Customer segmentation based on Recency, Frequency, and Monetary value*

### Customer Profile
![Customer Details](./docs/images/customer-profile.png)
*Detailed customer view with purchase history and timeline*

### Segment Builder
![Segment Builder](./docs/images/segment-builder.png)
*Visual rule builder for creating dynamic customer segments*

### Real-Time Sync
![Sync Progress](./docs/images/sync-progress.png)
*Live progress tracking during Shopify data synchronization*

### Analytics Dashboard
![Analytics](./docs/images/analytics.png)
*Cohort analysis, churn prediction, and lifetime value metrics*

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in dev mode |
| `pnpm dev:server` | Start backend API only |
| `pnpm dev:worker` | Start background worker only |
| `pnpm dev:client` | Start frontend only |
| `pnpm build` | Build both frontend and backend |
| `pnpm build:server` | Build backend only |
| `pnpm build:client` | Build frontend only |
| `pnpm start` | Start production servers |
| `pnpm lint` | Run ESLint on all files |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm test` | Run test suite |
| `pnpm test:watch` | Run tests in watch mode |

## 🚢 Deployment

### Live Deployment

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | [xsight-frontend-production.up.railway.app](https://xsight-frontend-production.up.railway.app) | ✅ Live |
| **Backend API** | [xsight-production.up.railway.app](https://xsight-production.up.railway.app) | ✅ Live |
| **Health Check** | [/health](https://xsight-production.up.railway.app/health) | ✅ Healthy |

![Deployment Architecture](./docs/images/deployment-architecture.png)
*Railway deployment with PostgreSQL, Redis (Upstash), and Shopify integration*

### Prerequisites
- Domain name with SSL certificate (optional, Railway provides free domains)
- PostgreSQL database (Railway, Supabase, or Neon recommended)
- Redis instance (Upstash recommended)
- Shopify Partner account with app created

### Backend Deployment (Railway)

1. **Create Railway Project**
   ```bash
   railway init
   ```

2. **Add PostgreSQL Service**
   - Click "New Service" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL` automatically

3. **Add Redis Service**
   - Use Upstash Redis (recommended)
   - Or add Redis plugin in Railway
   - Copy `REDIS_URL` to environment variables

4. **Configure Environment Variables**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=<your-upstash-redis-url>
   SHOPIFY_API_KEY=<from-partner-dashboard>
   SHOPIFY_API_SECRET=<from-partner-dashboard>
   SHOPIFY_APP_URL=https://your-backend-domain.railway.app
   JWT_SECRET=<generated-secret>
   ENCRYPTION_KEY=<generated-key>
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Run Migrations**
   ```bash
   railway run pnpm prisma migrate deploy
   ```

### Frontend Deployment (Vercel)

1. **Import Repository**
   - Go to Vercel Dashboard
   - Import your Git repository
   - Select "Next.js" as framework preset

2. **Configure Build Settings**
   - **Build Command**: `pnpm build:client`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`
   - **Root Directory**: Leave blank

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
   NEXT_PUBLIC_SHOPIFY_API_KEY=<from-partner-dashboard>
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Shopify App Configuration

1. **Update App URLs in Partner Dashboard**
   - **App URL**: `https://your-backend-domain.railway.app`
   - **Allowed redirection URL(s)**: 
     - `https://your-backend-domain.railway.app/auth/callback`
     - `https://your-frontend-domain.vercel.app`

2. **Configure API Scopes**
   ```
   read_customers,read_orders,read_products,read_content,read_themes
   ```

3. **Set Webhook URLs**
   - **Customers Create**: `https://your-backend-domain.railway.app/webhooks/customers/create`
   - **Customers Update**: `https://your-backend-domain.railway.app/webhooks/customers/update`
   - **Orders Create**: `https://your-backend-domain.railway.app/webhooks/orders/create`
   - **Orders Update**: `https://your-backend-domain.railway.app/webhooks/orders/updated`

4. **GDPR Webhooks**
   - **Customers Data Request**: `https://your-backend-domain.railway.app/webhooks/customers/data_request`
   - **Customers Redact**: `https://your-backend-domain.railway.app/webhooks/customers/redact`
   - **Shop Redact**: `https://your-backend-domain.railway.app/webhooks/shop/redact`

### Alternative Hosting Options

#### Backend
- **Render**: Similar to Railway, good PostgreSQL support
- **Fly.io**: Good for global deployment, built-in Redis
- **AWS EC2**: Full control, requires more setup

#### Frontend
- **Netlify**: Alternative to Vercel, similar features
- **Cloudflare Pages**: Fast edge deployment
- **AWS Amplify**: Integrated with AWS services

### Post-Deployment Checklist

- [ ] Backend health check responds: `GET /health`
- [ ] Frontend loads without errors
- [ ] Shopify OAuth flow completes successfully
- [ ] Database migrations applied
- [ ] Redis connection working (check worker logs)
- [ ] WebSocket connections establish properly
- [ ] Webhooks receive and process events
- [ ] SSL certificates valid on all domains
- [ ] Environment variables set correctly
- [ ] Logs configured (Sentry recommended)

## 🔧 Troubleshooting

### WebSocket Connection Fails

**Problem**: Frontend shows "WebSocket disconnected"

**Solutions**:
1. Check `FRONTEND_URL` includes correct origin
2. Ensure cookies are sent with `credentials: 'include'`
3. Verify JWT_SECRET matches between services
4. Check CORS configuration in `server/index.ts`

### Sync Jobs Stuck

**Problem**: Sync jobs don't complete

**Solutions**:
1. Check worker is running: `pnpm dev:worker`
2. Verify Redis connection: `redis-cli ping`
3. Check BullMQ dashboard: `http://localhost:3000/admin/queues`
4. Review worker logs for errors

### Database Connection Issues

**Problem**: `Prisma.PrismaClientInitializationError`

**Solutions**:
1. Verify `DATABASE_URL` format
2. Check PostgreSQL is running
3. Ensure migrations applied: `pnpm prisma migrate deploy`
4. Test connection: `pnpm prisma db push --skip-generate`

### Shopify OAuth Errors

**Problem**: "Invalid redirect_uri" or "Invalid HMAC"

**Solutions**:
1. Update redirect URLs in Partner Dashboard
2. Verify `SHOPIFY_APP_URL` matches dashboard
3. Check `SHOPIFY_API_SECRET` is correct
4. Ensure HTTPS in production

## 📊 Database Schema

![Database Schema](./docs/images/database-schema.png)
*Entity-relationship diagram showing data model and relationships*

### Core Tables

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `tenants` | Store information | One-to-many with all other tables |
| `users` | User accounts | Many-to-one with tenants |
| `customers` | Shopify customers | Many-to-one with tenants, one-to-many with orders |
| `orders` | Customer orders | Many-to-one with customers and tenants |
| `segments` | Customer segments | Many-to-many with customers via `segment_members` |
| `rfm_scores` | RFM calculations | One-to-one with customers |

### Multi-Tenancy Model

Every table includes `tenantId` for complete data isolation:
```prisma
model Customer {
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields
  
  @@index([tenantId])
}
```

---

## 🎯 Key Features Implemented

### ✅ 1. Shopify Store Setup
- [x] Created development store on Shopify Partners
- [x] Added 50+ dummy products across multiple categories
- [x] Generated 100+ test customers with realistic data
- [x] Created 200+ orders with varied dates and amounts

### ✅ 2. Data Ingestion Service
- [x] Shopify OAuth integration with secure token storage
- [x] Admin API integration for customers, orders, products
- [x] Webhook processing for real-time updates
- [x] BullMQ job queue for reliable background processing
- [x] Multi-tenant architecture with complete data isolation
- [x] Incremental sync with cursor-based pagination
- [x] Real-time progress tracking via WebSocket

### ✅ 3. Insights Dashboard
- [x] Email-based authentication with JWT
- [x] Real-time analytics: customers, orders, revenue
- [x] Date range filtering for all metrics
- [x] Top 5 customers by spend
- [x] RFM segmentation visualization
- [x] Cohort analysis charts
- [x] Churn prediction indicators
- [x] Revenue trends and order analytics
- [x] Customer lifetime value calculations

### ✅ 4. Documentation
- [x] Comprehensive README with setup instructions
- [x] Architecture diagram with data flow
- [x] API endpoint documentation
- [x] Database schema visualization
- [x] Deployment guide for Railway
- [x] Security and multi-tenancy documentation

### 🎁 Bonus Features
- [x] **Real-time WebSocket Updates**: Live sync progress with Socket.IO
- [x] **Advanced Segmentation**: Visual rule builder with complex conditions
- [x] **Customer Timeline**: Activity feed showing all interactions
- [x] **Rate Limiting**: Per-tenant API limits with Redis
- [x] **Caching Layer**: Redis caching for frequently accessed data
- [x] **Error Monitoring**: Structured logging with Pino (Sentry-ready)
- [x] **Type Safety**: Full TypeScript coverage front-to-back
- [x] **Modern UI**: shadcn/ui components with Tailwind CSS
- [x] **Responsive Design**: Mobile-friendly dashboard
- [x] **GSAP Animations**: Smooth page transitions and interactions

---

## 🔄 Trade-offs & Future Improvements

### Current Limitations

| Limitation | Reason | Future Solution |
|------------|--------|-----------------|
| Single region deployment | Cost optimization for demo | Multi-region with edge caching |
| Manual segment refresh | Simplicity | Automatic refresh via cron jobs |
| Basic error handling | Time constraints | Retry logic with exponential backoff |
| Limited test coverage | Prioritized features | Full unit + integration test suite |
| No email notifications | External dependency | SendGrid/Postmark integration |

### Next Steps to Productionize

1. **Monitoring & Observability**
   - Full Sentry error tracking
   - DataDog/New Relic APM
   - Custom dashboards for ops metrics

2. **Performance Optimization**
   - Database query optimization with indexes
   - Materialized views for analytics
   - CDN for static assets
   - Redis cluster for high availability

3. **Feature Enhancements**
   - Email campaign builder
   - SMS notifications via Twilio
   - Product recommendation engine
   - A/B testing framework
   - Custom report builder

4. **Enterprise Features**
   - SSO/SAML authentication
   - Role-based access control (RBAC)
   - Audit logs for compliance
   - Data export (CSV, PDF)
   - White-label customization

5. **Testing & Quality**
   - Unit tests (Jest)
   - Integration tests (Supertest)
   - E2E tests (Playwright)
   - Load testing (k6)
   - Security audit (OWASP)

---

## 🛠️ Technology Choices & Rationale

### Why Next.js 14?
- **App Router**: Modern routing with server components
- **SSR**: Better SEO and initial load performance
- **Built-in API**: Simpler deployment without separate hosting
- **TypeScript**: Native support without configuration

### Why Express.js?
- **Flexibility**: Full control over middleware and routing
- **Ecosystem**: Rich library support for Shopify, Redis, etc.
- **WebSocket**: Easy Socket.IO integration
- **Familiarity**: Industry standard for Node.js backends

### Why Prisma?
- **Type Safety**: Generated types from schema
- **Migrations**: Automatic migration generation
- **Multi-tenancy**: Easy filtering by tenantId
- **Developer Experience**: Excellent autocomplete and errors

### Why BullMQ?
- **Reliability**: Redis-backed persistence
- **Retry Logic**: Automatic retries with exponential backoff
- **Concurrency**: Process multiple jobs in parallel
- **Monitoring**: Built-in dashboard for job inspection

### Why Redis?
- **Speed**: Sub-millisecond latency for caching
- **Pub/Sub**: Real-time progress broadcasting
- **Rate Limiting**: Token bucket algorithm
- **Session Store**: Fast session lookups

---

## 📚 Additional Documentation

- **[API Documentation](./docs/api-documentation.md)**: Comprehensive API reference
- **[Development Issues](./docs/development-issues.md)**: Lessons learned and solutions
- **[Design Decisions](./docs/design-decisions.md)**: Architecture choices and rationale
- **[Task Requirements](./docs/task.md)**: Original internship assignment

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👨‍💻 Author

**[Your Name]**
- GitHub: [@Nimboo3](https://github.com/Nimboo3)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/your-profile)
- Email: your.email@example.com

> Built for **Xeno FDE Internship Assignment 2025**

---

## 🙏 Acknowledgments

- **Xeno Team**: For the challenging and realistic assignment
- **Shopify**: Excellent API documentation and developer tools
- **Next.js Team**: Outstanding framework and DX
- **Prisma Team**: Best ORM for TypeScript
- **shadcn/ui**: Beautiful accessible components
- **Open Source Community**: For the amazing tools and libraries

---

## 📞 Support & Questions

If you have questions about this project:

1. Check the [documentation](./docs)
2. Review [common issues](./docs/development-issues.md)
3. Open an issue on GitHub
4. Contact me directly

---

## 🎯 Assignment Completion Checklist

### Core Requirements
- [x] ✅ Shopify development store with test data
- [x] ✅ Data ingestion service (customers, orders, products)
- [x] ✅ Multi-tenant architecture with data isolation
- [x] ✅ PostgreSQL database with Prisma ORM
- [x] ✅ Insights dashboard with authentication
- [x] ✅ Total customers, orders, revenue metrics
- [x] ✅ Orders by date with filtering
- [x] ✅ Top 5 customers by spend
- [x] ✅ Additional metrics and trends
- [x] ✅ Deployed to Railway + Railway
- [x] ✅ Scheduler for data sync (cron jobs)
- [x] ✅ Webhooks for real-time updates
- [x] ✅ Comprehensive documentation (README + docs/)
- [x] ✅ Architecture diagram
- [x] ✅ API and data model documentation
- [x] ✅ Next steps for productionization

### Bonus Features
- [x] ✅ Real-time WebSocket progress tracking
- [x] ✅ Advanced RFM segmentation
- [x] ✅ Custom segment builder
- [x] ✅ Redis caching and rate limiting
- [x] ✅ Full TypeScript coverage
- [x] ✅ Modern UI with animations
- [x] ✅ Cohort analysis
- [x] ✅ Churn prediction

### Documentation
- [x] ✅ Public GitHub repository
- [x] ✅ Clean, well-structured code
- [x] ✅ README with setup instructions
- [x] ✅ Architecture diagram
- [x] ✅ API documentation
- [x] ✅ Database schema
- [x] ✅ Known limitations and assumptions
- [ ] ⏳ Demo video (7 minutes)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

<div align="center">

**Made with ❤️ for Xeno FDE Internship 2025**

![Footer Banner](./docs/images/footer-banner.png)

[🚀 Live Demo](https://xsight-frontend-production.up.railway.app) • [📖 Documentation](./docs) • [🎥 Video Demo](_YOUR_VIDEO_LINK_)

</div>
