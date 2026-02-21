-- Context Guardian - React Seed Data
-- Manually curated best practices for React (top priority library)

-- Insert React library metadata
INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'react',
    'npm',
    'https://react.dev',
    'https://github.com/facebook/react',
    'A JavaScript library for building user interfaces'
) ON CONFLICT (name) DO NOTHING;

-- Get the library ID for React (for use in subsequent inserts)
DO $$
DECLARE
    react_id UUID;
BEGIN
    SELECT id INTO react_id FROM libraries WHERE name = 'react';

    -- ========================================================================
    -- BEST PRACTICES
    -- ========================================================================

    -- React 18+ Concurrent Features
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
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
        react_id,
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
        react_id,
        'Prefer useTransition for non-urgent updates',
        'Use startTransition to mark state updates as non-urgent, allowing React to keep the UI responsive during heavy renders.',
        'performance',
        'medium',
        '>=18.0.0',
        E'const [isPending, startTransition] = useTransition();\n\nfunction handleChange(value) {\n  startTransition(() => {\n    setSearchQuery(value); // Non-urgent update\n  });\n}',
        'https://react.dev/reference/react/useTransition'
    );

    -- React 17 and below
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        react_id,
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
        react_id,
        'Always use keys in lists',
        'When rendering lists, always provide a unique key prop to help React identify which items have changed, added, or removed.',
        'best-practice',
        'high',
        '>=16.0.0',
        E'// ✅ Good\nitems.map(item => <Item key={item.id} {...item} />)\n\n// ❌ Bad\nitems.map(item => <Item {...item} />)',
        'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key'
    );

    -- ========================================================================
    -- ANTI-PATTERNS
    -- ========================================================================

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        react_id,
        'Prop Drilling',
        'Passing props through multiple levels of components that don''t use them, just to reach a deeply nested child.',
        'Makes components tightly coupled, harder to refactor, and pollutes intermediate components with irrelevant props.',
        'Use Context API for global state, or component composition to avoid deep nesting.',
        '>=16.3.0',
        E'// ❌ Prop drilling\nfunction App() {\n  const user = {name: "Alice"};\n  return <Parent user={user} />;\n}\nfunction Parent({user}) {\n  return <Child user={user} />;\n}\nfunction Child({user}) {\n  return <GrandChild user={user} />;\n}',
        E'// ✅ Use Context\nconst UserContext = createContext();\n\nfunction App() {\n  const user = {name: "Alice"};\n  return (\n    <UserContext.Provider value={user}>\n      <Parent />\n    </UserContext.Provider>\n  );\n}\nfunction GrandChild() {\n  const user = useContext(UserContext);\n  return <div>{user.name}</div>;\n}',
        'https://react.dev/learn/passing-data-deeply-with-context'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        react_id,
        'Mutating State Directly',
        'Modifying state objects or arrays directly instead of creating new references.',
        'React relies on immutability to detect changes. Direct mutations won''t trigger re-renders.',
        'Always create new objects/arrays when updating state.',
        '>=16.0.0',
        E'// ❌ Mutating state\nconst [items, setItems] = useState([1, 2, 3]);\nitems.push(4); // Direct mutation\nsetItems(items); // Won''t re-render!',
        E'// ✅ Create new array\nconst [items, setItems] = useState([1, 2, 3]);\nsetItems([...items, 4]); // New reference',
        'https://react.dev/learn/updating-objects-in-state'
    );

    -- ========================================================================
    -- SECURITY ADVISORIES (Example)
    -- ========================================================================

    INSERT INTO security_advisories (library_id, cve_id, title, description, severity, affected_versions, fixed_in_version, source_url, published_at)
    VALUES (
        react_id,
        'CVE-2018-6341',
        'XSS via attribute name in SSR',
        'React before 16.4.2 allows attackers to inject arbitrary attributes via a crafted attribute name on a server-rendered page. When using server-side rendering, an attacker can supply a malicious attribute name that bypasses the attribute whitelist.',
        'high',
        '>=16.0.0 <16.4.2',
        '16.4.2',
        'https://nvd.nist.gov/vuln/detail/CVE-2018-6341',
        '2018-08-03 10:00:00+00'
    );

END $$;
-- Context Guardian - Next.js Seed Data
-- Manually curated best practices for Next.js

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'next',
    'npm',
    'https://nextjs.org/docs',
    'https://github.com/vercel/next.js',
    'The React Framework for Production'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    next_id UUID;
BEGIN
    SELECT id INTO next_id FROM libraries WHERE name = 'next';

    -- App Router (Next.js 13+)
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        next_id,
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
        next_id,
        'Avoid mixing Pages Router and App Router patterns',
        'Next.js 13+ supports both routers, but mixing them creates confusion. Choose one routing paradigm per project.',
        'maintainability',
        'medium',
        '>=13.0.0',
        E'// ❌ Don''t mix\n// /pages/index.js (Pages Router)\n// /app/about/page.js (App Router)\n\n// ✅ Pick one\n// Either use /app for everything (recommended)\n// Or stay on /pages until ready to migrate',
        'https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration'
    );

    -- Pages Router (Next.js 12 and below)
    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        next_id,
        'Use getStaticProps for static generation',
        'For pages that can be pre-rendered at build time, use getStaticProps instead of getServerSideProps to improve performance.',
        'performance',
        'high',
        '>=9.3.0 <13.0.0',
        E'export async function getStaticProps() {\n  const data = await fetchData();\n  return { props: { data }, revalidate: 60 };\n}',
        'https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props'
    );

    -- Anti-patterns
    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        next_id,
        'Client-side data fetching in Server Components',
        'Using useEffect to fetch data in a Server Component (App Router).',
        'Server Components can fetch data directly during render. Using useEffect forces client-side fetching, losing SSR benefits.',
        'Fetch data directly in the Server Component using async/await.',
        '>=13.0.0',
        E'// ❌ Don''t use useEffect in Server Components\n"use client";\nexport default function Page() {\n  const [data, setData] = useState(null);\n  useEffect(() => {\n    fetch("/api/data").then(r => r.json()).then(setData);\n  }, []);\n  return <div>{data}</div>;\n}',
        E'// ✅ Fetch directly (Server Component)\nexport default async function Page() {\n  const data = await fetch("/api/data").then(r => r.json());\n  return <div>{data}</div>;\n}',
        'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        next_id,
        'Not optimizing images with next/image',
        'Using standard <img> tags instead of Next.js Image component.',
        'Misses automatic optimization, lazy loading, and responsive sizing. Hurts performance and Core Web Vitals.',
        'Use next/image for all images.',
        '>=10.0.0',
        E'// ❌ Standard img tag\n<img src="/photo.jpg" alt="Photo" />',
        E'// ✅ Use next/image\nimport Image from "next/image";\n<Image src="/photo.jpg" alt="Photo" width={500} height={300} />',
        'https://nextjs.org/docs/app/building-your-application/optimizing/images'
    );

END $$;
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

-- Context Guardian - TypeScript Seed Data

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'typescript',
    'npm',
    'https://www.typescriptlang.org/docs/',
    'https://github.com/microsoft/TypeScript',
    'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    ts_id UUID;
BEGIN
    SELECT id INTO ts_id FROM libraries WHERE name = 'typescript';

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        ts_id,
        'Use satisfies operator for type-safe inference',
        'The satisfies operator (TS 4.9+) validates a value matches a type while preserving the narrower inferred type. Use it instead of type annotations when you want both validation and inference.',
        'best-practice',
        'medium',
        '>=4.9.0',
        E'// ✅ satisfies preserves literal types\nconst config = {\n  width: 100,\n  height: "auto"\n} satisfies Record<string, string | number>;\n// config.width is number, not string | number\n\n// ❌ Type annotation loses narrowing\nconst config2: Record<string, string | number> = {\n  width: 100\n};\n// config2.width is string | number',
        'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        ts_id,
        'Enable strict mode in tsconfig',
        'Enable "strict": true in tsconfig.json to catch more bugs at compile time. This enables strictNullChecks, noImplicitAny, and other important checks.',
        'best-practice',
        'critical',
        '>=2.3.0',
        E'// tsconfig.json\n{\n  "compilerOptions": {\n    "strict": true // Enables all strict type checking\n  }\n}',
        'https://www.typescriptlang.org/tsconfig#strict'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        ts_id,
        'Use const assertions for immutable literals',
        'Use as const to create deeply readonly types and narrow string/number literals.',
        'best-practice',
        'low',
        '>=3.4.0',
        E'// ✅ as const narrows types\nconst COLORS = ["red", "green", "blue"] as const;\n// type: readonly ["red", "green", "blue"]\n\n// ❌ Without as const\nconst COLORS2 = ["red", "green", "blue"];\n// type: string[]',
        'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        ts_id,
        'Overusing any type',
        'Using any to silence type errors instead of properly typing values.',
        'Defeats the purpose of TypeScript — disables all type checking for that value and propagates through the codebase.',
        'Use unknown for truly unknown types and narrow with type guards. Use specific types or generics.',
        'high',
        '>=2.0.0',
        E'// ❌ any everywhere\nfunction process(data: any): any {\n  return data.items.map((x: any) => x.name);\n}',
        E'// ✅ Proper typing\ninterface Data { items: Array<{ name: string }> }\nfunction process(data: Data): string[] {\n  return data.items.map(x => x.name);\n}',
        'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        ts_id,
        'Non-null assertion operator abuse',
        'Using ! (non-null assertion) to bypass null checks instead of handling null properly.',
        'Shifts runtime errors from compile time to runtime. The value could actually be null/undefined, causing crashes.',
        'Use optional chaining, nullish coalescing, or proper null guards.',
        'medium',
        '>=2.0.0',
        E'// ❌ Non-null assertion\nconst name = user!.profile!.name!;',
        E'// ✅ Safe access\nconst name = user?.profile?.name ?? "Unknown";',
        'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-'
    );

END $$;

-- Context Guardian - Vue.js Seed Data

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'vue',
    'npm',
    'https://vuejs.org/guide/',
    'https://github.com/vuejs/core',
    'The Progressive JavaScript Framework'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    vue_id UUID;
BEGIN
    SELECT id INTO vue_id FROM libraries WHERE name = 'vue';

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        vue_id,
        'Use Composition API with script setup',
        'Vue 3 script setup is the recommended way to use Composition API in SFCs. It provides better TypeScript inference, less boilerplate, and better runtime performance.',
        'best-practice',
        'high',
        '>=3.2.0',
        E'<!-- ✅ script setup (recommended) -->\n<script setup lang="ts">\nimport { ref, computed } from "vue";\nconst count = ref(0);\nconst doubled = computed(() => count.value * 2);\n</script>\n\n<!-- ❌ Options API in Vue 3 -->\n<script>\nexport default {\n  data() { return { count: 0 } },\n  computed: { doubled() { return this.count * 2 } }\n}\n</script>',
        'https://vuejs.org/api/sfc-script-setup.html'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        vue_id,
        'Use defineModel for two-way binding in Vue 3.4+',
        'defineModel macro simplifies v-model support in components, replacing the manual prop + emit pattern.',
        'best-practice',
        'medium',
        '>=3.4.0',
        E'<!-- ✅ Vue 3.4+ defineModel -->\n<script setup>\nconst model = defineModel();\n</script>\n<template>\n  <input v-model="model" />\n</template>',
        'https://vuejs.org/api/sfc-script-setup.html#definemodel'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        vue_id,
        'Use v-memo for expensive list rendering',
        'v-memo skips re-rendering of list items when their dependencies haven''t changed. Use it for large lists with complex templates.',
        'performance',
        'low',
        '>=3.2.0',
        E'<div v-for="item in list" :key="item.id" v-memo="[item.id === selected]">\n  <ExpensiveComponent :item="item" :selected="item.id === selected" />\n</div>',
        'https://vuejs.org/api/built-in-directives.html#v-memo'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        vue_id,
        'Mutating props directly',
        'Changing prop values inside a child component instead of emitting events.',
        'Vue enforces one-way data flow. Direct prop mutation causes warnings, makes data flow hard to trace, and breaks in production.',
        'Emit events to the parent and let the parent update the value.',
        'high',
        '>=3.0.0',
        E'// ❌ Mutating props\nprops.items.push(newItem);',
        E'// ✅ Emit event\nconst emit = defineEmits(["update:items"]);\nemit("update:items", [...props.items, newItem]);',
        'https://vuejs.org/guide/components/props.html#one-way-data-flow'
    );

END $$;

-- Context Guardian - Django Seed Data

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'django',
    'pip',
    'https://docs.djangoproject.com/',
    'https://github.com/django/django',
    'The Web framework for perfectionists with deadlines'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    django_id UUID;
BEGIN
    SELECT id INTO django_id FROM libraries WHERE name = 'django';

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        django_id,
        'Use select_related and prefetch_related to avoid N+1 queries',
        'Django ORM will execute a new query for each related object access. Use select_related (foreign keys) and prefetch_related (many-to-many) to batch these.',
        'performance',
        'critical',
        '>=3.0',
        E'# ❌ N+1 queries\nfor book in Book.objects.all():\n    print(book.author.name)  # Extra query per book!\n\n# ✅ Single query with JOIN\nfor book in Book.objects.select_related("author").all():\n    print(book.author.name)  # No extra queries',
        'https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        django_id,
        'Use async views in Django 4.1+',
        'Django 4.1+ has stable async view support. Use async views for I/O-bound operations to improve concurrency.',
        'performance',
        'medium',
        '>=4.1',
        E'# ✅ Async view\nimport httpx\nfrom django.http import JsonResponse\n\nasync def weather_view(request):\n    async with httpx.AsyncClient() as client:\n        resp = await client.get("https://api.weather.com/data")\n    return JsonResponse(resp.json())',
        'https://docs.djangoproject.com/en/stable/topics/async/'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        django_id,
        'Always set CSRF_TRUSTED_ORIGINS in Django 4.0+',
        'Django 4.0 added stricter CSRF origin checking. You must set CSRF_TRUSTED_ORIGINS for cross-origin POST requests to work.',
        'security',
        'high',
        '>=4.0',
        E'# settings.py\nCSRF_TRUSTED_ORIGINS = [\n    "https://yourdomain.com",\n    "https://www.yourdomain.com",\n]',
        'https://docs.djangoproject.com/en/stable/ref/settings/#csrf-trusted-origins'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        django_id,
        'Using raw SQL instead of ORM',
        'Writing raw SQL queries when the Django ORM can express the same logic.',
        'Bypasses Django''s SQL injection protection, makes code database-dependent, and harder to maintain.',
        'Use the ORM with F(), Q(), annotate(), and aggregate() for complex queries.',
        'high',
        '>=3.0',
        E'# ❌ Raw SQL\nfrom django.db import connection\nwith connection.cursor() as cursor:\n    cursor.execute("SELECT * FROM books WHERE author_id = %s", [author_id])',
        E'# ✅ ORM\nbooks = Book.objects.filter(author_id=author_id)',
        'https://docs.djangoproject.com/en/stable/topics/db/queries/'
    );

END $$;

-- Context Guardian - Axios Seed Data

INSERT INTO libraries (name, ecosystem, official_docs_url, repository_url, description)
VALUES (
    'axios',
    'npm',
    'https://axios-http.com/docs/intro',
    'https://github.com/axios/axios',
    'Promise based HTTP client for the browser and node.js'
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    axios_id UUID;
BEGIN
    SELECT id INTO axios_id FROM libraries WHERE name = 'axios';

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        axios_id,
        'Use interceptors for auth tokens and error handling',
        'Axios interceptors let you centralize auth header injection and error handling instead of repeating logic in every request.',
        'best-practice',
        'medium',
        '>=0.19.0',
        E'// ✅ Centralized auth\naxios.interceptors.request.use(config => {\n  config.headers.Authorization = `Bearer ${getToken()}`;\n  return config;\n});\n\n// ✅ Centralized error handling\naxios.interceptors.response.use(\n  response => response,\n  error => {\n    if (error.response?.status === 401) redirectToLogin();\n    return Promise.reject(error);\n  }\n);',
        'https://axios-http.com/docs/interceptors'
    );

    INSERT INTO best_practices (library_id, title, description, category, severity, version_range, code_example, source_url)
    VALUES (
        axios_id,
        'Always set request timeouts',
        'Without timeouts, requests can hang indefinitely. Set a timeout to prevent stuck requests from blocking the UI or server.',
        'best-practice',
        'high',
        '>=0.19.0',
        E'// ✅ Set timeout\nconst client = axios.create({\n  baseURL: "https://api.example.com",\n  timeout: 10000 // 10 seconds\n});',
        'https://axios-http.com/docs/req_config'
    );

    INSERT INTO anti_patterns (library_id, pattern_name, description, why_bad, better_approach, severity, version_range, code_example_bad, code_example_good, source_url)
    VALUES (
        axios_id,
        'Not handling request cancellation',
        'Starting HTTP requests without providing a way to cancel them when the component unmounts or the user navigates away.',
        'Causes memory leaks, state updates on unmounted components, and wasted bandwidth.',
        'Use AbortController (axios 0.22+) to cancel requests on cleanup.',
        'medium',
        '>=0.22.0',
        E'// ❌ No cancellation\nuseEffect(() => {\n  axios.get("/data").then(setData);\n}, []);',
        E'// ✅ With cancellation\nuseEffect(() => {\n  const controller = new AbortController();\n  axios.get("/data", { signal: controller.signal }).then(setData);\n  return () => controller.abort();\n}, []);',
        'https://axios-http.com/docs/cancellation'
    );

END $$;
