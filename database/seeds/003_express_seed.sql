-- Context Guardian - Express.js Seed Data
-- Manually curated best practices for Express

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'express',
    'npm',
    'https://expressjs.com',
    'https://github.com/expressjs/express',
    'Fast, unopinionated, minimalist web framework for Node.js'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    express_id UUID;
BEGIN
    SELECT id INTO express_id FROM libraries WHERE name = 'express';

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        express_id,
        'Always use helmet for security headers',
        'Helmet helps secure Express apps by setting various HTTP headers to prevent common vulnerabilities.',
        'security',
        'critical',
        '>=4.0.0',
        E'const helmet = require("helmet");\napp.use(helmet());',
        'https://expressjs.com/en/advanced/best-practice-security.html'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        express_id,
        'Use express.json() instead of body-parser',
        'Express 4.16+ includes built-in body parsing. No need for the separate body-parser package.',
        'best-practice',
        'low',
        '>=4.16.0',
        E'// ✅ Built-in (Express 4.16+)\napp.use(express.json());\napp.use(express.urlencoded({ extended: true }));\n\n// ❌ Unnecessary\nconst bodyParser = require("body-parser");',
        'https://expressjs.com/en/4x/api.html#express.json'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        express_id,
        'Always handle async errors in route handlers',
        'Express doesn''t catch errors in async route handlers by default. Wrap in try-catch or use express-async-errors.',
        'best-practice',
        'high',
        '>=4.0.0',
        E'// ✅ Proper error handling\napp.get("/data", async (req, res, next) => {\n  try {\n    const data = await fetchData();\n    res.json(data);\n  } catch (err) {\n    next(err); // Pass to error handler\n  }\n});',
        'https://expressjs.com/en/guide/error-handling.html'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        express_id,
        'Not using environment variables for config',
        'Hardcoding configuration values like ports, API keys, or database URLs directly in code.',
        'Exposes secrets in version control, makes it impossible to change config without code changes.',
        'Use environment variables with dotenv or process.env.',
        '>=4.0.0',
        E'// ❌ Hardcoded\nconst PORT = 3000;\nconst DB_URL = "mongodb://localhost:27017/mydb";',
        E'// ✅ Environment variables\nrequire("dotenv").config();\nconst PORT = process.env.PORT || 3000;\nconst DB_URL = process.env.DATABASE_URL;',
        'https://expressjs.com/en/advanced/best-practice-performance.html'
    );

END $$;
