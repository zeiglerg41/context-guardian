-- Context Guardian - Go Ecosystem Extended Seed Data
-- Additional popular Go libraries: pgx/v4, echo, chi, cobra, viper, testify, gorm

-- Insert libraries
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES
    ('github.com/jackc/pgx/v4', 'go', 'https://pkg.go.dev/github.com/jackc/pgx/v4', 'https://github.com/jackc/pgx', 'PostgreSQL driver and toolkit for Go (v4)'),
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
    pgx4_id UUID;
    echo_id UUID;
    chi_id UUID;
    cobra_id UUID;
    viper_id UUID;
    testify_id UUID;
    gorm_id UUID;
    gorm_old_id UUID;
BEGIN
    SELECT id INTO pgx4_id FROM libraries WHERE name = 'github.com/jackc/pgx/v4';
    SELECT id INTO echo_id FROM libraries WHERE name = 'github.com/labstack/echo/v4';
    SELECT id INTO chi_id FROM libraries WHERE name = 'github.com/go-chi/chi/v5';
    SELECT id INTO cobra_id FROM libraries WHERE name = 'github.com/spf13/cobra';
    SELECT id INTO viper_id FROM libraries WHERE name = 'github.com/spf13/viper';
    SELECT id INTO testify_id FROM libraries WHERE name = 'github.com/stretchr/testify';
    SELECT id INTO gorm_id FROM libraries WHERE name = 'gorm.io/gorm';
    SELECT id INTO gorm_old_id FROM libraries WHERE name = 'github.com/jinzhu/gorm';

    -- ========================================================================
    -- PGX/V4 - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        pgx4_id,
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
        pgx4_id,
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
        pgx4_id,
        'Use QueryRow for single-row queries',
        'For queries that return exactly one row, use QueryRow instead of Query to avoid the boilerplate of iterating rows and checking rows.Err().',
        'best-practice',
        'low',
        '>=4.0.0',
        E'// ❌ Verbose for single row\nrows, _ := pool.Query(ctx, "SELECT name FROM users WHERE id=$1", id)\ndefer rows.Close()\nrows.Next()\nrows.Scan(&name)\n\n// ✅ QueryRow\nerr := pool.QueryRow(ctx, "SELECT name FROM users WHERE id=$1", id).Scan(&name)',
        'https://pkg.go.dev/github.com/jackc/pgx/v4#Conn.QueryRow'
    );

    -- PGX/V4 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        pgx4_id,
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
        pgx4_id,
        'Migrate from pgx v4 to v5',
        'pgx v4 is in maintenance mode. v5 has a cleaner API, built-in CollectRows, and better performance.',
        'v4 will not receive new features. v5 has pgxpool.New (replaces Connect), CollectRows, RowToStructByName, and improved tracing support.',
        'Follow the v4-to-v5 migration guide. Key changes: pgxpool.Connect → pgxpool.New, row scanning helpers are built-in.',
        'medium',
        '>=4.0.0',
        E'// v4 API\npool, err := pgxpool.Connect(ctx, connStr)',
        E'// v5 API\npool, err := pgxpool.New(ctx, connStr)',
        'https://github.com/jackc/pgx/wiki/Migrating-from-v4-to-v5'
    );

    -- ========================================================================
    -- ECHO/V4 - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        echo_id,
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
        echo_id,
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
        echo_id,
        'Set server timeouts on the underlying http.Server',
        'Echo''s e.Start() creates an http.Server without timeouts. Configure the server directly to prevent slowloris attacks and resource exhaustion.',
        'security',
        'high',
        '>=4.0.0',
        E'// ❌ No timeouts\ne.Start(":8080")\n\n// ✅ Configure timeouts\ns := &http.Server{\n  Addr:         ":8080",\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}\ne.Logger.Fatal(e.StartServer(s))',
        'https://echo.labstack.com/docs/cookbook/http2'
    );

    -- ECHO/V4 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        echo_id,
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

    -- ========================================================================
    -- CHI/V5 - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        chi_id,
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
        chi_id,
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
        chi_id,
        'Set server timeouts — chi is just a router',
        'Like gorilla/mux, chi is only a router and does not configure http.Server timeouts. You must set ReadTimeout, WriteTimeout, and IdleTimeout yourself.',
        'security',
        'high',
        '>=5.0.0',
        E'r := chi.NewRouter()\n// ... routes ...\n\n// ✅ Always set timeouts\nsrv := &http.Server{\n  Addr:         ":8080",\n  Handler:      r,\n  ReadTimeout:  15 * time.Second,\n  WriteTimeout: 15 * time.Second,\n  IdleTimeout:  60 * time.Second,\n}\nlog.Fatal(srv.ListenAndServe())',
        'https://pkg.go.dev/net/http#Server'
    );

    -- CHI/V5 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        chi_id,
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

    -- ========================================================================
    -- COBRA - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        cobra_id,
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
        cobra_id,
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
        cobra_id,
        'Use cobra.ExactArgs or cobra.MinimumNArgs for argument validation',
        'Cobra provides built-in argument validators. Use them instead of manually checking len(args) in your Run function.',
        'best-practice',
        'low',
        '>=1.0.0',
        E'// ❌ Manual validation\nRunE: func(cmd *cobra.Command, args []string) error {\n  if len(args) != 1 {\n    return fmt.Errorf("requires exactly 1 arg")\n  }\n}\n\n// ✅ Built-in validator\ncmd := &cobra.Command{\n  Use:  "get [name]",\n  Args: cobra.ExactArgs(1),\n  RunE: func(cmd *cobra.Command, args []string) error {\n    name := args[0] // guaranteed to exist\n  },\n}',
        'https://pkg.go.dev/github.com/spf13/cobra#Command'
    );

    -- COBRA - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        cobra_id,
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

    -- ========================================================================
    -- VIPER - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        viper_id,
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
        viper_id,
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
        viper_id,
        'Use BindPFlags to connect cobra flags to viper config',
        'BindPFlags makes cobra flags the highest-priority config source, so CLI flags override env vars and config files. This gives users a consistent --flag override for any config key.',
        'best-practice',
        'medium',
        '>=1.0.0',
        E'serveCmd := &cobra.Command{\n  Use: "serve",\n  PersistentPreRunE: func(cmd *cobra.Command, args []string) error {\n    // Bind all flags to viper\n    return viper.BindPFlags(cmd.Flags())\n  },\n}\nserveCmd.Flags().Int("port", 8080, "server port")\n\n// Now viper.GetInt("port") respects:\n// --port flag > MYAPP_PORT env > config file > default',
        'https://pkg.go.dev/github.com/spf13/viper#BindPFlags'
    );

    -- VIPER - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        viper_id,
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
        viper_id,
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

    -- ========================================================================
    -- TESTIFY - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        testify_id,
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
        testify_id,
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
        testify_id,
        'Use mock.AssertExpectations to verify all expected calls were made',
        'After running code under test, call AssertExpectations(t) on your mock to verify all .On() expectations were fulfilled. Without this, missing calls go undetected.',
        'best-practice',
        'high',
        '>=1.0.0',
        E'type MockStore struct {\n  mock.Mock\n}\n\nfunc (m *MockStore) Save(user User) error {\n  args := m.Called(user)\n  return args.Error(0)\n}\n\nfunc TestHandler(t *testing.T) {\n  store := new(MockStore)\n  store.On("Save", mock.AnythingOfType("User")).Return(nil)\n\n  handler := NewHandler(store)\n  handler.CreateUser("Alice")\n\n  // ✅ Verify Save was actually called\n  store.AssertExpectations(t)\n}',
        'https://pkg.go.dev/github.com/stretchr/testify/mock#Mock.AssertExpectations'
    );

    -- TESTIFY - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        testify_id,
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
        testify_id,
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

    -- ========================================================================
    -- GORM V2 (gorm.io/gorm) - BEST PRACTICES
    -- ========================================================================

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        gorm_id,
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
        gorm_id,
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
        gorm_id,
        'Always check db.Error after operations',
        'GORM chains methods and stores errors internally. Always check .Error after the final operation. Unchecked errors silently produce empty results or partial writes.',
        'best-practice',
        'high',
        '>=2.0.0',
        E'// ❌ Error silently ignored\nvar user User\ndb.Where("email = ?", email).First(&user)\n// user may be zero-value if not found\n\n// ✅ Check error\nresult := db.Where("email = ?", email).First(&user)\nif result.Error != nil {\n  if errors.Is(result.Error, gorm.ErrRecordNotFound) {\n    return nil, ErrUserNotFound\n  }\n  return nil, result.Error\n}',
        'https://gorm.io/docs/error_handling.html'
    );

    -- GORM V2 - ANTI-PATTERNS

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        gorm_id,
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
        gorm_id,
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

    -- ========================================================================
    -- GORM V1 (github.com/jinzhu/gorm) - ANTI-PATTERNS (migrate only)
    -- ========================================================================

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        gorm_old_id,
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
