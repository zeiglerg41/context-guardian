-- Context Guardian - Go Ecosystem Seed Data
-- Manually curated best practices for popular Go libraries

-- Insert Go libraries
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES
    ('github.com/gin-gonic/gin', 'go', 'https://gin-gonic.com', 'https://github.com/gin-gonic/gin', 'High-performance HTTP web framework for Go'),
    ('github.com/gorilla/mux', 'go', 'https://pkg.go.dev/github.com/gorilla/mux', 'https://github.com/gorilla/mux', 'Powerful HTTP router and URL matcher for Go'),
    ('github.com/gorilla/websocket', 'go', 'https://pkg.go.dev/github.com/gorilla/websocket', 'https://github.com/gorilla/websocket', 'WebSocket implementation for Go'),
    ('github.com/jackc/pgx/v5', 'go', 'https://pkg.go.dev/github.com/jackc/pgx/v5', 'https://github.com/jackc/pgx', 'PostgreSQL driver and toolkit for Go'),
    ('github.com/redis/go-redis/v9', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go'),
    ('github.com/go-redis/redis/v8', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go (legacy import path, v8)'),
    ('github.com/go-redis/redis/v7', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go (legacy import path, v7)'),
    ('github.com/rs/zerolog', 'go', 'https://github.com/rs/zerolog', 'https://github.com/rs/zerolog', 'Zero-allocation structured JSON logger for Go'),
    ('go.uber.org/zap', 'go', 'https://pkg.go.dev/go.uber.org/zap', 'https://github.com/uber-go/zap', 'Blazing-fast structured logger for Go'),
    ('github.com/prometheus/client_golang', 'go', 'https://pkg.go.dev/github.com/prometheus/client_golang', 'https://github.com/prometheus/client_golang', 'Prometheus instrumentation library for Go')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    gin_id UUID;
    mux_id UUID;
    ws_id UUID;
    pgx_id UUID;
    redis_id UUID;
    redis_old_v8_id UUID;
    redis_old_v7_id UUID;
    zerolog_id UUID;
    zap_id UUID;
    prom_id UUID;
BEGIN
    SELECT id INTO gin_id FROM libraries WHERE name = 'github.com/gin-gonic/gin';
    SELECT id INTO mux_id FROM libraries WHERE name = 'github.com/gorilla/mux';
    SELECT id INTO ws_id FROM libraries WHERE name = 'github.com/gorilla/websocket';
    SELECT id INTO pgx_id FROM libraries WHERE name = 'github.com/jackc/pgx/v5';
    SELECT id INTO redis_id FROM libraries WHERE name = 'github.com/redis/go-redis/v9';
    SELECT id INTO redis_old_v8_id FROM libraries WHERE name = 'github.com/go-redis/redis/v8';
    SELECT id INTO redis_old_v7_id FROM libraries WHERE name = 'github.com/go-redis/redis/v7';
    SELECT id INTO zerolog_id FROM libraries WHERE name = 'github.com/rs/zerolog';
    SELECT id INTO zap_id FROM libraries WHERE name = 'go.uber.org/zap';
    SELECT id INTO prom_id FROM libraries WHERE name = 'github.com/prometheus/client_golang';

    -- ========================================================================
    -- GIN - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        gin_id,
        'Use ShouldBind instead of Bind for request binding',
        'ShouldBind returns an error that you can handle, while Bind automatically returns a 400 response on error, removing control from your handler. ShouldBind lets you customize error responses and logging.',
        'best-practice',
        'medium',
        '>=1.4.0',
        E'// ❌ Bind writes 400 automatically on failure\nif err := c.Bind(&req); err != nil {\n  return // 400 already sent, can''t customize\n}\n\n// ✅ ShouldBind lets you handle errors\nif err := c.ShouldBindJSON(&req); err != nil {\n  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})\n  return\n}',
        'https://gin-gonic.com/docs/examples/binding-and-validation/'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        gin_id,
        'Set TrustedPlatform or TrustedProxies for client IP detection',
        'By default, Gin trusts all proxies which can lead to IP spoofing. Configure TrustedProxies or TrustedPlatform to ensure accurate client IP resolution behind reverse proxies.',
        'security',
        'high',
        '>=1.7.0',
        E'// ✅ Set trusted proxies explicitly\nrouter := gin.Default()\nrouter.SetTrustedProxies([]string{"10.0.0.0/8"})\n\n// Or use TrustedPlatform for cloud providers\nrouter.TrustedPlatform = gin.PlatformCloudflare',
        'https://pkg.go.dev/github.com/gin-gonic/gin#readme-don-t-trust-all-proxies'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        gin_id,
        'Apply middleware selectively per route group',
        'Instead of applying all middleware globally, use route groups to apply middleware only where needed. This improves performance and avoids unnecessary processing on routes like health checks.',
        'performance',
        'medium',
        '>=1.0.0',
        E'router := gin.New()\nrouter.Use(gin.Logger()) // global\n\n// Auth middleware only on protected routes\napi := router.Group("/api")\napi.Use(authMiddleware())\n{\n  api.GET("/users", listUsers)\n}\n\n// No auth needed\nrouter.GET("/health", healthCheck)',
        'https://gin-gonic.com/docs/examples/grouping-routes/'
    );

    -- GIN - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        gin_id,
        'Using gin.Default() in production',
        'gin.Default() includes the Logger and Recovery middleware which may not be suitable for production.',
        'The built-in Logger writes to stdout with its own format, bypassing your structured logging. Recovery catches panics but may expose stack traces. Both add overhead you likely replace anyway.',
        'Use gin.New() and add your own middleware explicitly.',
        'medium',
        '>=1.0.0',
        E'// ❌ Includes default Logger and Recovery\nrouter := gin.Default()',
        E'// ✅ Start clean and add what you need\ngin.SetMode(gin.ReleaseMode)\nrouter := gin.New()\nrouter.Use(gin.Recovery()) // keep recovery\nrouter.Use(yourStructuredLogger())',
        'https://gin-gonic.com/docs/examples/custom-middleware/'
    );

    -- GIN - SECURITY ADVISORIES

    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (
        gin_id,
        'CVE-2023-29401',
        'Gin mishandles Content-Type header in c.Bind',
        'When using c.Bind() or c.BindHeader(), an attacker can supply a crafted Content-Type header to cause unexpected binding behavior, potentially leading to security bypasses when different content types are assumed.',
        'medium',
        '>=1.0.0 <1.9.1',
        '1.9.1',
        'https://nvd.nist.gov/vuln/detail/CVE-2023-29401',
        '2023-06-08 10:00:00+00'
    );

    -- ========================================================================
    -- GORILLA/MUX - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        mux_id,
        'Use r.Walk to verify registered routes at startup',
        'Call Router.Walk() at startup to log all registered routes. This helps catch missing or misconfigured routes before they cause 404s in production.',
        'best-practice',
        'low',
        '>=1.6.0',
        E'err := r.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {\n  tpl, _ := route.GetPathTemplate()\n  methods, _ := route.GetMethods()\n  log.Printf("Route: %s %v", tpl, methods)\n  return nil\n})\nif err != nil {\n  log.Fatal(err)\n}',
        'https://pkg.go.dev/github.com/gorilla/mux#Router.Walk'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        mux_id,
        'Always set server timeouts with gorilla/mux',
        'gorilla/mux is just a router — it does not set any HTTP server timeouts. You must configure ReadTimeout, WriteTimeout, and IdleTimeout on the http.Server to prevent slowloris and resource exhaustion attacks.',
        'security',
        'high',
        '>=1.0.0',
        E'// ❌ No timeouts — vulnerable to slowloris\nhttp.ListenAndServe(":8080", router)\n\n// ✅ Set explicit timeouts\nsrv := &http.Server{\n  Handler:      router,\n  Addr:         ":8080",\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}',
        'https://pkg.go.dev/net/http#Server'
    );

    -- ========================================================================
    -- GORILLA/WEBSOCKET - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        ws_id,
        'Synchronize concurrent writes with a mutex or channel',
        'The WebSocket connection does not support concurrent writers. All calls to WriteMessage, WriteJSON, or NextWriter must be serialized, or you will get corrupted frames.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'type SafeConn struct {\n  conn *websocket.Conn\n  mu   sync.Mutex\n}\n\nfunc (c *SafeConn) WriteJSON(v interface{}) error {\n  c.mu.Lock()\n  defer c.mu.Unlock()\n  return c.conn.WriteJSON(v)\n}',
        'https://pkg.go.dev/github.com/gorilla/websocket#hdr-Concurrency'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        ws_id,
        'Implement ping/pong with read deadlines',
        'Set a read deadline and handle Pong messages to detect dead connections. Without this, a dropped client can hold a connection open indefinitely, leaking server resources.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'conn.SetReadDeadline(time.Now().Add(60 * time.Second))\nconn.SetPongHandler(func(string) error {\n  conn.SetReadDeadline(time.Now().Add(60 * time.Second))\n  return nil\n})\n\n// In a separate goroutine, send pings\nticker := time.NewTicker(54 * time.Second)\nfor range ticker.C {\n  if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {\n    return\n  }\n}',
        'https://pkg.go.dev/github.com/gorilla/websocket#hdr-Control_Messages'
    );

    -- GORILLA/WEBSOCKET - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        ws_id,
        'Setting CheckOrigin to always return true',
        'The Upgrader.CheckOrigin function validates the Origin header during the WebSocket handshake.',
        'Disabling origin checks allows any website to open WebSocket connections to your server, enabling cross-site WebSocket hijacking (CSWSH) attacks.',
        'Validate the Origin header against an allowlist of trusted domains.',
        'high',
        '>=1.0.0',
        E'// ❌ Disables CORS protection\nupgrader := websocket.Upgrader{\n  CheckOrigin: func(r *http.Request) bool {\n    return true\n  },\n}',
        E'// ✅ Validate origin\nupgrader := websocket.Upgrader{\n  CheckOrigin: func(r *http.Request) bool {\n    origin := r.Header.Get("Origin")\n    return origin == "https://myapp.example.com"\n  },\n}',
        'https://pkg.go.dev/github.com/gorilla/websocket#Upgrader'
    );

    -- ========================================================================
    -- PGX/V5 - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        pgx_id,
        'Use pgxpool for connection pooling instead of pgx.Connect',
        'pgx.Connect creates a single connection with no pooling. In web applications, use pgxpool.New to get a connection pool that handles concurrency, reconnection, and idle connection management.',
        'performance',
        'high',
        '>=5.0.0',
        E'// ❌ Single connection, no pooling\nconn, err := pgx.Connect(ctx, connStr)\n\n// ✅ Connection pool for concurrent use\npool, err := pgxpool.New(ctx, connStr)\nif err != nil {\n  log.Fatal(err)\n}\ndefer pool.Close()\n\n// Use pool in handlers\nrows, err := pool.Query(ctx, "SELECT ...")',
        'https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        pgx_id,
        'Use pgx.CollectRows for type-safe row scanning',
        'pgx v5 provides CollectRows and RowToStructByName helpers that reduce boilerplate and prevent common scanning errors like wrong column order.',
        'best-practice',
        'medium',
        '>=5.0.0',
        E'type User struct {\n  ID   int    `db:"id"`\n  Name string `db:"name"`\n}\n\n// ✅ Type-safe collection\nusers, err := pgx.CollectRows(\n  pool.Query(ctx, "SELECT id, name FROM users"),\n  pgx.RowToStructByName[User],\n)',
        'https://pkg.go.dev/github.com/jackc/pgx/v5#CollectRows'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        pgx_id,
        'Call pool.Ping at startup to verify database connectivity',
        'pgxpool.New does not immediately connect to the database. Call pool.Ping(ctx) after creation to verify connectivity and fail fast if the database is unreachable.',
        'best-practice',
        'medium',
        '>=5.0.0',
        E'pool, err := pgxpool.New(ctx, connStr)\nif err != nil {\n  log.Fatal(err)\n}\n\n// ✅ Verify connection\nif err := pool.Ping(ctx); err != nil {\n  log.Fatalf("cannot reach database: %v", err)\n}',
        'https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool#Pool.Ping'
    );

    -- PGX/V5 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        pgx_id,
        'Using pgx with PgBouncer without QueryExecModeSimpleProtocol',
        'pgx v5 uses the PostgreSQL extended query protocol by default, which is incompatible with PgBouncer in transaction pooling mode.',
        'Prepared statements created by the extended protocol are tied to a specific backend connection. PgBouncer''s transaction pooling reassigns connections per transaction, causing "prepared statement does not exist" errors.',
        'Set QueryExecMode to QueryExecModeSimpleProtocol when using PgBouncer.',
        'high',
        '>=5.0.0',
        E'// ❌ Fails with PgBouncer in transaction mode\npool, _ := pgxpool.New(ctx, connStr)',
        E'// ✅ Use simple protocol for PgBouncer\nconfig, _ := pgxpool.ParseConfig(connStr)\nconfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol\npool, _ := pgxpool.NewWithConfig(ctx, config)',
        'https://pkg.go.dev/github.com/jackc/pgx/v5#QueryExecMode'
    );

    -- ========================================================================
    -- GO-REDIS/V9 - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        redis_id,
        'Use the new github.com/redis/go-redis/v9 import path',
        'Starting with v9, go-redis moved from github.com/go-redis/redis to github.com/redis/go-redis. The old import path is deprecated and will not receive updates.',
        'best-practice',
        'high',
        '>=9.0.0',
        E'// ❌ Deprecated import path\nimport "github.com/go-redis/redis/v8"\n\n// ✅ New canonical import\nimport "github.com/redis/go-redis/v9"',
        'https://github.com/redis/go-redis/blob/master/MIGRATION.md'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        redis_id,
        'Use pipelines for batch operations',
        'Pipeline batches multiple Redis commands into a single round trip, dramatically reducing latency for bulk operations. Use Pipelined() for fire-and-forget or Pipeline() when you need to inspect individual results.',
        'performance',
        'medium',
        '>=9.0.0',
        E'// ❌ N round trips\nfor _, key := range keys {\n  rdb.Get(ctx, key)\n}\n\n// ✅ Single round trip\ncmds, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {\n  for _, key := range keys {\n    pipe.Get(ctx, key)\n  }\n  return nil\n})',
        'https://redis.io/docs/latest/develop/clients/go/#pipelines'
    );

    -- GO-REDIS/V9 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        redis_id,
        'Using context.Background() for all Redis operations',
        'Passing context.Background() to every Redis call ignores cancellation and timeout signals.',
        'If the upstream HTTP request is cancelled or times out, the Redis operation will continue running, wasting connections and resources. This can cause connection pool exhaustion under load.',
        'Propagate the request context from your HTTP handler to Redis calls.',
        'medium',
        '>=9.0.0',
        E'// ❌ Ignores request cancellation\nfunc handler(w http.ResponseWriter, r *http.Request) {\n  val, _ := rdb.Get(context.Background(), "key").Result()\n}',
        E'// ✅ Propagate request context\nfunc handler(w http.ResponseWriter, r *http.Request) {\n  val, _ := rdb.Get(r.Context(), "key").Result()\n}',
        'https://pkg.go.dev/context'
    );

    -- GO-REDIS (old paths v8, v7) - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        redis_old_v8_id,
        'Migrate from go-redis/redis to redis/go-redis v9',
        'The github.com/go-redis/redis import path is deprecated. The project has moved to github.com/redis/go-redis.',
        'The old import path will not receive security patches or new features. v9 adds context-first APIs, better connection pooling, and improved Redis 7+ support.',
        'Update your go.mod to use github.com/redis/go-redis/v9 and update all imports.',
        'high',
        '>=6.0.0',
        E'// ❌ Deprecated import\nimport "github.com/go-redis/redis/v8"\n\nclient := redis.NewClient(&redis.Options{\n  Addr: "localhost:6379",\n})',
        E'// ✅ New import path\nimport "github.com/redis/go-redis/v9"\n\nclient := redis.NewClient(&redis.Options{\n  Addr: "localhost:6379",\n})',
        'https://github.com/redis/go-redis/blob/master/MIGRATION.md'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        redis_old_v7_id,
        'Migrate from go-redis/redis to redis/go-redis v9',
        'The github.com/go-redis/redis import path is deprecated. The project has moved to github.com/redis/go-redis.',
        'The old import path will not receive security patches or new features. v9 adds context-first APIs, better connection pooling, and improved Redis 7+ support.',
        'Update your go.mod to use github.com/redis/go-redis/v9 and update all imports.',
        'high',
        '>=6.0.0',
        E'// ❌ Deprecated import\nimport "github.com/go-redis/redis/v7"\n\nclient := redis.NewClient(&redis.Options{\n  Addr: "localhost:6379",\n})',
        E'// ✅ New import path\nimport "github.com/redis/go-redis/v9"\n\nclient := redis.NewClient(&redis.Options{\n  Addr: "localhost:6379",\n})',
        'https://github.com/redis/go-redis/blob/master/MIGRATION.md'
    );

    -- ========================================================================
    -- ZEROLOG - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zerolog_id,
        'Use sub-loggers with context fields instead of repeating fields',
        'Create sub-loggers with With() to attach contextual fields like request ID, user ID, or service name. This avoids repeating the same fields on every log call and ensures consistency.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'// ❌ Repeating fields\nlog.Info().Str("request_id", reqID).Str("user_id", uid).Msg("started")\nlog.Info().Str("request_id", reqID).Str("user_id", uid).Msg("done")\n\n// ✅ Sub-logger with context\nlogger := log.With().\n  Str("request_id", reqID).\n  Str("user_id", uid).\n  Logger()\nlogger.Info().Msg("started")\nlogger.Info().Msg("done")',
        'https://github.com/rs/zerolog#sub-loggers-let-you-chain-loggers-with-additional-context'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zerolog_id,
        'Always call .Msg() or .Send() to emit log events',
        'Zerolog uses a builder pattern. If you forget to call .Msg("") or .Send() at the end of the chain, the log event is silently discarded and resources are leaked from the internal pool.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'// ❌ Event never emitted — silently lost\nlog.Info().Str("key", "value")\n\n// ✅ Must call Msg or Send\nlog.Info().Str("key", "value").Msg("operation completed")\nlog.Info().Str("key", "value").Send() // empty message',
        'https://github.com/rs/zerolog#leveled-logging'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zerolog_id,
        'Use zerolog.Ctx for context-aware logging',
        'Store a logger in context.Context with logger.WithContext(ctx) and retrieve it with zerolog.Ctx(ctx). This integrates structured logging with Go''s context propagation pattern.',
        'best-practice',
        'medium',
        '>=1.20.0',
        E'// Store logger in context\nctx := logger.WithContext(r.Context())\n\n// Retrieve in downstream functions\nfunc processItem(ctx context.Context, item Item) {\n  log := zerolog.Ctx(ctx)\n  log.Info().Str("item_id", item.ID).Msg("processing")\n}',
        'https://github.com/rs/zerolog#integration-with-context'
    );

    -- ZEROLOG - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        zerolog_id,
        'Using ConsoleWriter in production',
        'zerolog.ConsoleWriter produces human-readable colorized output.',
        'ConsoleWriter is 10-20x slower than the default JSON output because it must parse and reformat every event. It also produces output that is not machine-parseable, breaking log aggregation pipelines.',
        'Use ConsoleWriter only in development. Default JSON output is optimized for production.',
        'medium',
        '>=1.0.0',
        E'// ❌ Slow and not machine-parseable in prod\nlog.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})',
        E'// ✅ JSON output in production, console in dev\nif os.Getenv("ENV") == "development" {\n  log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})\n}\n// Default: JSON to stderr (production)',
        'https://github.com/rs/zerolog#pretty-logging'
    );

    -- ========================================================================
    -- ZAP - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zap_id,
        'Use zap.Logger for hot paths, SugaredLogger for convenience',
        'zap.Logger (structured) avoids allocations by requiring typed fields. SugaredLogger allows printf-style formatting but allocates. Use Logger in performance-critical code and Sugar where developer convenience matters more.',
        'performance',
        'medium',
        '>=1.0.0',
        E'// ✅ Hot path — zero-alloc structured logging\nlogger.Info("request handled",\n  zap.String("method", r.Method),\n  zap.Int("status", 200),\n  zap.Duration("latency", elapsed),\n)\n\n// ✅ Non-hot path — convenient sugar\nsugar.Infof("user %s logged in from %s", username, ip)',
        'https://pkg.go.dev/go.uber.org/zap#hdr-Choosing_a_Logger'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zap_id,
        'Defer logger.Sync() in main to flush buffered logs',
        'Zap buffers log entries for performance. Call logger.Sync() before your application exits to ensure all buffered entries are flushed to their destination.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'func main() {\n  logger, _ := zap.NewProduction()\n  defer logger.Sync() // flush before exit\n\n  logger.Info("application started")\n  // ...\n}',
        'https://pkg.go.dev/go.uber.org/zap#Logger.Sync'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        zap_id,
        'Use AtomicLevel to change log level at runtime',
        'zap.AtomicLevel allows you to change the log level without restarting your application. You can expose it as an HTTP handler for operational control.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'atom := zap.NewAtomicLevel()\nlogger := zap.New(zapcore.NewCore(\n  zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),\n  os.Stdout,\n  atom,\n))\n\n// Expose HTTP endpoint to change level\nhttp.Handle("/log-level", atom) // PUT {"level":"debug"}',
        'https://pkg.go.dev/go.uber.org/zap#AtomicLevel'
    );

    -- ZAP - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        zap_id,
        'Using zap.L() without calling ReplaceGlobals',
        'zap.L() returns the global logger, which is a no-op logger by default.',
        'Without calling ReplaceGlobals(), zap.L() silently discards all log output. This is a common source of "missing logs" bugs, especially when library code uses the global logger.',
        'Call zap.ReplaceGlobals() early in main, or pass loggers explicitly via dependency injection.',
        'high',
        '>=1.0.0',
        E'// ❌ Global logger is no-op by default\nfunc init() {\n  zap.L().Info("this is silently dropped")\n}',
        E'// ✅ Replace global logger in main\nfunc main() {\n  logger, _ := zap.NewProduction()\n  zap.ReplaceGlobals(logger)\n  defer logger.Sync()\n\n  zap.L().Info("now this works")\n}',
        'https://pkg.go.dev/go.uber.org/zap#ReplaceGlobals'
    );

    -- ========================================================================
    -- PROMETHEUS - BEST PRACTICES
    -- ========================================================================

    -- NOTE: "Normalize HTTP path labels" removed — covered by the "unbounded label values" anti-pattern
    -- which provides more detail (why_bad + better_approach)

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        prom_id,
        'Use a custom registry instead of the default global registry',
        'The default prometheus.DefaultRegisterer includes Go runtime metrics (go_*) and process metrics (process_*). A custom registry gives you explicit control over what gets exposed.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'// ✅ Custom registry — only your metrics\nreg := prometheus.NewRegistry()\nreg.MustRegister(\n  httpRequests,\n  httpDuration,\n)\n\n// Use custom registry with handler\nhttp.Handle("/metrics", promhttp.HandlerFor(reg, promhttp.HandlerOpts{}))',
        'https://pkg.go.dev/github.com/prometheus/client_golang/prometheus#NewRegistry'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        prom_id,
        'Define histogram buckets aligned with SLO targets',
        'Default histogram buckets (.005 to 10s) may not match your SLOs. Define custom buckets that align with your response time targets so you can directly query SLO compliance.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'// ✅ Buckets aligned with SLO (p50=100ms, p99=500ms)\nhttpDuration := prometheus.NewHistogramVec(\n  prometheus.HistogramOpts{\n    Name:    "http_request_duration_seconds",\n    Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5},\n  },\n  []string{"handler", "method"},\n)',
        'https://prometheus.io/docs/practices/histograms/'
    );

    -- PROMETHEUS - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        prom_id,
        'Using unbounded label values',
        'Prometheus labels with high or unbounded cardinality (like user IDs, request IDs, or email addresses) create a new time series for each unique value.',
        'Each unique label combination creates a separate time series stored in memory. Unbounded labels can cause Prometheus to OOM, degrade query performance, and increase storage costs dramatically.',
        'Only use labels with low, bounded cardinality (HTTP method, status code, endpoint template). Use logs for high-cardinality data.',
        'critical',
        '>=1.0.0',
        E'// ❌ User ID = unbounded cardinality\ncounter.WithLabelValues(userID, endpoint).Inc()',
        E'// ✅ Bounded labels only\ncounter.WithLabelValues(method, statusCode, routeTemplate).Inc()\n// High-cardinality data goes to logs, not metrics',
        'https://prometheus.io/docs/practices/naming/#labels'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        prom_id,
        'Using promauto with MustRegister on the same metric',
        'promauto automatically registers metrics with the default registry. Calling MustRegister on the same metric causes a panic due to duplicate registration.',
        'promauto.NewCounter already calls prometheus.MustRegister internally. Calling MustRegister again panics at startup with "duplicate metrics collector registration attempted".',
        'Use either promauto (auto-registers) OR manual prometheus.NewCounter + MustRegister, never both.',
        'high',
        '>=1.0.0',
        E'// ❌ Double registration — panics at startup\nvar myCounter = promauto.NewCounter(prometheus.CounterOpts{\n  Name: "my_counter",\n})\nfunc init() {\n  prometheus.MustRegister(myCounter) // panic!\n}',
        E'// ✅ Option A: promauto (auto-registers)\nvar myCounter = promauto.NewCounter(prometheus.CounterOpts{\n  Name: "my_counter",\n})\n\n// ✅ Option B: manual registration\nvar myCounter = prometheus.NewCounter(prometheus.CounterOpts{\n  Name: "my_counter",\n})\nfunc init() {\n  prometheus.MustRegister(myCounter)\n}',
        'https://pkg.go.dev/github.com/prometheus/client_golang/prometheus/promauto'
    );

END $$;
