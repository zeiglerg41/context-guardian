import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../data/offline-fallback.db');

interface LibraryRow {
  id: string;
  name: string;
  ecosystem: string;
  official_docs_url: string;
  repository_url: string;
  description: string;
}

function seedGoData() {
  console.log('🔄 Seeding Go ecosystem data into SQLite...\n');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const now = new Date().toISOString();

  // --- Libraries ---
  const libraries: LibraryRow[] = [
    { id: crypto.randomUUID(), name: 'github.com/gin-gonic/gin', ecosystem: 'go', official_docs_url: 'https://gin-gonic.com', repository_url: 'https://github.com/gin-gonic/gin', description: 'High-performance HTTP web framework for Go' },
    { id: crypto.randomUUID(), name: 'github.com/gorilla/mux', ecosystem: 'go', official_docs_url: 'https://pkg.go.dev/github.com/gorilla/mux', repository_url: 'https://github.com/gorilla/mux', description: 'Powerful HTTP router and URL matcher for Go' },
    { id: crypto.randomUUID(), name: 'github.com/gorilla/websocket', ecosystem: 'go', official_docs_url: 'https://pkg.go.dev/github.com/gorilla/websocket', repository_url: 'https://github.com/gorilla/websocket', description: 'WebSocket implementation for Go' },
    { id: crypto.randomUUID(), name: 'github.com/jackc/pgx/v5', ecosystem: 'go', official_docs_url: 'https://pkg.go.dev/github.com/jackc/pgx/v5', repository_url: 'https://github.com/jackc/pgx', description: 'PostgreSQL driver and toolkit for Go' },
    { id: crypto.randomUUID(), name: 'github.com/redis/go-redis/v9', ecosystem: 'go', official_docs_url: 'https://redis.io/docs/latest/develop/clients/go/', repository_url: 'https://github.com/redis/go-redis', description: 'Redis client for Go' },
    { id: crypto.randomUUID(), name: 'github.com/go-redis/redis/v8', ecosystem: 'go', official_docs_url: 'https://redis.io/docs/latest/develop/clients/go/', repository_url: 'https://github.com/redis/go-redis', description: 'Redis client for Go (legacy import path, v8)' },
    { id: crypto.randomUUID(), name: 'github.com/go-redis/redis/v7', ecosystem: 'go', official_docs_url: 'https://redis.io/docs/latest/develop/clients/go/', repository_url: 'https://github.com/redis/go-redis', description: 'Redis client for Go (legacy import path, v7)' },
    { id: crypto.randomUUID(), name: 'github.com/rs/zerolog', ecosystem: 'go', official_docs_url: 'https://github.com/rs/zerolog', repository_url: 'https://github.com/rs/zerolog', description: 'Zero-allocation structured JSON logger for Go' },
    { id: crypto.randomUUID(), name: 'go.uber.org/zap', ecosystem: 'go', official_docs_url: 'https://pkg.go.dev/go.uber.org/zap', repository_url: 'https://github.com/uber-go/zap', description: 'Blazing-fast structured logger for Go' },
    { id: crypto.randomUUID(), name: 'github.com/prometheus/client_golang', ecosystem: 'go', official_docs_url: 'https://pkg.go.dev/github.com/prometheus/client_golang', repository_url: 'https://github.com/prometheus/client_golang', description: 'Prometheus instrumentation library for Go' },
  ];

  const insertLib = db.prepare(`
    INSERT OR IGNORE INTO libraries (id, name, ecosystem, official_docs_url, repository_url, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBP = db.prepare(`
    INSERT OR IGNORE INTO best_practices (id, library_id, title, description, category, severity, version_range, code_example, source_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAP = db.prepare(`
    INSERT OR IGNORE INTO anti_patterns (id, library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSA = db.prepare(`
    INSERT OR IGNORE INTO security_advisories (id, library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Helper to get library ID by name (after insertion, re-fetch to handle OR IGNORE)
  function getLibId(name: string): string {
    const row = db.prepare('SELECT id FROM libraries WHERE name = ?').get(name) as { id: string } | undefined;
    if (!row) throw new Error(`Library not found: ${name}`);
    return row.id;
  }

  const transaction = db.transaction(() => {
    // Insert libraries
    for (const lib of libraries) {
      insertLib.run(lib.id, lib.name, lib.ecosystem, lib.official_docs_url, lib.repository_url, lib.description, now, now);
    }
    console.log(`✓ Inserted ${libraries.length} Go libraries`);

    // Resolve IDs (may differ if libs already existed)
    const gin = getLibId('github.com/gin-gonic/gin');
    const mux = getLibId('github.com/gorilla/mux');
    const ws = getLibId('github.com/gorilla/websocket');
    const pgx = getLibId('github.com/jackc/pgx/v5');
    const redis = getLibId('github.com/redis/go-redis/v9');
    const redisOldV8 = getLibId('github.com/go-redis/redis/v8');
    const redisOldV7 = getLibId('github.com/go-redis/redis/v7');
    const zerolog = getLibId('github.com/rs/zerolog');
    const zap = getLibId('go.uber.org/zap');
    const prom = getLibId('github.com/prometheus/client_golang');

    // ====================================================================
    // BEST PRACTICES (22 total)
    // ====================================================================

    // --- gin (3) ---
    insertBP.run(crypto.randomUUID(), gin, 'Use ShouldBind instead of Bind for request binding',
      'ShouldBind returns an error that you can handle, while Bind automatically returns a 400 response on error, removing control from your handler. ShouldBind lets you customize error responses and logging.',
      'best-practice', 'medium', '>=1.4.0',
      `// ❌ Bind writes 400 automatically on failure
if err := c.Bind(&req); err != nil {
  return // 400 already sent, can't customize
}

// ✅ ShouldBind lets you handle errors
if err := c.ShouldBindJSON(&req); err != nil {
  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  return
}`,
      'https://gin-gonic.com/docs/examples/binding-and-validation/', now, now);

    insertBP.run(crypto.randomUUID(), gin, 'Set TrustedPlatform or TrustedProxies for client IP detection',
      'By default, Gin trusts all proxies which can lead to IP spoofing. Configure TrustedProxies or TrustedPlatform to ensure accurate client IP resolution behind reverse proxies.',
      'security', 'high', '>=1.7.0',
      `// ✅ Set trusted proxies explicitly
router := gin.Default()
router.SetTrustedProxies([]string{"10.0.0.0/8"})

// Or use TrustedPlatform for cloud providers
router.TrustedPlatform = gin.PlatformCloudflare`,
      'https://pkg.go.dev/github.com/gin-gonic/gin#readme-don-t-trust-all-proxies', now, now);

    insertBP.run(crypto.randomUUID(), gin, 'Apply middleware selectively per route group',
      'Instead of applying all middleware globally, use route groups to apply middleware only where needed. This improves performance and avoids unnecessary processing on routes like health checks.',
      'performance', 'medium', '>=1.0.0',
      `router := gin.New()
router.Use(gin.Logger()) // global

// Auth middleware only on protected routes
api := router.Group("/api")
api.Use(authMiddleware())
{
  api.GET("/users", listUsers)
}

// No auth needed
router.GET("/health", healthCheck)`,
      'https://gin-gonic.com/docs/examples/grouping-routes/', now, now);

    // --- gorilla/mux (2) ---
    insertBP.run(crypto.randomUUID(), mux, 'Use r.Walk to verify registered routes at startup',
      'Call Router.Walk() at startup to log all registered routes. This helps catch missing or misconfigured routes before they cause 404s in production.',
      'best-practice', 'low', '>=1.6.0',
      `err := r.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
  tpl, _ := route.GetPathTemplate()
  methods, _ := route.GetMethods()
  log.Printf("Route: %s %v", tpl, methods)
  return nil
})
if err != nil {
  log.Fatal(err)
}`,
      'https://pkg.go.dev/github.com/gorilla/mux#Router.Walk', now, now);

    insertBP.run(crypto.randomUUID(), mux, 'Always set server timeouts with gorilla/mux',
      'gorilla/mux is just a router — it does not set any HTTP server timeouts. You must configure ReadTimeout, WriteTimeout, and IdleTimeout on the http.Server to prevent slowloris and resource exhaustion attacks.',
      'security', 'high', '>=1.0.0',
      `// ❌ No timeouts — vulnerable to slowloris
http.ListenAndServe(":8080", router)

// ✅ Set explicit timeouts
srv := &http.Server{
  Handler:      router,
  Addr:         ":8080",
  ReadTimeout:  15 * time.Second,
  WriteTimeout: 15 * time.Second,
  IdleTimeout:  60 * time.Second,
}`,
      'https://pkg.go.dev/net/http#Server', now, now);

    // --- gorilla/websocket (2) ---
    insertBP.run(crypto.randomUUID(), ws, 'Synchronize concurrent writes with a mutex or channel',
      'The WebSocket connection does not support concurrent writers. All calls to WriteMessage, WriteJSON, or NextWriter must be serialized, or you will get corrupted frames.',
      'best-practice', 'high', '>=1.0.0',
      `type SafeConn struct {
  conn *websocket.Conn
  mu   sync.Mutex
}

func (c *SafeConn) WriteJSON(v interface{}) error {
  c.mu.Lock()
  defer c.mu.Unlock()
  return c.conn.WriteJSON(v)
}`,
      'https://pkg.go.dev/github.com/gorilla/websocket#hdr-Concurrency', now, now);

    insertBP.run(crypto.randomUUID(), ws, 'Implement ping/pong with read deadlines',
      'Set a read deadline and handle Pong messages to detect dead connections. Without this, a dropped client can hold a connection open indefinitely, leaking server resources.',
      'best-practice', 'high', '>=1.0.0',
      `conn.SetReadDeadline(time.Now().Add(60 * time.Second))
conn.SetPongHandler(func(string) error {
  conn.SetReadDeadline(time.Now().Add(60 * time.Second))
  return nil
})

// In a separate goroutine, send pings
ticker := time.NewTicker(54 * time.Second)
for range ticker.C {
  if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
    return
  }
}`,
      'https://pkg.go.dev/github.com/gorilla/websocket#hdr-Control_Messages', now, now);

    // --- pgx/v5 (3) ---
    insertBP.run(crypto.randomUUID(), pgx, 'Use pgxpool for connection pooling instead of pgx.Connect',
      'pgx.Connect creates a single connection with no pooling. In web applications, use pgxpool.New to get a connection pool that handles concurrency, reconnection, and idle connection management.',
      'performance', 'high', '>=5.0.0',
      `// ❌ Single connection, no pooling
conn, err := pgx.Connect(ctx, connStr)

// ✅ Connection pool for concurrent use
pool, err := pgxpool.New(ctx, connStr)
if err != nil {
  log.Fatal(err)
}
defer pool.Close()

// Use pool in handlers
rows, err := pool.Query(ctx, "SELECT ...")`,
      'https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool', now, now);

    insertBP.run(crypto.randomUUID(), pgx, 'Use pgx.CollectRows for type-safe row scanning',
      'pgx v5 provides CollectRows and RowToStructByName helpers that reduce boilerplate and prevent common scanning errors like wrong column order.',
      'best-practice', 'medium', '>=5.0.0',
      `type User struct {
  ID   int    \`db:"id"\`
  Name string \`db:"name"\`
}

// ✅ Type-safe collection
users, err := pgx.CollectRows(
  pool.Query(ctx, "SELECT id, name FROM users"),
  pgx.RowToStructByName[User],
)`,
      'https://pkg.go.dev/github.com/jackc/pgx/v5#CollectRows', now, now);

    insertBP.run(crypto.randomUUID(), pgx, 'Call pool.Ping at startup to verify database connectivity',
      'pgxpool.New does not immediately connect to the database. Call pool.Ping(ctx) after creation to verify connectivity and fail fast if the database is unreachable.',
      'best-practice', 'medium', '>=5.0.0',
      `pool, err := pgxpool.New(ctx, connStr)
if err != nil {
  log.Fatal(err)
}

// ✅ Verify connection
if err := pool.Ping(ctx); err != nil {
  log.Fatalf("cannot reach database: %v", err)
}`,
      'https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool#Pool.Ping', now, now);

    // --- go-redis/v9 (2) ---
    insertBP.run(crypto.randomUUID(), redis, 'Use the new github.com/redis/go-redis/v9 import path',
      'Starting with v9, go-redis moved from github.com/go-redis/redis to github.com/redis/go-redis. The old import path is deprecated and will not receive updates.',
      'best-practice', 'high', '>=9.0.0',
      `// ❌ Deprecated import path
import "github.com/go-redis/redis/v8"

// ✅ New canonical import
import "github.com/redis/go-redis/v9"`,
      'https://github.com/redis/go-redis/blob/master/MIGRATION.md', now, now);

    insertBP.run(crypto.randomUUID(), redis, 'Use pipelines for batch operations',
      'Pipeline batches multiple Redis commands into a single round trip, dramatically reducing latency for bulk operations. Use Pipelined() for fire-and-forget or Pipeline() when you need to inspect individual results.',
      'performance', 'medium', '>=9.0.0',
      `// ❌ N round trips
for _, key := range keys {
  rdb.Get(ctx, key)
}

// ✅ Single round trip
cmds, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {
  for _, key := range keys {
    pipe.Get(ctx, key)
  }
  return nil
})`,
      'https://redis.io/docs/latest/develop/clients/go/#pipelines', now, now);

    // --- zerolog (3) ---
    insertBP.run(crypto.randomUUID(), zerolog, 'Use sub-loggers with context fields instead of repeating fields',
      'Create sub-loggers with With() to attach contextual fields like request ID, user ID, or service name. This avoids repeating the same fields on every log call and ensures consistency.',
      'best-practice', 'medium', '>=1.0.0',
      `// ❌ Repeating fields
log.Info().Str("request_id", reqID).Str("user_id", uid).Msg("started")
log.Info().Str("request_id", reqID).Str("user_id", uid).Msg("done")

// ✅ Sub-logger with context
logger := log.With().
  Str("request_id", reqID).
  Str("user_id", uid).
  Logger()
logger.Info().Msg("started")
logger.Info().Msg("done")`,
      'https://github.com/rs/zerolog#sub-loggers-let-you-chain-loggers-with-additional-context', now, now);

    insertBP.run(crypto.randomUUID(), zerolog, 'Always call .Msg() or .Send() to emit log events',
      'Zerolog uses a builder pattern. If you forget to call .Msg("") or .Send() at the end of the chain, the log event is silently discarded and resources are leaked from the internal pool.',
      'best-practice', 'high', '>=1.0.0',
      `// ❌ Event never emitted — silently lost
log.Info().Str("key", "value")

// ✅ Must call Msg or Send
log.Info().Str("key", "value").Msg("operation completed")
log.Info().Str("key", "value").Send() // empty message`,
      'https://github.com/rs/zerolog#leveled-logging', now, now);

    insertBP.run(crypto.randomUUID(), zerolog, 'Use zerolog.Ctx for context-aware logging',
      'Store a logger in context.Context with logger.WithContext(ctx) and retrieve it with zerolog.Ctx(ctx). This integrates structured logging with Go\'s context propagation pattern.',
      'best-practice', 'medium', '>=1.20.0',
      `// Store logger in context
ctx := logger.WithContext(r.Context())

// Retrieve in downstream functions
func processItem(ctx context.Context, item Item) {
  log := zerolog.Ctx(ctx)
  log.Info().Str("item_id", item.ID).Msg("processing")
}`,
      'https://github.com/rs/zerolog#integration-with-context', now, now);

    // --- zap (3) ---
    insertBP.run(crypto.randomUUID(), zap, 'Use zap.Logger for hot paths, SugaredLogger for convenience',
      'zap.Logger (structured) avoids allocations by requiring typed fields. SugaredLogger allows printf-style formatting but allocates. Use Logger in performance-critical code and Sugar where developer convenience matters more.',
      'performance', 'medium', '>=1.0.0',
      `// ✅ Hot path — zero-alloc structured logging
logger.Info("request handled",
  zap.String("method", r.Method),
  zap.Int("status", 200),
  zap.Duration("latency", elapsed),
)

// ✅ Non-hot path — convenient sugar
sugar.Infof("user %s logged in from %s", username, ip)`,
      'https://pkg.go.dev/go.uber.org/zap#hdr-Choosing_a_Logger', now, now);

    insertBP.run(crypto.randomUUID(), zap, 'Defer logger.Sync() in main to flush buffered logs',
      'Zap buffers log entries for performance. Call logger.Sync() before your application exits to ensure all buffered entries are flushed to their destination.',
      'best-practice', 'high', '>=1.0.0',
      `func main() {
  logger, _ := zap.NewProduction()
  defer logger.Sync() // flush before exit

  logger.Info("application started")
  // ...
}`,
      'https://pkg.go.dev/go.uber.org/zap#Logger.Sync', now, now);

    insertBP.run(crypto.randomUUID(), zap, 'Use AtomicLevel to change log level at runtime',
      'zap.AtomicLevel allows you to change the log level without restarting your application. You can expose it as an HTTP handler for operational control.',
      'best-practice', 'medium', '>=1.0.0',
      `atom := zap.NewAtomicLevel()
logger := zap.New(zapcore.NewCore(
  zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
  os.Stdout,
  atom,
))

// Expose HTTP endpoint to change level
http.Handle("/log-level", atom) // PUT {"level":"debug"}`,
      'https://pkg.go.dev/go.uber.org/zap#AtomicLevel', now, now);

    // --- prometheus (2) --- ("Normalize HTTP path labels" removed — covered by unbounded labels anti-pattern)
    insertBP.run(crypto.randomUUID(), prom, 'Use a custom registry instead of the default global registry',
      'The default prometheus.DefaultRegisterer includes Go runtime metrics (go_*) and process metrics (process_*). A custom registry gives you explicit control over what gets exposed.',
      'best-practice', 'medium', '>=1.0.0',
      `// ✅ Custom registry — only your metrics
reg := prometheus.NewRegistry()
reg.MustRegister(
  httpRequests,
  httpDuration,
)

// Use custom registry with handler
http.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))`,
      'https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#NewRegistry', now, now);

    insertBP.run(crypto.randomUUID(), prom, 'Define histogram buckets aligned with SLO targets',
      'Default histogram buckets (.005 to 10s) may not match your SLOs. Define custom buckets that align with your response time targets so you can directly query SLO compliance.',
      'best-practice', 'medium', '>=1.0.0',
      `// ✅ Buckets aligned with SLO (p50=100ms, p99=500ms)
httpDuration := prometheus.NewHistogramVec(
  prometheus.HistogramOpts{
    Name:    "http_request_duration_seconds",
    Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5},
  },
  []string{"handler", "method"},
)`,
      'https://prometheus.io/docs/practices/histograms/', now, now);

    console.log('✓ Inserted 20 best practices');

    // ====================================================================
    // ANTI-PATTERNS (7 total, including 1 for old redis path)
    // ====================================================================

    // --- gin (1) ---
    insertAP.run(crypto.randomUUID(), gin, 'Using gin.Default() in production',
      'gin.Default() includes the Logger and Recovery middleware which may not be suitable for production.',
      'The built-in Logger writes to stdout with its own format, bypassing your structured logging. Recovery catches panics but may expose stack traces. Both add overhead you likely replace anyway.',
      'Use gin.New() and add your own middleware explicitly.',
      'medium', '>=1.0.0',
      `// ❌ Includes default Logger and Recovery
router := gin.Default()`,
      `// ✅ Start clean and add what you need
gin.SetMode(gin.ReleaseMode)
router := gin.New()
router.Use(gin.Recovery()) // keep recovery
router.Use(yourStructuredLogger())`,
      'https://gin-gonic.com/docs/examples/custom-middleware/', now, now);

    // --- gorilla/websocket (1) ---
    insertAP.run(crypto.randomUUID(), ws, 'Setting CheckOrigin to always return true',
      'The Upgrader.CheckOrigin function validates the Origin header during the WebSocket handshake.',
      'Disabling origin checks allows any website to open WebSocket connections to your server, enabling cross-site WebSocket hijacking (CSWSH) attacks.',
      'Validate the Origin header against an allowlist of trusted domains.',
      'high', '>=1.0.0',
      `// ❌ Disables CORS protection
upgrader := websocket.Upgrader{
  CheckOrigin: func(r *http.Request) bool {
    return true
  },
}`,
      `// ✅ Validate origin
upgrader := websocket.Upgrader{
  CheckOrigin: func(r *http.Request) bool {
    origin := r.Header.Get("Origin")
    return origin == "https://myapp.example.com"
  },
}`,
      'https://pkg.go.dev/github.com/gorilla/websocket#Upgrader', now, now);

    // --- pgx/v5 (1) ---
    insertAP.run(crypto.randomUUID(), pgx, 'Using pgx with PgBouncer without QueryExecModeSimpleProtocol',
      'pgx v5 uses the PostgreSQL extended query protocol by default, which is incompatible with PgBouncer in transaction pooling mode.',
      'Prepared statements created by the extended protocol are tied to a specific backend connection. PgBouncer\'s transaction pooling reassigns connections per transaction, causing "prepared statement does not exist" errors.',
      'Set QueryExecMode to QueryExecModeSimpleProtocol when using PgBouncer.',
      'high', '>=5.0.0',
      `// ❌ Fails with PgBouncer in transaction mode
pool, _ := pgxpool.New(ctx, connStr)`,
      `// ✅ Use simple protocol for PgBouncer
config, _ := pgxpool.ParseConfig(connStr)
config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
pool, _ := pgxpool.NewWithConfig(ctx, config)`,
      'https://pkg.go.dev/github.com/jackc/pgx/v5#QueryExecMode', now, now);

    // --- go-redis/v9 (1) ---
    insertAP.run(crypto.randomUUID(), redis, 'Using context.Background() for all Redis operations',
      'Passing context.Background() to every Redis call ignores cancellation and timeout signals.',
      'If the upstream HTTP request is cancelled or times out, the Redis operation will continue running, wasting connections and resources. This can cause connection pool exhaustion under load.',
      'Propagate the request context from your HTTP handler to Redis calls.',
      'medium', '>=9.0.0',
      `// ❌ Ignores request cancellation
func handler(w http.ResponseWriter, r *http.Request) {
  val, _ := rdb.Get(context.Background(), "key").Result()
}`,
      `// ✅ Propagate request context
func handler(w http.ResponseWriter, r *http.Request) {
  val, _ := rdb.Get(r.Context(), "key").Result()
}`,
      'https://pkg.go.dev/context', now, now);

    // --- go-redis old paths (v8, v7) ---
    for (const [libId, ver] of [[redisOldV8, 'v8'], [redisOldV7, 'v7']] as const) {
      insertAP.run(crypto.randomUUID(), libId, 'Migrate from go-redis/redis to redis/go-redis v9',
        'The github.com/go-redis/redis import path is deprecated. The project has moved to github.com/redis/go-redis.',
        'The old import path will not receive security patches or new features. v9 adds context-first APIs, better connection pooling, and improved Redis 7+ support.',
        'Update your go.mod to use github.com/redis/go-redis/v9 and update all imports.',
        'high', '>=6.0.0',
        `// ❌ Deprecated import
import "github.com/go-redis/redis/${ver}"

client := redis.NewClient(&redis.Options{
  Addr: "localhost:6379",
})`,
        `// ✅ New import path
import "github.com/redis/go-redis/v9"

client := redis.NewClient(&redis.Options{
  Addr: "localhost:6379",
})`,
        'https://github.com/redis/go-redis/blob/master/MIGRATION.md', now, now);
    }

    // --- zerolog (1) ---
    insertAP.run(crypto.randomUUID(), zerolog, 'Using ConsoleWriter in production',
      'zerolog.ConsoleWriter produces human-readable colorized output.',
      'ConsoleWriter is 10-20x slower than the default JSON output because it must parse and reformat every event. It also produces output that is not machine-parseable, breaking log aggregation pipelines.',
      'Use ConsoleWriter only in development. Default JSON output is optimized for production.',
      'medium', '>=1.0.0',
      `// ❌ Slow and not machine-parseable in prod
log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})`,
      `// ✅ JSON output in production, console in dev
if os.Getenv("ENV") == "development" {
  log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}
// Default: JSON to stderr (production)`,
      'https://github.com/rs/zerolog#pretty-logging', now, now);

    // --- zap (1) ---
    insertAP.run(crypto.randomUUID(), zap, 'Using zap.L() without calling ReplaceGlobals',
      'zap.L() returns the global logger, which is a no-op logger by default.',
      'Without calling ReplaceGlobals(), zap.L() silently discards all log output. This is a common source of "missing logs" bugs, especially when library code uses the global logger.',
      'Call zap.ReplaceGlobals() early in main, or pass loggers explicitly via dependency injection.',
      'high', '>=1.0.0',
      `// ❌ Global logger is no-op by default
func init() {
  zap.L().Info("this is silently dropped")
}`,
      `// ✅ Replace global logger in main
func main() {
  logger, _ := zap.NewProduction()
  zap.ReplaceGlobals(logger)
  defer logger.Sync()

  zap.L().Info("now this works")
}`,
      'https://pkg.go.dev/go.uber.org/zap#ReplaceGlobals', now, now);

    // --- prometheus (2) ---
    insertAP.run(crypto.randomUUID(), prom, 'Using unbounded label values',
      'Prometheus labels with high or unbounded cardinality (like user IDs, request IDs, or email addresses) create a new time series for each unique value.',
      'Each unique label combination creates a separate time series stored in memory. Unbounded labels can cause Prometheus to OOM, degrade query performance, and increase storage costs dramatically.',
      'Only use labels with low, bounded cardinality (HTTP method, status code, endpoint template). Use logs for high-cardinality data.',
      'critical', '>=1.0.0',
      `// ❌ User ID = unbounded cardinality
counter.WithLabelValues(userID, endpoint).Inc()`,
      `// ✅ Bounded labels only
counter.WithLabelValues(method, statusCode, routeTemplate).Inc()
// High-cardinality data goes to logs, not metrics`,
      'https://prometheus.io/docs/practices/naming/#labels', now, now);

    insertAP.run(crypto.randomUUID(), prom, 'Using promauto with MustRegister on the same metric',
      'promauto automatically registers metrics with the default registry. Calling MustRegister on the same metric causes a panic due to duplicate registration.',
      'promauto.NewCounter already calls prometheus.MustRegister internally. Calling MustRegister again panics at startup with "duplicate metrics collector registration attempted".',
      'Use either promauto (auto-registers) OR manual prometheus.NewCounter + MustRegister, never both.',
      'high', '>=1.0.0',
      `// ❌ Double registration — panics at startup
var myCounter = promauto.NewCounter(prometheus.CounterOpts{
  Name: "my_counter",
})
func init() {
  prometheus.MustRegister(myCounter) // panic!
}`,
      `// ✅ Option A: promauto (auto-registers)
var myCounter = promauto.NewCounter(prometheus.CounterOpts{
  Name: "my_counter",
})

// ✅ Option B: manual registration
var myCounter = prometheus.NewCounter(prometheus.CounterOpts{
  Name: "my_counter",
})
func init() {
  prometheus.MustRegister(myCounter)
}`,
      'https://pkg.go.dev/github.com/prometheus/client_golang/prometheus/promauto', now, now);

    console.log('✓ Inserted 10 anti-patterns');

    // ====================================================================
    // SECURITY ADVISORIES (1)
    // ====================================================================

    insertSA.run(crypto.randomUUID(), gin, 'CVE-2023-29401',
      'Gin mishandles Content-Type header in c.Bind',
      'When using c.Bind() or c.BindHeader(), an attacker can supply a crafted Content-Type header to cause unexpected binding behavior, potentially leading to security bypasses when different content types are assumed.',
      'medium', '>=1.0.0 <1.9.1', '1.9.1',
      'https://nvd.nist.gov/vuln/detail/CVE-2023-29401',
      '2023-06-08T10:00:00.000Z', now);

    console.log('✓ Inserted 1 security advisory');

    // ====================================================================
    // UPDATE METADATA
    // ====================================================================
    const libCount = (db.prepare('SELECT COUNT(*) as count FROM libraries').get() as { count: number }).count;
    const bpCount = (db.prepare('SELECT COUNT(*) as count FROM best_practices').get() as { count: number }).count;
    const apCount = (db.prepare('SELECT COUNT(*) as count FROM anti_patterns').get() as { count: number }).count;
    const saCount = (db.prepare('SELECT COUNT(*) as count FROM security_advisories').get() as { count: number }).count;

    db.prepare(`
      INSERT INTO export_metadata (export_date, total_libraries, total_best_practices, total_anti_patterns, total_security_advisories, source_database, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(now, libCount, bpCount, apCount, saCount, 'manual-go-seed', '0.1.0');

    console.log(`✓ Updated metadata: ${libCount} libs, ${bpCount} BPs, ${apCount} APs, ${saCount} SAs`);
  });

  transaction();

  db.close();
  console.log('\n✅ Go ecosystem seed complete!');
}

seedGoData();
