# Context Guardian API Server

## What This Is

The **API Server** is the backend service that receives dependency manifests from the CLI, queries the PostgreSQL database for version-specific best practices, caches results in Redis, and returns formatted playbooks.

## How It Fits Into The Bigger Picture

Context Guardian's architecture:

1. **CLI** → Sends analysis payload (dependencies + patterns)
2. **API Server** (this package) → Receives payload, queries database
3. **PostgreSQL** → Stores best practices by library and version
4. **Redis** → Caches playbook responses (24hr TTL)
5. **API Server** → Returns playbook to CLI
6. **CLI** → Generates `.guardian.md` file

**This is the intelligence layer.** It knows which rules apply to which versions and serves them fast via caching.

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Web Framework** | Hono | Lightweight, fast, modern API framework |
| **Database** | PostgreSQL (via Supabase) | Relational data, version queries |
| **Cache** | Redis (via Upstash) | Fast response times, reduces DB load |
| **Validation** | Zod | Type-safe request validation |
| **Deployment** | Fly.io / Railway | Always-on, low latency, $5/month |

## API Endpoints

### POST /api/v1/generate-playbook

Generates a best practices playbook based on project dependencies.

**Request:**
```json
{
  "packageManager": "npm",
  "dependencies": [
    { "name": "react", "version": "18.2.0", "isDev": false },
    { "name": "typescript", "version": "5.0.0", "isDev": true }
  ],
  "patterns": {
    "stateManagement": "zustand",
    "componentStyle": "functional",
    "frameworks": ["react", "next"],
    "commonImports": ["./hooks/useAuth"],
    "patterns": {
      "usesHooks": true,
      "usesAsync": true,
      "usesTypeScript": true,
      "usesJSX": true
    }
  }
}
```

**Response:**
```json
{
  "rules": [
    {
      "id": 1,
      "library_id": 1,
      "type": "best_practice",
      "title": "Use hooks in React 18+",
      "description": "Prefer functional components with hooks over class components.",
      "category": "best-practice",
      "severity": "medium",
      "code_example": "const [state, setState] = useState(0);",
      "source_url": "https://react.dev/reference/react",
      "min_version": "16.8.0",
      "max_version": null
    }
  ],
  "generatedAt": "2026-02-11T01:00:00.000Z",
  "cacheHit": false
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "cache": "connected",
  "timestamp": "2026-02-11T01:00:00.000Z"
}
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string (from Supabase)
- `REDIS_URL` - Redis connection string (from Upstash)
- `PORT` - Server port (default: 3000)
- `API_KEY` - Optional API key for authentication

## Development

### Run locally

```bash
npm run dev
```

Server will start at `http://localhost:3000` with hot reload.

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Test the API

```bash
curl -X POST http://localhost:3000/api/v1/generate-playbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "packageManager": "npm",
    "dependencies": [
      { "name": "react", "version": "18.2.0" }
    ]
  }'
```

## Deployment

### Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `flyctl auth login`
3. Create app: `flyctl launch`
4. Set secrets:
   ```bash
   flyctl secrets set DATABASE_URL=your-db-url
   flyctl secrets set REDIS_URL=your-redis-url
   flyctl secrets set API_KEY=your-api-key
   ```
5. Deploy: `flyctl deploy`

Or use the deployment script:
```bash
./scripts/deploy-fly.sh
```

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Set variables in Railway dashboard
5. Deploy: `railway up`

## Project Structure

```
api-server/
├── src/
│   ├── index.ts                  # Main server entry point
│   ├── types.ts                  # TypeScript types
│   ├── routes/
│   │   └── api.ts                # API route handlers
│   ├── services/
│   │   └── playbook-service.ts   # Business logic
│   ├── db/
│   │   ├── connection.ts         # PostgreSQL client
│   │   └── cache.ts              # Redis client
│   └── middleware/
│       ├── validation.ts         # Request validation
│       ├── auth.ts               # API key auth
│       └── error-handler.ts      # Global error handler
├── tests/
│   └── playbook-service.test.ts
├── scripts/
│   └── deploy-fly.sh             # Deployment script
├── Dockerfile                     # Container image
├── fly.toml                       # Fly.io config
├── railway.json                   # Railway config
└── package.json
```

## Key Design Decisions

### 1. Hono Over Express

**Why Hono?**
- **Lightweight**: 10x smaller than Express
- **Fast**: Built for modern JavaScript runtimes
- **Type-safe**: First-class TypeScript support
- **Edge-ready**: Works on Cloudflare Workers, Deno, Bun

### 2. postgres.js Over pg

**Why postgres.js?**
- **Faster**: Better performance than `pg`
- **Modern**: Uses async/await, no callbacks
- **Tagged templates**: SQL`` syntax prevents injection
- **Connection pooling**: Built-in

### 3. ioredis Over node-redis

**Why ioredis?**
- **More stable**: Battle-tested in production
- **Better TypeScript support**
- **Cluster support**: Ready for scaling
- **Pipelining**: Batch operations

### 4. Zod for Validation

**Why Zod?**
- **Type-safe**: TypeScript types inferred from schemas
- **Composable**: Easy to build complex validations
- **Error messages**: Clear, actionable errors

### 5. Always-On Server (Fly.io/Railway) Over Serverless

**Why not Vercel/Lambda?**
- **Cold starts kill UX**: CLI needs <100ms response
- **Connection pooling**: Database connections are expensive
- **Caching**: Redis requires persistent connection

**Cost**: $5/month for always-on server vs $0-20/month for serverless (depending on traffic).

## Performance

- **Cache hit**: <50ms
- **Cache miss**: 200-500ms (database query)
- **Concurrent requests**: 100+ req/s on 512MB RAM

## Security

- **API key authentication**: Optional, for production
- **Input validation**: Zod schemas prevent injection
- **SQL injection protection**: Tagged templates
- **CORS**: Configurable origins
- **Rate limiting**: TODO (add in production)

## Monitoring

- **Health checks**: `/health` endpoint
- **Logs**: Structured JSON logs (stdout)
- **Metrics**: TODO (add Prometheus/Grafana)

## Reference Documentation

For full context on the project architecture and strategy, see:
- `/home/ubuntu/phase-0_planning/context_guardian_project_plan.md`
- `/home/ubuntu/phase-0_planning/product_architecture.md`

## Next Steps

See `CLAUDE_START-HERE.md` for development setup instructions.
