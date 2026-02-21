import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../data/offline-fallback.db');

function seedGoExtended() {
  console.log('🔄 Seeding Go extended ecosystem data into SQLite...\n');

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const now = new Date().toISOString();

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

  function getLibId(name: string): string {
    const row = db.prepare('SELECT id FROM libraries WHERE name = ?').get(name) as { id: string } | undefined;
    if (!row) throw new Error(`Library not found: ${name}`);
    return row.id;
  }

  const libraries = [
    { name: 'github.com/jackc/pgx/v4', docs: 'https://pkg.go.dev/github.com/jackc/pgx/v4', repo: 'https://github.com/jackc/pgx', desc: 'PostgreSQL driver and toolkit for Go (v4)' },
    { name: 'github.com/labstack/echo/v4', docs: 'https://echo.labstack.com', repo: 'https://github.com/labstack/echo', desc: 'High performance, minimalist Go web framework' },
    { name: 'github.com/go-chi/chi/v5', docs: 'https://go-chi.io', repo: 'https://github.com/go-chi/chi', desc: 'Lightweight, idiomatic HTTP router for Go' },
    { name: 'github.com/spf13/cobra', docs: 'https://cobra.dev', repo: 'https://github.com/spf13/cobra', desc: 'A framework for modern CLI applications in Go' },
    { name: 'github.com/spf13/viper', docs: 'https://pkg.go.dev/github.com/spf13/viper', repo: 'https://github.com/spf13/viper', desc: 'Complete configuration solution for Go applications' },
    { name: 'github.com/stretchr/testify', docs: 'https://pkg.go.dev/github.com/stretchr/testify', repo: 'https://github.com/stretchr/testify', desc: 'Testing toolkit with assertions, mocks, and suites' },
    { name: 'gorm.io/gorm', docs: 'https://gorm.io', repo: 'https://github.com/go-gorm/gorm', desc: 'The fantastic ORM library for Go' },
    { name: 'github.com/jinzhu/gorm', docs: 'https://v1.gorm.io', repo: 'https://github.com/jinzhu/gorm', desc: 'GORM v1 (deprecated, use gorm.io/gorm)' },
  ];

  const transaction = db.transaction(() => {
    // Insert libraries
    for (const lib of libraries) {
      insertLib.run(crypto.randomUUID(), lib.name, 'go', lib.docs, lib.repo, lib.desc, now, now);
    }
    console.log(`✓ Inserted ${libraries.length} libraries`);

    const pgx4 = getLibId('github.com/jackc/pgx/v4');
    const echo = getLibId('github.com/labstack/echo/v4');
    const chi = getLibId('github.com/go-chi/chi/v5');
    const cobra = getLibId('github.com/spf13/cobra');
    const viper = getLibId('github.com/spf13/viper');
    const testify = getLibId('github.com/stretchr/testify');
    const gorm = getLibId('gorm.io/gorm');
    const gormOld = getLibId('github.com/jinzhu/gorm');

    // ================================================================
    // PGX/V4 - BEST PRACTICES (3)
    // ================================================================
    insertBP.run(crypto.randomUUID(), pgx4, 'Use pgxpool.Connect for connection pooling',
      'pgx.Connect creates a single connection. In web apps, use pgxpool.Connect (v4 API) to get a pool that manages concurrency and reconnection. Note: v5 changed this to pgxpool.New.',
      'performance', 'high', '>=4.0.0',
      `// ❌ Single connection
conn, err := pgx.Connect(ctx, connStr)

// ✅ Connection pool (v4 API)
pool, err := pgxpool.Connect(ctx, connStr)
if err != nil {
  log.Fatal(err)
}
defer pool.Close()`,
      'https://pkg.go.dev/github.com/jackc/pgx/v4/pgxpool', now, now);

    insertBP.run(crypto.randomUUID(), pgx4, 'Use scany for struct scanning in pgx v4',
      'pgx v4 does not have built-in CollectRows like v5. Use the scany library (pgxscan) for ergonomic struct scanning instead of manual row.Scan calls.',
      'best-practice', 'medium', '>=4.0.0',
      `import "github.com/georgysavva/scany/v2/pgxscan"

var users []User
err := pgxscan.Select(ctx, pool, &users,
  "SELECT id, name, email FROM users WHERE active = $1", true,
)`,
      'https://pkg.go.dev/github.com/georgysavva/scany/v2/pgxscan', now, now);

    insertBP.run(crypto.randomUUID(), pgx4, 'Use QueryRow for single-row queries',
      'For queries that return exactly one row, use QueryRow instead of Query to avoid the boilerplate of iterating rows and checking rows.Err().',
      'best-practice', 'low', '>=4.0.0',
      `// ❌ Verbose for single row
rows, _ := pool.Query(ctx, "SELECT name FROM users WHERE id=$1", id)
defer rows.Close()
rows.Next()
rows.Scan(&name)

// ✅ QueryRow
err := pool.QueryRow(ctx, "SELECT name FROM users WHERE id=$1", id).Scan(&name)`,
      'https://pkg.go.dev/github.com/jackc/pgx/v4#Conn.QueryRow', now, now);

    // PGX/V4 - ANTI-PATTERNS (2)
    insertAP.run(crypto.randomUUID(), pgx4, 'Not closing rows after Query',
      'Forgetting to close rows returned by pool.Query leaks connections back to the pool.',
      'Each unclosed rows object holds a connection from the pool. Under load this exhausts the pool, causing all queries to block or timeout.',
      'Always defer rows.Close() immediately after calling Query. Or use QueryRow/scany which handle closing automatically.',
      'high', '>=4.0.0',
      `// ❌ Leaked connection
rows, err := pool.Query(ctx, "SELECT ...")
for rows.Next() {
  // process
}
// rows never closed!`,
      `// ✅ Always defer Close
rows, err := pool.Query(ctx, "SELECT ...")
if err != nil {
  return err
}
defer rows.Close()
for rows.Next() {
  // process
}`,
      'https://pkg.go.dev/github.com/jackc/pgx/v4#Rows', now, now);

    insertAP.run(crypto.randomUUID(), pgx4, 'Migrate from pgx v4 to v5',
      'pgx v4 is in maintenance mode. v5 has a cleaner API, built-in CollectRows, and better performance.',
      'v4 will not receive new features. v5 has pgxpool.New (replaces Connect), CollectRows, RowToStructByName, and improved tracing support.',
      'Follow the v4-to-v5 migration guide. Key changes: pgxpool.Connect → pgxpool.New, row scanning helpers are built-in.',
      'medium', '>=4.0.0',
      `// v4 API
pool, err := pgxpool.Connect(ctx, connStr)`,
      `// v5 API
pool, err := pgxpool.New(ctx, connStr)`,
      'https://github.com/jackc/pgx/wiki/Migrating-from-v4-to-v5', now, now);

    console.log('✓ pgx/v4: 3 BPs, 2 APs');

    // ================================================================
    // ECHO/V4 - BEST PRACTICES (3) + ANTI-PATTERNS (1)
    // ================================================================
    insertBP.run(crypto.randomUUID(), echo, 'Use a custom HTTPErrorHandler for consistent error responses',
      'Echo\'s default error handler returns errors in its own format. Define a custom HTTPErrorHandler to return consistent, structured error responses across your API.',
      'best-practice', 'medium', '>=4.0.0',
      `e := echo.New()
e.HTTPErrorHandler = func(err error, c echo.Context) {
  code := http.StatusInternalServerError
  msg := "Internal Server Error"
  if he, ok := err.(*echo.HTTPError); ok {
    code = he.Code
    msg = fmt.Sprintf("%v", he.Message)
  }
  c.JSON(code, map[string]string{"error": msg})
}`,
      'https://echo.labstack.com/docs/error-handling', now, now);

    insertBP.run(crypto.randomUUID(), echo, 'Use echo.Bind with struct tags for request validation',
      'Echo supports binding query params, path params, headers, and body into a single struct. Combine with the validator interface for automatic validation.',
      'best-practice', 'medium', '>=4.0.0',
      `type CreateUserRequest struct {
  Name  string \`json:"name" validate:"required"\`
  Email string \`json:"email" validate:"required,email"\`
}

func createUser(c echo.Context) error {
  var req CreateUserRequest
  if err := c.Bind(&req); err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, err.Error())
  }
  if err := c.Validate(req); err != nil {
    return err
  }
  // ...
}`,
      'https://echo.labstack.com/docs/binding', now, now);

    insertBP.run(crypto.randomUUID(), echo, 'Set server timeouts on the underlying http.Server',
      'Echo\'s e.Start() creates an http.Server without timeouts. Configure the server directly to prevent slowloris attacks and resource exhaustion.',
      'security', 'high', '>=4.0.0',
      `// ❌ No timeouts
e.Start(":8080")

// ✅ Configure timeouts
s := &http.Server{
  Addr:         ":8080",
  ReadTimeout:  15 * time.Second,
  WriteTimeout: 15 * time.Second,
  IdleTimeout:  60 * time.Second,
}
e.Logger.Fatal(e.StartServer(s))`,
      'https://echo.labstack.com/docs/cookbook/http2', now, now);

    insertAP.run(crypto.randomUUID(), echo, 'Using c.String or c.HTML for API error responses',
      'Returning plain text or HTML error messages from API endpoints.',
      'API clients expect structured JSON error responses. Plain text errors break client-side error parsing and provide inconsistent error formats across endpoints.',
      'Always use c.JSON with a structured error object for API endpoints.',
      'medium', '>=4.0.0',
      `// ❌ Plain text error in an API
return c.String(http.StatusBadRequest, "invalid input")`,
      `// ✅ Structured JSON error
return c.JSON(http.StatusBadRequest, map[string]string{
  "error": "invalid input",
  "field": "email",
})`,
      'https://echo.labstack.com/docs/response', now, now);

    console.log('✓ echo/v4: 3 BPs, 1 AP');

    // ================================================================
    // CHI/V5 - BEST PRACTICES (3) + ANTI-PATTERNS (1)
    // ================================================================
    insertBP.run(crypto.randomUUID(), chi, 'Use chi.URLParam instead of parsing URL path manually',
      'chi provides chi.URLParam(r, "paramName") to extract URL parameters. This is type-safe and consistent with chi\'s routing syntax.',
      'best-practice', 'medium', '>=5.0.0',
      `r.Get("/users/{userID}", func(w http.ResponseWriter, r *http.Request) {
  // ✅ Use chi.URLParam
  userID := chi.URLParam(r, "userID")
})`,
      'https://pkg.go.dev/github.com/go-chi/chi/v5#URLParam', now, now);

    insertBP.run(crypto.randomUUID(), chi, 'Use r.With for route-scoped middleware instead of r.Use',
      'r.Use applies middleware to all subsequent routes. r.With creates a new router copy with additional middleware, leaving the original unaffected.',
      'best-practice', 'medium', '>=5.0.0',
      `r := chi.NewRouter()
r.Use(middleware.Logger) // applies to ALL routes

// ✅ Auth only on /admin routes
r.Route("/admin", func(r chi.Router) {
  r.Use(authMiddleware)
  r.Get("/dashboard", adminDashboard)
})

// ✅ Or inline with With
r.With(rateLimiter).Get("/api/search", searchHandler)`,
      'https://go-chi.io/#/pages/middleware', now, now);

    insertBP.run(crypto.randomUUID(), chi, 'Set server timeouts — chi is just a router',
      'Like gorilla/mux, chi is only a router and does not configure http.Server timeouts. You must set ReadTimeout, WriteTimeout, and IdleTimeout yourself.',
      'security', 'high', '>=5.0.0',
      `r := chi.NewRouter()
// ... routes ...

// ✅ Always set timeouts
srv := &http.Server{
  Addr:         ":8080",
  Handler:      r,
  ReadTimeout:  15 * time.Second,
  WriteTimeout: 15 * time.Second,
  IdleTimeout:  60 * time.Second,
}
log.Fatal(srv.ListenAndServe())`,
      'https://pkg.go.dev/net/http#Server', now, now);

    insertAP.run(crypto.randomUUID(), chi, 'Registering routes after server starts',
      'Adding routes to a chi router after ListenAndServe has been called.',
      'chi\'s routing tree is not safe for concurrent modification. Adding routes after the server starts can cause data races and panics.',
      'Register all routes before starting the server. Use chi.Walk at startup to verify all routes are registered.',
      'high', '>=5.0.0',
      `// ❌ Race condition
go srv.ListenAndServe()
r.Get("/late-route", handler) // unsafe!`,
      `// ✅ Register all routes first
r.Get("/late-route", handler)
log.Fatal(srv.ListenAndServe())`,
      'https://pkg.go.dev/github.com/go-chi/chi/v5', now, now);

    console.log('✓ chi/v5: 3 BPs, 1 AP');

    // ================================================================
    // COBRA - BEST PRACTICES (3) + ANTI-PATTERNS (1)
    // ================================================================
    insertBP.run(crypto.randomUUID(), cobra, 'Use RunE instead of Run for error propagation',
      'RunE returns an error that cobra handles (prints and sets exit code). Run swallows errors, forcing you to call os.Exit manually and bypassing defer statements.',
      'best-practice', 'high', '>=1.0.0',
      `// ❌ Run — must handle errors manually
Run: func(cmd *cobra.Command, args []string) {
  if err := doWork(); err != nil {
    fmt.Fprintln(os.Stderr, err)
    os.Exit(1) // skips defers!
  }
}

// ✅ RunE — cobra handles the error
RunE: func(cmd *cobra.Command, args []string) error {
  return doWork()
}`,
      'https://pkg.go.dev/github.com/spf13/cobra#Command', now, now);

    insertBP.run(crypto.randomUUID(), cobra, 'Use PersistentPreRunE for shared validation across subcommands',
      'PersistentPreRunE runs before the command and all its children. Use it for shared setup like loading config, validating auth, or initializing logging.',
      'best-practice', 'medium', '>=1.0.0',
      `rootCmd := &cobra.Command{
  Use: "myapp",
  PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
    // Runs before ALL subcommands
    return initConfig()
  },
}

serveCmd := &cobra.Command{
  Use:  "serve",
  RunE: func(cmd *cobra.Command, args []string) error {
    // initConfig() already ran
    return startServer()
  },
}`,
      'https://pkg.go.dev/github.com/spf13/cobra#Command', now, now);

    insertBP.run(crypto.randomUUID(), cobra, 'Use cobra.ExactArgs or cobra.MinimumNArgs for argument validation',
      'Cobra provides built-in argument validators. Use them instead of manually checking len(args) in your Run function.',
      'best-practice', 'low', '>=1.0.0',
      `// ❌ Manual validation
RunE: func(cmd *cobra.Command, args []string) error {
  if len(args) != 1 {
    return fmt.Errorf("requires exactly 1 arg")
  }
}

// ✅ Built-in validator
cmd := &cobra.Command{
  Use:  "get [name]",
  Args: cobra.ExactArgs(1),
  RunE: func(cmd *cobra.Command, args []string) error {
    name := args[0] // guaranteed to exist
  },
}`,
      'https://pkg.go.dev/github.com/spf13/cobra#Command', now, now);

    insertAP.run(crypto.randomUUID(), cobra, 'Binding flags in init() instead of a dedicated function',
      'Using Go\'s init() to bind cobra flags scatters flag definitions across files and makes them hard to find.',
      'init() runs at import time, making flag registration implicit and order-dependent. It also makes testing harder since you cannot control when init() runs.',
      'Bind flags in a named function called explicitly from main or the parent command setup.',
      'medium', '>=1.0.0',
      `// ❌ Hidden in init()
func init() {
  rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")
  rootCmd.AddCommand(serveCmd)
}`,
      `// ✅ Explicit setup function
func newRootCmd() *cobra.Command {
  cmd := &cobra.Command{Use: "myapp"}
  cmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")
  cmd.AddCommand(newServeCmd())
  return cmd
}

func main() {
  if err := newRootCmd().Execute(); err != nil {
    os.Exit(1)
  }
}`,
      'https://pkg.go.dev/github.com/spf13/cobra#Command', now, now);

    console.log('✓ cobra: 3 BPs, 1 AP');

    // ================================================================
    // VIPER - BEST PRACTICES (3) + ANTI-PATTERNS (2)
    // ================================================================
    insertBP.run(crypto.randomUUID(), viper, 'Call SetDefault before ReadInConfig for all required keys',
      'SetDefault documents what keys your application expects and provides fallback values. Without defaults, missing config keys silently return zero values, causing subtle bugs.',
      'best-practice', 'medium', '>=1.0.0',
      `// ✅ Set defaults first
viper.SetDefault("server.port", 8080)
viper.SetDefault("server.read_timeout", "15s")
viper.SetDefault("log.level", "info")

// Then read config file (overrides defaults)
if err := viper.ReadInConfig(); err != nil {
  if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
    log.Fatal(err) // real error, not just missing file
  }
}`,
      'https://pkg.go.dev/github.com/spf13/viper#SetDefault', now, now);

    insertBP.run(crypto.randomUUID(), viper, 'Use AutomaticEnv with SetEnvPrefix for 12-factor config',
      'AutomaticEnv makes viper check environment variables for every Get call. SetEnvPrefix avoids collisions with other apps. Together they enable 12-factor app configuration.',
      'best-practice', 'medium', '>=1.0.0',
      `viper.SetEnvPrefix("MYAPP")   // MYAPP_SERVER_PORT
viper.AutomaticEnv()
viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

// Now viper.GetInt("server.port") checks:
// 1. Flag override
// 2. MYAPP_SERVER_PORT env var
// 3. Config file value
// 4. Default`,
      'https://pkg.go.dev/github.com/spf13/viper#AutomaticEnv', now, now);

    insertBP.run(crypto.randomUUID(), viper, 'Use BindPFlags to connect cobra flags to viper config',
      'BindPFlags makes cobra flags the highest-priority config source, so CLI flags override env vars and config files.',
      'best-practice', 'medium', '>=1.0.0',
      `serveCmd := &cobra.Command{
  Use: "serve",
  PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
    return viper.BindPFlags(cmd.Flags())
  },
}
serveCmd.Flags().Int("port", 8080, "server port")

// Now viper.GetInt("port") respects:
// --port flag > MYAPP_PORT env > config file > default`,
      'https://pkg.go.dev/github.com/spf13/viper#BindPFlags', now, now);

    insertAP.run(crypto.randomUUID(), viper, 'Ignoring ReadInConfig errors',
      'Silently ignoring all errors from viper.ReadInConfig.',
      'ReadInConfig can fail for reasons beyond "file not found" — permission errors, YAML/JSON syntax errors, or I/O issues. Ignoring these means running with partial or no configuration silently.',
      'Check the error type. ConfigFileNotFoundError is often acceptable; other errors should be fatal.',
      'high', '>=1.0.0',
      `// ❌ All errors silently ignored
viper.ReadInConfig() // no error check`,
      `// ✅ Distinguish missing file from real errors
if err := viper.ReadInConfig(); err != nil {
  if _, ok := err.(viper.ConfigFileNotFoundError); ok {
    log.Warn("no config file found, using defaults")
  } else {
    log.Fatalf("config error: %v", err)
  }
}`,
      'https://pkg.go.dev/github.com/spf13/viper#ReadInConfig', now, now);

    insertAP.run(crypto.randomUUID(), viper, 'Storing secrets in viper config files',
      'Putting database passwords, API keys, or tokens in config files managed by viper.',
      'Config files are often committed to git, logged, or included in container images. Secrets in config files are easily leaked and hard to rotate.',
      'Use environment variables for secrets (viper.AutomaticEnv reads them). For production, use a secrets manager and inject via env vars.',
      'critical', '>=1.0.0',
      `# ❌ config.yaml with secrets
database:
  password: "s3cret!"
api:
  key: "sk-abc123"`,
      `# ✅ Config file — no secrets
database:
  host: "localhost"
  port: 5432

# Secrets via env vars
# MYAPP_DATABASE_PASSWORD=s3cret!
# MYAPP_API_KEY=sk-abc123`,
      'https://12factor.net/config', now, now);

    console.log('✓ viper: 3 BPs, 2 APs');

    // ================================================================
    // TESTIFY - BEST PRACTICES (3) + ANTI-PATTERNS (2)
    // ================================================================
    insertBP.run(crypto.randomUUID(), testify, 'Use require for setup and fatal conditions, assert for checks',
      'require functions stop the test immediately on failure (like t.Fatal). assert functions record the failure but continue (like t.Error). Use require for preconditions where continuing makes no sense.',
      'best-practice', 'high', '>=1.0.0',
      `func TestUser(t *testing.T) {
  // ✅ require — stop if setup fails
  user, err := createTestUser()
  require.NoError(t, err)
  require.NotNil(t, user)

  // ✅ assert — check multiple properties
  assert.Equal(t, "Alice", user.Name)
  assert.True(t, user.Active)
  assert.WithinDuration(t, time.Now(), user.CreatedAt, time.Second)
}`,
      'https://pkg.go.dev/github.com/stretchr/testify/require', now, now);

    insertBP.run(crypto.randomUUID(), testify, 'Use suite.Suite for complex test fixtures with setup/teardown',
      'testify/suite provides struct-based test organization with SetupTest, TearDownTest, SetupSuite, and TearDownSuite methods. Use it when multiple tests share expensive setup.',
      'best-practice', 'medium', '>=1.0.0',
      `type UserServiceSuite struct {
  suite.Suite
  db   *sql.DB
  svc  *UserService
}

func (s *UserServiceSuite) SetupSuite() {
  s.db = setupTestDB()
  s.svc = NewUserService(s.db)
}

func (s *UserServiceSuite) TearDownSuite() {
  s.db.Close()
}

func (s *UserServiceSuite) TestCreateUser() {
  user, err := s.svc.Create("Alice")
  s.Require().NoError(err)
  s.Equal("Alice", user.Name)
}

func TestUserService(t *testing.T) {
  suite.Run(t, new(UserServiceSuite))
}`,
      'https://pkg.go.dev/github.com/stretchr/testify/suite', now, now);

    insertBP.run(crypto.randomUUID(), testify, 'Use mock.AssertExpectations to verify all expected calls were made',
      'After running code under test, call AssertExpectations(t) on your mock to verify all .On() expectations were fulfilled. Without this, missing calls go undetected.',
      'best-practice', 'high', '>=1.0.0',
      `type MockStore struct {
  mock.Mock
}

func (m *MockStore) Save(user User) error {
  args := m.Called(user)
  return args.Error(0)
}

func TestHandler(t *testing.T) {
  store := new(MockStore)
  store.On("Save", mock.AnythingOfType("User")).Return(nil)

  handler := NewHandler(store)
  handler.CreateUser("Alice")

  // ✅ Verify Save was actually called
  store.AssertExpectations(t)
}`,
      'https://pkg.go.dev/github.com/stretchr/testify/mock#Mock.AssertExpectations', now, now);

    insertAP.run(crypto.randomUUID(), testify, 'Wrong argument order in assert.Equal',
      'Passing the actual value as the first argument and expected as the second to assert.Equal.',
      'assert.Equal(t, expected, actual) — the first value after t is "expected". Swapping them produces confusing failure messages: "expected: <actual>, got: <expected>".',
      'Remember: assert.Equal(t, expected, actual). Expected comes first.',
      'medium', '>=1.0.0',
      `// ❌ Wrong order — confusing failure messages
assert.Equal(t, user.Name, "Alice")
// Failure: expected: "Bob", got: "Alice" (backwards!)`,
      `// ✅ Correct order: expected, actual
assert.Equal(t, "Alice", user.Name)
// Failure: expected: "Alice", got: "Bob" (clear!)`,
      'https://pkg.go.dev/github.com/stretchr/testify/assert#Equal', now, now);

    insertAP.run(crypto.randomUUID(), testify, 'Using assert when require is needed for preconditions',
      'Using assert (non-fatal) for setup steps that must succeed for the rest of the test to make sense.',
      'If setup fails with assert, the test continues and produces cascading nil-pointer panics or misleading failures that obscure the real problem.',
      'Use require for any step where failure should stop the test immediately.',
      'high', '>=1.0.0',
      `// ❌ Test panics on user.Name if err != nil
assert.NoError(t, err)
assert.Equal(t, "Alice", user.Name) // panic if user is nil`,
      `// ✅ Stop immediately if precondition fails
require.NoError(t, err)
require.NotNil(t, user)
assert.Equal(t, "Alice", user.Name)`,
      'https://pkg.go.dev/github.com/stretchr/testify/require', now, now);

    console.log('✓ testify: 3 BPs, 2 APs');

    // ================================================================
    // GORM V2 - BEST PRACTICES (3) + ANTI-PATTERNS (2)
    // ================================================================
    insertBP.run(crypto.randomUUID(), gorm, 'Use Preload to avoid N+1 queries',
      'When accessing associations, GORM lazy-loads by default, executing a separate query for each parent record. Use Preload to eager-load associations in a single query.',
      'performance', 'high', '>=2.0.0',
      `// ❌ N+1 queries — 1 for users + N for orders
var users []User
db.Find(&users)
for _, u := range users {
  db.Model(&u).Association("Orders").Find(&u.Orders)
}

// ✅ Single query with Preload
var users []User
db.Preload("Orders").Find(&users)`,
      'https://gorm.io/docs/preload.html', now, now);

    insertBP.run(crypto.randomUUID(), gorm, 'Use db.Transaction for multi-step operations',
      'GORM\'s Transaction method handles Begin, Commit, and Rollback automatically. It rolls back on error or panic, preventing partial writes.',
      'best-practice', 'high', '>=2.0.0',
      `// ✅ Automatic rollback on error or panic
err := db.Transaction(func(tx *gorm.DB) error {
  if err := tx.Create(&user).Error; err != nil {
    return err // triggers rollback
  }
  if err := tx.Create(&auditLog).Error; err != nil {
    return err // triggers rollback
  }
  return nil // commit
})`,
      'https://gorm.io/docs/transactions.html', now, now);

    insertBP.run(crypto.randomUUID(), gorm, 'Always check db.Error after operations',
      'GORM chains methods and stores errors internally. Always check .Error after the final operation. Unchecked errors silently produce empty results or partial writes.',
      'best-practice', 'high', '>=2.0.0',
      `// ❌ Error silently ignored
var user User
db.Where("email = ?", email).First(&user)

// ✅ Check error
result := db.Where("email = ?", email).First(&user)
if result.Error != nil {
  if errors.Is(result.Error, gorm.ErrRecordNotFound) {
    return nil, ErrUserNotFound
  }
  return nil, result.Error
}`,
      'https://gorm.io/docs/error_handling.html', now, now);

    insertAP.run(crypto.randomUUID(), gorm, 'Using db.Model with wrong receiver in updates',
      'Calling db.Save or db.Updates on a zero-value struct or without specifying a WHERE clause.',
      'Without a primary key or WHERE clause, GORM may update all rows in the table or insert a duplicate. db.Save on a zero-ID struct silently inserts instead of updating.',
      'Always ensure the struct has a non-zero primary key for Save, or use explicit Where clauses with Updates.',
      'high', '>=2.0.0',
      `// ❌ Zero ID — inserts a new record instead of updating!
user := User{Name: "Alice"}
db.Save(&user) // INSERT, not UPDATE`,
      `// ✅ Fetch first, then save
var user User
db.First(&user, userID)
user.Name = "Alice"
db.Save(&user) // UPDATE with correct ID

// ✅ Or use Updates with Where
db.Model(&User{}).Where("id = ?", userID).Updates(User{Name: "Alice"})`,
      'https://gorm.io/docs/update.html', now, now);

    insertAP.run(crypto.randomUUID(), gorm, 'Using raw string interpolation in GORM queries',
      'Building query strings with fmt.Sprintf or string concatenation instead of using GORM\'s parameterized queries.',
      'String interpolation in SQL queries enables SQL injection attacks. GORM\'s Where clause with ? placeholders properly escapes values.',
      'Always use parameterized queries with ? placeholders or named arguments.',
      'critical', '>=2.0.0',
      `// ❌ SQL injection vulnerability
db.Where(fmt.Sprintf("name = '%s'", userInput)).Find(&users)`,
      `// ✅ Parameterized query
db.Where("name = ?", userInput).Find(&users)

// ✅ Or struct-based
db.Where(&User{Name: userInput}).Find(&users)`,
      'https://gorm.io/docs/security.html', now, now);

    console.log('✓ gorm v2: 3 BPs, 2 APs');

    // ================================================================
    // GORM V1 (jinzhu/gorm) - ANTI-PATTERNS (1)
    // ================================================================
    insertAP.run(crypto.randomUUID(), gormOld, 'Migrate from jinzhu/gorm to gorm.io/gorm v2',
      'github.com/jinzhu/gorm (GORM v1) is unmaintained. The project moved to gorm.io/gorm.',
      'GORM v1 has known bugs, no security patches, and poor performance compared to v2. v2 has a rewritten codebase with context support, batch operations, prepared statement caching, and proper error handling.',
      'Follow the GORM v2 migration guide. Key changes: import path, driver packages, and error handling patterns.',
      'high', '>=1.0.0',
      `// ❌ Deprecated
import "github.com/jinzhu/gorm"
import _ "github.com/jinzhu/gorm/dialects/postgres"

db, err := gorm.Open("postgres", connStr)`,
      `// ✅ GORM v2
import "gorm.io/gorm"
import "gorm.io/driver/postgres"

db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{})`,
      'https://gorm.io/docs/v2_release_note.html', now, now);

    console.log('✓ jinzhu/gorm: 1 AP');

    // Update metadata
    const libCount = (db.prepare('SELECT COUNT(*) as count FROM libraries').get() as { count: number }).count;
    const bpCount = (db.prepare('SELECT COUNT(*) as count FROM best_practices').get() as { count: number }).count;
    const apCount = (db.prepare('SELECT COUNT(*) as count FROM anti_patterns').get() as { count: number }).count;
    const saCount = (db.prepare('SELECT COUNT(*) as count FROM security_advisories').get() as { count: number }).count;

    db.prepare(`
      INSERT INTO export_metadata (export_date, total_libraries, total_best_practices, total_anti_patterns, total_security_advisories, source_database, version)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(now, libCount, bpCount, apCount, saCount, 'manual-go-extended-seed', '0.1.0');

    console.log(`\n✓ Updated metadata: ${libCount} libs, ${bpCount} BPs, ${apCount} APs, ${saCount} SAs`);
  });

  transaction();
  db.close();
  console.log('\n✅ Go extended seed complete!');
}

seedGoExtended();
