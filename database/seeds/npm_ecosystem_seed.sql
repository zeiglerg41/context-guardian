-- Context Guardian - NPM Ecosystem Seed Data
-- Auto-generated from data/ecosystems/npm.yaml
-- Do not edit manually — edit the YAML source instead.

-- Insert libraries
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES
    ('react', 'npm', 'https://react.dev', 'https://github.com/facebook/react', 'A JavaScript library for building user interfaces'),
    ('next', 'npm', 'https://nextjs.org/docs', 'https://github.com/vercel/next.js', 'The React Framework for Production'),
    ('express', 'npm', 'https://expressjs.com', 'https://github.com/expressjs/express', 'Fast, unopinionated, minimalist web framework for Node.js')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    lib_0_id UUID;
    lib_1_id UUID;
    lib_2_id UUID;
BEGIN
    SELECT id INTO lib_0_id FROM libraries WHERE name = 'react';
    SELECT id INTO lib_1_id FROM libraries WHERE name = 'next';
    SELECT id INTO lib_2_id FROM libraries WHERE name = 'express';

    -- react
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
        'Use automatic batching in React 18+',
        'React 18 automatically batches state updates in event handlers, timeouts, and promises. You no longer need to wrap updates in unstable_batchedUpdates.',
        'performance',
        'medium',
        '>=18.0.0',
        E'// React 18+ - automatic batching\nfunction handleClick() {\n  setCount(c => c + 1);\n  setFlag(f => !f);\n  // Both updates batched automatically\n}',
        'https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
        'Avoid useId() in React versions below 18.3',
        'The useId() hook was added in React 18.3. If you''re on an earlier version, use a custom ID generation solution or upgrade.',
        'best-practice',
        'low',
        '>=18.0.0 <18.3.0',
        E'// Don''t use in React <18.3\n// const id = useId(); // ❌\n\n// Use custom solution instead\nconst id = useMemo(() => Math.random().toString(36), []);',
        'https://react.dev/reference/react/useId'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
        'Prefer useTransition for non-urgent updates',
        'Use startTransition to mark state updates as non-urgent, allowing React to keep the UI responsive during heavy renders.',
        'performance',
        'medium',
        '>=18.0.0',
        E'const [isPending, startTransition] = useTransition();\n\nfunction handleChange(value) {\n  startTransition(() => {\n    setSearchQuery(value); // Non-urgent update\n  });\n}',
        'https://react.dev/reference/react/useTransition'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
        'Avoid string refs (deprecated)',
        'String refs are deprecated and will be removed. Use callback refs or useRef instead.',
        'deprecation',
        'high',
        '<18.0.0',
        E'// ❌ Don''t use string refs\n<div ref="myDiv" />\n\n// ✅ Use callback ref or useRef\nconst myRef = useRef();\n<div ref={myRef} />',
        'https://react.dev/reference/react/Component#refs'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_0_id,
        'Always use keys in lists',
        'When rendering lists, always provide a unique key prop to help React identify which items have changed, added, or removed.',
        'best-practice',
        'high',
        '>=16.0.0',
        E'// ✅ Good\nitems.map(item => <Item key={item.id} {...item} />)\n\n// ❌ Bad\nitems.map(item => <Item {...item} />)',
        'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_0_id,
        'Prop Drilling',
        'Passing props through multiple levels of components that don''t use them, just to reach a deeply nested child.',
        'Makes components tightly coupled, harder to refactor, and pollutes intermediate components with irrelevant props.',
        'Use Context API for global state, or component composition to avoid deep nesting.',
        'medium',
        '>=16.3.0',
        E'// ❌ Prop drilling\nfunction App() {\n  const user = {name: "Alice"};\n  return <Parent user={user} />;\n}\nfunction Parent({user}) {\n  return <Child user={user} />;\n}\nfunction Child({user}) {\n  return <GrandChild user={user} />;\n}',
        E'// ✅ Use Context\nconst UserContext = createContext();\n\nfunction App() {\n  const user = {name: "Alice"};\n  return (\n    <UserContext.Provider value={user}>\n      <Parent />\n    </UserContext.Provider>\n  );\n}\nfunction GrandChild() {\n  const user = useContext(UserContext);\n  return <div>{user.name}</div>;\n}',
        'https://react.dev/learn/passing-data-deeply-with-context'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_0_id,
        'Mutating State Directly',
        'Modifying state objects or arrays directly instead of creating new references.',
        'React relies on immutability to detect changes. Direct mutations won''t trigger re-renders.',
        'Always create new objects/arrays when updating state.',
        'high',
        '>=16.0.0',
        E'// ❌ Mutating state\nconst [items, setItems] = useState([1, 2, 3]);\nitems.push(4); // Direct mutation\nsetItems(items); // Won''t re-render!',
        E'// ✅ Create new array\nconst [items, setItems] = useState([1, 2, 3]);\nsetItems([...items, 4]); // New reference',
        'https://react.dev/learn/updating-objects-in-state'
    );

    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (
        lib_0_id,
        'CVE-2018-6341',
        'XSS via attribute name in SSR',
        'React before 16.4.2 allows attackers to inject arbitrary attributes via a crafted attribute name on a server-rendered page. When using server-side rendering, an attacker can supply a malicious attribute name that bypasses the attribute whitelist.',
        'high',
        '>=16.0.0 <16.4.2',
        '16.4.2',
        'https://nvd.nist.gov/vuln/detail/CVE-2018-6341',
        '2018-08-03 00:00:00+00'
    );

    -- next
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_1_id,
        'Use Server Components by default in App Router',
        'In Next.js 13+ App Router, components are Server Components by default. Only add "use client" when you need interactivity, browser APIs, or hooks.',
        'performance',
        'high',
        '>=13.0.0',
        E'// ✅ Server Component (default)\nexport default function Page() {\n  const data = await fetchData(); // Can fetch directly\n  return <div>{data}</div>;\n}\n\n// Only use "use client" when needed\n"use client";\nexport function InteractiveButton() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}',
        'https://nextjs.org/docs/app/building-your-application/rendering/server-components'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_1_id,
        'Avoid mixing Pages Router and App Router patterns',
        'Next.js 13+ supports both routers, but mixing them creates confusion. Choose one routing paradigm per project.',
        'maintainability',
        'medium',
        '>=13.0.0',
        E'// ❌ Don''t mix\n// /pages/index.js (Pages Router)\n// /app/about/page.js (App Router)\n\n// ✅ Pick one\n// Either use /app for everything (recommended)\n// Or stay on /pages until ready to migrate',
        'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_1_id,
        'Use getStaticProps for static generation',
        'For pages that can be pre-rendered at build time, use getStaticProps instead of getServerSideProps to improve performance.',
        'performance',
        'high',
        '>=9.3.0 <13.0.0',
        E'export async function getStaticProps() {\n  const data = await fetchData();\n  return { props: { data }, revalidate: 60 };\n}',
        'https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_1_id,
        'Client-side data fetching in Server Components',
        'Using useEffect to fetch data in a Server Component (App Router).',
        'Server Components can fetch data directly during render. Using useEffect forces client-side fetching, losing SSR benefits.',
        'Fetch data directly in the Server Component using async/await.',
        'high',
        '>=13.0.0',
        E'// ❌ Don''t use useEffect in Server Components\n"use client";\nexport default function Page() {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch("/api/data").then(r => r.json()).then(setData);\n  }, []);\n  return <div>{data}</div>;\n}',
        E'// ✅ Fetch directly (Server Component)\nexport default async function Page() {\n  const data = await fetch("/api/data").then(r => r.json());\n  return <div>{data}</div>;\n}',
        'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_1_id,
        'Not optimizing images with next/image',
        'Using standard <img> tags instead of Next.js Image component.',
        'Misses automatic optimization, lazy loading, and responsive sizing. Hurts performance and Core Web Vitals.',
        'Use next/image for all images.',
        'medium',
        '>=10.0.0',
        E'// ❌ Standard img tag\n<img src="/photo.jpg" alt="Photo" />',
        E'// ✅ Use next/image\nimport Image from "next/image";\n<Image src="/photo.jpg" alt="Photo" width={500} height={300} />',
        'https://nextjs.org/docs/app/building-your-application/optimizing/images'
    );

    -- express
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        lib_2_id,
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
        lib_2_id,
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
        lib_2_id,
        'Always handle async errors in route handlers',
        'Express doesn''t catch errors in async route handlers by default. Wrap in try-catch or use express-async-errors.',
        'best-practice',
        'high',
        '>=4.0.0',
        E'// ✅ Proper error handling\napp.get("/data", async (req, res, next) => {\n  try {\n    const data = await fetchData();\n    res.json(data);\n  } catch (err) {\n    next(err); // Pass to error handler\n  }\n});',
        'https://expressjs.com/en/guide/error-handling.html'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        lib_2_id,
        'Not using environment variables for config',
        'Hardcoding configuration values like ports, API keys, or database URLs directly in code.',
        'Exposes secrets in version control, makes it impossible to change config without code changes.',
        'Use environment variables with dotenv or process.env.',
        'high',
        '>=4.0.0',
        E'// ❌ Hardcoded\nconst PORT = 3000;\nconst DB_URL = "mongodb://localhost:27017/mydb";',
        E'// ✅ Environment variables\nrequire("dotenv").config();\nconst PORT = process.env.PORT || 3000;\nconst DB_URL = process.env.DATABASE_URL;',
        'https://expressjs.com/en/advanced/best-practice-performance.html'
    );

END $$;
