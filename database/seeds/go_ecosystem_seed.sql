-- Context Guardian - GO Ecosystem Seed Data
-- Auto-generated from data/ecosystems/go.yaml
-- Do not edit manually — edit the YAML source instead.

-- Insert libraries
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES
    ('github.com/gin-gonic/gin', 'go', 'https://gin-gonic.com', 'https://github.com/gin-gonic/gin', 'High-performance HTTP web framework for Go'),
    ('github.com/gorilla/mux', 'go', 'https://pkg.go.dev/github.com/gorilla/mux', 'https://github.com/gorilla/mux', 'Powerful HTTP router and URL matcher for Go'),
    ('github.com/gorilla/websocket', 'go', 'https://pkg.go.dev/github.com/gorilla/websocket', 'https://github.com/gorilla/websocket', 'WebSocket implementation for Go'),
    ('github.com/jackc/pgx/v5', 'go', 'https://pkg.go.dev/github.com/jackc/pgx/v5', 'https://github.com/jackc/pgx', 'PostgreSQL driver and toolkit for Go'),
    ('github.com/jackc/pgx/v4', 'go', 'https://pkg.go.dev/github.com/jackc/pgx/v4', 'https://github.com/jackc/pgx', 'PostgreSQL driver and toolkit for Go (v4)'),
    ('github.com/redis/go-redis/v9', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go'),
    ('github.com/go-redis/redis/v8', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go (legacy import path, v8)'),
    ('github.com/go-redis/redis/v7', 'go', 'https://redis.io/docs/latest/develop/clients/go/', 'https://github.com/redis/go-redis', 'Redis client for Go (legacy import path, v7)'),
    ('github.com/rs/zerolog', 'go', 'https://github.com/rs/zerolog', 'https://github.com/rs/zerolog', 'Zero-allocation structured JSON logger for Go'),
    ('go.uber.org/zap', 'go', 'https://pkg.go.dev/go.uber.org/zap', 'https://github.com/uber-go/zap', 'Blazing-fast structured logger for Go'),
    ('github.com/prometheus/client_golang', 'go', 'https://pkg.go.dev/github.com/prometheus/client_golang', 'https://github.com/prometheus/client_golang', 'Prometheus instrumentation library for Go'),
    ('github.com/labstack/echo/v4', 'go', 'https://echo.labstack.com', 'https://github.com/labstack/echo', 'High performance, minimalist Go web framework'),
    ('github.com/go-chi/chi/v5', 'go', 'https://go-chi.io', 'https://github.com/go-chi/chi', 'Lightweight, idiomatic HTTP router for Go'),
    ('github.com/spf13/cobra', 'go', 'https://cobra.dev', 'https://github.com/spf13/cobra', 'A framework for modern CLI applications in Go'),
    ('github.com/spf13/viper', 'go', 'https://pkg.go.dev/github.com/spf13/viper', 'https://github.com/spf13/viper', 'Complete configuration solution for Go applications'),
    ('github.com/stretchr/testify', 'go', 'https://pkg.go.dev/github.com/stretchr/testify', 'https://github.com/stretchr/testify', 'Testing toolkit with assertions, mocks, and suites'),
    ('gorm.io/gorm', 'go', 'https://gorm.io', 'https://github.com/go-gorm/gorm', 'The fantastic ORM library for Go'),
    ('github.com/jinzhu/gorm', 'go', 'https://v1.gorm.io', 'https://github.com/jinzhu/gorm', 'GORM v1 (deprecated, use gorm.io/gorm)')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    lib_0_id UUID;
    lib_1_id UUID;
    lib_2_id UUID;
    lib_3_id UUID;
    lib_4_id UUID;
    lib_5_id UUID;
    lib_6_id UUID;
    lib_7_id UUID;
    lib_8_id UUID;
    lib_9_id UUID;
    lib_10_id UUID;
    lib_11_id UUID;
    lib_12_id UUID;
    lib_13_id UUID;
    lib_14_id UUID;
    lib_15_id UUID;
    lib_16_id UUID;
    lib_17_id UUID;
BEGIN
    SELECT id INTO lib_0_id FROM libraries WHERE name = 'github.com/gin-gonic/gin';
    SELECT id INTO lib_1_id FROM libraries WHERE name = 'github.com/gorilla/mux';
    SELECT id INTO lib_2_id FROM libraries WHERE name = 'github.com/gorilla/websocket';
    SELECT id INTO lib_3_id FROM libraries WHERE name = 'github.com/jackc/pgx/v5';
    SELECT id INTO lib_4_id FROM libraries WHERE name = 'github.com/jackc/pgx/v4';
    SELECT id INTO lib_5_id FROM libraries WHERE name = 'github.com/redis/go-redis/v9';
    SELECT id INTO lib_6_id FROM libraries WHERE name = 'github.com/go-redis/redis/v8';
    SELECT id INTO lib_7_id FROM libraries WHERE name = 'github.com/go-redis/redis/v7';
    SELECT id INTO lib_8_id FROM libraries WHERE name = 'github.com/rs/zerolog';
    SELECT id INTO lib_9_id FROM libraries WHERE name = 'go.uber.org/zap';
    SELECT id INTO lib_10_id FROM libraries WHERE name = 'github.com/prometheus/client_golang';
    SELECT id INTO lib_11_id FROM libraries WHERE name = 'github.com/labstack/echo/v4';
    SELECT id INTO lib_12_id FROM libraries WHERE name = 'github.com/go-chi/chi/v5';
    SELECT id INTO lib_13_id FROM libraries WHERE name = 'github.com/spf13/cobra';
    SELECT id INTO lib_14_id FROM libraries WHERE name = 'github.com/spf13/viper';
    SELECT id INTO lib_15_id FROM libraries WHERE name = 'github.com/stretchr/testify';
    SELECT id INTO lib_16_id FROM libraries WHERE name = 'gorm.io/gorm';
    SELECT id INTO lib_17_id FROM libraries WHERE name = 'github.com/jinzhu/gorm';

    -- github.com/gin-gonic/gin
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
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
        lib_0_id,
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
        lib_0_id,
        'Apply middleware selectively per route group',
        'Instead of applying all middleware globally, use route groups to apply middleware only where needed. This improves performance and avoids unnecessary processing on routes like health checks.',
        'performance',
        'medium',
        '>=1.0.0',
        E'router := gin.New()\nrouter.Use(gin.Logger()) // global\n\n// Auth middleware only on protected routes\napi := router.Group("/api")\napi.Use(authMiddleware())\n{\n  api.GET("/users", listUsers)\n}\n\n// No auth needed\nrouter.GET("/health", healthCheck)',
        'https://gin-gonic.com/docs/examples/grouping-routes/'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_0_id,
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

    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (
        lib_0_id,
        'CVE-2023-29401',
        'Gin mishandles Content-Type header in c.Bind',
        'When using c.Bind() or c.BindHeader(), an attacker can supply a crafted Content-Type header to cause unexpected binding behavior, potentially leading to security bypasses when different content types are assumed.',
        'medium',
        '>=1.0.0 <1.9.1',
        '1.9.1',
        'https://nvd.nist.gov/vuln/detail/CVE-2023-29401',
        '2023-06-08 00:00:00+00'
    );

    -- github.com/gorilla/mux
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_1_id,
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
        lib_1_id,
        'Always set server timeouts with gorilla/mux',
        'gorilla/mux is just a router — it does not set any HTTP server timeouts. You must configure ReadTimeout, WriteTimeout, and IdleTimeout on the http.Server to prevent slowloris and resource exhaustion attacks.',
        'security',
        'high',
        '>=1.0.0',
        E'// ❌ No timeouts — vulnerable to slowloris\nhttp.ListenAndServe(":8080", router)\n\n// ✅ Set explicit timeouts\nsrv := &http.Server{\n  Handler:      router,\n  Addr:         ":8080",\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}',
        'https://pkg.go.dev/net/http#Server'
    );

    -- github.com/gorilla/websocket
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_2_id,
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
        lib_2_id,
        'Implement ping/pong with read deadlines',
        'Set a read deadline and handle Pong messages to detect dead connections. Without this, a dropped client can hold a connection open indefinitely, leaking server resources.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'conn.SetReadDeadline(time.Now().Add(60 * time.Second))\nconn.SetPongHandler(func(string) error {\n  conn.SetReadDeadline(time.Now().Add(60 * time.Second))\n  return nil\n})\n\n// In a separate goroutine, send pings\nticker := time.NewTicker(54 * time.Second)\nfor range ticker.C {\n  if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {\n    return\n  }\n}',
        'https://pkg.go.dev/github.com/gorilla/websocket#hdr-Control_Messages'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_2_id,
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

    -- github.com/jackc/pgx/v5
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_3_id,
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
        lib_3_id,
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
        lib_3_id,
        'Call pool.Ping at startup to verify database connectivity',
        'pgxpool.New does not immediately connect to the database. Call pool.Ping(ctx) after creation to verify connectivity and fail fast if the database is unreachable.',
        'best-practice',
        'medium',
        '>=5.0.0',
        E'pool, err := pgxpool.New(ctx, connStr)\nif err != nil {\n  log.Fatal(err)\n}\n\n// ✅ Verify connection\nif err := pool.Ping(ctx); err != nil {\n  log.Fatalf("cannot reach database: %v", err)\n}',
        'https://pkg.go.dev/github.com/jackc/pgx/v5/pgxpool#Pool.Ping'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_3_id,
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

    -- github.com/jackc/pgx/v4
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_4_id,
        'Use pgxpool.Connect for connection pooling',
        'pgx.Connect creates a single connection. In web apps, use pgxpool.Connect (v4 API) to get a pool that manages concurrency and reconnection. Note: v5 changed this to pgxpool.New.',
        'performance',
        'high',
        '>=4.0.0',
        E'// ❌ Single connection\nconn, err := pgx.Connect(ctx, connStr)\n\n// ✅ Connection pool (v4 API)\npool, err := pgxpool.Connect(ctx, connStr)\nif err != nil {\n  log.Fatal(err)\n}\ndefer pool.Close()',
        'https://pkg.go.dev/github.com/jackc/pgx/v4/pgxpool'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_4_id,
        'Use scany for struct scanning in pgx v4',
        'pgx v4 does not have built-in CollectRows like v5. Use the scany library (pgxscan) for ergonomic struct scanning instead of manual row.Scan calls.',
        'best-practice',
        'medium',
        '>=4.0.0',
        E'import "github.com/georgysavva/scany/v2/pgxscan"\n\nvar users []User\nerr := pgxscan.Select(ctx, pool, &users,\n  "SELECT id, name, email FROM users WHERE active = $1", true,\n)',
        'https://pkg.go.dev/github.com/georgysavva/scany/v2/pgxscan'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_4_id,
        'Use QueryRow for single-row queries',
        'For queries that return exactly one row, use QueryRow instead of Query to avoid the boilerplate of iterating rows and checking rows.Err().',
        'best-practice',
        'low',
        '>=4.0.0',
        E'// ❌ Verbose for single row\nrows, _ := pool.Query(ctx, "SELECT name FROM users WHERE id=$1", id)\ndefer rows.Close()\nrows.Next()\nrows.Scan(&name)\n\n// ✅ QueryRow\nerr := pool.QueryRow(ctx, "SELECT name FROM users WHERE id=$1", id).Scan(&name)',
        'https://pkg.go.dev/github.com/jackc/pgx/v4#Conn.QueryRow'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_4_id,
        'Not closing rows after Query',
        'Forgetting to close rows returned by pool.Query leaks connections back to the pool.',
        'Each unclosed rows object holds a connection from the pool. Under load this exhausts the pool, causing all queries to block or timeout.',
        'Always defer rows.Close() immediately after calling Query. Or use QueryRow/scany which handle closing automatically.',
        'high',
        '>=4.0.0',
        E'// ❌ Leaked connection\nrows, err := pool.Query(ctx, "SELECT ...")\nfor rows.Next() {\n  // process\n}\n// rows never closed!',
        E'// ✅ Always defer Close\nrows, err := pool.Query(ctx, "SELECT ...")\nif err != nil {\n  return err\n}\ndefer rows.Close()\nfor rows.Next() {\n  // process\n}',
        'https://pkg.go.dev/github.com/jackc/pgx/v4#Rows'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_4_id,
        'Migrate from pgx v4 to v5',
        'pgx v4 is in maintenance mode. v5 has a cleaner API, built-in CollectRows, and better performance.',
        'v4 will not receive new features. v5 has pgxpool.New (replaces Connect), CollectRows, RowToStructByName, and improved tracing support.',
        'Follow the v4-to-v5 migration guide. Key changes: pgxpool.Connect -> pgxpool.New, row scanning helpers are built-in.',
        'medium',
        '>=4.0.0',
        E'// v4 API\npool, err := pgxpool.Connect(ctx, connStr)',
        E'// v5 API\npool, err := pgxpool.New(ctx, connStr)',
        'https://github.com/jackc/pgx/wiki/Migrating-from-v4-to-v5'
    );

    -- github.com/redis/go-redis/v9
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_5_id,
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
        lib_5_id,
        'Use pipelines for batch operations',
        'Pipeline batches multiple Redis commands into a single round trip, dramatically reducing latency for bulk operations. Use Pipelined() for fire-and-forget or Pipeline() when you need to inspect individual results.',
        'performance',
        'medium',
        '>=9.0.0',
        E'// ❌ N round trips\nfor _, key := range keys {\n  rdb.Get(ctx, key)\n}\n\n// ✅ Single round trip\ncmds, err := rdb.Pipelined(ctx, func(pipe redis.Pipeliner) error {\n  for _, key := range keys {\n    pipe.Get(ctx, key)\n  }\n  return nil\n})',
        'https://redis.io/docs/latest/develop/clients/go/#pipelines'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_5_id,
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

    -- github.com/go-redis/redis/v8
    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_6_id,
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

    -- github.com/go-redis/redis/v7
    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_7_id,
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

    -- github.com/rs/zerolog
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_8_id,
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
        lib_8_id,
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
        lib_8_id,
        'Use zerolog.Ctx for context-aware logging',
        'Store a logger in context.Context with logger.WithContext(ctx) and retrieve it with zerolog.Ctx(ctx). This integrates structured logging with Go''s context propagation pattern.',
        'best-practice',
        'medium',
        '>=1.20.0',
        E'// Store logger in context\nctx := logger.WithContext(r.Context())\n\n// Retrieve in downstream functions\nfunc processItem(ctx context.Context, item Item) {\n  log := zerolog.Ctx(ctx)\n  log.Info().Str("item_id", item.ID).Msg("processing")\n}',
        'https://github.com/rs/zerolog#integration-with-context'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_8_id,
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

    -- go.uber.org/zap
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_9_id,
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
        lib_9_id,
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
        lib_9_id,
        'Use AtomicLevel to change log level at runtime',
        'zap.AtomicLevel allows you to change the log level without restarting your application. You can expose it as an HTTP handler for operational control.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'atom := zap.NewAtomicLevel()\nlogger := zap.New(zapcore.NewCore(\n  zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),\n  os.Stdout,\n  atom,\n))\n\n// Expose HTTP endpoint to change level\nhttp.Handle("/log-level", atom) // PUT {"level":"debug"}',
        'https://pkg.go.dev/go.uber.org/zap#AtomicLevel'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_9_id,
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

    -- github.com/prometheus/client_golang
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_10_id,
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
        lib_10_id,
        'Define histogram buckets aligned with SLO targets',
        'Default histogram buckets (.005 to 10s) may not match your SLOs. Define custom buckets that align with your response time targets so you can directly query SLO compliance.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'// ✅ Buckets aligned with SLO (p50=100ms, p99=500ms)\nhttpDuration := prometheus.NewHistogramVec(\n  prometheus.HistogramOpts{\n    Name:    "http_request_duration_seconds",\n    Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5},\n  },\n  []string{"handler", "method"},\n)',
        'https://prometheus.io/docs/practices/histograms/'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_10_id,
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
        lib_10_id,
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

    -- github.com/labstack/echo/v4
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_11_id,
        'Use a custom HTTPErrorHandler for consistent error responses',
        'Echo''s default error handler returns errors in its own format. Define a custom HTTPErrorHandler to return consistent, structured error responses across your API.',
        'best-practice',
        'medium',
        '>=4.0.0',
        E'e := echo.New()\ne.HTTPErrorHandler = func(err error, c echo.Context) {\n  code := http.StatusInternalServerError\n  msg := "Internal Server Error"\n  if he, ok := err.(*echo.HTTPError); ok {\n    code = he.Code\n    msg = fmt.Sprintf("%v", he.Message)\n  }\n  c.JSON(code, map[string]string{"error": msg})\n}',
        'https://echo.labstack.com/docs/error-handling'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_11_id,
        'Use echo.Bind with struct tags for request validation',
        'Echo supports binding query params, path params, headers, and body into a single struct. Combine with the validator interface for automatic validation.',
        'best-practice',
        'medium',
        '>=4.0.0',
        E'type CreateUserRequest struct {\n  Name  string `json:"name" validate:"required"`\n  Email string `json:"email" validate:"required,email"`\n}\n\nfunc createUser(c echo.Context) error {\n  var req CreateUserRequest\n  if err := c.Bind(&req); err != nil {\n    return echo.NewHTTPError(http.StatusBadRequest, err.Error())\n  }\n  if err := c.Validate(req); err != nil {\n    return err\n  }\n  // ...\n}',
        'https://echo.labstack.com/docs/binding'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_11_id,
        'Set server timeouts on the underlying http.Server',
        'Echo''s e.Start() creates an http.Server without timeouts. Configure the server directly to prevent slowloris attacks and resource exhaustion.',
        'security',
        'high',
        '>=4.0.0',
        E'// ❌ No timeouts\ne.Start(":8080")\n\n// ✅ Configure timeouts\ns := &http.Server{\n  Addr:         ":8080",\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}\ne.Logger.Fatal(e.StartServer(s))',
        'https://echo.labstack.com/docs/cookbook/http2'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_11_id,
        'Using c.String or c.HTML for API error responses',
        'Returning plain text or HTML error messages from API endpoints.',
        'API clients expect structured JSON error responses. Plain text errors break client-side error parsing and provide inconsistent error formats across endpoints.',
        'Always use c.JSON with a structured error object for API endpoints.',
        'medium',
        '>=4.0.0',
        E'// ❌ Plain text error in an API\nreturn c.String(http.StatusBadRequest, "invalid input")',
        E'// ✅ Structured JSON error\nreturn c.JSON(http.StatusBadRequest, map[string]string{\n  "error": "invalid input",\n  "field": "email",\n})',
        'https://echo.labstack.com/docs/response'
    );

    -- github.com/go-chi/chi/v5
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_12_id,
        'Use chi.URLParam instead of parsing URL path manually',
        'chi provides chi.URLParam(r, "paramName") to extract URL parameters. This is type-safe and consistent with chi''s routing syntax.',
        'best-practice',
        'medium',
        '>=5.0.0',
        E'r.Get("/users/{userID}", func(w http.ResponseWriter, r *http.Request) {\n  // ✅ Use chi.URLParam\n  userID := chi.URLParam(r, "userID")\n})',
        'https://pkg.go.dev/github.com/go-chi/chi/v5#URLParam'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_12_id,
        'Use r.With for route-scoped middleware instead of r.Use',
        'r.Use applies middleware to all subsequent routes. r.With creates a new router copy with additional middleware, leaving the original unaffected. Use r.With for auth or rate-limiting on specific route groups.',
        'best-practice',
        'medium',
        '>=5.0.0',
        E'r := chi.NewRouter()\nr.Use(middleware.Logger) // applies to ALL routes\n\n// ✅ Auth only on /admin routes\nr.Route("/admin", func(r chi.Router) {\n  r.Use(authMiddleware)\n  r.Get("/dashboard", adminDashboard)\n})\n\n// ✅ Or inline with With\nr.With(rateLimiter).Get("/api/search", searchHandler)',
        'https://go-chi.io/#/pages/middleware'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_12_id,
        'Set server timeouts — chi is just a router',
        'Like gorilla/mux, chi is only a router and does not configure http.Server timeouts. You must set ReadTimeout, WriteTimeout, and IdleTimeout yourself.',
        'security',
        'high',
        '>=5.0.0',
        E'r := chi.NewRouter()\n// ... routes ...\n\n// ✅ Always set timeouts\nsrv := &http.Server{\n  Addr:         ":8080",\n  Handler:      r,\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}\nlog.Fatal(srv.ListenAndServe())',
        'https://pkg.go.dev/net/http#Server'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_12_id,
        'Registering routes after server starts',
        'Adding routes to a chi router after ListenAndServe has been called.',
        'chi''s routing tree is not safe for concurrent modification. Adding routes after the server starts can cause data races and panics.',
        'Register all routes before starting the server. Use chi.Walk at startup to verify all routes are registered.',
        'high',
        '>=5.0.0',
        E'// ❌ Race condition\ngo srv.ListenAndServe()\nr.Get("/late-route", handler) // unsafe!',
        E'// ✅ Register all routes first\nr.Get("/late-route", handler)\nlog.Fatal(srv.ListenAndServe())',
        'https://pkg.go.dev/github.com/go-chi/chi/v5'
    );

    -- github.com/spf13/cobra
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_13_id,
        'Use RunE instead of Run for error propagation',
        'RunE returns an error that cobra handles (prints and sets exit code). Run swallows errors, forcing you to call os.Exit manually and bypassing defer statements.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'// ❌ Run — must handle errors manually\nRun: func(cmd *cobra.Command, args []string) {\n  if err := doWork(); err != nil {\n    fmt.Fprintln(os.Stderr, err)\n    os.Exit(1) // skips defers!\n  }\n}\n\n// ✅ RunE — cobra handles the error\nRunE: func(cmd *cobra.Command, args []string) error {\n  return doWork()\n}',
        'https://pkg.go.dev/github.com/spf13/cobra#Command'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_13_id,
        'Use PersistentPreRunE for shared validation across subcommands',
        'PersistentPreRunE runs before the command and all its children. Use it for shared setup like loading config, validating auth, or initializing logging.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'rootCmd := &cobra.Command{\n  Use: "myapp",\n  PersistentPreRunE: func(cmd *cobra.Command, args []string) error {\n    // Runs before ALL subcommands\n    return initConfig()\n  },\n}\n\nserveCmd := &cobra.Command{\n  Use:  "serve",\n  RunE: func(cmd *cobra.Command, args []string) error {\n    // initConfig() already ran\n    return startServer()\n  },\n}',
        'https://pkg.go.dev/github.com/spf13/cobra#Command'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_13_id,
        'Use cobra.ExactArgs or cobra.MinimumNArgs for argument validation',
        'Cobra provides built-in argument validators. Use them instead of manually checking len(args) in your Run function.',
        'best-practice',
        'low',
        '>=1.0.0',
        E'// ❌ Manual validation\nRunE: func(cmd *cobra.Command, args []string) error {\n  if len(args) != 1 {\n    return fmt.Errorf("requires exactly 1 arg")\n  }\n}\n\n// ✅ Built-in validator\ncmd := &cobra.Command{\n  Use:  "get [name]",\n  Args: cobra.ExactArgs(1),\n  RunE: func(cmd *cobra.Command, args []string) error {\n    name := args[0] // guaranteed to exist\n  },\n}',
        'https://pkg.go.dev/github.com/spf13/cobra#Command'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_13_id,
        'Binding flags in init() instead of a dedicated function',
        'Using Go''s init() to bind cobra flags scatters flag definitions across files and makes them hard to find.',
        'init() runs at import time, making flag registration implicit and order-dependent. It also makes testing harder since you cannot control when init() runs.',
        'Bind flags in a named function called explicitly from main or the parent command setup.',
        'medium',
        '>=1.0.0',
        E'// ❌ Hidden in init()\nfunc init() {\n  rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")\n  rootCmd.AddCommand(serveCmd)\n}',
        E'// ✅ Explicit setup function\nfunc newRootCmd() *cobra.Command {\n  cmd := &cobra.Command{Use: "myapp"}\n  cmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")\n  cmd.AddCommand(newServeCmd())\n  return cmd\n}\n\nfunc main() {\n  if err := newRootCmd().Execute(); err != nil {\n    os.Exit(1)\n  }\n}',
        'https://pkg.go.dev/github.com/spf13/cobra#Command'
    );

    -- github.com/spf13/viper
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_14_id,
        'Call SetDefault before ReadInConfig for all required keys',
        'SetDefault documents what keys your application expects and provides fallback values. Without defaults, missing config keys silently return zero values, causing subtle bugs.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'// ✅ Set defaults first\nviper.SetDefault("server.port", 8080)\nviper.SetDefault("server.read_timeout", "15s")\nviper.SetDefault("log.level", "info")\n\n// Then read config file (overrides defaults)\nif err := viper.ReadInConfig(); err != nil {\n  if _, ok := err.(viper.ConfigFileNotFoundError); !ok {\n    log.Fatal(err) // real error, not just missing file\n  }\n}',
        'https://pkg.go.dev/github.com/spf13/viper#SetDefault'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_14_id,
        'Use AutomaticEnv with SetEnvPrefix for 12-factor config',
        'AutomaticEnv makes viper check environment variables for every Get call. SetEnvPrefix avoids collisions with other apps. Together they enable 12-factor app configuration.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'viper.SetEnvPrefix("MYAPP")   // MYAPP_SERVER_PORT\nviper.AutomaticEnv()\nviper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))\n\n// Now viper.GetInt("server.port") checks:\n// 1. Flag override\n// 2. MYAPP_SERVER_PORT env var\n// 3. Config file value\n// 4. Default',
        'https://pkg.go.dev/github.com/spf13/viper#AutomaticEnv'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_14_id,
        'Use BindPFlags to connect cobra flags to viper config',
        'BindPFlags makes cobra flags the highest-priority config source, so CLI flags override env vars and config files. This gives users a consistent --flag override for any config key.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'serveCmd := &cobra.Command{\n  Use: "serve",\n  PersistentPreRunE: func(cmd *cobra.Command, args []string) error {\n    // Bind all flags to viper\n    return viper.BindPFlags(cmd.Flags())\n  },\n}\nserveCmd.Flags().Int("port", 8080, "server port")\n\n// Now viper.GetInt("port") respects:\n// --port flag > MYAPP_PORT env > config file > default',
        'https://pkg.go.dev/github.com/spf13/viper#BindPFlags'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_14_id,
        'Ignoring ReadInConfig errors',
        'Silently ignoring all errors from viper.ReadInConfig.',
        'ReadInConfig can fail for reasons beyond "file not found" — permission errors, YAML/JSON syntax errors, or I/O issues. Ignoring these means running with partial or no configuration silently.',
        'Check the error type. ConfigFileNotFoundError is often acceptable; other errors should be fatal.',
        'high',
        '>=1.0.0',
        E'// ❌ All errors silently ignored\nviper.ReadInConfig() // no error check',
        E'// ✅ Distinguish missing file from real errors\nif err := viper.ReadInConfig(); err != nil {\n  if _, ok := err.(viper.ConfigFileNotFoundError); ok {\n    log.Warn("no config file found, using defaults")\n  } else {\n    log.Fatalf("config error: %v", err)\n  }\n}',
        'https://pkg.go.dev/github.com/spf13/viper#ReadInConfig'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_14_id,
        'Storing secrets in viper config files',
        'Putting database passwords, API keys, or tokens in config files managed by viper.',
        'Config files are often committed to git, logged, or included in container images. Secrets in config files are easily leaked and hard to rotate.',
        'Use environment variables for secrets (viper.AutomaticEnv reads them). For production, use a secrets manager and inject via env vars.',
        'critical',
        '>=1.0.0',
        E'# ❌ config.yaml with secrets\ndatabase:\n  password: "s3cret!"\napi:\n  key: "sk-abc123"',
        E'# ✅ Config file — no secrets\ndatabase:\n  host: "localhost"\n  port: 5432\n\n# Secrets via env vars\n# MYAPP_DATABASE_PASSWORD=s3cret!\n# MYAPP_API_KEY=sk-abc123',
        'https://12factor.net/config'
    );

    -- github.com/stretchr/testify
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_15_id,
        'Use require for setup and fatal conditions, assert for checks',
        'require functions stop the test immediately on failure (like t.Fatal). assert functions record the failure but continue (like t.Error). Use require for preconditions where continuing makes no sense.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'func TestUser(t *testing.T) {\n  // ✅ require — stop if setup fails\n  user, err := createTestUser()\n  require.NoError(t, err)\n  require.NotNil(t, user)\n\n  // ✅ assert — check multiple properties\n  assert.Equal(t, "Alice", user.Name)\n  assert.True(t, user.Active)\n  assert.WithinDuration(t, time.Now(), user.CreatedAt, time.Second)\n}',
        'https://pkg.go.dev/github.com/stretchr/testify/require'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_15_id,
        'Use suite.Suite for complex test fixtures with setup/teardown',
        'testify/suite provides struct-based test organization with SetupTest, TearDownTest, SetupSuite, and TearDownSuite methods. Use it when multiple tests share expensive setup.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'type UserServiceSuite struct {\n  suite.Suite\n  db   *sql.DB\n  svc  *UserService\n}\n\nfunc (s *UserServiceSuite) SetupSuite() {\n  s.db = setupTestDB()\n  s.svc = NewUserService(s.db)\n}\n\nfunc (s *UserServiceSuite) TearDownSuite() {\n  s.db.Close()\n}\n\nfunc (s *UserServiceSuite) TestCreateUser() {\n  user, err := s.svc.Create("Alice")\n  s.Require().NoError(err)\n  s.Equal("Alice", user.Name)\n}\n\nfunc TestUserService(t *testing.T) {\n  suite.Run(t, new(UserServiceSuite))\n}',
        'https://pkg.go.dev/github.com/stretchr/testify/suite'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_15_id,
        'Use mock.AssertExpectations to verify all expected calls were made',
        'After running code under test, call AssertExpectations(t) on your mock to verify all .On() expectations were fulfilled. Without this, missing calls go undetected.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'type MockStore struct {\n  mock.Mock\n}\n\nfunc (m *MockStore) Save(user User) error {\n  args := m.Called(user)\n  return args.Error(0)\n}\n\nfunc TestHandler(t *testing.T) {\n  store := new(MockStore)\n  store.On("Save", mock.AnythingOfType("User")).Return(nil)\n\n  handler := NewHandler(store)\n  handler.CreateUser("Alice")\n\n  // ✅ Verify Save was actually called\n  store.AssertExpectations(t)\n}',
        'https://pkg.go.dev/github.com/stretchr/testify/mock#Mock.AssertExpectations'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_15_id,
        'Wrong argument order in assert.Equal',
        'Passing the actual value as the first argument and expected as the second to assert.Equal.',
        'assert.Equal(t, expected, actual) — the first value after t is "expected". Swapping them produces confusing failure messages: "expected: <actual>, got: <expected>".',
        'Remember: assert.Equal(t, expected, actual). Expected comes first.',
        'medium',
        '>=1.0.0',
        E'// ❌ Wrong order — confusing failure messages\nassert.Equal(t, user.Name, "Alice")\n// Failure: expected: "Bob", got: "Alice" (backwards!)',
        E'// ✅ Correct order: expected, actual\nassert.Equal(t, "Alice", user.Name)\n// Failure: expected: "Alice", got: "Bob" (clear!)',
        'https://pkg.go.dev/github.com/stretchr/testify/assert#Equal'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_15_id,
        'Using assert when require is needed for preconditions',
        'Using assert (non-fatal) for setup steps that must succeed for the rest of the test to make sense.',
        'If setup fails with assert, the test continues and produces cascading nil-pointer panics or misleading failures that obscure the real problem.',
        'Use require for any step where failure should stop the test immediately.',
        'high',
        '>=1.0.0',
        E'// ❌ Test panics on user.Name if err != nil\nassert.NoError(t, err)\nassert.Equal(t, "Alice", user.Name) // panic if user is nil',
        E'// ✅ Stop immediately if precondition fails\nrequire.NoError(t, err)\nrequire.NotNil(t, user)\nassert.Equal(t, "Alice", user.Name)',
        'https://pkg.go.dev/github.com/stretchr/testify/require'
    );

    -- gorm.io/gorm
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_16_id,
        'Use Preload to avoid N+1 queries',
        'When accessing associations, GORM lazy-loads by default, executing a separate query for each parent record. Use Preload to eager-load associations in a single query.',
        'performance',
        'high',
        '>=2.0.0',
        E'// ❌ N+1 queries — 1 for users + N for orders\nvar users []User\ndb.Find(&users)\nfor _, u := range users {\n  db.Model(&u).Association("Orders").Find(&u.Orders)\n}\n\n// ✅ Single query with Preload\nvar users []User\ndb.Preload("Orders").Find(&users)',
        'https://gorm.io/docs/preload.html'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_16_id,
        'Use db.Transaction for multi-step operations',
        'GORM''s Transaction method handles Begin, Commit, and Rollback automatically. It rolls back on error or panic, preventing partial writes.',
        'best-practice',
        'high',
        '>=2.0.0',
        E'// ✅ Automatic rollback on error or panic\nerr := db.Transaction(func(tx *gorm.DB) error {\n  if err := tx.Create(&user).Error; err != nil {\n    return err // triggers rollback\n  }\n  if err := tx.Create(&auditLog).Error; err != nil {\n    return err // triggers rollback\n  }\n  return nil // commit\n})',
        'https://gorm.io/docs/transactions.html'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_16_id,
        'Always check db.Error after operations',
        'GORM chains methods and stores errors internally. Always check .Error after the final operation. Unchecked errors silently produce empty results or partial writes.',
        'best-practice',
        'high',
        '>=2.0.0',
        E'// ❌ Error silently ignored\nvar user User\ndb.Where("email = ?", email).First(&user)\n// user may be zero-value if not found\n\n// ✅ Check error\nresult := db.Where("email = ?", email).First(&user)\nif result.Error != nil {\n  if errors.Is(result.Error, gorm.ErrRecordNotFound) {\n    return nil, ErrUserNotFound\n  }\n  return nil, result.Error\n}',
        'https://gorm.io/docs/error_handling.html'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_16_id,
        'Using db.Model with wrong receiver in updates',
        'Calling db.Save or db.Updates on a zero-value struct or without specifying a WHERE clause.',
        'Without a primary key or WHERE clause, GORM may update all rows in the table or insert a duplicate. GORM v2 blocks global updates by default, but db.Save on a zero-ID struct silently inserts instead of updating.',
        'Always ensure the struct has a non-zero primary key for Save, or use explicit Where clauses with Updates.',
        'high',
        '>=2.0.0',
        E'// ❌ Zero ID — inserts a new record instead of updating!\nuser := User{Name: "Alice"}\ndb.Save(&user) // INSERT, not UPDATE',
        E'// ✅ Fetch first, then save\nvar user User\ndb.First(&user, userID)\nuser.Name = "Alice"\ndb.Save(&user) // UPDATE with correct ID\n\n// ✅ Or use Updates with Where\ndb.Model(&User{}).Where("id = ?", userID).Updates(User{Name: "Alice"})',
        'https://gorm.io/docs/update.html'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_16_id,
        'Using raw string interpolation in GORM queries',
        'Building query strings with fmt.Sprintf or string concatenation instead of using GORM''s parameterized queries.',
        'String interpolation in SQL queries enables SQL injection attacks. GORM''s Where clause with ? placeholders properly escapes values.',
        'Always use parameterized queries with ? placeholders or named arguments.',
        'critical',
        '>=2.0.0',
        E'// ❌ SQL injection vulnerability\ndb.Where(fmt.Sprintf("name = ''%s''", userInput)).Find(&users)',
        E'// ✅ Parameterized query\ndb.Where("name = ?", userInput).Find(&users)\n\n// ✅ Or struct-based\ndb.Where(&User{Name: userInput}).Find(&users)',
        'https://gorm.io/docs/security.html'
    );

    -- github.com/jinzhu/gorm
    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_17_id,
        'Migrate from jinzhu/gorm to gorm.io/gorm v2',
        'github.com/jinzhu/gorm (GORM v1) is unmaintained. The project moved to gorm.io/gorm.',
        'GORM v1 has known bugs, no security patches, and poor performance compared to v2. v2 has a rewritten codebase with context support, batch operations, prepared statement caching, and proper error handling.',
        'Follow the GORM v2 migration guide. Key changes: import path, driver packages, and error handling patterns.',
        'high',
        '>=1.0.0',
        E'// ❌ Deprecated\nimport "github.com/jinzhu/gorm"\nimport _ "github.com/jinzhu/gorm/dialects/postgres"\n\ndb, err := gorm.Open("postgres", connStr)',
        E'// ✅ GORM v2\nimport "gorm.io/gorm"\nimport "gorm.io/driver/postgres"\n\ndb, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})',
        'https://gorm.io/docs/v2_release_note.html'
    );

END $$;
