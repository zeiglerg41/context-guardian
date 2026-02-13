# CLAUDE START HERE - API Server

## What This Package Is

The **API Server** is the backend that receives dependency analysis from the CLI, queries the PostgreSQL database for version-specific best practices, caches results in Redis, and returns formatted playbooks.

## Why This Matters

This is the **intelligence layer** of Context Guardian. Without this API, the CLI can't get version-aware best practices. **Performance and reliability are critical** - slow responses kill developer UX.

## Your Mission

Set up the API server locally, connect to mock/test databases, test the `/generate-playbook` endpoint, and verify caching works correctly.

---

## Development Setup Checklist

### Phase 1: Environment Setup

- [ ] **Ensure Node.js is installed** (v18 or higher)
  ```bash
  node --version
  ```

- [ ] **Navigate to the API server directory**
  ```bash
  cd ~/api-server
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  ```
  - Should install Hono, postgres.js, ioredis, Zod
  - No errors should occur

- [ ] **Copy environment template**
  ```bash
  cp .env.example .env
  ```

- [ ] **Configure environment variables**
  - For local development, you can use mock values or set up local PostgreSQL/Redis
  - Minimum required for testing:
    ```bash
    PORT=3000
    NODE_ENV=development
    DATABASE_URL=postgresql://localhost:5432/context_guardian
    REDIS_URL=redis://localhost:6379
    ```

### Phase 2: Database Setup (Optional for MVP Testing)

**Note**: For initial testing, you can skip database setup and modify the code to return mock data.

- [ ] **Option A: Use local PostgreSQL** (if installed)
  ```bash
  createdb context_guardian
  ```

- [ ] **Option B: Use Supabase** (recommended)
  - Sign up at https://supabase.com
  - Create a new project
  - Copy the connection string to `.env`

- [ ] **Option C: Mock the database** (fastest for testing)
  - Modify `src/services/playbook-service.ts` to return mock rules
  - Skip database connection in `src/index.ts`

### Phase 3: Redis Setup (Optional for MVP Testing)

- [ ] **Option A: Use local Redis** (if installed)
  ```bash
  redis-server
  ```

- [ ] **Option B: Use Upstash** (recommended)
  - Sign up at https://upstash.com
  - Create a Redis database
  - Copy the connection string to `.env`

- [ ] **Option C: Disable caching** (fastest for testing)
  - Modify `src/db/cache.ts` to use in-memory cache
  - Or skip cache initialization in `src/index.ts`

### Phase 4: Build & Run

- [ ] **Compile TypeScript**
  ```bash
  npm run build
  ```
  - Should create `dist/` directory
  - No compilation errors

- [ ] **Run in development mode**
  ```bash
  npm run dev
  ```
  - Should start server on port 3000
  - Should show:
    ```
    ✓ Database connected
    ✓ Redis connected
    🚀 Context Guardian API starting on port 3000...
    ✓ Server running at http://localhost:3000
    ```

- [ ] **Verify server is running**
  ```bash
  curl http://localhost:3000
  ```
  - Should return JSON with API info

### Phase 5: Test Endpoints

- [ ] **Test health check**
  ```bash
  curl http://localhost:3000/health
  ```
  - Should return:
    ```json
    {
      "status": "ok",
      "database": "connected",
      "cache": "connected",
      "timestamp": "..."
    }
    ```

- [ ] **Test generate-playbook endpoint** (without auth)
  ```bash
  curl -X POST http://localhost:3000/api/v1/generate-playbook \
    -H "Content-Type: application/json" \
    -d '{
      "packageManager": "npm",
      "dependencies": [
        { "name": "react", "version": "18.2.0" }
      ]
    }'
  ```
  - Should return playbook response with rules array

- [ ] **Test with API key** (if configured)
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

- [ ] **Test validation** (send invalid request)
  ```bash
  curl -X POST http://localhost:3000/api/v1/generate-playbook \
    -H "Content-Type: application/json" \
    -d '{ "invalid": "data" }'
  ```
  - Should return 400 error with validation details

### Phase 6: Test Caching

- [ ] **Make the same request twice**
  ```bash
  # First request (cache miss)
  curl -X POST http://localhost:3000/api/v1/generate-playbook \
    -H "Content-Type: application/json" \
    -d '{
      "packageManager": "npm",
      "dependencies": [{ "name": "react", "version": "18.2.0" }]
    }'
  
  # Second request (cache hit)
  curl -X POST http://localhost:3000/api/v1/generate-playbook \
    -H "Content-Type: application/json" \
    -d '{
      "packageManager": "npm",
      "dependencies": [{ "name": "react", "version": "18.2.0" }]
    }'
  ```
  - Second response should have `"cacheHit": true`
  - Second response should be faster (<50ms)

### Phase 7: Run Tests

- [ ] **Run the test suite**
  ```bash
  npm test
  ```
  - Tests should pass (or skip if mocking is needed)

### Phase 8: Code Quality & Understanding

- [ ] **Read the main entry point** (`src/index.ts`)
  - How is the server initialized?
  - How are database and cache connected?
  - What middleware is used?

- [ ] **Review the playbook service** (`src/services/playbook-service.ts`)
  - How does it query the database?
  - How does it generate cache keys?
  - How does it handle errors?

- [ ] **Review the API routes** (`src/routes/api.ts`)
  - How is validation applied?
  - How is authentication handled?
  - What's the request/response flow?

- [ ] **Review middleware**
  - `validation.ts` - How does Zod validation work?
  - `auth.ts` - How is the API key checked?
  - `error-handler.ts` - How are errors formatted?

- [ ] **Understand the database client** (`src/db/connection.ts`)
  - How is postgres.js configured?
  - What's the connection pool size?
  - How is health checking done?

- [ ] **Understand the cache client** (`src/db/cache.ts`)
  - How is ioredis configured?
  - What's the default TTL?
  - How are errors handled?

### Phase 9: Deployment Readiness

- [ ] **Review Dockerfile**
  - Understand the build process
  - Note the health check configuration

- [ ] **Review fly.toml**
  - Understand Fly.io configuration
  - Note the machine specs (1 CPU, 512MB RAM)

- [ ] **Review railway.json**
  - Understand Railway configuration
  - Note the health check path

- [ ] **Test Docker build** (optional)
  ```bash
  docker build -t context-guardian-api .
  docker run -p 3000:3000 --env-file .env context-guardian-api
  ```

### Phase 10: Understand the Bigger Picture

- [ ] **Read the README.md** in this directory
  - Understand how this fits into Context Guardian
  - Note the performance benchmarks

- [ ] **Review the architecture docs**
  - Read `/home/ubuntu/phase-0_planning/product_architecture.md` (section 4: Cloud Services)
  - This is the "API Server" component

- [ ] **Understand the integration**
  - CLI sends analysis payload to this API
  - API queries database for version-specific rules
  - API caches response in Redis
  - API returns playbook to CLI
  - CLI generates `.guardian.md` file

---

## Success Criteria

You're done when:
1. ✅ Server starts without errors
2. ✅ Health check endpoint returns "ok"
3. ✅ Generate-playbook endpoint returns valid response
4. ✅ Caching works (second request is faster)
5. ✅ You understand the request/response flow

---

## Common Issues & Solutions

**Issue**: Database connection fails  
**Solution**: Check `DATABASE_URL` in `.env`. For testing, modify code to return mock data.

**Issue**: Redis connection fails  
**Solution**: Check `REDIS_URL` in `.env`. For testing, disable caching or use in-memory cache.

**Issue**: TypeScript compilation errors  
**Solution**: Ensure `tsconfig.json` uses `"module": "ESNext"` and `"moduleResolution": "bundler"`.

**Issue**: Port 3000 already in use  
**Solution**: Change `PORT` in `.env` or kill the process using port 3000.

**Issue**: Validation errors on valid requests  
**Solution**: Check Zod schema in `src/middleware/validation.ts`. Ensure request matches schema.

---

## Next Steps

After completing this module:
- **Option A**: Integrate with CLI (CLI calls this API)
- **Option B**: Populate database with seed data (Package #1)
- **Option C**: Deploy to Fly.io/Railway

---

## Reference Files

- **Main entry**: `src/index.ts`
- **API routes**: `src/routes/api.ts`
- **Playbook service**: `src/services/playbook-service.ts`
- **Database client**: `src/db/connection.ts`
- **Cache client**: `src/db/cache.ts`
- **Middleware**: `src/middleware/*.ts`
- **Tests**: `tests/*.test.ts`
- **Context**: `/home/ubuntu/phase-0_planning/product_architecture.md`

---

**When all checkboxes are complete, you're ready for deployment or integration.**
