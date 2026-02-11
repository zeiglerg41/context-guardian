# Technical Stack Research for Context Guardian

## 1. CLI Tool Development

### Language Options:

- **Go**: Fast compile times, single binary deployment, excellent for CLI tools, cross-platform support
- **Rust**: Maximum performance, memory safety, but steeper learning curve
- **TypeScript/Node.js**: Familiar to web developers, npm ecosystem, easy distribution via npm

### Recommendation: **TypeScript/Node.js**

**Why**:

- Target audience (web developers) already familiar with npm/node ecosystem
- Easy distribution: `npm install -g context-guardian`
- Rich ecosystem of parsing libraries
- Fast iteration during development
- Cross-platform by default

### CLI Frameworks:

- **Commander.js** or **Yargs** for argument parsing
- **Inquirer.js** for interactive prompts
- **Chalk** for colored output
- **Ora** for spinners/progress indicators

## 2. Code Analysis Engine

### AST Parsing: **Tree-sitter**

**Why Tree-sitter**:

- Supports 40+ languages with single interface
- Incremental parsing (updates in <1ms for large files)
- Error-tolerant (works with incomplete/invalid code)
- Used by GitHub, Atom, Neovim - battle-tested
- Unified Symbol Protocol for cross-language analysis

**Key Capabilities**:

- Function/class/variable definitions extraction
- Reference tracking (who uses what)
- Scope resolution (local vs global)
- Import/dependency detection
- Pattern recognition across languages

**Implementation**:

```typescript
import Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";
import Python from "tree-sitter-python";
import TypeScript from "tree-sitter-typescript";

// Parse code and extract patterns
const parser = new Parser();
parser.setLanguage(JavaScript);
const tree = parser.parse(sourceCode);
```

### Dependency Analysis:

- **npm**: Parse `package.json`, `package-lock.json`
- **Python**: Parse `requirements.txt`, `pyproject.toml`, `Pipfile`
- **Ruby**: Parse `Gemfile`, `Gemfile.lock`
- **Go**: Parse `go.mod`
- **Rust**: Parse `Cargo.toml`

Use existing parsers rather than building from scratch.

## 3. IDE Integration

### VS Code Extension (Primary Target)

**Tech Stack**: TypeScript + VS Code Extension API

**Why VS Code First**:

- 75%+ market share among developers
- Excellent extension API
- Built-in support for context injection
- Easy to publish to marketplace

**Key Features**:

- File watcher for dependency changes
- Automatic `.guardian.md` regeneration
- Status bar indicator
- Command palette integration

### Cursor Support

**Approach**: Leverage `.cursorrules` compatibility

- Generate `.guardian.md` in format compatible with Cursor's rules system
- No separate extension needed initially

### Future: JetBrains, Vim/Neovim plugins

## 4. Cloud Best Practices Database

### Database: **PostgreSQL** (managed via Supabase or AWS RDS)

**Why**:

- Structured data with relationships
- Full-text search capabilities
- JSON support for flexible schema
- Mature, reliable, well-documented

### Schema Design:

```sql
-- Frameworks/Libraries
CREATE TABLE libraries (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  ecosystem VARCHAR(50), -- npm, pypi, crates.io, etc.
  latest_version VARCHAR(50),
  created_at TIMESTAMP
);

-- Version-specific best practices
CREATE TABLE best_practices (
  id UUID PRIMARY KEY,
  library_id UUID REFERENCES libraries(id),
  version_range VARCHAR(100), -- e.g., ">=18.0.0 <19.0.0"
  category VARCHAR(50), -- security, performance, patterns, etc.
  title TEXT,
  content TEXT,
  severity VARCHAR(20), -- critical, high, medium, low
  source_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Anti-patterns
CREATE TABLE anti_patterns (
  id UUID PRIMARY KEY,
  library_id UUID REFERENCES libraries(id),
  version_range VARCHAR(100),
  pattern_description TEXT,
  why_avoid TEXT,
  alternative TEXT,
  created_at TIMESTAMP
);
```

### Data Sources (Automated Crawling):

- Official documentation (React docs, Next.js docs, etc.)
- Security advisories (npm audit, Snyk, CVE databases)
- GitHub issues/discussions (common pitfalls)
- Community best practices (awesome-\* lists)

### Update Mechanism:

- Scheduled jobs (daily/weekly) to check for new versions
- Webhook subscriptions to package registries
- Community contributions (moderated)

## 5. API Layer

### Backend: **Node.js + Express** or **Bun + Hono**

**Why**:

- Same language as CLI (code sharing)
- Fast development
- Excellent ecosystem

**Endpoints**:

```
GET /api/v1/best-practices?library=react&version=19.0.0
GET /api/v1/patterns?stack=nextjs,typescript,tailwind
POST /api/v1/analyze (upload codebase snapshot for pattern analysis)
```

### Authentication:

- API keys for CLI tool
- Rate limiting (generous free tier, paid for heavy usage)

## 6. Deployment & Infrastructure

### CLI Tool:

- **Distribution**: npm registry
- **Updates**: Automatic version checking, prompt user to upgrade

### Cloud Services:

- **API Hosting**: Fly.io or Railway (always-on server) to eliminate cold start latency
- **Database**: Supabase (PostgreSQL) for managed database with generous free tier
- **Caching**: Upstash Redis for playbook caching (24hr TTL)
- **Marketing Site**: Vercel (static site, serverless is fine here)
- **Alternative for Scale**: Self-hosted PostgreSQL with read replicas

### Monitoring:

- **Error tracking**: Sentry
- **Analytics**: PostHog or Mixpanel
- **Logging**: Structured logs with Winston

## 7. Tech Stack Summary

| Component        | Technology               | Rationale                                              |
| ---------------- | ------------------------ | ------------------------------------------------------ |
| CLI Tool         | TypeScript + Node.js     | Familiar to target audience, easy distribution via npm |
| Code Analysis    | Tree-sitter              | Multi-language AST parsing, fast, error-tolerant       |
| IDE Extension    | TypeScript + VS Code API | Largest market share, excellent API                    |
| API Backend      | Node.js + Hono/Express   | Code sharing with CLI, fast development                |
| API Hosting      | Fly.io / Railway         | Always-on server, no cold starts, predictable latency  |
| Database         | PostgreSQL (Supabase)    | Structured data, full-text search, managed service     |
| Caching          | Redis (Upstash)          | Fast playbook caching, reduces DB load                 |
| Offline Fallback | SQLite (bundled)         | Works offline, top 100 libraries included              |
| Monitoring       | Sentry + PostHog         | Error tracking + product analytics                     |
